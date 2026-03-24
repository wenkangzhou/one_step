'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Footprints, TrendingUp, Navigation, X, Camera, Mountain, Route } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useSearchStore, useNavigationStore } from '@/lib/store';
import { ElevationChart } from '@/components/charts/elevation-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RouteDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedRoute, selectRoute } = useSearchStore();
  const { startNavigation } = useNavigationStore();

  const route = selectedRoute;
  if (!route) return null;

  const difficultyColor = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  }[route.difficulty];

  const difficultyLabel = {
    easy: '简单',
    moderate: '中等',
    hard: '困难',
  }[route.difficulty];

  const typeLabel = {
    loop: '环线',
    oneWay: '单程',
    outAndBack: '往返',
  }[route.type];

  const handleNavigate = () => {
    startNavigation();
    router.push('/navigate/');
  };

  return (
    <Sheet open={!!route} onOpenChange={() => selectRoute(null)}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto pb-safe">
        {/* 头部信息 */}
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight pr-8">{route.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor}`}>
                  {difficultyLabel}
                </span>
                <span className="text-xs text-muted-foreground">{typeLabel}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* 统计数据 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-muted rounded-xl">
            <Footprints className="h-5 w-5 mx-auto mb-1 text-forest-500" />
            <p className="text-lg font-bold">{formatDistance(route.distance)}</p>
            <p className="text-[10px] text-muted-foreground">距离</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <Clock className="h-5 w-5 mx-auto mb-1 text-sunrise-500" />
            <p className="text-lg font-bold">{formatDuration(route.duration)}</p>
            <p className="text-[10px] text-muted-foreground">用时</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{route.elevation}m</p>
            <p className="text-[10px] text-muted-foreground">爬升</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <Mountain className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold">{(route.distance / 1000).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">公里</p>
          </div>
        </div>

        {/* 起终点信息 */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">起点</span>
            </div>
            <p className="text-sm text-muted-foreground pl-5">{route.startName}</p>
          </div>
          {route.type !== 'loop' && (
            <>
              <div className="text-muted-foreground">
                <Route className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">终点</span>
                </div>
                <p className="text-sm text-muted-foreground pl-5">{route.endName}</p>
              </div>
            </>
          )}
        </div>

        {/* Tab 切换 */}
        <Tabs defaultValue="elevation" className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="elevation" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              海拔
            </TabsTrigger>
            {route.photos && route.photos.length > 0 && (
              <TabsTrigger value="photos" className="flex-1">
                <Camera className="h-4 w-4 mr-1" />
                照片 ({route.photos.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="elevation" className="mt-4">
            {route.elevationData ? (
              <ElevationChart data={route.elevationData} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无海拔数据</p>
              </div>
            )}
          </TabsContent>

          {route.photos && route.photos.length > 0 && (
            <TabsContent value="photos" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {route.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-muted rounded-lg flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{photo.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* 开始导航按钮 */}
        <Button
          onClick={handleNavigate}
          className="w-full h-12 text-base bg-forest-600 hover:bg-forest-700 shadow-lg"
        >
          <Navigation className="h-5 w-5 mr-2" />
          开始导航
        </Button>
      </SheetContent>
    </Sheet>
  );
}
