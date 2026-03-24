'use client';

import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Footprints, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistance, formatDuration } from '@/lib/utils';
import type { Route } from '@/lib/store';

interface RouteCardProps {
  route: Route;
  onClick?: () => void;
  isSelected?: boolean;
}

export function RouteCard({ route, onClick, isSelected }: RouteCardProps) {
  const { t } = useTranslation();

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
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{route.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {route.startName} {route.type !== 'loop' && `→ ${route.endName}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${difficultyColor}`}>
              {difficultyLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
          </div>
        </div>

        {/* 路线统计 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Footprints className="h-3.5 w-3.5 text-forest-500" />
            <span className="text-sm font-medium">{formatDistance(route.distance)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-sunrise-500" />
            <span className="text-sm font-medium">{formatDuration(route.duration)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-medium">{route.elevation}m</span>
          </div>
        </div>

        {/* 照片数量提示 */}
        {route.photos && route.photos.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <span>📷</span>
            <span>{route.photos.length} 张照片</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
