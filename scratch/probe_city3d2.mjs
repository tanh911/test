import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  await page.waitForTimeout(10000);
  await page.evaluate(() => { window.refs.current.setCurrentMapId('autobahn_a9'); });
  await page.waitForTimeout(14000);
  // Xoá bot khỏi vùng nhìn + teleport + immunity
  await page.evaluate(() => {
    const r = window.refs.current;
    r.collisionOccurred = false;
    r._collisionImmunityUntil = Date.now() + 30000;
    if (r.trafficAIManager) {
      r.trafficAIManager.botCars.forEach(b => { b.mesh.position.set(b.mesh.position.x + 2000, b.mesh.position.y, b.mesh.position.z + 2000); });
    }
    r._customCam = { x: -1770, y: 22, z: 1080, tx: -1770, ty: 2, tz: 1400 };
    if (r.playerCar) { r.carX = -1770; r.carZ = -1200; r.playerCar.position.set(-1770, 0, 1200); }
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scratch/audit_shots/city_elev_check2.png' });
  console.log('saved');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
