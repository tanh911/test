// 🚕 npc.ts — xe NPC đi theo làn (Protocol Prompt 8 / mục 8)
// Đi dọc road theo chiều +/−, làn PHẢI flow; tại giao lộ rẽ ngẫu nhiên sang road khác
// (không U-turn trừ khi cụt); dừng đèn đỏ theo TrafficLightController; giữ khoảng cách xe trước.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapRoad } from './mapLoader';
import { pointAtS, roadById, roadLength } from './mapLoader';
import { spawnFromMap } from './vehicle';
import { roadsAtNode } from './roadMesh';
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
  signal: 'left' | 'right' | null;  // xi-nhan đang bật (null = tắt)
  signalT: number;                  // thời gian nhấp nháy đã trôi qua
  signalHold: number;               // giữ đèn thêm sau khi đáy vào road mới (s)
  nextChoice?: { road: MapRoad; dir: 1 | -1 } | null; // rẽ latch 1 lần/segment (undefined = chưa latch)
  signalLamps: THREE.Mesh[];        // 4 đèn quad, userData._blinkerSide = trái/phải
}

const NPC_SPEED_LIMIT = 11;     // ~40 km/h nội thành
const TURN_SPEED = 4.0;
const ACCEL = 3.0;
const BRAKE = 8.0;
const STOP_GAP = 6;             // khoảng cách dừng sau xe trước
const LOOK_AHEAD = 18;          // phạm vi nhìn xe trước
const APPROACH_DIST = 25;       // bắt đầu giảm tốc đến junction
const SIGNAL_DIST = 35;         // bật xi-nhan trước junction (m) — trước cả vùng giảm tốc
const TURN_THRESHOLD = 0.35;    // chênh heading > ~20° = rẽ, ngược lại đi thẳng
const BLINK_PERIOD = 0.55;      // chu kỳ nhấp nháy xi-nhan (s)
const BLINK_HOLD = 1.2;         // giữ đèn thêm sau khi đáy vào road mới (s)

// 🎇 xi-nhan NPC: 4 đèn quad (trước/sau × trái/phải) gắn vào bbox GLB — dùng chung geo/material
const blinkerGeo = new THREE.BoxGeometry(0.03, 0.09, 0.18);
const blinkerMat = new THREE.MeshBasicMaterial({ color: 0xffa733 });

function attachBlinkers(group: THREE.Group): THREE.Mesh[] {
  // box.type xe khác nhau (sedan/kombi/suv/transporter) → đo bbox để đèn ôm sát thân
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const hw = size.x / 2;
  const hl = size.z / 2;
  const lamps: THREE.Mesh[] = [];
  for (const side of ['left', 'right'] as const) {
    const x = (side === 'left' ? -1 : 1) * (hw + 0.03); // local −X = trái flow, +X = phải flow
    for (const zi of [-1, 1]) {
      const m = new THREE.Mesh(blinkerGeo, blinkerMat);
      m.position.set(x, size.y * 0.62, zi * (hl - 0.02)); // mặt trước GLB = −Z
      m.userData._blinkerSide = side;
      m.visible = false; // tắt mặc định → 0 draw call khi không rẽ
      group.add(m);
      lamps.push(m);
    }
  }
  return lamps;
}

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
        // ── Scale xe NPC vừa làn 3 m: sedan/kombi/suv ~1.8 m, transporter ~2.0 m ──
        const pre = new THREE.Box3().setFromObject(gltf.scene);
        const preSize = pre.getSize(new THREE.Vector3());
        if (preSize.x > 0.5) {
          const targetW = u.includes('transporter') ? 2.0 : 1.8;
          const fit = targetW / preSize.x;
          if (Math.abs(fit - 1) > 0.05) gltf.scene.scale.setScalar(fit);
        }
        gltf.scene.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh;
            mesh.castShadow = true;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.side = THREE.FrontSide;
          }
        });
        this.templates.push(gltf.scene);
      } catch {
        // thiếu asset → bỏ qua loại này
      }
    }
    if (!this.templates.length) return;

    // spawn rải rác trên các road có đủ chiều dài — TRÁNH vùng spawn player (25 m)
    const playerSpawn = spawnFromMap(this.map);
    const roads = this.map.roads.filter(r => roadLength(r) > 30);
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 10 && roads.length) {
      attempts++;
      const road = roads[Math.floor(Math.random() * roads.length)];
      const len = roadLength(road);
      const s = 10 + Math.random() * Math.max(1, len - 20);
      let dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      if (road.lanesBackward === 0) dir = 1;
      else if (road.lanesForward === 0) dir = -1;
      const pt = pointAtS(road, s);
      if (Math.hypot(pt.x - playerSpawn.x, pt.z - playerSpawn.z) < 25) continue;
      const npc = this.makeNpc(road, s, dir, placed);
      this.npcs.push(npc);
      placed++;
    }
    this.ready = true;
  }

  private makeNpc(road: MapRoad, s: number, dir: 1 | -1, idx: number): NpcCar {
    const tpl = this.templates[idx % this.templates.length];
    const group = tpl.clone(true);
    group.name = `npc_${idx}`;
    this.group.add(group);
    const lamps = attachBlinkers(group);
    return {
      roadId: road.id,
      s,
      dir,
      speed: NPC_SPEED_LIMIT * 0.6,
      targetSpeed: NPC_SPEED_LIMIT * (0.75 + Math.random() * 0.25),
      group,
      collisionAt: -10,
      waiting: false,
      signal: null,
      signalT: 0,
      signalHold: 0,
      nextChoice: undefined,
      signalLamps: lamps
    };
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

  /** Chọn road kế tại node (ưu tiên rẽ, không U-turn trừ khi cụt).
   *  Với vòng xuyến (Kreisverkehr): bắt buộc rẽ phải (không cắt vòng, không rẽ trái).
   *  npcDir: hướng NPC đang đi trên road hiện tại (+1: from→to, −1: to→from). */
  private pickNextRoad(road: MapRoad, node: string, npcDir: 1 | -1): { road: MapRoad; dir: 1 | -1 } | null {
    const candidates = roadsAtNode(this.map, node).filter(r => {
      if (r.road.id === road.id) return false;
      const candDir: 1 | -1 = r.road.from === node ? 1 : -1;
      return candDir === 1 ? r.road.lanesForward > 0 : r.road.lanesBackward > 0;
    });
    if (!candidates.length) return null; // cụt hoặc không có đường đi hợp lệ → U-turn

    const ix = this.map.intersections.find((i) => i.nodeId === node);
    const isRoundabout = ix?.rule === 'roundabout';

    if (isRoundabout) {
      // Hướng ra khỏi node trên road hiện tại (để xác định "phải" đối chiếu)
      const curExitH = npcDir > 0
        ? this.exitHeading(road, 1)   // ra khỏi road.to, flow from→to
        : this.exitHeading(road, -1); // ra khỏi road.from, flow to→from
      let best: { road: MapRoad; dir: 1 | -1 } | null = null;
      let bestScore = Infinity;
      for (const cand of candidates) {
        const candDir: 1 | -1 = cand.road.from === node ? 1 : -1;
        const nextH = this.enterHeading(cand.road, candDir);
        let d = nextH - curExitH;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        // rẽ phải = d < 0 (âm). Chọn right-most (d âm nhất, gần −π/2)
        const score = d;
        if (score < bestScore) { bestScore = score; best = { road: cand.road, dir: candDir }; }
      }
      return best ?? ({ road: candidates[0].road, dir: candidates[0].road.from === node ? 1 : -1 });
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const dir: 1 | -1 = pick.road.from === node ? 1 : -1;
    return { road: pick.road, dir };
  }

  /** Heading flow của NPC tại điểm RA KHỎI road (chạm node phía trước) */
  private exitHeading(road: MapRoad, dir: 1 | -1): number {
    const pt = pointAtS(road, roadLength(road)); // roadPointAt tự clamp s
    return dir > 0 ? pt.heading : pt.heading + Math.PI;
  }

  /** Heading flow của NPC ngay khi VÀO road mới (đầu from nếu dir>0, đầu to nếu dir<0) */
  private enterHeading(next: MapRoad, dir: 1 | -1): number {
    const pt = pointAtS(next, dir > 0 ? 0 : roadLength(next));
    return dir > 0 ? pt.heading : pt.heading + Math.PI;
  }

  /** Chênh heading chuẩn hóa [−π, π]: h tăng = RẼ TRÁI (quy ước vehicle.ts); < ngưỡng = đi thẳng */
  private classifyTurn(curH: number, nextH: number): 'left' | 'right' | null {
    let d = nextH - curH;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) < TURN_THRESHOLD) return null;
    return d > 0 ? 'left' : 'right';
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
      const isSingleLaneOneway = road.lanesBackward === 0 && road.lanesForward === 1;
      const laneOff = isSingleLaneOneway ? 0 : 0.5 * road.laneWidth;

      // ── 1. tốc độ mục tiêu ──
      let target = npc.targetSpeed;
      npc.waiting = false;

      // đèn đỏ phía trước?
      const nodeAheadId = this.nodeAhead(road, npc.dir);
      const ctrl = byNode.get(nodeAheadId);
      if (ctrl) {
        const phase: LightPhase = ctrl.phaseForArm(road.id, npc.dir > 0 ? 'to' : 'from');
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

      // ── 1b. đèn xi-nhan: latch quyết định 1 lần/segment + phân loại trái/phải/thẳng ──
      if (npc.signalHold > 0) {
        npc.signalHold -= dt; // đang giữ lần rẽ vừa qua → giữ nguyên signal
      } else if (distJunction < SIGNAL_DIST) {
        if (npc.nextChoice === undefined) {
          npc.nextChoice = this.pickNextRoad(road, nodeAheadId, npc.dir);
          if (!npc.nextChoice) {
            npc.signal = 'left'; // cụt → U-turn, tín hiệu trái
          } else {
            const curH = this.exitHeading(road, npc.dir);
            const nextH = this.enterHeading(npc.nextChoice.road, npc.nextChoice.dir);
            npc.signal = this.classifyTurn(curH, nextH); // null = đi thẳng
          }
          npc.signalT = 0;
        }
        // đã latch trước đó trong cùng segment → giữ nguyên (không đổi quyết định giữa đường)
      } else {
        npc.signal = null; // ngoài vùng + hết hold → tắt đèn
      }
      if (npc.signal) npc.signalT += dt;

      // ── 2. tích phân tốc độ ──
      if (npc.speed < target) npc.speed = Math.min(target, npc.speed + ACCEL * dt);
      else npc.speed = Math.max(target, npc.speed - BRAKE * dt);

      // ── 3. di chuyển + chuyển road ──
      npc.s += npc.dir * npc.speed * dt;
      if (npc.s > len || npc.s < 0) {
        // tái dùng quyết định đã latch để đèn khớp với đường NPC thực sự đi vào
        const next = npc.nextChoice !== undefined ? npc.nextChoice : this.pickNextRoad(road, nodeAheadId, npc.dir);
        if (next) {
          npc.roadId = next.road.id;
          npc.dir = next.dir;
          // vào road mới từ đầu node
          npc.s = npc.dir > 0 ? 2 : this.len(npc.roadId) - 2;
          npc.signalHold = BLINK_HOLD;
        } else {
          npc.dir = (npc.dir * -1) as 1 | -1;
          npc.s = Math.max(0.5, Math.min(len - 0.5, npc.s));
          npc.signalHold = BLINK_HOLD;
        }
        npc.signalT = 0;
        npc.nextChoice = undefined; // latch lại cho segment mới
      }

      // ── 4. pose ──
      const p = this.pose(road, npc.s, npc.dir, laneOff);
      npc.group.position.set(p.x, 0, p.z);
      npc.group.rotation.y = p.ry;
      // ── 5. xi-nhan nhấp nháy (chỉ rẽ mới có draw call) ──
      const blinkOn = npc.signal !== null && (npc.signalT % BLINK_PERIOD) < BLINK_PERIOD / 2;
      for (const lamp of npc.signalLamps) {
        lamp.visible = blinkOn && (lamp.userData._blinkerSide as string) === npc.signal;
      }
      // cull xa
      const camDist = input.player ? Math.hypot(p.x - input.player.x, p.z - input.player.z) : 1e9;
      npc.group.visible = camDist < 350;
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
  }
}

