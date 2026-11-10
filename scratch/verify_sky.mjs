// Verify: Sky trong far-plane + bám camera + chụp ảnh autobahn & stadt
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(12000);

  // Chuyển autobahn
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(14000);
  const chk = await page.evaluate(() => {
    const r = window.refs.current;
    const scene = r.scene, cam = r.camera;
    const sky = scene.children.find(c => c.name === 'physicalSky');
    return {
      far: cam.far,
      skyScale: sky ? Math.round(sky.scale.x) : null,
      skyPos: sky ? { x: Math.round(sky.position.x), z: Math.round(sky.position.z) } : null,
      carPos: { x: Math.round(r.carX), z: Math.round(r.carZ) },
      bg: scene.background ? (scene.background.isTexture ? 'equirect-tex' : '#' + scene.background.getHexString?.()) : 'null',
      skyVisible: sky ? sky.visible : null
    };
  });
  console.log('[AUTOBAHN sky check]', JSON.stringify(chk));
  // Lái 5s cho xe di chuyển xa → kiểm tra sky bám theo
  await page.keyboard.press('i');
  await page.waitForTimeout(800);
  await page.keyboard.down('w');
  await page.waitForTimeout(6000);
  await page.keyboard.up('w');
  const chk2 = await page.evaluate(() => {
    const r = window.refs.current;
    const sky = r.scene.children.find(c => c.name === 'physicalSky');
    return { skyPos: { x: Math.round(sky.position.x), z: Math.round(sky.position.z) }, carPos: { x: Math.round(r.carX), z: Math.round(r.carZ) } };
  });
  console.log('[after drive]', JSON.stringify(chk2), '→ sky follows car:', Math.abs(chk2.skyPos.x - chk2.carPos.x) < 2 && Math.abs(chk2.skyPos.z - chk2.carPos.z) < 2);
  await page.screenshot({ path: 'scratch/audit_shots/skyfix_autobahn.png' }).catch(() => {});

  // Stadt
  await page.evaluate(() => { window.refs.current.setCurrentMapId('stadt_zentrum'); });
  await page.waitForTimeout(14000);
  const chk3 = await page.evaluate(() => {
    const r = window.refs.current;
    const scene = r.scene, cam = r.camera;
    const sky = scene.children.find(c => c.name === 'physicalSky');
    return { far: cam.far, skyScale: sky ? Math.round(sky.scale.x) : null, headerLimit: null };
  });
  console.log('[STADT sky check]', JSON.stringify(chk3));
  await page.screenshot({ path: 'scratch/audit_shots/skyfix_stadt.png' }).catch(() => {});
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
