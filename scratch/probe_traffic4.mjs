import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { const t = m.text(); if (t.includes('[Autobahn]')) console.log('[console]', t.slice(0, 130)); });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(18000);
  await page.waitForTimeout(15000);
  const s = await page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    const bots = mgr.botCars.map(b => ({
      cid: b.corridor.id?.slice(0, 18), tlen: Math.round(b.corridor.totalLength || 0),
      pos: [Math.round(b.mesh.position.x), Math.round(b.mesh.position.z)],
      spd: Math.round(b.speed * 3.6), tgt: Math.round(b.targetSpeed * 3.6),
      reason: b.stopReason || '', dead: !!b.corridor._dead
    }));
    const reasons = {};
    bots.forEach(b => { const k = b.reason || (b.spd < 1 ? 'STUCK-NO-REASON' : 'moving'); reasons[k] = (reasons[k] || 0) + 1; });
    const pairs = [];
    for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
      const d = Math.hypot(bots[i].pos[0] - bots[j].pos[0], bots[i].pos[1] - bots[j].pos[1]);
      if (d < 8) pairs.push({ d: Math.round(d * 10) / 10, a: bots[i].cid, b: bots[j].cid, sa: bots[i].spd, sb: bots[j].spd });
    }
    return { n: bots.length, reasons, closePairs: pairs.slice(0, 12),
      lens: [...new Set(bots.map(b => b.tlen))].sort((a, b) => a - b).slice(0, 14) };
  });
  console.log(JSON.stringify(s, null, 1).slice(0, 2200));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
