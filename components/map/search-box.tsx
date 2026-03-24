'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/lib/store';
import { debounce } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: [number, number];
}

export function SearchBox() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const {
    query,
    setQuery,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  // 搜索 POI
  const searchPOI = useCallback(
    debounce(async (keyword: string) => {
      if (!keyword.trim() || !window.AMap) {
        setResults([]);
        return;
      }

      const placeSearch = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        type: '风景名胜|公园广场|运动场所',
      });

      placeSearch.search(keyword, (status: string, result: any) => {
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
    searchPOI(query);
  }, [query, searchPOI]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    addRecentSearch(result.name);
    setIsOpen(false);
    
    // 更新地图中心
    if (window.AMap && result.location) {
      // 这里可以触发全局事件或直接操作地图
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('search.placeholder')}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
            {/* 搜索结果 */}
            {results.length > 0 && (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent text-left"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-forest-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.address}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 最近搜索 */}
            {!query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('search.recentSearches')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                  >
                    {t('search.clear')}
                  </Button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 空状态 */}
            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                {t('search.noResults')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
