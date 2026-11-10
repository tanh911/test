// Diag 3: xác minh fix bot spawn + AI car-following + va chạm + speed limit + upcoming rules
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForTimeout(1200);

  const snap = () => page.evaluate(() => {
    const eng = window.__babylonSim;
    const st = eng.getState();
    // khoảng cách bot gần nhất tới xe
    let minD = Infinity, nearest = null;
    for (const bot of eng._bots) {
      const d = Math.hypot(bot.root.position.x - eng.carRoot.position.x, bot.root.position.z - eng.carRoot.position.z);
      if (d < minD) { minD = d; nearest = bot; }
    }
    return {
      speed: st.speedKmh, limit: st.speedLimit, limitInfo: st.speedLimitInfo?.vi || null,
      upcoming: st.upcoming, collision: st.collision,
      nearestBotDist: Math.round(minD * 10) / 10,
      nearestBotSpeedKmh: nearest ? Math.round((nearest.curSpeed || nearest.speed) * 3.6) : null,
      carPos: [Math.round(eng.carX), Math.round(eng.carZ)]
    };
  });

  console.log('AT_SPAWN:', JSON.stringify(await snap(), null, 1));
  await page.screenshot({ path: path.join(OUT, 'bab3_spawn.png') });

  // Lái 12s — bot cùng làn phía trước phải bị xe ta đuổi kịp/giảm tốc
  await page.keyboard.down('w');
  await page.waitForTimeout(12000);
  console.log('AFTER_DRIVE_12S:', JSON.stringify(await snap(), null, 1));

  // Tiếp tục lái 15s nữa — tìm va chạm khi đuổi kịp bot
  await page.waitForTimeout(15000);
  console.log('AFTER_DRIVE_27S:', JSON.stringify(await snap(), null, 1));
  await page.keyboard.up('w');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'bab3_drive.png') });

  // Chase camera
  await page.keyboard.press('c');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'bab3_chase.png') });

  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
