// Audit capture v2: autobahn free-drive with correct card click
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
  if (!t.includes('Texture marked for update')) logs.push(m.type() + ': ' + t.slice(0, 300));
});
page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 300)));

await page.goto('http://localhost:5199/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

// Click the autobahn card image (bubbles to card onClick)
await page.click('img[alt*="Cao Tốc"]', { timeout: 5000 }).catch(e => logs.push('CLICK-ERR: ' + e.message));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/10_selected.png` });

// Start
const startRes = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('BẮT ĐẦU HÀNH TRÌNH'));
  if (b) { b.click(); return b.textContent; }
  return 'no-btn';
});
logs.push('START: ' + startRes);

// Wait for GLB (270MB) + district build
await page.waitForTimeout(20000);
await page.screenshot({ path: `${OUT}/11_loaded.png` });

const state1 = await page.evaluate(() => {
  const r = window.refs?.current || {};
  return {
    mapId: r.currentMapId, carX: r.carX, carZ: r.carZ, heading: r.heading,
    aiCars: r.aiCars?.length ?? null, trafficMgr: !!r.trafficAIManager,
    glb: !!r._customGlbMap,
    mapInfo: r._scenery?.userData?.mapInfo,
    sceneryChildren: r._scenery?.children?.length,
    roadGen: !!r._scenery?.userData?.roadGen
  };
});
logs.push('STATE1: ' + JSON.stringify(state1));

// Start driving via simCapture (sets engine running, gear D)
await page.evaluate(() => window.__simCapture?.startDriving());
// hold W
await page.keyboard.down('w');
await page.waitForTimeout(10000);
await page.screenshot({ path: `${OUT}/12_drive_10s.png` });
await page.waitForTimeout(12000);
await page.keyboard.up('w');
await page.screenshot({ path: `${OUT}/13_drive_22s.png` });

const state2 = await page.evaluate(() => {
  const r = window.refs?.current || {};
  return {
    carX: r.carX, carZ: r.carZ, speed: r.speed,
    aiCars: (r.aiCars || []).map(a => ({ x: +a.mesh.position.x.toFixed(1), z: +a.mesh.position.z.toFixed(1), spd: +a.currentSpeed.toFixed(1) }))
  };
});
logs.push('STATE2: ' + JSON.stringify(state2));

// Top-down overview via custom camera
await page.evaluate(() => {
  const r = window.refs?.current;
  window.__simCapture?.setCamera(r.carX, 180, r.carZ + 60, r.carX, 0, r.carZ);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/14_topdown.png` });

fs.writeFileSync(`${OUT}/console2.log`, logs.slice(-150).join('\n'));
await browser.close();
console.log('STATE1:', JSON.stringify(state1));
console.log('STATE2:', JSON.stringify(state2));
console.log('LOGS:\n' + logs.filter(l => l.startsWith('log:') || l.startsWith('warn') || l.startsWith('PAGEERROR')).slice(-20).join('\n'));
