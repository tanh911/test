import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  page.on('console', (m) => { const t = m.text(); if (t.includes('blender') || t.includes('GLB')) console.log('[console]', t.slice(0, 130)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  const st = await page.evaluate(() => {
    const r = window.refs.current;
    let glbFound = null;
    r.scene.traverse(o => { if (o.name === 'Autobahn_GLB_Model_blender_v2') glbFound = { visible: o.visible, children: o.children.length }; });
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), glbFound, bots: r.trafficAIManager?.botCars?.length };
  });
  console.log('[STATE]', JSON.stringify(st));
  // Nhìn town center từ trên (nhà Blender + vỉa hè + vạch)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -700, y: 26, z: 600, tx: -400, ty: 2, tz: 950 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/blender_town.png' });
  // Nhìn nút giao Rhynern từ trên cao
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1500, y: 40, z: 1250, tx: -1780, ty: 3, tz: 1550 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/blender_interchange.png' });
  console.log('pageerrors:', errors.length);
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
