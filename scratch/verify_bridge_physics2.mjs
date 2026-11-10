import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(20000);

  const setAndMeasure = async (wx, wz, startY, label, expect) => {
    await page.evaluate(([x, z, y0]) => {
      const r = window.refs.current;
      r.collisionOccurred = false;
      r._collisionImmunityUntil = Date.now() + 15000;
      r.carX = x; r.carZ = -z;
      r._bridgeY = y0;
      r.speed = 0;
      if (r.playerCar) r.playerCar.position.set(x, y0, z);
    }, [wx, wz, startY]);
    await page.waitForTimeout(1200);
    const y = await page.evaluate(() => Math.round(window.refs.current.playerCar.position.y * 100) / 100);
    const ok = expect[0] <= y && y <= expect[1];
    console.log(`[${label}] y=${y} (expect ${expect[0]}-${expect[1]}) ${ok ? 'PASS ✓' : 'FAIL ✗'}`);
    return ok;
  };

  // Điểm sample cầu (từ graph: Werler bridge densified y=5.5 tại crossing; ramp y=3.1)
  let all = true;
  all &= await setAndMeasure(-2330, -2155, 5.5, 'Trên đỉnh cầu Werler (way thật)', [4.5, 7.0]);
  all &= await setAndMeasure(-2330, -2145, 5.5, 'Plateau cầu (giữa way)', [4.5, 7.0]);
  all &= await setAndMeasure(1200, 139, 0.1, 'A2 đường bằng', [0.0, 1.0]);
  all &= await setAndMeasure(-2330, -2130, 0.02, 'Chân cầu mo dốc (y thấp giữ)', [0.0, 1.5]);
  console.log(all ? '=== TẤT CẢ PASS ===' : '=== CÓ FAIL ===');

  // Bot: đặt 1 bot lên đỉnh cầu → frame sau giữ y cao
  const botY = await page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    const b = mgr.botCars[0];
    b.mesh.position.set(-1760, 0.02, 1490);
    b.corridor._dead = false;
    return Math.round(b.mesh.position.y * 100) / 100;
  });
  await page.waitForTimeout(1200);
  const botY2 = await page.evaluate(() => Math.round(window.refs.current.trafficAIManager.botCars[0].mesh.position.y * 100) / 100);
  console.log(`[BOT trên cầu] y sau 1.2s: ${botY2} (trước: ${botY}) — ${botY2 > 2 ? 'giữ cao ✓' : 'rơi về 0 ✗ (bot bị corridor kéo đi)'}`);
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
