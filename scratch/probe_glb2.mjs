import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  const res = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    let glb = null;
    scene.traverse(o => { if (o.name === 'Autobahn_GLB_Model_blender_v2') glb = o; });
    if (!glb) return { err: 'no glb' };
    const out = { worldPos: [glb.position.x, glb.position.y, glb.position.z], rot: glb.rotation.x, meshes: [] };
    for (const child of glb.children) {
      if (!child.isMesh) continue;
      const pos = child.geometry.attributes.position;
      const box = new (child.geometry.boundingBox.constructor)();
      box.setFromObject(child);
      out.meshes.push({ name: child.name, visible: child.visible, verts: pos.count,
        matType: child.material?.type, matSide: child.material?.side, matColor: child.material?.color ? child.material.color.getHexString() : null,
        worldY: [Math.round(box.min.y), Math.round(box.max.y)],
        worldX: [Math.round(box.min.x), Math.round(box.max.x)],
        worldZ: [Math.round(box.min.z), Math.round(box.max.z)] });
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1).slice(0, 1800));
  // Camera street-level trong town
  await page.evaluate(() => {
    const r = window.refs.current;
    r._customCam = { x: -396, y: 2.5, z: 860, tx: -400, ty: 3, tz: 1000 };
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scratch/audit_shots/street_level.png' });
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
