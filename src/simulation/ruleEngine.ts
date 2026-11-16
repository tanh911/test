// ⚖️ ruleEngine.ts — phát hiện vi phạm + chấm điểm Fahrfehler (Protocol Prompt 9 / mục 6)
// Chuẩn StVO: rechts-vor-links, vorfahrtstraße, stop, kreisverkehr, fußgänger.
import type { GameMap, MapRoad, MapIntersection } from '../world/mapLoader';
import { pointAtS, roadCurve } from '../world/mapLoader';

import type { TrafficLightController, LightPhase } from '../world/trafficLights';

export type Severity = 'minor' | 'major';

export type ViolationType =
  | 'speed'
  | 'offroad'
  | 'redlight'
  | 'collision'
  | 'nosignal'
  | 'right_of_way'   // rechts vor links / vorfahrtstraße
  | 'stop_sign'      // không dừng hẳn tại Haltlinie
  | 'roundabout'     // sai quy tắc vòng xuyến
  | 'pedestrian'     // không nhường người đi bộ tại zebra
  | 'out_of_bounds'; // rời khỏi khu vực thi sát hạch

export interface Violation {
  type: ViolationType;
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
  signal?: 'left' | 'right' | null; // xi-nhan đang bật (null/tắt = không có)
  /** đã dừng hẳn (speed ≈ 0) — dùng để check stop sign */
  stopped?: boolean;
  /** đang trong vùng zebra/crosswalk — dùng để check nhường ped */
  inCrosswalk?: boolean;
  /** có xe NPC từ bên phải đang tiến vào ngã tư đồng cấp (Rechts vor links) */
  rightPriorityThreat?: boolean;
}

const TOLERANCE_KMH = 3;
const OFFROAD_MARGIN = 1.0;
// rẽ (tích lũy góc) vượt ngưỡng này (~26°) mà không xi-nhan → lỗi 'nosignal'
const NOSIGNAL_TURN_RAD = 0.45;
// khoảng cách đến junction xem là "tiếp cận" (m)
const APPROACH_JUNCTION = 12;
// khoảng cách xem là "đã vượt vạch dừng" (m)
const PASS_STOP_LINE = 2;
const RATE_LIMIT: Record<ViolationType, number> = {
  speed: 4, offroad: 6, redlight: 30, collision: 3, nosignal: 8,
  right_of_way: 15, stop_sign: 15, roundabout: 15, pedestrian: 15,
  out_of_bounds: 10
};

export interface RuleEngineOptions {
  /** Có kết thúc bài thi ngay khi xảy ra va chạm hay không (hỏi lại theo quyết định người dùng) */
  endExamOnCollision?: boolean;
}

export class RuleEngine {
  violations: Violation[] = [];
  private lastAt: Record<ViolationType, number> = {
    speed: -99, offroad: -99, redlight: -99, collision: -99, nosignal: -99,
    right_of_way: -99, stop_sign: -99, roundabout: -99, pedestrian: -99,
    out_of_bounds: -99
  };
  private elapsedTime = 0;
  /** junction đang tiếp cận (tránh double-count) */
  private redArmed = new Set<string>();
  /** đã kiểm tra stop sign tại junction này chưa (tránh double-count) */
  private stopChecked = new Set<string>();
  /** đã kiểm tra right_of_way tại junction này chưa */
  private rowChecked = new Set<string>();
  /** đã kiểm tra roundabout tại junction này chưa */
  private rbtChecked = new Set<string>();
  currentSpeedLimit = 50;
  static instanceCounter = 0;
  // ── phát hiện 'nosignal': chỉ đánh giá khi xe chuyển road tại nút (góc >= 35°) hoặc đổi làn ──
  private lastRoadId: string | null = null;
  private lastRoadTravelHeading: number | null = null;
  // ── Chống đếm lặp lỗi tốc độ theo từng đợt (Episode-based Speeding Tracker) ──
  private activeSpeedViolation: Violation | null = null;
  private activeSpeedPeakKmh = 0;
  private activeSpeedLimit = 0;
  private belowLimitDuration = 0;
  private map: GameMap;
  private controllers: TrafficLightController[];
  private mapBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  // ── Cờ chống lặp va chạm (chỉ ghi 1 lần cho đến khi cách vật cản >= 1.5m) ──
  private inCollisionContact = false;
  private lastCollisionPos: { x: number; z: number } | null = null;
  public examEnded = false;
  readonly options: RuleEngineOptions;

  readonly instanceId = ++RuleEngine.instanceCounter;
  constructor(map: GameMap, controllers: TrafficLightController[] = [], options: RuleEngineOptions = {}) {
    this.map = map;
    this.controllers = controllers ?? [];
    this.options = options;

    // Sinh Bounding Box động từ toàn bộ nodes và roads của map (không hardcode)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const n of map.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.z < minZ) minZ = n.z;
      if (n.z > maxZ) maxZ = n.z;
    }
    for (const r of map.roads) {
      for (const pt of r.points) {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minZ) minZ = pt[1];
        if (pt[1] > maxZ) maxZ = pt[1];
      }
    }
    this.mapBounds = { minX, maxX, minZ, maxZ };

    const w = typeof window !== 'undefined' ? (window as unknown as { __reCount?: number }) : undefined;
    if (w) w.__reCount = (w.__reCount ?? 0) + 1;
  }

  get bestanden(): boolean {
    const major = this.violations.filter(v => v.severity === 'major').length;
    const minor = this.violations.length - major;
    const speedCount = this.violations.filter(v => v.type === 'speed').length;
    // Chuẩn thi thực hành Đức (Fahrprüfung):
    // - Bất kỳ lỗi nặng (major > 0) → trượt ngay
    // - Lặp lại lỗi vượt tốc độ từ 2 đợt riêng biệt trở lên → trượt
    // - Tổng lỗi nhẹ từ 3 lỗi trở lên → trượt
    return major === 0 && minor < 3 && speedCount < 2;
  }

  get summary(): string {
    const major = this.violations.filter(v => v.severity === 'major').length;
    const minor = this.violations.length - major;
    return this.bestanden ? `BESTANDEN (${minor} Fehler leicht)` : `NICHT BESTANDEN — ${major} schwer / ${minor} leicht`;
  }

  /** Lấy danh sách vi phạm theo severity cho báo cáo chi tiết */
  get violationsBySeverity(): { major: Violation[]; minor: Violation[] } {
    return {
      major: this.violations.filter(v => v.severity === 'major'),
      minor: this.violations.filter(v => v.severity === 'minor')
    };
  }

  get elapsed(): number { return this.elapsedTime; }

  private add(type: ViolationType, severity: Severity, message: string, p: PlayerState): void {
    if (this.elapsedTime - this.lastAt[type] < RATE_LIMIT[type]) return;
    this.lastAt[type] = this.elapsedTime;
    this.violations.push({ type, severity, message: message, x: p.x, z: p.z, t: this.elapsedTime });
  }

  /** Road gần điểm p nhất (kèm s chiếu + khoảng cách từ tâm đường) */
  nearestRoad(p: PlayerState): { road: MapRoad; s: number; dist: number } | null {
    let best: { road: MapRoad; s: number; dist: number } | null = null;
    for (const road of this.map.roads) {
      const s = pointAtSRough(road, p);
      const pt = pointAtS(road, s);
      const d = Math.hypot(pt.x - p.x, pt.z - p.z);
      if (!best || d < best.dist) best = { road, s, dist: d };
    }
    return best;
  }

  /** Lấy intersection rule tại nodeId */
  private ixRule(nodeId: string): MapIntersection['rule'] | null {
    const ix = this.map.intersections.find((i) => i.nodeId === nodeId);
    return ix ? ix.rule : null;
  }

  /** Kiểm tra xem player có đang tiến về junction với rule 'stop' và đã vượt vạch dừng chưa */
  private checkStopSign(p: PlayerState, road: MapRoad, nearS: number, dir: 1 | -1): void {
    const len = roadCurve(road).length;
    const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
    // Chỉ xét nút ở PHÍA TRƯỚC theo hướng xe chạy (dir > 0 ? road.to : road.from)
    const targetNodeId = dir > 0 ? road.to : road.from;
    const rule = this.ixRule(targetNodeId);
    if (rule !== 'stop') return;

    const stopS = dir > 0 ? len - half - 2 : half + 2;
    const distToStop = dir > 0 ? stopS - nearS : nearS - stopS;
    const key = `${road.id}:${targetNodeId}:stop`;

    // Cận dưới cho distToStop: chỉ ghi nhận khi xe vừa cắt qua vạch dừng trong phạm vi [-4.0m, -PASS_STOP_LINE]
    if (distToStop < -PASS_STOP_LINE && distToStop > -4.0 && !this.stopped(p) && !this.stopChecked.has(key)) {
      this.add('stop_sign', 'major', 'Không dừng hẳn tại dấu Stop', p);
      this.stopChecked.add(key);
    }
    // rời xa junction → reset
    if (Math.abs(distToStop) > APPROACH_JUNCTION) {
      this.stopChecked.delete(key);
    }
  }

  private stopped(p: PlayerState): boolean {
    return (p.stopped ?? false) || Math.abs(p.speed) < 0.15;
  }

  /** Kiểm tra rechts vor links / vorfahrtstraße tại giao lộ right_before_left / priority_road */
  private checkRightOfWay(p: PlayerState, road: MapRoad, nearS: number, dir: 1 | -1): void {
    const len = roadCurve(road).length;
    for (const nodeId of [road.from, road.to]) {
      const rule = this.ixRule(nodeId);
      if (rule !== 'right_before_left' && rule !== 'priority_road') continue;
      const junctionS = road.to === nodeId ? len : 0;
      const distToJunction = dir > 0 ? len - nearS : nearS;
      const key = `${road.id}:${nodeId}:row`;
      // đang tiếp cận junction (cách < APPROACH_JUNCTION) và chưa kiểm tra
      if (distToJunction < 8.5 && distToJunction > 1.5 && !this.rowChecked.has(key)) {
        if (rule === 'right_before_left' && p.rightPriorityThreat && p.speed * 3.6 > 10) {
          this.add('right_of_way', 'major', 'Không nhường đường bên phải (Rechts vor links)', p);
          this.rowChecked.add(key);
        }
      }
      // rời xa junction → reset
      if (distToJunction > APPROACH_JUNCTION) {
        this.rowChecked.delete(key);
      }
    }
  }

  /** Kiểm tra quy tắc vòng xuyến (Kreisverkehr) */
  private checkRoundabout(p: PlayerState, road: MapRoad, nearS: number, dir: 1 | -1): void {
    const len = roadCurve(road).length;
    for (const nodeId of [road.from, road.to]) {
      const rule = this.ixRule(nodeId);
      if (rule !== 'roundabout') continue;
      const junctionS = road.to === nodeId ? len : 0;
      const distToJunction = dir > 0 ? len - nearS : nearS;
      const key = `${road.id}:${nodeId}:rbt`;
      // đang tiến vào vòng xuyến (cách < 8m) và không có xi-nhan phải → vi phạm (cấm rẽ trái vào vòng)
      if (distToJunction < 8 && distToJunction > 2 && !this.rbtChecked.has(key)) {
        if (!p.signal || p.signal !== 'right') {
          this.add('roundabout', 'major', 'Vào Kreisverkehr phải RẼ PHẢI và có xi-nhan phải', p);
        }
        this.rbtChecked.add(key);
      }
      // rời xa junction → reset
      if (distToJunction > APPROACH_JUNCTION) {
        this.rbtChecked.delete(key);
      }
    }
  }

  update(dt: number, p: PlayerState, collisions: string[]): void {
    this.elapsedTime += dt;

    // ── tốc độ: chống đếm lặp trong cùng 1 đợt vượt tốc & phân loại lỗi nặng/nhẹ chuẩn Đức ──
    const kmh = p.speed * 3.6;
    const near = this.nearestRoad(p);
    if (near) { this.currentSpeedLimit = near.road.speedLimit; }
    if (near) {
      const limit = near.road.speedLimit;
      const over = kmh - limit;
      if (over > TOLERANCE_KMH && kmh > 10) {
        this.belowLimitDuration = 0;
        const roundedKmh = Math.round(kmh);
        // Vượt >= 15 km/h (hoặc >= 12 km/h trong khu Tempo 30, vd >= 42 km/h ở khu 30) là lỗi NẶNG (Schwerer Fehler)
        const isMajorSpeed = over >= 15 || (limit <= 30 && over >= 12);
        const sev: Severity = isMajorSpeed ? 'major' : 'minor';
        const msg = isMajorSpeed
          ? `Vượt tốc độ nghiêm trọng ${roundedKmh} km/h (limit ${limit})`
          : `Vượt tốc độ ${roundedKmh} km/h (limit ${limit})`;

        if (!this.activeSpeedViolation || this.activeSpeedLimit !== limit) {
          // Bắt đầu đợt vượt tốc mới (hoặc sang vùng giới hạn tốc độ mới)
          if (this.elapsedTime - this.lastAt.speed >= RATE_LIMIT.speed) {
            this.lastAt.speed = this.elapsedTime;
            const v: Violation = {
              type: 'speed',
              severity: sev,
              message: msg,
              x: p.x,
              z: p.z,
              t: this.elapsedTime
            };
            this.violations.push(v);
            this.activeSpeedViolation = v;
            this.activeSpeedPeakKmh = roundedKmh;
            this.activeSpeedLimit = limit;
          }
        } else {
          // Đang trong cùng 1 đợt vượt tốc → CẬP NHẬT đỉnh tốc độ & nâng mức lỗi nếu vượt ngưỡng nặng (KHÔNG cộng dồn lặp lỗi!)
          if (roundedKmh > this.activeSpeedPeakKmh) {
            this.activeSpeedPeakKmh = roundedKmh;
            this.activeSpeedViolation.message = msg;
            this.activeSpeedViolation.x = p.x;
            this.activeSpeedViolation.z = p.z;
          }
          if (sev === 'major' && this.activeSpeedViolation.severity !== 'major') {
            this.activeSpeedViolation.severity = 'major';
            this.activeSpeedViolation.message = msg;
          }
        }
      } else if (kmh <= limit + 1.0) {
        // Khi xe đã giảm tốc về dưới giới hạn liên tục >= 5 giây thì mới khép lại đợt vượt tốc cũ
        this.belowLimitDuration += dt;
        if (this.belowLimitDuration >= 5.0) {
          this.activeSpeedViolation = null;
          this.activeSpeedPeakKmh = 0;
        }
      }
    }

    // ── rời mặt đường ──
    if (near) {
      const half = (near.road.lanesForward + near.road.lanesBackward) * near.road.laneWidth / 2;
      if (near.dist > half + OFFROAD_MARGIN && kmh > 5) {
        this.add('offroad', 'minor', 'Rời mặt đường / lên vỉa hè', p);
      }

      // ── stop sign (chỉ gọi 1 lần theo hướng flow thực tế) ──
      const pt = pointAtS(near.road, near.s);
      const flowDot = Math.sin(pt.heading) * Math.sin(p.heading) + Math.cos(pt.heading) * Math.cos(p.heading);
      const dir: 1 | -1 = flowDot >= 0 ? 1 : -1;
      this.checkStopSign(p, near.road, near.s, dir);

      // ── rechts vor links / vorfahrtstraße ──
      this.checkRightOfWay(p, near.road, near.s, dir);

      // ── roundabout ──
      this.checkRoundabout(p, near.road, near.s, dir);

      // ── nhường người đi bộ tại zebra ──
      if (p.inCrosswalk && kmh > 2 && !this.stopped(p)) {
        this.add('pedestrian', 'major', 'Không nhường người đi bộ tại Zebrastreifen', p);
      }

      // ── quên xi-nhan khi rẽ (StVO chưa đối chiếu): chỉ đánh giá khi xe chuyển road tại nút (góc giữa hai nhánh >= 35°) hoặc đổi làn, KHÔNG tích lũy góc dọc cùng một road ──
      // Chỉ nhận diện xe đang chạy dọc theo road khi hướng xe tương đối khớp với trục đường (|flowDot| >= 0.5, tránh nhận nhầm đường cắt ngang ở tâm ngã tư)
      if (Math.abs(flowDot) >= 0.5) {
        const curTravelHeading = dir > 0 ? pt.heading : pt.heading + Math.PI;
        if (this.lastRoadId !== null && this.lastRoadId !== near.road.id) {
          if (this.lastRoadTravelHeading !== null) {
            const turnAngleDeg = Math.abs(wrapHeadingDelta(curTravelHeading - this.lastRoadTravelHeading)) * 180 / Math.PI;
            if (turnAngleDeg >= 35 && kmh > 5 && !p.signal) {
              this.add('nosignal', 'minor', 'Quên xi-nhan khi rẽ', p);
            }
          }
        }
        this.lastRoadId = near.road.id;
        this.lastRoadTravelHeading = curTravelHeading;
      }

      // ── đèn đỏ: CHỈ xét junction ở PHÍA TRƯỚC theo hướng xe (dir > 0 ? road.to : road.from) ──
      const len = roadCurve(near.road).length;
      const targetNodeId = dir > 0 ? near.road.to : near.road.from;
      const ctrl = this.controllers.find(c => c.nodeId === targetNodeId);
      if (ctrl) {
        const half = (near.road.lanesForward + near.road.lanesBackward) * near.road.laneWidth / 2;
        const stopS = dir > 0 ? len - half - 2 : half + 2;
        const distToStop = dir > 0 ? stopS - near.s : near.s - stopS;
        const key = `${near.road.id}:${targetNodeId}`;
        // rời xa vạch → re-arm
        if (distToStop > 12 || distToStop < -12) {
          this.redArmed.delete(key);
        } else {
          const phase: LightPhase = ctrl.phaseForArm(near.road.id, dir > 0 ? 'to' : 'from');
          // cắt vạch khi đỏ: đang tiến về vạch khi đỏ (armed), vượt stopS trong phạm vi [-6, 0), vẫn chạy
          if (phase === 'red' && distToStop < 0 && distToStop > -6 && this.redArmed.has(key) && kmh > 5) {
            this.add('redlight', 'major', 'Chạy đèn đỏ', p);
            this.redArmed.delete(key);
          } else if (phase === 'red' && distToStop >= 0 && distToStop < 12) {
            // đang tiến về vạch khi đỏ → armed
            if (kmh > 5) this.redArmed.add(key);
          } else if (phase === 'green' || phase === 'yellow') {
            this.redArmed.delete(key);
          }
        }
      }
    }

    // ── va chạm (NPC hoặc công trình): 1 sự kiện ghi 1 lần + kiểm tra ai đâm ai ──
    if (collisions.length) {
      if (this.lastCollisionPos) {
        const distFromLast = Math.hypot(p.x - this.lastCollisionPos.x, p.z - this.lastCollisionPos.z);
        if (distFromLast >= 1.5) {
          this.inCollisionContact = false;
        }
      }
      if (!this.inCollisionContact) {
        for (const c of collisions) {
          const isNpc = c.startsWith('npc') || c === 'npc';
          let playerAtFault = true;
          if (isNpc) {
            // Nếu người chơi đang đứng yên (speed < 0.15) và không có nguy cơ vi phạm ưu tiên bên phải
            if (Math.abs(p.speed) < 0.15 && !p.rightPriorityThreat) {
              playerAtFault = false;
            }
          }
          console.log(`[TRACE collision] atFault=${playerAtFault} isNpc=${isNpc} p.speed=${p.speed.toFixed(1)} rightPriorityThreat=${p.rightPriorityThreat} c=${c}`);
          if (playerAtFault) {
            const msg = c === 'building' ? 'Va chạm công trình' : 'Va chạm với xe khác';
            this.add('collision', 'major', msg, p);
            this.inCollisionContact = true;
            this.lastCollisionPos = { x: p.x, z: p.z };
            if (this.options?.endExamOnCollision) {
              this.examEnded = true;
            }
            break;
          }
        }
      }
      collisions.length = 0;
    } else if (this.inCollisionContact && this.lastCollisionPos) {
      const distFromLast = Math.hypot(p.x - this.lastCollisionPos.x, p.z - this.lastCollisionPos.z);
      if (distFromLast >= 1.5) {
        this.inCollisionContact = false;
      }
    }

    // ── rời khỏi khu vực thi sát hạch (out_of_bounds): bounding box sinh từ map + dung sai 10m ──
    const b = this.mapBounds;
    if (p.x < b.minX - 10 || p.x > b.maxX + 10 || p.z < b.minZ - 10 || p.z > b.maxZ + 10) {
      this.add('out_of_bounds', 'major', 'Rời khỏi khu vực thi sát hạch', p);
    }
  }
}

/** Chuẩn hóa Δheading về (−π, π] — heading không wrap nhưng lần đầu chơi có thể lọt qua 0/2π */
function wrapHeadingDelta(d: number): number {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Ước lượng s gần nhất của điểm p trên road (chiếu lên curve points đều theo cung) */
function pointAtSRough(road: MapRoad, p: PlayerState): number {
  const curve = roadCurve(road);
  const pts = curve.pts;
  const n = pts.length;
  const segLen = n > 1 ? curve.length / (n - 1) : curve.length;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < n - 1; i++) {
    const x0 = pts[i].x, z0 = pts[i].z;
    const x1 = pts[i + 1].x, z1 = pts[i + 1].z;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - x0) * dx + (p.z - z0) * dz) / l2)) : 0;
    const px = x0 + dx * t;
    const pz = z0 + dz * t;
    const d = Math.hypot(px - p.x, pz - p.z);
    if (d < bestD) {
      bestD = d;
      best = i * segLen + t * segLen;
    }
  }
  return best;
}
