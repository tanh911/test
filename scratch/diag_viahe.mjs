// Đo vertex positions của ViaHe/Asphalt2 chunks gần spawn training để thấy quad sai chỗ
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 60000 });
await page.evaluate(() => { const c = [...document.querySelectorAll('div[title]')].find(d => d.getAttribute('title').includes('training.glb')); c.click(); });
await page.waitForTimeout(300);
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 90000 });
await page.waitForTimeout(4000);

const res = await page.evaluate(() => {
  const r = window.refs.current;
  const out = [];
  r.scene.traverse(o => {
    if (!o.isMesh) return;
    if (!o.name.startsWith('V2_ViaHe') && !o.name.startsWith('V2_DuongAsphalt2')) return;
    // chỉ chunk quanh spawn (world z −185 → graph z 185; chunk cell x −250..0, z 0..250)
    // không lọc tên — lọc theo vùng toạ độ dưới
    const a = o.geometry.attributes.position;
    if (!a) return;
    // thu gom các đỉnh trong vùng z world −30..−160 (graph z 30..160), x −420..−380
    const pts = [];
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
      if (x > -420 && x < -380 && z > -180 && z < -20) pts.push([+x.toFixed(2), +y.toFixed(2), +z.toFixed(2)]);
    }
    if (pts.length > 0) {
      const xs = pts.map(p => p[0]), zs = pts.map(p => p[2]), ys = pts.map(p => p[1]);
      out.push({
        name: o.name.slice(0, 24),
        n: pts.length,
        xMin: Math.min(...xs).toFixed(1), xMax: Math.max(...xs).toFixed(1),
        zMin: Math.min(...zs).toFixed(1), zMax: Math.max(...zs).toFixed(1),
        yMin: Math.min(...ys).toFixed(2), yMax: Math.max(...ys).toFixed(2),
        sample: pts.slice(0, 6)
      });
    }
  });
  return out;
});
res.forEach(r => console.log(JSON.stringify(r)));
await browser.close();
