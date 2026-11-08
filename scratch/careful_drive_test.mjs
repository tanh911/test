// Test lái cẩn thận training circuit: junction (stop bar + arrow + zebra + đèn đỏ) → A2 (Standstreifen)
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

// ── Chặng 1: lái từ spawn tới giao lộ Haupt×Kreuz (graph z 185→200), dừng ở vạch ──
await page.keyboard.down('w');
await page.waitForTimeout(9000);
await page.keyboard.up('w');
await page.waitForTimeout(800);
let st = await page.evaluate(() => {
  const r = window.refs.current;
  return { x: +r.carX.toFixed(1), z: +r.carZ.toFixed(1), spd: +(r.speed * 3.6).toFixed(0) };
});
console.log('CHẶNG 1 — tới giao lộ:', JSON.stringify(st));
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/test_junction_approach.png' });

// ── Chặng 2: nếu đèn đỏ → dừng quan sát; nếu xanh → qua. Chụp lúc dừng ──
await page.keyboard.down('w');
await page.waitForTimeout(3500);
await page.keyboard.up('w');
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/test_junction_at.png' });
st = await page.evaluate(() => {
  const r = window.refs.current;
  return { x: +r.carX.toFixed(1), z: +r.carZ.toFixed(1), spd: +(r.speed * 3.6).toFixed(0) };
});
console.log('CHẶNG 2 — qua giao lộ:', JSON.stringify(st));

// ── Chặng 3: teleport lên A2 East để soi Standstreifen (phải là bên PHẢI chiều đi) ──
await page.evaluate(() => {
  const r = window.refs.current;
  // A2_East_1: centerline từ (-800,-30) → (800,25), 3 làn oneway; đặt giữa tuyến
  r.carX = -200; r.carZ = 10;
  if (r.playerCar) { r.playerCar.position.set(-200, 0.1, 10); }
});
await page.waitForTimeout(2000);
await page.keyboard.down('w');
await page.waitForTimeout(4000);
await page.keyboard.up('w');
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/test_a2_shoulder.png' });
st = await page.evaluate(() => {
  const r = window.refs.current;
  return { x: +r.carX.toFixed(0), z: +r.carZ.toFixed(0), spd: +(r.speed * 3.6).toFixed(0) };
});
console.log('CHẶNG 3 — A2:', JSON.stringify(st));

// ── Chặng 4: cung cua Auffahrt — vạch liền cấm vượt ──
await page.evaluate(() => {
  const r = window.refs.current;
  r.carX = 360; r.carZ = 175;
  if (r.playerCar) { r.playerCar.position.set(360, 0.1, 175); }
});
await page.waitForTimeout(2000);
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/test_curve_solid.png' });

console.log('pageerrors:', errors.length, errors.slice(0, 2));
await browser.close();
