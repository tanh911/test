import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  page.on('console', (m) => { const t = m.text(); if (t.includes('[Autobahn]') || t.includes('[Traffic') || t.includes('Error')) console.log('[console]', t.slice(0, 160)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(16000);
  const s = await page.evaluate(() => {
    const mgr = window.refs.current?.trafficAIManager;
    if (!mgr || !mgr.botCars) return { err: 'no manager/botCars', hasMgr: !!mgr };
    const bots = mgr.botCars.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, spd: b.speed * 3.6 }));
    let minPair = Infinity, overlap = 0;
    for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
      const d = Math.hypot(bots[i].x - bots[j].x, bots[i].z - bots[j].z);
      if (d < minPair) minPair = d;
      if (d < 4.5) overlap++;
    }
    const p = { x: window.refs.current.carX, z: -window.refs.current.carZ };
    return { n: bots.length, minPair: Math.round(minPair), overlapPairs: overlap,
      stuck: bots.filter(b => b.spd < 1).length,
      nearest: Math.round(Math.min(...bots.map(b => Math.hypot(b.x - p.x, b.z - p.z)))) };
  });
  console.log(JSON.stringify(s));
  await page.waitForTimeout(14000);
  const s2 = await page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    const bots = mgr.botCars.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z, spd: b.speed * 3.6 }));
    let minPair = Infinity, overlap = 0;
    for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
      const d = Math.hypot(bots[i].x - bots[j].x, bots[i].z - bots[j].z);
      if (d < minPair) minPair = d;
      if (d < 4.5) overlap++;
    }
    return { minPair: Math.round(minPair), overlapPairs: overlap, stuck: bots.filter(b => b.spd < 1).length };
  });
  console.log('after 14s more:', JSON.stringify(s2));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
