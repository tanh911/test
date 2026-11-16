import { chromium } from 'playwright';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/3f6fc1ca-4bc8-424b-b6fa-9c60cbb485b1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 850 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/sim-dev?map=city18&drive=1`);
  await page.waitForFunction(() => !!window.__simScene?.vehicle, null, { timeout: 60000 });
  await sleep(2000);

  // Đặt vị trí xe trên cầu
  await page.evaluate(() => {
    const s = window.__simScene;
    const v = s.vehicle;
    if (!v) return;
    v.state.x = 0;
    v.state.z = 328;
    v.state.heading = 0;
    v.state.speed = 0;
    v.syncPose();
  });
  await sleep(500);

  // Nhấn phím V để chuyển từ outside sang cabin
  await page.keyboard.press('KeyV');
  await sleep(500);

  const shotCabin = 'docs/screenshots/city18-bridge-spree-cabin.png';
  await page.screenshot({ path: shotCabin });
  if (existsSync(ARTIFACT_DIR)) copyFileSync(shotCabin, path.join(ARTIFACT_DIR, 'city18-bridge-spree-cabin.png'));
  console.log('Saved cabin shot:', shotCabin);

  await browser.close();
}

main().catch(console.error);
