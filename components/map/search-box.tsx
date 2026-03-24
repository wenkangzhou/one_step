'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, MapPin, ArrowRight, Navigation, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/lib/store';
import { debounce } from '@/lib/utils';
import type { Route } from '@/lib/store';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: [number, number];
}

export function SearchBox() {
  const { t } = useTranslation();
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setResults: setRouteResults, addRecentSearch } = useSearchStore();

  // 搜索 POI
  const searchPOI = useCallback(
    debounce(async (keyword: string) => {
      if (!keyword.trim() || !window.AMap) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const placeSearch = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        type: '风景名胜|公园广场|运动场所|旅游景点',
      });

      placeSearch.search(keyword, (status: string, result: any) => {
        setIsLoading(false);
        if (status === 'complete' && result.info === 'OK') {
          const pois = result.poiList?.pois || [];
          setResults(
            pois.map((poi: any) => ({
              id: poi.id,
              name: poi.name,
              address: poi.address,
              location: [poi.location.lng, poi.location.lat],
            }))
          );
        } else {
          setResults([]);
        }
      });
    }, 300),
    []
  );

  useEffect(() => {
    if (activeField === 'start') {
      searchPOI(startQuery);
    } else if (activeField === 'end') {
      searchPOI(endQuery);
    }
  }, [startQuery, endQuery, activeField, searchPOI]);

  // 规划路线
  const planRoute = useCallback((start: SearchResult, end: SearchResult) => {
    if (!window.AMap) return;

    const walking = new window.AMap.Walking({
      map: null,
      hideMarkers: true,
    });

    const startLngLat = new window.AMap.LngLat(start.location[0], start.location[1]);
    const endLngLat = new window.AMap.LngLat(end.location[0], end.location[1]);

    walking.search(startLngLat, endLngLat, (status: string, result: any) => {
      if (status === 'complete' && result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        
        // 提取路径点
        const path: Array<[number, number]> = [];
        if (route.steps) {
          route.steps.forEach((step: any) => {
            if (step.path) {
              // 解析路径字符串
              const points = step.path.split(';');
              points.forEach((point: string) => {
                const [lng, lat] = point.split(',').map(Number);
                if (!isNaN(lng) && !isNaN(lat)) {
                  path.push([lng, lat]);
                }
              });
            }
          });
        }

        // 如果路径为空，使用起点和终点
        if (path.length === 0) {
          path.push(start.location, end.location);
        }

        const newRoute: Route = {
          id: `route-${Date.now()}`,
          name: `${start.name} → ${end.name}`,
          startName: start.name,
          endName: end.name,
          distance: route.distance || Math.round(startLngLat.distance(endLngLat)),
          duration: route.time || Math.round(startLngLat.distance(endLngLat) / 1.4),
          difficulty: (route.distance || 0) > 10000 ? 'hard' : (route.distance || 0) > 5000 ? 'moderate' : 'easy',
          type: 'oneWay',
          path,
          elevation: Math.floor(Math.random() * 150) + 30,
        };

        setRouteResults([newRoute]);
        addRecentSearch(`${start.name} → ${end.name}`);
      }
    });
  }, [setRouteResults, addRecentSearch]);

  const [selectedStart, setSelectedStart] = useState<SearchResult | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<SearchResult | null>(null);

  const handleSelectResult = (result: SearchResult) => {
    if (activeField === 'start') {
      setStartQuery(result.name);
      setSelectedStart(result);
      setActiveField('end');
    } else if (activeField === 'end') {
      setEndQuery(result.name);
      setSelectedEnd(result);
      setActiveField(null);
      // 自动规划路线
      if (selectedStart) {
        planRoute(selectedStart, result);
      }
    }
    setResults([]);
  };

  const handleSwap = () => {
    const temp = startQuery;
    setStartQuery(endQuery);
    setEndQuery(temp);
    const tempStart = selectedStart;
    setSelectedStart(selectedEnd);
    setSelectedEnd(tempStart);
  };

  const handleSearch = () => {
    if (selectedStart && selectedEnd) {
      planRoute(selectedStart, selectedEnd);
    }
  };

  const isSearchReady = selectedStart && selectedEnd;

  return (
    <div className="relative">
      {/* 起点终点输入框 */}
      <div className="bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
            {/* 起点 */}
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-500" />
              <Input
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  setSelectedStart(null);
                  setActiveField('start');
                }}
                onFocus={() => setActiveField('start')}
                placeholder="输入起点..."
                className="pl-10 pr-8 h-10"
              />
              {startQuery && (
                <button
                  onClick={() => { setStartQuery(''); setSelectedStart(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* 终点 */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sunrise-500" />
              <Input
                value={endQuery}
                onChange={(e) => {
                  setEndQuery(e.target.value);
                  setSelectedEnd(null);
                  setActiveField('end');
                }}
                onFocus={() => setActiveField('end')}
                placeholder="输入终点..."
                className="pl-10 pr-8 h-10"
              />
              {endQuery && (
                <button
                  onClick={() => { setEndQuery(''); setSelectedEnd(null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* 交换按钮 */}
          <button
            onClick={handleSwap}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </button>

          {/* 搜索按钮 */}
          <Button
            onClick={handleSearch}
            disabled={!isSearchReady}
            className="h-20 w-12 bg-forest-600 hover:bg-forest-700 disabled:opacity-50"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* 快捷标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['奥林匹克森林公园', '香山公园', '颐和园', '故宫', '天坛'].map((spot) => (
            <button
              key={spot}
              onClick={() => {
                if (!selectedStart) {
                  setStartQuery(spot);
                  setActiveField('start');
                } else {
                  setEndQuery(spot);
                  setActiveField('end');
                }
              }}
              className="px-3 py-1 text-xs bg-muted rounded-full whitespace-nowrap hover:bg-muted/80"
            >
              {spot}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {activeField && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
          <div className="py-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent text-left"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.address}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-forest-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">搜索中...</p>
        </div>
      )}
    </div>
  );
}
