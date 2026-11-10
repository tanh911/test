// QA xác minh các fix fly/aerial/cabin — chụp 4 ảnh so sánh với bản cũ
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:3002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// ── 1. Fly view — đúng vị trí ảnh cũ sim-dev-fly (trước đây chỉ thấy vòm sương) ──
await page.goto(`${BASE}/sim-dev?map=muenchen`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await sleep(800);
await page.evaluate(() => {
  const s = window.__simScene;
  s.camera.position.set(200, 500, 550);
  s.camera.lookAt(0, 0, 0);
});
await sleep(1200); // đợi streaming nạp cell bán kính lớn
await page.screenshot({ path: 'scratch/fix-fly-500m.png' });

// ── 2. Aerial thẳng xuống khu n153 ──
await page.evaluate(() => {
  const s = window.__simScene;
  s.camera.position.set(266, 400, 288);
  s.camera.lookAt(266, 0, 288);
});
await sleep(1200);
await page.screenshot({ path: 'scratch/fix-aerial-n153.png' });

// ── 3. Cabin view tại spawn (drive mode) ──
await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await sleep(4000); // đợi GLB xe load
await page.screenshot({ path: 'scratch/fix-cabin-spawn.png' });

// ── 4. Fly thấp (60m) kiểm tra seam chân trời ──
await page.goto(`${BASE}/sim-dev?map=muenchen`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await sleep(600);
await page.evaluate(() => {
  const s = window.__simScene;
  s.camera.position.set(120, 60, 420);
  s.camera.lookAt(150, 0, 200);
});
await sleep(1200);
await page.screenshot({ path: 'scratch/fix-fly-60m-horizon.png' });

console.log(JSON.stringify({ consoleErrors: errors }, null, 2));
await browser.close();
