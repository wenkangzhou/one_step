'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Navigation, Mountain, AlertCircle } from 'lucide-react';
import { useNavigationStore, useSearchStore } from '@/lib/store';
import { ElevationChart } from '@/components/chart/elevation-chart';

// 计算两点间距离（Haversine公式）- 返回公里
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 实际距离 = 半径 * 弧度
}

export function NavigationPanel() {
  const router = useRouter();
  const { selectedRoute } = useSearchStore();
  const { 
    followMode, 
    stopNavigation, 
    toggleFollowMode,
    currentLocation,
  } = useNavigationStore();
  const [showElevation, setShowElevation] = useState(false);
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(() => {
    stopNavigation();
    router.push('/');
  }, [stopNavigation, router]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // 计算用户到起点的距离
  const distanceToStart = useMemo(() => {
    if (!selectedRoute || !currentLocation || !selectedRoute.startLocation) {
      return null;
    }
    const [startLng, startLat] = selectedRoute.startLocation;
    const [userLng, userLat] = currentLocation;
    return calculateDistance(userLat, userLng, startLat, startLng);
  }, [selectedRoute, currentLocation]);

  // 是否需要显示距离警告（超过2km）
  const isFarFromStart = distanceToStart !== null && distanceToStart > 2;

  if (!selectedRoute) return null;

  // 海拔图页面
  if (showElevation) {
    return (
      <div 
        className="fixed inset-0 z-[200] bg-white flex flex-col"
        style={{ pointerEvents: 'auto' }}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <h3 className="font-semibold">海拔分析</h3>
          <button 
            className="text-sm text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setShowElevation(false)}
            type="button"
          >
            关闭
          </button>
        </div>
        
        {/* 统计信息 */}
        <div className="px-4 py-3 bg-gray-50 border-b shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              全程 {(selectedRoute.distance / 1000).toFixed(2)} 公里
            </span>
            <span className="text-muted-foreground">
              累计爬升 {selectedRoute.elevation} 米
            </span>
          </div>
        </div>

        {/* 海拔图 */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedRoute.elevationData ? (
            <ElevationChart data={selectedRoute.elevationData} height={250} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              暂无海拔数据
            </div>
          )}
        </div>

        {/* 底部返回导航 */}
        <div className="p-4 border-t bg-white shrink-0">
          <button 
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            onClick={() => setShowElevation(false)}
            type="button"
          >
            返回导航
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ pointerEvents: 'none' }}>
      {/* 距离较远警告 - 左上角 */}
      {isFarFromStart && (
        <div className="absolute top-20 left-4 z-[120]" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowDistanceWarning(true)}
            className="w-10 h-10 bg-amber-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-amber-600 active:scale-95 transition-transform"
            title="距离提示"
            type="button"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
          
          {/* 提示弹窗 */}
          {showDistanceWarning && (
            <div 
              className="absolute top-12 left-0 bg-white rounded-xl shadow-xl p-4 w-64 z-[130]"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">距离起点较远</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {distanceToStart.toFixed(1)} <span className="text-sm font-normal">公里</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    您当前位置距离路线起点还有 {distanceToStart.toFixed(1)} 公里，请前往起点开始导航。
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDistanceWarning(false)}
                className="w-full mt-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                type="button"
              >
                知道了
              </button>
            </div>
          )}
        </div>
      )}

      {/* 顶部控制栏 */}
      <div className="absolute top-0 left-0 right-0 z-[110] p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* 退出按钮 */}
          <button
            onClick={handleExit}
            className="h-11 w-11 rounded-full bg-white/95 shadow-lg text-foreground hover:bg-white flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 标题 */}
          <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full">
            <span className="text-sm font-medium">导航中</span>
          </div>

          {/* 跟随模式切换 */}
          <button
            onClick={toggleFollowMode}
            className={`h-11 w-11 rounded-full shadow-lg transition-colors flex items-center justify-center ${
              followMode
                ? 'bg-green-600 text-white'
                : 'bg-white/95 text-foreground'
            }`}
            title={followMode ? '地图跟随中' : '自由浏览'}
            style={{ pointerEvents: 'auto' }}
            type="button"
          >
            <Navigation className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 距离提示 - 距离起点超过2km时显示 */}
      {isFarFromStart && (
        <div className="absolute top-1/3 left-0 right-0 z-[110]" style={{ pointerEvents: 'none' }}>
          <div className="text-center">
            <span className="text-5xl font-bold text-green-500 drop-shadow-lg">
              {distanceToStart.toFixed(1)}
            </span>
            <span className="text-xl text-green-500 ml-1">公里</span>
            <p className="text-sm text-green-600 mt-1">距离起点</p>
          </div>
        </div>
      )}

      {/* 底部信息面板 */}
      <div className="absolute bottom-0 left-0 right-0 z-[110]">
        <div className="bg-white/95 backdrop-blur-sm shadow-lg" style={{ pointerEvents: 'auto' }}>
          {/* 主要信息 */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* 到起点的距离 */}
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-green-600">
                  {distanceToStart !== null ? distanceToStart.toFixed(1) : '--'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">距起点(公里)</p>
              </div>

              {/* 路线名称 */}
              <div className="flex-1 text-center px-2">
                <p className="font-semibold text-sm truncate">{selectedRoute.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(selectedRoute.distance / 1000).toFixed(1)}公里 / {selectedRoute.elevation}米爬升
                </p>
              </div>

              {/* 路线总长 */}
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-amber-500">
                  {(selectedRoute.distance / 1000).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">路线总长</p>
              </div>
            </div>
          </div>

          {/* 底部按钮栏 - 只保留海拔图 */}
          <div className="flex border-t">
            <button 
              onClick={() => setShowElevation(true)}
              className="flex-1 py-3 flex flex-col items-center gap-1 text-muted-foreground hover:bg-gray-50 transition-colors"
              type="button"
            >
              <Mountain className="h-5 w-5" />
              <span className="text-xs">海拔图</span>
            </button>
          </div>
        </div>
      </div>

      {/* 结束导航确认对话框 */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-white rounded-2xl p-6 w-80 mx-4">
            <h3 className="text-lg font-semibold text-center mb-2">结束导航？</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              确定要结束当前导航吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200"
                type="button"
              >
                继续导航
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                type="button"
              >
                结束
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
