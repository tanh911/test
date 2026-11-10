import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Camera sát mặt đường Ostendorfstraße nhìn dọc
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -396, y: 3.2, z: 830, tx: -398, ty: 1.5, tz: 990 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/road_close.png' });
  // Kiểm tra fog + đếm mesh visible trong GLB
  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    return { fog: scene.fog ? { near: scene.fog.near, far: scene.fog.far, color: '#' + scene.fog.color.getHexString() } : null };
  });
  console.log(JSON.stringify(info));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
