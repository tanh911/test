// Probe chi tiết: tại sao 2 scenario fail ngay khi load autobahn
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 200)));

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Snapshot trạng thái mặc định (map khởi tạo ban đầu, chưa chọn gì)
  const probe = () => page.evaluate(() => {
    const r = window.refs?.current;
    if (!r) return null;
    return {
      mapId: r.currentMapId,
      baseZ: r._scenarioBaseZ,
      distTrav: Math.round(r.distanceTraveled || 0),
      carZ: Math.round(r.carZ || 0),
      idx: r.scenarioIdx,
      active: r.activeScenario?.id || null,
      scenarios: (r.currentScenarios || []).map(s => s.id).slice(0, 6),
      score: r.scoreState?.points,
      events: (r.scoreState?.events || []).map(e => e.msg?.slice(0, 80)),
      isDriving: !!r.isDriving
    };
  });

  console.log('[BEFORE]', JSON.stringify(await probe(), null, 1));

  // Vào autobahn
  const target = page.getByText('Autobahn', { exact: false }).first();
  await target.dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(4000);
  console.log('[AFTER 4s]', JSON.stringify(await probe(), null, 1));
  await page.waitForTimeout(6000);
  console.log('[AFTER 10s]', JSON.stringify(await probe(), null, 1));

  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
