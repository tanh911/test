import { chromium } from 'playwright';

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1400, height: 850 } });
  await p.goto('http://localhost:3000/sim-dev?map=muenchen&drive=1');
  await p.waitForFunction(() => !!window.__simScene);
  await new Promise(r => setTimeout(r, 2000));
  
  // Hide UI
  await p.evaluate(() => {
    const els = document.querySelectorAll('div');
    for (const el of els) {
      if (el.style && (el.style.zIndex === '25' || el.style.zIndex === '20')) {
        el.style.display = 'none';
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: 'canvas-only.png' });
  await b.close();
}

main().catch(console.error);
