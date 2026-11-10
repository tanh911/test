// Diag 6: kiểm tra vòng đời vô-lăng: giữa → giữ A (quay ~97°) → nhả (tự về giữa)
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForTimeout(1200);

  const wheel = () => page.evaluate(() => {
    const eng = window.__babylonSim;
    const rz = eng.steerWheelSpin ? eng.steerWheelSpin.rotation.z : null;
    return { wheelDeg: rz == null ? null : Math.round(rz * 180 / Math.PI), steer: +eng.steerInput.toFixed(2), speed: Math.round(eng.speedKmh) };
  });

  console.log('at rest:', JSON.stringify(await wheel()));
  await page.keyboard.down('a');
  await page.waitForTimeout(1100);
  console.log('holding A 1.1s:', JSON.stringify(await wheel()));
  await page.screenshot({ path: path.join(OUT, 'bab6_wheel_left.png') });
  await page.keyboard.up('a');
  await page.waitForTimeout(1300);
  console.log('released 1.3s:', JSON.stringify(await wheel()));
  await page.screenshot({ path: path.join(OUT, 'bab6_wheel_center.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
