// Dump toàn bộ vertex của chunks ViaHe/Asphalt2 quanh vùng spawn training
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
    if (!/V2_(ViaHe|DuongAsphalt2|VachTrang)_-2_0$/.test(o.name)) return;
    const a = o.geometry.attributes.position;
    const idx = o.geometry.index;
    const pts = [];
    for (let i = 0; i < a.count; i++) pts.push([+a.getX(i).toFixed(2), +a.getY(i).toFixed(2), +a.getZ(i).toFixed(2)]);
    out.push({ name: o.name, verts: a.count, indexed: !!idx, pts });
  });
  return out;
});
for (const c of res) {
  console.log('===', c.name, c.verts, 'verts, indexed:', c.indexed);
  // in từng QUAD (mỗi 4 đỉnh không indexed) — x, y, z
  for (let i = 0; i + 3 < c.pts.length; i += 4) {
    const q = c.pts.slice(i, i + 4);
    const xs = q.map(p => p[0]).join(','), ys = q.map(p => p[1]).join(','), zs = q.map(p => p[2]).join(',');
    console.log(`  quad[${i / 4}] x=${xs} y=${ys} z=${zs}`);
    if (i > 24) { console.log('  ...'); break; }
  }
}
await browser.close();
