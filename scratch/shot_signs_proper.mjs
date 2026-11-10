import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Lấy sign position từ GLB group và camera hướng về sign từ mặt đường
  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const g = scene.getObjectByName('PBF_Autobahn_GuidanceSigns');
    if (!g || !g.children.length) return { err: 'no signs' };
    // sign đầu tiên có PlaneGeometry
    let sign = null;
    for (const c of g.children) {
      const panel = c.children.find(m => m.geometry?.type === 'PlaneGeometry');
      if (panel) { sign = panel.getWorldPosition(new (c.position.constructor)()); break; }
    }
    if (!sign) return { err: 'no panel' };
    return { x: Math.round(sign.x), y: Math.round(sign.y), z: Math.round(sign.z) };
  });
  console.log('[sign pos]', JSON.stringify(info));
  if (!info.err) {
    await page.evaluate((sp) => {
      const r = window.refs.current;
      // Camera cách sign 15m, cùng chiều đường
      r._customCam = { x: sp.x + 5, y: 2.5, z: sp.z + 15, tx: sp.x, ty: 2.5, tz: sp.z };
    }, info);
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'scratch/audit_shots/sign_street_level.png' });
  }
  // Thêm: camera trên cao nhìn thị trấn
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -600, y: 35, z: 500, tx: -500, ty: 3, tz: 900 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/town_aerial.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
