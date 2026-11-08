// Test cẩn thận v2: reset miễn nhiễm va chạm trước mỗi teleport + raycast verify Standstreifen
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 150)));
await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 60000 });
await page.evaluate(() => { const c = [...document.querySelectorAll('div[title]')].find(d => d.getAttribute('title').includes('training.glb')); c.click(); });
await page.waitForTimeout(300);
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 120000 });
await page.evaluate(() => window.__simCapture?.startDriving?.());

const teleport = (x, z, rotDeg) => page.evaluate(([tx, tz, tr]) => {
  const r = window.refs.current;
  r.collisionOccurred = false;
  r._collisionImmunityUntil = Date.now() + 8000;
  r.speed = 0;
  r.carX = tx; r.carZ = tz;
  r.heading = tr * Math.PI / 180;
  if (r.playerCar) { r.playerCar.position.set(tx, 0.05, tz); }
  setGearP: {
    try { r.gear = 'D1'; } catch (e) { }
  }
}, [x, z, rotDeg]);

const resume = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Tiếp tục bài thi/.test(x.innerText)); if (b) b.click(); });

// ── TEST 1: Junction stop bar + arrows + zebra ──
await teleport(-398, -150, 180);
await page.keyboard.down('w');
await page.waitForTimeout(2600);
await page.keyboard.up('w');
await page.waitForTimeout(600);
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/t2_junction.png' });
const j = await page.evaluate(() => {
  const r = window.refs.current;
  return { x: +r.carX.toFixed(1), z: +r.carZ.toFixed(1), kmh: +((r.speed || 0) * 3.6).toFixed(0) };
});
console.log('T1 junction:', JSON.stringify(j));

// ── TEST 2: raycast qua mặt cắt A2 → tìm Standstreifen (dải nhựa ngoài mép phải) ──
await resume();
await teleport(-200, 0, 90);
const shoulder = await page.evaluate(async () => {
  const THREE = await import('/@id/three');
  const r = window.refs.current;
  const RC = new THREE.Raycaster();
  const out = [];
  // A2_East: graph x −200, z −30..25 (3 làn, half ~5.75 + Standstreifen 2.7 ngoài mép phải)
  for (let dz = -12; dz <= 12; dz += 1) {
    RC.set(new THREE.Vector3(-200, 10, dz), new THREE.Vector3(0, -1, 0));
    RC.far = 30;
    const inter = RC.intersectObject(r.scene, true);
    out.push({ dz, top: (inter[0]?.object.name || '?').slice(0, 20), y: +(inter[0]?.point.y ?? 0).toFixed(2) });
  }
  return out;
});
shoulder.forEach(s => console.log('  z=' + s.dz, s.top, '@' + s.y));

// ── TEST 3: cua Auffahrt — vạch liền ──
await resume();
await teleport(360, 175, 115);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/t2_curve.png' });

console.log('errors:', errors.length, errors.slice(0, 2));
await browser.close();
