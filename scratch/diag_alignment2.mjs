// Diag v2: đúng quy ước pz=-carZ; đo vector lệch laneGraph vs GLB mesh
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');

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
    const px = r.carX, pz = -r.carZ; // ĐÚNG quy ước world của PBF maps
    const scene = r.scene;
    const glb = scene.getObjectByName('Autobahn_GLB_Model_roads_full');
    const out = { player: [Math.round(px * 10) / 10, Math.round(pz * 10) / 10], glbPos: [glb.position.x, glb.position.y, glb.position.z] };

    const roadMesh = (() => { let m = null; glb.traverse(c => { if (c.isMesh && c.name.includes('Roads')) m = c; }); return m; })();
    const markMesh = (() => { let m = null; glb.traverse(c => { if (c.isMesh && c.name.includes('Markings')) m = c; }); return m; })();
    const rv = roadMesh.geometry.attributes.position;
    const mv = markMesh.geometry.attributes.position;

    // Lane graph gần player
    const laneGraph = scene.userData?.roadGen?.laneGraph;
    let bestLane = null;
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
        if (!bestLane || d < bestLane.d) bestLane = { d: Math.round(d * 100) / 100, road: lane.roadName, pt: [qx, qz] };
      }
    }
    out.nearestLane = bestLane;

    // Vector lệch: từ 1 điểm lane, tìm vert GLB gần nhất
    const nearestVert = (verts, ox, oz, qx, qz) => {
      let best = Infinity, bp = null;
      for (let i = 0; i < verts.count; i++) {
        const dx = verts.getX(i) + ox - qx;
        const dz = verts.getZ(i) + oz - qz;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; bp = [verts.getX(i) + ox, verts.getZ(i) + oz]; }
      }
      return { d: Math.sqrt(best), pt: bp };
    };
    if (bestLane) {
      const [lx, lz] = bestLane.pt;
      const nr = nearestVert(rv, glb.position.x, glb.position.z, lx, lz);
      const nm = nearestVert(mv, glb.position.x, glb.position.z, lx, lz);
      out.laneToRoadGap = Math.round(nr.d * 100) / 100;
      out.roadVertNearLane = [Math.round(nr.pt[0]), Math.round(nr.pt[1])];
      out.laneToMarkingGap = Math.round(nm.d * 100) / 100;
      out.delta = [Math.round(nr.pt[0] - lx), Math.round(nr.pt[1] - lz)];
    }
    out.distPlayerToRoad = (() => {
      let best = Infinity;
      for (let i = 0; i < rv.count; i++) {
        const dx = rv.getX(i) + glb.position.x - px;
        const dz = rv.getZ(i) + glb.position.z - pz;
        const d = dx * dx + dz * dz;
        if (d < best) best = d;
      }
      return Math.round(Math.sqrt(best) * 100) / 100;
    })();
    return out;
  });
  console.log('REPORT:', JSON.stringify(report, null, 1));

  await page.evaluate(() => {
    const r = window.refs.current;
    r.camera.position.set(r.carX, 150, r.carZ - 0.1);
    r.camera.lookAt(r.carX, 0, r.carZ);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'topdown_alignment.png') });
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
