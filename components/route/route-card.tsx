'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Navigation, Triangle, Mountain } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import type { Route } from '@/lib/store';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: Route;
  onClick?: () => void;
  isSelected?: boolean;
}

export function RouteCard({ route, onClick, isSelected }: RouteCardProps) {
  const { t } = useTranslation();

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

  const difficulty = difficultyMap[route.difficulty];
  const typeLabel = route.type ? typeMap[route.type] : '环线';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4',
        isSelected ? 'border-l-forest-500 ring-2 ring-forest-200' : 'border-l-transparent'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{route.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {route.startName}
              </span>
              <span>→</span>
              <span>{route.endName}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficulty.color}`}>
              {difficulty.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {typeLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-forest-500" />
            <div>
              <p className="text-xs text-muted-foreground">距离</p>
              <p className="font-semibold text-sm">{(route.distance / 1000).toFixed(1)} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-forest-500" />
            <div>
              <p className="text-xs text-muted-foreground">用时</p>
              <p className="font-semibold text-sm">{formatDuration(route.duration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Triangle className="h-4 w-4 text-forest-500 rotate-180" />
            <div>
              <p className="text-xs text-muted-foreground">爬升</p>
              <p className="font-semibold text-sm">{route.elevation} m</p>
            </div>
          </div>
        </div>

        {route.photos && route.photos.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <Mountain className="h-3 w-3" />
            <span>{route.photos.length} 个拍照点</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
