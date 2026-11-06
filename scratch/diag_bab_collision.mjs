// Diag 4: test va chạm — lái 40s liên tục, sample mỗi 5s
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForTimeout(1000);

  const snap = () => page.evaluate(() => {
    const eng = window.__babylonSim;
    const st = eng.getState();
    let minD = Infinity;
    for (const bot of eng._bots) {
      const d = Math.hypot(bot.root.position.x - eng.carRoot.position.x, bot.root.position.z - eng.carRoot.position.z);
      if (d < minD) minD = d;
    }
    return { speed: st.speedKmh, collision: st.collision, nearest: Math.round(minD), trip: +(st.distanceTraveled / 1000).toFixed(2) };
  });

  await page.keyboard.down('w');
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(5000);
    console.log(`t=${(i + 1) * 5}s:`, JSON.stringify(await snap()));
  }
  await page.keyboard.up('w');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'bab4_after_collision.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
