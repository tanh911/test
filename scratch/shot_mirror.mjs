import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  // Cockpit view với gương chiếu hậu
  await page.keyboard.press('i');
  await page.waitForTimeout(800);
  await page.keyboard.down('w');
  await page.waitForTimeout(8000);
  await page.keyboard.up('w');
  // đảm bảo cockpit camera
  await page.keyboard.press('v');
  await page.waitForTimeout(500);
  await page.keyboard.press('v');
  await page.waitForTimeout(500);
  await page.keyboard.press('v');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/mirror_quality.png' });
  console.log('saved mirror_quality.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
