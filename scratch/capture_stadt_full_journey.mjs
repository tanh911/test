// Full autopilot run: Rhynern town → Auffahrt → A2 → Ausfahrt, screenshots per stage
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

  await page.goto(BASE + '/babylon', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('text=Thoát', { timeout: 90000 });
  await page.waitForTimeout(5000);

  // Look right at the Fahrlehrer (cockpit)
  await page.keyboard.down('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT_DIR + '/j01_fahrlehrer_lookright.png' });
  await page.keyboard.up('e');
  await page.waitForTimeout(600);

  await page.screenshot({ path: OUT_DIR + '/j02_spawn_town.png' });

  // Build waypoint list from the engine's own route data
  const targets = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const pts = [];
    const push = (p, label) => p && pts.push({ x: p[0], z: p[1], label });
    const town = eng._townPts || [];
    const forkS = eng._townForkS || 437;
    // town waypoints every ~90m until the fork
    let acc = 0;
    for (let i = 1; i < town.length; i++) {
      const dx = town[i][0] - town[i - 1][0], dz = town[i][1] - town[i - 1][1];
      acc += Math.hypot(dx, dz);
      if (acc > 90 && acc <= forkS - 30) { push(town[i], 'town'); acc = 0; }
    }
    (eng._einfahrtPts || []).forEach((p, i) => { if (i % 2 === 1) push(p, 'ramp-in'); });
    push(eng._routeKeys?.merge ? [eng._routeKeys.merge[0], eng._routeKeys.merge[1]] : null, 'merge');
    // corridor theo s chính xác tới Ausfahrt Nordbögge (s=3197)
    const corr = eng._corridorPts || [];
    const placeS = (s) => {
      // replicate placeAlongPolyline on corridor
      let a = 0;
      for (let i = 0; i < corr.length - 1; i++) {
        const p1 = corr[i], p2 = corr[i + 1];
        const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
        const L = Math.hypot(dx, dz);
        if (L === 0) continue;
        if (a + L >= s) {
          const t = (s - a) / L;
          return [p1[0] + dx * t, p1[1] + dz * t];
        }
        a += L;
      }
      return null;
    };
    [1400, 2200, 2980].forEach((s) => push(placeS(s, 3.5), 'cruise'));
    // nhánh Ausfahrt Nordbögge + làng
    const ramp = eng._villageRampRoad?.centerline || [];
    ramp.forEach((p) => push(p, 'nord-ramp'));
    const village = eng._villagePts || [];
    // làng: từ điểm nhập (s≈983) đi về cuối chuỗi
    let va = 0;
    for (let i = 1; i < village.length; i++) {
      va += Math.hypot(village[i][0] - village[i - 1][0], village[i][1] - village[i - 1][1]);
      if (va > 1010 && va < 1120 && !pts.some((p) => p.label === 'village1')) push(village[i], 'village1');
      if (va > 1350 && va < 1480 && !pts.some((p) => p.label === 'village2')) push(village[i], 'village2');
    }
    push(village[village.length - 1], 'village-end');
    return pts;
  });
  console.log('WAYPOINTS:', targets.map(t => `${t.label}(${Math.round(t.x)},${Math.round(t.z)})`).join(' '));

  // Autopilot: bang-bang steering toward each waypoint
  const driveTo = async (wp, speedTarget, timeoutMs, shotName) => {
    const t0 = Date.now();
    await page.evaluate(() => { const e = window.__babylonSim; e.keys['w'] = true; });
    while (Date.now() - t0 < timeoutMs) {
      const st = await page.evaluate(({ tx, tz }) => {
        const e = window.__babylonSim;
        const dx = tx - e.carX, dz = tz - e.carZ;
        const dist = Math.hypot(dx, dz);
        let hDes = Math.atan2(dx, -dz);
        let err = hDes - e.heading;
        while (err > Math.PI) err -= 2 * Math.PI;
        while (err < -Math.PI) err += 2 * Math.PI;
        return { dist, err, speed: e.speedKmh, road: e.activeRoad?.name, rid: e.activeRoad?.id, instr: e._instructor?.text, stage: e._instructor?.stageIdx, lat: e._playerLatOff, s: e._playerCorridorS };
      }, { tx: wp.x, tz: wp.z });
      // steering: err > 0 → cần tăng heading → rẽ phải (D); err < 0 → rẽ trái (A)
      await page.evaluate((err) => {
        const e = window.__babylonSim;
        e.keys['a'] = err < -0.025;
        e.keys['d'] = err > 0.025;
      }, st.err);
      // speed control
      if (st.speed > speedTarget + 6) await page.evaluate(() => { const e = window.__babylonSim; e.keys['w'] = false; e.keys['s'] = true; });
      else if (st.speed < speedTarget - 6) await page.evaluate(() => { const e = window.__babylonSim; e.keys['s'] = false; e.keys['w'] = true; });
      else await page.evaluate(() => { const e = window.__babylonSim; e.keys['s'] = false; e.keys['w'] = true; });

      if (st.dist < 28) {
        await page.evaluate(() => { const e = window.__babylonSim; e.keys['a'] = false; e.keys['d'] = false; });
        console.log(`REACHED ${wp.label}: dist=${Math.round(st.dist)} speed=${Math.round(st.speed)} road=${st.road} stage=${st.stage} lat=${st.lat?.toFixed(1)}`);
        if (shotName) await page.screenshot({ path: OUT_DIR + '/' + shotName });
        return st;
      }
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => { const e = window.__babylonSim; e.keys['a'] = false; e.keys['d'] = false; e.keys['w'] = false; });
    console.log(`TIMEOUT ${wp.label}`);
    await page.screenshot({ path: OUT_DIR + '/timeout_' + (shotName || 'wp') + '.png' });
    return null;
  };

  let last = null;
  for (const wp of targets) {
    const speed = wp.label === 'town' ? 48 : wp.label === 'ramp-in' ? 52 : wp.label === 'merge' ? 68
      : wp.label.startsWith('nord') || wp.label.startsWith('village') ? 50 : 125;
    const shot = { town: 'j03_town.png', 'ramp-in': 'j04_ramp_in.png', merge: 'j05_merged.png',
      cruise: 'j06_cruise.png', 'nord-ramp': 'j07_nord_ramp.png', village1: 'j08_village.png', 'village-end': 'j09_village_end.png' }[wp.label];
    // shot sớm để kiểm tra biển Ortstafel/VZ 274 trong phố
    if (wp.label === 'town' && !fs.existsSync(OUT_DIR + '/j02b_town_signs.png')) {
      setTimeout(() => page.screenshot({ path: OUT_DIR + '/j02b_town_signs.png' }).catch(() => {}), 4200);
    }
    last = await driveTo(wp, speed, wp.label === 'town' ? 40000 : 45000, shot);
    if (!last) break;
  }

  const final = await page.evaluate(() => {
    const s = window.__babylonSim.getState();
    return { road: s.roadName, rid: s.roadId, x: Math.round(s.carX), z: Math.round(s.carZ), speed: s.speedKmh, limit: s.speedLimit, stage: s.instructor?.stageIdx, instr: s.instructor?.text, fps: s.fps };
  });
  console.log('FINAL:', JSON.stringify(final, null, 1));
  await page.screenshot({ path: OUT_DIR + '/j09_finish.png' });
  await browser.close();
  console.log('DONE');
};
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
