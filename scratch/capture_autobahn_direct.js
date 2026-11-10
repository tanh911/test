// Audit capture v3: load autobahn directly via refs (bypass UI)
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'scratch/audit_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const logs = [];
page.on('console', m => {
  const t = m.text();
  if (!t.includes('Texture marked for update') && !t.includes('Auto-Generated MiniMap')) logs.push(m.type() + ': ' + t.slice(0, 250));
});
page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 250)));

await page.goto('http://localhost:5199/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.refs?.current?.loadMapIntoScene, { timeout: 30000 });
logs.push('MOUNTED');

// Direct load autobahn
await page.evaluate(() => {
  const r = window.refs.current;
  r.setCurrentMapId('autobahn_a9');
  r.currentMapId = 'autobahn_a9';
  r.loadMapIntoScene('autobahn_a9');
});
await page.waitForTimeout(25000);

const state1 = await page.evaluate(() => {
  const r = window.refs.current;
  return {
    mapId: r.currentMapId, carX: r.carX, carZ: r.carZ, heading: r.heading,
    aiCars: r.aiCars?.length ?? null,
    glb: !!r._customGlbMap,
    mapInfo: r._scenery?.userData?.mapInfo ?? null,
    disableSceneryMoving: r._disableSceneryMoving,
    spawnCfg: null
  };
});
logs.push('STATE1: ' + JSON.stringify(state1));
await page.screenshot({ path: `${OUT}/20_loaded_cockpit.png` });

// Drive
await page.evaluate(() => window.__simCapture?.startDriving());
await page.keyboard.down('w');
await page.waitForTimeout(12000);
await page.screenshot({ path: `${OUT}/21_drive_12s.png` });
await page.waitForTimeout(12000);
await page.keyboard.up('w');
await page.screenshot({ path: `${OUT}/22_drive_24s.png` });

const state2 = await page.evaluate(() => {
  const r = window.refs.current;
  const ai = (r.aiCars || []).slice(0, 8).map(a => ({
    x: +a.mesh.position.x.toFixed(1), z: +a.mesh.position.z.toFixed(1),
    spd: +(a.currentSpeed || 0).toFixed(1), opp: a.isOpposite
  }));
  return { carX: +r.carX.toFixed(1), carZ: +r.carZ.toFixed(1), speed: +(r.speed || 0).toFixed(0), aiCars: ai };
});
logs.push('STATE2: ' + JSON.stringify(state2));

// Top-down over player
await page.evaluate(() => {
  const r = window.refs.current;
  window.__simCapture?.setCamera(r.carX, 160, r.carZ + 40, r.carX, 0, r.carZ - 50);
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/23_topdown.png` });

fs.writeFileSync(`${OUT}/console3.log`, logs.slice(-160).join('\n'));
await browser.close();
console.log('STATE1:', JSON.stringify(state1));
console.log('STATE2:', JSON.stringify(state2));
const interesting = logs.filter(l => /AutobahnDistrict|RoadGraph|ERROR|error|GLB|glb|Failed|WARN/i.test(l));
console.log('KEY LOGS:\n' + interesting.slice(-15).join('\n'));
