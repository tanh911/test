// Smoke test 6: đề-pa ngang dốc trên sa hình (dốc mới + physics tuột)
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
  await page.waitForTimeout(9000);

  await page.evaluate(() => { window.refs.current.setCurrentMapId('sa_hinh_fahrschule'); });
  await page.waitForTimeout(13000);

  const info = await page.evaluate(() => {
    const r = window.refs.current;
    // bbox của ramp mesh để xác nhận centered
    let bbox = null;
    scene_check: {
      const rampGroup = r.scene?.children?.find(c => c.type === 'Group' && c.children?.some(m => m.geometry?.parameters?.depth === 8));
      if (rampGroup) { const b = new (window.refs.current.scene.children[0].constructor.constructor === Object ? Object : Object)(); }
    }
    return { mapId: r.currentMapId, ramps: r._ramps };
  });
  console.log('[ramps]', JSON.stringify(info));

  // Teleport lên giữa sườn dốc (carZ 12 = distFromStart 5, đang leo) + nhả hết
  const res = await page.evaluate(() => {
    const r = window.refs.current;
    r.carZ = 12; r.carX = 0;
    r.speed = 0; r.handbrake = false; r.isReverse = false; r.isNeutral = false;
    r.throttleInput = 0; r.brakeInput = 0;
    if (r.playerCar) r.playerCar.position.set(0, 0.4, -12);
    return { carZ: r.carZ };
  });
  console.log('[teleport to slope]', JSON.stringify(res));
  await page.waitForTimeout(4000);

  const after = await page.evaluate(() => {
    const r = window.refs.current;
    return { hillRolledBack: !!r.hillRolledBack, rollDistCm: Math.round((r.hillRollbackDist || 0) * 100),
      carZ: Math.round(r.carZ * 10) / 10, y: Math.round((r.playerCar?.position.y || 0) * 100) / 100 };
  });
  console.log('[after 4s]', JSON.stringify(after));

  // Giờ thử đề-pa đúng: giữ ga để leo tiếp — rollback phải dừng
  await page.keyboard.down('w');
  await page.waitForTimeout(4000);
  await page.keyboard.up('w');
  const after2 = await page.evaluate(() => {
    const r = window.refs.current;
    return { carZ: Math.round(r.carZ * 10) / 10, y: Math.round((r.playerCar?.position.y || 0) * 100) / 100, speed: Math.round(r.speed) };
  });
  console.log('[after throttle 4s]', JSON.stringify(after2));
  console.log('pageerrors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ERR:', e));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
