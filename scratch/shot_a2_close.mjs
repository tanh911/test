import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Camera TRÊN mặt A2 eastbound thấp sát mặt đường
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1200, y: 2.2, z: 1465, tx: -600, ty: 1.2, tz: 1350 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/a2_close.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
