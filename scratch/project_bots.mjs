// Project bot positions onto camera screen space to verify visibility
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(16000);
  await page.keyboard.press('b');
  await page.keyboard.down('w');
  await page.waitForTimeout(6000);

  const info = await page.evaluate(() => {
    const r = window.refs.current;
    const cam = r.camera;
    const camDir = cam.getWorldDirection(cam.position.clone());
    const out = {
      camPos: [Math.round(cam.position.x), Math.round(cam.position.y), Math.round(cam.position.z)],
      camDir: [camDir.x.toFixed(2), camDir.y.toFixed(2), camDir.z.toFixed(2)],
      heading: +(r.heading || 0).toFixed(2),
      camFar: cam.far,
      fog: r.renderer ? 'n/a' : 'n/a',
      bots: [],
    };
    for (const c of r.trafficAIManager.botCars) {
      const dx = c.mesh.position.x - cam.position.x;
      const dz = c.mesh.position.z - cam.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 260) continue;
      const v = c.mesh.position.clone();
      v.y = 0.8;
      v.project(cam);
      out.bots.push({
        dist: Math.round(dist),
        ndc: [v.x.toFixed(2), v.y.toFixed(2), v.z.toFixed(2)],
        onScreen: v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1 && v.z < 1,
        corridor: c.corridor.id,
        speed: Math.round(c.speed * 3.6),
        model: !!c.mesh.getObjectByName('realBotCarModel'),
      });
    }
    out.bots.sort((a, b) => a.dist - b.dist);
    return out;
  });
  console.log(JSON.stringify(info, null, 1));
  await page.keyboard.up('w');
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
