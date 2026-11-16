// onewayAudit.test.ts — 🚧 PHẦN 11.3: guard nhất quán oneway ĐẶC THÙ BERLIN OSM (O1, O4, O1b, O6-convergence).
// Lưu ý (Bước 5A.3): Các bất biến oneway chung cho mọi GameMap (O2, O3, và kiểm tra
// bề rộng oneway 1 làn >= 3.4m) đã được tách sang `src/world/mapIntegrityAudit.test.ts`.
// File này giữ lại các bài kiểm tra đối chiếu trực tiếp với tag OSM (`osm_pbf_extracted_stadt.json`)
// và danh sách ngoại lệ `O1B_EXCEPTIONS` / `r149` của Berlin.
// Chạy: npx vitest run src/world/onewayAudit.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import type { GameMap } from './mapLoader';

const map = berlinMitteMap as unknown as GameMap;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const norm = (s: string) => (s || '').toLowerCase().replaceAll('ß', 'ss').replaceAll('▀', 'ss').replace(/\s+/g, ' ').trim();
const R = 6371000, refLat = 52.5170, refLon = 13.3888;
const toXY = (lat: number, lon: number): [number, number] => [
  ((lon - refLon) * Math.PI) / 180 * R * Math.cos((refLat * Math.PI) / 180),
  ((lat - refLat) * Math.PI) / 180 * R,
];

interface AuditRow {
  roadId: string; name: string; osmOneway: string; osmLanes: number | null;
  lanesF: number; lanesB: number; graphOneway: 'yes(dir=from→to)' | 'yes(dir=to→from)' | 'no';
  signs267: Array<{ s: number; end: 'from' | 'to' | 'mid' }>;
}

function buildRows(): AuditRow[] {
  const osm = JSON.parse(readFileSync(join(root, 'scripts/osm_pbf_extracted_stadt.json'), 'utf8'));
  const waysByStreet = new Map<string, Array<{ tags: Record<string, string>; pts: Array<[number, number]> }>>();
  for (const w of osm.ways ?? []) {
    const name = norm(w.tags?.name);
    if (!name) continue;
    if (!waysByStreet.has(name)) waysByStreet.set(name, []);
    const pts = (w.refs ?? w.nodes ?? []).map((id: string) => osm.nodes[String(id)]).filter(Boolean).map((n: { lat: number; lon: number }) => toXY(n.lat, n.lon));
    if (pts.length >= 2) waysByStreet.get(name)!.push({ tags: w.tags ?? {}, pts });
  }
  const polyMid = (pts: Array<[number, number]>): [number, number] => {
    let L = 0, mx = 0, mz = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      L += d; mx += ((pts[i - 1][0] + pts[i][0]) / 2) * d; mz += ((pts[i - 1][1] + pts[i][1]) / 2) * d;
    }
    return L > 0 ? [mx / L, mz / L] : pts[0];
  };
  return (map.roads as GameMap['roads']).map(road => {
    const cands = waysByStreet.get(norm(road.name ?? ''));
    let way: { tags: Record<string, string> } | null = null;
    if (cands?.length) {
      const rm = polyMid(road.points.map(p => [p[0], p[1]] as [number, number]));
      let bestD = Infinity;
      for (const c of cands) {
        const d = Math.hypot(polyMid(c.pts)[0] - rm[0], polyMid(c.pts)[1] - rm[1]);
        if (d < bestD) { bestD = d; way = c; }
      }
      if (bestD >= 180) way = null;
    }
    const oneway = way?.tags?.oneway;
    const osmOneway = oneway === 'yes' ? 'yes' : oneway === '-1' ? '-1' : (oneway ?? 'no');
    const len = Math.hypot(road.points.at(-1)![0] - road.points[0]![0], road.points.at(-1)![1] - road.points[0]![1]) || 1;
    const graphOneway = road.lanesBackward === 0 ? 'yes(dir=from→to)' as const
      : road.lanesForward === 0 ? 'yes(dir=to→from)' as const : 'no' as const;
    const signs267 = (map.signs as Array<{ type: string; roadId: string; s: number }>)
      .filter(s => s.type === '267' && s.roadId === road.id)
      .map(s => ({ s: s.s, end: (s.s < len * 0.25 ? 'from' : s.s > len * 0.75 ? 'to' : 'mid') as 'from' | 'to' | 'mid' }));
    return {
      roadId: road.id, name: road.name ?? '', osmOneway, osmLanes: way?.tags?.lanes ? parseInt(way.tags.lanes, 10) : null,
      lanesF: road.lanesForward, lanesB: road.lanesBackward, graphOneway, signs267,
    };
  });
}

const O1B_EXCEPTIONS = new Set(['r37', 'r87', 'r99', 'r102', 'r103', 'r105', 'r115', 'r143', 'r146', 'r147', 'r203', 'r230', 'r231', 'r259', 'r276']);

describe('🚧 PHẦN 11.3 — nhất quán oneway ĐẶC THÙ BERLIN OSM (O1, O4, O1b, O6)', () => {
  const rows = buildRows();
  const isTwoWay = (r: AuditRow) => r.graphOneway === 'no';
  const isFoneway = (r: AuditRow) => r.graphOneway === 'yes(dir=from→to)';
  const isBoneway = (r: AuditRow) => r.graphOneway === 'yes(dir=to→from)';

  it('O1: 0 road hai chiều trong graph khi OSM oneway=yes/-1', () => {
    const bad = rows.filter(r => (r.osmOneway === 'yes' || r.osmOneway === '-1') && isTwoWay(r));
    console.info(`[O1] ${rows.length} roads · OSM oneway=${rows.filter(r => r.osmOneway === 'yes').length} · graph oneway=${rows.filter(r => !isTwoWay(r)).length} · O1 vi phạm: ${bad.length}`);
    expect(bad).toEqual([]);
  });

  it('O4: 0 road oneway số làn lệch tag lanes OSM', () => {
    const bad = rows.filter(r => (isFoneway(r) || isBoneway(r)) && r.osmLanes !== null &&
      ((isFoneway(r) && r.lanesF !== r.osmLanes) || (isBoneway(r) && r.lanesB !== r.osmLanes)));
    expect(bad).toEqual([]);
  });

  it('O1b-exceptions: graph oneway không tag OSM chỉ nằm trong danh sách có chủ đích', () => {
    const unexcused = rows.filter(r => r.osmOneway === 'no' && !isTwoWay(r) && !O1B_EXCEPTIONS.has(r.roadId));
    console.info(`[O1b] exceptions: ${O1B_EXCEPTIONS.size} road · ngoài danh sách: ${unexcused.length}`);
    expect(unexcused).toEqual([]);
  });

  it('O6: dữ liệu Berlin ĐÃ HỘI TỤ — r149 exception và oneway-fix-220 tồn tại', () => {
    const has149 = (map.signs as Array<{ type: string; roadId: string }>).some(s => s.type === '267' && s.roadId === 'r149');
    expect(has149).toBe(true);
    const new220 = (map.signs as Array<{ type: string; roadId: string; src?: string }>).filter(s => s.type === '220' && s.src === 'oneway-fix-220');
    expect(new220.length).toBeGreaterThan(0);
  });
});
