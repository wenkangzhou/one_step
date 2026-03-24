'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore, useNavigationStore } from '@/lib/store';
import { AMapLoader } from './amap-loader';
import type { PhotoMarker } from '@/lib/store';

interface MapContainerProps {
  className?: string;
  showRoute?: boolean;
  routePath?: Array<[number, number]>;
  photos?: PhotoMarker[];
  interactive?: boolean;
}

function MapComponent({
  className,
  showRoute,
  routePath,
  photos,
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

  // 显示路线和标记
  useEffect(() => {
    if (!mapInstance.current) return;

    // 清除之前的路线和标记
    if (polylineRef.current) {
      mapInstance.current.remove(polylineRef.current);
    }
    markersRef.current.forEach((marker) => {
      if (marker) mapInstance.current.remove(marker);
    });
    markersRef.current = [];

    if (!showRoute || !routePath || routePath.length === 0) return;

    const path = routePath.map(([lng, lat]) => new window.AMap.LngLat(lng, lat));

    // 绘制路线
    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: '#e74c3c',
      strokeWeight: 4,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
      dirColor: '#fff',
    });

    mapInstance.current.add(polyline);
    polylineRef.current = polyline;

    // 起点标记 - 绿色圆形带"起"字
    const startMarker = new window.AMap.CircleMarker({
      center: path[0],
      radius: 14,
      fillColor: '#27ae60',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 3,
      zIndex: 100,
    });

    // 起点文字
    const startLabel = new window.AMap.Text({
      text: '起',
      position: path[0],
      offset: new window.AMap.Pixel(-8, -10),
      style: {
        color: '#fff',
        'font-size': '14px',
        'font-weight': 'bold',
        'text-align': 'center',
        'line-height': '20px',
      },
      zIndex: 101,
    });

    // 终点标记 - 红色圆形带"终"字
    const endMarker = new window.AMap.CircleMarker({
      center: path[path.length - 1],
      radius: 14,
      fillColor: '#e74c3c',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 3,
      zIndex: 100,
    });

    // 终点文字
    const endLabel = new window.AMap.Text({
      text: '终',
      position: path[path.length - 1],
      offset: new window.AMap.Pixel(-8, -10),
      style: {
        color: '#fff',
        'font-size': '14px',
        'font-weight': 'bold',
        'text-align': 'center',
        'line-height': '20px',
      },
      zIndex: 101,
    });

    mapInstance.current.add([startMarker, startLabel, endMarker, endLabel]);
    markersRef.current = [startMarker, startLabel, endMarker, endLabel];

    // 添加照片标记
    if (photos && photos.length > 0) {
      photos.forEach((photo) => {
        const photoPosition = new window.AMap.LngLat(photo.position[0], photo.position[1]);
        
        // 照片标记点
        const photoMarker = new window.AMap.CircleMarker({
          center: photoPosition,
          radius: 10,
          fillColor: '#f39c12',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          zIndex: 90,
        });

        // 相机图标（简化为圆点+提示）
        const photoLabel = new window.AMap.Text({
          text: '📷',
          position: photoPosition,
          offset: new window.AMap.Pixel(-10, -10),
          style: {
            'font-size': '16px',
          },
          zIndex: 91,
        });

        mapInstance.current.add([photoMarker, photoLabel]);
        markersRef.current.push(photoMarker, photoLabel);
      });
    }

    // 调整视野
    mapInstance.current.setFitView();
  }, [showRoute, routePath, photos]);

  // 更新当前位置标记
  useEffect(() => {
    if (!mapInstance.current || !currentLocation) return;

    if (locationMarkerRef.current) {
      locationMarkerRef.current.setCenter(
        new window.AMap.LngLat(currentLocation[0], currentLocation[1])
      );
    } else {
      const marker = new window.AMap.CircleMarker({
        center: new window.AMap.LngLat(currentLocation[0], currentLocation[1]),
        radius: 8,
        fillColor: '#3498db',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        zIndex: 200,
      });
      mapInstance.current.add(marker);
      locationMarkerRef.current = marker;
    }

    if (followMode && isNavigating) {
      mapInstance.current.setCenter(
        new window.AMap.LngLat(currentLocation[0], currentLocation[1])
      );
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
