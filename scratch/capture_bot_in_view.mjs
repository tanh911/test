// Wait until a bot car is in front of the camera (<130m, ±35°) then screenshot
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PREFIX = process.argv[2] || 'botview';
const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  // Modal chọn bản đồ có thể chặn: bấm nút bắt đầu nếu có
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    console.log('clicked map start button');
  }
  await page.waitForTimeout(12000);

  // Đứng yên tại spawn: xe bot làn ngược chiều sẽ chạy ngang qua tầm nhìn
  await page.keyboard.press('b');

  const checkFn = () => {
    const refs = window.refs;
    if (!refs?.current?.trafficAIManager) return null;
    const r = refs.current;
    const cam = r.camera;
    let best = null;
    for (const c of r.trafficAIManager.botCars) {
      const dx = c.mesh.position.x - cam.position.x;
      const dz = c.mesh.position.z - cam.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 8 || dist > 160) continue;
      const v = c.mesh.position.clone();
      v.y = 0.8;
      v.project(cam);
      if (v.x < -0.85 || v.x > 0.85 || v.y < -0.7 || v.y > 0.7 || v.z > 0.98) continue;
      if (!best || dist < best.dist) best = { dist: Math.round(dist), ndc: [+v.x.toFixed(2), +v.y.toFixed(2)] };
    }
    return best;
  };

  try {
    await page.waitForFunction(checkFn, { timeout: 40000, polling: 500 });
  } catch {
    console.log('No bot in front within 40s — capturing anyway');
  }
  const state = await page.evaluate(checkFn);
  console.log('bot in view:', JSON.stringify(state));

  for (let i = 1; i <= 3; i++) {
    await page.waitForTimeout(1200);
    const p = path.join(OUT_DIR, `${PREFIX}_${i}.png`);
    await page.screenshot({ path: p });
    console.log('saved', p, JSON.stringify(await page.evaluate(checkFn)));
  }
  await page.keyboard.up('w');
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
