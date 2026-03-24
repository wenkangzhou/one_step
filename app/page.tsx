'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import { I18nProvider } from '@/components/i18n-provider';
import { MapContainer } from '@/components/map/map-container';
import { RouteCard } from '@/components/route/route-card';
import { RouteDetail } from '@/components/route/route-detail';
import { getAllRoutes } from '@/lib/data/routes';
import { useSearchStore } from '@/lib/store';
import { Mountain, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Route } from '@/lib/store';

function HomeContent() {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const { setResults, selectRoute, selectedRoute } = useSearchStore();

  // 加载预设路线
  useEffect(() => {
    const allRoutes = getAllRoutes();
    setRoutes(allRoutes);
    setFilteredRoutes(allRoutes);
    setResults(allRoutes);
  }, [setResults]);

  // 搜索过滤
  useEffect(() => {
    let filtered = routes;

    // 按名称搜索
    if (searchQuery) {
      filtered = filtered.filter(
        route =>
          route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.startName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.endName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 按难度筛选
    if (selectedDifficulty) {
      filtered = filtered.filter(route => route.difficulty === selectedDifficulty);
    }

    setFilteredRoutes(filtered);
  }, [searchQuery, selectedDifficulty, routes]);

  const difficultyOptions = [
    { value: 'easy', label: '简单', color: 'bg-green-100 text-green-700' },
    { value: 'moderate', label: '中等', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'hard', label: '困难', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* 搜索栏 */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b bg-background shadow-sm z-10">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索路线名称、地点..."
              className="pl-10"
            />
          </div>
        </div>

        {/* 难度筛选 */}
        <div className="flex items-center gap-2 mt-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedDifficulty === null
                  ? 'bg-forest-100 text-forest-700'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              全部
            </button>
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedDifficulty(selectedDifficulty === option.value ? null : option.value)
                }
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedDifficulty === option.value
                    ? option.color
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 路线列表 */}
        <div className="lg:w-[420px] lg:border-r bg-background overflow-y-auto order-2 lg:order-1">
          <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {filteredRoutes.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    共 {filteredRoutes.length} 条路线
                  </h2>
                </div>
                {filteredRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onClick={() => selectRoute(route)}
                    isSelected={selectedRoute?.id === route.id}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Mountain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">没有找到路线</h3>
                <p className="text-sm text-muted-foreground">试试其他搜索关键词</p>
              </div>
            )}
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 relative order-1 lg:order-2 min-h-[40vh] lg:min-h-0">
          <MapContainer
            showRoute={!!selectedRoute}
            routePath={selectedRoute?.path}
            photos={selectedRoute?.photos}
            interactive
          />
        </div>
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
