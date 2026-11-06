import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => console.log('[console]', m.text().slice(0, 150)));
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const g = scene.getObjectByName('PBF_Autobahn_GuidanceSigns');
    return { children: g ? g.children.length : null };
  });
  console.log('[GUIDANCE]', JSON.stringify(info));
  // Camera nhìn 1 biển chỉ dẫn dọc route (giữa thị trấn)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -650, y: 3, z: 780, tx: -430, ty: 2.5, tz: 880 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/guidance_sign.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
