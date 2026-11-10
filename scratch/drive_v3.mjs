// Drive test: chạy thẳng 12s rồi chụp ảnh khi đang di chuyển
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(12000);
  await page.keyboard.down('w');
  await page.waitForTimeout(12000);
  await page.keyboard.up('w');
  await page.waitForTimeout(500);
  const report = await page.evaluate(() => {
    const r = window.refs.current;
    return { speed: Math.round(r.speedKmh || r.speed * 3.6 || 0), pos: [Math.round(r.carX), Math.round(-r.carZ)], heading: Math.round(r.headingDeg || 0) };
  });
  console.log('DRIVE REPORT:', JSON.stringify(report));
  await page.screenshot({ path: path.join(OUT, 'v3_drive.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
