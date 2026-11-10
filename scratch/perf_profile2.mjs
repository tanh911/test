// CPU profile v2: STADT, không lọc node_modules, sampling 100µs
import { chromium } from 'playwright';
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
  await client.send('Profiler.setSamplingInterval', { interval: 100 });
  await client.send('Profiler.start');
  await page.keyboard.down('w');
  await page.waitForTimeout(10000);
  await page.keyboard.up('w');
  const { profile } = await client.send('Profiler.stop');

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
    let url = cf.url || '(native)';
    if (url.includes('/')) url = url.split('/').slice(-2).join('/');
    const key = `${cf.functionName || '(anon)'} @ ${url}:${cf.lineNumber + 1}`;
    agg.set(key, (agg.get(key) || 0) + hits);
  }
  const total = profile.samples.length;
  console.log(`total samples: ${total} (~${(total * 0.1 / 1000).toFixed(1)}s sampled)`);
  [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([k, h]) =>
    console.log(`${String(h).padStart(6)}  ${(100 * h / total).toFixed(1)}%  ${k}`));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
