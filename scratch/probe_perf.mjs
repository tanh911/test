import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  const st = await page.evaluate(() => {
    const r = window.refs.current;
    const scene = r.scene;
    let glb = null, glbChildren = 0;
    scene.traverse(o => { if (o.name === 'Autobahn_GLB_Model_blender_v2') { glb = o; glbChildren = o.children.length; } });
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), glbChildren,
      bots: r.trafficAIManager?.botCars?.length, active: r.activeScenario?.id || null };
  });
  console.log('[STATE]', JSON.stringify(st));
  // FPS đo 5s
  const fps = await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      if (performance.now() - start < 5000) requestAnimationFrame(tick);
      else resolve(Math.round(frames / ((performance.now() - start) / 1000)));
    };
    requestAnimationFrame(tick);
  }));
  console.log('[FPS]', fps);
  await page.screenshot({ path: 'scratch/audit_shots/perf_chunks.png' });
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
