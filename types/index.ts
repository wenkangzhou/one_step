export interface AMapPoint {
  name: string;
  location: {
    lng: number;
    lat: number;
  };
  address?: string;
}

export interface AMapRoute {
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    path: string;
  }>;
  path: Array<[number, number]>;
}

export interface AMapWalkingResult {
  info: string;
  route: {
    origin: string;
    destination: string;
    paths: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        instruction: string;
        road: string;
        distance: number;
        orientation: string;
        duration: number;
        polyline: string;
        action: string;
        assistant_action: string;
      }>;
    }>;
  };
}

export interface AMapSearchResult {
  info: string;
  poiList: {
    pois: Array<{
      id: string;
      name: string;
      type: string;
      address: string;
      location: {
        lng: number;
        lat: number;
      };
    }>;
  };
}

declare global {
  interface Window {
    AMap: typeof AMap;
    initAMap?: () => void;
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }
}
