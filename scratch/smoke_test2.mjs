// Smoke test 2: lái thật trên autobahn + chuyển map qua menu
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 200)));

  const simState = () => page.evaluate(() => {
    const r = window.refs?.current;
    if (!r) return null;
    return {
      mapId: r.currentMapId, speed: Math.round(r.speed || 0),
      collisionOff: !!r.current??!!r._disableCollisionCheck, colliders: (r.worldColliders || []).length,
      bots: r.trafficAIManager ? r.trafficAIManager.botCars?.length : (r.aiCars || []).length,
      idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      score: r.scoreState?.points,
      events: (r.scoreState?.events || []).map(e => `${e.passed ? 'PASS' : 'FAIL'}: ${e.msg?.slice(0, 60)}`),
      dist: Math.round(Math.abs(r.distanceTraveled || 0) - (r._scenarioBaseZ || 0)),
      isDriving: !!r.isDriving
    };
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});

  // Vào Autobahn free-drive
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(14000);
  console.log('[AB load]', JSON.stringify(await simState()));

  // Nổ máy + vào D + ga 25s (đủ đi 350m+ cho ab_enter/ab_cruise)
  await page.keyboard.press('i');
  await page.waitForTimeout(1500);
  await page.keyboard.down('w');
  await page.waitForTimeout(25000);
  await page.keyboard.up('w');
  console.log('[AB drive 25s]', JSON.stringify(await simState(), null, 1));

  // Về menu qua nút exit, chọn Land
  await page.locator('.sim-header-btn-exit').first().click().catch(async () => {
    await page.locator('button:has-text("Menu")').first().click();
  });
  await page.waitForTimeout(3000);
  await page.getByText('Đường Tỉnh', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(14000);
  console.log('[LAND load]', JSON.stringify(await simState()));

  await page.keyboard.press('i');
  await page.waitForTimeout(1200);
  await page.keyboard.down('w');
  await page.waitForTimeout(15000);
  await page.keyboard.up('w');
  console.log('[LAND drive 15s]', JSON.stringify(await simState(), null, 1));

  await page.screenshot({ path: 'scratch/audit_shots/smoke2_final.png' }).catch(() => {});
  console.log('pageerrors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ERR:', e));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
