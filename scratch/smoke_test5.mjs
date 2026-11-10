// Smoke test 5: physics tuột dốc trực tiếp - teleport xe lên dốc sa hình
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 200)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);

  // Chuyển sang sa hình qua setCurrentMapId (exposed)
  await page.evaluate(() => { window.refs.current.setCurrentMapId('sa_hinh_fahrschule'); });
  await page.waitForTimeout(14000);

  const info = await page.evaluate(() => {
    const r = window.refs.current;
    return { mapId: r.currentMapId, ramps: (r._ramps || []).map(x => ({ cx: x.centerX, cz: x.centerZ, w: x.width, l: x.length, h: x.maxHeight })) };
  });
  console.log('[ramps]', JSON.stringify(info));

  // Teleport lên giữa đoạn dốc lên + nhả phanh tay, đứng yên không ga
  const res = await page.evaluate(() => {
    const r = window.refs.current;
    const ramp = (r._ramps || [])[0];
    if (!ramp) return { err: 'no ramp' };
    const upL = ramp.length / 3;
    // rz = carZ + centerZ; distFromStart = rz + halfL; muốn distFromStart = upL/2
    r.carZ = -ramp.centerZ - ramp.length / 2 + upL / 2;
    r.carX = ramp.centerX;
    r.speed = 0;
    r.handbrake = false;
    r.isReverse = false;
    r.isNeutral = false;
    r.isEngineRunning = false;
    r.scenarioIdx = 0;
    if (r.playerCar) r.playerCar.position.set(r.carX, 0, -r.carZ);
    return { teleportedTo: Math.round(r.carZ) };
  });
  console.log('[teleport]', JSON.stringify(res));
  await page.waitForTimeout(4000);

  const after = await page.evaluate(() => {
    const r = window.refs.current;
    return {
      hillRolledBack: !!r.hillRolledBack,
      rollDistCm: Math.round((r.hillRollbackDist || 0) * 100),
      carZ: Math.round(r.carZ), speed: Math.round(r.speed * 10) / 10
    };
  });
  console.log('[after 4s idle on slope]', JSON.stringify(after, null, 1));
  console.log('pageerrors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ERR:', e));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
