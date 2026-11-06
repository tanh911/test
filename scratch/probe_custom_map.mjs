// Probe custom map traffic: inject testMapData (Fahrschule closed circuit), verify corridors + bots
import { chromium } from 'playwright';
import fs from 'fs';

const run = async () => {
  // Đọc map mặc định từ state của DrivingSimulation (dùng chính JSON trong source)
  const src = fs.readFileSync('src/components/DrivingSimulation.jsx', 'utf8');
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  page.on('console', (m) => { const t = m.text(); if (/CustomMap|error/i.test(t)) console.log('[console]', t.slice(0, 200)); });

  await page.addInitScript(() => {
    // Map test đơn giản: đại lộ dọc + đường ngang (giống layout Fahrschule)
    localStorage.setItem('testMapData', JSON.stringify({
      mapInfo: { name: 'Test Map', type: 'custom', maxSpeedLimit: 50, gridSize: 10, spawnPoint: { x: 3.5, z: 5, rotation: 0 } },
      elements: [
        { id: 'road_main_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 160 },
        { id: 'road_east_1', type: 'ROAD_STRAIGHT', x: 60, z: 60, rotation: 90, width: 14, height: 120 },
        { id: 'spawn_start', type: 'SPAWN_POINT', x: 3.5, z: 5, rotation: 0, width: 3, height: 6 }
      ]
    }));
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(14000);
  // KHÔNG bấm nút preset trong menu (sẽ ghi đè custom_map) — chỉ vào số bằng W
  await page.keyboard.press('b');
  await page.keyboard.press('w');
  await page.waitForTimeout(6000);

  const out = await page.evaluate(() => {
    const r = window.refs.current;
    const mgr = r.trafficAIManager;
    if (!mgr) return { manager: false, aiCarsLegacy: (r.aiCars || []).length };
    const px = r.carX, pz = -r.carZ;
    return {
      manager: true,
      bots: mgr.botCars.length,
      dists: mgr.botCars.map(c => Math.round(Math.hypot(c.mesh.position.x - px, c.mesh.position.z - pz))).sort((a, b) => a - b),
      corridors: [...new Set(mgr.botCars.map(c => c.corridor.id))],
      player: [px, pz],
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
};

let browser;
run().catch((e) => { console.error(e); process.exit(1); });
