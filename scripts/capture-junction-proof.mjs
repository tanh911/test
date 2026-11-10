import { chromium } from 'playwright';
import { copyFileSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/0505e073-276a-47b9-8ce2-a62d4f6052fa';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 850 } });
  const page = await context.newPage();

  console.log('Navigating to sim-dev with Munich map...');
  await page.goto(`${BASE}/sim-dev?map=muenchen`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(1500);

  // 1. Chụp Top-down nút giao kép n153 (r56 và r205)
  console.log('Capturing Shot 1: Top-down acute split n153...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(266, 65, 288);
    s.camera.lookAt(266, 0, 288);
  });
  await sleep(1000);
  const shot1 = 'junction-n153-topdown.png';
  await page.screenshot({ path: shot1 });
  copyFileSync(shot1, path.join(ARTIFACT_DIR, shot1));

  // 2. Chụp Góc nghiêng 3D thấp tại n153 (acute gore & median)
  console.log('Capturing Shot 2: Perspective acute split n153...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(235, 12, 290);
    s.camera.lookAt(268, 0, 288);
  });
  await sleep(1000);
  const shot2 = 'junction-n153-perspective.png';
  await page.screenshot({ path: shot2 });
  copyFileSync(shot2, path.join(ARTIFACT_DIR, shot2));

  // 3. Chụp Top-down ngã tư Altstadt nhiều nhánh (n125 & n164)
  console.log('Capturing Shot 3: Altstadt multi-arm junction n125...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(106, 75, -190);
    s.camera.lookAt(106, 0, -190);
  });
  await sleep(1000);
  const shot3 = 'junction-n125-altstadt-topdown.png';
  await page.screenshot({ path: shot3 });
  copyFileSync(shot3, path.join(ARTIFACT_DIR, shot3));

  // 4. Chụp Driver view trong chế độ lái xe (drive=1)
  console.log('Capturing Shot 4: Driver cabin approaching junction...');
  await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2000);
  const shot4 = 'muenchen-driver-cabin-v4.png';
  await page.screenshot({ path: shot4 });
  copyFileSync(shot4, path.join(ARTIFACT_DIR, shot4));

  await browser.close();
  console.log('All screenshots captured successfully.');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
