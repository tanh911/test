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

  // 1. Chụp Top-down nút n153 (gần, độ cao 50m nhìn thẳng xuống [265, 0, 288])
  console.log('Capturing 1: n153 Top-down...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(266, 50, 288);
    s.camera.lookAt(266, 0, 288);
  });
  await sleep(800);
  const shot1 = 'n153-topdown.png';
  await page.screenshot({ path: shot1 });
  copyFileSync(shot1, path.join(ARTIFACT_DIR, shot1));

  // 2. Chụp Perspective 3D thấp tại n153
  console.log('Capturing 2: n153 Perspective...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(230, 10, 292);
    s.camera.lookAt(268, 0, 288);
  });
  await sleep(800);
  const shot2 = 'n153-perspective.png';
  await page.screenshot({ path: shot2 });
  copyFileSync(shot2, path.join(ARTIFACT_DIR, shot2));

  // 3. Chụp Wireframe nút n153 (bật wireframe cho toàn bộ scene/road/sidewalk)
  console.log('Capturing 3: n153 Wireframe...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => { m.wireframe = true; });
        } else {
          obj.material.wireframe = true;
        }
      }
    });
    s.camera.position.set(266, 45, 288);
    s.camera.lookAt(266, 0, 288);
  });
  await sleep(800);
  const shot3 = 'n153-wireframe.png';
  await page.screenshot({ path: shot3 });
  copyFileSync(shot3, path.join(ARTIFACT_DIR, shot3));

  // Tắt wireframe
  await page.evaluate(() => {
    const s = window.__simScene;
    s.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => { m.wireframe = false; });
        } else {
          obj.material.wireframe = false;
        }
      }
    });
  });

  // 4. Chụp Top-down ngã tư Altstadt n125
  console.log('Capturing 4: n125 Altstadt Top-down...');
  await page.evaluate(() => {
    const s = window.__simScene;
    s.camera.position.set(106, 60, -190);
    s.camera.lookAt(106, 0, -190);
  });
  await sleep(800);
  const shot4 = 'n125-altstadt-topdown.png';
  await page.screenshot({ path: shot4 });
  copyFileSync(shot4, path.join(ARTIFACT_DIR, shot4));

  // 5. Chụp Cabin Driver View (lái xe tiếp cận n153 trên r256)
  console.log('Capturing 5: Driver Cabin View approaching n153...');
  await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2500);
  const shot5 = 'driver-cabin-n153.png';
  await page.screenshot({ path: shot5 });
  copyFileSync(shot5, path.join(ARTIFACT_DIR, shot5));

  await browser.close();
  console.log('All 5 proofs captured and synced successfully.');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
