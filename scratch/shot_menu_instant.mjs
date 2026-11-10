import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  const t0 = Date.now();
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Đo thời gian menu hiển thị (DOM ready → menu visible)
  await page.waitForSelector('text=BẮT ĐẦU HÀNH TRÌNH', { timeout: 30000 });
  const menuTime = Date.now() - t0;
  console.log(`[MENU TIME] ${menuTime}ms (trước đây init block → menu chờ vài giây)`);
  // Kiểm tra: KHÔNG có WebGL context nào được tạo trước khi bấm start
  const hasCanvas = await page.evaluate(() => {
    return !!document.querySelector('canvas');
  });
  console.log('[Canvas before start]', hasCanvas, '(nên là false — three.js chưa init)');
  // Bấm start → loading → map
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.getByText('BẮT ĐẦU HÀNH TRÌNH').first().click();
  console.log('[clicked start] → loading → map...');
  await page.waitForTimeout(22000);
  const st = await page.evaluate(() => {
    const r = window.refs.current;
    return { carX: Math.round(r.carX), map: r.currentMapId, bots: r.trafficAIManager?.botCars?.length };
  });
  console.log('[AFTER START]', JSON.stringify(st));
  await page.screenshot({ path: 'scratch/audit_shots/lazy_init.png' });
  console.log('saved lazy_init.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
