import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(12000);
  // Đặt exposure cực thấp rồi render thủ công + chụp
  const dataUrl = await page.evaluate(() => {
    const r = window.refs.current;
    r.renderer.toneMappingExposure = 0.15;
    r.renderer.render(r.scene, r.camera);
    return r.renderer.domElement.toDataURL('image/png');
  });
  const fs = await import('fs');
  fs.writeFileSync('scratch/audit_shots/probe_exp015.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  // trả lại exposure
  await page.evaluate(() => { window.refs.current.renderer.toneMappingExposure = 0.55; });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
