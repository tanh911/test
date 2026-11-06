// Diag 2: xác định mesh nào tạo khối vàng + hộp đen quanh spawn; kiểm tra alignment vạch kẻ
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForTimeout(1000);

  const report = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const scene = eng.scene;
    const near = [];
    for (const m of scene.meshes) {
      if (!m.isEnabled()) continue;
      let bb;
      try { bb = m.getBoundingInfo().boundingBox; } catch { continue; }
      const c = bb.centerWorld, mn = bb.minimumWorld, mx = bb.maximumWorld;
      const dx = c.x - eng.carRoot.position.x, dz = c.z - eng.carRoot.position.z;
      const d = Math.hypot(dx, dz);
      const size = { x: +(mx.x - mn.x).toFixed(1), y: +(mx.y - mn.y).toFixed(1), z: +(mx.z - mn.z).toFixed(1) };
      if (d < 60 || size.x > 40 || size.z > 40) {
        near.push({
          name: m.name, cls: m.getClassName(), d: Math.round(d),
          center: [Math.round(c.x), Math.round(c.y), Math.round(c.z)],
          size, parent: m.parent?.name || null
        });
      }
    }
    // màu material các mesh lạ
    const matInfo = {};
    for (const m of scene.meshes) {
      if (m.material && m.material.diffuseColor) {
        const key = m.material.name;
        if (!matInfo[key]) matInfo[key] = m.material.diffuseColor.toHexString();
      }
    }
    // top-down camera chụp vùng spawn
    eng.camera.parent = null;
    eng.camera.position = new (Object.getPrototypeOf(eng.camera.position).constructor)(eng.carRoot.position.x, 45, eng.carRoot.position.z + 0.001);
    eng.camera.setTarget(eng.carRoot.position.clone());
    return { carPos: eng.carRoot.position.asArray(), near, matInfo, spawn: eng.spawn };
  });
  console.log('OBJECT REPORT:', JSON.stringify(report, null, 1));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'bab_topdown_spawn.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
