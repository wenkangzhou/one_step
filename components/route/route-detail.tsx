'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Footprints, TrendingUp, Navigation, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/utils';
import { useSearchStore, useNavigationStore } from '@/lib/store';

export function RouteDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedRoute, selectRoute } = useSearchStore();
  const { startNavigation } = useNavigationStore();

  const route = selectedRoute;
  if (!route) return null;

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

  const handleNavigate = () => {
    startNavigation();
    router.push('/navigate/');
  };

  return (
    <Sheet open={!!route} onOpenChange={() => selectRoute(null)}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] sm:max-h-[500px] overflow-y-auto pb-safe">
        <SheetHeader className="pb-4 pr-8">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-lg sm:text-xl leading-tight">{route.name}</SheetTitle>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColor}`}
            >
              {difficultyLabel}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* 路线基本信息 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Footprints className="h-5 w-5 mx-auto mb-1 text-forest-500" />
              <p className="text-lg font-semibold">{formatDistance(route.distance)}</p>
              <p className="text-xs text-muted-foreground">{t('route.distance')}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-sunrise-500" />
              <p className="text-lg font-semibold">{formatDuration(route.duration)}</p>
              <p className="text-xs text-muted-foreground">{t('route.duration')}</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-semibold">
                {route.elevation ? `${route.elevation}m` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">{t('route.elevation')}</p>
            </div>
          </div>

          {/* 起点终点信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-900 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-forest-600 dark:text-forest-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('route.start')}</p>
                <p className="font-medium">{route.startName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sunrise-100 dark:bg-sunrise-900 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-sunrise-600 dark:text-sunrise-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('route.end')}</p>
                <p className="font-medium">{route.endName}</p>
              </div>
            </div>
          </div>

          {/* 类型标签 */}
          <div className="flex gap-2">
            <span className="text-sm px-3 py-1.5 rounded-full bg-muted">
              {typeLabel}
            </span>
          </div>

          {/* 开始导航按钮 */}
          <div className="pt-2 pb-4 sm:pb-0">
            <Button
              onClick={handleNavigate}
              className="w-full h-12 text-base bg-forest-600 hover:bg-forest-700 shadow-lg"
            >
              <Navigation className="h-5 w-5 mr-2" />
              {t('route.startNavigation')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
