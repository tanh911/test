// QA toàn bộ map Stadt: kiểm tra cấu trúc intersections, signs, speedLimit, roundabout island, peds
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { checks: {}, consoleErrors: [] };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

// 1. Boot map Stadt & dump cấu trúc map
await page.goto(`${BASE}/sim-dev?map=stadt`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 40000 });
await sleep(600);

const mapCheck = await page.evaluate(() => {
  const s = window.__simScene;
  const map = s.map;
  const intersections = map.intersections.map(ix => ({
    nodeId: ix.nodeId,
    rule: ix.rule,
    hasTrafficLight: !!ix.trafficLight,
    crosswalks: ix.crosswalks.length
  }));
  const rules = {};
  for (const ix of intersections) rules[ix.rule] = (rules[ix.rule] || 0) + 1;

  const signs = map.signs.map(sg => ({ type: sg.type, roadId: sg.roadId, value: sg.value, side: sg.side }));
  const signTypes = {};
  for (const sg of signs) signTypes[sg.type] = (signTypes[sg.type] || 0) + 1;

  const roads = map.roads.map(rd => ({ id: rd.id, speedLimit: rd.speedLimit, laneWidth: rd.laneWidth }));
  const speedCounts = {};
  for (const rd of roads) speedCounts[rd.speedLimit] = (speedCounts[rd.speedLimit] || 0) + 1;

  // Vehicles/NPC count from mapState
  const ms = s.getMapState?.();
  return {
    nodes: map.nodes.length,
    roads: map.roads.length,
    intersections: intersections.length,
    rules,
    signs,
    signTypes,
    speedCounts,
    spawn: map.spawns.player,
    mapStateNpcCount: ms?.npcs?.length ?? 0,
    mapStateLightCount: ms?.lights?.length ?? 0
  };
});

out.checks.mapStructure = mapCheck;

// 2. Kiểm tra roundabout island có mesh không (traverse scene tìm quads island - kiểm tra qua junction patch có mặt)
const islandCheck = await page.evaluate(() => {
  const s = window.__simScene;
  // Đếm object có tên liên quan junction / island / road
  let junctionQuads = 0;
  let roadQuads = 0;
  s.scene.traverse(o => {
    if (o.isMesh) {
      const name = o.name || '';
      if (name.includes('junction') || name.includes('island')) junctionQuads++;
      else if (name.includes('road')) roadQuads++;
    }
  });
  return { junctionQuads, roadQuads };
});
out.checks.island = islandCheck;

// 3. Kiểm tra đèn giao thông có render không (trafficLightGroup)
const lightRenderCheck = await page.evaluate(() => {
  let n = 0;
  window.__simScene.scene.traverse(o => { if (o.name === 'trafficLightGroup') n++; });
  return n;
});
out.checks.trafficLightsRendered = lightRenderCheck;

// 4. Kiểm tra người đi bộ (ped_*) có render không
const pedRenderCheck = await page.evaluate(() => {
  let n = 0;
  window.__simScene.scene.traverse(o => { if (o.name && o.name.startsWith('ped_')) n++; });
  return n;
});
out.checks.pedsRendered = pedRenderCheck;

// 5. Kiểm tra không có console error
out.checks.noConsoleError = out.consoleErrors.length === 0;

await browser.close();
writeFileSync('scripts/qa-result-stadt-full.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
