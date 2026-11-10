// Verify fix: Berlin (mặc định vig) + Autobahn (Sky map) — chốt không washout
import { chromium } from 'playwright';
import fs from 'fs';
import { createRequire } from 'module';

const OUT = 'scratch/audit_shots/pp_washout';
const PORT = process.argv[2] || '3000';
const { PNG } = createRequire(import.meta.url)('pngjs');

const statsOf = (file) => {
  const png = PNG.sync.read(fs.readFileSync(file));
  let white = 0, sum = 0, n = png.width * png.height;
  for (let i = 0; i < n; i++) {
    const r = png.data[i*4], g = png.data[i*4+1], b = png.data[i*4+2];
    sum += (r + g + b) / 3;
    if (r > 235 && g > 235 && b > 235) white++;
  }
  return { whitePct: +(100*white/n).toFixed(1), mean: +(sum/n).toFixed(1) };
};

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900'] });

// 1) Berlin mặc định
let page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`http://localhost:${PORT}/simulation`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 40000 });
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 60000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}/final_berlin.png` });
await page.close();

// 2) Autobahn (Sky HDR + sun disc)
page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`http://localhost:${PORT}/simulation`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 40000 });
try {
  await page.click('text=CAO TỐC', { timeout: 8000 });
} catch { /* card có thể cần scroll — thử click trực tiếp */ }
await page.waitForTimeout(800);
await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
await page.waitForFunction(() => { const t = document.body.innerText; return t.includes('km/h') && !t.includes('Đang tải'); }, { timeout: 90000 });
await page.waitForTimeout(8000);
await page.screenshot({ path: `${OUT}/final_autobahn.png` });
await page.close();
await browser.close();

for (const f of ['final_berlin', 'final_autobahn']) {
  const s = statsOf(`${OUT}/${f}.png`);
  console.log(f.padEnd(16), 'white%', s.whitePct, ' mean', s.mean);
}
console.log('baseline berlin: white% 7.8 mean 81');
