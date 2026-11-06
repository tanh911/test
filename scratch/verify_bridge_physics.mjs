// Verify physics cầu: teleport xe lên cầu Werler → y≈5.5; xuống A2 dưới cầu → y≈0.1; bot trên cầu
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(20000);

  // Điểm giữa cầu Werler (way bridge): tìm từ graph qua window? dùng toạ độ crossing Werler×A2 ≈ (-1760,1490)
  // Car trên cầu: carZ = -worldZ
  const test = async (wx, wz, label) => {
    await page.evaluate(([x, z]) => {
      const r = window.refs.current;
      r.collisionOccurred = false;
      r._collisionImmunityUntil = Date.now() + 20000;
      r.carX = x; r.carZ = -z;
      r._bridgeY = undefined; // reset để sample lại từ đầu
      if (r.playerCar) r.playerCar.position.set(x, 0, z);
      r.speed = 0;
      if (r.trafficAIManager) r.trafficAIManager.botCars.forEach(b => { b.mesh.position.x += 1500; });
    }, [wx, wz]);
    await page.waitForTimeout(1500);
    const y = await page.evaluate(() => Math.round(window.refs.current.playerCar.position.y * 100) / 100);
    console.log(`[${label}] car y = ${y}m`);
    return y;
  };

  const yBridge = await test(-1760, 1490, 'TRÊN cầu Werler (expect ~5.5)');
  const yGround = await test(1200, 139, 'A2 đường bằng (expect ~0.1)');
  const yBridge2 = await test(-1755, 1480, 'TRÊN cầu Werler lần 2');
  console.log('=> bridge physics:', yBridge > 3 && yBridge2 > 3 ? 'PASS ✓' : 'FAIL ✗', '| ground:', yGround < 1 ? 'PASS ✓' : 'FAIL ✗');

  // Bot trên cầu: đếm bot có mesh.y > 2 ở vùng cầu Werler
  const bots = await page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    let elevated = 0, near = 0;
    for (const b of mgr.botCars) {
      const d = Math.hypot(b.mesh.position.x + 1760, b.mesh.position.z - 1490);
      if (d < 120) { near++; if (b.mesh.position.y > 2) elevated++; }
    }
    return { near, elevated };
  });
  console.log('[BOTS gần cầu]', JSON.stringify(bots));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
