// Diag 9: ẩn/hiện kính GLB + liệt kê mesh trước mặt camera để định danh dải đen chắn đường
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1907, height: 853 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForFunction(() => window.__babylonSim?._corollaReady === true, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Liệt kê mesh GLB che trước mặt camera (trong nửa phía trước, gần)
  const infront = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const camPos = eng.camera.globalPosition;
    const fwd = eng.camera.getDirection(new eng.scene.getEngine().constructor === Object ? { x: 0, y: 0, z: 1 } : { x: 0, y: 0, z: 1 }).asArray();
    return fwd;
  }).catch((e) => 'eval-err: ' + e.message);
  console.log('fwd probe:', infront);

  await page.screenshot({ path: path.join(OUT, 'bab9_all.png') });

  // Ẩn kính + liệt kê tên mesh đã ẩn
  const hidden = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const names = [];
    eng.scene.meshes.forEach((m) => {
      if (!m.name.startsWith('corolla_')) return;
      const mats = Array.isArray(m.material) ? m.material : (m.material ? [m.material] : []);
      if (mats.some((mt) => /klosz|glass|window|material\.004/i.test(mt.name || ''))) {
        m.isVisible = false;
        if (!names.includes(m.name)) names.push(m.name);
      }
    });
    return names;
  });
  console.log('hidden glass meshes:', JSON.stringify(hidden));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'bab9_noglass.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
