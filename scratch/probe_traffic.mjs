// Probe AI traffic: chồng lấn, kẹt đứng, tốc độ bất thường trên map autobahn mới
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(16000);

  const sample = () => page.evaluate(() => {
    const mgr = window.refs.current.trafficAIManager;
    if (!mgr) return null;
    const bots = mgr.botCars.map(b => ({
      x: +b.mesh.position.x.toFixed(0), z: +b.mesh.position.z.toFixed(0),
      spd: Math.round(b.speed * 3.6), tgt: Math.round(b.targetSpeed * 3.6),
      cid: b.corridor.id?.slice(0, 14) || '?',
      brake: b.isBraking ? 1 : 0, reason: b.stopReason || ''
    }));
    // pairwise min distance
    let minPair = Infinity, overlapPairs = 0;
    for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
      const d = Math.hypot(bots[i].x - bots[j].x, bots[i].z - bots[j].z);
      if (d < minPair) minPair = d;
      if (d < 4.5) overlapPairs++;
    }
    const player = { x: window.refs.current.carX, z: -window.refs.current.carZ };
    const nearPlayer = bots.map(b => Math.hypot(b.x - player.x, b.z - player.z)).sort((a, b) => a - b)[0];
    return { n: bots.length, minPair: minPair === Infinity ? null : Math.round(minPair), overlapPairs, nearPlayer: Math.round(nearPlayer),
      stuck: bots.filter(b => b.spd < 1).length, sample: bots.slice(0, 8) };
  });

  for (const t of [2, 8, 16, 24]) {
    await page.waitForTimeout(t === 2 ? 2000 : 6000);
    console.log(`[t=${t}s]`, JSON.stringify(await sample(), null, 1).slice(0, 900));
  }
  // Camera nhìn phố quanh spawn cho ảnh bot
  await page.evaluate(() => {
    window.refs.current._customCam = { x: -1823, y: 14, z: 820, tx: -1800, ty: 1, tz: 1050 };
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scratch/audit_shots/traffic_city.png' });
  console.log('saved traffic_city.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
