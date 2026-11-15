// lampAuditDump.test.ts — 💡 PHẦN 8.1: dump telemetry CỘT ĐÈN ĐƯỜNG từ hàm placement
// DUY NHẤT (computePropPlacements trong props.ts) — audit phân tích qua scripts/audit_lamp_orientation.mjs.
// Ghi scripts/lamp_telemetry_<tag>.json (tag = env LAMP_AUDIT_TAG, mặc định "check").
// Idempotency P5: tính placement 3 lần trong 1 run, so khớp từng bit.
// Chạy: LAMP_AUDIT_TAG=before npx vitest run src/world/lampAuditDump.test.ts
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import { computePropPlacements, LAMP_HEAD_Z } from './props';
import { pointAtS, type GameMap } from './mapLoader';

describe('💡 PHẦN 8.1 — audit hướng cột đèn đường (dump)', () => {
  it('dump lamp + bench telemetry + idempotency 3x', { timeout: 120_000 }, () => {
    const tag = (process.env.LAMP_AUDIT_TAG ?? 'check').replace(/[^a-z]/gi, '');
    const map = berlinMitteMap as unknown as GameMap;

    const runs = [computePropPlacements(map), computePropPlacements(map), computePropPlacements(map)];
    const stable = JSON.stringify(runs[0]) === JSON.stringify(runs[1]) && JSON.stringify(runs[1]) === JSON.stringify(runs[2]);

    const derive = (p: (typeof runs)[0][number]) => {
      if (p.skip) return null;
      // chỉ quan tâm prop CÓ HƯỚNG: đèn đường + ghế (đều đối xứng qua trục +Z local)
      if (p.type !== 'street_lamp' && p.type !== 'bench') return null;
      // +Z local → world: (sin yaw, cos yaw) — quy ước Three.js rotation.y
      const armX = Math.sin(p.yaw);
      const armZ = Math.cos(p.yaw);
      // pháp tuyến VÀO TÂM ĐƯỜNG tại đúng s: rx=−cos h, rz=sin h → into-road = (−rx·side, −rz·side)
      const fx = Math.sin(p.heading);
      const fz = Math.cos(p.heading);
      const rx = -fz, rz = fx;
      const side = p.side === 'right' ? 1 : -1;
      const nX = -rx * side;
      const nZ = -rz * side;
      const dot = armX * nX + armZ * nZ;
      const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
      // tâm chóa đèn = chân cột + armDir × LAMP_HEAD_Z
      const headX = p.x + armX * LAMP_HEAD_Z;
      const headZ = p.z + armZ * LAMP_HEAD_Z;
      // tâm đường tại s = chân prop − r̂·side·off
      const cx = p.x - rx * side * p.off;
      const cz = p.z - rz * side * p.off;
      // lateral có dấu theo r̂ (dương = phía phải flow)
      const latPole = (p.x - cx) * rx + (p.z - cz) * rz;
      const latHead = (headX - cx) * rx + (headZ - cz) * rz;
      const inward = p.half - Math.abs(latHead); // >0: chóa ĐÈ lên mặt đường
      return {
        roadId: p.roadId, s: +p.s.toFixed(1), side: p.side,
        x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3),
        armAngleDeg: +angleDeg.toFixed(1),
        latPole: +latPole.toFixed(2), latHead: +latHead.toFixed(2),
        inwardFromEdge: +inward.toFixed(2),
        poleOffSidewalk: Math.abs(latPole) > p.half + 3.05, // P3: chân cột xa mép > 3m
      };
    };

    const lamps = runs[0].map(derive).filter(Boolean);
    const skippedLamps = runs[0].filter(p => p.type === 'street_lamp' && p.skip)
      .map(p => ({ roadId: p.roadId, s: p.s, side: p.side, skip: p.skip }));

    // ── P4: biển báo — pháp tuyến mặt biển vs chiều xe tới ──
    // Canvas plane/GLB face +Z local; rot = heading + (flip ? 0 : π).
    // flip=false: mặt quay VỀ phía xe tới (−flow); flip=true: quay theo flow (Z.267).
    const signs = (map.signs ?? []).map(sg => {
      const road = (map.roads as GameMap['roads']).find(r => r.id === sg.roadId);
      if (!road) return null;
      const h = pointAtS(road, sg.s).heading;
      const rot = h + (sg.flip ? 0 : Math.PI);
      const faceX = Math.sin(rot), faceZ = Math.cos(rot);
      const fx = Math.sin(h), fz = Math.cos(h);
      const tx = sg.flip ? fx : -fx;
      const tz = sg.flip ? fz : -fz;
      const angle = Math.acos(Math.max(-1, Math.min(1, faceX * tx + faceZ * tz))) * 180 / Math.PI;
      return { roadId: sg.roadId, s: +sg.s.toFixed(1), type: sg.type, flip: !!sg.flip, faceAngleDeg: +angle.toFixed(1) };
    }).filter(Boolean);

    const out = { tag, headZ: LAMP_HEAD_Z, stable, total: runs[0].length, lamps, skippedLamps, signs };
    const file = join(process.cwd(), 'scripts', `lamp_telemetry_${tag}.json`);
    writeFileSync(file, JSON.stringify(out));
    const signBad = signs.filter(s => s && s.faceAngleDeg > 20).length;
    console.info(`[lamp-audit] ${lamps.length} cột có hướng · ${skippedLamps.length} skip · ${signs.length} biển (P4 sai >20°: ${signBad}) · stable=${stable} → ${file}`);
    expect(stable).toBe(true);
    expect(lamps.length).toBeGreaterThan(0);
  });
});
