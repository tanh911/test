// 🗺️ Map loader — Protocol mục 3: map.json là NGUỒN DỮ LIỆU DUY NHẤT.
// Mọi generator (world/*) và rule engine đọc từ schema này. KHÔNG đổi schema nếu không báo trước.

export interface MapNode {
  id: string;
  x: number;
  z: number;
  type: 'intersection' | 'end';
}

export type ParkingType = 'parallel' | 'perpendicular' | 'none';
export type PriorityType = 'main' | 'give_way' | 'stop' | 'equal';
export type SurfaceType = 'asphalt' | 'asphalt_worn' | 'cobble';

export interface RoadSideFlag {
  left: boolean;
  right: boolean;
}

export interface RoadParking {
  left: ParkingType;
  right: ParkingType;
}

export interface MapRoad {
  id: string;
  from: string;
  to: string;
  points: [number, number][];
  lanesForward: number;
  lanesBackward: number;
  laneWidth: number;
  sidewalk: RoadSideFlag;
  bikeLane: RoadSideFlag;
  parking: RoadParking;
  speedLimit: number;
  priority: PriorityType;
  surface: SurfaceType;
}

export type IntersectionRule =
  | 'right_before_left'
  | 'priority_road'
  | 'yield'
  | 'stop'
  | 'traffic_light'
  | 'roundabout';

export interface TrafficLightSpec {
  cycle: 'standard'; // đỏ → đỏ+vàng → xanh → vàng → đỏ
  greenSeconds: number;
  yellowSeconds: number;
  redSeconds: number;
}

export interface MapIntersection {
  nodeId: string;
  rule: IntersectionRule;
  trafficLight: TrafficLightSpec | null;
  crosswalks: string[]; // roadId có zebrastreifen tại node này
}

export interface MapSign {
  type: string; // mã StVO: '205', '206', '306', '102', '274', '274.1', '220', '267', '283', '286', '314', '350', '101', '138', '215'
  roadId: string;
  s: number; // mét dọc đường tính từ node `from`
  side: 'left' | 'right';
  value?: number; // giá trị biển (274: tốc độ)
}

export interface MapBuilding {
  roadId: string;
  side: 'left' | 'right';
  s: number;
  length: number;
  floors: number;
  style: 'altbau' | 'backstein' | 'neubau';
  seed: number;
}

export interface MapProp {
  type: 'street_lamp' | 'tree' | 'bench' | 'bollard' | 'trash_bin' | 'litfasssaeule' | 'parkscheinautomat' | 'bike_rack' | 'parked_car_static';
  roadId: string;
  s: number;
  side: 'left' | 'right';
}

export interface MapSpawn {
  roadId: string;
  s: number;
  lane: number;
}

export interface GameMap {
  version: number;
  nodes: MapNode[];
  roads: MapRoad[];
  intersections: MapIntersection[];
  signs: MapSign[];
  buildings: MapBuilding[];
  props: MapProp[];
  spawns: { player: MapSpawn };
}

export function loadGameMap(json: unknown): GameMap {
  const map = json as GameMap;
  if (map.version !== 1) {
    throw new Error(`[mapLoader] Unsupported map version: ${map.version}`);
  }
  if (!Array.isArray(map.nodes) || !Array.isArray(map.roads)) {
    throw new Error('[mapLoader] map.json thiếu nodes/roads');
  }
  return map;
}

export function nodeById(map: GameMap, id: string): MapNode | undefined {
  return map.nodes.find((n) => n.id === id);
}

export function roadById(map: GameMap, id: string): MapRoad | undefined {
  return map.roads.find((r) => r.id === id);
}

/** Tổng chiều rộng mặt đường: (lanesForward + lanesBackward) × laneWidth */
export function roadFullWidth(road: MapRoad): number {
  return (road.lanesForward + road.lanesBackward) * road.laneWidth;
}

/** Điểm trên tim đường tại khoảng cách s (mét) tính từ node `from` — nội suy theo points */
export function pointAtS(road: MapRoad, s: number): { x: number; z: number; heading: number } {
  const pts = road.points;
  let remaining = Math.max(0, s);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const segLen = Math.hypot(x1 - x0, z1 - z0);
    if (remaining <= segLen || i === pts.length - 2) {
      const t = segLen > 0 ? Math.min(1, remaining / segLen) : 0;
      return {
        x: x0 + (x1 - x0) * t,
        z: z0 + (z1 - z0) * t,
        heading: Math.atan2(x1 - x0, z1 - z0)
      };
    }
    remaining -= segLen;
  }
  const [x, z] = pts[pts.length - 1];
  return { x, z, heading: 0 };
}
