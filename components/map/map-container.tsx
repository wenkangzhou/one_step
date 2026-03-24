'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/lib/store';
import { AMapLoader } from './amap-loader';
import { useNavigationStore } from '@/lib/store';

interface MapContainerProps {
  className?: string;
  showRoute?: boolean;
  routePath?: Array<[number, number]>;
  interactive?: boolean;
}

function MapComponent({
  className,
  showRoute,
  routePath,
  interactive = true,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const locationMarkerRef = useRef<any>(null);
  
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const { isNavigating, currentLocation, followMode } = useNavigationStore();

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || !window.AMap || mapInstance.current) return;

    const map = new window.AMap.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      viewMode: '2D',
      resizeEnable: true,
      dragEnable: interactive,
      zoomEnable: interactive,
      doubleClickZoom: interactive,
      // 强制使用 Canvas 渲染，避免 WebGL 兼容性问题
      renderMode: 'canvas',
    });

    mapInstance.current = map;

    // 监听地图移动
    map.on('moveend', () => {
      const newCenter = map.getCenter();
      setCenter([newCenter.lng, newCenter.lat]);
    });

    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    return () => {
      map.destroy();
      mapInstance.current = null;
    };
  }, [center, zoom, interactive, setCenter, setZoom]);

  // 显示路线
  useEffect(() => {
    if (!mapInstance.current || !showRoute || !routePath || routePath.length === 0) return;

    // 清除之前的路线
    if (polylineRef.current) {
      mapInstance.current.remove(polylineRef.current);
    }
    markersRef.current.forEach(marker => mapInstance.current.remove(marker));
    markersRef.current = [];

    // 绘制路线
    const path = routePath.map(([lng, lat]) => new window.AMap.LngLat(lng, lat));
    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#3d8a5d',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
    });

    mapInstance.current.add(polyline);
    polylineRef.current = polyline;

    // 添加起点和终点标记 (使用圆点标记)
    const startMarker = new window.AMap.CircleMarker({
      center: path[0],
      radius: 12,
      fillColor: '#3d8a5d',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    });

    const endMarker = new window.AMap.CircleMarker({
      center: path[path.length - 1],
      radius: 12,
      fillColor: '#f5a623',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    });

    mapInstance.current.add([startMarker, endMarker]);
    markersRef.current = [startMarker, endMarker];

    // 调整视野以显示完整路线
    mapInstance.current.setFitView();
  }, [showRoute, routePath]);

  // 更新当前位置标记
  useEffect(() => {
    if (!mapInstance.current || !currentLocation) return;

    if (locationMarkerRef.current) {
      locationMarkerRef.current.setCenter(new window.AMap.LngLat(currentLocation[0], currentLocation[1]));
    } else {
      const marker = new window.AMap.CircleMarker({
        center: new window.AMap.LngLat(currentLocation[0], currentLocation[1]),
        radius: 10,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      });
      mapInstance.current.add(marker);
      locationMarkerRef.current = marker;
    }

    // 跟随模式下，地图跟随当前位置
    if (followMode && isNavigating) {
      mapInstance.current.setCenter(new window.AMap.LngLat(currentLocation[0], currentLocation[1]));
    }
  }, [currentLocation, followMode, isNavigating]);

  // 定位到当前位置
  const handleLocate = useCallback(() => {
    if (!mapInstance.current || !window.AMap) return;

    const geolocation = new window.AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
      buttonPosition: 'RB',
      buttonOffset: new window.AMap.Pixel(10, 20),
      zoomToAccuracy: true,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        const { position } = result;
        mapInstance.current.setCenter([position.lng, position.lat]);
      } else {
        console.error('定位失败:', result.message);
      }
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className={`w-full h-full ${className || ''}`} />
      {interactive && (
        <button
          onClick={handleLocate}
          className="absolute bottom-4 right-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          title="定位到当前位置"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-forest-600"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function MapContainer(props: MapContainerProps) {
  return (
    <AMapLoader>
      <MapComponent {...props} />
    </AMapLoader>
  );
}
