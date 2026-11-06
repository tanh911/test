// Perf probe: đo FPS, frame spikes, draw calls, triangles trên từng map
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 150)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);

  const measureMap = async (label) => {
    // Bắt đầu lái
    await page.keyboard.press('i');
    await page.waitForTimeout(1200);
    await page.keyboard.down('w');
    await page.waitForTimeout(4000);
    // Đo 15 giây: rAF timestamps
    const stats = await page.evaluate(() => new Promise((resolve) => {
      const deltas = [];
      let last = performance.now();
      let frames = 0;
      const info = window.refs?.current?.renderer?.info;
      const startInfo = info ? { calls: info.render.calls, tris: info.render.triangles, geoms: info.memory.geometries, tex: info.memory.textures, programs: info.programs?.length } : null;
      const tick = (t) => {
        deltas.push(t - last);
        last = t;
        frames++;
        if (frames < 900) requestAnimationFrame(tick);
        else {
          const sorted = [...deltas].sort((a, b) => a - b);
          const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
          const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
          resolve({
            fps: Math.round(1000 / avg),
            avgMs: Math.round(avg * 10) / 10,
            p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 10) / 10,
            maxMs: Math.round(sorted[sorted.length - 1] * 10) / 10,
            spikes30: deltas.filter(d => d > 33).length,
            memMB: mem,
            info: window.refs?.current?.renderer?.info ? {
              calls: window.refs.current.renderer.info.render.calls,
              tris: window.refs.current.renderer.info.render.triangles,
              geoms: window.refs.current.renderer.info.memory.geometries,
              tex: window.refs.current.renderer.info.memory.textures,
              programs: window.refs.current.renderer.info.programs?.length
            } : null
          });
        }
      };
      requestAnimationFrame(tick);
    }));
    await page.keyboard.up('w');
    console.log(`[${label}]`, JSON.stringify(stats));
  };

  await measureMap('STADT');
  await page.screenshot({ path: 'scratch/audit_shots/perf_stadt.png' }).catch(() => {});

  // Chuyển Land qua ref API
  await page.evaluate(() => { window.refs.current.setCurrentMapId('landstrasse_b2'); });
  await page.waitForTimeout(14000);
  await measureMap('LAND');
  await page.screenshot({ path: 'scratch/audit_shots/perf_land.png' }).catch(() => {});

  // Autobahn
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(14000);
  await measureMap('AUTOBAHN');
  await page.screenshot({ path: 'scratch/audit_shots/perf_autobahn.png' }).catch(() => {});

  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
