import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  // Double-click card Autobahn (free-drive đúng luồng handleStartFreeDrive)
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(16000);

  const st = await page.evaluate(() => {
    const r = window.refs.current;
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ),
      scenarios: (r.currentScenarios || []).map(s => s.id), odo: Math.round(r._odoDist || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null, bots: r.trafficAIManager?.botCars?.length };
  });
  console.log('[SPAWN]', JSON.stringify(st));

  await page.keyboard.press('i');
  await page.waitForTimeout(900);
  await page.keyboard.down('w');
  await page.waitForTimeout(16000);
  await page.keyboard.up('w');
  const st2 = await page.evaluate(() => {
    const r = window.refs.current;
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), odo: Math.round(r._odoDist || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null, score: r.scoreState?.points,
      events: (r.scoreState?.events||[]).map(e => e.msg?.slice(0,60)) };
  });
  console.log('[CITY 16s]', JSON.stringify(st2, null, 1));

  // Nhảy tới vùng Auffahrt rồi lái tiếp (test ab_enter + merge)
  await page.evaluate(() => { window.refs.current._odoDist = 470; });
  await page.keyboard.down('w');
  await page.waitForTimeout(12000);
  await page.keyboard.up('w');
  const st3 = await page.evaluate(() => {
    const r = window.refs.current;
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), odo: Math.round(r._odoDist || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null, score: r.scoreState?.points,
      events: (r.scoreState?.events||[]).slice(-3).map(e => e.msg?.slice(0,60)) };
  });
  console.log('[AUFFAHRT+]', JSON.stringify(st3, null, 1));
  await page.screenshot({ path: 'scratch/audit_shots/loop_drive.png' }).catch(() => {});
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
