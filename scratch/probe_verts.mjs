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
    let glb = null;
    scene.traverse(o => { if (o.name === 'Autobahn_GLB_Model_blender_v2') glb = o; });
    if (!glb) return { err: 'no glb' };
    const dump = {};
    for (const child of glb.children) {
      if (!child.isMesh || !child.geometry?.attributes?.position) continue;
      const pos = child.geometry.attributes.position;
      const vs = [];
      for (let i = 0; i < Math.min(3, pos.count); i++) {
        vs.push([Math.round(pos.getX(i)), Math.round(pos.getY(i)), Math.round(pos.getZ(i))]);
      }
      dump[child.name] = vs;
    }
    return dump;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
