import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 120)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(14000);
  const info = await page.evaluate(() => {
    const r = window.refs.current;
    const scene = r.scene;
    // Tìm mesh đường local: quét các mesh tên có 'Road'/'road' y trung bình
    const out = [];
    scene.traverse(o => {
      if (o.isMesh && o.geometry && o.geometry.attributes?.position) {
        const pos = o.geometry.attributes.position;
        // mẫu 30 đỉnh đầu
        let sumY = 0, n = Math.min(30, pos.count);
        for (let i = 0; i < n; i++) sumY += pos.getY(i);
        const avgY = sumY / n;
        if (avgY > 3.5 && avgY < 9 && pos.count > 100) {
          out.push({ name: o.name || o.parent?.name || '?', avgY: Math.round(avgY * 10) / 10, verts: pos.count });
        }
      }
    });
    return out.slice(0, 10);
  });
  console.log('meshes with y≈6:', JSON.stringify(info));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
