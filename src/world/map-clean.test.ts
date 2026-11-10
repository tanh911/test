// map-clean.test.ts — validate muenchen-altstadt-clean.json (schema v1)
// Quy tắc: không có giao cắt thiếu node, không có node intersection bậc < 3,
// không có road ngắn hơn 4 m.
import { describe, expect, it } from 'vitest';
import muenchenCleanMap from '../data/maps/muenchen-altstadt-clean.json';
import type { GameMap } from './mapLoader';
import { collectBoundaryIssues, collectSeamIssues, collectSawtoothIssues } from './testJunctionBoundary';

const map: GameMap = muenchenCleanMap as unknown as GameMap;

const nodeIds = new Set(map.nodes.map((n) => n.id));
const deg = new Map<string, number>();
for (const r of map.roads) {
  deg.set(r.from, (deg.get(r.from) ?? 0) + 1);
  deg.set(r.to, (deg.get(r.to) ?? 0) + 1);
}

function polylen(pts: [number, number][]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return L;
}

describe('muenchen-altstadt-clean.json validation', () => {
  it('không có bad node refs', () => {
    const bad = map.roads.filter((r) => !nodeIds.has(r.from) || !nodeIds.has(r.to));
    expect(bad).toEqual([]);
  });

  it('không có road ngắn hơn 4 m', () => {
    const short = map.roads.filter((r) => polylen(r.points) < 4);
    expect(short).toEqual([]);
  });

  it('không có node intersection bậc dưới 3', () => {
    const bad = map.nodes.filter(
      (n) => n.type === 'intersection' && (deg.get(n.id) ?? 0) < 3
    );
    expect(bad).toEqual([]);
  });

  it('không có giao cắt thiếu node (crossings_without_node = 0)', () => {
    const roadSegs: Array<{ rid: string; a: [number, number]; b: [number, number] }> = [];
    for (const r of map.roads) {
      const pts = r.points;
      for (let i = 0; i < pts.length - 1; i++) {
        roadSegs.push({ rid: r.id, a: pts[i], b: pts[i + 1] });
      }
    }
    const CELL = 25.0;
    const grid = new Map<string, number[]>();
    for (let si = 0; si < roadSegs.length; si++) {
      const s = roadSegs[si];
      for (let gx = Math.floor(Math.min(s.a[0], s.b[0]) / CELL) - 1;
           gx <= Math.floor(Math.max(s.a[0], s.b[0]) / CELL) + 1; gx++) {
        for (let gz = Math.floor(Math.min(s.a[1], s.b[1]) / CELL) - 1;
             gz <= Math.floor(Math.max(s.a[1], s.b[1]) / CELL) + 1; gz++) {
          const cellKey = `${gx},${gz}`;
          if (!grid.has(cellKey)) grid.set(cellKey, []);
          grid.get(cellKey)!.push(si);
        }
      }
    }
    let crossings = 0;
    const tested = new Set<string>();
    for (const cell of grid.values()) {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const si = cell[i], sj = cell[j];
          const s1 = roadSegs[si], s2 = roadSegs[sj];
          if (s1.rid === s2.rid) continue;
          const pairKey = `${Math.min(si, sj)},${Math.max(si, sj)}`;
          if (tested.has(pairKey)) continue;
          tested.add(pairKey);
          const { a: a1, b: b1 } = s1;
          const { a: a2, b: b2 } = s2;
          const c1 = (b1[0] - a1[0]) * (a2[1] - a1[1]) - (b1[1] - a1[1]) * (a2[0] - a1[0]);
          const c2 = (b1[0] - a1[0]) * (b2[1] - a1[1]) - (b1[1] - a1[1]) * (b2[0] - a1[0]);
          const c3 = (b2[0] - a2[0]) * (a1[1] - a2[1]) - (b2[1] - a2[1]) * (a1[0] - a2[0]);
          const c4 = (b2[0] - a2[0]) * (b1[1] - a2[1]) - (b2[1] - a2[1]) * (b1[0] - a2[0]);
          if (c1 * c2 < 0 && c3 * c4 < 0) {
            crossings++;
          }
        }
      }
    }
    expect(crossings).toBe(0);
  });

  it('tất cả node có degree >= 1 (không có node mồ côi)', () => {
    const orphans = map.nodes.filter((n) => (deg.get(n.id) ?? 0) === 0);
    expect(orphans).toEqual([]);
  });
});

// ── G1-3 (map sạch): biên thật của patch giao lộ ──
// Mọi điểm trên biên bao lồi patch ≤ 1 m từ miệng một nhánh HOẶC cạnh trong
// pad vỉa hè; hai đầu miệng mỗi nhánh nằm trong patch (thay cận đỉnh 1.5·Kmax).
describe('muenchen-clean × biên thật patch giao lộ (collectBoundaryIssues)', () => {
  it('biên patch phủ kín: mọi điểm biên sát miệng nhánh/cạnh pad, miệng nằm trong patch', () => {
    const { checkedNodes, issues } = collectBoundaryIssues(map);
    console.info(`[biên patch] node kiểm: ${checkedNodes}, vi phạm: ${issues.length}`);
    if (issues.length > 0) {
      for (const i of issues.slice(0, 10)) {
        console.info(`  n=${i.nodeId} p=(${i.point[0].toFixed(1)}, ${i.point[1].toFixed(1)}) best=${i.best.toFixed(2)} — ${i.why}`);
      }
    }
    // đủ lượng node được kiểm định (tránh test chạy rỗng)
    expect(checkedNodes).toBeGreaterThanOrEqual(3);
    expect(issues).toEqual([]);
  });
});

// ── Vòng 2: seam (khe cỏ quanh node) ──
// Lưới ±16 m quanh node bước 0,25 m: mọi điểm không nằm trong lớp phủ
// (patch hull / ribbon / vỉa hè / pad / đảo vòng xuyến) mà cách mép > 0,05 m
// và bị kẹp giữa ≥ 2 phủ đối diện → khe cỏ thật → vi phạm (mục tiêu: 0).
describe('muenchen-clean × khe cỏ quanh node (collectSeamIssues)', () => {
  it('lưới ±16 m bít mọi khe cỏ giữa các lớp phủ quanh node', () => {
    const { checkedNodes, issues } = collectSeamIssues(map);
    console.info(`[seam] node kiểm: ${checkedNodes}, vi phạm: ${issues.length}`);
    if (issues.length > 0) {
      for (const i of issues.slice(0, 10)) {
        console.info(`  n=${i.nodeId} p=(${i.point[0].toFixed(1)}, ${i.point[1].toFixed(1)}) dmin=${i.best.toFixed(2)} — ${i.why}`);
      }
    }
    expect(checkedNodes).toBeGreaterThanOrEqual(3);
    expect(issues).toEqual([]);
  });
});

// ── Vòng 2: răng cưa vỉa hè ──
// Mép TRONG mọi piece vỉa hè phải sát mép ribbon cùng road (≤ 0,05 m) —
// cùng lưới s của roadCurve nên bình thường gap ≈ 0; trên đường cong trước
// khi sửa gap nhảy theo mẫu răng cưa.
describe('muenchen-clean × răng cưa vỉa hè (collectSawtoothIssues)', () => {
  it('mép trong vỉa hè trùng khít mép ribbon trên mọi road', () => {
    const { checkedRoads, issues } = collectSawtoothIssues(map);
    console.info(`[răng cưa] road kiểm: ${checkedRoads}, vi phạm: ${issues.length}`);
    if (issues.length > 0) {
      const worst = issues.slice(0, 10).sort((a, b) => b.gap - a.gap);
      for (const i of worst) {
        console.info(`  road=${i.roadId} piece#${i.pieceIndex} gap=${i.gap.toFixed(3)}m tại (${i.point[0].toFixed(1)}, ${i.point[1].toFixed(1)})`);
      }
    }
    expect(checkedRoads).toBeGreaterThanOrEqual(3);
    expect(issues).toEqual([]);
  });
});
