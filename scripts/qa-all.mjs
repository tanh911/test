// QA tất cả map: stadt, muenchen, bigMap regression
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { scenarios: {}, consoleErrors: [] };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

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

const countRoundabouts = () => page.evaluate(() => {
  const map = window.__simScene.map;
  return map.intersections.filter(ix => ix.rule === 'roundabout').length;
});

const countCrosswalks = () => page.evaluate(() => {
  const map = window.__simScene.map;
  return map.intersections.reduce((sum, ix) => sum + ix.crosswalks.length, 0);
});

const countSignsByType = () => page.evaluate(() => {
  const map = window.__simScene.map;
  const counts = {};
  for (const sg of map.signs) {
    counts[sg.type] = (counts[sg.type] ?? 0) + 1;
  }
  return counts;
});

// ── Map 1: stadt ──
await page.goto(`${BASE}/sim-dev?map=stadt&drive=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 40000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });
await sleep(600);
const s1 = await snap();
out.scenarios.stadt = { ...s1, roundabouts: await countRoundabouts(), crosswalks: await countCrosswalks(), signs: await countSignsByType() };
await page.screenshot({ path: 'scripts/qa-shots/stadt-final.png' });

// ── Map 2: muenchen (OSM thật) ──
await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });
await sleep(600);
const s2 = await snap();
out.scenarios.muenchen = { ...s2, roundabouts: await countRoundabouts(), crosswalks: await countCrosswalks(), signs: await countSignsByType() };
await page.screenshot({ path: 'scripts/qa-shots/muenchen-final.png' });

// ── Map 3: bigMap regression ──
await page.goto(`${BASE}/sim-dev?drive=1&big=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 40000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });
await sleep(600);
const s3 = await page.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  stats: window.__simScene.getStats?.() ?? null,
  mapStatePlayers: !!window.__simScene.getMapState().player
}));
out.scenarios.bigMapRegression = s3;

await browser.close();
writeFileSync('scripts/qa-result-all.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
