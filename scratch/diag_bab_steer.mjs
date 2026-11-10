// Diag 5: kiểm tra hướng lái (A=trái ⇒ heading giảm), vạch kẻ thủ tục, Standstreifen
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
  await page.waitForTimeout(1000);

  const snap = () => page.evaluate(() => {
    const eng = window.__babylonSim;
    return { h: Math.round(((eng.heading * 180 / Math.PI) % 360 + 360) % 360), speed: Math.round(eng.speedKmh), x: +eng.carX.toFixed(1), z: +eng.carZ.toFixed(1) };
  });

  // Tăng tốc 5s
  await page.keyboard.down('w');
  await page.waitForTimeout(5000);
  const h0 = (await snap()).h;
  console.log('before steer:', JSON.stringify(await snap()));

  // Rẽ TRÁI (A) 1.2s
  await page.keyboard.down('a');
  await page.waitForTimeout(1200);
  await page.keyboard.up('a');
  const h1 = (await snap()).h;
  console.log('after A (LEFT):', JSON.stringify(await snap()));

  // Rẽ PHẢI (D) 2.4s (quay về)
  await page.keyboard.down('d');
  await page.waitForTimeout(2400);
  await page.keyboard.up('d');
  const h2 = (await snap()).h;
  console.log('after D (RIGHT):', JSON.stringify(await snap()));
  await page.keyboard.up('w');
  await page.waitForTimeout(400);

  const dLeft = ((h1 - h0 + 540) % 360) - 180;   // delta góc có hướng
  const dRight = ((h2 - h1 + 540) % 360) - 180;
  console.log('VERDICT: A delta =', dLeft, '(âm = ĐÚNG trái)', '| D delta =', dRight, '(dương = ĐÚNG phải)');

  await page.screenshot({ path: path.join(OUT, 'bab5_cockpit.png') });
  await page.keyboard.press('c');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'bab5_chase.png') });

  // Đo Standstreifen: mesh tồn tại + span
  const strip = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const s = eng.scene.meshes.find(m => m.name === 'Standstreifen');
    const marks = eng.scene.meshes.filter(m => m.name === 'laneDash' || m.name === 'Markings_Solid');
    if (!s) return { strip: false };
    const bb = s.getBoundingInfo().boundingBox;
    return {
      strip: true, size: [+(bb.maximumWorld.x - bb.minimumWorld.x).toFixed(0), +(bb.maximumWorld.z - bb.minimumWorld.z).toFixed(0)],
      marks: marks.map(m => m.name)
    };
  });
  console.log('STRIP:', JSON.stringify(strip));
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
