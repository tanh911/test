// Diag 7: test Corolla GLB — nội thất, vô-lăng GLB quay, màn hình táp-lô, chase view
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('Corolla')) console.log('[warn]', m.text().slice(0, 150)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  // chờ GLB Corolla
  try {
    await page.waitForFunction(() => window.__babylonSim?._corollaReady === true, { timeout: 30000 });
    console.log('COROLLA: loaded ✓');
  } catch {
    console.log('COROLLA: NOT READY (fallback procedural)');
  }
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const sw = eng._glbSteerWheel;
    return {
      steerWheel: sw ? { pos: sw.getAbsolutePosition().asArray().map(v => Math.round(v)), rot: sw.rotationQuaternion?.asArray().map(v => +v.toFixed(2)) } : null,
      camPos: eng.camera.position.asArray().map(v => Math.round(v * 10) / 10),
      camParent: eng.camera.parent?.name,
      clusterTex: !!eng._clusterTex, navTex: !!eng._navTex,
    };
  });
  console.log('INFO:', JSON.stringify(info));
  await page.screenshot({ path: path.join(OUT, 'bab7_cockpit.png') });

  // Giữ A 1.2s → vô-lăng GLB phải quay trái
  await page.keyboard.down('a');
  await page.waitForTimeout(1200);
  const swLeft = await page.evaluate(() => window.__babylonSim._glbSteerWheel?.rotationQuaternion?.asArray().map(v => +v.toFixed(3)));
  console.log('wheel after A:', JSON.stringify(swLeft));
  await page.screenshot({ path: path.join(OUT, 'bab7_steer_left.png') });
  await page.keyboard.up('a');
  await page.waitForTimeout(1500);

  // Lái 6s rồi chase
  await page.keyboard.down('w');
  await page.waitForTimeout(6000);
  await page.keyboard.up('w');
  await page.keyboard.press('c');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'bab7_chase.png') });
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
