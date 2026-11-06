import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  await page.evaluate(() => {
    const scene = window.refs.current.scene;
    scene.traverse(o => {
      if ((o.name === 'V2_NhaTuong' || o.name === 'V2_NhaTuong2') && o.isMesh && o.material) {
        o.material.color.setHex(0xff2222);
        if (o.material.emissive && o.material.emissive.setHex) o.material.emissive.setHex(0x881111);
      }
    });
  });
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -150, y: 18, z: 700, tx: -400, ty: 5, tz: 950 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/red_buildings.png' });
  console.log('saved red_buildings.png');
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
