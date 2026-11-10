import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(16000);
  await page.waitForTimeout(15000);
  const s = await page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    const corridorCounts = new Map();
    let dead = 0, banned = 0, noLane = 0;
    for (const b of mgr.botCars) {
      corridorCounts.set(b.corridor.id, (corridorCounts.get(b.corridor.id) || 0) + 1);
      if (b.corridor._dead) dead++;
      if (b.corridor._laneCacheBanned) banned++;
      if (!b.corridor._cachedLane) noLane++;
    }
    const chosen = mgr.botCars.length ? mgr.botCars[0] : null;
    return {
      distribution: [...corridorCounts.entries()].map(([id, n]) => `${id.slice(0, 16)}: ${n}`).sort((a, b) => parseInt(b.split(': ')[1]) - parseInt(a.split(': ')[1])).slice(0, 8),
      dead, banned, noLane,
      totalCorridors: new Set(mgr.botCars.map(b => b.corridor.id)).size
    };
  });
  console.log(JSON.stringify(s, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
