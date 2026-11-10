// Diagnostic: player vs GLB road/markings alignment + top-down screenshot
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
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(12000);

  const report = await page.evaluate(() => {
    const r = window.refs.current;
    const px = r.carX, pz = r.carZ; // world frame (graph frame)
    const scene = r.scene;
    const glb = scene.getObjectByName('Autobahn_GLB_Model_roads_full');
    const out = { player: [Math.round(px * 10) / 10, Math.round(pz * 10) / 10], headingDeg: Math.round((r.heading || 0) * 180 / Math.PI) };
    if (!glb) { out.error = 'no glb'; return out; }

    // Gom verts từng mesh GLB (world = local + glb.position)
    const meshes = {};
    glb.traverse(c => {
      if (c.isMesh) meshes[c.name] = { obj: c, verts: c.geometry.attributes.position };
    });
    out.meshNames = Object.keys(meshes);

    // Khoảng cách tối thiểu player -> từng mesh (XZ plane)
    const minDist = (verts, ox, oz) => {
      let best = Infinity;
      for (let i = 0; i < verts.count; i++) {
        const dx = verts.getX(i) + ox - px;
        const dz = verts.getZ(i) + oz - pz;
        const d = dx * dx + dz * dz;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
    out.distToRoad = null;
    out.distToMarkings = null;
    for (const [name, m] of Object.entries(meshes)) {
      const d = minDist(m.verts, glb.position.x, glb.position.z);
      if (name.includes('Roads')) out.distToRoad = Math.round(d * 100) / 100;
      if (name.includes('Markings')) out.distToMarkings = Math.round(d * 100) / 100;
    }

    // Lane graph: lane gần player nhất (world frame)
    const laneGraph = scene.userData?.roadGen?.laneGraph;
    if (laneGraph) {
      let best = null;
      for (const lane of laneGraph.lanes) {
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
          if (!best || d < best.d) best = { d: Math.round(d * 100) / 100, road: lane.roadName, pt: [Math.round(qx), Math.round(qz)] };
        }
      }
      out.nearestLane = best;
    }
    return out;
  });
  console.log('REPORT:', JSON.stringify(report, null, 1));

  // Top-down: đặt camera cao trên xe nhìn thẳng xuống
  await page.evaluate(() => {
    const r = window.refs.current;
    const cam = r.camera;
    cam.position.set(r.carX, 120, r.carZ);
    cam.lookAt(r.carX, 0, r.carZ);
    if (r._renderLoopPaused) return;
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'topdown_alignment.png') });
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
