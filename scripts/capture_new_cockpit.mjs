import { chromium } from 'playwright';
import { copyFileSync } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/0505e073-276a-47b9-8ce2-a62d4f6052fa';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 850 } });

  console.log('Opening sim-dev...');
  await page.goto('http://localhost:3000/sim-dev?map=muenchen&drive=1');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(3000);

  // 1. Straight view showing clean mirrors and clear road
  const shot1 = 'cockpit-upgrade-v7-perfect-mirrors.png';
  await page.screenshot({ path: shot1 });
  copyFileSync(shot1, `${ARTIFACT_DIR}/${shot1}`);
  console.log('Saved', shot1);

  // 2. Drive forward 5 seconds towards the junction
  await page.keyboard.down('KeyW');
  await sleep(4500);
  await page.keyboard.up('KeyW');
  await sleep(1000);

  const shot2 = 'cockpit-upgrade-v8-junction-clear.png';
  await page.screenshot({ path: shot2 });
  copyFileSync(shot2, `${ARTIFACT_DIR}/${shot2}`);
  console.log('Saved', shot2);

  await browser.close();
  console.log('All tests completed successfully!');
}

main().catch(console.error);
