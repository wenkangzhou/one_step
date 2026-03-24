'use client';

import { useEffect, useState, useCallback } from 'react';

interface AMapLoaderProps {
  children: React.ReactNode;
  onLoad?: () => void;
}

export function AMapLoader({ children, onLoad }: AMapLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAMap = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (window.AMap) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    const key = process.env.NEXT_PUBLIC_AMAP_KEY;
    if (!key) {
      console.error('AMap key is not configured');
      return;
    }

    // 添加安全密钥配置
    const securityConfig = process.env.NEXT_PUBLIC_AMAP_SECURITY_CONFIG;
    if (securityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: securityConfig,
      };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Geolocation,AMap.PlaceSearch,AMap.Walking,AMap.Riding`;
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };
    script.onerror = () => {
      console.error('Failed to load AMap');
    };
    document.head.appendChild(script);
  }, [onLoad]);

  useEffect(() => {
    loadAMap();
  }, [loadAMap]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
