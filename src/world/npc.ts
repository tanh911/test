// 🚕 npc.ts — xe NPC đi theo làn (Protocol Prompt 8 / mục 8)
// Đi dọc road theo chiều +/−, làn PHẢI flow; tại giao lộ rẽ ngẫu nhiên sang road khác
// (không U-turn trừ khi cụt); dừng đèn đỏ theo TrafficLightController; giữ khoảng cách xe trước.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapRoad } from './mapLoader';
import { pointAtS, roadById } from './mapLoader';
import { roadsAtNode, polylineLength } from './roadMesh';
import type { TrafficLightController, LightPhase } from './trafficLights';

export interface NpcCar {
  roadId: string;
  s: number;
  dir: 1 | -1;            // +1: from→to, −1: to→from
  speed: number;
  targetSpeed: number;
  group: THREE.Group;
  collisionAt: number;    // thời điểm va chạm gần nhất (để rate-limit)
  waiting: boolean;
}

const NPC_SPEED_LIMIT = 11;     // ~40 km/h nội thành
const TURN_SPEED = 4.0;
const ACCEL = 3.0;
const BRAKE = 8.0;
const STOP_GAP = 6;             // khoảng cách dừng sau xe trước
const LOOK_AHEAD = 18;          // phạm vi nhìn xe trước
const APPROACH_DIST = 25;       // bắt đầu giảm tốc đến junction

export interface NpcUpdateInput {
  player: { x: number; z: number } | null;
  controllers: TrafficLightController[];
  collisions: string[]; // đẩy sự kiện va chạm vào đây (npc-<idx>)
}

export class NPCController {
  npcs: NpcCar[] = [];
  private group = new THREE.Group();
  private templates: THREE.Group[] = [];
  private roadLen = new Map<string, number>();
  private lightByNode = new Map<string, TrafficLightController>();
  private nodeOf: (id: string) => GameMap['nodes'][number] | undefined;
  private ready = false;

  constructor(private map: GameMap, scene: THREE.Scene) {
    this.group.name = 'npc_traffic';
    scene.add(this.group);
    this.nodeOf = (id) => this.map.nodes.find(n => n.id === id);
    void this.nodeOf;
  }

  /** Nạp 4 loại GLB rồi spawn — gọi 1 lần sau khi tạo controller */
  async init(controllers: TrafficLightController[], count = 8): Promise<void> {
    for (const c of controllers) this.lightByNode.set(c.nodeId, c);
    const loader = new GLTFLoader();
    const urls = [
      '/simv2/car_npc_sedan_red.glb',
      '/simv2/car_npc_kombi_grey.glb',
      '/simv2/car_npc_suv_blue.glb',
      '/simv2/car_npc_transporter_white.glb'
    ];
    for (const u of urls) {
      try {
        const gltf = await loader.loadAsync(u);
        gltf.scene.traverse(o => {
          if (o.isMesh) {
            o.castShadow = true;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) m.side = THREE.FrontSide;
          }
        });
        this.templates.push(gltf.scene);
      } catch {
        // thiếu asset → bỏ qua loại này
      }
    }
    if (!this.templates.length) return;

    // spawn rải rác trên các road có đủ chiều dài
    const roads = this.map.roads.filter(r => polylineLength(r.points) > 30);
    for (let i = 0; i < count && roads.length; i++) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      const len = polylineLength(road.points);
      const s = 10 + Math.random() * Math.max(1, len - 20);
      const npc = this.makeNpc(road, s, Math.random() < 0.5 ? 1 : -1, i);
      this.npcs.push(npc);
    }
    this.ready = true;
  }

  private makeNpc(road: MapRoad, s: number, dir: 1 | -1, idx: number): NpcCar {
    const tpl = this.templates[idx % this.templates.length];
    const group = tpl.clone(true);
    group.name = `npc_${idx}`;
    this.group.add(group);
    return {
      roadId: road.id,
      s,
      dir,
      speed: NPC_SPEED_LIMIT * 0.6,
      targetSpeed: NPC_SPEED_LIMIT * (0.75 + Math.random() * 0.25),
      group,
      collisionAt: -10,
      waiting: false
    };
  }

  private len(roadId: string): number {
    let l = this.roadLen.get(roadId);
    if (l === undefined) {
      const r = roadById(this.map, roadId);
      l = r ? polylineLength(r.points) : 0;
      this.roadLen.set(roadId, l);
    }
    return l;
  }

  /** Vị trí + hướng của 1 NPC theo (road, s, dir) — làn PHẢI flow */
  private pose(road: MapRoad, s: number, dir: 1 | -1, laneOff: number): { x: number; z: number; ry: number } {
    const pt = pointAtS(road, s);
    const h = dir > 0 ? pt.heading : pt.heading + Math.PI;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    const rx = -fz; // phải flow
    const rz = fx;
    return { x: pt.x + rx * laneOff, z: pt.z + rz * laneOff, ry: h + Math.PI };
  }

  /** Node phía trước NPC theo dir */
  private nodeAhead(road: MapRoad, dir: 1 | -1): string {
    return dir > 0 ? road.to : road.from;
  }

  /** Chọn road kế tại node (ưu tiên rẽ, không U-turn trừ khi cụt) */
  private pickNextRoad(road: MapRoad, node: string): { road: MapRoad; dir: 1 | -1 } | null {
    const candidates = roadsAtNode(this.map, node).filter(r => r.road.id !== road.id);
    if (!candidates.length) return null; // cụt → U-turn
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const dir: 1 | -1 = pick.road.from === node ? 1 : -1;
    return { road: pick.road, dir };
  }

  update(dt: number, input: NpcUpdateInput): void {
    if (!this.ready) return;
    // map controller theo node
    const byNode = new Map<string, TrafficLightController>();
    for (const c of input.controllers) byNode.set(c.nodeId, c);

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const road = roadById(this.map, npc.roadId);
      if (!road) continue;
      const len = this.len(npc.roadId);
      const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
      const laneOff = 0.5 * road.laneWidth;

      // ── 1. tốc độ mục tiêu ──
      let target = npc.targetSpeed;
      npc.waiting = false;

      // đèn đỏ phía trước?
      const nodeAheadId = this.nodeAhead(road, npc.dir);
      const ctrl = byNode.get(nodeAheadId);
      if (ctrl) {
        const phase: LightPhase = ctrl.currentPhase;
        const stopS = npc.dir > 0 ? len - half - 2 : half + 2;
        const distToStop = npc.dir > 0 ? stopS - npc.s : npc.s - stopS;
        if ((phase === 'red' || phase === 'red_yellow') && distToStop > -1 && distToStop < APPROACH_DIST) {
          // profile giảm tốc: đến 0 tại vạch
          target = Math.min(target, Math.max(0, (distToStop - 1.5) * 0.5));
          if (distToStop <= 1.6) {
            target = 0;
            npc.waiting = true;
          }
        }
      }

      // xe phía trước (NPC khác + player)?
      const myPos = this.pose(road, npc.s, npc.dir, laneOff);
      for (let j = 0; j < this.npcs.length; j++) {
        if (j === i) continue;
        const other = this.npcs[j];
        if (other.roadId !== npc.roadId || other.dir !== npc.dir) continue;
        const ds = (other.s - npc.s) * npc.dir;
        if (ds > 0 && ds < LOOK_AHEAD) {
          target = Math.min(target, Math.max(0, (ds - STOP_GAP) * 0.5 + other.speed * 0.8));
          if (ds < STOP_GAP) npc.waiting = true;
        }
      }
      if (input.player) {
        const dx = input.player.x - myPos.x;
        const dz = input.player.z - myPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 9) {
          // hướng flow tại npc — player ở TRƯỚC → dừng nhường
          const h = npc.dir > 0 ? pointAtS(road, npc.s).heading
            : pointAtS(road, npc.s).heading + Math.PI;
          const fwd = dx * Math.sin(h) + dz * Math.cos(h);
          if (fwd > 0) {
            target = Math.min(target, Math.max(0, (dist - STOP_GAP + 3) * 0.5));
            if (dist < STOP_GAP - 3) npc.waiting = true;
          }
        }
        // va chạm
        if (dist < 2.4 && performance.now() / 1000 - npc.collisionAt > 2) {
          npc.collisionAt = performance.now() / 1000;
          input.collisions.push(`npc-${i}`);
        }
      }

      // sắp đến junction → giảm tốc rẽ
      const distJunction = npc.dir > 0 ? len - npc.s : npc.s;
      if (distJunction < APPROACH_DIST && !npc.waiting) {
        target = Math.min(target, TURN_SPEED);
      }

      // ── 2. tích phân tốc độ ──
      if (npc.speed < target) npc.speed = Math.min(target, npc.speed + ACCEL * dt);
      else npc.speed = Math.max(target, npc.speed - BRAKE * dt);

      // ── 3. di chuyển + chuyển road ──
      npc.s += npc.dir * npc.speed * dt;
      if (npc.s > len || npc.s < 0) {
        const next = this.pickNextRoad(road, nodeAheadId);
        if (next) {
          npc.roadId = next.road.id;
          npc.dir = next.dir;
          // vào road mới từ đầu node
          npc.s = npc.dir > 0 ? 2 : this.len(npc.roadId) - 2;
        } else {
          npc.dir = (npc.dir * -1) as 1 | -1;
          npc.s = Math.max(0.5, Math.min(len - 0.5, npc.s));
        }
      }

      // ── 4. pose ──
      const p = this.pose(road, npc.s, npc.dir, laneOff);
      npc.group.position.set(p.x, 0, p.z);
      npc.group.rotation.y = p.ry;
      // cull xa
      const camDist = input.player ? Math.hypot(p.x - input.player.x, p.z - input.player.z) : 1e9;
      npc.group.visible = camDist < 350;
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
  }
}

