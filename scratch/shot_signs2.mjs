import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(20000);
  // Trên A2 eastbound nhìn về phía đông (gantry hướng mặt về camera)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: 900, y: 4, z: 300, tx: 1600, ty: 6, tz: -180 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/gantry_east.png' });
  // Gần interchange Rhynern nhìn về tây (gantry chiều westbound)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1300, y: 4, z: 1440, tx: -1950, ty: 6, tz: 1530 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/gantry_rhynern.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
