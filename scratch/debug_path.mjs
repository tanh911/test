import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('direction signs') || t.includes('guidance')) console.log('[console]', t.slice(0, 150)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Debug: chạy lại logic pathfinding trong page để xem đứt ở đâu
  const res = await page.evaluate(() => {
    const FOCUS = { x: -396, z: 895 };
    const BK = 12;
    const bk = (p) => Math.round(p[0] / BK) + '_' + Math.round(p[1] / BK);
    const graph = window.__graphData || null;
    return { hasGraph: !!graph };
  });
  console.log('[debug1]', JSON.stringify(res));
  // Đọc graph từ scene.userData
  const res2 = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const gd = scene.userData.roadGraphData;
    if (!gd) return { err: 'no roadGraphData in scene.userData' };
    const BK = 12;
    const bk = (p) => Math.round(p[0] / BK) + '_' + Math.round(p[1] / BK);
    const adj = new Map();
    let localCount = 0;
    for (const r of gd.roads) {
      if (r.highway === 'motorway' || !r.centerline || r.centerline.length < 2) continue;
      localCount++;
      const cl = r.centerline;
      const sK = bk(cl[0]), eK = bk(cl[cl.length - 1]);
      if (!adj.has(sK)) adj.set(sK, []);
      if (!adj.has(eK)) adj.set(eK, []);
      adj.get(sK).push(eK);
      adj.get(eK).push(sK);
    }
    const snap = (px, pz) => {
      let bestK = null, bestD = Infinity;
      for (const k of adj.keys()) {
        const [x, z] = k.split('_').map(Number);
        const dd = Math.hypot(x - px, z - pz);
        if (dd < bestD) { bestD = dd; bestK = k; }
      }
      return { k: bestK, d: Math.round(bestD) };
    };
    const start = snap(-396, 895);
    // Auffahrt: link gần spawn nhất — tìm motorway_link gần (-1770, 1349)
    let auf = null, aufD = Infinity;
    for (const r of gd.roads) {
      if (r.highway !== 'motorway_link' || !r.centerline?.length) continue;
      const dd = Math.hypot(r.centerline[0][0] + 1770, r.centerline[0][1] - 1349);
      if (dd < aufD) { aufD = dd; auf = r.centerline[0]; }
    }
    const end = snap([auf[0], auf[1]]);
    // BFS đếm reachability + path length
    const dist = new Map([[start.k, 0]]);
    const pq = [[0, start.k]];
    let reached = false;
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [dd, u] = pq.shift();
      if (u === end.k) { reached = true; break; }
      if (dd > (dist.get(u) ?? 1e12)) continue;
      for (const v of adj.get(u) || []) {
        const nd = dd + 1;
        if (nd < (dist.get(v) ?? 1e12)) { dist.set(v, nd); pq.push([nd, v]); }
      }
    }
    return { localRoads: localCount, start, end: { k: end.k, d: end.d }, reached, hops: dist.get(end.k) ?? null,
      adjNodes: adj.size, linkPos: [Math.round(auf[0]), Math.round(auf[1])] };
  });
  console.log('[debug2]', JSON.stringify(res2, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
