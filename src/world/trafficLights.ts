// 🚦 trafficLights.ts — đèn giao thông Đức (Protocol mục 4.7)
// 3 đèn dọc đỏ/vàng/xanh, hộp đen, đèn phụ ở cột. Chu trình: đỏ → đỏ+vàng → xanh → vàng → đỏ.
// Pha đèn đọc từ TrafficLightController — đồ họa chỉ hiển thị trạng thái.
import * as THREE from 'three';
import type { GameMap, MapIntersection } from './mapLoader';
import { nodeById } from './mapLoader';
import { chunkKeyFor } from './chunkBuilder';

export type LightPhase = 'red' | 'red_yellow' | 'green' | 'yellow';

// ── TrafficLightController — logic pha riêng (đồ họa chỉ hiển thị) ──
export class TrafficLightController {
  private timer = 0;
  private phaseIdx = 0;
  private phases: Array<{ phase: LightPhase; duration: number }> = [];
  readonly nodeId: string;

  constructor(nodeId: string, green = 15, yellow = 3, red = 14) {
    this.nodeId = nodeId;
    this.phases = [
      { phase: 'red', duration: red },
      { phase: 'red_yellow', duration: yellow },
      { phase: 'green', duration: green },
      { phase: 'yellow', duration: yellow }
    ];
  }

  get currentPhase(): LightPhase {
    return this.phases[this.phaseIdx].phase;
  }

  update(dt: number): void {
    this.timer += dt;
    if (this.timer >= this.phases[this.phaseIdx].duration) {
      this.timer = 0;
      this.phaseIdx = (this.phaseIdx + 1) % this.phases.length;
    }
  }
}

// ── Tạo mesh đèn giao thông ──
export function createTrafficLightMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trafficLightGroup';

  const darkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

  // Cột 3.5 m
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 8), poleMat);
  pole.position.y = 1.75;
  group.add(pole);

  // Hộp đèn (3 đèn dọc) trên đỉnh cột
  const boxGeo = new THREE.BoxGeometry(0.28, 0.85, 0.22);
  const box = new THREE.Mesh(boxGeo, darkMat);
  box.position.y = 3.85;
  group.add(box);

  // 3 đèn: đỏ (top), vàng (mid), xanh (bottom)
  const lampGeo = new THREE.CircleGeometry(0.09, 12);
  const lampDir = new THREE.Vector3(0, 0, 1); // mặt đèn hướng +Z

  const createLamp = (color: number, y: number): THREE.Mesh => {
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(lampGeo, mat);
    mesh.position.set(0, y, 0.13);
    group.add(mesh);
    return mesh;
  };

  const redLamp = createLamp(0x450a0a, 4.1);
  const yelLamp = createLamp(0x451a03, 3.85);
  const grnLamp = createLamp(0x052e16, 3.6);

  // đèn phụ ở cột (dễ nhìn từ xe)
  const poleRedGeo = new THREE.CircleGeometry(0.07, 12);
  const poleRed = new THREE.Mesh(poleRedGeo, new THREE.MeshBasicMaterial({ color: 0x450a0a }));
  poleRed.position.set(0, 1.4, 0.1);
  group.add(poleRed);

  // userData cho TrafficLightController điều khiển
  group.userData._redLamp = redLamp;
  group.userData._yelLamp = yelLamp;
  group.userData._grnLamp = grnLamp;
  group.userData._poleRed = poleRed;

  return group;
}

function pointInAnyRoad(x: number, z: number, map: GameMap, margin = 0.4): boolean {
  for (const r of map.roads) {
    const half = (r.lanesForward + r.lanesBackward) * r.laneWidth / 2;
    const pts = r.points;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], az = pts[i - 1][1];
      const bx = pts[i][0], bz = pts[i][1];
      const dx = bx - ax, dz = bz - az;
      const l2 = dx * dx + dz * dz;
      if (l2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const px = ax + t * dx, pz = az + t * dz;
      if (Math.hypot(x - px, z - pz) < half + margin) return true;
    }
  }
  return false;
}

// ── Đặt đèn tự động từ intersections[] có trafficLight ──
// Mỗi approach (luồng xe ĐẾN node) = 1 đèn đứng bên PHẢI luồng, mặt quay về xe đang tới.
// Trả lightsByCell: đèn gắn theo chunk cell → chunkManager nạp/hủy theo camera (G5).
export function placeTrafficLights(scene: THREE.Scene, map: GameMap): {
  controllers: TrafficLightController[];
  lightsByCell: Map<string, THREE.Group[]>;
  allLightGroups: THREE.Group[];
} {
  const controllers: TrafficLightController[] = [];
  const lightsByCell = new Map<string, THREE.Group[]>();
  const allLightGroups: THREE.Group[] = [];

  for (const ix of map.intersections as MapIntersection[]) {
    if (!ix.trafficLight) continue;
    const node = nodeById(map, ix.nodeId);
    if (!node) continue;
    const controller = new TrafficLightController(ix.nodeId, ix.trafficLight.greenSeconds, ix.trafficLight.yellowSeconds, ix.trafficLight.redSeconds);
    controllers.push(controller);

    // Mỗi road chạm node → 2 approach (chiều xuôi và chiều ngược nếu 2 chiều)
    for (const rd of map.roads) {
      const touches = rd.from === ix.nodeId || rd.to === ix.nodeId;
      if (!touches) continue;
      const approaches: Array<{ fx: number; fz: number; laneOff: number }> = [];
      const n = rd.points.length;
      if (rd.to === ix.nodeId) {
        // luồng xuôi chạy từ from → to: hướng pts[last] − pts[last−1]
        const dx = rd.points[n - 1][0] - rd.points[n - 2][0];
        const dz = rd.points[n - 1][1] - rd.points[n - 2][1];
        const l = Math.hypot(dx, dz) || 1;
        approaches.push({ fx: dx / l, fz: dz / l, laneOff: (rd.lanesForward - 0.5) * rd.laneWidth });
      }
      if (rd.from === ix.nodeId && rd.lanesBackward > 0) {
        // luồng ngược chạy to → from (đến node từ phía to): hướng pts[0] − pts[1]
        const dx = rd.points[0][0] - rd.points[1][0];
        const dz = rd.points[0][1] - rd.points[1][1];
        const l = Math.hypot(dx, dz) || 1;
        approaches.push({ fx: dx / l, fz: dz / l, laneOff: (rd.lanesBackward - 0.5) * rd.laneWidth });
      }
      for (const ap of approaches) {
        void ap.laneOff; // MVP: đèn đặt ngoài mép đường, không bám tim lane
        const half = (rd.lanesForward + rd.lanesBackward) * rd.laneWidth / 2;
        const reach = half + 1; // mép patch giao lộ (khớp junctionPatchQuads)
        // PHẢI luồng tới: R = (−fz, fx)
        const rnx = -ap.fz;
        const rnz = ap.fx;
        const tl = createTrafficLightMesh();
        // góc gần bên phải: lùi 1 reach dọc flow (đúng cạnh vạch dừng) + lệch phải ngoài mép đường
        let lx = node.x - ap.fx * reach + rnx * (half + 2.2);
        let lz = node.z - ap.fz * reach + rnz * (half + 2.2);
        if (pointInAnyRoad(lx, lz, map)) {
          let placed = false;
          for (const extraReach of [2, 4, 6]) {
            const testX = node.x - ap.fx * (reach + extraReach) + rnx * (half + 1.2);
            const testZ = node.z - ap.fz * (reach + extraReach) + rnz * (half + 1.2);
            if (!pointInAnyRoad(testX, testZ, map)) {
              lx = testX;
              lz = testZ;
              placed = true;
              break;
            }
          }
          if (!placed) continue;
        }
        tl.position.set(lx, 0, lz);
        // Mặt đèn hướng NGƯỢC flow (nhìn thấy từ xe đang tới)
        tl.rotation.y = Math.atan2(-ap.fx, -ap.fz);
        tl.userData.controller = controller;
        allLightGroups.push(tl);
        const cellKey = chunkKeyFor(lx, lz);
        if (!lightsByCell.has(cellKey)) lightsByCell.set(cellKey, []);
        lightsByCell.get(cellKey)!.push(tl);
      }
    }
  }

  return { controllers, lightsByCell, allLightGroups };
}

// ── Áp visual theo pha (gọi mỗi frame — chỉ đổi màu material) ──
export function applyLightVisuals(lightGroups: THREE.Group[]): void {
  for (const tl of lightGroups) {
    const ctrl = tl.userData.controller as TrafficLightController | undefined;
    if (!ctrl) continue;
    const phase = ctrl.currentPhase;
    const red = tl.userData._redLamp as THREE.Mesh | undefined;
    const yel = tl.userData._yelLamp as THREE.Mesh | undefined;
    const grn = tl.userData._grnLamp as THREE.Mesh | undefined;
    const poleRed = tl.userData._poleRed as THREE.Mesh | undefined;

    if (red) (red.material as THREE.MeshBasicMaterial).color.set(phase === 'red' ? 0xef4444 : phase === 'red_yellow' ? 0x7f1d1d : 0x450a0a);
    if (yel) (yel.material as THREE.MeshBasicMaterial).color.set(phase === 'yellow' ? 0xfbbf24 : phase === 'red_yellow' ? 0x92400e : 0x451a03);
    if (grn) (grn.material as THREE.MeshBasicMaterial).color.set(phase === 'green' ? 0x22c55e : 0x052e16);
    if (poleRed) (poleRed.material as THREE.MeshBasicMaterial).color.set(phase === 'red' ? 0xef4444 : 0x450a0a);
  }
}
