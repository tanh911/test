import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(20000);
  // Camera đặt sát toà nhà bld_306538547 (-843,1013) h=9
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -790, y: 6, z: 1080, tx: -843, ty: 4, tz: 1013 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/bld_close.png' });
  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    let walls = null;
    scene.traverse(o => { if (o.isMesh && o.name === 'PBF_BuildingWalls' && o.geometry?.attributes?.position) {
      const pos = o.geometry.attributes.position;
      const bb = { verts: pos.count, minY: Infinity, maxY: -Infinity };
      for (let i = 0; i < Math.min(pos.count, 5000); i++) {
        const y = pos.getY(i); if (y < bb.minY) bb.minY = y; if (y > bb.maxY) bb.maxY = y;
      }
      // Sample 1 vertex đầu
      bb.firstVert = [Math.round(pos.getX(0)), Math.round(pos.getY(0)), Math.round(pos.getZ(0))];
      walls = bb;
    } });
    return walls;
  });
  console.log('walls mesh:', JSON.stringify(info));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
