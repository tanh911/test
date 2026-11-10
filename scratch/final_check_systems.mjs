// Final: track bot qua cung cua + chụp giao lộ đèn
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 60000 });
await page.evaluate(() => { const c = [...document.querySelectorAll('div[title]')].find(d => d.getAttribute('title').includes('training.glb')); c.click(); });
await page.waitForTimeout(300);
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 90000 });
await page.waitForTimeout(3000);

// ── Track bot trên corridor CÓ CUA (Verbindungstraße: waypoint cong) ──
const picked = await page.evaluate(() => {
  const cars = window.refs.current.trafficAIManager?.botCars || [];
  const c = cars.find(x => /Verbindung/i.test(x.corridor?.id || ''));
  if (!c) return null;
  // đánh dấu bot bằng _trackTag để find lại ổn định
  c._trackTag = 'TRACK_ME';
  return { corridor: c.corridor?.id, start: [+c.mesh.position.x.toFixed(1), +c.mesh.position.z.toFixed(1)], wp: c.corridor.waypoints?.length };
});
console.log('TRACK start:', JSON.stringify(picked));
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => {
    const cars = window.refs.current.trafficAIManager?.botCars || [];
    const c = cars.find(x => x._trackTag === 'TRACK_ME');
    if (!c) return 'GONE';
    return { p: [+c.mesh.position.x.toFixed(1), +c.mesh.position.z.toFixed(1)], kmh: +((c.speed || 0) * 3.6).toFixed(0) };
  });
  console.log(`  +${(i + 1) * 2}s:`, JSON.stringify(s));
}

// ── Chụp giao lộ Haupt×Kreuz (2 đèn mới) ──
await page.evaluate(() => {
  const r = window.refs.current;
  r.carX = -398; r.carZ = -140;
  if (r.playerCar) { r.playerCar.position.x = -398; r.playerCar.position.z = -140; }
});
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/junction_final.png' });
console.log('junction screenshot saved');
await browser.close();
