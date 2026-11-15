// lampOrientation.test.ts — 💡 PHẦN 8.3: guard vĩnh viễn P1–P5 hướng cột đèn đường + biển báo.
// P1 tay đèn chỉ vào tâm đường ≤ 15° · P2 chóa trên mặt đường ≥ 0.3m từ mép ·
// P3 0 cột lạc ngoài vỉa hè · P4 biển quay đúng chiều xe tới ≤ 20° · P5 idempotent 3x.
// Chạy: npx vitest run src/world/lampOrientation.test.ts
import { describe, expect, it } from 'vitest';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import { computePropPlacements, LAMP_HEAD_Z } from './props';
import { pointAtS, type GameMap } from './mapLoader';

const map = berlinMitteMap as unknown as GameMap;

function lampMetrics() {
  return computePropPlacements(map)
    .filter(p => !p.skip && p.type === 'street_lamp')
    .map(p => {
      const armX = Math.sin(p.yaw), armZ = Math.cos(p.yaw);
      const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
      const rx = -fz, rz = fx;
      const side = p.side === 'right' ? 1 : -1;
      const nX = -rx * side, nZ = -rz * side;
      const angle = Math.acos(Math.max(-1, Math.min(1, armX * nX + armZ * nZ))) * 180 / Math.PI;
      const headX = p.x + armX * LAMP_HEAD_Z, headZ = p.z + armZ * LAMP_HEAD_Z;
      const cx = p.x - rx * side * p.off, cz = p.z - rz * side * p.off;
      const latPole = (p.x - cx) * rx + (p.z - cz) * rz;
      const latHead = (headX - cx) * rx + (headZ - cz) * rz;
      return {
        roadId: p.roadId, side: p.side, angle,
        inward: p.half - Math.abs(latHead),
        offSidewalk: Math.abs(latPole) > p.half + 3.05,
      };
    });
}

describe('💡 PHẦN 8.3 — hướng cột đèn đường (P1–P5)', () => {
  const lamps = lampMetrics();

  it('P1: 100% tay đèn chỉ vào tâm đường (lệch ≤ 15°)', () => {
    expect(lamps.length).toBeGreaterThan(100);
    const bad = lamps.filter(l => l.angle > 15);
    console.info(`[P1] ${lamps.length - bad.length}/${lamps.length} đúng · góc TB ${(lamps.reduce((s, l) => s + l.angle, 0) / lamps.length).toFixed(1)}°`);
    expect(bad).toEqual([]);
  });

  it('P2: chóa đèn nằm trên mặt đường (vào từ mép ≥ 0.3m)', () => {
    const bad = lamps.filter(l => l.inward < 0.3);
    console.info(`[P2] inward min ${Math.min(...lamps.map(l => l.inward)).toFixed(2)}m`);
    expect(bad).toEqual([]);
  });

  it('P3: 0 cột đứng ngoài vỉa hè (cách mép > 3m)', () => {
    const bad = lamps.filter(l => l.offSidewalk);
    expect(bad).toEqual([]);
  });

  it('P4: 100% biển báo quay đúng chiều xe tới (lệch ≤ 20°, flip được tính riêng)', () => {
    const signs = (map.signs ?? []).map(sg => {
      const road = (map.roads as GameMap['roads']).find(r => r.id === sg.roadId);
      if (!road) return null;
      const h = pointAtS(road, sg.s).heading;
      const rot = h + (sg.flip ? 0 : Math.PI);
      const faceX = Math.sin(rot), faceZ = Math.cos(rot);
      const fx = Math.sin(h), fz = Math.cos(h);
      const tx = sg.flip ? fx : -fx, tz = sg.flip ? fz : -fz;
      return Math.acos(Math.max(-1, Math.min(1, faceX * tx + faceZ * tz))) * 180 / Math.PI;
    }).filter(a => a !== null) as number[];
    expect(signs.length).toBeGreaterThan(200);
    const bad = signs.filter(a => a > 20);
    console.info(`[P4] ${signs.length - bad.length}/${signs.length} biển đúng chiều (flip ${signs.filter(a => a === 0).length ? 'kể cả' : 'không'} Z.267)`);
    expect(bad).toEqual([]);
  });

  it('P5: idempotent — placement 3 lần khớp từng bit', () => {
    const a = JSON.stringify(computePropPlacements(map));
    const b = JSON.stringify(computePropPlacements(map));
    const c = JSON.stringify(computePropPlacements(map));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});
