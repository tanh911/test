// 🚶 pedestrianController.ts — người đi bộ Stadt (StVO §25)
// Đi dọc vỉa hè theo road curve offset ±(half + sidewalk), qua zebra khi có crosswalk.
// Tái dùng ped_1..8.glb từ /simv2/ (đã có trong demoAssets.ts).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapRoad } from './mapLoader';
import { roadById, pointAtS, roadLength } from './mapLoader';
import { roadsAtNode } from './roadMesh';

const PED_SPEED = 1.2; // m/s, đi bộ bình thường
const SIDEWALK_OFF = 0.9; // lệch ngoài mép đường (m)
const DESPAWN_DIST = 400; // cull xa camera

interface Ped {
  roadId: string;
  s: number;        // mét trên road (tính từ from)
  dir: 1 | -1;      // +1: from→to, −1: to→from
  side: 1 | -1;     // +1: phải flow, −1: trái flow (về phía vỉa hè)
  group: THREE.Group;
  waiting: boolean; // đang đợi qua zebra
  waitTimer: number; // bộ đếm ngược đợi zebra (s)
  nextChoice?: { road: MapRoad; dir: 1 | -1 } | null;
}

export class PedestrianController {
  private group = new THREE.Group();
  private templates: THREE.Group[] = [];
  private peds: Ped[] = [];
  private ready = false;
  private roadLen = new Map<string, number>();

  constructor(private scene: THREE.Scene, private map: GameMap) {
    this.group.name = 'pedestrians';
    scene.add(this.group);
  }

  init(): void {
    const loader = new GLTFLoader();
    const urls = Array.from({ length: 8 }, (_, i) => `/simv2/ped_${i + 1}.glb`);
    Promise.all(urls.map(u => this.loadGLB(loader, u).catch(() => null))).then(loaded => {
      for (const t of loaded) {
        if (t) {
          t.traverse(o => {
            const m = o as THREE.Mesh;
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = true;
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              for (const mat of mats) mat.side = THREE.FrontSide;
            }
          });
          this.templates.push(t);
        }
      }
      if (this.templates.length) {
        this.spawnPeds();
        this.ready = true;
      }
    });
  }

  private loadGLB(loader: GLTFLoader, url: string): Promise<THREE.Group | null> {
    return new Promise(resolve => {
      loader.load(url, gltf => resolve(gltf.scene), undefined, () => resolve(null));
    });
  }

  private len(roadId: string): number {
    let l = this.roadLen.get(roadId);
    if (l === undefined) {
      const r = roadById(this.map, roadId);
      l = r ? roadLength(r) : 0;
      this.roadLen.set(roadId, l);
    }
    return l;
  }

  private spawnPeds(): void {
    const roads = this.map.roads.filter(r => roadLength(r) > 30 && (r.sidewalk.left || r.sidewalk.right));
    let placed = 0;
    const maxPeds = 12;
    while (placed < maxPeds && roads.length) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      const len = this.len(road.id);
      const s = 5 + Math.random() * Math.max(1, len - 10);
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const side: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      this.peds.push(this.makePed(road, s, dir, side, placed));
      placed++;
    }
  }

  private makePed(road: MapRoad, s: number, dir: 1 | -1, side: 1 | -1, idx: number): Ped {
    const tpl = this.templates[idx % this.templates.length];
    const group = tpl.clone(true);
    group.name = `ped_${idx}`;
    this.group.add(group);
    return { roadId: road.id, s, dir, side, group, waiting: false, waitTimer: 0 };
  }

  /** Node phía trước ped theo dir */
  private nodeAhead(road: MapRoad, dir: 1 | -1): string {
    return dir > 0 ? road.to : road.from;
  }

  /** Chọn road kế tiếp tại node (không quay lui ngay road vừa đi, tránh dead-end) */
  private pickNextRoad(road: MapRoad, node: string): { road: MapRoad; dir: 1 | -1 } | null {
    const candidates = roadsAtNode(this.map, node).filter(r => r.road.id !== road.id);
    if (!candidates.length) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const dir: 1 | -1 = pick.road.from === node ? 1 : -1;
    return { road: pick.road, dir };
  }

  /** Pose ped trên vỉa hè: offset = side * (half + SIDEWALK_OFF) so với tim đường */
  private pose(road: MapRoad, s: number, dir: 1 | -1, side: 1 | -1): { x: number; z: number; ry: number } {
    const pt = pointAtS(road, s);
    const h = dir > 0 ? pt.heading : pt.heading + Math.PI;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    // phải flow = (−fz, fx); trái flow = (fz, −fx)
    const rx = side > 0 ? -fz : fz;
    const rz = side > 0 ? fx : -fz;
    const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
    return {
      x: pt.x + rx * (half + SIDEWALK_OFF),
      z: pt.z + rz * (half + SIDEWALK_OFF),
      ry: h + Math.PI // GLB ped mặt −Z → rotation.y = h + π
    };
  }

  update(dt: number): void {
    if (!this.ready) return;
    for (let i = 0; i < this.peds.length; i++) {
      const ped = this.peds[i];
      const road = roadById(this.map, ped.roadId);
      if (!road) continue;
      const len = this.len(ped.roadId);

      // Di dộng dọc vỉa hè (trừ khi đang đợi qua zebra)
      if (!ped.waiting) {
        ped.s += ped.dir * PED_SPEED * dt;
      } else {
        ped.waitTimer -= dt;
        if (ped.waitTimer <= 0) {
          ped.waiting = false;
          ped.waitTimer = 0;
        }
      }

      // Đã đến node phía trước?
      const nodeAheadId = this.nodeAhead(road, ped.dir);
      const distToNode = ped.dir > 0 ? len - ped.s : ped.s;
      const nearJunction = distToNode < 6;

      if (nearJunction && !ped.waiting) {
        // Có zebra (crosswalk) tại node này trên road hiện tại?
        const ix = this.map.intersections.find(j => j.nodeId === nodeAheadId);
        const hasZebra = ix ? ix.crosswalks.includes(road.id) : false;
        if (hasZebra) {
          ped.waiting = true;
          ped.waitTimer = 1.5; // chờ 1.5s tại zebra trước khi qua
        } else {
          // Chuyển sang road khác
          const next = this.pickNextRoad(road, nodeAheadId);
          if (next) {
            ped.roadId = next.road.id;
            ped.dir = next.dir;
            ped.s = ped.dir > 0 ? 2 : this.len(ped.roadId) - 2;
            // đổi sang vỉa hè ngẫu nhiên bên road mới
            ped.side = Math.random() < 0.5 ? 1 : -1;
          } else {
            // Cụt → quay lui
            ped.dir = (ped.dir * -1) as 1 | -1;
            ped.s = Math.max(1, Math.min(len - 1, ped.s));
          }
        }
      }

      // Ngoài road (qua node) → clamp
      if (ped.s > len) ped.s = len;
      if (ped.s < 0) ped.s = 0;

      // Pose
      const p = this.pose(road, ped.s, ped.dir, ped.side);
      ped.group.position.set(p.x, 0, p.z);
      ped.group.rotation.y = p.ry;

      // Cull xa camera (dùng camera position gần nhất nếu có — đơn giản: cull theo khoảng cách từ gốc)
      const dist = Math.hypot(p.x, p.z);
      ped.group.visible = dist < DESPAWN_DIST;
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
  }
}
