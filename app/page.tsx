'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import { I18nProvider } from '@/components/i18n-provider';
import { MapContainer } from '@/components/map/map-container';
import { RouteDetail } from '@/components/route/route-detail';
import { getAllRoutes } from '@/lib/data/routes';
import { useSearchStore, useNavigationStore, useMapStore } from '@/lib/store';
import { Search, SlidersHorizontal, Loader2, Mountain, Navigation, Triangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Route, ElevationPoint } from '@/lib/store';
import { cn } from '@/lib/utils';

// 模拟海拔数据生成
function generateElevationData(distance: number, elevation: number): ElevationPoint[] {
  const points: ElevationPoint[] = [];
  const segments = 20;
  const segmentDistance = distance / segments;
  
  for (let i = 0; i <= segments; i++) {
    const d = i * segmentDistance;
    const progress = i / segments;
    const elevationGain = Math.sin(progress * Math.PI) * elevation;
    points.push({
      distance: d,
      elevation: Math.round(100 + elevationGain),
    });
  }
  return points;
}

function HomeContent() {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const { setResults, selectRoute, selectedRoute } = useSearchStore();
  const { updateLocation } = useNavigationStore();
  const { setCenter } = useMapStore();
  const watchIdRef = useRef<number | null>(null);

  // 加载路线 - 只执行一次
  useEffect(() => {
    const loadRoutes = async () => {
      const routeData = getAllRoutes();
      
      const mockRoutes: Route[] = routeData.map(r => {
        const start = r.startLocation!;
        const end = r.endLocation!;
        const path: Array<[number, number]> = [start];
        
        const steps = 8;
        // 使用基于 route id 的固定种子，确保每次生成的路径相同
        const seed = r.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const pseudoRandom = (i: number) => {
          const x = Math.sin(seed + i) * 10000;
          return x - Math.floor(x);
        };
        
        for (let i = 1; i < steps; i++) {
          const ratio = i / steps;
          // 使用伪随机数，相同 route id 生成相同路径
          const offsetX = (pseudoRandom(i) - 0.5) * 0.008;
          const offsetY = (pseudoRandom(i + 100) - 0.5) * 0.008;
          path.push([
            start[0] + (end[0] - start[0]) * ratio + offsetX,
            start[1] + (end[1] - start[1]) * ratio + offsetY,
          ]);
        }
        path.push(end);
        
        return {
          ...r,
          path,
          elevationData: generateElevationData(r.distance, r.elevation),
        };
      });
      
      setRoutes(mockRoutes);
      setFilteredRoutes(mockRoutes);
      setResults(mockRoutes);
      setIsLoadingRoutes(false);
    };

    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只执行一次

  // 定位追踪（主页也显示当前位置）
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords;
          updateLocation([longitude, latitude], heading ?? null);
        },
        () => {
          // 定位失败静默处理
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateLocation]);

  // 搜索过滤
  useEffect(() => {
    let filtered = routes;

    if (searchQuery) {
      filtered = filtered.filter(
        route =>
          route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (route.startName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (route.endName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(route => route.difficulty === selectedDifficulty);
    }

    setFilteredRoutes(filtered);
  }, [searchQuery, selectedDifficulty, routes]);

  // 点击路线 - 显示详情
  const handleRouteClick = useCallback((route: Route) => {
    selectRoute(route);
  }, [selectRoute]);

  // 点击图例 - 只定位不显示详情
  const handleLegendClick = useCallback((route: Route) => {
    if (route.path && route.path.length > 0) {
      // 定位到路线中点
      const midIndex = Math.floor(route.path.length / 2);
      const [lng, lat] = route.path[midIndex];
      setCenter([lng, lat]);
    }
  }, [setCenter]);

  const difficultyOptions = [
    { value: 'easy', label: '简单', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'medium', label: '中等', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'hard', label: '困难', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* 顶部控制栏 - 悬浮在地图上 */}
      <div className="absolute top-16 left-0 right-0 z-10 px-4 py-3">
        <div className="max-w-md mx-auto space-y-3">
          {/* 搜索框 */}
          <div className="relative shadow-lg rounded-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索路线名称、起点或终点..."
              className="pl-10 h-11 bg-white/95 backdrop-blur-sm border-0 shadow-sm"
            />
          </div>

          {/* 难度筛选 */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full transition-all shadow-sm border',
                selectedDifficulty === null
                  ? 'bg-forest-500 text-white border-forest-500'
                  : 'bg-white/90 text-foreground border-gray-200 hover:bg-white'
              )}
            >
              全部
            </button>
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedDifficulty(selectedDifficulty === option.value ? null : option.value)
                }
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-all shadow-sm border',
                  selectedDifficulty === option.value
                    ? option.color
                    : 'bg-white/90 text-foreground border-gray-200 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 路线数量提示 */}
          {!isLoadingRoutes && (
            <div className="text-center">
              <span className="text-xs text-white/90 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                显示 {filteredRoutes.length} 条路线
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 全屏地图 */}
      <div className="relative flex-1 w-full">
        {isLoadingRoutes ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>加载路线中...</span>
            </div>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <MapContainer
            routes={filteredRoutes.filter(r => r.path.length > 0)}
            selectedRouteId={selectedRoute?.id}
            interactive
            onRouteClick={handleRouteClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                <Mountain className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">没有找到路线</h3>
              <p className="text-sm text-muted-foreground">试试其他搜索关键词</p>
            </div>
          </div>
        )}

        {/* 左下角图例 */}
        {!isLoadingRoutes && filteredRoutes.length > 0 && (
          <div className="absolute bottom-6 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-[200px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">点击定位到路线</p>
            <div className="space-y-1.5">
              {filteredRoutes.slice(0, 4).map((route, index) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                return (
                  <div 
                    key={route.id} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-black/5 p-1 rounded"
                    onClick={() => handleLegendClick(route)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-xs truncate">{route.name}</span>
                  </div>
                );
              })}
              {filteredRoutes.length > 4 && (
                <p className="text-xs text-muted-foreground pl-5">
                  还有 {filteredRoutes.length - 4} 条...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 路线详情弹层 */}
      <RouteDetail />
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
