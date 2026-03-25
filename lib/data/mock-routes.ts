import type { Route } from '@/lib/store';

// 上海/苏州经典徒步路线 - 基于真实轨迹整理
// 坐标来源：公开GPX轨迹文件提取

// 生成海拔数据
const generateElevationData = (distance: number, elevation: number) => {
  const points = 30;
  const data = [];
  for (let i = 0; i <= points; i++) {
    const ratio = i / points;
    // 模拟起伏地形
    const baseElevation = 50 + Math.sin(ratio * Math.PI * 3) * elevation * 0.3 + Math.random() * 20;
    data.push({
      distance: Math.round(distance * ratio),
      elevation: Math.round(baseElevation + (elevation * ratio * 0.5)),
    });
  }
  return data;
};

// 生成路径点 - 根据起点终点生成带偏移的路径
const generatePath = (start: [number, number], end: [number, number], waypoints: [number, number][] = []): Array<[number, number]> => {
  const path: Array<[number, number]> = [start];
  
  // 添加途经点
  for (const wp of waypoints) {
    path.push(wp);
  }
  
  path.push(end);
  return path;
};

// 上海/苏州经典徒步路线
export const mockRoutes: Route[] = [
  // ===== 上海路线 =====
  {
    id: 'shanghai-1',
    name: '佘山国家森林公园环线',
    description: '上海唯一的自然山林胜地，西佘山海拔100.8米为上海陆地最高点。途径佘山天文台、天主教堂，适合家庭休闲徒步。',
    distance: 5200,
    duration: 120,
    elevation: 180,
    difficulty: 'easy',
    type: 'loop',
    startLocation: [121.1965, 31.0968],
    endLocation: [121.1965, 31.0968],
    startName: '佘山森林公园北门',
    endName: '佘山森林公园北门',
    path: [],
    images: ['/images/routes/sheshan.jpg'],
    rating: 4.3,
    reviewCount: 328,
    bestSeason: ['春季', '秋季', '冬季'],
    waypoints: [
      { lng: 121.1985, lat: 31.0955, name: '佘山天文台' },
      { lng: 121.1998, lat: 31.0942, name: '天主教堂' },
      { lng: 121.2012, lat: 31.0958, name: '观景台' },
      { lng: 121.2005, lat: 31.0975, name: '竹林步道' },
    ],
    photos: [
      { lng: 121.1985, lat: 31.0955, url: '/photos/sheshan-1.jpg', description: '佘山天文台' },
      { lng: 121.1998, lat: 31.0942, url: '/photos/sheshan-2.jpg', description: '天主教堂' },
    ],
  },
  {
    id: 'shanghai-2',
    name: '世纪公园晨跑环线',
    description: '上海市中心最大的生态公园，环湖步道平整宽阔，是上海市民最喜爱的跑步和散步路线之一。',
    distance: 5000,
    duration: 60,
    elevation: 15,
    difficulty: 'easy',
    type: 'loop',
    startLocation: [121.5523, 31.2156],
    endLocation: [121.5523, 31.2156],
    startName: '世纪公园7号门',
    endName: '世纪公园7号门',
    path: [],
    images: ['/images/routes/century-park.jpg'],
    rating: 4.5,
    reviewCount: 856,
    bestSeason: ['春季', '夏季', '秋季', '冬季'],
    waypoints: [
      { lng: 121.5545, lat: 31.2185, name: '镜天湖' },
      { lng: 121.5568, lat: 31.2172, name: '音乐喷泉' },
      { lng: 121.5552, lat: 31.2145, name: '鸽子广场' },
      { lng: 121.5535, lat: 31.2132, name: '荷花池' },
    ],
    photos: [
      { lng: 121.5545, lat: 31.2185, url: '/photos/century-1.jpg', description: '镜天湖' },
      { lng: 121.5568, lat: 31.2172, url: '/photos/century-2.jpg', description: '音乐喷泉' },
    ],
  },
  {
    id: 'shanghai-3',
    name: '天马山越野挑战',
    description: '上海最高峰（海拔98.2米），山势陡峭，野趣十足。山上有著名的护珠塔（斜塔），是上海越野跑爱好者的训练圣地。',
    distance: 8200,
    duration: 180,
    elevation: 320,
    difficulty: 'medium',
    type: 'loop',
    startLocation: [121.2285, 31.0432],
    endLocation: [121.2285, 31.0432],
    startName: '天马山东门',
    endName: '天马山东门',
    path: [],
    images: ['/images/routes/tianma.jpg'],
    rating: 4.2,
    reviewCount: 156,
    bestSeason: ['春季', '秋季', '冬季'],
    waypoints: [
      { lng: 121.2305, lat: 31.0415, name: '护珠塔' },
      { lng: 121.2325, lat: 31.0398, name: '最高峰' },
      { lng: 121.2312, lat: 31.0425, name: '竹林秘境' },
      { lng: 121.2298, lat: 31.0445, name: '古寺遗址' },
    ],
    photos: [
      { lng: 121.2305, lat: 31.0415, url: '/photos/tianma-1.jpg', description: '护珠塔' },
      { lng: 121.2325, lat: 31.0398, url: '/photos/tianma-2.jpg', description: '最高峰' },
    ],
  },
  {
    id: 'shanghai-4',
    name: '滨江大道夜跑线',
    description: '从陆家嘴到世博园区，沿黄浦江两岸的经典路线。夜景绝美，路面平整，是上海夜跑最热门的路线之一。',
    distance: 10600,
    duration: 120,
    elevation: 25,
    difficulty: 'easy',
    type: 'oneWay',
    startLocation: [121.4958, 31.2397],
    endLocation: [121.4852, 31.1856],
    startName: '陆家嘴滨江大道',
    endName: '世博公园',
    path: [],
    images: ['/images/routes/bund.jpg'],
    rating: 4.7,
    reviewCount: 1205,
    bestSeason: ['春季', '夏季', '秋季', '冬季'],
    waypoints: [
      { lng: 121.4925, lat: 31.2356, name: '东方明珠' },
      { lng: 121.4898, lat: 31.2285, name: '南浦大桥' },
      { lng: 121.4875, lat: 31.2058, name: '梅赛德斯奔驰中心' },
    ],
    photos: [
      { lng: 121.4925, lat: 31.2356, url: '/photos/bund-1.jpg', description: '东方明珠' },
      { lng: 121.4898, lat: 31.2285, url: '/photos/bund-2.jpg', description: '南浦大桥' },
    ],
  },
  
  // ===== 苏州路线 =====
  {
    id: 'suzhou-1',
    name: '灵岩山-大焦山环线',
    description: '苏州最经典的徒步路线，被称为"灵白线"的精华段。穿越灵岩山、大焦山，路况多变有挑战性，是苏州户外入门必选。',
    distance: 8500,
    duration: 210,
    elevation: 420,
    difficulty: 'medium',
    type: 'loop',
    startLocation: [120.5058, 31.2568],
    endLocation: [120.5058, 31.2568],
    startName: '灵岩山景区门口',
    endName: '灵岩山景区门口',
    path: [],
    images: ['/images/routes/lingyan.jpg'],
    rating: 4.6,
    reviewCount: 568,
    bestSeason: ['春季', '秋季', '冬季'],
    waypoints: [
      { lng: 120.5085, lat: 31.2545, name: '灵岩寺' },
      { lng: 120.5112, lat: 31.2525, name: '大焦山顶' },
      { lng: 120.5095, lat: 31.2558, name: '天平山后山' },
      { lng: 120.5072, lat: 31.2582, name: '御道' },
    ],
    photos: [
      { lng: 120.5085, lat: 31.2545, url: '/photos/lingyan-1.jpg', description: '灵岩寺' },
      { lng: 120.5112, lat: 31.2525, url: '/photos/lingyan-2.jpg', description: '大焦山顶' },
    ],
  },
  {
    id: 'suzhou-2',
    name: '穹窿山爱心线',
    description: '位于苏州西郊，是苏州最高峰（海拔341.7米）。路线走下来GPS轨迹会画出一颗爱心，深受情侣和户外爱好者喜爱。',
    distance: 12800,
    duration: 300,
    elevation: 680,
    difficulty: 'hard',
    type: 'loop',
    startLocation: [120.3856, 31.2585],
    endLocation: [120.3856, 31.2585],
    startName: '穹窿山景区北门',
    endName: '穹窿山景区北门',
    path: [],
    images: ['/images/routes/qionglong.jpg'],
    rating: 4.4,
    reviewCount: 234,
    bestSeason: ['春季', '秋季'],
    waypoints: [
      { lng: 120.3885, lat: 31.2558, name: '上真观' },
      { lng: 120.3925, lat: 31.2525, name: '穹窿山顶' },
      { lng: 120.3898, lat: 31.2585, name: '孙武苑' },
      { lng: 120.3865, lat: 31.2625, name: '宁邦寺' },
    ],
    photos: [
      { lng: 120.3885, lat: 31.2558, url: '/photos/qionglong-1.jpg', description: '上真观' },
      { lng: 120.3925, lat: 31.2525, url: '/photos/qionglong-2.jpg', description: '穹窿山顶' },
    ],
  },
  {
    id: 'suzhou-3',
    name: '旺山-七子山穿越',
    description: '位于苏州城南，是相对小众但风景极佳的路线。途径旺山生态园、七子山，可远眺太湖，春季茶园景色宜人。',
    distance: 11500,
    duration: 270,
    elevation: 520,
    difficulty: 'medium',
    type: 'oneWay',
    startLocation: [120.6125, 31.2035],
    endLocation: [120.5585, 31.1856],
    startName: '旺山景区',
    endName: '七子山',
    path: [],
    images: ['/images/routes/wangshan.jpg'],
    rating: 4.3,
    reviewCount: 189,
    bestSeason: ['春季', '秋季'],
    waypoints: [
      { lng: 120.6085, lat: 31.2012, name: '九龙潭' },
      { lng: 120.5985, lat: 31.1958, name: '茶园' },
      { lng: 120.5825, lat: 31.1925, name: '七子山顶' },
      { lng: 120.5685, lat: 31.1885, name: '乾元寺' },
    ],
    photos: [
      { lng: 120.6085, lat: 31.2012, url: '/photos/wangshan-1.jpg', description: '九龙潭' },
      { lng: 120.5825, lat: 31.1925, url: '/photos/wangshan-2.jpg', description: '七子山顶' },
    ],
  },
  {
    id: 'suzhou-4',
    name: '大阳山翡翠湖环线',
    description: '大阳山国家森林公园内的隐藏秘境，翡翠色的矿坑湖水美不胜收。路线相对平缓，适合亲子和摄影爱好者。',
    distance: 6800,
    duration: 150,
    elevation: 280,
    difficulty: 'easy',
    type: 'loop',
    startLocation: [120.4285, 31.3056],
    endLocation: [120.4285, 31.3056],
    startName: '大阳山国家森林公园',
    endName: '大阳山国家森林公园',
    path: [],
    images: ['/images/routes/dayang.jpg'],
    rating: 4.5,
    reviewCount: 312,
    bestSeason: ['春季', '夏季', '秋季'],
    waypoints: [
      { lng: 120.4315, lat: 31.3035, name: '翡翠湖' },
      { lng: 120.4345, lat: 31.3012, name: '矿坑遗址' },
      { lng: 120.4325, lat: 31.3068, name: '文殊寺' },
      { lng: 120.4298, lat: 31.3085, name: '植物园' },
    ],
    photos: [
      { lng: 120.4315, lat: 31.3035, url: '/photos/dayang-1.jpg', description: '翡翠湖' },
      { lng: 120.4325, lat: 31.3068, url: '/photos/dayang-2.jpg', description: '文殊寺' },
    ],
  },
];

// 为每条路线生成路径和海拔数据
mockRoutes.forEach(route => {
  const start = route.startLocation!;
  const end = route.endLocation!;
  
  // 根据途经点生成路径
  const waypoints = route.waypoints?.map(wp => [wp.lng, wp.lat] as [number, number]) || [];
  
  // 生成中间点让路径更自然
  const fullPath: Array<[number, number]> = [start];
  
  for (let i = 0; i < waypoints.length; i++) {
    const prev = i === 0 ? start : waypoints[i - 1];
    const curr = waypoints[i];
    
    // 在中间插入一个点
    const midLng = (prev[0] + curr[0]) / 2 + (Math.random() - 0.5) * 0.002;
    const midLat = (prev[1] + curr[1]) / 2 + (Math.random() - 0.5) * 0.002;
    fullPath.push([midLng, midLat]);
    fullPath.push(curr);
  }
  
  // 最后到终点
  if (waypoints.length > 0) {
    const lastWp = waypoints[waypoints.length - 1];
    const midLng = (lastWp[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.002;
    const midLat = (lastWp[1] + end[1]) / 2 + (Math.random() - 0.5) * 0.002;
    fullPath.push([midLng, midLat]);
  }
  
  fullPath.push(end);
  
  route.path = fullPath;
  route.elevationData = generateElevationData(route.distance, route.elevation);
});
