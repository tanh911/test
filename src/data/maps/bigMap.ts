// 🗺️ bigMap.ts — generator map lưới 2km×2km (Protocol Prompt 6 / G5)
// Đường grid mỗi 100m, giao lộ luân phiên luật, nhà + props trải đều.
// CHỈ dùng cho dev verify chunk streaming (?big=1) — production dùng map.json thật.
import type { GameMap, MapRoad, MapSign } from './mapLoader';

const SPACING = 100;
const GRID = 21; // 21×21 node = 2000m
const HALF = (GRID - 1) / 2 * SPACING;

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateBigMap(): GameMap {
  const rand = mulberry(20241108);
  const nodes: GameMap['nodes'] = [];
  const nodeId = (i: number, j: number) => `g${i}_${j}`;

  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const isEdge = i === 0 || j === 0 || i === GRID - 1 || j === GRID - 1;
      const isCross = i > 0 && i < GRID - 1 && j > 0 && j < GRID - 1;
      nodes.push({
        id: nodeId(i, j),
        x: i * SPACING - HALF,
        z: j * SPACING - HALF,
        type: isCross || isEdge && (i % 2 === 0 || j % 2 === 0) ? 'intersection' : 'end'
      });
    }
  }

  const roads: MapRoad[] = [];
  const signs: MapSign[] = [];
  const buildings: GameMap['buildings'] = [];
  const props: GameMap['props'] = [];
  const intersections: GameMap['intersections'] = [];
  const styles: Array<'altbau' | 'backstein' | 'neubau'> = ['altbau', 'backstein', 'neubau'];
  const propTypes: GameMap['props'][number]['type'][] = [
    'street_lamp', 'tree', 'bollard', 'trash_bin', 'bench', 'litfasssaeule'
  ];

  // road ngang + dọc giữa các node
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID - 1; i++) {
      const cross = (i + j) % 2 === 0;
      if (!cross && i % 3 !== 0) continue; // không phải hàng toàn đường
      roads.push({
        id: `h_${i}_${j}`,
        from: nodeId(i, j),
        to: nodeId(i + 1, j),
        points: [[i * SPACING - HALF, j * SPACING - HALF], [(i + 1) * SPACING - HALF, j * SPACING - HALF]],
        lanesForward: 1,
        lanesBackward: 1,
        laneWidth: 3.0,
        sidewalk: { left: true, right: true },
        bikeLane: { left: false, right: false },
        parking: { left: i % 2 === 0 ? 'parallel' : 'none', right: i % 3 === 0 ? 'parallel' : 'none' },
        speedLimit: 50,
        priority: 'equal',
        surface: 'asphalt'
      });
    }
  }
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID - 1; j++) {
      const cross = (i + j) % 2 === 0;
      if (!cross && j % 3 !== 0) continue;
      roads.push({
        id: `v_${i}_${j}`,
        from: nodeId(i, j),
        to: nodeId(i, j + 1),
        points: [[i * SPACING - HALF, j * SPACING - HALF], [i * SPACING - HALF, (j + 1) * SPACING - HALF]],
        lanesForward: 1,
        lanesBackward: 1,
        laneWidth: 3.0,
        sidewalk: { left: true, right: true },
        bikeLane: { left: false, right: false },
        parking: { left: 'none', right: j % 2 === 0 ? 'parallel' : 'none' },
        speedLimit: 50,
        priority: 'equal',
        surface: 'asphalt'
      });
    }
  }

  // giao lộ: node trong lòng — luân phiên luật
  let liCount = 0;
  for (const n of nodes) {
    if (n.type !== 'intersection' || (n.x === 0 && n.z === 0)) {
      if (!(n.x === 0 && n.z === 0)) continue;
    }
    const inner = n.x > -HALF && n.x < HALF && n.z > -HALF && n.z < HALF;
    if (!inner) continue;
    liCount++;
    const rule = liCount % 5 === 0 ? 'traffic_light' : liCount % 3 === 0 ? 'right_before_left' : 'priority_road';
    intersections.push({
      nodeId: n.id,
      rule: rule as GameMap['intersections'][number]['rule'],
      trafficLight: rule === 'traffic_light'
        ? { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 }
        : null,
      crosswalks: liCount % 2 === 0 ? [] : []
    });
  }
  // giao lộ trung tâm = đèn giao thông (spawn)
  intersections.push({
    nodeId: nodeId(10, 10),
    rule: 'traffic_light',
    trafficLight: { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 },
    crosswalks: []
  });

  // nhà + props dọc road (mỗi road 1 nhà + 1 prop xen kẽ)
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
        s: 8,
        length: 50,
        floors: 2 + Math.floor(rand() * 4),
        style,
        seed: 100 + bi
      });
    }
    if (bi % 2 === 0) {
      props.push({
        type: propTypes[Math.floor(rand() * propTypes.length)],
        roadId: rd.id,
        s: 30,
        side: side === 'left' ? 'right' : 'left'
      });
    }
    bi++;
  }

  return {
    version: 1,
    nodes,
    roads,
    intersections,
    signs,
    buildings,
    props,
    spawns: { player: { roadId: 'v_10_9', s: 80, lane: 0 } }
  };
}
