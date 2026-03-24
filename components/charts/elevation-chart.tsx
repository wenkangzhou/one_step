'use client';

import { useMemo } from 'react';
import type { ElevationPoint } from '@/lib/store';

interface ElevationChartProps {
  data: ElevationPoint[];
  width?: number;
  height?: number;
}

export function ElevationChart({ data, width = 400, height = 120 }: ElevationChartProps) {
  const { path, areaPath, minElevation, maxElevation, totalDistance } = useMemo(() => {
    if (!data || data.length === 0) return { path: '', areaPath: '', minElevation: 0, maxElevation: 0, totalDistance: 0 };

    const minElevation = Math.min(...data.map(d => d.elevation));
    const maxElevation = Math.max(...data.map(d => d.elevation));
    const elevationRange = maxElevation - minElevation || 1;
    const totalDistance = data[data.length - 1].distance;

    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((point, index) => {
      const x = padding.left + (point.distance / totalDistance) * chartWidth;
      const y = padding.top + chartHeight - ((point.elevation - minElevation) / elevationRange) * chartHeight;
      return { x, y, elevation: point.elevation };
    });

    // 生成路径
    const path = points.reduce((acc, point, index) => {
      return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    // 生成填充区域路径
    const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    return { path, areaPath, minElevation, maxElevation, totalDistance };
  }, [data, width, height]);

  if (!data || data.length === 0) return null;

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${Math.round(meters)}m`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">海拔剖面</span>
        <span className="text-xs text-muted-foreground">
          累计爬升: {Math.round(maxElevation - minElevation)}m
        </span>
      </div>
      <div className="relative bg-muted rounded-lg overflow-hidden">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* 背景网格 */}
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3d8a5d" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3d8a5d" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* 填充区域 */}
          <path d={areaPath} fill="url(#elevationGradient)" />

          {/* 海拔线 */}
          <path
            d={path}
            fill="none"
            stroke="#3d8a5d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y轴标签 */}
        <div className="absolute left-1 top-2 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground">
          <span>{maxElevation}m</span>
          <span>{Math.round((maxElevation + minElevation) / 2)}m</span>
          <span>{minElevation}m</span>
        </div>

        {/* X轴标签 */}
        <div className="absolute bottom-1 left-8 right-2 flex justify-between text-[10px] text-muted-foreground">
          <span>0</span>
          <span>{formatDistance(totalDistance / 2)}</span>
          <span>{formatDistance(totalDistance)}</span>
        </div>
      </div>
    </div>
  );
}
