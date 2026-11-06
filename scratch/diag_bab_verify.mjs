import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.locator('div[title*="Cao Tốc"]').first().click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await page.waitForSelector('text=AUTOBAHN TELEMETRY', { timeout: 60000 });
  const report = await page.evaluate(() => {
    const eng = window.__babylonSim;
    const root = eng.roadsRoot;
    const mark = eng.scene.meshes.find(m => m.name === 'Autobahn_Markings');
    const pos = mark.getVerticesData('position');
    const world = mark.computeWorldMatrix(true);
    const v0 = new BABYLON_V3(pos[0], pos[1], pos[2]);
    function BABYLON_V3(x, y, z) { const V = eng.scene.getEngine() && window.BABYLON ? window.BABYLON.Vector3 : null; return V ? new V(x, y, z) : null; }
    // fallback: tự transform bằng world matrix 4x4
    const m = world.m ? world.m : world;
    const tf = (x, y, z) => ({
      x: m[0] * x + m[4] * y + m[8] * z + m[12],
      y: m[1] * x + m[5] * y + m[9] * z + m[13],
      z: m[2] * x + m[6] * y + m[10] * z + m[14],
    });
    const w0 = tf(pos[0], pos[1], pos[2]);
    // mẫu vài vert để biết dải đường nằm đâu
    const samples = [];
    for (let i = 0; i < pos.length && samples.length < 5; i += 3 * 4000) {
      const w = tf(pos[i], pos[i + 1], pos[i + 2]);
      samples.push([Math.round(w.x), Math.round(w.z)]);
    }
    return {
      rootRot: root.rotation ? { x: root.rotation.x, y: root.rotation.y, z: root.rotation.z } : null,
      rootQuat: root.rotationQuaternion ? root.rotationQuaternion.asArray().map(v => Math.round(v * 1000) / 1000) : null,
      rootScaling: root.scaling.asArray(),
      markLocal0: [Math.round(pos[0]), Math.round(pos[2])],
      markWorld0: [Math.round(w0.x), Math.round(w0.z)],
      samples,
      carInternal: [Math.round(eng.carX), Math.round(eng.carZ)],
    };
  });
  console.log('VERIFY:', JSON.stringify(report, null, 1));
  await browser.close();
};
run().catch(e => { console.error(e); process.exit(1); });
