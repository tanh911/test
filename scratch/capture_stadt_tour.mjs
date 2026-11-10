// Capture the new 'stadt' journey in the Babylon autobahn engine
import { chromium } from 'playwright';
import fs from 'fs';

const OUT_DIR = 'scratch/audit_shots';
fs.mkdirSync(OUT_DIR, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:3001';

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  page.on('console', (m) => {
    const t = m.text();
    if (t.includes('BabylonAutobahnEngine') || t.includes('LaneGraph') || t.includes('error')) console.log('[console]', t.slice(0, 220));
  });

  await page.goto(BASE + '/babylon', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // wait for engine boot (loading overlay disappears)
  await page.waitForSelector('text=Thoát', { timeout: 90000 });
  await page.waitForTimeout(6000);

  const state1 = await page.evaluate(() => {
    const s = window.__babylonSim?.getState();
    return s ? {
      road: s.roadName, roadId: s.roadId, x: Math.round(s.carX), z: Math.round(s.carZ),
      head: s.headingDeg, speed: s.speedKmh, limit: s.speedLimit,
      instructor: s.instructor?.text, stage: s.instructor?.stageIdx,
      lane: s.laneIndex ? `${s.laneIndex}/${s.laneCount}` : null, role: s.laneRole,
      fps: s.fps
    } : null;
  });
  console.log('STATE@SPAWN:', JSON.stringify(state1, null, 1));
  await page.screenshot({ path: OUT_DIR + '/stadt_01_spawn_cockpit.png' });

  // look right to see the Fahrlehrer in the passenger seat
  await page.keyboard.down('e');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: OUT_DIR + '/stadt_02_lookright_fahrlehrer.png' });
  await page.keyboard.up('e');
  await page.waitForTimeout(800);

  // drive south through the town
  await page.keyboard.down('w');
  await page.waitForTimeout(9000);
  const state2 = await page.evaluate(() => {
    const s = window.__babylonSim?.getState();
    return { road: s.roadName, roadId: s.roadId, speed: s.speedKmh, x: Math.round(s.carX), z: Math.round(s.carZ), instr: s.instructor?.text, stage: s.instructor?.stageIdx };
  });
  console.log('STATE@TOWN9s:', JSON.stringify(state2));
  await page.keyboard.up('w');
  await page.screenshot({ path: OUT_DIR + '/stadt_03_town_drive.png' });

  // chase view to inspect town scenery
  await page.keyboard.press('c');
  await page.waitForTimeout(900);
  await page.screenshot({ path: OUT_DIR + '/stadt_04_town_chase.png' });
  await page.keyboard.press('c');

  const bot = await browser.close();
  console.log('DONE');
};
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
