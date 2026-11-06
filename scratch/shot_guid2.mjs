import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Lấy vị trí biển đầu tiên trong group, camera đứng trước mặt biển
  const shot = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const g = scene.getObjectByName('PBF_Autobahn_GuidanceSigns');
    if (!g) return { err: 'no group' };
    const panels = g.children.filter(c => c.children.some(m => m.geometry?.type === 'PlaneGeometry'));
    const positions = panels.slice(0, 3).map(p => {
      const wp = p.children.find(m => m.geometry?.type === 'PlaneGeometry').getWorldPosition(new (p.children[0].position.constructor)());
      return { x: Math.round(wp.x), y: Math.round(wp.y), z: Math.round(wp.z) };
    });
    return { positions };
  });
  console.log('[sign positions]', JSON.stringify(shot));
  if (shot.positions?.length) {
    const s0 = shot.positions[0];
    await page.evaluate((sp) => {
      const r = window.refs.current;
      // camera cách biển 18m về phía trước mặt (mặt biển hướng về route → camera đặt theo rotation)
      r._customCam = { x: sp.x - 10, y: 3.2, z: sp.z - 14, tx: sp.x, ty: 2.4, tz: sp.z };
    }, s0);
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'scratch/audit_shots/guidance_close.png' });
  }
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
