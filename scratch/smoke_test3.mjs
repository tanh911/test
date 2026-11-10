// Smoke test 3: chuyển map qua menu (click card -> click nút start) + test sa hình đề-pa
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 200)));
  const simState = () => page.evaluate(() => {
    const r = window.refs?.current;
    if (!r) return null;
    return { mapId: r.currentMapId, speed: Math.round(r.speed || 0), colliders: (r.worldColliders || []).length,
      bots: r.trafficAIManager ? r.trafficAIManager.botCars?.length : (r.aiCars || []).length,
      idx: r.scenarioIdx, active: r.activeScenario?.id || null, score: r.scoreState?.points,
      hillRolledBack: !!r.hillRolledBack, dist: Math.round(Math.abs(r.distanceTraveled || 0) - (r._scenarioBaseZ || 0)),
      isDriving: !!r.isDriving, carX: Math.round(r.carX || 0), carZ: Math.round(r.carZ || 0) };
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});

  // Vào Sa hình (training ground) qua card -> nút start
  await page.getByText('Fahrschule', { exact: false }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1500);
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) { await startBtn.click(); console.log('clicked start btn'); }
  else { await page.getByText('Fahrschule', { exact: false }).first().dblclick({ force: true }).catch(() => {}); }
  await page.waitForTimeout(14000);
  console.log('[SAHINH load]', JSON.stringify(await simState()));

  // Nổ máy, vào D, ga nhẹ tiến lên dốc (sh_hill triggerZ 5)
  await page.keyboard.press('i');
  await page.waitForTimeout(1200);
  await page.keyboard.down('w');
  await page.waitForTimeout(6000);
  await page.keyboard.up('w');
  console.log('[SAHINH drive 6s]', JSON.stringify(await simState(), null, 1));

  // Đứng trên dốc: nhả hết, không ga -> xe phải tuột (hillRolledBack)
  await page.waitForTimeout(6000);
  console.log('[SAHINH idle-on-ramp]', JSON.stringify(await simState(), null, 1));
  await page.screenshot({ path: 'scratch/audit_shots/smoke3_sahinh.png' }).catch(() => {});
  console.log('pageerrors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ERR:', e));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
