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
  // Đặt background ĐỎ rực: nếu trời vẫn trắng → Sky mesh đang vẽ trắng; nếu đỏ → Sky mesh KHÔNG vẽ
  await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const sky = scene.children.find(c => c.name === 'physicalSky');
    sky.visible = false;            // tắt sky mesh
    scene.background = new (scene.background ? scene.background.constructor : Object) === Object ? null : null;
    scene.background = null;        // bỏ equirect
    window.__probeClear = true;
    const r = window.refs.current.renderer;
    r.setClearColor(0xff0000, 1);
    r.render(scene, r.domElement ? window.refs.current.camera : window.refs.current.camera);
  });
  await page.waitForTimeout(500);
  // Chụp ngay 1 frame thủ công: render 1 lần rồi toDataURL ngay (preserveDrawingBuffer đã tắt)
  const dataUrl = await page.evaluate(() => {
    const r = window.refs.current;
    r.renderer.render(r.scene, r.camera);
    return r.renderer.domElement.toDataURL('image/png');
  });
  const fs = await import('fs');
  fs.writeFileSync('scratch/audit_shots/probe_red.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('saved probe_red.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
