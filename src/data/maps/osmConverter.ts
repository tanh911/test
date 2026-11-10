// 🗺️ osmConverter.ts — chuyển dữ liệu OpenStreetMap sang GameMap simulator
// Cách dùng: gọi Overpass API để lấy JSON, rồi truyền vào parseOSMToGameMap().
// Schema đầu ra khớp GameMap trong mapLoader.ts.
import type { GameMap, MapRoad, MapNode, MapIntersection, MapBuilding, MapProp, MapSign } from '../../world/mapLoader';

interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OSMWay {
  id: number;
  nodes: number[];
  tags: Record<string, string>;
}

/** Overpass QL query mẫu cho 1 bbox (lat_min, lon_min, lat_max, lon_max).
 *  Bạn có thể copy query này vào overpass-turbo.eu để lấy dữ liệu thật. */
export function overpassQuery(bbox: string): string {
  return `
    [out:json][timeout:60];
    (
      way["highway"](${bbox});
      node["highway"="traffic_signals"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;
}

/** Chuyển lat/lon sang mét local so với gốc (origin). 1 unit = 1 m. */
function toLocalMeters(lat: number, lon: number, originLat: number, originLon: number): [number, number] {
  const DEG_TO_M = 111320;
  const x = (lon - originLon) * Math.cos((originLat * Math.PI) / 180) * DEG_TO_M;
  const z = (lat - originLat) * DEG_TO_M;
  return [x, z];
}

/** Parse JSON Overpass (elements[]) thành GameMap. */
export function parseOSMToGameMap(
  elements: Array<{ type: string; id: number; lat?: number; lon?: number; nodes?: number[]; tags: Record<string, string> }>,
  originLat: number,
  originLon: number,
  spawnOsmNodeId?: number,
): GameMap {
  // ── Gom nodes OSM ──
  const osmNodes = new Map<number, OSMNode>();
  const ways: OSMWay[] = [];

  for (const el of elements) {
    if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
      osmNodes.set(el.id, { id: el.id, lat: el.lat, lon: el.lon, tags: el.tags ?? {} });
    } else if (el.type === 'way' && el.nodes) {
      ways.push({ id: el.id, nodes: el.nodes, tags: el.tags ?? {} });
    }
  }

  // Tính degree của mỗi node OSM (số way kết nối) → xác định giao lộ
  const nodeDegree = new Map<number, number>();
  for (const w of ways) {
    for (const nid of w.nodes) {
      nodeDegree.set(nid, (nodeDegree.get(nid) ?? 0) + 1);
    }
  }

  // ── Nodes GameMap ──
  const mapNodes: MapNode[] = [];
  const osmIdToMapId = new Map<number, string>();
  let nodeCounter = 0;
  let spawnMapId: string | undefined;

  for (const [osmId, deg] of nodeDegree) {
    const node = osmNodes.get(osmId);
    if (!node) continue;
    const [x, z] = toLocalMeters(node.lat, node.lon, originLat, originLon);
    const mapId = `n${nodeCounter++}`;
    osmIdToMapId.set(osmId, mapId);
    if (spawnOsmNodeId !== undefined && osmId === spawnOsmNodeId) {
      spawnMapId = mapId;
    }
    mapNodes.push({
      id: mapId,
      x,
      z,
      type: deg >= 3 || node.tags.highway === 'traffic_signals' ? 'intersection' : 'end',
    });
  }

  // ── Roads GameMap ──
  const mapRoads: MapRoad[] = [];
  const intersections: MapIntersection[] = [];
  const signs: MapSign[] = [];

  let roadCounter = 0;
  for (const w of ways) {
    const highway = w.tags.highway;
    if (!highway) continue;

    const validNodes = w.nodes.filter((nid) => osmIdToMapId.has(nid));
    if (validNodes.length < 2) continue;

    const points: [number, number][] = validNodes.map((nid) => {
      const node = osmNodes.get(nid)!;
      return toLocalMeters(node.lat, node.lon, originLat, originLon);
    });

    // Tốc độ từ tag maxspeed (mặc định 50 km/h nội thành Đức)
    let speedLimit = 50;
    if (w.tags.maxspeed) {
      const parsed = parseInt(w.tags.maxspeed, 10);
      if (!isNaN(parsed)) speedLimit = parsed;
    }

    const lanes = w.tags.lanes ? parseInt(w.tags.lanes, 10) : 1;
    const lanesForward = w.tags.oneway === 'yes' ? lanes : Math.ceil(lanes / 2);
    const lanesBackward = w.tags.oneway === 'yes' ? 0 : Math.floor(lanes / 2);

    const roadId = `r${roadCounter++}`;
    mapRoads.push({
      id: roadId,
      from: osmIdToMapId.get(validNodes[0])!,
      to: osmIdToMapId.get(validNodes[validNodes.length - 1])!,
      points,
      lanesForward,
      lanesBackward,
      laneWidth: 3.0,
      sidewalk: { left: true, right: true },
      bikeLane: { left: false, right: false },
      parking: { left: 'none', right: 'none' },
      speedLimit,
      priority: 'equal',
      surface: 'asphalt',
    });

    // Gán rule cho giao lộ
    for (const [nid, mapId] of [
      [validNodes[0], osmIdToMapId.get(validNodes[0])],
      [validNodes[validNodes.length - 1], osmIdToMapId.get(validNodes[validNodes.length - 1])],
    ] as const) {
      if (!mapId) continue;
      const already = intersections.find((i) => i.nodeId === mapId);
      const node = osmNodes.get(nid);
      if (!node) continue;
      if (!already) {
        const isTrafficLight = node.tags.highway === 'traffic_signals';
        intersections.push({
          nodeId: mapId,
          rule: isTrafficLight ? 'traffic_light' : 'right_before_left',
          trafficLight: isTrafficLight
            ? { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 }
            : null,
          crosswalks: [],
        });
      }
    }
  }

  // ── Buildings (bỏ trống, có thể bổ sung từ way["building"]) ──
  const buildings: MapBuilding[] = [];
  const props: MapProp[] = [];

  // Chọn spawn road: ưu tiên road chứa spawnOsmNodeId, fallback mapRoads[0]
  let spawnRoadId = mapRoads[0]?.id ?? '';
  if (spawnMapId) {
    const spawnRoad = mapRoads.find((r) => r.from === spawnMapId || r.to === spawnMapId);
    if (spawnRoad) spawnRoadId = spawnRoad.id;
  }

  return {
    version: 1,
    nodes: mapNodes,
    roads: mapRoads,
    intersections,
    signs,
    buildings,
    props,
    spawns: {
      player: {
        roadId: spawnRoadId,
        s: 10,
        lane: 0,
      },
    },
  };
}
