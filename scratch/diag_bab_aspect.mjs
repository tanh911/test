// Diag 8: reproduce viewport người dùng 1907x853 — kiểm tra framing cockpit theo aspect
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const W = parseInt(process.argv[2] || '1907', 10);
const H = parseInt(process.argv[3] || '853', 10);

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  await page.waitForFunction(() => window.__babylonSim?._corollaReady === true, { timeout: 30000 }).catch(() => console.log('corolla not ready'));
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const eng = window.__babylonSim;
    return {
      viewport: [eng.engine.getRenderWidth(), eng.engine.getRenderHeight()],
      camPos: eng.camera.position.asArray().map(v => +v.toFixed(2)),
      fov: eng.camera.fov, fovMode: eng.camera.fovMode, // 0 = VERTICAL_FIXED
      swAbs: eng._glbSteerWheel ? eng._glbSteerWheel.absolutePosition.asArray().map(v => +v.toFixed(2)) : null,
      carWorld: eng.carRoot.absolutePosition.asArray().map(v => +v.toFixed(2)),
    };
  });
  console.log(`INFO@${W}x${H}:`, JSON.stringify(info));
  await page.screenshot({ path: path.join(OUT, `bab8_${W}x${H}.png`) });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
