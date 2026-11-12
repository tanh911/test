// 🚶 pedestrianController.ts — người đi bộ Stadt (StVO §25)
// Đi dọc vỉa hè theo road curve offset ±(half + sidewalk), qua zebra khi có crosswalk.
// Tái dùng ped_1..8.glb từ /simv2/ (đã có trong demoAssets.ts).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapRoad } from './mapLoader';
import { roadById, pointAtS, roadLength } from './mapLoader';
import { roadsAtNode } from './roadMesh';
import { spawnFromMap } from './vehicle';

const PED_SPEED = 1.25; // m/s, đi bộ bình thường
const SIDEWALK_OFF = 1.65; // lệch ngoài mép đường (m) — giữa vỉa hè ngoài
const DESPAWN_DIST = 600; // cull xa camera

interface Ped {
  roadId: string;
  s: number;        // mét trên road (tính từ from)
  dir: 1 | -1;      // +1: from→to, −1: to→from
  side: 1 | -1;     // +1: phải flow, −1: trái flow (về phía vỉa hè)
  group: THREE.Group;
  waiting: boolean; // đang đợi/đi qua zebra
  waitTimer: number; // bộ đếm ngược tại zebra (s)
  crossing?: boolean; // đang băng qua vạch kẻ đường
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
          // Chuẩn hoá chiều cao người đi bộ ~ 1.70m và đặt chân chạm mặt đất (y = 0)
          const box = new THREE.Box3().setFromObject(t);
          const sz = box.getSize(new THREE.Vector3());
          if (sz.y > 0.1) {
            const sc = 1.70 / sz.y;
            t.scale.setScalar(sc);
            t.position.y = -box.min.y * sc;
          }
          const wrap = new THREE.Group();
          wrap.add(t);
          this.templates.push(wrap);
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

  private pickSideForRoad(road: MapRoad): 1 | -1 {
    // Đường 1 chiều (đặc biệt là 2 làn tách đôi): vỉa hè ngoài luôn nằm bên phải chiều đi (+1)
    if (road.lanesBackward === 0) return 1;
    if (road.sidewalk.right && !road.sidewalk.left) return 1;
    if (road.sidewalk.left && !road.sidewalk.right) return -1;
    return Math.random() < 0.5 ? 1 : -1;
  }

  private spawnPeds(): void {
    const playerSpawn = spawnFromMap(this.map);
    const roads = this.map.roads.filter(r => roadLength(r) > 24 && (r.sidewalk.left || r.sidewalk.right));
    const nearbyRoads = roads.filter(r => {
      const mid = pointAtS(r, roadLength(r) * 0.5);
      return Math.hypot(mid.x - playerSpawn.x, mid.z - playerSpawn.z) < 160;
    });
    let placed = 0;
    const maxPeds = 56;
    while (placed < maxPeds && roads.length) {
      const pool = (placed < 16 && nearbyRoads.length > 0) ? nearbyRoads : roads;
      const road = pool[Math.floor(Math.random() * pool.length)];
      const len = this.len(road.id);
      const s = 5 + Math.random() * Math.max(1, len - 10);
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const side: 1 | -1 = this.pickSideForRoad(road);
      const ped = this.makePed(road, s, dir, side, placed);
      const p0 = this.pose(road, s, dir, side);
      ped.group.position.set(p0.x, 0.10, p0.z);
      ped.group.rotation.y = p0.ry;
      this.peds.push(ped);
      placed++;
    }
  }

  /** Kiểm tra có người đi bộ đang ở khu vực vạch qua đường gần xe người chơi không */
  isPedNearCrosswalk(px: number, pz: number, radius = 7.0): boolean {
    if (!this.ready) return false;
    for (const ped of this.peds) {
      if (!ped.waiting) continue;
      const d = Math.hypot(ped.group.position.x - px, ped.group.position.z - pz);
      if (d < radius) return true;
    }
    return false;
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

  /** Pose ped trên vỉa hè: side tính theo hướng gốc của road (+1 = vỉa hè phải, −1 = vỉa hè trái) */
  private pose(road: MapRoad, s: number, dir: 1 | -1, side: 1 | -1): { x: number; z: number; ry: number } {
    const pt = pointAtS(road, s);
    const h = dir > 0 ? pt.heading : pt.heading + Math.PI;
    const roadFx = Math.sin(pt.heading);
    const roadFz = Math.cos(pt.heading);
    const rx = side > 0 ? -roadFz : roadFz;
    const rz = side > 0 ? roadFx : -roadFx;
    const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
    return {
      x: pt.x + rx * (half + SIDEWALK_OFF),
      z: pt.z + rz * (half + SIDEWALK_OFF),
      ry: h + Math.PI // GLB ped mặt −Z → rotation.y = h + π
    };
  }

  private advanceToNextRoad(ped: Ped, road: MapRoad, nodeAheadId: string, len: number): void {
    const next = this.pickNextRoad(road, nodeAheadId);
    if (next) {
      ped.roadId = next.road.id;
      ped.dir = next.dir;
      ped.s = ped.dir > 0 ? 7 : Math.max(2, this.len(ped.roadId) - 7);
      ped.side = this.pickSideForRoad(next.road);
    } else {
      ped.dir = (ped.dir * -1) as 1 | -1;
      ped.s = ped.dir > 0 ? 7 : Math.max(2, len - 7);
    }
  }

  update(dt: number): void {
    if (!this.ready) return;
    for (let i = 0; i < this.peds.length; i++) {
      const ped = this.peds[i];
      const road = roadById(this.map, ped.roadId);
      if (!road) continue;
      const len = this.len(ped.roadId);
      const nodeAheadId = this.nodeAhead(road, ped.dir);

      // Di động dọc vỉa hè (trừ khi đang đợi qua zebra)
      if (!ped.waiting) {
        ped.s += ped.dir * PED_SPEED * dt;
      } else {
        ped.waitTimer -= dt;
        if (ped.waitTimer <= 0) {
          ped.waiting = false;
          ped.waitTimer = 0;
          this.advanceToNextRoad(ped, road, nodeAheadId, len);
        }
      }

      const curRoad = roadById(this.map, ped.roadId);
      if (!curRoad) continue;
      const curLen = this.len(ped.roadId);
      const curNodeAhead = this.nodeAhead(curRoad, ped.dir);
      const distToNode = ped.dir > 0 ? curLen - ped.s : ped.s;
      const nearJunction = distToNode < 5;

      if (nearJunction && !ped.waiting) {
        const ix = this.map.intersections.find(j => j.nodeId === curNodeAhead);
        const hasZebra = ix ? ix.crosswalks.includes(curRoad.id) : false;
        if (hasZebra) {
          ped.waiting = true;
          ped.waitTimer = 1.5;
        } else {
          this.advanceToNextRoad(ped, curRoad, curNodeAhead, curLen);
        }
      }

      const finalRoad = roadById(this.map, ped.roadId);
      if (!finalRoad) continue;
      const finalLen = this.len(ped.roadId);
      if (ped.s > finalLen) ped.s = finalLen;
      if (ped.s < 0) ped.s = 0;

      // Pose
      const p = this.pose(finalRoad, ped.s, ped.dir, ped.side);
      ped.group.position.set(p.x, 0.10, p.z);
      ped.group.rotation.y = p.ry;

      const dist = Math.hypot(p.x, p.z);
      ped.group.visible = dist < DESPAWN_DIST;
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
  }
}
