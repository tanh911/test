import { chromium } from 'playwright';
import { copyFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/0505e073-276a-47b9-8ce2-a62d4f6052fa';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 850 } });

  console.log('Navigating to driving simulator...');
  await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(3500);

  // 1. Straight Ahead View: Verify the building in the middle of the road is GONE & 3 mirrors active
  const shot1 = 'cockpit-upgrade-v4-road-clear-mirrors.png';
  await page.screenshot({ path: shot1 });
  copyFileSync(shot1, `${ARTIFACT_DIR}/${shot1}`);
  console.log('Saved', shot1);

  // 2. Drag Mouse Left to Look Left at the Left Wing Mirror & Window
  await page.mouse.move(700, 425);
  await page.mouse.down();
  await page.mouse.move(950, 425, { steps: 15 });
  await sleep(600);
  const shot2 = 'cockpit-upgrade-v5-look-left-mirror.png';
  await page.screenshot({ path: shot2 });
  copyFileSync(shot2, `${ARTIFACT_DIR}/${shot2}`);
  console.log('Saved', shot2);
  await page.mouse.up();
  await sleep(400);

  // 3. Drag Mouse Right to Look Right at the Right Wing Mirror & Window
  await page.mouse.move(700, 425);
  await page.mouse.down();
  await page.mouse.move(400, 425, { steps: 15 });
  await sleep(600);
  const shot3 = 'cockpit-upgrade-v6-look-right-mirror.png';
  await page.screenshot({ path: shot3 });
  copyFileSync(shot3, `${ARTIFACT_DIR}/${shot3}`);
  console.log('Saved', shot3);
  await page.mouse.up();

  await browser.close();
  console.log('Captured all cockpit & mirror screenshots successfully!');
}

main().catch(console.error);
