// CPU profile STADT qua CDP Profiler
import { chromium } from 'playwright';
import fs from 'fs';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const client = await page.context().newCDPSession(page);
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(9000);

  await page.keyboard.press('i');
  await page.waitForTimeout(1000);

  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 500 });
  await client.send('Profiler.start');
  await page.keyboard.down('w');
  await page.waitForTimeout(12000);
  await page.keyboard.up('w');
  const { profile } = await client.send('Profiler.stop');

  // Tính self-time theo node
  const nodesById = new Map(profile.nodes.map(n => [n.id, n]));
  const selfHits = new Map();
  for (const n of profile.nodes) selfHits.set(n.id, 0);
  for (const s of profile.samples || []) selfHits.set(s, (selfHits.get(s) || 0) + 1);

  const agg = new Map();
  for (const [id, hits] of selfHits) {
    if (!hits) continue;
    const node = nodesById.get(id);
    if (!node) continue;
    const cf = node.callFrame;
    if (!cf.url || !cf.url.includes('src/')) continue; // chỉ code của app
    const key = `${cf.functionName || '(anon)'} @ ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`;
    agg.set(key, (agg.get(key) || 0) + hits);
  }
  const total = profile.samples ? profile.samples.length : 1;
  const rows = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log(`total samples: ${total}`);
  rows.forEach(([k, h]) => console.log(`${String(h).padStart(5)}  ${(100 * h / total).toFixed(1)}%  ${k}`));

  fs.writeFileSync('scratch/cdp_profile.json', JSON.stringify(profile));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
