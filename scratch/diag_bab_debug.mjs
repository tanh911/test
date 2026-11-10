// Debug Babylon boot: chụp màn hình mọi bước + log console
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 300)));
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(OUT, 'bab_debug.png') });
  const state = await page.evaluate(() => ({
    hasHandle: !!window.__babylonSim,
    loadingText: document.querySelector('.babylon-sim-root')?.innerText?.slice(0, 300) || 'NO ROOT',
  }));
  console.log('DEBUG STATE:', JSON.stringify(state));
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
