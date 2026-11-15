import { chromium } from 'playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000/sim-dev?map=berlin');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(5000);

  // Top-down tại node có móng vuốt (n146) + nhà xoắn r286 + node seam (n13)
  const spots = [
    { name: 'n146', x: 214, z: -4, h: 70 },
    { name: 'r286', x: 102, z: 67, h: 70 },
    { name: 'n13', x: -580, z: 360, h: 90 }
  ];
  for (const s of spots) {
    await page.evaluate(({ x, z, h }) => {
      const sc = window.__simScene;
      sc.camera.position.set(x, h, z);
      sc.camera.userData._setPose(0, -Math.PI / 2);
    }, s);
    await sleep(2500);
    await page.screenshot({ path: `viz-junction-${s.name}.png` });
  }

  await browser.close();
  console.log('Saved viz-junction-n13.png, viz-junction-center.png');
}

main().catch(console.error);
