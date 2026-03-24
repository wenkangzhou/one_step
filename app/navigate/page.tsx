'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider } from '@/components/i18n-provider';
import { MapContainer } from '@/components/map/map-container';
import { NavigationPanel } from '@/components/navigation/nav-panel';
import { useSearchStore, useNavigationStore } from '@/lib/store';

function NavigateContent() {
  const router = useRouter();
  const { selectedRoute } = useSearchStore();
  const { isNavigating, startNavigation } = useNavigationStore();

  // 如果没有选择路线，返回首页
  useEffect(() => {
    if (!selectedRoute) {
      router.push('/');
      return;
    }

    // 自动开始导航
    if (!isNavigating) {
      startNavigation();
    }
  }, [selectedRoute, isNavigating, startNavigation, router]);

  if (!selectedRoute) {
    return null;
  }

  return (
    <div className="fixed inset-0">
      {/* 地图层 */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          showRoute
          routePath={selectedRoute.path}
          interactive={true}
        />
      </div>

      {/* 导航面板层 - 更高层级覆盖地图 */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        <div className="pointer-events-auto h-full">
          <NavigationPanel />
        </div>
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <I18nProvider>
      <NavigateContent />
    </I18nProvider>
  );
}
