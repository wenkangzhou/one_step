import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PhotoMarker {
  position: [number, number];
  url: string;
  description: string;
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export interface Route {
  id: string;
  name: string;
  startName: string;
  endName: string;
  distance: number;
  duration: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  type: 'loop' | 'oneWay' | 'outAndBack';
  path: Array<[number, number]>;
  elevation: number;
  elevationData?: ElevationPoint[];
  photos?: PhotoMarker[];
}

export interface SearchState {
  query: string;
  results: Route[];
  recentSearches: string[];
  isLoading: boolean;
  selectedRoute: Route | null;
}

interface SearchStore extends SearchState {
  setQuery: (query: string) => void;
  setResults: (results: Route[]) => void;
  setLoading: (isLoading: boolean) => void;
  selectRoute: (route: Route | null) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

// 创建基础 store
const createSearchStore = (set: any): SearchStore => ({
  query: '',
  results: [],
  recentSearches: [],
  isLoading: false,
  selectedRoute: null,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  selectRoute: (route) => set({ selectedRoute: route }),
  addRecentSearch: (query) =>
    set((state: SearchState) => ({
      recentSearches: [
        query,
        ...state.recentSearches.filter((s) => s !== query),
      ].slice(0, 10),
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),
});

// 客户端使用 persist，服务端不使用
export const useSearchStore = create<SearchStore>()(
  typeof window !== 'undefined'
    ? persist(createSearchStore, {
        name: 'search-storage',
        partialize: (state) => ({ recentSearches: state.recentSearches }),
      })
    : createSearchStore
);

export interface NavigationState {
  isNavigating: boolean;
  currentLocation: [number, number] | null;
  remainingDistance: number;
  remainingDuration: number;
  followMode: boolean;
}

interface NavigationStore extends NavigationState {
  startNavigation: () => void;
  stopNavigation: () => void;
  updateLocation: (location: [number, number]) => void;
  updateProgress: (distance: number, duration: number) => void;
  toggleFollowMode: () => void;
}

export const useNavigationStore = create<NavigationStore>()((set) => ({
  isNavigating: false,
  currentLocation: null,
  remainingDistance: 0,
  remainingDuration: 0,
  followMode: true,
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () =>
    set({
      isNavigating: false,
      currentLocation: null,
      remainingDistance: 0,
      remainingDuration: 0,
    }),
  updateLocation: (location) => set({ currentLocation: location }),
  updateProgress: (distance, duration) =>
    set({ remainingDistance: distance, remainingDuration: duration }),
  toggleFollowMode: () => set((state) => ({ followMode: !state.followMode })),
}));

interface MapState {
  center: [number, number];
  zoom: number;
  isMapLoaded: boolean;
}

interface MapStore extends MapState {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setMapLoaded: (isLoaded: boolean) => void;
}

export const useMapStore = create<MapStore>()((set) => ({
  center: [116.397428, 39.90923], // 北京中心
  zoom: 12,
  isMapLoaded: false,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setMapLoaded: (isLoaded) => set({ isMapLoaded: isLoaded }),
}));
