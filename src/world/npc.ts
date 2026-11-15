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
  wheels: THREE.Object3D[];
  collisionAt: number;    // thời điểm va chạm gần nhất (để rate-limit)
  waiting: boolean;
  signal: 'left' | 'right' | null;  // xi-nhan đang bật (null = tắt)
  signalT: number;                  // thời gian nhấp nháy đã trôi qua
  signalHold: number;               // giữ đèn thêm sau khi đáy vào road mới (s)
  nextChoice?: { road: MapRoad; dir: 1 | -1 } | null; // rẽ latch 1 lần/segment (undefined = chưa latch)
  signalLamps: THREE.Mesh[];        // 4 đèn quad, userData._blinkerSide = trái/phải
  heavy: boolean;                   // xe tải/transporter/van — gia tốc khởi hành thấp
  reaction: number;                 // đếm ngược độ trễ phản xạ người lái khi khởi hành (s)
  reactionArmed: boolean;           // đã cấp phản xạ cho episode dừng này (chống re-trigger)
  lastAccel: number;                // gia tốc đã áp frame trước — dùng để giới hạn jerk
  stopT: number;                    // thời gian đứng yên liên tục (s)
  wasWaiting: boolean;              // frame trước có bị chặn (đèn/gap)?
}

const NPC_SPEED_LIMIT = 11;     // ~40 km/h nội thành
const TURN_SPEED = 5.56;        // 20 km/h — tốc tối đa khi RẼ qua nút (Phần 7/7B)
const STRAIGHT_JUNC = 8.33;     // 30 km/h — tốc tối đa khi ĐI THẲNG qua nút (Phần 7/7B)
const ACCEL_CAR = 1.8;          // m/s² — gia tốc khởi hành xe con (xe thật 1.5–2.0)
const ACCEL_HEAVY = 1.0;        // m/s² — transporter/van
const JERK_ACC = 2.0;           // m/s³ khi VÀO GA (0→1.8 trong 0.9s — khởi hành êm)
const JERK_BRK_SOFT = 3.0;      // m/s³ khi PHANH ÊM (P-tracking, nhả ga — comfort ~1.5–3)
const JERK_BRK_HARD = 8.0;      // m/s³ khi PHANH KHẨN CẤP (đỗ dứt khoát sát vạch)
const BRAKE = 8.0;              // m/s² phanh tối đa
const STOP_GAP = 6.5;           // khoảng cách tâm-đối-tâm khi đứng (bumper ≈ 2.3m với xe 4.2m)
const HEADWAY = 1.2;            // s — time-headway tối thiểu khi chạy (Phần 7B)
const LOOK_AHEAD = 18;          // phạm vi nhìn xe trước
const CAR_AHEAD_TOL = 4.5;      // m — vẫn xét xe trước đã hơi lướt qua mũi (chống đâm xuyên)
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

  /** Nạp 6 loại GLB xe 3D thực tế rồi spawn — gọi 1 lần sau khi tạo controller */
  async init(controllers: TrafficLightController[], count = 8, preTemplates?: THREE.Group[]): Promise<void> {
    for (const c of controllers) this.lightByNode.set(c.nodeId, c);
    if (preTemplates?.length) {
      // Test/harness: dùng template có sẵn, bỏ qua GLB loader
      this.templates.push(...preTemplates);
    }
    if (preTemplates?.length) {
      // spawn luôn với template có sẵn
      this.spawnNpcs(count);
      return;
    }
    const loader = new GLTFLoader();
    const urls = [
      '/simv2/car_npc_sedan_red.glb',
      '/simv2/car_npc_kombi_grey.glb',
      '/simv2/car_npc_suv_blue.glb',
      '/simv2/car_npc_transporter_white.glb',
      '/simv2/car_npc_police.glb',
      '/simv2/car_npc_van.glb'
    ];
    for (const u of urls) {
      try {
        const gltf = await loader.loadAsync(u);
        const wrapper = new THREE.Group();
        // Mô hình Kenney Car Kit có mặt trước hướng +Z -> xoay π để đồng bộ quy ước mặt trước -Z
        gltf.scene.rotation.y = Math.PI;
        wrapper.add(gltf.scene);

        const pre = new THREE.Box3().setFromObject(wrapper);
        const preSize = pre.getSize(new THREE.Vector3());
        if (preSize.x > 0.5) {
          const targetW = (u.includes('transporter') || u.includes('van')) ? 1.92 : 1.78;
          const fit = targetW / preSize.x;
          if (Math.abs(fit - 1) > 0.05) wrapper.scale.setScalar(fit);
        }
        wrapper.updateMatrixWorld(true);
        const post = new THREE.Box3().setFromObject(wrapper);
        gltf.scene.position.y -= post.min.y / wrapper.scale.y;

        wrapper.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.side = THREE.FrontSide;
          }
        });
        this.templates.push(wrapper);
      } catch {
        // thiếu asset → bỏ qua loại này
      }
    }
    if (!this.templates.length) return;
    this.spawnNpcs(count);
  }

  /** Spawn NPC quanh khu vực player (tách khỏi load GLB — test dùng được) */
  private spawnNpcs(count: number): void {
    {
    // Ưu tiên spawn 10 xe NPC quanh khu vực xuất phát của người chơi (20m..160m) để các ngã tư đèn đỏ có lưu thông thực tế ngay lập tức
    const playerSpawn = spawnFromMap(this.map);
    const roads = this.map.roads.filter(r => roadLength(r) > 24);
    const nearbyRoads = roads.filter(r => {
      const mid = pointAtS(r, roadLength(r) * 0.5);
      const d = Math.hypot(mid.x - playerSpawn.x, mid.z - playerSpawn.z);
      return d > 15 && d < 165;
    });

    let placed = 0;
    let attempts = 0;
    const priorityTarget = Math.min(10, Math.floor(count * 0.45));

    // Nếu là bản đồ Sa hình Sát hạch (có đường r_uni_return dẫn vào ngã tư Rechts vor links n_rvl từ BÊN PHẢI),
    // đặt sẵn 1 xe tình huống từ nhánh bên phải tiến ra cắt ngang ngã tư để người chơi thực hành nhường đường Rechts vor links!
    const rvlRightRoad = this.map.roads.find(r => r.id === 'r_uni_return');
    const rvlStraightRoad = this.map.roads.find(r => r.id === 'r_rvl_w');
    if (rvlRightRoad && placed < count) {
      const lenRvl = roadLength(rvlRightRoad);
      const sRvl = Math.max(8, lenRvl - 19); // Cách ngã tư n_rvl (0,90) đúng 19m bên phải
      const npcRvl = this.makeNpc(rvlRightRoad, sRvl, 1, placed) as NpcCar & { _rvlHold?: boolean; _rvlPriority?: boolean };
      npcRvl.speed = 0;
      npcRvl.targetSpeed = 6.2; // ~22 km/h tiến dứt khoát qua ngã tư theo quyền ưu tiên bên phải
      npcRvl._rvlHold = true;
      npcRvl._rvlPriority = true;
      if (rvlStraightRoad) {
        npcRvl.nextChoice = { road: rvlStraightRoad, dir: 1 };
      }
      const laneOffRvl = 0.5 * rvlRightRoad.laneWidth;
      const p0 = this.pose(rvlRightRoad, sRvl, 1, laneOffRvl);
      npcRvl.group.position.set(p0.x, 0, p0.z);
      npcRvl.group.rotation.y = p0.ry;
      this.npcs.push(npcRvl);
      placed++;
    }

    while (placed < count && attempts < count * 14 && roads.length) {
      attempts++;
      const pool = (placed < priorityTarget && nearbyRoads.length > 0) ? nearbyRoads : roads;
      const road = pool[Math.floor(Math.random() * pool.length)];
      const len = roadLength(road);
      const s = 8 + Math.random() * Math.max(1, len - 16);
      let dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      if (road.lanesBackward === 0) dir = 1;
      else if (road.lanesForward === 0) dir = -1;
      const pt = pointAtS(road, s);
      if (Math.hypot(pt.x - playerSpawn.x, pt.z - playerSpawn.z) < 18) continue;
      // Tránh đặt 2 xe chồng lên nhau
      const tooClose = this.npcs.some(other => other.roadId === road.id && other.dir === dir && Math.abs(other.s - s) < 11);
      if (tooClose) continue;
      const npc = this.makeNpc(road, s, dir, placed);
      const laneOff = (dir > 0 ? road.lanesForward - 0.5 : road.lanesBackward - 0.5) * road.laneWidth;
      const p0 = this.pose(road, s, dir, laneOff);
      npc.group.position.set(p0.x, 0, p0.z);
      npc.group.rotation.y = p0.ry;
      this.npcs.push(npc);
      placed++;
    }
    this.ready = true;
    }
  }

  private makeNpc(road: MapRoad, s: number, dir: 1 | -1, idx: number): NpcCar {
    const tpl = this.templates[idx % this.templates.length];
    const group = tpl.clone(true);
    group.name = `npc_${idx}`;
    this.group.add(group);
    const lamps = attachBlinkers(group);
    const wheels: THREE.Object3D[] = [];
    for (const wn of ['wheel-front-left', 'wheel-front-right', 'wheel-back-left', 'wheel-back-right']) {
      const wObj = group.getObjectByName(wn);
      if (wObj) wheels.push(wObj);
    }
    return {
      roadId: road.id,
      s,
      dir,
      speed: NPC_SPEED_LIMIT * 0.6,
      targetSpeed: NPC_SPEED_LIMIT * (0.75 + Math.random() * 0.25),
      group,
      wheels,
      collisionAt: -10,
      waiting: false,
      signal: null,
      signalT: 0,
      signalHold: 0,
      nextChoice: undefined,
      signalLamps: lamps,
      // template thứ tự urls: 0 sedan, 1 kombi, 2 suv, 3 transporter, 4 police, 5 van
      heavy: idx % 6 === 3 || idx % 6 === 5,
      reaction: 0,
      reactionArmed: false,
      lastAccel: 0,
      stopT: 0,
      wasWaiting: false
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

      // ── 1. tốc độ mục tiêu: cá nhân + GIOI HẠN THEO speedLimit CỦA ROAD (Phần 7B) ──
      const roadCap = Math.min(NPC_SPEED_LIMIT, (road.speedLimit ?? 50) / 3.6);
      let target = Math.min(npc.targetSpeed, roadCap);
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
        if (ds > -CAR_AHEAD_TOL && ds < LOOK_AHEAD) {
          // đứng: gap 6.5m tâm-đối-tâm (bumper ≥ 2m); chạy: gap ≥ 1.2s × tốc độ (time-headway).
          // dsEff clamp ≥ 0.5: chướng ngại vật trước mũi xe (kể cả đã hơi lướt qua) vẫn ép target=0,
          // không bao giờ "lái xuyên" qua xe trước khi ds đổi dấu.
          const dsEff = Math.max(ds, 0.5);
          const safeGap = Math.max(STOP_GAP, npc.speed * HEADWAY);
          target = Math.min(target, Math.max(0, (dsEff - safeGap) * 0.5 + other.speed * 0.8));
          if (ds > 0 && ds < STOP_GAP) npc.waiting = true;
        }
      }
      const rvlNpc = npc as NpcCar & { _rvlHold?: boolean; _rvlPriority?: boolean };
      const distJunction = npc.dir > 0 ? len - npc.s : npc.s;
      const ixAhead = this.map.intersections.find(ix => ix.nodeId === nodeAheadId);
      let hasRightOfWayOverPlayer = !!rvlNpc._rvlPriority;

      // ── Quy tắc Rechts vor links (§8 StVO) tại mọi giao lộ đồng cấp ──
      if (ixAhead?.rule === 'right_before_left' && input.player && distJunction < 18) {
        const nodeObj = this.nodeOf(nodeAheadId);
        if (nodeObj) {
          const playerDistToNode = Math.hypot(input.player.x - nodeObj.x, input.player.z - nodeObj.z);
          if (playerDistToNode < 26) {
            const vNpcX = myPos.x - nodeObj.x;
            const vNpcZ = myPos.z - nodeObj.z;
            const vPlrX = input.player.x - nodeObj.x;
            const vPlrZ = input.player.z - nodeObj.z;
            const cross = vNpcX * vPlrZ - vNpcZ * vPlrX;
            if (cross < -25 && distJunction < 12 && distJunction > 2.5) {
              // Người chơi đang tiến đến từ BÊN PHẢI của xe NPC -> Xe NPC bắt buộc phanh nhường đường!
              target = 0;
              npc.waiting = true;
            } else if (cross > 25) {
              // Xe NPC tiến đến từ BÊN PHẢI của người chơi -> Xe NPC có quyền ưu tiên (Vorfahrt) đi qua!
              hasRightOfWayOverPlayer = true;
            }
          }
        }
      }

      if (input.player) {
        const dx = input.player.x - myPos.x;
        const dz = input.player.z - myPos.z;
        const dist = Math.hypot(dx, dz);
        const yieldRadius = hasRightOfWayOverPlayer ? 3.5 : 9;
        if (dist < yieldRadius) {
          // hướng flow tại npc — player ở TRƯỚC → dừng nhường (trừ khi NPC đang có quyền ưu tiên Rechts vor links ở khoảng cách > 3.5m)
          const h = npc.dir > 0 ? pointAtS(road, npc.s).heading
            : pointAtS(road, npc.s).heading + Math.PI;
          const fwd = dx * Math.sin(h) + dz * Math.cos(h);
          if (fwd > 0) {
            target = Math.min(target, Math.max(0, (dist - (hasRightOfWayOverPlayer ? 2.8 : STOP_GAP - 3)) * 0.5));
            if (dist < (hasRightOfWayOverPlayer ? 3.2 : STOP_GAP - 3)) npc.waiting = true;
          }
        }
        // va chạm
        if (dist < 2.4 && performance.now() / 1000 - npc.collisionAt > 2) {
          npc.collisionAt = performance.now() / 1000;
          input.collisions.push(`npc-${i}`);
        }
      }

      // sắp đến junction → giới hạn tốc qua nút: RẼ ≤ 20 km/h, THẲNG ≤ 30 km/h (Phần 7/7B)
      // (nếu là xe ưu tiên đi thẳng Rechts vor links thì giữ tốc độ ổn định qua ngã tư)
      if (distJunction < APPROACH_DIST && !npc.waiting && !hasRightOfWayOverPlayer) {
        target = Math.min(target, npc.signal !== null ? TURN_SPEED : STRAIGHT_JUNC);
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

      // ── 2. tích phân tốc độ (hỗ trợ kịch bản phản xạ Rechts vor links tại n_rvl) ──
      if (rvlNpc._rvlHold) {
        if (input.player && Math.hypot(input.player.x - 0, input.player.z - 90) < 52) {
          rvlNpc._rvlHold = false; // Người chơi tiến đến cách ngã tư 52m -> xe bên phải bắt đầu lăn bánh ra!
        } else {
          target = 0;
          npc.waiting = true;
        }
      }

      // ── 2b. độ trễ phản xạ người lái khi khởi hành (Phần 7B): hàng xe xuất phát LẦN LƯỢT ──
      // Trigger: (a) đèn vừa xanh/gap vừa mở (xe đầu hàng), hoặc (b) xe trước VỪA nhúc nhích
      // (0.05 < v < 1.5 trong 12m) — không đợi gap mở, chặn luôn micro-creep của term v_l×0.8.
      if (npc.speed < 0.05 && npc.waiting) npc.stopT += dt;
      else if (npc.speed > 0.1) npc.stopT = 0;
      const parked = npc.speed < 0.3 && npc.stopT > 1.2;
      if (parked && !npc.reactionArmed && npc.reaction <= 0) {
        const released = npc.wasWaiting && !npc.waiting; // vừa được thả (đèn xanh / gap mở)
        let leaderTwitch = false;
        for (const o of this.npcs) {
          if (o === npc || o.roadId !== npc.roadId || o.dir !== npc.dir) continue;
          const d = (o.s - npc.s) * npc.dir;
          if (d > 0 && d < 12 && o.speed > 0.05 && o.speed < 1.5) { leaderTwitch = true; break; }
        }
        if (released || leaderTwitch) {
          // xe sau giữ xe trước: trễ 0.8–1.4s; xe đầu hàng gặp xanh: 0.7–1.2s
          npc.reaction = leaderTwitch ? 0.8 + Math.random() * 0.6 : 0.7 + Math.random() * 0.5;
          npc.reactionArmed = true; // chỉ cấp 1 lần cho episode dừng này
        }
      }
      if (npc.speed > 0.5) npc.reactionArmed = false; // đã lăn bánh thật → episode xong, cho phép cấp lại lần sau
      npc.wasWaiting = npc.waiting;
      if (npc.reaction > 0) {
        npc.reaction -= dt;
        target = 0;
        npc.waiting = true;
      }

      // ── 2c. tích phân tốc độ: P-controller + giới hạn GIA TỐC và JERK (Phần 7B) ──
      // xe thật: 0→30 km/h mất 4–6s (a ≈ 1.5–2.0 m/s²), jerk êm ~2–3 m/s³
      const A_MAX = npc.heavy ? ACCEL_HEAVY : ACCEL_CAR;
      const dtSafe = Math.max(dt, 1e-4);
      const hardStop = target === 0 && npc.speed < 1.2;
      // phanh đòi gain mạnh hơn ga (0.45s) — dừng kịp trước chướng ngại/vạch; ga giữ 0.6s êm
      let aDes = (target - npc.speed) / (target < npc.speed ? 0.45 : 0.6);
      aDes = Math.max(-BRAKE, Math.min(A_MAX, aDes));
      if (hardStop) aDes = Math.min(aDes, -(npc.speed / 0.35 + 1.0)); // đỗ dứt khoát gần vạch
      // phanh KHẨN CẤP khi demand sâu (dừng thật); nhả ga/hiệu chỉnh nhẹ dùng ramp êm 3 m/s³
      const jerkBrk = (hardStop || aDes < -3) ? JERK_BRK_HARD : JERK_BRK_SOFT;
      if (npc.speed < 0.05 && target < 0.05) {
        // dưới 5 cm/s và không có target → co về 0 mượt (tránh spike jerk số học khi clamp v=0)
        npc.speed = Math.max(0, npc.speed - 0.2 * dtSafe);
        npc.lastAccel = 0;
      } else {
        const jerk = aDes > npc.lastAccel
          ? (npc.lastAccel < 0 ? jerkBrk : JERK_ACC)    // tăng a: thoát phanh nhanh (theo mức phanh), vào ga êm
          : jerkBrk;                                    // giảm a: phanh êm 3 / khẩn cấp 8
        const a = npc.lastAccel + Math.max(-jerk * dtSafe, Math.min(jerk * dtSafe, aDes - npc.lastAccel));
        npc.lastAccel = a;
        npc.speed = Math.max(0, npc.speed + a * dtSafe); // KHÔNG clamp tốc — target giảm → phanh mượt qua jerk ramp
      }

      // ── 3. di chuyển + chuyển road sớm 4.2m trước tâm nút giao để bo cua mượt không giật ──
      npc.s += npc.dir * npc.speed * dt;
      const turnMargin = rvlNpc._rvlPriority ? 0.5 : 4.2;
      if ((npc.dir > 0 && npc.s > len - turnMargin) || (npc.dir < 0 && npc.s < turnMargin)) {
        const next = npc.nextChoice !== undefined ? npc.nextChoice : this.pickNextRoad(road, nodeAheadId, npc.dir);
        if (next) {
          npc.roadId = next.road.id;
          npc.dir = next.dir;
          const nextLen = this.len(npc.roadId);
          npc.s = npc.dir > 0 ? Math.min(turnMargin, nextLen * 0.25) : Math.max(nextLen - turnMargin, nextLen * 0.75);
          npc.signalHold = BLINK_HOLD;
        } else {
          npc.dir = (npc.dir * -1) as 1 | -1;
          npc.s = Math.max(1.0, Math.min(len - 1.0, npc.s));
          npc.signalHold = BLINK_HOLD;
        }
        rvlNpc._rvlPriority = false;
        npc.signalT = 0;
        npc.nextChoice = undefined;
      }

      // ── 4. pose (dùng đúng road hiện tại sau khi chuyển + nội suy bo góc mượt mà) ──
      const activeRoad = roadById(this.map, npc.roadId) ?? road;
      const activeSingleOneway = activeRoad.lanesBackward === 0 && activeRoad.lanesForward === 1;
      const activeLaneOff = activeSingleOneway ? 0 : 0.5 * activeRoad.laneWidth;
      const p = this.pose(activeRoad, npc.s, npc.dir, activeLaneOff);

      const posBlend = Math.min(1, 9.5 * dt);
      const curX = npc.group.position.x;
      const curZ = npc.group.position.z;
      if (Math.hypot(p.x - curX, p.z - curZ) > 18) {
        npc.group.position.set(p.x, 0, p.z);
        npc.group.rotation.y = p.ry;
      } else {
        npc.group.position.x = curX + (p.x - curX) * posBlend;
        npc.group.position.z = curZ + (p.z - curZ) * posBlend;
        let dAng = p.ry - npc.group.rotation.y;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        npc.group.rotation.y += dAng * Math.min(1, 8.0 * dt);
      }
      // ── 4b. Quay 4 bánh xe NPC theo vận tốc thực ──
      if (npc.speed > 0.05 && npc.wheels.length > 0) {
        const dRoll = (npc.speed * dt) / 0.30;
        for (const w of npc.wheels) {
          w.rotation.x = (w.rotation.x + dRoll) % (Math.PI * 2);
        }
      }
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

