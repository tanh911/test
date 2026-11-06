// Wait for on-screen bot, burst-capture; else dump corridor layout near player
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const PREFIX = process.argv[2] || 'diag';
const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  // Nổ máy (giữ giống người chơi thật: phím P không cần, chỉ cần quan sát bot)
  await page.keyboard.press('b');
  await page.keyboard.press('v');
  await page.keyboard.press('v');

  const found = await page.evaluate(() => new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      const r = window.refs?.current;
      if (!r?.trafficAIManager || !r.camera) { if (performance.now() - t0 > 60000) resolve(null); else setTimeout(tick, 300); return; }
      const cam = r.camera;
      for (const c of r.trafficAIManager.botCars) {
        const dx = c.mesh.position.x - cam.position.x;
        const dz = c.mesh.position.z - cam.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 10 || dist > 150) continue;
        const v = c.mesh.position.clone(); v.y = 0.8; v.project(cam);
        if (v.x > -0.8 && v.x < 0.8 && v.y > -0.65 && v.y < 0.65) {
          resolve({ dist: Math.round(dist), corridor: c.corridor.id, ndc: [+v.x.toFixed(2), +v.y.toFixed(2)] });
          return;
        }
      }
      if (performance.now() - t0 > 60000) resolve(null); else setTimeout(tick, 300);
    };
    tick();
  }));
  console.log('onScreen bot:', JSON.stringify(found));

  if (found) {
    for (let i = 1; i <= 3; i++) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `${PREFIX}_hit_${i}.png`) });
    }
    console.log('saved burst');
  } else {
    const dump = await page.evaluate(() => {
      const r = window.refs.current;
      const px = r.carX, pz = -r.carZ;
      const corridors = {};
      for (const c of r.trafficAIManager.botCars) {
        const id = c.corridor.id;
        corridors[id] = corridors[id] || { count: 0, near: [] };
        corridors[id].count++;
        const g = c.corridor;
        // waypoint gần player nhất
        let best = null;
        g.waypoints.forEach((w, wi) => {
          const d = Math.hypot(w[0] - px, w[1] - pz);
          if (!best || d < best.d) best = { d: Math.round(d), wp: wi, w: [Math.round(w[0]), Math.round(w[1])] };
        });
        corridors[id].near.push(best);
        corridors[id].botDists = (corridors[id].botDists || []).concat([Math.round(Math.hypot(c.mesh.position.x - px, c.mesh.position.z - pz))]);
      }
      return { player: [Math.round(px), Math.round(pz)], corridors };
    });
    console.log(JSON.stringify(dump, null, 1));
  }
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
