import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (msg) => { const t = msg.text(); if (t.includes('[SCEN')) console.log('[console]', t); });
  page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 200)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const target = page.getByText('Autobahn', { exact: false }).first();
  await target.dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(12000);
  console.log('done waiting');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
