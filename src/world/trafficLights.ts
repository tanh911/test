// 🚦 trafficLights.ts — đèn giao thông Đức (Protocol mục 4.7)
// 3 đèn dọc đỏ/vàng/xanh, hộp đen, đèn phụ ở cột. Chu trình: đỏ → đỏ+vàng → xanh → vàng → đỏ.
// Pha đèn đọc từ TrafficLightController — đồ họa chỉ hiển thị trạng thái.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapIntersection } from './mapLoader';
import { nodeById } from './mapLoader';
import { chunkKeyFor } from './chunkBuilder';

export type LightPhase = 'red' | 'red_yellow' | 'green' | 'yellow';

// ── TrafficLightController — logic pha 2 NHÓM HƯỚNG xen kẽ (như ngã tư thật):
// nhóm A xanh → vàng → all-red → nhóm B xanh → vàng → all-red → lặp. Cột đèn
// đăng ký nhóm theo góc arms (registerArm — placeTrafficLights gán theo thứ tự
// góc xoay quanh node). Lệch pha giữa các NGÃ TƯ: timer khởi đầu = hash(nodeId)
// % chu kỳ → các ngã tư không còn đồng bộ cùng màu. ──
export class TrafficLightController {
  private timer: number;
  readonly nodeId: string;
  private green: number;
  private yellow: number;
  private allRed: number;
  private armGroups = new Map<string, 0 | 1>();

  constructor(nodeId: string, green = 15, yellow = 3, _redLegacy = 14) {
    this.nodeId = nodeId;
    this.green = green;
    this.yellow = yellow;
    this.allRed = 2; // all-red clearance giữa 2 nhóm hướng (StVO ~1-2 s)
    let h = 0;
    for (let i = 0; i < nodeId.length; i++) h = (h * 31 + nodeId.charCodeAt(i)) | 0;
    const cycle = 2 * (this.green + this.yellow + this.allRed);
    this.timer = (h >>> 0) % cycle;
  }

  /** Đăng ký nhóm hướng cho 1 approach (roadId + đầu tới node) */
  registerArm(roadId: string, end: 'from' | 'to', group: 0 | 1): void {
    this.armGroups.set(`${roadId}:${end}`, group);
  }

  /** Pha của 1 nhóm hướng (0 hoặc 1) tại thời điểm hiện tại */
  phaseFor(group: 0 | 1): LightPhase {
    const half = this.green + this.yellow + this.allRed;
    const cycle = 2 * half;
    const t = this.timer % cycle;
    const tt = group === 0 ? t : (t + half) % cycle;
    if (tt < this.green) return 'green';
    if (tt < this.green + this.yellow) return 'yellow';
    return 'red'; // vàng xong + all-red
  }

  /** Pha của approach cụ thể (road nào, tới node ở đầu nào) */
  phaseForArm(roadId: string, end: 'from' | 'to'): LightPhase {
    return this.phaseFor(this.armGroups.get(`${roadId}:${end}`) ?? 0);
  }

  /** Pha nhóm 0 — tương thích API cũ (MiniMap chấm đèn) */
  get currentPhase(): LightPhase {
    return this.phaseFor(0);
  }

  update(dt: number): void {
    this.timer += dt;
  }
}

// ── Tạo mesh đèn giao thông ──
export function createTrafficLightMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trafficLightGroup';

  const darkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

  // Cột thép đèn tín hiệu 3.75 m
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.75, 10), poleMat);
  pole.position.y = 1.875;
  group.add(pole);
  group.userData._pole = pole;

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

// ── Mô hình hộp đèn tín hiệu thật (CC0 — Stadt Rostock /3DModels): Ampel_Standard_Mast.glb ──
const ampelLoader = new GLTFLoader();
let ampelProto: Promise<THREE.Group | null> | null = null;
function loadAmpelModel(): Promise<THREE.Group | null> {
  if (!ampelProto) {
    ampelProto = ampelLoader.loadAsync('/simv2/ampel/Ampel_Standard_Mast.glb').then(g => {
      const grp = g.scene;
      grp.updateMatrixWorld(true);

      // Trong Ampel_Standard_Mast.glb gốc:
      // - Ngàm gắn cột (Masthalterung) nằm tại x ≈ 0
      // - Thân hộp đèn (Cube) ở x ≈ +0.14, mặt kính đèn (ampel_rot/gelb/gruen) ở x ≈ +0.28
      // - Vành che nắng (Sonnenblende) vươn về +X (x ≈ +0.44)
      // Do vành che nắng nhô xa hơn mặt đèn nên tâm bounding box chung lệch về trước mặt đèn,
      // khiến phép dò lc.x - wc.x trước đây bị âm và xoay ngược hộp đèn 180°!
      // Giải pháp chuẩn: bake matrixWorld vào geometry rồi xoay -90° quanh trục Y để mặt đèn hướng thẳng về +Z.
      const meshes: THREE.Mesh[] = [];
      grp.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) meshes.push(mesh);
      });

      for (const mesh of meshes) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.applyMatrix4(mesh.matrixWorld);
        mesh.geometry.rotateY(-Math.PI / 2);
      }

      grp.traverse(o => {
        o.position.set(0, 0, 0);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, 1, 1);
      });
      grp.updateMatrixWorld(true);

      // Chuẩn hóa chiều cao hộp đèn chính = 0.96 m (kích thước thật của Signalgeber Đức, gắn trên cột thép 3.75 m)
      const box = new THREE.Box3().setFromObject(grp);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scaleFactor = size.y > 0.01 ? 0.96 / size.y : 1;

      for (const mesh of meshes) {
        // Căn tâm X và Y về 0, giữ Z tính từ ngàm cột (box.min.z) để hộp đèn gắn sát phía trước cột thép
        mesh.geometry.translate(-center.x, -center.y, -box.min.z);
        mesh.geometry.scale(scaleFactor, scaleFactor, scaleFactor);
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }
      return grp;
    }).catch(() => null);
  }
  return ampelProto;
}

/** Gắn mô hình GLB hộp đèn chính (cao 3.25m) + hộp đèn phụ ngang tầm mắt tài xế (1.85m) lên cột thép */
async function upgradeLightWithModel(group: THREE.Group): Promise<void> {
  const proto = await loadAmpelModel();
  if (!proto) return;

  const pole = group.userData._pole as THREE.Mesh | undefined;
  // Ẩn các hình hộp/tròn placeholder bằng canvas nhưng GIỮ LẠI cột thép trụ
  for (const child of [...group.children]) {
    if (child !== pole) child.visible = false;
  }

  const glbMats: { rot: THREE.MeshLambertMaterial[]; gelb: THREE.MeshLambertMaterial[]; gruen: THREE.MeshLambertMaterial[] } = {
    rot: [],
    gelb: [],
    gruen: []
  };

  const attachSignalHead = (yPos: number, scale: number) => {
    const head = proto.clone(true);
    head.scale.setScalar(scale);
    head.position.set(0, yPos, 0.045);
    head.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const cloneMat = (m: THREE.Material) => {
        const cm = m.clone() as THREE.MeshLambertMaterial;
        if (cm.name === 'ampel_rot') glbMats.rot.push(cm);
        else if (cm.name === 'ampel_gelb') glbMats.gelb.push(cm);
        else if (cm.name === 'ampel_gruen') glbMats.gruen.push(cm);
        return cm;
      };
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(cloneMat);
      } else if (mesh.material) {
        mesh.material = cloneMat(mesh.material);
      }
    });
    group.add(head);
  };

  // Hộp đèn chính trên cao (3.22m) + hộp đèn phụ ngang tầm mắt (1.85m, chuẩn Đức Niedrigsignalgeber)
  attachSignalHead(3.22, 1.0);
  attachSignalHead(1.85, 0.65);

  group.userData._glbMats = glbMats;
  applyLightVisuals([group]);
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

    // Mỗi road chạm node → 2 approach (chiều xuôi và chiều ngược nếu 2 chiều).
    // Gom approach trước, sắp theo GÓC xoay quanh node → nhóm = idx % 2:
    // các hướng ĐỐI DIỆN cùng nhóm (Bắc-Nam cùng xanh), kề nhau khác nhóm.
    type Ap = { fx: number; fz: number; laneOff: number; road: typeof map.roads[number]; end: 'from' | 'to'; ang: number };
    const allAp: Ap[] = [];
    for (const rd of map.roads) {
      const touches = rd.from === ix.nodeId || rd.to === ix.nodeId;
      if (!touches) continue;
      const n = rd.points.length;
      if (rd.to === ix.nodeId) {
        const dx = rd.points[n - 1][0] - rd.points[n - 2][0];
        const dz = rd.points[n - 1][1] - rd.points[n - 2][1];
        const l = Math.hypot(dx, dz) || 1;
        const fx = dx / l, fz = dz / l;
        allAp.push({ fx, fz, laneOff: (rd.lanesForward - 0.5) * rd.laneWidth, road: rd, end: 'to', ang: Math.atan2(fz, fx) });
      }
      if (rd.from === ix.nodeId && rd.lanesBackward > 0) {
        const dx = rd.points[0][0] - rd.points[1][0];
        const dz = rd.points[0][1] - rd.points[1][1];
        const l = Math.hypot(dx, dz) || 1;
        const fx = dx / l, fz = dz / l;
        allAp.push({ fx, fz, laneOff: (rd.lanesBackward - 0.5) * rd.laneWidth, road: rd, end: 'from', ang: Math.atan2(fz, fx) });
      }
    }
    allAp.sort((a, b) => a.ang - b.ang);
    for (let ai = 0; ai < allAp.length; ai++) {
      const ap = allAp[ai];
      const group = (ai % 2) as 0 | 1;
      controller.registerArm(ap.road.id, ap.end, group);
      const rd = ap.road;
      {
        void ap.laneOff;
        const half = (rd.lanesForward + rd.lanesBackward) * rd.laneWidth / 2;
        const tl = createTrafficLightMesh();
        // ── Đặt đèn ĐI DỌC con đường tiếp cận (không bao giờ vào giữa ngã tư):
        // bắt đầu ngay mép junction (reach), lùi dọc road 2 m/bước tối đa 16 m;
        // mỗi vị trí = tim road + lệch PHẢI luồng (half + 1.6). Điểm phải thoáng
        // MỌI corridor road +0.5 m (như rule đặt biển). ──
        const n = rd.points.length;
        const len = (() => {
          let l = 0;
          for (let i = 1; i < n; i++) l += Math.hypot(rd.points[i][0] - rd.points[i - 1][0], rd.points[i][1] - rd.points[i - 1][1]);
          return l;
        })();
        const atTo = ap.end === 'to';
        const reach = half + 1;
        let lx = 0, lz = 0, placed = false;
        for (let back = 0; back <= 16 && !placed; back += 2) {
          const s = atTo ? Math.max(half + 1, len - half - 1 - back) : Math.min(len - half - 1, half + 1 + back);
          // nội suy polyline tới s
          let rem = s, ax = rd.points[0][0], az = rd.points[0][1], px = ax, pz = az, tx = 0, tz = 1;
          for (let i = 1; i < n; i++) {
            const bx = rd.points[i][0], bz = rd.points[i][1];
            const seg = Math.hypot(bx - ax, bz - az) || 1;
            if (rem <= seg) {
              const t = rem / seg;
              px = ax + (bx - ax) * t; pz = az + (bz - az) * t;
              tx = (bx - ax) / seg; tz = (bz - az) / seg;
              break;
            }
            rem -= seg; ax = bx; az = bz;
          }
          // flow vào node: atTo → flow hướng tăng s (tx,tz); from → hướng giảm (−tx,−tz)
          const sgn = atTo ? 1 : -1;
          const fx = tx * sgn, fz = tz * sgn;
          const rnx = -fz, rnz = fx;
          const candX = px + rnx * (half + 1.6);
          const candZ = pz + rnz * (half + 1.6);
          // thoáng mọi corridor (mép asphalt + 0.5 m)?
          let clear = true;
          for (const r2 of map.roads) {
            const h2 = (r2.lanesForward + r2.lanesBackward) * r2.laneWidth / 2;
            const pts2 = r2.points;
            for (let k = 1; k < pts2.length; k++) {
              const vx = pts2[k][0] - pts2[k - 1][0], vz = pts2[k][1] - pts2[k - 1][1];
              const l2 = vx * vx + vz * vz || 1;
              const t2 = Math.max(0, Math.min(1, ((candX - pts2[k - 1][0]) * vx + (candZ - pts2[k - 1][1]) * vz) / l2));
              if (Math.hypot(candX - (pts2[k - 1][0] + t2 * vx), candZ - (pts2[k - 1][1] + t2 * vz)) < h2 + 0.5) {
                clear = false;
                break;
              }
            }
            if (!clear) break;
          }
          if (clear) {
            lx = candX;
            lz = candZ;
            placed = true;
            // Xoay mặt đèn hướng thẳng về làn xe đang tiến tới (hơi nghiêng 6° vào tâm làn để tài xế nhìn trực diện)
            tl.rotation.y = Math.atan2(-fx, -fz) - 0.10;
          }
        }
        if (!placed) continue;
        tl.position.set(lx, 0, lz);
        tl.userData.controller = controller;
        tl.userData._groupIdx = group;
        allLightGroups.push(tl);
        const cellKey = chunkKeyFor(lx, lz);
        if (!lightsByCell.has(cellKey)) lightsByCell.set(cellKey, []);
        lightsByCell.get(cellKey)!.push(tl);
      }
    }
  }

  // Nâng cấp mô hình GLB async — canvas placeholder hiển thị ngay, model thay vào khi load xong
  for (const lg of allLightGroups) void upgradeLightWithModel(lg);

  return { controllers, lightsByCell, allLightGroups };
}

// ── Áp visual theo pha (gọi mỗi frame — chỉ đổi màu material) ──
export function applyLightVisuals(lightGroups: THREE.Group[]): void {
  for (const tl of lightGroups) {
    const ctrl = tl.userData.controller as TrafficLightController | undefined;
    if (!ctrl) continue;
    const phase = ctrl.phaseFor((tl.userData._groupIdx ?? 0) as 0 | 1);
    const red = tl.userData._redLamp as THREE.Mesh | undefined;
    const yel = tl.userData._yelLamp as THREE.Mesh | undefined;
    const grn = tl.userData._grnLamp as THREE.Mesh | undefined;
    const poleRed = tl.userData._poleRed as THREE.Mesh | undefined;

    if (red) (red.material as THREE.MeshBasicMaterial).color.set(phase === 'red' ? 0xef4444 : phase === 'red_yellow' ? 0x7f1d1d : 0x450a0a);
    if (yel) (yel.material as THREE.MeshBasicMaterial).color.set(phase === 'yellow' ? 0xfbbf24 : phase === 'red_yellow' ? 0x92400e : 0x451a03);
    if (grn) (grn.material as THREE.MeshBasicMaterial).color.set(phase === 'green' ? 0x22c55e : 0x052e16);
    if (poleRed) (poleRed.material as THREE.MeshBasicMaterial).color.set(phase === 'red' ? 0xef4444 : 0x450a0a);
    // ── Mô hình GLB (Rostock): material ampel_rot/gelb/gruen sáng/tắt theo pha ──
    const glb = tl.userData._glbMats as { rot: THREE.MeshLambertMaterial[]; gelb: THREE.MeshLambertMaterial[]; gruen: THREE.MeshLambertMaterial[] } | undefined;
    if (glb) {
      const setLamp = (mats: THREE.MeshLambertMaterial[], on: number, off: number, lit: boolean) => {
        for (const m of mats) {
          m.color.set(lit ? on : off);
          m.emissive?.set(lit ? on : 0x000000);
          if (m.emissive && lit) m.emissiveIntensity = 0.75;
        }
      };
      setLamp(glb.rot, 0xff2222, 0x4a0d0d, phase === 'red' || phase === 'red_yellow');
      setLamp(glb.gelb, 0xffc821, 0x4d3603, phase === 'yellow' || phase === 'red_yellow');
      setLamp(glb.gruen, 0x2ee56b, 0x0b3a1d, phase === 'green');
    }
  }
}
