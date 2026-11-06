// Babylon diag: vào map Autobahn (engine Babylon), chụp spawn + lái thử + đo alignment
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page error]', m.text().slice(0, 200)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  // chờ loading Babylon xong (canvas hiển thị + HUD telemetry)
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForTimeout(1500);

  const report = await page.evaluate(() => {
    const eng = window.__babylonSim;
    if (!eng) return { error: 'no engine handle' };
    const s = eng.getState();
    // đo khoảng cách từ xe tới vạch kẻ GLB (mesh Autobahn_Markings) qua cross-section như diag cũ
    const markMesh = eng.scene.meshes.find(m => m.name === 'Autobahn_Markings');
    let markInfo = null;
    if (markMesh && markMesh.getVerticesData) {
      const pos = markMesh.getVerticesData('position');
      const wx = eng.carX, wz = eng.carZ;
      const dx = Math.sin(eng.heading), dz = -Math.cos(eng.heading); // three-frame forward
      const lat = { x: -dz, z: dx };
      const lats = [];
      for (let i = 0; i < pos.length; i += 3) {
        // GLB local == graph frame (identity); Babylon chỉ mirror x lúc render
        const vx = pos[i], vz = pos[i + 2];
        const ax = vx - wx, az = vz - wz;
        const along = ax * dx + az * dz;
        const l = ax * lat.x + az * lat.z;
        if (Math.abs(along) < 30 && Math.abs(l) < 60) lats.push(Math.round(l * 100) / 100);
      }
      lats.sort((a, b) => a - b);
      const clusters = [];
      for (const v of lats) {
        if (clusters.length && v - clusters[clusters.length - 1].max < 0.5) {
          clusters[clusters.length - 1].max = v; clusters[clusters.length - 1].n++;
        } else clusters.push({ min: v, max: v, n: 1 });
      }
      markInfo = clusters.filter(c => c.n >= 5);
    }
    return { state: s, markingClusters: markInfo, spawn: eng.spawn, glbRootPos: eng.roadsRoot.position.asArray() };
  });
  console.log('BABYLON SPAWN REPORT:', JSON.stringify(report, null, 1));

  await page.screenshot({ path: path.join(OUT, 'bab_spawn.png') });

  // Lái 10s
  await page.keyboard.down('w');
  await page.waitForTimeout(10000);
  await page.keyboard.up('w');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ state: window.__babylonSim?.getState() }));
  console.log('AFTER DRIVE:', JSON.stringify(after.state));
  await page.screenshot({ path: path.join(OUT, 'bab_drive.png') });

  // Chế độ chase
  await page.keyboard.press('c');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'bab_chase.png') });

  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
