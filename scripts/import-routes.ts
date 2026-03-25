#!/usr/bin/env tsx
/**
 * 路线导入脚本
 * 支持 GPX 和 KML 格式
 * 
 * 用法:
 *   npm run import:routes
 */

import * as fs from 'fs';
import * as path from 'path';
import { gpx, kml } from '@tmcw/togeojson';
import { DOMParser } from '@xmldom/xmldom';

const GPX_DIR = path.join(process.cwd(), 'gpx');
const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.ts');
const META_FILE = path.join(DATA_DIR, 'routes-meta.json');

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface RouteData {
  id: string;
  fileName: string;
  name: string;
  distance: number;
  duration: number;
  elevation: number;
  elevationData: ElevationPoint[];
  path: Array<[number, number]>;
  startLocation: [number, number];
  endLocation: [number, number];
  minElevation: number;
  maxElevation: number;
}

// Haversine 公式计算距离（米）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 计算累计爬升
function calculateElevationGain(coordinates: number[][]): number {
  let gain = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const prevElev = prev[2] ?? 0;
    const currElev = curr[2] ?? 0;
    if (currElev > prevElev) {
      gain += currElev - prevElev;
    }
  }
  return Math.round(gain);
}

// 从 KML 的 gx:Track 提取坐标（合并所有有效 Track）
function extractKMLTrackCoordinates(xml: Document): number[][] | null {
  const tracks = xml.getElementsByTagName('gx:Track');
  const allCoordinates: number[][] = [];
  
  // 收集所有 Track 的坐标（过滤掉太短的，可能是标记点）
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const coordNodes = track.getElementsByTagName('gx:coord');
    
    // 忽略少于 50 个点的 Track（可能是拍照标记）
    if (coordNodes.length < 50) continue;
    
    for (let j = 0; j < coordNodes.length; j++) {
      const coordText = coordNodes[j].textContent;
      if (coordText) {
        // gx:coord 格式: "lng lat elevation" 或 "lng lat"
        const parts = coordText.trim().split(/\s+/).map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          allCoordinates.push([parts[0], parts[1], parts[2] ?? 0]);
        }
      }
    }
  }
  
  if (allCoordinates.length > 0) {
    return allCoordinates;
  }
  
  // 备用：查找 LineString
  const lineStrings = xml.getElementsByTagName('LineString');
  const lineStringCoords: number[][] = [];
  for (let i = 0; i < lineStrings.length; i++) {
    const coordNode = lineStrings[i].getElementsByTagName('coordinates')[0];
    if (coordNode && coordNode.textContent) {
      const coordText = coordNode.textContent.trim();
      const lines = coordText.split(/\s+/);
      for (const line of lines) {
        const parts = line.split(',').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          lineStringCoords.push([parts[0], parts[1], parts[2] ?? 0]);
        }
      }
    }
  }
  
  return lineStringCoords.length > 0 ? lineStringCoords : null;
}

// 智能采样
function sampleCoordinates(
  coordinates: number[][],
  targetPoints: number = 300
): Array<[number, number, number]> {
  if (coordinates.length <= targetPoints) {
    return coordinates as Array<[number, number, number]>;
  }

  let totalDistance = 0;
  const distances: number[] = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const dist = calculateDistance(prev[1], prev[0], curr[1], curr[0]);
    totalDistance += dist;
    distances.push(totalDistance);
  }

  const interval = totalDistance / (targetPoints - 1);
  const sampled: Array<[number, number, number]> = [coordinates[0] as [number, number, number]];
  let nextDistance = interval;
  let currentIndex = 0;

  for (let i = 1; i < targetPoints - 1; i++) {
    while (currentIndex < distances.length - 1 && distances[currentIndex] < nextDistance) {
      currentIndex++;
    }
    
    if (currentIndex < coordinates.length) {
      sampled.push(coordinates[currentIndex] as [number, number, number]);
    }
    nextDistance += interval;
  }

  sampled.push(coordinates[coordinates.length - 1] as [number, number, number]);
  return sampled;
}

// 生成海拔数据
function generateElevationData(
  coordinates: Array<[number, number, number]>,
  totalDistance: number
): ElevationPoint[] {
  const points: ElevationPoint[] = [];
  let currentDistance = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const coord = coordinates[i];
    const elevation = coord[2] ?? 0;
    
    points.push({
      distance: Math.round(currentDistance),
      elevation: Math.round(elevation),
    });

    if (i < coordinates.length - 1) {
      const next = coordinates[i + 1];
      const dist = calculateDistance(coord[1], coord[0], next[1], next[0]);
      currentDistance += dist;
    }
  }

  return points;
}

// 解析单个文件
function parseFile(filePath: string): RouteData | null {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  
  console.log(`  📄 解析: ${fileName}`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const xml = new DOMParser().parseFromString(content, 'text/xml');

    let coordinates: number[][] = [];

    if (ext === '.kml') {
      // 优先解析 gx:Track
      const trackCoords = extractKMLTrackCoordinates(xml);
      if (trackCoords) {
        coordinates = trackCoords;
      } else {
        // 使用 togeojson 作为备用
        const geojson = kml(xml);
        for (const feature of geojson.features) {
          const geom = feature.geometry;
          if (geom.type === 'LineString') {
            coordinates.push(...geom.coordinates);
          } else if (geom.type === 'MultiLineString') {
            for (const line of geom.coordinates) {
              coordinates.push(...line);
            }
          }
        }
      }
    } else {
      // GPX
      const geojson = gpx(xml);
      for (const feature of geojson.features) {
        const geom = feature.geometry;
        if (geom.type === 'LineString') {
          coordinates.push(...geom.coordinates);
        } else if (geom.type === 'MultiLineString') {
          for (const line of geom.coordinates) {
            coordinates.push(...line);
          }
        }
      }
    }

    if (coordinates.length < 2) {
      console.log(`  ⚠️  警告: ${fileName} 轨迹点太少 (${coordinates.length})`);
      return null;
    }

    console.log(`     原始轨迹点: ${coordinates.length}`);

    // 采样
    const sampled = sampleCoordinates(coordinates);
    
    // 计算总距离
    let totalDistance = 0;
    for (let i = 1; i < sampled.length; i++) {
      const prev = sampled[i - 1];
      const curr = sampled[i];
      totalDistance += calculateDistance(prev[1], prev[0], curr[1], curr[0]);
    }

    // 计算爬升
    const elevationGain = calculateElevationGain(coordinates);

    // 提取海拔范围
    const elevations = coordinates.map(c => c[2] ?? 0).filter(e => e !== 0);
    const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;
    const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;

    // 生成海拔数据
    const elevationData = generateElevationData(sampled, totalDistance);

    // 提取路径（不含海拔）
    const path: Array<[number, number]> = sampled.map(c => [c[0], c[1]]);

    // 估算时长（按 4km/h 平均速度 + 爬升时间 30min/500m）
    const duration = Math.round(
      (totalDistance / 1000) / 4 * 60 +
      (elevationGain / 500) * 30
    );

    // 从文件名生成默认名称和 id
    const baseName = fileName.replace(ext, '');
    const id = baseName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/^-+|-+$/g, '') || 'route-' + Date.now();

    return {
      id,
      fileName,
      name: baseName,
      distance: Math.round(totalDistance),
      duration,
      elevation: Math.round(elevationGain),
      elevationData,
      path,
      startLocation: [path[0][0], path[0][1]],
      endLocation: [path[path.length - 1][0], path[path.length - 1][1]],
      minElevation: Math.round(minElevation),
      maxElevation: Math.round(maxElevation),
    };

  } catch (error) {
    console.error(`  ❌ 错误: ${fileName} 解析失败`, error);
    return null;
  }
}

// 加载现有元数据
function loadExistingMeta(): Record<string, any> {
  if (fs.existsSync(META_FILE)) {
    try {
      const content = fs.readFileSync(META_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  return {};
}

// 生成 routes.ts 文件
function generateRoutesFile(routes: RouteData[], existingMeta: Record<string, any>) {
  const imports = `import type { Route, ElevationPoint } from '@/lib/store';\nimport routesMeta from './routes-meta.json';`;

  const routesArray = routes.map(route => {
    const meta = existingMeta[route.fileName] || {};
    
    return `  {
    id: '${route.id}',
    fileName: '${route.fileName}',
    name: routesMeta['${route.fileName}']?.name ?? '${route.name}',
    description: routesMeta['${route.fileName}']?.description ?? '',
    distance: ${route.distance},
    duration: ${route.duration},
    elevation: ${route.elevation},
    elevationData: ${JSON.stringify(route.elevationData)},
    minElevation: ${route.minElevation},
    maxElevation: ${route.maxElevation},
    path: ${JSON.stringify(route.path)},
    startLocation: ${JSON.stringify(route.startLocation)},
    endLocation: ${JSON.stringify(route.endLocation)},
    startName: routesMeta['${route.fileName}']?.startName ?? '起点',
    endName: routesMeta['${route.fileName}']?.endName ?? '终点',
    difficulty: (routesMeta['${route.fileName}']?.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
    type: (routesMeta['${route.fileName}']?.type as 'loop' | 'oneWay' | 'outAndBack') ?? 'oneWay',
    bestSeason: routesMeta['${route.fileName}']?.bestSeason ?? [],
    tags: routesMeta['${route.fileName}']?.tags ?? [],
    images: routesMeta['${route.fileName}']?.images ?? [],
  }`;
  }).join(',\n');

  const content = `${imports}

// 自动生成，请勿手动编辑此文件
// 运行 npm run import:routes 重新生成

export const routes: Route[] = [\n${routesArray}\n];

export function getAllRoutes(): Route[] {
  return routes;
}

export function getRouteById(id: string): Route | undefined {
  return routes.find(r => r.id === id);
}
`;

  fs.writeFileSync(ROUTES_FILE, content, 'utf-8');
  console.log(`\n✅ 已生成: ${ROUTES_FILE}`);
}

// 更新元数据文件
function updateMetaFile(routes: RouteData[], existingMeta: Record<string, any>) {
  const newMeta: Record<string, any> = { ...existingMeta };
  let hasNew = false;

  for (const route of routes) {
    if (!newMeta[route.fileName]) {
      newMeta[route.fileName] = {
        name: route.name,
        description: '',
        difficulty: 'medium',
        type: 'oneWay',
        startName: '起点',
        endName: '终点',
        bestSeason: [],
        tags: [],
        images: [],
      };
      hasNew = true;
      console.log(`  ➕ 新增元数据: ${route.fileName}`);
    }
  }

  // 清理已删除的（保留 _ 开头的说明字段）
  const currentFiles = new Set(routes.map(r => r.fileName));
  for (const key of Object.keys(newMeta)) {
    if (key.startsWith('_')) continue;
    if (!currentFiles.has(key)) {
      delete newMeta[key];
      console.log(`  🗑️  移除元数据: ${key}`);
    }
  }

  // 按文件名排序
  const sortedMeta: Record<string, any> = {};
  Object.keys(newMeta).sort().forEach(key => {
    sortedMeta[key] = newMeta[key];
  });

  const content = JSON.stringify(sortedMeta, null, 2);
  fs.writeFileSync(META_FILE, content, 'utf-8');
  console.log(`✅ 已更新: ${META_FILE}`);

  if (hasNew) {
    console.log('\n💡 提示: 有新增路线，请编辑 routes-meta.json 补充详细信息');
  }
}

// 主函数
async function main() {
  console.log('🗺️  路线导入工具\n');

  // 检查目录
  if (!fs.existsSync(GPX_DIR)) {
    console.log(`📁 创建目录: ${GPX_DIR}`);
    fs.mkdirSync(GPX_DIR, { recursive: true });
  }

  // 读取文件
  const files = fs.readdirSync(GPX_DIR)
    .filter(f => f.endsWith('.gpx') || f.endsWith('.kml'))
    .map(f => path.join(GPX_DIR, f));

  if (files.length === 0) {
    console.log('⚠️  未找到 GPX/KML 文件');
    console.log(`   请将文件放入: ${GPX_DIR}/`);
    process.exit(0);
  }

  console.log(`找到 ${files.length} 个文件:\n`);

  // 解析所有文件
  const routes: RouteData[] = [];
  for (const file of files) {
    const route = parseFile(file);
    if (route) {
      routes.push(route);
      console.log(`     📏 ${(route.distance / 1000).toFixed(1)}km | ⛰️ +${route.elevation}m | ⏱️ ${Math.round(route.duration / 60)}h${route.duration % 60}m | 📍 ${route.path.length}点\n`);
    }
  }

  if (routes.length === 0) {
    console.log('❌ 没有成功解析的路线');
    process.exit(1);
  }

  // 加载现有元数据
  const existingMeta = loadExistingMeta();

  // 生成文件
  generateRoutesFile(routes, existingMeta);
  updateMetaFile(routes, existingMeta);

  console.log(`\n🎉 成功导入 ${routes.length} 条路线!`);
  console.log('\n下一步:');
  console.log('  1. 编辑 lib/data/routes-meta.json 补充路线信息');
  console.log('  2. npm run dev 预览效果');
  console.log('  3. git add . && git commit -m "add: 新增路线"');
  console.log('  4. git push');
}

main().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
