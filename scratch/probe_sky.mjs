import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(12000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(13000);

  const info = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const cam = window.refs.current.camera;
    const sky = scene.children.find(c => c.name === 'physicalSky');
    const out = {
      bg: scene.background ? scene.background.getHexString() : null,
      fog: scene.fog ? { color: scene.fog.color.getHexString(), near: scene.fog.near, far: scene.fog.far } : null,
      far: cam.far,
      weather: window.refs.current.weatherMode,
      skyVisible: sky ? sky.visible : null,
      skyScale: sky ? sky.scale.x : null
    };
    if (sky) {
      const u = sky.material.uniforms;
      out.sun = { turbidity: u.turbidity.value, rayleigh: u.rayleigh.value, mie: u.mieCoefficient.value, g: u.mieDirectionalG.value };
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
