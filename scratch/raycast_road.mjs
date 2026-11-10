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
    const r = window.refs.current;
    const scene = r.scene;
    const THREE_OK = scene.children[0]?.constructor;
    // Raycast thủ công: dùng THREE từ object bất kỳ
    const anyObj = scene.children[0];
    const THREEVec = anyObj.position.constructor;
    const THREEVec3 = anyObj.position.__proto__.constructor;
    // Raycaster không có sẵn — dùng import? Không được. Dùng distanceToPoint thay thế:
    // Liệt kê mesh nào có vertex nằm TRONG bán kính 10m quanh điểm road (-387, 862) ở y 0..1
    const out = { near: [] };
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      const pos = o.geometry.attributes.position;
      // chỉ sample 200 vertex đầu để nhanh + bbox test trước
      o.geometry.computeBoundingBox();
      const bb = new (o.geometry.boundingBox.constructor)();
      // world bbox
      const boxHelper = o.geometry.boundingBox.clone();
      // dùng world: transform thủ công quá dài — kiểm tra local (GLB chưa transform ngoài position 0 nên ok)
      if (boxHelper.min.x > -400 || boxHelper.max.x < -460 || boxHelper.min.z > 900 || boxHelper.max.z < 820) return;
      let hits = 0;
      for (let i = 0; i < Math.min(pos.count, 4000); i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        if (Math.abs(vx + 387) < 10 && Math.abs(vz - 862) < 10 && vy < 2) hits++;
      }
      if (hits > 0) out.near.push({ name: o.name || '(unnamed)', parent: o.parent?.name || '', hits, y0: Math.round(pos.getY(0) * 100) / 100 });
    });
    out.near = out.near.slice(0, 10);
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
