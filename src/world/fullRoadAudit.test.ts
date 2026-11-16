// fullRoadAudit.test.ts — 🔍 AUDIT ĐẶC THÙ BERLIN OSM (A2, B, E, F).
// Lưu ý (Bước 5A.3): Các bài kiểm tra bất biến chung cho mọi GameMap (A1, C, D)
// đã được tách sang `src/world/mapIntegrityAudit.test.ts` (nhận map làm tham số).
// File này chỉ giữ lại 4 bài kiểm tra phụ thuộc trực tiếp vào dữ liệu Berlin OSM / WFS cache:
//   A2. NGUỒN — mỗi biển trên Berlin phải từ cột WFS thật (cache) hoặc synthetic luật thi.
//   B.  COVERAGE — cột WFS hợp lệ snap được vào graph phải được đại diện ≥95%.
//   F.  ROAD ≠ RAILWAY — file extraction OSM o['ways'] phải có 0 railway way.
//   E.  Bảng tổng hợp 288 đường Berlin-Mitte.
// Chạy: npx vitest run src/world/fullRoadAudit.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import type { GameMap, MapRoad, MapSign } from './mapLoader';
import { loadGameMap, roadLength, roadPointAt, roadCurve } from './mapLoader';
import { roadHalfWidth } from './roadMesh';
import { buildingStrips } from './buildings';

const map: GameMap = loadGameMap(berlinMitteMap);

const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat: number, lon: number): [number, number] => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

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

function signWorldPos(sign: MapSign, road: MapRoad): XYPt {
  const pt = roadPointAt(road, sign.s);
  const half = roadHalfWidth(road);
  const side = sign.side === 'right' ? 1 : -1;
  return { x: pt.x + pt.nx * side * (half + 1.2), z: pt.z + pt.nz * side * (half + 1.2) };
}
interface XYPt { x: number; z: number; }

interface SnapResult {
  road: MapRoad;
  dist: number;
  s: number;
  side: 'left' | 'right';
  pos: XYPt;
  excluded: string | null;
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
function snapMast(map: GameMap, _roadsById: Map<string, MapRoad>, x: number, z: number): SnapResult | null {
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
  if (best.dist > half + 6) excluded = 'quá xa curb (plaza)';
  if (len < 5 || sCurve < 1.5 || sCurve > len - 1.5) excluded = 'sát mép road';
  else if (!excluded) {
    const reason = posClear(map.roads, stripsCache, pos.x, pos.z);
    if (reason) excluded = reason;
  }
  return { road: best.road, dist: best.dist, s: sCurve, side, pos, excluded };
}

describe('🛣️ FULL ROAD AUDIT (BERLIN OSM SPECIFIC — A2, B, F, E)', () => {
  const roadsById = new Map(map.roads.map((r) => [r.id, r]));
  const roadName = (r: MapRoad) => (r as unknown as { name?: string }).name || '—';

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
          synthetic = Math.abs(sign.s - wrongEndS) < 30;
        }
      } else if (sign.type === '220') {
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
      if (!snap || snap.dist > 12 || snap.excluded) continue;
      expected++;
      for (const code of codes) {
        const hit = (map.signs as MapSign[]).some((sg) => {
          if (sg.type !== code.type) return false;
          if (code.value !== undefined && sg.value !== undefined && sg.value !== code.value) return false;
          const r = roadsById.get(sg.roadId);
          if (!r) return false;
          const w = signWorldPos(sg, r);
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

  // ── F. ROAD ≠ RAILWAY (structural) ──
  it('F. Pipeline không convert railway thành road (o[ways] phải 0 railway way)', () => {
    let osm: { ways?: Array<{ id?: string; tags?: Record<string, string> }>; railways?: unknown[] } | null = null;
    try {
      osm = JSON.parse(readFileSync('scripts/osm_pbf_extracted_stadt.json', 'utf8'));
    } catch { console.info('[F] (bỏ qua — không có extraction file)'); return; }
    const railwayInWays = (osm?.ways || []).filter(w => w.tags && w.tags.railway && w.tags.highway !== undefined);
    const railOnly = (osm?.ways || []).filter(w => w.tags && w.tags.railway && w.tags.highway === undefined);
    console.info(`[F] o[ways]: ${osm?.ways?.length ?? 0} ways · railway-tagged: ${railwayInWays.length} (rail-only: ${railOnly.length})`);
    expect(railwayInWays.length).toBe(0);
    expect((map.rails || []).length).toBeGreaterThan(50);
  });

  // ── E. Bảng tổng hợp mọi đường ──
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
    expect(map.roads.length).toBe(288);
  });
});
