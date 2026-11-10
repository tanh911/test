// 🇩🇪 berlinMitte.ts — generator mô phỏng khu vực Mitte, Berlin (dựa trên cấu trúc thực tế)
// Vòng xuyến Alexanderplatz ở trung tâm, đường Unter den Linden (50 km/h) đi ngang,
// zona Tempo-30 ở khu vực sinh hoạt góc dưới-trái.
import type { GameMap, MapRoad, MapSign, MapIntersection, MapNode } from '../../world/mapLoader';

const SPACING = 100;
const GRID = 7; // 7×7 node = 600m × 600m
const HALF = (GRID - 1) / 2 * SPACING;
const CENTER = (GRID - 1) / 2; // index 3 = Alexanderplatz

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isAlexanderplatz = (i: number, j: number) => i === CENTER && j === CENTER;
const isUnterDenLinden = (j: number) => j === CENTER; // đường ngang giữa
const isTempo30Zone = (i: number, j: number) => i <= 2 && j <= 2; // góc dưới-trái

export function generateBerlinMitteMap(): GameMap {
  const rand = mulberry(20241110);
  const nodeId = (i: number, j: number) => `b${i}_${j}`;

  const nodes: GameMap['nodes'] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const isEdge = i === 0 || j === 0 || i === GRID - 1 || j === GRID - 1;
      const isCross = i > 0 && i < GRID - 1 && j > 0 && j < GRID - 1;
      nodes.push({
        id: nodeId(i, j),
        x: i * SPACING - HALF,
        z: j * SPACING - HALF,
        type: isCross || (isEdge && (i % 2 === 0 || j % 2 === 0)) ? 'intersection' : 'end',
      });
    }
  }

  const roads: MapRoad[] = [];
  const signs: MapSign[] = [];
  const buildings: GameMap['buildings'] = [];
  const props: GameMap['props'] = [];
  const intersections: MapIntersection[] = [];
  const styles: Array<'altbau' | 'backstein' | 'neubau'> = ['altbau', 'backstein', 'neubau'];
  const propTypes: GameMap['props'][number]['type'][] = [
    'street_lamp', 'tree', 'bollard', 'trash_bin', 'bench', 'litfasssaeule',
  ];

  // ── Đường ngang ──
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID - 1; i++) {
      const cross = (i + j) % 2 === 0;
      if (!cross && i % 3 !== 0) continue;
      const in30 = isTempo30Zone(i, j) || isTempo30Zone(i + 1, j);
      const isUDL = isUnterDenLinden(j);
      roads.push({
        id: `h_${i}_${j}`,
        from: nodeId(i, j),
        to: nodeId(i + 1, j),
        points: [
          [i * SPACING - HALF, j * SPACING - HALF],
          [(i + 1) * SPACING - HALF, j * SPACING - HALF],
        ],
        lanesForward: isUDL ? 2 : 1,
        lanesBackward: isUDL ? 1 : 1,
        laneWidth: in30 ? 2.5 : 3.0,
        sidewalk: { left: true, right: true },
        bikeLane: { left: false, right: false },
        parking: { left: i % 2 === 0 ? 'parallel' : 'none', right: i % 3 === 0 ? 'parallel' : 'none' },
        speedLimit: isUDL ? 50 : in30 ? 30 : 50,
        priority: isUDL ? 'main' : 'equal',
        surface: in30 ? 'asphalt_worn' : 'asphalt',
      });
    }
  }
  // ── Đường dọc ──
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID - 1; j++) {
      const cross = (i + j) % 2 === 0;
      if (!cross && j % 3 !== 0) continue;
      const in30 = isTempo30Zone(i, j) || isTempo30Zone(i, j + 1);
      roads.push({
        id: `v_${i}_${j}`,
        from: nodeId(i, j),
        to: nodeId(i, j + 1),
        points: [
          [i * SPACING - HALF, j * SPACING - HALF],
          [i * SPACING - HALF, (j + 1) * SPACING - HALF],
        ],
        lanesForward: 1,
        lanesBackward: 1,
        laneWidth: in30 ? 2.5 : 3.0,
        sidewalk: { left: true, right: true },
        bikeLane: { left: false, right: false },
        parking: { left: 'none', right: j % 2 === 0 ? 'parallel' : 'none' },
        speedLimit: in30 ? 30 : 50,
        priority: 'equal',
        surface: in30 ? 'asphalt_worn' : 'asphalt',
      });
    }
  }

  // ── Giao lộ ──
  let liCount = 0;
  for (const n of nodes) {
    const inner = n.x > -HALF && n.x < HALF && n.z > -HALF && n.z < HALF;
    if (!inner) continue;
    liCount++;
    const roundabout = isAlexanderplatz(
      Math.round((n.x + HALF) / SPACING),
      Math.round((n.z + HALF) / SPACING),
    );
    let rule: MapIntersection['rule'];
    let trafficLight: MapIntersection['trafficLight'] | null;
    if (roundabout) {
      rule = 'roundabout';
      trafficLight = null;
    } else if (liCount % 4 === 0) {
      rule = 'traffic_light';
      trafficLight = { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 };
    } else if (liCount % 3 === 0) {
      rule = 'right_before_left';
      trafficLight = null;
    } else {
      rule = 'priority_road';
      trafficLight = null;
    }
    const in30 = isTempo30Zone(
      Math.round((n.x + HALF) / SPACING),
      Math.round((n.z + HALF) / SPACING),
    );
    // crosswalks tại giao lộ trongzona Tempo-30
    const cwRoads = in30
      ? roads.filter((rd) => rd.from === n.id || rd.to === n.id).map((rd) => rd.id)
      : [];
    intersections.push({
      nodeId: n.id,
      rule,
      trafficLight,
      crosswalks: cwRoads,
    });
  }

  // ── Biển báo ──
  // '215' Kreisverkehr trước mỗi approach dẫn vào Alexanderplatz
  const rbNode = nodeId(CENTER, CENTER);
  for (const rd of roads) {
    if (rd.from === rbNode || rd.to === rbNode) {
      const len = Math.hypot(
        rd.points[1][0] - rd.points[0][0],
        rd.points[1][1] - rd.points[0][1],
      );
      const s = rd.from === rbNode ? len - 8 : 8;
      signs.push({ type: '215', roadId: rd.id, s, side: 'right', value: undefined });
    }
  }

  // '274' value 30 ở ranh giới zona Tempo-30
  let sign30Placed = new Set<string>();
  for (const rd of roads) {
    const nFrom = nodes.find((n: MapNode) => n.id === rd.from);
    const nTo = nodes.find((n: MapNode) => n.id === rd.to);
    if (!nFrom || !nTo) continue;
    const iFrom = Math.round((nFrom.x + HALF) / SPACING);
    const jFrom = Math.round((nFrom.z + HALF) / SPACING);
    const iTo = Math.round((nTo.x + HALF) / SPACING);
    const jTo = Math.round((nTo.z + HALF) / SPACING);
    const fromIn30 = isTempo30Zone(iFrom, jFrom);
    const toIn30 = isTempo30Zone(iTo, jTo);

    if (fromIn30 !== toIn30) {
      const len = Math.hypot(
        rd.points[1][0] - rd.points[0][0],
        rd.points[1][1] - rd.points[0][1],
      );
      const s = fromIn30 ? len - 8 : 8;
      const roadId = rd.id;
      if (!sign30Placed.has(roadId)) {
        signs.push({ type: '274', roadId, s, side: 'right', value: 30 });
        sign30Placed.add(roadId);
      }
    }
    if (fromIn30 && toIn30) {
      signs.push({
        type: '274.1',
        roadId: rd.id,
        s: 50,
        side: 'right',
        value: undefined,
      });
    }
    // '350' Fußgängerüberweg tại mỗi crosswalk (zebra)
    if (fromIn30 && toIn30) {
      const len = Math.hypot(
        rd.points[1][0] - rd.points[0][0],
        rd.points[1][1] - rd.points[0][1],
      );
      signs.push({
        type: '350',
        roadId: rd.id,
        s: len / 2,
        side: 'right',
        value: undefined,
      });
    }
  }

  // ── Nhà + props ──
  let bi = 0;
  for (const rd of roads) {
    const side = bi % 2 === 0 ? 'left' : 'right';
    const style = styles[Math.floor(rand() * styles.length)];
    const dx = rd.points[1][0] - rd.points[0][0];
    const dz = rd.points[1][1] - rd.points[0][1];
    const len = Math.hypot(dx, dz);
    if (len > 60) {
      buildings.push({
        roadId: rd.id,
        side,
        s: 16, // lùi ra khỏi ngã tư
        length: 40,
        floors: 2 + Math.floor(rand() * 4),
        style,
        seed: 100 + bi,
      });
    }
    if (bi % 2 === 0) {
      props.push({
        type: propTypes[Math.floor(rand() * propTypes.length)],
        roadId: rd.id,
        s: 30,
        side: side === 'left' ? 'right' : 'left',
      });
    }
    bi++;
  }

  // Spawn player ở Unter den Linden hướng về Alexanderplatz
  const spawnRoad = roads.find((r) => r.id === `h_${CENTER - 1}_${CENTER}`) || roads[0];

  return {
    version: 1,
    nodes,
    roads,
    intersections,
    signs,
    buildings,
    props,
    spawns: { player: { roadId: spawnRoad.id, s: SPACING * 2, lane: 0 } },
  };
}
