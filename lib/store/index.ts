import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { mockRoutes } from '@/lib/data/mock-routes';

// 海拔点
export interface ElevationPoint {
  distance: number;
  elevation: number;
}

// 路线数据
export interface Route {
  id: string;
  name: string;
  description: string;
  distance: number; // 米
  duration: number; // 分钟
  elevation: number; // 米
  difficulty: 'easy' | 'medium' | 'hard';
  type?: 'loop' | 'oneWay' | 'outAndBack';
  path: Array<[number, number]>; // [lng, lat] 坐标点数组
  images: string[];
  startLocation?: [number, number];
  endLocation?: [number, number];
  startName?: string;
  endName?: string;
  rating?: number;
  reviewCount?: number;
  bestSeason?: string[];
  waypoints?: { lng: number; lat: number; name?: string }[];
  photos?: { url: string; lat: number; lng: number; description?: string }[];
  elevationData?: ElevationPoint[];
  weather?: {
    temp: number;
    condition: string;
    windSpeed: number;
    uvIndex: number;
  };
}

// 搜索状态
interface SearchState {
  query: string;
  results: Route[];
  selectedRoute: Route | null;
  recentSearches: string[];
}

interface SearchStore extends SearchState {
  setQuery: (query: string) => void;
  search: (query: string) => void;
  setResults: (routes: Route[]) => void;
  selectRoute: (route: Route | null) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  clearSearch: () => void;
  removeRecentSearch: (search: string) => void;
}

// 地图状态
interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
}

interface MapStore extends MapState {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: [number, number, number, number] | null) => void;
}

// 导航状态 - 简化版：核心是不迷路，让用户自己看地图
export interface NavigationState {
  isNavigating: boolean;
  currentLocation: [number, number] | null;
  currentHeading: number | null; // 方向角度
  followMode: boolean; // 地图是否跟随用户
  isOffRoute: boolean; // 是否偏离（仅提示，不强制）
}

interface NavigationStore extends NavigationState {
  startNavigation: () => void;
  stopNavigation: () => void;
  updateLocation: (location: [number, number], heading?: number | null) => void;
  toggleFollowMode: () => void;
}

// 创建搜索状态存储
export const useSearchStore = create<SearchStore>()(
  devtools(
    (set) => ({
      query: '',
      results: [],
      selectedRoute: null,
      recentSearches: [],

      setQuery: (query: string) => set({ query }),

      search: (query: string) => {
        set({ query });
        if (!query.trim()) {
          set({ results: [] });
          return;
        }
        const searchTerm = query.toLowerCase();
        const results = mockRoutes.filter(
          (route) =>
            route.name.toLowerCase().includes(searchTerm) ||
            route.description.toLowerCase().includes(searchTerm)
        );
        set({ results });
      },

      setResults: (routes: Route[]) => set({ results: routes }),

      selectRoute: (route: Route | null) => set({ selectedRoute: route }),

      addRecentSearch: (search: string) => {
        if (!search.trim()) return;
        set((state) => ({
          recentSearches: [
            search,
            ...state.recentSearches.filter((s) => s !== search),
          ].slice(0, 10),
        }));
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      clearSearch: () => set({ query: '', results: [] }),

      removeRecentSearch: (search: string) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== search),
        })),
    }),
    { name: 'search-store' }
  )
);

// 创建地图状态存储
export const useMapStore = create<MapStore>()(
  devtools(
    (set) => ({
      center: [121.4737, 31.2304], // 上海（用户base地）
      zoom: 11,
      bounds: null,

      setCenter: (center: [number, number]) => set({ center }),
      setZoom: (zoom: number) => set({ zoom }),
      setBounds: (bounds: [number, number, number, number] | null) => set({ bounds }),
    }),
    { name: 'map-store' }
  )
);

// 创建导航状态存储 - 简化版
export const useNavigationStore = create<NavigationStore>()(
  devtools(
    (set) => ({
      isNavigating: false,
      currentLocation: null,
      currentHeading: null,
      followMode: true,
      isOffRoute: false,

      startNavigation: () =>
        set({
          isNavigating: true,
          followMode: true,
          isOffRoute: false,
        }),

      stopNavigation: () =>
        set({
          isNavigating: false,
          currentLocation: null,
          currentHeading: null,
          isOffRoute: false,
        }),

      updateLocation: (location: [number, number], heading?: number | null) =>
        set({
          currentLocation: location,
          currentHeading: heading ?? null,
        }),

      toggleFollowMode: () =>
        set((state) => ({
          followMode: !state.followMode,
        })),
    }),
    { name: 'navigation-store' }
  )
);
