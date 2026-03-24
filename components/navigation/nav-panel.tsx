'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Navigation, MapPin, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useNavigationStore, useSearchStore, useMapStore } from '@/lib/store';

export function NavigationPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedRoute } = useSearchStore();
  const {
    isNavigating,
    currentLocation,
    remainingDistance,
    remainingDuration,
    followMode,
    stopNavigation,
    updateLocation,
    updateProgress,
    toggleFollowMode,
  } = useNavigationStore();

  const watchIdRef = useRef<number | null>(null);
  const route = selectedRoute;

  // 开始定位追踪
  useEffect(() => {
    if (!isNavigating || !route) return;

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation([longitude, latitude]);
          
          // 计算剩余距离（简化计算，实际应该使用路线上的最近点）
          if (route.path && route.path.length > 0) {
            const endPoint = route.path[route.path.length - 1];
            const dist = calculateDistance(
              latitude,
              longitude,
              endPoint[1],
              endPoint[0]
            );
            // 估算剩余时间（假设平均速度 4km/h）
            const duration = (dist / 4) * 3600;
            updateProgress(dist, duration);
          }
        },
        (error) => {
          console.error('定位错误:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isNavigating, route, updateLocation, updateProgress]);

  // 计算两点间距离（Haversine公式）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // 返回米
  };

  const handleExit = useCallback(() => {
    stopNavigation();
    router.push('/');
  }, [stopNavigation, router]);

  if (!route) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 顶部导航栏 */}
      <div className="absolute top-0 left-0 right-0 z-[110] bg-gradient-to-b from-black/60 to-transparent p-4 pt-safe">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="h-10 w-10 rounded-full bg-white/90 dark:bg-black/50 hover:bg-white text-foreground shadow-lg"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold text-lg drop-shadow-lg">
            {t('navigation.title')}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFollowMode}
            className={`h-10 w-10 rounded-full shadow-lg ${
              followMode
                ? 'bg-forest-500 text-white'
                : 'bg-white/90 dark:bg-black/50 text-foreground'
            } hover:opacity-90`}
          >
            <Target className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 底部导航信息面板 */}
      <div className="absolute bottom-0 left-0 right-0 z-[110] bg-background/95 backdrop-blur-sm border-t rounded-t-2xl p-4 sm:p-6 pb-safe">
        <div className="max-w-md mx-auto">
          {/* 目的地信息 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-forest-100 dark:bg-forest-900 flex items-center justify-center shrink-0">
              <Navigation className="h-5 w-5 text-forest-600 dark:text-forest-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{t('route.end')}</p>
              <p className="font-semibold truncate">{route.endName}</p>
            </div>
          </div>

          {/* 距离和时间 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div className="bg-muted rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-forest-600 dark:text-forest-400">
                {formatDistance(remainingDistance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('navigation.remainingDistance')}
              </p>
            </div>
            <div className="bg-muted rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-sunrise-600 dark:text-sunrise-400">
                {formatDuration(remainingDuration)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('navigation.remainingTime')}
              </p>
            </div>
          </div>

          {/* 退出导航按钮 */}
          <Button
            onClick={handleExit}
            variant="outline"
            className="w-full h-12 shadow-sm"
          >
            <X className="h-5 w-5 mr-2" />
            {t('navigation.exit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
