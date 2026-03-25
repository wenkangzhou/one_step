'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationStore, useSearchStore } from '@/lib/store';
import { MapContainer } from '@/components/map/map-container';
import { NavigationPanel } from '@/components/navigation/nav-panel';

function NavigateContent() {
  const router = useRouter();
  const { selectedRoute } = useSearchStore();
  const { 
    startNavigation, 
    stopNavigation, 
    updateLocation,
    followMode 
  } = useNavigationStore();
  const hasStarted = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  // 开始导航
  useEffect(() => {
    if (!selectedRoute) {
      router.push('/');
      return;
    }

    if (!hasStarted.current) {
      hasStarted.current = true;
      startNavigation();
    }
  }, [selectedRoute, router, startNavigation]);

  // 定位追踪
  useEffect(() => {
    if (!hasStarted.current) return;

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords;
          updateLocation([longitude, latitude], heading ?? null);
        },
        (error) => {
          // 静默处理定位错误，不在控制台显示
          // 定位失败时保持上一次位置或使用默认值
        },
        {
          enableHighAccuracy: false, // 降低精度要求提高成功率
          timeout: 15000,
          maximumAge: 30000, // 允许使用30秒内的缓存位置
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateLocation]);

  // 清理
  useEffect(() => {
    return () => {
      stopNavigation();
    };
  }, [stopNavigation]);

  if (!selectedRoute) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* 地图层 - 导航模式下 */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          routes={selectedRoute.path.length > 0 ? [selectedRoute] : []}
          selectedRouteId={selectedRoute.id}
          interactive={true}
          isNavigationMode={true}
        />
      </div>
      
      {/* 导航UI层 */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        <NavigationPanel />
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return <NavigateContent />;
}
