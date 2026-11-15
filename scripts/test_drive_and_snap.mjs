import { chromium } from 'playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 850 } });
  await page.goto('http://localhost:3000/sim-dev?map=berlin&drive=1');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(2500);

  // Take screenshot at spawn
  await page.screenshot({ path: 'spawn-check.png' });

  // Drive forward: hold W for 3.5s
  await page.keyboard.down('KeyW');
  await sleep(3500);
  await page.keyboard.up('KeyW');
  await sleep(800);

  // Screenshot at junction
  await page.screenshot({ path: 'junction-check.png' });

  await browser.close();
  console.log('Saved spawn-check.png and junction-check.png');
}

main().catch(console.error);
