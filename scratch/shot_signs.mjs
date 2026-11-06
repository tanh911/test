import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('traffic lights') || t.includes('Signs')) console.log('[console]', t.slice(0, 120)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(20000);
  // Camera trên A2 nhìn về 1 gantry (đoạn giữa A2 đông)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: 1500, y: 3.5, z: -700, tx: 1700, ty: 5, tz: -850 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/signs_gantry.png' });
  // Đèn giao thông: camera tại 1 junction signalized gần spawn
  await page.evaluate(() => {
    const r = window.refs.current;
    const j = (window.__signalsNear || null);
    r._customCam = { x: -300, y: 8, z: 750, tx: -395, ty: 2, tz: 890 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/signs_lights.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
