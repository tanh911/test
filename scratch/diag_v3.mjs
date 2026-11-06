// Diag v3: đo cross-section markings GLB quanh spawn so với isofare lane graph
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
    const px = r.carX, pz = -r.carZ; // world: pz = -carZ
    const scene = r.scene;
    const glb = scene.getObjectByName('Autobahn_GLB_Model_roads_full');
    const out = { player: [Math.round(px * 10) / 10, Math.round(pz * 10) / 10] };

    const markMesh = (() => { let m = null; glb.traverse(c => { if (c.isMesh && c.name.includes('Markings')) m = c; }); return m; })();
    const roadMesh = (() => { let m = null; glb.traverse(c => { if (c.isMesh && c.name.includes('Roads')) m = c; }); return m; })();
    const mv = markMesh.geometry.attributes.position;
    const rv = roadMesh.geometry.attributes.position;
    const ox = glb.position.x, oz = glb.position.z;

    // Road của lane graph gần player nhất (theo road, không phải lane)
    const laneGraph = scene.userData?.roadGen?.laneGraph;
    let bestRoad = null;
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
        const qx = ax + t * dx, qz = az + t * dz;
        const d = Math.hypot(px - qx, pz - qz);
        if (!bestRoad || d < bestRoad.d) {
          bestRoad = { d, roadId: lane.roadId, roadName: lane.roadName, laneId: lane.id,
            dir: [dx / Math.sqrt(L2), dz / Math.sqrt(L2)], pt: [qx, qz],
            laneOffsets: (laneGraph.lanes || []).filter(l => l.roadId === lane.roadId).map(l => Math.round(l.lateralOffset * 100) / 100) };
        }
      }
    }
    out.road = bestRoad ? { id: bestRoad.roadId, name: bestRoad.roadName, distPlayer: Math.round(bestRoad.d * 100) / 100, laneOffsets: bestRoad.laneOffsets, laneId: bestRoad.laneId } : null;
    if (!bestRoad) return out;

    // Cross-section: mọi vert marking trong |along| < 30m quanh player -> lateral offset
    const [dx, dz] = bestRoad.dir;
    const lat = { x: -dz, z: dx }; // phải chiều chạy (quy ước strip builder)
    const markLats = [], roadLats = [];
    for (let i = 0; i < mv.count; i++) {
      const wx = mv.getX(i) + ox, wz = mv.getZ(i) + oz;
      const ax = wx - px, az = wz - pz;
      const along = ax * dx + az * dz;
      const l = ax * lat.x + az * lat.z;
      if (Math.abs(along) > 30 || Math.abs(l) > 60) continue;
      markLats.push(Math.round(l * 100) / 100);
    }
    for (let i = 0; i < rv.count; i++) {
      const wx = rv.getX(i) + ox, wz = rv.getZ(i) + oz;
      const ax = wx - px, az = wz - pz;
      const along = ax * dx + az * dz;
      const l = ax * lat.x + az * lat.z;
      if (Math.abs(along) > 30 || Math.abs(l) > 60) continue;
      roadLats.push(Math.round(l * 100) / 100);
    }
    markLats.sort((a, b) => a - b);
    roadLats.sort((a, b) => a - b);
    // cluster marking lats (cách 0.5m)
    const clusters = [];
    for (const v of markLats) {
      if (clusters.length && v - clusters[clusters.length - 1].max < 0.5) {
        clusters[clusters.length - 1].max = v; clusters[clusters.length - 1].n++;
      } else clusters.push({ min: v, max: v, n: 1 });
    }
    out.markingClusters = clusters.filter(c => c.n >= 5);
    out.roadLatExtent = roadLats.length ? [roadLats[0], roadLats[roadLats.length - 1]] : null;
    return out;
  });
  console.log('V3 REPORT:', JSON.stringify(report, null, 1));

  // Top-down + cockpit screenshots
  await page.evaluate(() => {
    const r = window.refs.current;
    r.camera.position.set(r.carX, 60, r.carZ - 0.1);
    r.camera.lookAt(r.carX, 0, r.carZ);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'v3_topdown.png') });
  await page.evaluate(() => {
    const r = window.refs.current;
    if (r.resetCameraToFit) r.resetCameraToFit();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'v3_cockpit.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
