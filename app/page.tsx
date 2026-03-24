'use client';

import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import { I18nProvider } from '@/components/i18n-provider';
import { MapContainer } from '@/components/map/map-container';
import { SearchBox } from '@/components/map/search-box';
import { RouteCard } from '@/components/route/route-card';
import { RouteDetail } from '@/components/route/route-detail';
import { useSearchStore } from '@/lib/store';
import { Mountain, MapPin, Navigation } from 'lucide-react';

function HomeContent() {
  const { t } = useTranslation();
  const { results, isLoading } = useSearchStore();

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      {/* 搜索栏 */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b bg-background shadow-sm z-10">
        <SearchBox />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 路线列表 - 移动端在下方，桌面端在左侧 */}
        <div className="lg:w-[420px] lg:border-r bg-background overflow-y-auto order-2 lg:order-1">
          <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">搜索路线中...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    找到 {results.length} 条路线
                  </h2>
                </div>
                {results.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-100 flex items-center justify-center">
                  <Mountain className="h-8 w-8 text-forest-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">开始探索徒步路线</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  输入起点和终点，发现适合你的徒步路线
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>选择起点</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    <span>规划路线</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mountain className="h-3 w-3" />
                    <span>开始徒步</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 relative order-1 lg:order-2 min-h-[40vh] lg:min-h-0">
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
