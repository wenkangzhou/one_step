'use client';

import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Footprints, TrendingUp } from 'lucide-react';
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
    easy: t('route.difficulty.easy'),
    moderate: t('route.difficulty.moderate'),
    hard: t('route.difficulty.hard'),
  }[route.difficulty];

  const typeLabel = {
    loop: t('route.type.loop'),
    oneWay: t('route.type.oneWay'),
    outAndBack: t('route.type.outAndBack'),
  }[route.type];

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-forest-500' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{route.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {route.startName} → {route.endName}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${difficultyColor}`}
          >
            {difficultyLabel}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Footprints className="h-4 w-4" />
            <span>{formatDistance(route.distance)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(route.duration)}</span>
          </div>
          {route.elevation && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{route.elevation}m</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {typeLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
