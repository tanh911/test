import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('[Autobahn')) console.log('[console]', t.slice(0, 130)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(18000);
  // Camera chase view tại phố (nhìn nhà + đèn)
  await page.evaluate(() => { window.refs.current._customCam = null; });
  await page.keyboard.press('v'); // đổi cam nếu cần
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1860, y: 9, z: 830, tx: -1810, ty: 2, tz: 990 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/v2_city.png' });
  // Nhìn về nút giao A2
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1860, y: 14, z: 1250, tx: -1780, ty: 2, tz: 1550 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/v2_interchange.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
