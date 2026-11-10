import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(22000);
  const res = await page.evaluate(() => {
    const scene = window.refs.current.scene;
    const out = [];
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      // mesh nào có bbox chứa điểm Ostendorf (-387, 862)?
      if (bb.min.x <= -387 && bb.max.x >= -387 && bb.min.z <= 862 && bb.max.z >= 862) {
        // tìm vertex gần nhất
        const pos = o.geometry.attributes.position;
        let bestD = Infinity, bestY = null;
        for (let i = 0; i < Math.min(pos.count, 20000); i++) {
          const dd = Math.hypot(pos.getX(i) + 387, pos.getZ(i) - 862);
          if (dd < bestD) { bestD = dd; bestY = pos.getY(i); }
        }
        out.push({ name: o.name || '(unnamed)', parent: o.parent?.name || '(scene)', visible: o.visible,
          nearestVertY: bestY !== null ? Math.round(bestY * 100) / 100 : null, dist: Math.round(bestD), verts: pos.count });
      }
    });
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
