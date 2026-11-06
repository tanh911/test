// E2E test tất cả các map: bot traffic, lỗi console, FPS, screenshot
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots', 'e2e');
fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CUSTOM_MAP = {
  mapInfo: { name: 'E2E Test Map', type: 'custom', maxSpeedLimit: 50, gridSize: 10, spawnPoint: { x: 3.5, z: 5, rotation: 0 } },
  elements: [
    { id: 'road_main_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 160 },
    { id: 'road_east_1', type: 'ROAD_STRAIGHT', x: 60, z: 60, rotation: 90, width: 14, height: 120 },
    { id: 'b1', type: 'BUILDING', x: -18, z: 20, rotation: 0, width: 10, height: 16, bldgHeight: 18 },
    { id: 'spawn_start', type: 'SPAWN_POINT', x: 3.5, z: 5, rotation: 0, width: 3, height: 6 }
  ]
};

const RESULTS = [];

async function testMap(browser, { label, presetCard, custom = false, driveSeconds = 14 }) {
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 160)));
  page.on('console', (m) => {
    const t = m.text();
    if (/^\[error\]|\bError\b|Uncaught|FAILED|❌/i.test(t) && !/favicon|DevTools/i.test(t)) {
      errors.push('[console] ' + t.slice(0, 160));
    }
  });

  if (custom) {
    await page.addInitScript((map) => {
      localStorage.setItem('testMapData', JSON.stringify(map));
    }, CUSTOM_MAP);
  }

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(6000);
  if (!custom) {
    // Click thẻ = chỉ CHỌN map; phải bấm nút "BẮT ĐẦU HÀNH TRÌNH" để nạp
    const card = page.locator(`div[title*="${presetCard}"]`).first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await sleep(500);
      const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click();
        console.log(`[${label}] selected + started preset map`);
      }
    }
  }
  await sleep(13000);

  // Vào số + lái
  await page.keyboard.press('b');
  await page.keyboard.down('w');
  await sleep(2500);
  await page.keyboard.up('w');

  // Đo 3 mốc: bot gần nhất, số bot, tốc độ người chơi, FPS
  const samples = [];
  for (let k = 0; k < 3; k++) {
    await sleep(4000);
    const s = await page.evaluate(() => new Promise((resolve) => {
      const r = window.refs?.current;
      if (!r) { resolve({ error: 'no refs' }); return; }
      const mgr = r.trafficAIManager;
      const px = r.carX, pz = -r.carZ;
      let bots = null;
      if (mgr) {
        const dists = mgr.botCars.map(c => Math.round(Math.hypot(c.mesh.position.x - px, c.mesh.position.z - pz))).sort((a, b) => a - b);
        bots = {
          total: mgr.botCars.length,
          within160: dists.filter(d => d <= 160).length,
          nearest: dists[0] ?? null,
          moving: mgr.botCars.filter(c => c.speed > 1).length,
        };
      }
      // FPS qua 1.2s rAF
      let frames = 0;
      const t0 = performance.now();
      const loop = () => {
        frames++;
        if (performance.now() - t0 < 1200) requestAnimationFrame(loop);
        else resolve({
          bots,
          legacyAi: (r.aiCars || []).length,
          speedKmH: Math.round((r.speed || 0) * 3.6),
          mapId: r.currentMapId || window.refs.current.currentMapId,
          fps: Math.round(frames / 1.2),
        });
      };
      requestAnimationFrame(loop);
    }));
    samples.push(s);
    console.log(`[${label}] sample ${k + 1}:`, JSON.stringify(s));
  }

  const shot = path.join(OUT_DIR, `${label}.png`);
  await page.screenshot({ path: shot });

  await context.close();
  RESULTS.push({ label, samples, errors: errors.slice(0, 8), shot });
}

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });

  await testMap(browser, { label: 'stadt', presetCard: 'Nội Đô (Stadt)' });
  await testMap(browser, { label: 'land', presetCard: 'Đường Tỉnh (Land)' });
  await testMap(browser, { label: 'autobahn', presetCard: 'Cao Tốc (Autobahn)' });
  await testMap(browser, { label: 'custom', custom: true });

  await browser.close();

  console.log('\n========== TỔNG KẾT ==========');
  for (const r of RESULTS) {
    const last = r.samples[r.samples.length - 1] || {};
    const bots = last.bots;
    const trafficOk = bots ? (bots.total > 0 && bots.within160 > 0) : last.legacyAi > 0;
    console.log(`\n● ${r.label.toUpperCase()}: traffic ${trafficOk ? '✅ OK' : '❌ FAIL'}`);
    if (bots) {
      console.log(`  bots: ${bots.total} (gần ≤160m: ${bots.within160}, gần nhất: ${bots.nearest}m, đang chạy: ${bots.moving})`);
    } else {
      console.log(`  legacy AI cars: ${last.legacyAi}`);
    }
    console.log(`  speed: ${last.speedKmH} km/h · fps(headless SwiftShader): ${last.fps}`);
    console.log(`  errors: ${r.errors.length === 0 ? 'none ✅' : r.errors.length}`);
    r.errors.forEach(e => console.log('   ', e));
    console.log(`  screenshot: ${r.shot}`);
  }
};

run().catch((e) => { console.error(e); process.exit(1); });
