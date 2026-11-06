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
  const res = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    let roadMesh = null;
    scene.traverse(o => { if (o.isMesh && o.name === 'PBF_RoadSurface') roadMesh = o; });
    if (!roadMesh) return { err: 'no road mesh' };
    const pos = roadMesh.geometry.attributes.position;
    // Điểm giao Werler × A2 ≈ (-1760,1490) và Caldenhofer × A2 ≈ (2150,-500)
    const spots = [
      { name: 'Werler crossing', x: -1760, z: 1490 },
      { name: 'Caldenhofer crossing', x: 2150, z: -500 },
      { name: 'A2 control point (flat)', x: 1200, z: 139 }
    ];
    const out = {};
    for (const sp of spots) {
      let near = 0, elevated = 0, maxY = 0;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        const d = Math.hypot(vx - sp.x, vz - sp.z);
        if (d < 60) {
          near++;
          if (vy > 2) elevated++;
          if (vy > maxY) maxY = vy;
        }
      }
      out[sp.name] = { vertsNear: near, elevatedVerts: elevated, maxY: Math.round(maxY * 10) / 10 };
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
