// Teleport tới vị trí user báo lệch, đo alignment
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(12000);

  const report = await page.evaluate(() => {
    const r = window.refs.current;
    // Teleport: HUD Z = -carZ → user Z -122.8 → carZ = +122.8
    r.carX = 1687;
    r.carZ = -122.8;
    r.speed = 0;
    if (r.playerCar) { r.playerCar.position.set(1687, 0, -122.8); }
    return { teleported: true };
  });
  await page.waitForTimeout(2500);

  const report2 = await page.evaluate(() => {
    const r = window.refs.current;
    const px = r.carX, pz = -r.carZ;
    const scene = r.scene;
    const glb = scene.getObjectByName('Autobahn_GLB_Model_roads_full');
    const roadMesh = (() => { let m = null; glb.traverse(c => { if (c.isMesh && c.name.includes('Roads')) m = c; }); return m; })();
    const rv = roadMesh.geometry.attributes.position;
    let bestRoad = Infinity;
    for (let i = 0; i < rv.count; i++) {
      const dx = rv.getX(i) + glb.position.x - px;
      const dz = rv.getZ(i) + glb.position.z - pz;
      const d = dx * dx + dz * dz;
      if (d < bestRoad) bestRoad = d;
    }
    const laneGraph = scene.userData?.roadGen?.laneGraph;
    let bestLane = Infinity;
    for (const lane of (laneGraph?.lanes || [])) {
      const pts = lane.drivableWaypoints || lane.centerline;
      if (!pts || pts.length < 2) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], az = pts[i][1];
        const bx = pts[i + 1][0], bz = pts[i + 1][1];
        const dx = bx - ax, dz = bz - az;
        const L2 = dx * dx + dz * dz;
        if (!L2) continue;
        let t = ((px - ax) * dx + (pz - az) * dz) / L2;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
        if (d < bestLane) bestLane = d;
      }
    }
    return {
      world: [px, pz],
      distToGlbRoad: Math.round(Math.sqrt(bestRoad) * 100) / 100,
      distToLaneGraph: Math.round(bestLane * 100) / 100,
    };
  });
  console.log('TELEPORT REPORT:', JSON.stringify(report2));
  await page.screenshot({ path: path.join(OUT, 'teleport_view.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
