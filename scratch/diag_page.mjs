// Screenshot trang diag_align: spawn + junction
import { chromium } from 'playwright';
import path from 'path';

const OUT = path.join(process.cwd(), 'scratch', 'audit_shots');
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.goto('http://localhost:3000/diag_align.html', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.ROADS_LOADED === true && window.GRAPH_LOADED === true, { timeout: 30000 });
  await page.evaluate(() => window.setSpawnView());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, 'diag_spawn.png') });
  await page.evaluate(() => window.setJunctionView());
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'diag_junction.png') });
  await browser.close();
  console.log('diag screenshots saved');
};
run().catch(e => { console.error(e); process.exit(1); });
