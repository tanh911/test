import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  // Map mặc định = Berlin — bấm Bắt đầu
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(15000);
  await page.keyboard.press('b');
  await page.keyboard.press('i');
  await page.waitForTimeout(1000);
  await page.keyboard.press('d');
  await page.keyboard.down('w');
  await page.waitForTimeout(25000);
  await page.keyboard.up('w');
  const st = await page.evaluate(() => {
    const r = window.refs.current;
    let lights = 0;
    r.scene.traverse(o => { if (o.isGroup && (o.name === 'trafficLightGroup' || o._redLight)) lights++; });
    return { map: r.currentMapId, spd: Math.round(r.speed), bots: r.trafficAIManager?.botCars?.length,
      examiner: !!r._trafficLightController, lights, score: r.scoreState?.points,
      active: r.activeScenario?.id || null, zone: r._lastZoneId?.nameVi?.slice(0, 30) || '' };
  });
  console.log('[BERLIN]', JSON.stringify(st));
  console.log('pageerrors:', errors.length);
  await page.screenshot({ path: 'scratch/audit_shots/e2e_berlin.png' });
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
