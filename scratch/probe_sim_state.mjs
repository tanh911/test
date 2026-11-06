// Probe live sim state: bot cars, positions, sky, renderer
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  page.on('console', (m) => {
    const t = m.text();
    if (/Autobahn|BerlinMitte|error/i.test(t)) console.log('[console]', t.slice(0, 220));
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(20000); // let world + GLBs load

  const info = await page.evaluate(() => {
    const refs = window.refs;
    const out = {};
    if (!refs?.current) return { error: 'no refs' };
    const mgr = refs.current.trafficAIManager;
    out.hasTrafficManager = !!mgr;
    if (mgr) {
      out.botCount = mgr.botCars.length;
      out.botSamples = mgr.botCars.slice(0, 8).map((c) => ({
        pos: [Math.round(c.mesh.position.x), Math.round(c.mesh.position.z)],
        corridor: c.corridor?.id,
        speed: Math.round(c.speed * 3.6),
        distToPlayer: Math.round(Math.hypot(
          c.mesh.position.x - refs.current.carX,
          c.mesh.position.z - (refs.current.carZ || 0)
        )),
        hasRealModel: !!c.mesh.getObjectByName('realBotCarModel'),
      }));
      out.lightState = mgr.globalTrafficLightState;
    }
    out.player = { x: refs.current.carX, z: refs.current.carZ };
    out.aiCarsLegacy = (refs.current.aiCars || []).length;
    return out;
  });
  console.log(JSON.stringify(info, null, 2));

  // wait then re-probe to see if bots move
  await page.waitForTimeout(5000);
  const info2 = await page.evaluate(() => {
    const mgr = window.refs?.current?.trafficAIManager;
    if (!mgr) return { moved: 'no manager' };
    return mgr.botCars.slice(0, 8).map((c) => ({
      pos: [Math.round(c.mesh.position.x), Math.round(c.mesh.position.z)],
      speed: Math.round(c.speed * 3.6),
      stop: c.stopReason,
    }));
  });
  console.log('AFTER 5s:', JSON.stringify(info2));

  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
