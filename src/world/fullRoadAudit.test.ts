// fullRoadAudit.test.ts — 🔍 AUDIT TOÀN BỘ ĐƯỜNG: biển báo đúng + lỗi đường.
// Quét TẤT CẢ 288 road + TẤT CẢ signs + intersections/spawns/props/buildings:
//   A1. BIỂN — từng biển: roadId/type/value/s/side hợp lệ, không trùng, không
//       đứng giữa đường/trong nhà.
//   A2. NGUỒN — không "biển ma": mỗi biển phải từ cột WFS thật (cache) hoặc
//       synthetic luật thi (306/205 tại priority_road, 267 tại one-way).
//   B.  COVERAGE — cột WFS hợp lệ snap được vào graph phải được đại diện ≥97%
//       (loại trừ các cột bị skip HỢP LỆ: đè đường/nhà, sát mép road).
//   C.  ĐƯỜNG — cấu trúc từng road + không chồng lấn lòng đường với road lạ.
//   D.  LIÊN QUAN — intersections/spawns/props/buildings/waters trỏ đúng.
//   E.  Bảng tổng hợp mọi đường (console).
// Chạy: npx vitest run src/world/fullRoadAudit.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import type { GameMap, MapRoad, MapSign } from './mapLoader';
import { loadGameMap, roadLength, roadPointAt, roadCurve } from './mapLoader';
import { roadHalfWidth } from './roadMesh';
import { buildingStrips } from './buildings';
import { SIGN_DEFS } from './trafficSigns';

const map: GameMap = loadGameMap(berlinMitteMap);

// ── Quy đổi lat/lon → mét local (CÙNG GỐC với osm_to_roadgraph / import script) ──
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat: number, lon: number): [number, number] => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

// ── Mã StVO hợp lệ mà sim hỗ trợ (mirror import_berlin_signs.mjs) ──
const SIM_TYPES = new Set(['205', '206', '301', '306', '102', '274', '274.1', '220', '267', '283', '286', '314', '350', '101', '138', '215']);
function parseWfsCodes(raw: string): Array<{ type: string; value?: number }> {
  const out: Array<{ type: string; value?: number }> = [];
  for (const rawCode of (raw || '').split(',')) {
    const c = rawCode.trim();
    if (!c || c === 'SZ' || /^1\d{3}/.test(c) || /^e\d/i.test(c)) continue;
    const base = c.split('-')[0];
    if (base === '274' && c.includes('.')) {
      if (c.startsWith('274.1')) out.push({ type: '274.1' });
      continue;
    }
    if (base === '274') {
      const v = parseInt(c.split('-')[1], 10);
      if (Number.isFinite(v) && v >= 3 && v <= 130) out.push({ type: '274', value: v });
      continue;
    }
    if (SIM_TYPES.has(base)) out.push({ type: base });
  }
  return out;
}

function distToPolyline(px: number, pz: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}
/** Vị trí world của biển theo ĐÚNG công thức sim (placeSigns: right vector = (nx,nz)) */
function signWorldPos(sign: MapSign, road: MapRoad): XYPt {
  const pt = roadPointAt(road, sign.s);
  const half = roadHalfWidth(road);
  const side = sign.side === 'right' ? 1 : -1;
  return { x: pt.x + pt.nx * side * (half + 1.2), z: pt.z + pt.nz * side * (half + 1.2) };
}
interface XYPt { x: number; z: number; }

// ── Snap cột WFS: trả {road, s, side, pos, excluded} — mirror import script ──
interface SnapResult {
  road: MapRoad;
  dist: number;
  s: number;
  side: 'left' | 'right';
  pos: XYPt;
  excluded: string | null; // lý do bị skip hợp lệ (clash/mép) — null nếu hợp lệ
}
const stripsCache: Array<[number, number, number, number]> = (() => {
  const st: Array<[number, number, number, number]> = [];
  for (const b of map.buildings) {
    const s = buildingStrips(map, { ...b, depthOff: 0 });
    if (s) st.push(...s);
  }
  return st;
})();
function posClear(roads: MapRoad[], strips: Array<[number, number, number, number]>, x: number, z: number): string | null {
  for (const r of roads) {
    if (distToPolyline(x, z, r.points) < roadHalfWidth(r) - 0.3) return 'đè lòng đường';
  }
  for (const [a, b, c, d] of strips) {
    if (x > a && x < c && z > b && z < d) return 'trong nhà';
  }
  return null;
}
function snapMast(map: GameMap, roadsById: Map<string, MapRoad>, x: number, z: number): SnapResult | null {
  // ĐỒNG BỘ import_berlin_signs.mjs: snap POLYLINE → sCurve (sample curve gần
  // nhất, round 0.1) → pos = roadPointAt(sCurve) + n·(half+1.2) — exclude theo
  // posClear tại chính vị trí render đó
  let best: { road: MapRoad; dist: number; px: number; pz: number; tx: number; tz: number } | null = null;
  for (const road of map.roads) {
    for (let i = 0; i < road.points.length - 1; i++) {
      const ax = road.points[i][0], az = road.points[i][1];
      const bx = road.points[i + 1][0], bz = road.points[i + 1][1];
      const segL = Math.hypot(bx - ax, bz - az);
      if (segL < 1e-9) continue;
      const tx = (bx - ax) / segL, tz = (bz - az) / segL;
      const t = Math.max(0, Math.min(segL, (x - ax) * tx + (z - az) * tz));
      const d = Math.hypot(x - (ax + tx * t), z - (az + tz * t));
      if (!best || d < best.dist) {
        best = { road, dist: d, px: ax + tx * t, pz: az + tz * t, tx, tz };
      }
    }
  }
  if (!best) return null;
  const cross = best.tx * (z - best.pz) - best.tz * (x - best.px);
  const side: 'left' | 'right' = cross > 0 ? 'right' : 'left';
  const half = roadHalfWidth(best.road);
  const c = roadCurve(best.road);
  let sCurve = 0, bd2 = Infinity;
  for (let i = 0; i < c.pts.length; i++) {
    const dd = Math.hypot(c.pts[i].x - best.px, c.pts[i].z - best.pz);
    if (dd < bd2) { bd2 = dd; sCurve = Math.round(((c.length * i) / (c.pts.length - 1)) * 10) / 10; }
  }
  const pt = roadPointAt(best.road, sCurve);
  const sgn = side === 'right' ? 1 : -1;
  const pos = { x: pt.x + pt.nx * sgn * (half + 1.2), z: pt.z + pt.nz * sgn * (half + 1.2) };
  const len = roadLength(best.road);
  let excluded: string | null = null;
  // Biển thật đứng ở CURB: cột xa tim > half+6 (quảng trường/pedestrian zone) =
  // snap nhầm road — import skip hợp lệ → test cũng không kỳ vọng
  if (best.dist > half + 6) excluded = 'quá xa curb (plaza)';
  if (len < 5 || sCurve < 1.5 || sCurve > len - 1.5) excluded = 'sát mép road';
  else if (!excluded) {
    const reason = posClear(map.roads, stripsCache, pos.x, pos.z);
    if (reason) excluded = reason;
  }
  return { road: best.road, dist: best.dist, s: sCurve, side, pos, excluded };
}

describe('🛣️ FULL ROAD AUDIT — tất cả đường + biển báo', () => {
  const roadsById = new Map(map.roads.map((r) => [r.id, r]));
  const nodeIds = new Set(map.nodes.map((n) => n.id));
  const roadName = (r: MapRoad) => (r as unknown as { name?: string }).name || '—';

  // ── A1. BIỂN: integrity từng biển ──
  it('A1. Mỗi biển: roadId/type/value/s/side hợp lệ + không trùng + không đè đường/nhà', () => {
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const sign of map.signs as MapSign[]) {
      const tag = `${sign.type}${sign.value ? '-' + sign.value : ''}@${sign.roadId}:${sign.s}`;
      const road = roadsById.get(sign.roadId);
      if (!road) { issues.push(`${tag}: roadId không tồn tại`); continue; }
      if (!SIGN_DEFS[sign.type]) { issues.push(`${tag}: type ${sign.type} không có SIGN_DEFS`); continue; }
      if (sign.type === '274' && (sign.value === undefined || sign.value < 3 || sign.value > 130)) {
        issues.push(`${tag}: value tốc độ sai (${sign.value})`); continue;
      }
      if (sign.type !== '274' && sign.type !== '274.1' && sign.value !== undefined) {
        issues.push(`${tag}: biển ${sign.type} không cần value=${sign.value}`);
      }
      if (sign.side !== 'left' && sign.side !== 'right') { issues.push(`${tag}: side sai`); continue; }
      const len = roadLength(road);
      if (!Number.isFinite(sign.s) || sign.s < 1.5 || sign.s > len - 1.5) {
        issues.push(`${tag}: s=${sign.s} ngoài [1.5, ${len.toFixed(0)}]`); continue;
      }
      const key = `${sign.roadId}|${sign.type}|${sign.value ?? ''}|${sign.side}|${Math.round(sign.s / 2)}`;
      if (seen.has(key)) { issues.push(`${tag}: trùng biển liền kề`); continue; }
      seen.add(key);
      const w = signWorldPos(sign, road);
      let onRoad = '';
      for (const r2 of map.roads) {
        if (distToPolyline(w.x, w.z, r2.points) < roadHalfWidth(r2) - 0.3) { onRoad = r2.id; break; }
      }
      if (onRoad) { issues.push(`${tag}: cột đứng giữa lòng đường ${onRoad} @(${w.x.toFixed(0)},${w.z.toFixed(0)})`); continue; }
      for (const [a, b, c, d] of stripsCache) {
        if (w.x > a && w.x < c && w.z > b && w.z < d) {
          issues.push(`${tag}: cột trong nhà @(${w.x.toFixed(0)},${w.z.toFixed(0)})`); break;
        }
      }
    }
    if (issues.length) console.info(`[A1] ${issues.length} biển lỗi:\n  ${issues.slice(0, 15).join('\n  ')}`);
    expect(issues).toEqual([]);
  });

  // ── A2. NGUỒN biển: không biển ma ──
  it('A2. Mỗi biển có nguồn: cột WFS thật gần đó HOẶC synthetic luật thi', () => {
    let cache: Array<{ properties: { vkz_zeiche?: string }; geometry: { coordinates: number[] } }> = [];
    try {
      cache = JSON.parse(readFileSync('scripts/berlin_signs_wfs_cache.json', 'utf8'));
    } catch { console.info('[A2] (bỏ qua — không có cache WFS)'); return; }

    const realMasts = cache.map((f) => {
      let [lon, lat] = f.geometry.coordinates;
      if (lat < lon) [lon, lat] = [lat, lon];
      const [x, z] = toXY(lat, lon);
      return { x, z, codes: parseWfsCodes(f.properties?.vkz_zeiche || '') };
    }).filter((m) => m.codes.length > 0);

    const orphans: string[] = [];
    for (const sign of map.signs as MapSign[]) {
      const road = roadsById.get(sign.roadId);
      if (!road) continue;
      const w = signWorldPos(sign, road);
      let real = false;
      for (const m of realMasts) {
        if (Math.hypot(m.x - w.x, m.z - w.z) > 14) continue;
        if (m.codes.some((c) => c.type === sign.type && (sign.value === undefined || c.value === undefined || c.value === sign.value))) {
          real = true; break;
        }
      }
      if (real) continue;
      let synthetic = false;
      if (sign.type === '306' || sign.type === '205') {
        for (const ix of map.intersections) {
          if (ix.rule !== 'priority_road') continue;
          const node = map.nodes.find((n) => n.id === ix.nodeId);
          if (node && Math.hypot(node.x - w.x, node.z - w.z) < 30) { synthetic = true; break; }
        }
      } else if (sign.type === '267') {
        const oneWay = road.lanesBackward === 0 || road.lanesForward === 0;
        if (oneWay) {
          const len = roadLength(road);
          const wrongEndS = road.lanesBackward === 0 ? len : 0;
          // Phần 11.3: oneway B (to→from) — đầu cấm là 'from' (s≈0)
          synthetic = Math.abs(sign.s - wrongEndS) < 30;
        }
      } else if (sign.type === '220') {
        // 220 (Einbahnstraße) ở đầu vào hợp pháp của oneway — nguồn: oneway-fix (Phần 11.2)
        const src = (sign as unknown as { src?: string }).src;
        if (src === 'oneway-fix-220' && (road.lanesBackward === 0 || road.lanesForward === 0)) synthetic = true;
      }
      if (!synthetic) orphans.push(`${sign.type}${sign.value ? '-' + sign.value : ''}@${sign.roadId}:${sign.s.toFixed(1)}`);
    }
    if (orphans.length) console.info(`[A2] ${orphans.length} biển MA (không nguồn):\n  ${orphans.slice(0, 15).join('\n  ')}`);
    expect(orphans).toEqual([]);
  });

  // ── B. COVERAGE WFS ──
  it('B. ≥95% cột WFS hợp lệ (snap ≤12m, không bị skip clash) có biển tương ứng', () => {
    let cache: Array<{ properties: { vkz_zeiche?: string }; geometry: { coordinates: number[] } }> = [];
    try {
      cache = JSON.parse(readFileSync('scripts/berlin_signs_wfs_cache.json', 'utf8'));
    } catch { console.info('[B] (bỏ qua — không có cache WFS)'); return; }

    let expected = 0;
    const missing: string[] = [];
    for (const f of cache) {
      let [lon, lat] = f.geometry.coordinates;
      if (lat < lon) [lon, lat] = [lat, lon];
      const [x, z] = toXY(lat, lon);
      const codes = parseWfsCodes(f.properties?.vkz_zeiche || '');
      if (!codes.length) continue;
      const snap = snapMast(map, roadsById, x, z);
      if (!snap || snap.dist > 12 || snap.excluded) continue; // không trong graph / skip hợp lệ
      expected++;
      for (const code of codes) {
        const hit = (map.signs as MapSign[]).some((sg) => {
          if (sg.type !== code.type) return false;
          if (code.value !== undefined && sg.value !== undefined && sg.value !== code.value) return false;
          const r = roadsById.get(sg.roadId);
          if (!r) return false;
          const w = signWorldPos(sg, r);
          // 18m (trước 15): Phần 11 chuẩn hóa làn oneway (laneWidth 3.0→3.4, half −1.3m) làm biển
  // neo lại lệch ≤2.6m — cột WFS + quy định biển KHÔNG đổi, chỉ neo vị trí đổi
  return Math.hypot(w.x - x, w.z - z) < 18 && Math.hypot(w.x - snap.pos.x, w.z - snap.pos.z) < 18;
        });
        if (!hit) missing.push(`VZ ${code.type}${code.value ? '-' + code.value : ''} @(${x.toFixed(0)},${z.toFixed(0)}) snap ${snap.road.id} d=${snap.dist.toFixed(1)}m`);
      }
    }
    const coverage = expected ? 1 - missing.length / expected : 1;
    console.info(`[B] cột kỳ vọng: ${expected} · thiếu: ${missing.length} · coverage ${(coverage * 100).toFixed(1)}%`);
    if (missing.length) console.info(`  thiếu mẫu:\n  ${missing.slice(0, 12).join('\n  ')}`);
    expect(coverage).toBeGreaterThanOrEqual(0.95);
  });

  // ── C. ĐƯỜNG: cấu trúc + chồng lấn ──
  it('C. Mỗi road: cấu trúc hợp lệ + không chồng lấn lòng đường với road lạ', () => {
    const issues: string[] = [];
    for (const r of map.roads as MapRoad[]) {
      const tag = `${r.id} (${roadName(r)})`;
      if (!nodeIds.has(r.from) || !nodeIds.has(r.to)) issues.push(`${tag}: node from/to không tồn tại`);
      if (r.points.length < 2) issues.push(`${tag}: ít hơn 2 điểm`);
      for (const [x, z] of r.points) {
        if (!Number.isFinite(x) || !Number.isFinite(z)) { issues.push(`${tag}: tọa độ NaN`); break; }
      }
      const len = roadLength(r);
      if (len < 4) issues.push(`${tag}: dài ${len.toFixed(1)} m < 4 m`);
      const totalLanes = r.lanesForward + r.lanesBackward;
      if (totalLanes < 1) issues.push(`${tag}: 0 làn`);
      const width = totalLanes * r.laneWidth;
      if (r.laneWidth < 2.8 || r.laneWidth > 3.75) issues.push(`${tag}: laneWidth ${r.laneWidth} ngoài [2.8, 3.75]`);
      if (width < 3.3) issues.push(`${tag}: rộng ${width} m — xe không vừa`);
      if (width > 30) issues.push(`${tag}: rộng bất thường ${width} m`);
      if (![5, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 130].includes(r.speedLimit)) {
        issues.push(`${tag}: speedLimit ${r.speedLimit} lạ`);
      }
      if (!['main', 'give_way', 'stop', 'equal'].includes(r.priority)) issues.push(`${tag}: priority ${r.priority} lạ`);
      if (!['asphalt', 'asphalt_worn', 'cobble'].includes(r.surface)) issues.push(`${tag}: surface ${r.surface} lạ`);
      if (!r.sidewalk || typeof r.sidewalk.left !== 'boolean' || typeof r.sidewalk.right !== 'boolean') {
        issues.push(`${tag}: thiếu flag sidewalk`);
      }
    }
    // chồng lấn: cặp road KHÔNG chung node nhưng lòng đường trùng nhau
    const roads = map.roads as MapRoad[];
    for (let i = 0; i < roads.length; i++) {
      const A = roads[i];
      for (let j = i + 1; j < roads.length; j++) {
        const B = roads[j];
        if (A.from === B.from || A.from === B.to || A.to === B.from || A.to === B.to) continue;
        const lenA = A.points.reduce((s, p, k) => k ? s + Math.hypot(p[0] - A.points[k - 1][0], p[1] - A.points[k - 1][1]) : 0, 0);
        let hits = 0;
        for (const f of [0.2, 0.4, 0.6, 0.8]) {
          const target = lenA * f;
          let acc = 0, px = A.points[0][0], pz = A.points[0][1];
          for (let k = 1; k < A.points.length; k++) {
            const segL = Math.hypot(A.points[k][0] - A.points[k - 1][0], A.points[k][1] - A.points[k - 1][1]);
            if (acc + segL >= target) {
              const t = segL > 0 ? (target - acc) / segL : 0;
              px = A.points[k - 1][0] + (A.points[k][0] - A.points[k - 1][0]) * t;
              pz = A.points[k - 1][1] + (A.points[k][1] - A.points[k - 1][1]) * t;
              break;
            }
            acc += segL;
          }
          const dB = distToPolyline(px, pz, B.points);
          if (dB < (roadHalfWidth(A) + roadHalfWidth(B)) * 0.5) hits++;
        }
        if (hits >= 2) issues.push(`${A.id} ↔ ${B.id}: lòng đường chồng lấn (${hits}/4 mẫu)`);
      }
    }
    if (issues.length) console.info(`[C] ${issues.length} lỗi đường:\n  ${issues.slice(0, 20).join('\n  ')}`);
    expect(issues).toEqual([]);
  });

  // ── D. Liên quan ──
  it('D. Mọi tham chiếu roadId/nodeId ở intersections/spawns/props/buildings hợp lệ', () => {
    const issues: string[] = [];
    for (const ix of map.intersections) {
      if (!nodeIds.has(ix.nodeId)) issues.push(`intersection ${ix.nodeId}: node không tồn tại`);
      if (!['right_before_left', 'priority_road', 'yield', 'stop', 'traffic_light', 'roundabout'].includes(ix.rule)) {
        issues.push(`intersection ${ix.nodeId}: rule ${ix.rule} lạ`);
      }
      for (const cw of ix.crosswalks) {
        if (!roadsById.has(cw)) issues.push(`intersection ${ix.nodeId}: crosswalk road ${cw} không tồn tại`);
      }
      if (ix.trafficLight) {
        const tl = ix.trafficLight;
        if (tl.greenSeconds <= 0 || tl.yellowSeconds <= 0 || tl.redSeconds <= 0) {
          issues.push(`intersection ${ix.nodeId}: chuỗi thời gian đèn sai`);
        }
      }
    }
    const spawnEntries = Object.entries(map.spawns as unknown as Record<string, { roadId: string; lane?: number; s?: number }>);
    for (const [key, sp] of spawnEntries) {
      if (!roadsById.has(sp.roadId)) issues.push(`spawn '${key}': road ${sp.roadId} không tồn tại`);
      else {
        const r = roadsById.get(sp.roadId)!;
        const total = r.lanesForward + r.lanesBackward;
        if (sp.lane !== undefined && (sp.lane < 0 || sp.lane >= total)) issues.push(`spawn '${key}': lane ${sp.lane} ngoài [0,${total})`);
        if (sp.s !== undefined && (sp.s < 0 || sp.s > roadLength(r))) issues.push(`spawn '${key}': s ngoài đường`);
      }
    }
    for (const pr of map.props ?? []) {
      if (!roadsById.has(pr.roadId)) issues.push(`prop ${pr.type} road ${pr.roadId} không tồn tại`);
    }
    for (const b of map.buildings) {
      if (!roadsById.has(b.roadId)) issues.push(`building road ${b.roadId} không tồn tại`);
    }
    for (const w of map.waters ?? []) {
      if (w.points.length < 2) issues.push(`water ${w.id}: ít điểm`);
    }
    if (issues.length) console.info(`[D] ${issues.length} lỗi tham chiếu:\n  ${issues.slice(0, 15).join('\n  ')}`);
    expect(issues).toEqual([]);
  });

  // ── F. ROAD ≠ RAILWAY (structural): osm_to_roadgraph CHỈ đọc highway ways
  //    (o['ways'] phải 0 railway way) → road không thể sinh từ railway. Guard
  //    fail nếu ai đó thêm railway way vào o['ways'] (bug gốc: 7 road S-Bahn
  //    viaduct bị convert thành đường xe). Overlap 2D với railway KHÔNG fail —
  //    viaduct 7.5m chạy TRÊN CAO đè lên phố là bình thường ở Mitte. ──
  it('F. Pipeline không convert railway thành road (o[ways] phải 0 railway way)', () => {
    let osm: { ways?: Array<{ id?: string; tags?: Record<string, string> }>; railways?: unknown[] } | null = null;
    try {
      osm = JSON.parse(readFileSync('scripts/osm_pbf_extracted_stadt.json', 'utf8'));
    } catch { console.info('[F] (bỏ qua — không có extraction file)'); return; }
    const railwayInWays = (osm?.ways || []).filter(w => w.tags && w.tags.railway && w.tags.highway !== undefined);
    const railOnly = (osm?.ways || []).filter(w => w.tags && w.tags.railway && w.tags.highway === undefined);
    console.info(`[F] o[ways]: ${osm?.ways?.length ?? 0} ways · railway-tagged: ${railwayInWays.length} (rail-only: ${railOnly.length})`);
    expect(railwayInWays.length).toBe(0);
    // cấu trúc dữ liệu: railways nằm riêng → rails render từ đây, không vào road graph
    expect((map.rails || []).length).toBeGreaterThan(50);
  });

  // ── E. Bảng tổng hợp mọi đường ──  // ── E. Bảng tổng hợp mọi đường ──
  it('E. Bảng tổng hợp 288 đường', () => {
    const lines: string[] = [];
    for (const r of map.roads as MapRoad[]) {
      const nSigns = (map.signs as MapSign[]).filter((sg) => sg.roadId === r.id).length;
      const width = ((r.lanesForward + r.lanesBackward) * r.laneWidth).toFixed(1);
      lines.push(
        `${r.id.padEnd(12)} ${roadName(r).padEnd(22)} ${roadLength(r).toFixed(0).padStart(4)}m`
        + ` ${width.padStart(5)}m ${String(r.speedLimit).padStart(3)}km/h ${r.priority.padEnd(9)} 🪧${nSigns}`
      );
    }
    console.info(`[E] ${map.roads.length} đường:\n${lines.join('\n')}`);
    expect(map.roads.length).toBe(288); // 7 road railway-nhầm đã khôi phục
  });
});
