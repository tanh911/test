// 🗺️ plan_route.mjs — PHẦN 9.1: chọn tuyến thi phủ đủ danh mục bắt buộc, lưu qa-autopilot/route.json.
// v2: chống ping-pong (không quay đầu ngay tại node, tránh lặp road+dir), dedupe đúng loại,
// quét feature theo s trên road đang đi. Chạy: node scripts/plan_route.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(join(root, 'src/data/maps/berlin-mitte-clean.json'), 'utf8'));

// ── helpers ──
const roadById = new Map(map.roads.map(r => [r.id, r]));
const nodeById = new Map(map.nodes.map(n => [n.id, n]));
const roadsAt = new Map();
for (const r of map.roads) {
  if (!roadsAt.has(r.from)) roadsAt.set(r.from, []);
  if (!roadsAt.has(r.to)) roadsAt.set(r.to, []);
  roadsAt.get(r.from).push(r);
  roadsAt.get(r.to).push(r);
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); return L; }
function pointAtS(pts, s) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
    if (acc + seg >= s) { const t = (s - acc) / (seg || 1); return { x: pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t, z: pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t, heading: Math.atan2(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]) }; }
    acc += seg;
  }
  const e = pts[pts.length-1];
  return { x: e[0], z: e[1], heading: Math.atan2(e[0]-pts[pts.length-2][0], e[1]-pts[pts.length-2][1]) };
}
function segIntersect(a, b, c, d) {
  const r = [b[0]-a[0], b[1]-a[1]], s2 = [d[0]-c[0], d[1]-c[1]];
  const den = r[0]*s2[1] - r[1]*s2[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0]-a[0])*s2[1] - (c[1]-a[1])*s2[0]) / den;
  const u = ((c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0]+r[0]*t, a[1]+r[1]*t];
}
function segDist(p, a, b) {
  const vx = b[0]-a[0], vz = b[1]-a[1]; const l2 = vx*vx+vz*vz || 1;
  const t = Math.max(0, Math.min(1, ((p[0]-a[0])*vx + (p[1]-a[1])*vz)/l2));
  return Math.hypot(p[0]-a[0]-vx*t, p[1]-a[1]-vz*t);
}
const wrapPi = a => { while (a > Math.PI) a -= 2*Math.PI; while (a < -Math.PI) a += 2*Math.PI; return a; };

// ── 1. Features ──
const features = [];
const nodeDegree = n => (roadsAt.get(n.id) || []).length;
for (const ix of map.intersections) {
  const n = nodeById.get(ix.nodeId);
  if (!n) continue;
  const deg = nodeDegree(n);
  if (deg < 3) continue;
  if (ix.rule === 'traffic_light') features.push({ type: 'junction_light', nodeId: n.id, x: n.x, z: n.z, label: `nút đèn ${deg} nhánh` });
  else features.push({ type: 'junction_plain', nodeId: n.id, x: n.x, z: n.z, label: `nút không đèn ${deg} nhánh` });
  if (deg >= 4) features.push({ type: 'junction_4arm', nodeId: n.id, x: n.x, z: n.z, label: `nút ${deg} nhánh` });
}
for (const ix of map.intersections) {
  if (!ix.crosswalks?.length) continue;
  const n = nodeById.get(ix.nodeId);
  if (!n) continue;
  features.push({ type: 'zebra', nodeId: n.id, x: n.x, z: n.z, label: `zebra ${ix.crosswalks.length} facing` });
}
for (const sg of map.signs) {
  if (!sg.type.startsWith('274')) continue;
  const r = roadById.get(sg.roadId);
  if (!r) continue;
  const p = pointAtS(r.points, sg.s);
  features.push({ type: 'speed_sign', roadId: r.id, s: sg.s, x: p.x, z: p.z, value: sg.value ?? null, label: `biển tốc ${sg.value ?? sg.type}` });
}
for (const w of map.waters ?? []) {
  const halfW = w.width / 2 + 1.0;
  for (const r of map.roads) {
    const pts = r.points;
    const inBand = pts.map(p => { let d = Infinity; for (let i = 1; i < w.points.length; i++) d = Math.min(d, segDist(p, w.points[i-1], w.points[i])); return d; });
    const inside = inBand.map(d => d < halfW);
    if (inside.some(Boolean) && !inside[0] && !inside[inside.length-1]) {
      const mid = inBand.indexOf(Math.min(...inBand));
      let acc = 0; for (let i = 1; i <= mid; i++) acc += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
      features.push({ type: 'bridge', roadId: r.id, s: +acc.toFixed(1), x: pts[mid][0], z: pts[mid][1], label: `cầu ${r.name || r.id}` });
    }
  }
}
for (const rail of map.rails ?? []) {
  for (const r of map.roads) {
    for (let i = 1; i < r.points.length; i++) {
      for (let j = 1; j < rail.points.length; j++) {
        const p = segIntersect(r.points[i-1], r.points[i], rail.points[j-1], rail.points[j]);
        if (p) {
          let acc = 0; for (let k = 1; k <= i; k++) acc += Math.hypot(r.points[k][0]-r.points[k-1][0], r.points[k][1]-r.points[k-1][1]);
          const type = rail.railway === 'tram' && (rail.elev ?? 0) === 0 ? 'tram_cross' : (rail.elev ?? 0) >= 6 ? 'viaduct_under' : null;
          if (type) features.push({ type, roadId: r.id, s: +acc.toFixed(1), x: p[0], z: p[1], label: type === 'tram_cross' ? 'tram cắt đường' : 'chui viaduct' });
          break;
        }
      }
      if (features.length && features[features.length-1].roadId === r.id && features[features.length-1].x !== undefined) break; // 1 điểm/rail×road
    }
  }
}
for (const r of map.roads) {
  for (let i = 1; i < r.points.length - 1; i++) {
    const h1 = Math.atan2(r.points[i][0]-r.points[i-1][0], r.points[i][1]-r.points[i-1][1]);
    const h2 = Math.atan2(r.points[i+1][0]-r.points[i][0], r.points[i+1][1]-r.points[i][1]);
    if (Math.abs(wrapPi(h2-h1)) > 35*Math.PI/180) {
      let acc = 0; for (let k = 1; k <= i; k++) acc += Math.hypot(r.points[k][0]-r.points[k-1][0], r.points[k][1]-r.points[k-1][1]);
      features.push({ type: 'curve', roadId: r.id, s: +acc.toFixed(1), x: r.points[i][0], z: r.points[i][1], label: `đoạn cong ${r.name || r.id}` });
      break;
    }
  }
}
// dedupe: cùng TYPE + cùng roadId (road feature) hoặc cùng nodeId (node feature) — KHÔNG dedupe
// theo vị trí: 2 carriageway của cùng cầu (r36/r259 cách 9m) là 2 cơ hội đi qua khác nhau
const kept = [];
for (const f of features) {
  const key = f.roadId ? `${f.type}|${f.roadId}` : `${f.type}|${f.nodeId}`;
  if (!kept.some(k => (k.roadId ? `${k.type}|${k.roadId}` : `${k.type}|${k.nodeId}`) === key)) kept.push(f);
}
console.log(`Features: ${kept.length} (raw ${features.length}) — ${[...new Set(kept.map(f=>f.type))].map(t=>t+':'+kept.filter(f=>f.type===t).length).join(', ')}`);

// ── 2. Walk tuyến (v2) ──
const quota = { junction_light: 3, junction_4arm: 1, junction_plain: 1, bridge: 2, tram_cross: 2, speed_sign: 3, zebra: 3, curve: 1, viaduct_under: 1 };
const quotaLeft = { ...quota };
const featKey = f => `${f.type}:${f.roadId ?? f.nodeId}:${f.s ?? ''}`;
const done = new Set();
function markRoadFeatures(roadId, fromS, toS) {
  for (const f of kept) {
    if (quotaLeft[f.type] > 0 && !done.has(featKey(f)) && f.roadId === roadId && f.s !== undefined) {
      const a = Math.min(fromS, toS), b = Math.max(fromS, toS);
      if (f.s >= a - 2 && f.s <= b + 2) { quotaLeft[f.type]--; done.add(featKey(f)); }
    }
  }
}
function markNodeFeatures(nodeId) {
  for (const f of kept) {
    if (quotaLeft[f.type] > 0 && !done.has(featKey(f)) && f.nodeId === nodeId) { quotaLeft[f.type]--; done.add(featKey(f)); }
  }
}
function endNodeOf(road, dir) { return dir > 0 ? road.to : road.from; }
function enterHeadingOf(road, dir) {
  const pts = road.points;
  const a = dir > 0 ? pts[0] : pts[pts.length-1];
  const b = dir > 0 ? pts[1] : pts[pts.length-2];
  return Math.atan2(b[0]-a[0], b[1]-a[1]);
}
function exitHeadingOf(road, dir) {
  const pts = road.points;
  const a = dir > 0 ? pts[pts.length-2] : pts[1];
  const b = dir > 0 ? pts[pts.length-1] : pts[0];
  return Math.atan2(b[0]-a[0], b[1]-a[1]);
}

const spawn = map.spawns.player;
const steps = [];
const usedRoadDir = new Set();
let curRoad = roadById.get(spawn.roadId);
let curDir = 1;
if (curRoad.lanesBackward === 0) curDir = 1; else if (curRoad.lanesForward === 0) curDir = -1;
steps.push({ roadId: curRoad.id, dir: curDir });
usedRoadDir.add(`${curRoad.id}:${curDir}`);
markRoadFeatures(curRoad.id, spawn.s, polyLen(curRoad.points));
let totalLen = polyLen(curRoad.points);
const maxTotal = 6800, maxSteps = 90;

// Feature "POCKET" (góc NE qua n223 — r152 mới oneway F → n223 là legal trap: chỉ vào được,
// không có lối ra hợp pháp ngoài U-turn): thu CUỐI cùng. Phase thường KHÔNG đi qua n223.
const POCKET = new Set(['r259', 'r36']);
const pocketFeature = f => POCKET.has(f.roadId) || f.nodeId === 'n223';
const POCKET_NODE = 'n223';
const pocketPhase = () => false; // placeholder — được override bằng pass flag trong vòng tìm

for (let guard = 0; guard < maxSteps; guard++) {
  if (Object.values(quotaLeft).every(v => v <= 0)) break;
  if (totalLen > maxTotal) break;
  const startNode = endNodeOf(curRoad, curDir);
  // Dijkstra-lite theo COST + 4 pass: (1) thường, (2) cho quay đầu, (3) pocket (qua n223),
  // (4) pocket+quay đầu. Pass sớm ưu tiên — pocket (legal trap sau oneway-fix) thu CUỐI.
  let found = null;
  let fallback = null; // candidate ở node bẫy (không lối ra hợp pháp) — chỉ dùng khi bế tắc hoàn toàn
  const legalOutCount = (nodeId, exclRoadId) => {
    let c = 0;
    for (const r of roadsAt.get(nodeId) || []) {
      if (r.id === exclRoadId) continue;
      if (r.from === nodeId && r.lanesForward > 0) c++;
      if (r.to === nodeId && r.lanesBackward > 0) c++;
    }
    return c;
  };
  // FARthest-first: chọn candidate XA NHẤT (theo cost Dijkstra) — hớt vùng xa trước,
  // vùng gần spawn để cuối → pocket (corridor n223) tự nhiên thành điểm kết thúc route.
  const candList = [];
  for (const [allowPocket, allowReverse] of [[false, false], [false, true], [true, false], [true, true]]) {
    if (candList.length) break;
    const best = new Map([[startNode, { cost: 0, path: [] }]]);
    const q = [{ node: startNode, cost: 0, path: [] }];
    while (q.length) {
      q.sort((a, b) => a.cost - b.cost);
      const cur = q.shift();
      const nd = cur.node;
      if ((best.get(nd)?.cost ?? Infinity) < cur.cost) continue; // stale entry
      if (!allowPocket && nd === POCKET_NODE) continue; // phase thường: không đi qua pocket
      for (const r of roadsAt.get(nd) || []) {
        for (const dir of [1, -1]) {
          if (dir > 0 && r.lanesForward === 0) continue;
          if (dir < 0 && r.lanesBackward === 0) continue;
          const to = dir > 0 ? r.to : r.from;
          if (!allowPocket && to === POCKET_NODE) continue;
          if (!allowReverse && cur.path.length === 0 && r.id === curRoad.id && dir === -curDir) continue;
          const used = usedRoadDir.has(`${r.id}:${dir}`);
          const prevHop = cur.path[cur.path.length - 1];
          const isReverse = prevHop && prevHop.roadId === r.id && prevHop.dir === -dir;
          const cost = cur.cost + polyLen(r.points) * (used ? 5 : 1) * (isReverse ? 12 : 1);
          const pocketOK = allowPocket || !pocketFeature({ roadId: r.id });
          const onRoad = kept.find(f => quotaLeft[f.type] > 0 && !done.has(featKey(f)) && f.roadId === r.id && f.s !== undefined && pocketOK);
          if (onRoad) {
            const path = [...cur.path, { roadId: r.id, dir, to }];
            const lastHopReversible = dir > 0 ? r.lanesBackward > 0 : r.lanesForward > 0;
            if (legalOutCount(to, r.id) > 0 || lastHopReversible) { candList.push({ cand: onRoad, path, cost }); continue; }
            if (!fallback) fallback = { cand: onRoad, path };
            continue;
          }
          const prev = best.get(to);
          if (prev && prev.cost <= cost) continue;
          const newPath = [...cur.path, { roadId: r.id, dir, to }];
          best.set(to, { cost, path: newPath });
          const nodeOK = allowPocket || to !== POCKET_NODE;
          const atNode = nodeOK ? kept.find(f => quotaLeft[f.type] > 0 && !done.has(featKey(f)) && f.nodeId === to) : null;
          if (atNode) {
            if (legalOutCount(to, r.id) > 0) { candList.push({ cand: atNode, path: newPath, cost }); continue; }
            if (!fallback) fallback = { cand: atNode, path: newPath };
            continue;
          }
          q.push({ node: to, cost, path: newPath });
        }
      }
    }
  }
  // chọn candidate GẦN NHẤT mà KHÔNG làm cụt đường: từ đích của candidate, các feature
  // còn lại (hoặc pocket) phải còn reachable theo đường hợp pháp — chống cornered greedy
  if (candList.length) {
    const remaining = () => kept.filter(f => quotaLeft[f.type] > 0 && !done.has(featKey(f)));
    const reachableNodes = (startNode2) => {
      const seen = new Set([startNode2]);
      const qq = [startNode2];
      while (qq.length) {
        const n = qq.shift();
        for (const r of roadsAt.get(n) || []) {
          for (const dir of [1, -1]) {
            if (dir > 0 && r.lanesForward === 0) continue;
            if (dir < 0 && r.lanesBackward === 0) continue;
            const to = dir > 0 ? r.to : r.from;
            if (!seen.has(to)) { seen.add(to); qq.push(to); }
          }
        }
      }
      return seen;
    };
    const survivalOK = (cand) => {
      const endN = cand.path[cand.path.length - 1].to;
      const seen = reachableNodes(endN);
      const rest = remaining();
      if (!rest.length) return true; // hết feature — chỉ cần kết thúc ở đâu cũng được
      // còn quota bridge → pocket (n223) PHẢI còn reachable: pocket bridge chỉ đi được 1 lần
      // và là điểm kết thúc route (n243 legal trap) — nếu đánh mất n223 thì mất bridge thứ 2
      if (quotaLeft.bridge > 0 && !seen.has(POCKET_NODE)) return false;
      for (const f of rest) {
        if (f.nodeId && seen.has(f.nodeId)) return true;
        if (f.roadId) {
          const r = roadById.get(f.roadId);
          if ((r.from === endN || seen.has(r.from)) && r.lanesForward > 0) return true;
          if ((r.to === endN || seen.has(r.to)) && r.lanesBackward > 0) return true;
        }
      }
      // không còn feature reachable → chấp nhận nếu quota còn lại chỉ là pocket (kết thúc ở đó cũng được)
      const nonPocket = rest.filter(f => !pocketFeature(f));
      return nonPocket.length === 0;
    };
    candList.sort((a, b) => a.cost - b.cost);
    found = candList.find(survivalOK) ?? candList[0] ?? null;
  }
  if (!found && fallback) found = fallback;
  if (!found) { console.log(`DEBUG: hết ứng viên guard=${guard} start=${startNode} steps=${steps.length} len=${Math.round(totalLen)} thiếu=${JSON.stringify(quotaLeft)}`); break; }
  if (process.env.ROUTE_DEBUG) console.log(`guard=${guard} → ${found.cand.type} +${found.path.length}hops steps=${steps.length + found.path.length} len=${Math.round(totalLen)}`);
  for (const hop of found.path) {
    steps.push({ roadId: hop.roadId, dir: hop.dir });
    usedRoadDir.add(`${hop.roadId}:${hop.dir}`);
    totalLen += polyLen(roadById.get(hop.roadId).points);
    markRoadFeatures(hop.roadId, 0, polyLen(roadById.get(hop.roadId).points));
    const road = roadById.get(hop.roadId);
    markNodeFeatures(hop.dir > 0 ? road.from : road.to);
  }
  const lastHop = found.path[found.path.length-1];
  curRoad = roadById.get(lastHop.roadId);
  curDir = lastHop.dir;
}

// ── 3. turnAtEnd theo hình học ──
for (let i = 0; i < steps.length; i++) {
  const st = steps[i];
  const road = roadById.get(st.roadId);
  const endNode = st.dir > 0 ? road.to : road.from;
  if (i === steps.length - 1) { st.turnAtEnd = 'straight'; st.viaNodeId = endNode; continue; }
  const next = steps[i + 1];
  const nextRoad = roadById.get(next.roadId);
  const d = wrapPi(enterHeadingOf(nextRoad, next.dir) - exitHeadingOf(road, st.dir));
  st.turnAtEnd = Math.abs(d) < 0.35 ? 'straight' : d > 0 ? 'left' : 'right';
  st.viaNodeId = endNode;
}

// ── 4. Checkpoints ──
const checkpoints = [];
let cid = 0;
const addCp = (type, roadId, s, x, z, label) => {
  const road = roadById.get(roadId);
  const p = s !== null && s !== undefined ? pointAtS(road.points, s) : { x, z };
  checkpoints.push({ id: ++cid, type, roadId, roadName: road.name || '', s: s === null || s === undefined ? null : +(+s).toFixed(1), x: +p.x.toFixed(2), z: +p.z.toFixed(2), label });
};
for (const f of kept) {
  if (!done.has(featKey(f))) continue;
  if (f.nodeId) {
    const step = steps.find(s2 => s2.viaNodeId === f.nodeId);
    if (!step) continue;
    const road = roadById.get(step.roadId);
    addCp(f.type, step.roadId, step.dir > 0 ? polyLen(road.points) : 0, f.x, f.z, f.label);
  } else {
    addCp(f.type, f.roadId, f.s, f.x, f.z, f.label);
  }
}
// width_change giữa các road liền nhau
for (let i = 0; i < steps.length - 1; i++) {
  const a = roadById.get(steps[i].roadId), b = roadById.get(steps[i+1].roadId);
  const la = a.lanesForward + a.lanesBackward, lb = b.lanesForward + b.lanesBackward;
  if (la !== lb && !checkpoints.some(c => c.type === 'width_change' && c.roadId === b.id)) {
    addCp('width_change', b.id, steps[i+1].dir > 0 ? 2 : polyLen(b.points) - 2, null, null, `đổi bề rộng ${la}→${lb} làn`);
  }
}

// ── 5. Bảng + coverage ──
console.log('\n── TUYẾN (steps) ──');
for (let i = 0; i < steps.length; i++) {
  const st = steps[i];
  const r = roadById.get(st.roadId);
  console.log(`${String(i).padStart(2)} ${r.id} ${(r.name||'').slice(0,26).padEnd(26)} dir=${st.dir>0?'→':'←'} ${Math.round(polyLen(r.points))}m tốc${r.speedLimit} turn=${st.turnAtEnd} @${st.viaNodeId}`);
}
console.log(`\nTổng: ${steps.length} roads · ${Math.round(totalLen)}m · checkpoints: ${checkpoints.length}`);
const filled = Object.fromEntries(Object.entries(quota).map(([k]) => [k, quota[k] - quotaLeft[k]]));
console.log('Coverage:', JSON.stringify(filled), 'còn thiếu:', JSON.stringify(quotaLeft));
const lightTurns = steps.filter(s2 => s2.turnAtEnd !== 'straight' && (() => { const ix = map.intersections.find(i2 => i2.nodeId === s2.viaNodeId); return ix?.rule === 'traffic_light'; })());
console.log('Rẽ tại nút đèn:', lightTurns.map(s2 => `${s2.turnAtEnd}@${s2.viaNodeId}`).join(', ') || '(KHÔNG có — cần thêm)');
mkdirSync(join(root, 'qa-autopilot'), { recursive: true });
writeFileSync(join(root, 'qa-autopilot/route.json'), JSON.stringify({
  seed: 1, spawn: { roadId: spawn.roadId, s: spawn.s }, steps, checkpoints, coverage: { required: quota, filled },
}, null, 2));
console.log('→ qa-autopilot/route.json');
