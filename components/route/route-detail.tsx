'use client';

import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Clock, Triangle, TrendingUp, TrendingDown, Camera, ChevronRight, Compass, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchStore, useNavigationStore, useMapStore } from '@/lib/store';
import { ElevationChart } from '@/components/chart/elevation-chart';
import { formatDuration } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function RouteDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedRoute, selectRoute } = useSearchStore();
  const { isNavigating, startNavigation } = useNavigationStore();
  const { setZoom } = useMapStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!selectedRoute);
  }, [selectedRoute]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => selectRoute(null), 300);
  };

  const handleStartNavigation = () => {
    if (!selectedRoute) return;
    
    // 设置导航级别缩放（100m标尺约16-17级）
    setZoom(16);
    startNavigation();
    setOpen(false);
    
    // 延迟跳转，等弹层关闭动画完成
    setTimeout(() => {
      router.push('/navigate');
    }, 300);
  };

  const difficultyMap = {
    easy: { label: '简单', color: 'bg-green-100 text-green-700' },
    medium: { label: '中等', color: 'bg-yellow-100 text-yellow-700' },
    hard: { label: '困难', color: 'bg-red-100 text-red-700' },
  };

  const typeMap = {
    loop: '环线',
    oneWay: '单程',
    outAndBack: '往返',
  };

  if (!selectedRoute) return null;

  const difficulty = difficultyMap[selectedRoute.difficulty];
  const typeLabel = selectedRoute.type ? typeMap[selectedRoute.type] : '环线';

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[650px] flex flex-col p-0">
        {/* 头部 - 固定 */}
        <SheetHeader className="text-left px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between pr-10">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">{selectedRoute.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{selectedRoute.startName}</span>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span>{selectedRoute.endName}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficulty.color}`}>
                {difficulty.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {typeLabel}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="elevation">海拔</TabsTrigger>
              <TabsTrigger value="photos">拍照点 ({selectedRoute.photos?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* 统计卡片 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Navigation className="h-5 w-5 mx-auto mb-1 text-forest-500" />
                  <p className="text-xs text-muted-foreground">距离</p>
                  <p className="font-semibold">{(selectedRoute.distance / 1000).toFixed(1)} km</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-forest-500" />
                  <p className="text-xs text-muted-foreground">预计用时</p>
                  <p className="font-semibold">{formatDuration(selectedRoute.duration)}</p>
                </div>
              </div>

              {/* 爬升下降统计 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-green-600">累计爬升</p>
                  <p className="font-semibold text-green-700">{selectedRoute.elevation} m</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
                  <TrendingDown className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-orange-600">累计下降</p>
                  <p className="font-semibold text-orange-700">~{Math.round(selectedRoute.elevation * 0.8)} m</p>
                </div>
              </div>

              {/* 起点终点 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold shrink-0">
                    起
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">起点</p>
                    <p className="font-medium">{selectedRoute.startName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm font-bold shrink-0">
                    终
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">终点</p>
                    <p className="font-medium">{selectedRoute.endName}</p>
                  </div>
                </div>
              </div>

              {/* 途经点 */}
              {selectedRoute.waypoints && selectedRoute.waypoints.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">途经点</h4>
                  <div className="space-y-2">
                    {selectedRoute.waypoints.map((wp, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-muted rounded">
                        <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{wp.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="elevation" className="mt-4">
              {selectedRoute.elevationData ? (
                <ElevationChart data={selectedRoute.elevationData} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Triangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无海拔数据</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              {selectedRoute.photos && selectedRoute.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedRoute.photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      {/* 占位图背景 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                            <Camera className="h-6 w-6" />
                          </div>
                          <span className="text-xs">{photo.description}</span>
                        </div>
                      </div>
                      {/* 尝试加载图片（如果有的话） */}
                      <img
                        src={photo.url}
                        alt={photo.description}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {/* 底部文字 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white truncate">{photo.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无拍照点数据</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* 底部留白，给固定按钮留出空间 */}
          <div className="h-24" />
        </div>

        {/* 开始导航按钮 - 固定在底部 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <Button
            className="w-full h-12 text-lg bg-forest-500 hover:bg-forest-600"
            onClick={handleStartNavigation}
            disabled={isNavigating}
          >
            <Compass className="h-5 w-5 mr-2" />
            {isNavigating ? '导航中' : '开始导航'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
