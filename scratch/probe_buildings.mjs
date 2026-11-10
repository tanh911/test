import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(11000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(18000);
  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const names = ['PBF_BuildingWalls', 'PBF_BuildingRoofs', 'PBF_ParksAndGreenery', 'PBF_WaterwaysSurface', 'PBF_RailwayTrackbed', 'PBF_RoadSurface'];
    const out = {};
    scene.traverse(o => {
      if (o.isMesh && names.includes(o.name) && o.geometry?.attributes?.position) {
        out[o.name] = { verts: o.geometry.attributes.position.count, visible: o.visible };
      }
    });
    return out;
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
