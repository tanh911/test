// QA Stadt: boot map Stadt, verify vòng xuyến + peds + không console error
// Chạy: node scripts/qa-stadt.mjs  — cần dev server http://localhost:3001
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { scenarios: {}, consoleErrors: [] };

mkdirSync('scripts/qa-shots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

// Helper snapshot
const snap = () => page.evaluate(() => {
  const s = window.__simScene.getStats?.();
  const rs = window.__simScene.getRuleState?.();
  const ms = window.__simScene.getMapState?.();
  return {
    signal: ms?.player?.signal ?? null,
    speedKmh: rs?.speedKmh ?? null,
    bestanden: rs?.bestanden ?? null,
    violations: rs ? rs.violations.map(v => v.type) : [],
    draws: s?.draws ?? null,
    quads: s?.quads ?? null,
    cellsLoaded: s?.cellsLoaded ?? null,
    cellsTotal: s?.cellsTotal ?? null,
    mapStatePlayer: !!ms?.player,
    mapStateNpcCount: ms?.npcs?.length ?? 0,
    mapStateLightCount: ms?.lights?.length ?? 0
  };
});

// Traverse scene tìm objects tên 'ped_' (người đi bộ)
const countPeds = () => page.evaluate(() => {
  let n = 0;
  window.__simScene.scene.traverse(o => { if (o.name && o.name.startsWith('ped_')) n++; });
  return n;
});

// Traverse scene tìm trafficLightGroup (đèn giao thông)
const countLights = () => page.evaluate(() => {
  let n = 0;
  window.__simScene.scene.traverse(o => { if (o.name === 'trafficLightGroup') n++; });
  return n;
});

// ── SCENARIO 1: boot ?map=stadt&drive=1 ──
await page.goto(`${BASE}/sim-dev?map=stadt&drive=1`);
await page.waitForSelector('#root canvas', { timeout: 30000 });
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 30000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });

// Pump vài frame để GLB load (xem phụ thuộc RAF thật)
for (let i = 0; i < 60; i++) {
  await page.evaluate(() => { /* RAF thật tự chạy */ });
  await sleep(50);
}

const s1 = await snap();
const peds1 = await countPeds();
const lights1 = await countLights();
// Kiểm tra map có roundabout intersection
const hasRoundabout = await page.evaluate(() => {
  const map = window.__simScene.map;
  return map.intersections.some(ix => ix.rule === 'roundabout');
});
out.scenarios.stadtBoot = { ...s1, peds: peds1, lights: lights1, hasRoundabout };
await page.screenshot({ path: 'scripts/qa-shots/stadt-boot.png' });

// ── SCENARIO 2: boot ?map=stadt (không drive, camera bay) ──
await page.goto(`${BASE}/sim-dev?map=stadt`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 30000 });
await sleep(500);
const s2 = await snap();
out.scenarios.stadtFly = { ...s2 };
await page.screenshot({ path: 'scripts/qa-shots/stadt-fly.png' });

// ── SCENARIO 3: regression ?big=1 ──
await page.goto(`${BASE}/sim-dev?drive=1&big=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 40000 });
const s3 = await page.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  stats: window.__simScene.getStats?.() ?? null,
  mapStatePlayers: !!window.__simScene.getMapState().player
}));
out.scenarios.bigMapRegression = s3;
await page.screenshot({ path: 'scripts/qa-shots/bigmap-regression.png' });

await browser.close();
writeFileSync('scripts/qa-result-stadt.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
