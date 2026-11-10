// Perf probe 2: đo WARM (mỗi map chạy 20s trước khi đo), thứ tự: autobahn -> land -> stadt
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('[Perf]')) console.log('  ', t.slice(0, 90)); });
  page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 150)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);

  const measureMap = async (label) => {
    await page.keyboard.press('i');
    await page.waitForTimeout(1200);
    await page.keyboard.down('w');
    await page.waitForTimeout(8000); // warm 8s (drive)
    const stats = await page.evaluate(() => new Promise((resolve) => {
      const deltas = [];
      let last = performance.now();
      let frames = 0;
      const tick = (t) => {
        deltas.push(t - last);
        last = t;
        frames++;
        if (frames < 900) requestAnimationFrame(tick);
        else {
          const sorted = [...deltas].sort((a, b) => a - b);
          const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
          resolve({
            fps: Math.round(1000 / avg),
            p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
            maxMs: Math.round(sorted[sorted.length - 1] * 10) / 10,
            spikes30: deltas.filter(d => d > 33).length,
            info: window.refs?.current?.renderer?.info ? {
              calls: window.refs.current.renderer.info.render.calls,
              tris: window.refs.current.renderer.info.render.triangles
            } : null
          });
        }
      };
      requestAnimationFrame(tick);
    }));
    await page.keyboard.up('w');
    console.log(`[${label}]`, JSON.stringify(stats));
  };

  await measureMap('AUTOBAHN');
  await page.evaluate(() => { window.refs.current.setCurrentMapId('landstrasse_b2'); });
  await page.waitForTimeout(14000);
  await measureMap('LAND');
  await page.evaluate(() => { window.refs.current.setCurrentMapId('stadt_zentrum'); });
  await page.waitForTimeout(14000);
  await measureMap('STADT');
  await page.screenshot({ path: 'scratch/audit_shots/perf2_stadt_warm.png' }).catch(() => {});

  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
