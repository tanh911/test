// Kiểm tra toàn diện training map: đèn tín hiệu, biển báo, bot car, cung đường (bot qua cua)
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('console', m => { const t = m.text(); if (t.includes('AutobahnDistrict') || t.includes('Stadt') || t.includes('Parked')) logs.push(t.slice(0, 120)); });
page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 120)));
await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 60000 });
await page.evaluate(() => { const c = [...document.querySelectorAll('div[title]')].find(d => d.getAttribute('title').includes('training.glb')); c.click(); });
await page.waitForTimeout(300);
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 90000 });
await page.waitForTimeout(5000);

// ── 1. ĐÈN TÍN HIỆU ──
const tl = await page.evaluate(() => {
  const r = window.refs.current;
  const mgr = r.trafficAIManager;
  const groups = mgr?.sceneLightGroups || [];
  const sample = groups.slice(0, 5).map(g => ({ pos: g.group ? [+g.group.position.x.toFixed(0), +g.group.position.z.toFixed(0)] : null, state: g.state || g.currentState || '?', lights: g.lampMeshes?.length || g.lights?.length || 0 }));
  // đếm mesh đèn 3 bóng trong scene
  let tlMeshes = 0;
  r.scene.traverse(o => { if (o.isMesh && /ampel|traffic/i.test(o.name)) tlMeshes++; });
  return { lightGroups: groups.length, sample, tlMeshes, globalState: mgr?.globalTrafficLightState };
});
console.log('══ ĐÈN TÍN HIỆU:', JSON.stringify(tl));

// ── 2. BIỂN BÁO ──
const signs = await page.evaluate(() => {
  const r = window.refs.current;
  const found = {};
  r.scene.traverse(o => {
    if (!o.isMesh && !o.isGroup) return;
    const n = o.name || '';
    if (/sign|Sign|Schild|gantry|Gantry/i.test(n) && !found[n]) {
      found[n] = { count: 1, pos: [+o.position.x.toFixed(0), +o.position.z.toFixed(0)] };
    } else if (found[n]) found[n].count++;
  });
  // nhóm sign của district
  const signGroup = r.scene.getObjectByName('PBF_Autobahn_StVO_Signs_3D');
  const guideGroup = r.scene.getObjectByName('PBF_Autobahn_GuidanceSigns');
  return {
    namedMeshes: Object.keys(found).slice(0, 8),
    hasSignGroup: !!signGroup, signGroupChildren: signGroup?.children?.length || 0,
    hasGuideGroup: !!guideGroup, guideChildren: guideGroup?.children?.length || 0
  };
});
console.log('══ BIỂN BÁO:', JSON.stringify(signs));

// ── 3. BOT CAR — phân bố corridor + tốc độ ──
const bots = await page.evaluate(() => {
  const r = window.refs.current;
  const cars = r.trafficAIManager?.botCars || [];
  return {
    total: cars.length,
    moving: cars.filter(c => (c.speed || 0) * 3.6 > 3).length,
    corridors: [...new Set(cars.map(c => c.corridor?.id || c.corridor?.nameVi || '?'))].slice(0, 12),
    sample: cars.slice(0, 5).map(c => ({ id: c.id, kmh: +((c.speed || 0) * 3.6).toFixed(0), pos: [+c.mesh.position.x.toFixed(0), +c.mesh.position.z.toFixed(0)] }))
  };
});
console.log('══ BOT CAR:', JSON.stringify(bots));

// ── 4. CUNG ĐƯỜNG: theo dõi 1 bot chạy qua đoạn cua Verbindungstraße (8 giây) ──
const track = await page.evaluate(() => {
  const r = window.refs.current;
  const cars = r.trafficAIManager?.botCars || [];
  // chọn bot đang chạy trên corridor có đường cong (Verbindungstraße / Auffahrt)
  const curved = cars.find(c => /Verbindung|Auffahrt|Ausfahrt/i.test(c.corridor?.id || c.corridor?.nameVi || ''));
  if (!curved) return { found: false, corridorIds: cars.map(c => c.corridor?.id) };
  return { found: true, corridor: curved.corridor?.id, start: [+curved.mesh.position.x.toFixed(1), +curved.mesh.position.z.toFixed(1)] };
});
console.log('══ CURVE TRACK START:', JSON.stringify(track));
if (track.found) {
  await page.waitForTimeout(4000);
  const t2 = await page.evaluate((id) => {
    const cars = window.refs.current.trafficAIManager?.botCars || [];
    const c = cars.find(x => x.id === id);
    return c ? { mid: [+c.mesh.position.x.toFixed(1), +c.mesh.position.z.toFixed(1)], kmh: +((c.speed || 0) * 3.6).toFixed(0) } : null;
  }, track.corridor ? undefined : undefined);
  console.log('══ CURVE TRACK MID(+4s):', JSON.stringify(t2));
  await page.waitForTimeout(4000);
  const t3 = await page.evaluate(() => {
    const cars = window.refs.current.trafficAIManager?.botCars || [];
    const c = cars.find(x => x.id === arguments?.[0]);
    return c ? { end: [+c.mesh.position.x.toFixed(1), +c.mesh.position.z.toFixed(1)], kmh: +((c.speed || 0) * 3.6).toFixed(0) } : null;
  });
  console.log('══ CURVE TRACK END(+8s):', JSON.stringify(t3));
}

// ── 5. Screenshot tại giao lộ có đèn (Haupt×Kreuz z=200) ──
await page.evaluate(() => {
  const r = window.refs.current;
  r.carX = -398; r.carZ = -150;
  if (r.playerCar) { r.playerCar.position.x = -398; r.playerCar.position.z = -150; }
});
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scratch/audit_shots/pp_washout/check_junction_light.png' });
console.log('══ Screenshot giao lộ đèn saved');
console.log('LOGS:', logs.slice(0, 8));
await browser.close();
