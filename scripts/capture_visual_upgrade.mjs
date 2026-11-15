import { chromium } from 'playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // ── 1. Cabin view: spawn + sau khi lái ──
  await page.goto('http://localhost:3000/sim-dev?map=berlin&drive=1');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(3500);
  await page.screenshot({ path: 'viz-cabin-spawn.png' });

  await page.keyboard.down('KeyW');
  await sleep(3200);
  await page.keyboard.up('KeyW');
  await sleep(900);
  await page.screenshot({ path: 'viz-cabin-drive.png' });

  // Liếc trái kiểm tra gương ngoài
  await page.keyboard.down('ArrowLeft');
  await sleep(900);
  await page.screenshot({ path: 'viz-cabin-glance.png' });
  await page.keyboard.up('ArrowLeft');

  // ── 2. Fly view: nhà + mái + mây từ trên cao ──
  const page2 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page2.goto('http://localhost:3000/sim-dev?map=berlin');
  await page2.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(5000);
  await page2.screenshot({ path: 'viz-aerial.png' });

  await browser.close();
  console.log('Saved viz-cabin-spawn.png, viz-cabin-drive.png, viz-cabin-glance.png, viz-aerial.png');
}

main().catch(console.error);
