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
  await sleep(3000);

  // 1. Idle Cabin View
  const shot1 = 'cockpit-upgrade-v1-idle.png';
  await page.screenshot({ path: shot1 });
  copyFileSync(shot1, `${ARTIFACT_DIR}/${shot1}`);
  console.log('Saved', shot1);

  // 2. Steer Left (KeyA)
  await page.keyboard.down('KeyA');
  await sleep(600);
  const shot2 = 'cockpit-upgrade-v2-steering.png';
  await page.screenshot({ path: shot2 });
  copyFileSync(shot2, `${ARTIFACT_DIR}/${shot2}`);
  console.log('Saved', shot2);
  await page.keyboard.up('KeyA');
  await sleep(300);

  // 3. Accelerate (KeyW) to test speed needle & tachometer
  await page.keyboard.down('KeyW');
  await sleep(1500);
  const shot3 = 'cockpit-upgrade-v3-driving.png';
  await page.screenshot({ path: shot3 });
  copyFileSync(shot3, `${ARTIFACT_DIR}/${shot3}`);
  console.log('Saved', shot3);
  await page.keyboard.up('KeyW');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(console.error);
