// dumpStrips.test.ts — dump building strips ĐÚNG code runtime ra JSON cho
// import_berlin_signs.mjs dùng (đảm bảo parity với runtime).
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import type { GameMap } from './mapLoader';
import { loadGameMap, roadCurve, roadLength } from './mapLoader';
import { buildingStrips } from './buildings';

const map: GameMap = loadGameMap(berlinMitteMap);
describe('dump strips', () => {
  it('dump', () => {
    const strips: number[][] = [];
    for (const b of map.buildings) {
      const st = buildingStrips(map, { ...b, depthOff: 0 });
      if (st) for (const [a, b2, c, d] of st) strips.push([a, b2, c, d]);
    }
    const curves: Record<string, { pts: Array<[number, number, number, number]>; length: number }> = {};
    for (const r of map.roads) {
      const c = roadCurve(r);
      curves[r.id] = { pts: c.pts.map((p) => [p.x, p.z, p.nx, p.nz]), length: c.length };
    }
    writeFileSync('scripts/strips_dump.json', JSON.stringify(strips), 'utf8');
    writeFileSync('scripts/curves_dump.json', JSON.stringify(curves), 'utf8');
    console.info(`dumped ${strips.length} strips + ${Object.keys(curves).length} curves`);
  });
});
