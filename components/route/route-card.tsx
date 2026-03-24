'use client';

import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Footprints, TrendingUp, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useSearchStore, useNavigationStore } from '@/lib/store';
import type { Route } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface RouteCardProps {
  route: Route;
  onClick?: () => void;
  isSelected?: boolean;
}

export function RouteCard({ route, onClick, isSelected }: RouteCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectRoute } = useSearchStore();
  const { startNavigation } = useNavigationStore();

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

  const handleStartNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectRoute(route);
    startNavigation();
    router.push('/navigate/');
  };

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-forest-500 shadow-lg' : ''
      }`}
    >
      <CardContent className="p-4">
        {/* 路线名称和难度 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{route.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {route.startName} → {route.endName}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${difficultyColor}`}>
            {difficultyLabel}
          </span>
        </div>

        {/* 路线统计 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <Footprints className="h-4 w-4 mx-auto mb-1 text-forest-500" />
            <p className="text-sm font-semibold">{formatDistance(route.distance)}</p>
            <p className="text-[10px] text-muted-foreground">距离</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-sunrise-500" />
            <p className="text-sm font-semibold">{formatDuration(route.duration)}</p>
            <p className="text-[10px] text-muted-foreground">预计时间</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-sm font-semibold">{route.elevation}m</p>
            <p className="text-[10px] text-muted-foreground">爬升</p>
          </div>
        </div>

        {/* 起点终点信息 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-forest-500 shrink-0" />
            <span className="text-muted-foreground truncate">{route.startName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-sunrise-500 shrink-0" />
            <span className="text-muted-foreground truncate">{route.endName}</span>
          </div>
        </div>

        {/* 开始导航按钮 */}
        <Button
          onClick={handleStartNavigate}
          className="w-full h-10 bg-forest-600 hover:bg-forest-700"
        >
          <Navigation className="h-4 w-4 mr-2" />
          开始导航
        </Button>
      </CardContent>
    </Card>
  );
}
