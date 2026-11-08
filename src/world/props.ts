// 🌳 props.ts —道具 đường phố Đức bằng InstancedMesh (Protocol mục 4.5)
// tree / street_lamp / bench / bollard / trash_bin / litfasssaeule /
// parkscheinautomat / bike_rack / parked_car_static.
// Mỗi loại = 1 geometry gộp (vertex color) + 1 InstancedMesh → đếm draw call thấp.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GameMap, MapProp } from './mapLoader';
import { roadById, roadFullWidth } from './mapLoader';
import { palette } from '../art/palette';
import { pointAtS } from './mapLoader';

type RGB = [number, number, number];

function hexRGB(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// ── helper dựng geometry từ primitives, tô vertex color theo bộ phận ──
function colored(geo: THREE.BufferGeometry, c: RGB): THREE.BufferGeometry {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}
function at(geo: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry {
  geo.translate(x, y, z);
  return geo;
}

const BARK = hexRGB('#6b4f35');
const LEAF1 = hexRGB(palette.treeLeaf[0]);
const LEAF2 = hexRGB(palette.treeLeaf[1]);
const METAL = hexRGB('#5a5e63');
const METAL_DARK = hexRGB('#3a3d42');
const WOOD = hexRGB('#8a6b4a');
const BIN_GREEN = hexRGB('#3f6b45');
const COLUMN_CREAM = hexRGB(palette.wallCream);
const CAR_COLORS: RGB[] = [
  hexRGB('#8a9aa8'), hexRGB('#5a6b7a'), hexRGB('#a8a49c'),
  hexRGB('#4a5a4a'), hexRGB('#7a4a3a'), hexRGB('#3a4a5a')
];

/** Geometry gộp cho 1 loại prop — gốc tại (0,0,0), hướng +Z ra road */
function makePropGeometry(type: MapProp['type']): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  switch (type) {
    case 'tree': {
      parts.push(colored(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 6), BARK));
      parts[0].translate(0, 1.1, 0);
      const crown1 = new THREE.IcosahedronGeometry(1.6, 0);
      crown1.translate(0, 3.1, 0);
      parts.push(colored(crown1, LEAF1));
      const crown2 = new THREE.IcosahedronGeometry(1.1, 0);
      crown2.translate(0.3, 4.0, 0.2);
      parts.push(colored(crown2, LEAF2));
      break;
    }
    case 'street_lamp': {
      const pole = new THREE.CylinderGeometry(0.06, 0.09, 5.0, 6);
      pole.translate(0, 2.5, 0);
      parts.push(colored(pole, METAL_DARK));
      const arm = new THREE.BoxGeometry(0.08, 0.08, 1.4);
      arm.translate(0, 4.9, 0.6);
      parts.push(colored(arm, METAL_DARK));
      const head = new THREE.BoxGeometry(0.3, 0.12, 0.5);
      head.translate(0, 4.85, 1.2);
      parts.push(colored(head, hexRGB('#f2e6b8'))); // chạm đèn màu sáng
      break;
    }
    case 'bench': {
      const seat = new THREE.BoxGeometry(1.8, 0.08, 0.45);
      seat.translate(0, 0.45, 0);
      parts.push(colored(seat, WOOD));
      const back = new THREE.BoxGeometry(1.8, 0.35, 0.06);
      back.translate(0, 0.75, -0.22);
      parts.push(colored(back, WOOD));
      for (const x of [-0.7, 0.7]) {
        const leg = new THREE.BoxGeometry(0.08, 0.45, 0.4);
        leg.translate(x, 0.22, 0);
        parts.push(colored(leg, METAL_DARK));
      }
      break;
    }
    case 'bollard': {
      const b = new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8);
      b.translate(0, 0.45, 0);
      parts.push(colored(b, METAL_DARK));
      break;
    }
    case 'trash_bin': {
      const body = new THREE.CylinderGeometry(0.28, 0.22, 0.85, 8);
      body.translate(0, 0.45, 0);
      parts.push(colored(body, BIN_GREEN));
      const rim = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 8);
      rim.translate(0, 0.9, 0);
      parts.push(colored(rim, METAL_DARK));
      break;
    }
    case 'litfasssaeule': {
      const column = new THREE.CylinderGeometry(0.5, 0.55, 2.6, 10);
      column.translate(0, 1.3, 0);
      parts.push(colored(column, COLUMN_CREAM));
      const capTop = new THREE.CylinderGeometry(0.6, 0.5, 0.25, 10);
      capTop.translate(0, 2.7, 0);
      parts.push(colored(capTop, hexRGB('#7a6b52')));
      const base = new THREE.CylinderGeometry(0.65, 0.7, 0.3, 10);
      base.translate(0, 0.15, 0);
      parts.push(colored(base, hexRGB('#7a6b52')));
      break;
    }
    case 'parkscheinautomat': {
      const body = new THREE.BoxGeometry(0.35, 1.1, 0.25);
      body.translate(0, 0.75, 0);
      parts.push(colored(body, METAL));
      const head = new THREE.BoxGeometry(0.4, 0.35, 0.3);
      head.translate(0, 1.45, 0);
      parts.push(colored(head, METAL_DARK));
      break;
    }
    case 'bike_rack': {
      for (const z of [-0.6, 0, 0.6]) {
        const tube = new THREE.TorusGeometry(0.35, 0.03, 6, 12, Math.PI);
        tube.rotateY(Math.PI / 2);
        tube.translate(0, 0.35, z);
        parts.push(colored(tube, METAL));
      }
      break;
    }
    case 'parked_car_static': {
      // xe box đơn giản (Prompt 5 thay bằng GLB) — dài 4.2, rộng 1.7, cao 1.45
      const body = new THREE.BoxGeometry(1.7, 0.55, 4.2);
      body.translate(0, 0.55, 0);
      parts.push(colored(body, CAR_COLORS[0])); // tint per-instance bằng instanceColor
      const cabin = new THREE.BoxGeometry(1.55, 0.5, 2.2);
      cabin.translate(0, 1.05, -0.1);
      parts.push(colored(cabin, hexRGB(palette.window)));
      break;
    }
  }
  return mergeGeometries(parts, false) || new THREE.BufferGeometry();
}

/** Offset(prop) từ tim đường: đứng trên vỉa hè; parked_car nằm trong làn đỗ */
function propOffset(type: MapProp['type'], road: ReturnType<typeof roadById>): number {
  if (!road) return 5;
  const half = roadFullWidth(road) / 2;
  if (type === 'parked_car_static') return half - 0.95; // trong làn đỗ song song
  if (type === 'street_lamp') return half + 0.55;       // sát curb
  return half + 1.2;                                     // giữa vỉa hè
}

export interface PropsResult {
  group: THREE.Group;
  dispose: () => void;
}

/** Đặt props từ map.props[] — mỗi loại 1 InstancedMesh */
export function placeProps(scene: THREE.Scene, map: GameMap): PropsResult {
  const group = new THREE.Group();
  group.name = 'props_v2';

  // gom theo loại
  const byType = new Map<MapProp['type'], Array<{ x: number; z: number; yaw: number; seedIdx: number }>>();
  let idx = 0;
  for (const prop of map.props as MapProp[]) {
    const road = roadById(map, prop.roadId);
    if (!road) continue;
    const pt = pointAtS(road, prop.s);
    const side = prop.side === 'right' ? 1 : -1;
    const off = propOffset(prop.type, road);
    // flow = (sin h, cos h) → phải flow = (−cos h, sin h)
    const fx = Math.sin(pt.heading);
    const fz = Math.cos(pt.heading);
    const rx = -fz;
    const rz = fx;
    const x = pt.x + rx * side * off;
    const z = pt.z + rz * side * off;
    // hướng prop: mặt +Z local quay về road → yaw = atan2(rx·side, rz·side)... parked car dọc đường
    const yaw = prop.type === 'parked_car_static'
      ? Math.atan2(fx, fz)
      : Math.atan2(-rx * side, -rz * side) + Math.PI;
    if (!byType.has(prop.type)) byType.set(prop.type, []);
    byType.get(prop.type)!.push({ x, z, yaw, seedIdx: idx++ });
  }

  for (const [type, items] of byType) {
    if (!items.length) continue;
    const geo = makePropGeometry(type);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const inst = new THREE.InstancedMesh(geo, mat, items.length);
    inst.castShadow = true;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3();
    items.forEach((it, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.yaw);
      pos.set(it.x, 0, it.z);
      m.compose(pos, q, scale);
      inst.setMatrixAt(i, m);
      if (type === 'parked_car_static') {
        const c = CAR_COLORS[it.seedIdx % CAR_COLORS.length];
        inst.setColorAt(i, new THREE.Color(c[0], c[1], c[2]));
      } else if (type === 'tree') {
        // biến thể tán cây nhẹ theo instance
        const shade = 0.85 + ((it.seedIdx * 37) % 30) / 100;
        inst.setColorAt(i, new THREE.Color(shade, shade, shade));
      }
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.name = `props_${type}`;
    group.add(inst);
  }

  scene.add(group);
  return {
    group,
    dispose: () => {
      for (const c of group.children) {
        const im = c as THREE.InstancedMesh;
        im.geometry?.dispose();
        (im.material as THREE.Material)?.dispose();
      }
      scene.remove(group);
    }
  };
}
