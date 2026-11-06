import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(18000);
  const res = await page.evaluate(() => {
    const r = window.refs.current;
    const signsGroup = r.scene.getObjectByName('PBF_Autobahn_StVO_Signs_3D');
    if (!signsGroup) return { err: 'no signsGroup' };
    // Graph roads cho đối chiếu
    const graph = window.__roadGraph || null;
    // Lấy dữ liệu motorway từ scene.userData.roadGraphData nếu có
    const graphData = r.scene.userData.roadGraphData || null;
    if (!graphData) return { err: 'no graphData' };
    const motors = graphData.roads.filter(x => x.highway === 'motorway');
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let gantries = 0, facingOK = 0, facingBad = [];
    // Khoảng cách ĐIỂM→ĐOẠN THẲNG (chiếu vuông góc) — endpoint-only sai nhầm carriageway đối diện
    const segDist = (p, a, b) => {
      const abx = b[0] - a[0], abz = b[1] - a[1];
      const L2 = abx * abx + abz * abz || 1;
      let t = ((p[0] - a[0]) * abx + (p[1] - a[1]) * abz) / L2;
      t = Math.max(0, Math.min(1, t));
      return { d: Math.hypot(p[0] - (a[0] + t * abx), p[1] - (a[1] + t * abz)), seg: [abx, abz] };
    };
    for (const child of signsGroup.children) {
      const bar = (child.children || []).find(m => m.isMesh && m.geometry?.parameters?.width === 37.2);
      if (!bar) continue;
      gantries++;
      const wp = child.position;
      const facing = { x: Math.sin(child.rotation.y), z: Math.cos(child.rotation.y) };
      let best = null, bd = Infinity;
      for (const m of motors) {
        const cl = m.centerline;
        for (let i = 0; i < cl.length - 1; i++) {
          const r = segDist([wp.x, wp.z], cl[i], cl[i + 1]);
          if (r.d < bd) { bd = r.d; best = r; }
        }
      }
      if (!best) continue;
      const sl = Math.hypot(best.seg[0], best.seg[1]) || 1;
      const flow = { x: best.seg[0] / sl, z: best.seg[1] / sl };
      const dot = facing.x * flow.x + facing.z * flow.z;
      if (dot < 0) facingOK++; else facingBad.push({ pos: [Math.round(wp.x), Math.round(wp.z)], dot: Math.round(dot * 100) / 100, segDist: Math.round(bd) });
    }
    return { gantries, facingOK, bad: facingBad.slice(0, 5) };
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
