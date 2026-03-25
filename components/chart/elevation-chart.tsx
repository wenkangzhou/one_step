'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ElevationPoint } from '@/lib/store';

interface ElevationChartProps {
  data: ElevationPoint[];
  height?: number;
  onHover?: (point: ElevationPoint | null) => void;
}

export function ElevationChart({ data, height = 220, onHover }: ElevationChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { ascent: 0, descent: 0, min: 0, max: 0 };
    
    let ascent = 0;
    let descent = 0;
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i].elevation - data[i - 1].elevation;
      if (diff > 0) ascent += diff;
      else descent += Math.abs(diff);
    }
    
    const elevations = data.map(d => d.elevation);
    return {
      ascent: Math.round(ascent),
      descent: Math.round(descent),
      min: Math.min(...elevations),
      max: Math.max(...elevations),
    };
  }, [data]);

  const minElevation = stats.min - 20;
  const maxElevation = stats.max + 20;

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload[0]) {
      const point = state.activePayload[0].payload as ElevationPoint;
      setHoveredPoint(point);
      onHover?.(point);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    onHover?.(null);
  };

  return (
    <div className="w-full">
      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
          <p className="text-xs text-green-600">累计爬升</p>
          <p className="font-bold text-green-700">{stats.ascent} m</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
          <p className="text-xs text-orange-600">累计下降</p>
          <p className="font-bold text-orange-700">{stats.descent} m</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
          <p className="text-xs text-blue-600">最高海拔</p>
          <p className="font-bold text-blue-700">{stats.max} m</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
          <p className="text-xs text-purple-600">最低海拔</p>
          <p className="font-bold text-purple-700">{stats.min} m</p>
        </div>
      </div>

      {/* 当前悬停信息 */}
      {hoveredPoint && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border text-center">
          <div className="flex items-center justify-center gap-6">
            <div>
              <span className="text-xs text-muted-foreground">距离</span>
              <p className="font-semibold">{(hoveredPoint.distance / 1000).toFixed(2)} km</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <span className="text-xs text-muted-foreground">海拔</span>
              <p className="font-semibold">{hoveredPoint.elevation} m</p>
            </div>
          </div>
        </div>
      )}

      {/* 图表 */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="distance"
              tickFormatter={(value) => (value / 1000).toFixed(1)}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              label={{ value: '距离 (km)', position: 'insideBottom', offset: 2, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              domain={[minElevation, maxElevation]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={45}
              label={{ value: '海拔 (m)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip
              cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload as ElevationPoint;
                  return (
                    <div className="bg-white p-2.5 rounded-lg shadow-lg border text-xs">
                      <p className="text-muted-foreground mb-1">
                        距离: {(point.distance / 1000).toFixed(2)} km
                      </p>
                      <p className="font-semibold text-green-600">海拔: {point.elevation} m</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#elevationGradient)"
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            />
            {/* 平均线 */}
            <ReferenceLine
              y={(stats.min + stats.max) / 2}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* 提示文字 */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          在图表上滑动查看各点海拔
        </p>
      </div>
    </div>
  );
}
