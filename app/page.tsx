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

  // 搜索路线 (兼容高德地图 1.4.15)
  const searchRoutes = useCallback(async (startName: string, endName: string) => {
    if (!window.AMap) return;

    setIsSearching(true);
    
    try {
      // 先搜索起点和终点的坐标
      const placeSearch = new window.AMap.PlaceSearch({
        pageSize: 1,
        pageIndex: 1,
      });

      // 搜索起点
      placeSearch.search(startName, (status: string, result: any) => {
        if (status !== 'complete' || !result.poiList || !result.poiList.pois[0]) {
          setIsSearching(false);
          setResults([]);
          return;
        }

        const startPoi = result.poiList.pois[0];
        const startLngLat = new window.AMap.LngLat(startPoi.location.lng, startPoi.location.lat);

        // 搜索终点
        placeSearch.search(endName, (status2: string, result2: any) => {
          if (status2 !== 'complete' || !result2.poiList || !result2.poiList.pois[0]) {
            setIsSearching(false);
            setResults([]);
            return;
          }

          const endPoi = result2.poiList.pois[0];
          const endLngLat = new window.AMap.LngLat(endPoi.location.lng, endPoi.location.lat);

          // 使用 Walking 进行路线规划
          const walking = new window.AMap.Walking({
            map: null, // 不自动显示在地图上
            hideMarkers: true, // 隐藏默认标记
          });

          walking.search(startLngLat, endLngLat, (walkStatus: string, walkResult: any) => {
            setIsSearching(false);
            
            if (walkStatus === 'complete' && walkResult.routes && walkResult.routes.length > 0) {
              const route = walkResult.routes[0];
              
              // 提取路径点 (1.4.15 版本数据结构)
              const path: Array<[number, number]> = [];
              if (route.steps && Array.isArray(route.steps)) {
                route.steps.forEach((step: any) => {
                  // 1.4.15 版本的 path 可能是字符串或数组
                  if (step.path) {
                    if (typeof step.path === 'string') {
                      // 如果是字符串，解析坐标点
                      const points = step.path.split(';');
                      points.forEach((point: string) => {
                        const [lng, lat] = point.split(',').map(Number);
                        if (!isNaN(lng) && !isNaN(lat)) {
                          path.push([lng, lat]);
                        }
                      });
                    } else if (Array.isArray(step.path)) {
                      step.path.forEach((point: any) => {
                        if (point.lng && point.lat) {
                          path.push([point.lng, point.lat]);
                        }
                      });
                    }
                  }
                });
              }

              // 如果路径为空，添加起点和终点
              if (path.length === 0) {
                path.push([startPoi.location.lng, startPoi.location.lat]);
                path.push([endPoi.location.lng, endPoi.location.lat]);
              }

              const newRoute: Route = {
                id: `route-${Date.now()}`,
                name: `${startName} → ${endName}`,
                startName,
                endName,
                distance: route.distance || 0,
                duration: route.time || 0,
                difficulty: (route.distance || 0) > 10000 ? 'hard' : (route.distance || 0) > 5000 ? 'moderate' : 'easy',
                type: 'oneWay',
                path,
                elevation: Math.floor(Math.random() * 200) + 50,
              };

              setResults([newRoute]);
            } else {
              // 路线规划失败，创建直线路径
              const path: Array<[number, number]> = [
                [startPoi.location.lng, startPoi.location.lat],
                [endPoi.location.lng, endPoi.location.lat],
              ];
              
              const newRoute: Route = {
                id: `route-${Date.now()}`,
                name: `${startName} → ${endName}`,
                startName,
                endName,
                distance: 0,
                duration: 0,
                difficulty: 'moderate',
                type: 'oneWay',
                path,
                elevation: Math.floor(Math.random() * 200) + 50,
              };

              setResults([newRoute]);
            }
          });
        });
      });
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
