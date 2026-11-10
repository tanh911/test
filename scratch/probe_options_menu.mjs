// Probe: tại sao nút Xóa Map Custom bị intercept — DOM stacking ground truth
import { chromium } from 'playwright';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(8000);

  // Mở options menu bằng cách set state qua click nút Cài đặt
  await page.locator('button[title*="Cài đặt mô phỏng"]').first().click();
  await sleep(1000);

  const info = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Xóa Map Custom'));
    if (!btn) return { found: false };
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    const chain = [];
    let el = btn;
    while (el && chain.length < 12) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'static' || cs.zIndex !== 'auto') {
        chain.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), pos: cs.position, z: cs.zIndex });
      }
      el = el.parentElement;
    }
    return {
      found: true,
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      topElementAtPoint: topEl ? `${topEl.tagName}.${(topEl.className || '').toString().slice(0, 50)}` : null,
      topIsButtonOrChild: topEl ? btn.contains(topEl) : false,
      stackingChain: chain,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
