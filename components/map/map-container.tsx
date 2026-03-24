'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore, useNavigationStore } from '@/lib/store';
import { AMapLoader } from './amap-loader';

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
  const { currentLocation, followMode, isNavigating } = useNavigationStore();

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
    markersRef.current.forEach(marker => {
      if (marker) mapInstance.current.remove(marker);
    });
    markersRef.current = [];

    // 绘制路线
    const path = routePath.map(([lng, lat]) => new window.AMap.LngLat(lng, lat));
    
    // 创建 Polyline
    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#3d8a5d',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
    });

    mapInstance.current.add(polyline);
    polylineRef.current = polyline;

    // 添加起点标记
    const startMarker = new window.AMap.CircleMarker({
      center: path[0],
      radius: 10,
      fillColor: '#3d8a5d',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      zIndex: 100,
    });

    // 添加终点标记
    const endMarker = new window.AMap.CircleMarker({
      center: path[path.length - 1],
      radius: 10,
      fillColor: '#f5a623',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      zIndex: 100,
    });

    // 添加文字标签
    const startLabel = new window.AMap.Text({
      text: '起点',
      position: path[0],
      offset: new window.AMap.Pixel(0, -25),
      style: {
        'background-color': '#3d8a5d',
        'color': '#fff',
        'padding': '4px 8px',
        'border-radius': '4px',
        'font-size': '12px',
      },
      zIndex: 101,
    });

    const endLabel = new window.AMap.Text({
      text: '终点',
      position: path[path.length - 1],
      offset: new window.AMap.Pixel(0, -25),
      style: {
        'background-color': '#f5a623',
        'color': '#fff',
        'padding': '4px 8px',
        'border-radius': '4px',
        'font-size': '12px',
      },
      zIndex: 101,
    });

    mapInstance.current.add([startMarker, endMarker, startLabel, endLabel]);
    markersRef.current = [startMarker, endMarker, startLabel, endLabel];

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
        radius: 8,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        zIndex: 200,
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

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current.setCenter(new window.AMap.LngLat(longitude, latitude));
          mapInstance.current.setZoom(15);
        },
        (error) => {
          console.error('定位失败:', error);
          alert('定位失败，请检查定位权限');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className={`w-full h-full ${className || ''}`} />
      {interactive && (
        <button
          onClick={handleLocate}
          className="absolute bottom-20 right-4 z-10 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
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
