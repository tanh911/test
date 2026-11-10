// Verify vòng Autobahn: spawn phố → scenario theo odometer → elevation phố đúng mặt đất
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(12000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(15000);

  const st = await page.evaluate(() => {
    const r = window.refs.current;
    return {
      carX: Math.round(r.carX), carZ: Math.round(r.carZ),
      carWorldZ: Math.round(r.playerCar?.position.z || 0),
      mapId: r.currentMapId,
      scenarios: (r.currentScenarios || []).map(s => s.id),
      odo: Math.round(r._odoDist || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      bots: r.trafficAIManager?.botCars?.length,
      limit: window.refs.current._lastAuthoritativeSpeed
    };
  });
  console.log('[SPAWN]', JSON.stringify(st));

  // Lái 15s trong phố (scenario ab_city_50 phải kích hoạt)
  await page.keyboard.press('i');
  await page.waitForTimeout(900);
  await page.keyboard.down('w');
  await page.waitForTimeout(15000);
  await page.keyboard.up('w');
  const st2 = await page.evaluate(() => {
    const r = window.refs.current;
    return { odo: Math.round(r._odoDist || 0), idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      score: r.scoreState?.points, events: (r.scoreState?.events||[]).map(e => e.msg?.slice(0,60)) };
  });
  console.log('[CITY DRIVE 15s]', JSON.stringify(st2, null, 1));

  // Nhảy odometer tới vùng Auffahrt → lái tiếp (ab_enter)
  await page.evaluate(() => { window.refs.current._odoDist = 500; });
  await page.keyboard.down('w');
  await page.waitForTimeout(9000);
  await page.keyboard.up('w');
  const st3 = await page.evaluate(() => {
    const r = window.refs.current;
    return { odo: Math.round(r._odoDist || 0), idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      score: r.scoreState?.points, events: (r.scoreState?.events||[]).map(e => e.msg?.slice(0,55)) };
  });
  console.log('[RAMP DRIVE]', JSON.stringify(st3, null, 1));

  // Chụp: góc nhìn camera nhìn dọc Werler Straße + vùng crossing bridge
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -1795, y: 8, z: 1000, tx: -1775, ty: 3, tz: 1450 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/loop_city_view.png' });
  console.log('saved loop_city_view.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
