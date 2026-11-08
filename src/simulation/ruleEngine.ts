// ⚖️ ruleEngine.ts — phát hiện vi phạm + chấm điểm Fahrfehler (Protocol Prompt 9 / mục 6)
// MVP chấm lỗi tổng quát trên mọi map (chưa cần scenario JSON riêng):
//   • Vượt tốc độ (limit + 3 km/h)          — minor
//   • Rời mặt đường (lệch tâm > half+0.6)   — minor
//   • Chạy đèn đỏ (cắt vạch dừng khi red)   — MAJOR
//   • Va chạm xe NPC                        — MAJOR
// Bestehen: 0 major & < 10 minor. Rate-limit mỗi loại lỗi để không spam.
import type { GameMap, MapRoad } from '../world/mapLoader';
import { pointAtS, roadById } from '../world/mapLoader';
import { polylineLength } from '../world/roadMesh';
import type { TrafficLightController, LightPhase } from '../world/trafficLights';

export type Severity = 'minor' | 'major';

export interface Violation {
  type: 'speed' | 'offroad' | 'redlight' | 'collision';
  severity: Severity;
  message: string;
  x: number;
  z: number;
  t: number; // thời điểm (giây từ start)
}

export interface PlayerState {
  x: number;
  z: number;
  heading: number;
  speed: number; // m/s
}

const TOLERANCE_KMH = 3;
const OFFROAD_MARGIN = 0.6;
const RATE_LIMIT: Record<Violation['type'], number> = {
  speed: 4, offroad: 6, redlight: 30, collision: 3
};

export class RuleEngine {
  violations: Violation[] = [];
  private lastAt: Record<Violation['type'], number> = { speed: -99, offroad: -99, redlight: -99, collision: -99 };
  private elapsed = 0;
  /** junction đang tiếp cận (chỉ 1) — tránh double-count mỗi lần cắt vạch */
  private redArmed = new Set<string>();
  private map: GameMap;
  private controllers: TrafficLightController[];

  readonly instanceId = ++RuleEngine.instanceCounter;
  static instanceCounter = 0;

  constructor(map: GameMap, controllers: TrafficLightController[]) {
    this.map = map;
    this.controllers = controllers;
    const w = window as unknown as { __reCount?: number };
    w.__reCount = (w.__reCount ?? 0) + 1;
  }

  get bestanden(): boolean {
    const major = this.violations.filter(v => v.severity === 'major').length;
    const minor = this.violations.length - major;
    return major === 0 && minor < 10;
  }

  get summary(): string {
    const major = this.violations.filter(v => v.severity === 'major').length;
    const minor = this.violations.length - major;
    return this.bestanden ? `BESTANDEN (${minor} Fehler leicht)` : `NICHT BESTANDEN — ${major} schwer / ${minor} leicht`;
  }

  private add(type: Violation['type'], severity: Severity, message: string, p: PlayerState): void {
    if (this.elapsed - this.lastAt[type] < RATE_LIMIT[type]) return;
    this.lastAt[type] = this.elapsed;
    this.violations.push({ type, severity, message: message, x: p.x, z: p.z, t: this.elapsed });
  }

  /** Road gần điểm p nhất (kèm s chiếu + khoảng cách từ tâm đường) */
  private nearestRoad(p: PlayerState): { road: MapRoad; s: number; dist: number } | null {
    let best: { road: MapRoad; s: number; dist: number } | null = null;
    for (const road of this.map.roads) {
      const s = pointAtSRough(road, p);
      const pt = pointAtS(road, s);
      const d = Math.hypot(pt.x - p.x, pt.z - p.z);
      if (!best || d < best.dist) best = { road, s, dist: d };
    }
    return best;
  }

  update(dt: number, p: PlayerState, collisions: string[]): void {
    this.elapsed += dt;

    // ── tốc độ ──
    const kmh = p.speed * 3.6;
    // limit của road gần nhất
    const near = this.nearestRoad(p);
    if (near && kmh > near.road.speedLimit + TOLERANCE_KMH && kmh > 10) {
      this.add('speed', 'minor', `Vượt tốc độ ${Math.round(kmh)} km/h (limit ${near.road.speedLimit})`, p);
    }

    // ── rời mặt đường ──
    if (near) {
      const half = (near.road.lanesForward + near.road.lanesBackward) * near.road.laneWidth / 2;
      if (near.dist > half + OFFROAD_MARGIN && kmh > 5) {
        this.add('offroad', 'minor', 'Rời mặt đường / lên vỉa hè', p);
      }
    }

    // ── đèn đỏ: road dưới player + junction phía trước ──
    if (near) {
      const road = near.road;
      const len = polylineLength(road.points);
      // player đi chiều nào trên road? dot(heading, hướng road tại s)
      const pt = pointAtS(road, near.s);
      const flowDot = Math.sin(pt.heading) * Math.sin(p.heading) + Math.cos(pt.heading) * Math.cos(p.heading);
      const dir: 1 | -1 = flowDot >= 0 ? 1 : -1;
      // junction phía TRƯỚC có controller?
      for (const nodeId of [road.from, road.to]) {
        const ctrl = this.controllers.find(c => c.nodeId === nodeId);
        if (!ctrl) continue;
        const junctionEnd = road.to === nodeId ? len : 0;
        const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
        const stopS = road.to === nodeId ? len - half - 2 : half + 2;
        const distToStop = dir > 0 ? stopS - near.s : near.s - stopS;
        const key = `${road.id}:${nodeId}`;
        // rời xa vạch → re-arm
        if (distToStop > 12 || distToStop < -12) {
          this.redArmed.delete(key);
          continue;
        }
        const phase: LightPhase = ctrl.currentPhase;
        // cắt vạch khi đỏ: đang tiến về vạch khi đỏ (armed), vượt stopS, vẫn chạy
        if (phase === 'red' && distToStop < 0 && this.redArmed.has(key) && kmh > 5) {
          this.add('redlight', 'major', 'Chạy đèn đỏ', p);
          this.redArmed.delete(key);
        } else if (phase === 'red' && distToStop >= 0 && distToStop < 12) {
          // đang tiến về vạch khi đỏ → armed: nếu tiếp tục cắt thì là vi phạm
          if (kmh > 5) this.redArmed.add(key);
        } else if (phase === 'green' || phase === 'yellow') {
          this.redArmed.delete(key);
        }
        void junctionEnd;
      }
    }

    // ── va chạm (NPC hoặc công trình) ──
    if (collisions.length) {
      for (const c of collisions) {
        const msg = c === 'building' ? 'Va chạm công trình' : 'Va chạm với xe khác';
        this.add('collision', 'major', msg, p);
      }
      collisions.length = 0;
    }
  }
}

/** Ước lượng s gần nhất của điểm p trên road (chiếu lên polyline) */
function pointAtSRough(road: MapRoad, p: PlayerState): number {
  let best = 0;
  let bestD = Infinity;
  let acc = 0;
  const pts = road.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - x0) * dx + (p.z - z0) * dz) / l2)) : 0;
    const px = x0 + dx * t;
    const pz = z0 + dz * t;
    const d = Math.hypot(px - p.x, pz - p.z);
    if (d < bestD) {
      bestD = d;
      best = acc + Math.hypot(px - x0, pz - z0) * (l2 > 0 ? 1 : 0);
    }
    acc += Math.hypot(dx, dz);
  }
  return best;
}
