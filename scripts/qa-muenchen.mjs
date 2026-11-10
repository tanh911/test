// QA map Munich OSM thật
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { scenario: {}, consoleErrors: [] };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

await page.goto(`${BASE}/sim-dev?map=muenchen&drive=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });
await sleep(600);

const s = await page.evaluate(() => {
  const map = window.__simScene.map;
  const stats = window.__simScene.getStats?.();
  const rs = window.__simScene.getRuleState?.();
  const ms = window.__simScene.getMapState?.();
  return {
    nodes: map.nodes.length,
    roads: map.roads.length,
    intersections: map.intersections.length,
    roundabouts: map.intersections.filter(ix => ix.rule === 'roundabout').length,
    trafficLights: map.intersections.filter(ix => ix.trafficLight).length,
    crosswalks: map.intersections.reduce((sum, ix) => sum + ix.crosswalks.length, 0),
    signs: map.signs.length,
    signTypes: Object.fromEntries(
      Object.entries(map.signs.reduce((acc, sg) => {
        acc[sg.type] = (acc[sg.type] ?? 0) + 1;
        return acc;
      }, {}))
    ),
    speedCounts: Object.fromEntries(
      Object.entries(map.roads.reduce((acc, rd) => {
        acc[rd.speedLimit] = (acc[rd.speedLimit] ?? 0) + 1;
        return acc;
      }, {}))
    ),
    spawn: map.spawns.player,
    signal: ms?.player?.signal ?? null,
    speedKmh: rs?.speedKmh ?? null,
    bestanden: rs?.bestanden ?? null,
    violations: rs ? rs.violations.map(v => v.type) : [],
    draws: stats?.draws ?? null,
    quads: stats?.quads ?? null,
    cellsLoaded: stats?.cellsLoaded ?? null,
    cellsTotal: stats?.cellsTotal ?? null,
    mapStatePlayer: !!ms?.player,
    mapStateNpcCount: ms?.npcs?.length ?? 0,
    mapStateLightCount: ms?.lights?.length ?? 0
  };
});
out.scenario.muenchenReal = s;
out.consoleErrors = out.consoleErrors;

await page.screenshot({ path: 'scripts/qa-shots/muenchen-real.png' });
await browser.close();
writeFileSync('scripts/qa-result-muenchen.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
