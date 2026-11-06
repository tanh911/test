import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('traffic lights') || t.includes('Spawned')) console.log('[console]', t.slice(0, 120)); });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(20000);
  const st = await page.evaluate(() => {
    const r = window.refs.current;
    let lights = 0;
    r.scene.traverse(o => { if (o.isGroup && o.name === 'trafficLightGroup') lights++; });
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), lights,
      bots: r.trafficAIManager?.botCars?.length, odo: Math.round(r._odoDist || 0),
      active: r.activeScenario?.id || null };
  });
  console.log('[SPAWN]', JSON.stringify(st));
  // Lái qua thị trấn 25s
  await page.keyboard.press('i');
  await page.waitForTimeout(900);
  await page.keyboard.down('w');
  await page.waitForTimeout(25000);
  await page.keyboard.up('w');
  const st2 = await page.evaluate(() => {
    const r = window.refs.current;
    return { carX: Math.round(r.carX), carZ: Math.round(r.carZ), odo: Math.round(r._odoDist || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      events: (r.scoreState?.events || []).map(e => e.msg?.slice(0, 55)) };
  });
  console.log('[TOWN DRIVE 25s]', JSON.stringify(st2, null, 1));
  // Screenshot nhìn ngang qua thị trấn (nhà + đèn)
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: r.carX - 30, y: 11, z: r.carZ - 25, tx: r.carX + 25, ty: 3, tz: r.carZ + 35 };
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scratch/audit_shots/v2_town.png' });
  console.log('saved v2_town.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
