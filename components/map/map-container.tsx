'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMapStore, useNavigationStore } from '@/lib/store';
import { AMapLoader } from './amap-loader';
import type { Route } from '@/lib/store';

interface MapContainerProps {
  className?: string;
  routes?: Route[];
  selectedRouteId?: string;
  interactive?: boolean;
  isNavigationMode?: boolean;
  onRouteClick?: (route: Route) => void;
}

const routeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function MapComponent({
  className,
  routes = [],
  selectedRouteId,
  interactive = true,
  isNavigationMode = false,
  onRouteClick,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylinesRef = useRef<Map<string, any>>(new Map());
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(12);
  
  const { center, zoom, setZoom } = useMapStore();
  const { currentLocation, currentHeading, followMode, isOffRoute, updateLocation } = useNavigationStore();

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || !window.AMap || mapInstance.current) return;

    const map = new window.AMap.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      viewMode: '2D',
      resizeEnable: true,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: interactive,
      // 启用触摸缩放
      touchZoom: true,
      pinchZoom: true,
    });

    mapInstance.current = map;
    setZoomLevel(zoom);
    isInitializedRef.current = false;

    map.on('zoomend', () => {
      const newZoom = map.getZoom();
      setZoom(newZoom);
      setZoomLevel(newZoom);
    });

    // 获取用户位置并居中（带兜底处理）
    const hasLocatedRef = { current: false };
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          // 精度太差的位置忽略（超过1km）
          if (accuracy > 1000) {
            console.log('定位精度太差，忽略:', accuracy, 'm');
            return;
          }
          const userLocation: [number, number] = [longitude, latitude];
          updateLocation(userLocation);
          // 非导航模式下定位到当前位置
          if (!isNavigationMode && !hasLocatedRef.current) {
            hasLocatedRef.current = true;
            map.setCenter(new window.AMap.LngLat(longitude, latitude));
            map.setZoom(14);
          }
        },
        (err) => {
          // 错误处理：静默失败，使用默认位置（上海）
          const errorMessages: Record<number, string> = {
            1: '定位权限被拒绝',
            2: '位置不可用',
            3: '定位超时',
          };
          console.log('定位失败:', errorMessages[err.code] || `错误码: ${err.code}`);
          // 不显示错误提示，静默使用默认位置
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }

    return () => {
      map.destroy();
      mapInstance.current = null;
      isInitializedRef.current = false;
    };
  }, []); // 只初始化一次

  // 监听外部 center 变化（legend 点击）
  useEffect(() => {
    if (!mapInstance.current) return;
    const [lng, lat] = center;
    mapInstance.current.setCenter(new window.AMap.LngLat(lng, lat));
  }, [center]);

  // 绘制路线
  useEffect(() => {
    if (!mapInstance.current) return;

    // 清除旧的
    polylinesRef.current.forEach(polyline => mapInstance.current.remove(polyline));
    markersRef.current.forEach(m => mapInstance.current.remove(m));
    polylinesRef.current.clear();
    markersRef.current = [];

    if (routes.length === 0) return;

    routes.forEach((route, index) => {
      if (!route.path || route.path.length < 2) return;

      const path = route.path.map(([lng, lat]) => new window.AMap.LngLat(lng, lat));
      const isSelected = route.id === selectedRouteId;
      const color = isNavigationMode ? '#ef4444' : (isSelected ? '#dc2626' : routeColors[index % routeColors.length]);
      const weight = isNavigationMode ? 7 : (isSelected ? 5 : 4);

      const polyline = new window.AMap.Polyline({
        path: path,
        strokeColor: color,
        strokeWeight: weight,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        showDir: true,
        cursor: onRouteClick ? 'pointer' : 'default',
        zIndex: isSelected ? 100 : 10 + index,
      });

      if (onRouteClick) {
        polyline.on('click', () => onRouteClick(route));
      }

      mapInstance.current.add(polyline);
      polylinesRef.current.set(route.id, polyline);

      // 起终点标记
      const startMarker = new window.AMap.Marker({
        position: path[0],
        content: `<div style="width:28px;height:28px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">起</div>`,
        offset: new window.AMap.Pixel(-14, -14),
        zIndex: 25,
      });

      const endMarker = new window.AMap.Marker({
        position: path[path.length - 1],
        content: `<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">终</div>`,
        offset: new window.AMap.Pixel(-14, -14),
        zIndex: 25,
      });

      mapInstance.current.add([startMarker, endMarker]);
      markersRef.current.push(startMarker, endMarker);

      // 非导航模式下显示路线名称
      if (!isNavigationMode) {
        const midIndex = Math.floor(path.length / 2);
        const labelMarker = new window.AMap.Marker({
          position: path[midIndex],
          content: `
            <div style="
              background: ${color}ee;
              color: white;
              padding: 6px 12px;
              border-radius: 16px;
              font-size: 13px;
              font-weight: 600;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border: 2px solid white;
              cursor: ${onRouteClick ? 'pointer' : 'default'};
            ">${route.name}</div>
          `,
          offset: new window.AMap.Pixel(0, -35),
          zIndex: 30,
        });

        if (onRouteClick) {
          labelMarker.on('click', () => onRouteClick(route));
        }

        mapInstance.current.add(labelMarker);
        markersRef.current.push(labelMarker);
      }
    });

    // 设置视野 - 只在第一次加载时执行
    if (routes.length > 0 && !isInitializedRef.current) {
      try {
        const bounds = new window.AMap.Bounds();
        routes.forEach(route => {
          if (route.path && route.path.length > 0) {
            route.path.forEach(([lng, lat]) => {
              bounds.extend(new window.AMap.LngLat(lng, lat));
            });
          }
        });
        const padding = isNavigationMode ? [100, 100, 100, 100] : [50, 50, 120, 50];
        mapInstance.current.setBounds(bounds, padding);
        isInitializedRef.current = true;
      } catch {
        if (routes[0].path && routes[0].path.length > 0) {
          const [lng, lat] = routes[0].path[0];
          mapInstance.current.setCenter(new window.AMap.LngLat(lng, lat));
          mapInstance.current.setZoom(isNavigationMode ? 15 : 12);
          isInitializedRef.current = true;
        }
      }
    }
  }, [routes, selectedRouteId, isNavigationMode, onRouteClick]);

  // 更新用户位置标记
  useEffect(() => {
    if (!mapInstance.current || !currentLocation) return;

    const [lng, lat] = currentLocation;
    const position = new window.AMap.LngLat(lng, lat);
    const rotation = currentHeading ?? 0;

    const markerContent = isNavigationMode 
      ? `<div style="
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${rotation}deg);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 4L6 20h12l-6-16z"/>
          </svg>
        </div>`
      : `<div style="
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`;

    const offset = isNavigationMode 
      ? new window.AMap.Pixel(-16, -16)
      : new window.AMap.Pixel(-8, -8);

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position);
      userMarkerRef.current.setContent(markerContent);
      userMarkerRef.current.setOffset(offset);
    } else {
      const marker = new window.AMap.Marker({
        position: position,
        content: markerContent,
        offset: offset,
        zIndex: 200,
      });
      mapInstance.current.add(marker);
      userMarkerRef.current = marker;
    }
  }, [currentLocation, currentHeading, isNavigationMode]);

  // 跟随模式居中
  useEffect(() => {
    if (!mapInstance.current || !currentLocation || !isNavigationMode || !followMode) return;
    
    const [lng, lat] = currentLocation;
    mapInstance.current.setCenter(new window.AMap.LngLat(lng, lat));
  }, [followMode, currentLocation, isNavigationMode]);

  // 清理
  useEffect(() => {
    return () => {
      if (userMarkerRef.current && mapInstance.current) {
        mapInstance.current.remove(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, []);

  // 缩放按钮
  const handleZoomIn = useCallback(() => {
    if (!mapInstance.current) return;
    const currentZoom = mapInstance.current.getZoom();
    if (currentZoom < 19) {
      mapInstance.current.setZoom(currentZoom + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstance.current) return;
    const currentZoom = mapInstance.current.getZoom();
    if (currentZoom > 10) {
      mapInstance.current.setZoom(currentZoom - 1);
    }
  }, []);

  // 定位到当前位置
  const handleLocate = useCallback(() => {
    if (!mapInstance.current) return;
    if (currentLocation) {
      mapInstance.current.setCenter(new window.AMap.LngLat(currentLocation[0], currentLocation[1]));
      mapInstance.current.setZoom(17);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapInstance.current.setCenter(new window.AMap.LngLat(longitude, latitude));
          mapInstance.current.setZoom(17);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [currentLocation]);

  // 标尺
  const getScale = () => {
    if (zoomLevel >= 18) return { text: '20 m', width: 8 };
    if (zoomLevel >= 17) return { text: '50 m', width: 10 };
    if (zoomLevel >= 16) return { text: '100 m', width: 10 };
    if (zoomLevel >= 14) return { text: '500 m', width: 12 };
    if (zoomLevel >= 12) return { text: '1 km', width: 12 };
    if (zoomLevel >= 10) return { text: '5 km', width: 14 };
    return { text: '10 km', width: 14 };
  };
  const scale = getScale();

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className={`w-full h-full ${className || ''}`} />
      
      {/* 右侧控制按钮组 */}
      <div className={`absolute right-4 z-10 flex flex-col gap-2 ${isNavigationMode ? 'top-20' : 'top-24'}`}>
        <button 
          onClick={handleZoomIn} 
          className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-transform"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut} 
          className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-transform"
        >
          −
        </button>
        
        {!isNavigationMode && (
          <button 
            onClick={handleLocate} 
            className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform mt-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </button>
        )}
      </div>

      {/* 标尺 */}
      {!isNavigationMode && (
        <div className="absolute bottom-6 right-4 z-10 flex flex-col items-center bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-sm">
          <div className="text-xs font-semibold text-gray-700">{scale.text}</div>
          <div className="flex items-end mt-0.5">
            <div className="w-0.5 h-2 bg-gray-700" />
            <div className="h-0.5 bg-gray-700" style={{ width: `${scale.width * 4}px` }} />
            <div className="w-0.5 h-2 bg-gray-700" />
          </div>
        </div>
      )}

      {/* 偏离提示 */}
      {isNavigationMode && isOffRoute && (
        <div className="absolute top-20 left-4 z-10 bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium">
          ⚠️ 偏离路线
        </div>
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
