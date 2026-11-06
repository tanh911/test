// Capture driving simulation screenshots via Playwright
// Usage: node scratch/capture_sim_state.mjs [mapId] [outPrefix] [driveSeconds]
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const MAP_ID = process.argv[2] || 'default';
const PREFIX = process.argv[3] || 'sim';
const DRIVE_SECONDS = parseInt(process.argv[4] || '6', 10);
const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('Autobahn') || t.includes('error') || t.includes('Error')) console.log('[console]', t.slice(0, 200));
  });
  page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 300)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  // Modal chọn bản đồ có thể chặn: bấm nút bắt đầu nếu có
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    console.log('clicked map start button');
  }
  await page.waitForTimeout(12000);

  // Wait for loading overlay to disappear (max 90s)
  try {
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => {
      const overlays = Array.from(document.querySelectorAll('div'));
      const loading = overlays.find((d) => /Đang|Loading|tải/i.test(d.textContent || '') && d.querySelector('canvas') === null && (d.className || '').toString().length > 0 && getComputedStyle(d).position === 'fixed');
      return !loading;
    }, { timeout: 90000 });
  } catch (e) {
    console.log('Overlay wait timed out, continuing anyway');
  }
  await page.waitForTimeout(3000);

  // If a guide/start modal appears, close it by pressing Escape or clicking start button
  const shot0 = path.join(OUT_DIR, `${PREFIX}_0_start.png`);
  await page.screenshot({ path: shot0 });
  console.log('saved', shot0);

  // Try to start driving: press W for a while, capture frames
  // Thắt dây an toàn (B) + đổi sang chase camera (C x2: cockpit → hood → chase)
  await page.keyboard.press('b');
  // Nổ máy nếu nút đang ở trạng thái tắt (engine off)
  const engineBtn = page.locator('button:has-text("Nổ máy")').first();
  if (await engineBtn.isVisible().catch(() => false)) {
    await engineBtn.click().catch(() => {});
    console.log('clicked engine start');
  }
  await page.waitForTimeout(1000);
  await page.keyboard.down('w');
  const shots = [];
  const interval = Math.max(2000, Math.floor((DRIVE_SECONDS * 1000) / 3));
  for (let i = 1; i <= 3; i++) {
    await page.waitForTimeout(interval);
    const p = path.join(OUT_DIR, `${PREFIX}_${i}_drive.png`);
    await page.screenshot({ path: p });
    shots.push(p);
    console.log('saved', p);
  }
  await page.keyboard.up('w');

  // Slow down and take a final wide shot
  await page.waitForTimeout(1500);
  const pf = path.join(OUT_DIR, `${PREFIX}_final.png`);
  await page.screenshot({ path: pf });
  console.log('saved', pf);

  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
