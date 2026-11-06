// Probe Land map: player/bot alignment vs LaneGraph, fog, screenshot
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
  page.on('console', (m) => {
    const t = m.text();
    if (/Landstrasse|TrafficAI|error/i.test(t)) errors.push('[console] ' + t.slice(0, 200));
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const card = page.locator('div[title*="Cao Tốc"]').first();
  await card.click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(12000);

  const report = await page.evaluate(() => new Promise((resolve) => {
    const r = window.refs?.current;
    if (!r) { resolve({ error: 'no refs' }); return; }
    const px = r.carX;
    const pz = -r.carZ; // world z convention for PBF maps
    const laneGraph = r.scene?.userData?.roadGen?.laneGraph || r.scene?.userData?.laneGraph;

    const nearestLane = (x, z) => {
      if (!laneGraph || !Array.isArray(laneGraph.lanes)) return null;
      let best = null;
      for (const lane of laneGraph.lanes) {
        const pts = lane.drivableWaypoints || lane.centerline;
        if (!pts || pts.length < 2) continue;
        for (let i = 0; i < pts.length - 1; i++) {
          const ax = pts[i][0], az = pts[i][1];
          const bx = pts[i + 1][0], bz = pts[i + 1][1];
          const dx = bx - ax, dz = bz - az;
          const lenSq = dx * dx + dz * dz;
          if (lenSq === 0) continue;
          let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const qx = ax + t * dx, qz = az + t * dz;
          const d = Math.hypot(x - qx, z - qz);
          if (!best || d < best.d) best = { d: Math.round(d * 10) / 10, roadName: lane.roadName || '?' };
        }
      }
      return best;
    };

    const mgr = r.trafficAIManager;
    const bots = mgr ? mgr.botCars.map(c => {
      const bx = c.mesh.position.x, bz = c.mesh.position.z;
      const nl = nearestLane(bx, bz);
      return {
        distToPlayer: Math.round(Math.hypot(bx - px, bz - pz)),
        offRoad: nl ? nl.d : null,
        road: nl ? nl.roadName : null,
        speedKmH: Math.round(c.speed * 3.6),
        stop: c.stopReason,
      };
    }).sort((a, b) => a.distToPlayer - b.distToPlayer) : [];

    const fog = r.scene?.fog;
    resolve({
      player: { x: Math.round(px), z: Math.round(pz), headingDeg: Math.round((r.heading || 0) * 180 / Math.PI) },
      playerNearestLane: nearestLane(px, pz),
      laneCount: laneGraph?.lanes?.length ?? null,
      bots,
      fog: fog ? { color: '#' + fog.color.getHexString(), near: fog.near, far: fog.far } : null,
      spawnLog: 'check console',
    });
  }));

  console.log(JSON.stringify(report, null, 1));

  // Drive forward a bit then screenshot
  await page.keyboard.press('b');
  await page.keyboard.down('w');
  await page.waitForTimeout(3000);
  await page.keyboard.up('w');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'probe_autobahn_drive.png') });

  const after = await page.evaluate(() => {
    const r = window.refs.current;
    const px = r.carX, pz = -r.carZ;
    const laneGraph = r.scene?.userData?.roadGen?.laneGraph || r.scene?.userData?.laneGraph;
    let best = null;
    if (laneGraph) {
      for (const lane of laneGraph.lanes) {
        const pts = lane.drivableWaypoints || lane.centerline;
        if (!pts || pts.length < 2) continue;
        for (let i = 0; i < pts.length - 1; i++) {
          const ax = pts[i][0], az = pts[i][1];
          const bx = pts[i + 1][0], bz = pts[i + 1][1];
          const dx = bx - ax, dz = bz - az;
          const lenSq = dx * dx + dz * dz;
          if (lenSq === 0) continue;
          let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const d = Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
          if (!best || d < best.d) best = { d: Math.round(d * 10) / 10, roadName: lane.roadName || '?' };
        }
      }
    }
    const scene = r.scene;
    const glb = scene?.getObjectByName('Autobahn_GLB_Model_roads_full');
    let glbMeshes = 0, glbVerts = 0, hiddenProc = 0, visibleProc = 0;
    if (glb) glb.traverse(c => { if (c.isMesh) { glbMeshes++; glbVerts += c.geometry.attributes.position.count; } });
    scene?.traverse(c => {
      if (c.isMesh && (c.name === 'PBF_RoadSurface' || c.name === 'PBF_ConcreteJerseyMedian')) {
        if (c.visible) visibleProc++; else hiddenProc++;
      }
    });
    return { player: { x: Math.round(px), z: Math.round(pz) }, nearestLane: best, speedKmH: Math.round((r.speed || 0) * 3.6),
             glb: { found: !!glb, meshes: glbMeshes, verts: glbVerts }, proc: { hidden: hiddenProc, visible: visibleProc } };
  });
  console.log('AFTER DRIVE:', JSON.stringify(after));
  console.log('ERRORS:', errors.length ? errors.slice(0, 10) : 'none');
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
