'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import { I18nProvider } from '@/components/i18n-provider';
import { MapContainer } from '@/components/map/map-container';
import { SearchBox } from '@/components/map/search-box';
import { RouteCard } from '@/components/route/route-card';
import { RouteDetail } from '@/components/route/route-detail';
import { useSearchStore } from '@/lib/store';
import type { Route } from '@/lib/store';

function HomeContent() {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const { results, setResults, selectRoute } = useSearchStore();

  // 搜索路线
  const searchRoutes = useCallback(async (startName: string, endName: string) => {
    if (!window.AMap) return;

    setIsSearching(true);
    
    try {
      const walking = new window.AMap.Walking({});
      
      walking.search(
        [{ keyword: startName }, { keyword: endName }],
        (status: string, result: any) => {
          setIsSearching(false);
          
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            
            // 提取路径点
            const path: Array<[number, number]> = [];
            route.steps.forEach((step: any) => {
              const points = step.path || [];
              points.forEach((point: any) => {
                path.push([point.lng, point.lat]);
              });
            });

            const newRoute: Route = {
              id: `route-${Date.now()}`,
              name: `${startName} → ${endName}`,
              startName,
              endName,
              distance: route.distance,
              duration: route.time,
              difficulty: route.distance > 10000 ? 'hard' : route.distance > 5000 ? 'moderate' : 'easy',
              type: 'oneWay',
              path,
              elevation: Math.floor(Math.random() * 200) + 50,
            };

            setResults([newRoute]);
          } else {
            setResults([]);
          }
        }
      );
    } catch (error) {
      console.error('搜索路线失败:', error);
      setIsSearching(false);
    }
  }, [setResults]);

  // 默认搜索示例路线
  useEffect(() => {
    // 延迟加载，等待地图 SDK 加载完成
    const timer = setTimeout(() => {
      if (window.AMap && results.length === 0) {
        searchRoutes('奥林匹克森林公园', '香山公园');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchRoutes, results.length]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      {/* 搜索栏 */}
      <div className="p-4 border-b bg-background">
        <SearchBox />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 路线列表 - 移动端在下方，桌面端在左侧 */}
        <div className="lg:w-96 lg:border-r bg-background overflow-y-auto order-2 lg:order-1">
          <div className="p-4 space-y-3">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              </div>
            ) : results.length > 0 ? (
              results.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => selectRoute(route)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('search.noResults')}
              </div>
            )}
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 relative order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
          <MapContainer
            showRoute={results.length > 0}
            routePath={results[0]?.path}
            interactive
          />
        </div>
      </div>

      {/* 路线详情抽屉 */}
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
