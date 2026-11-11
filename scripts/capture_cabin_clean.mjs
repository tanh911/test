import { chromium } from 'playwright';
import { copyFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 850 } });

  console.log('Navigating to drive mode...');
  await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2500);

  const shot = 'driver-cabin-clean-v6.png';
  await page.screenshot({ path: shot });
  copyFileSync(shot, 'C:/Users/Tuan Anh/.gemini/antigravity/brain/0505e073-276a-47b9-8ce2-a62d4f6052fa/' + shot);
  console.log('Saved', shot);
  await browser.close();
}

main().catch(console.error);
