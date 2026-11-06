// Probe v2: cô lập thủ phạm white-washout — click BẮT ĐẦU (stadt_zentrum mặc định) → screenshot từng biến thể pp
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'scratch/audit_shots/pp_washout';
fs.mkdirSync(OUT, { recursive: true });

const PORT = process.argv[2] || '3001';
const VARIANTS = [
  ['none', '?pp=none'],        // baseline: renderer.render trực tiếp
  ['vig', '?pp=vig'],          // Render + Vignette + Output
  ['bloom', '?pp=bloom'],      // Render + Bloom + Output
  ['ssao', '?pp=ssao'],        // Render + SSAO + Output
  ['full', ''],                // hiện tại: ssao+bloom+vig (mặc định)
];

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=default', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1600,900']
});

const stats = {};
for (const [name, qs] of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR:' + e.message.slice(0, 140)));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE:' + m.text().slice(0, 140)); });
  await page.goto(`http://localhost:${PORT}/simulation${qs}`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('button:has-text("BẮT ĐẦU HÀNH TRÌNH")', { timeout: 40000 });
    await page.click('button:has-text("BẮT ĐẦU HÀNH TRÌNH")');
  } catch { errors.push('BTN_TIMEOUT'); }
  // chờ build map xong (loading overlay biến mất)
  try {
    await page.waitForFunction(() => {
      const t = document.body.innerText;
      return t.includes('km/h') && !t.includes('Đang tải') && !t.includes('ĐANG TẢI');
    }, { timeout: 60000 });
  } catch { errors.push('LOAD_TIMEOUT'); }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${OUT}/v_${name}.png` });

  const s = await page.evaluate(async () => {
    const cv = document.querySelector('canvas');
    if (!cv) return null;
    const off = document.createElement('canvas');
    off.width = 320; off.height = 180;
    const ctx = off.getContext('2d');
    ctx.drawImage(cv, 0, 0, 320, 180);
    const d = ctx.getImageData(0, 0, 320, 180).data;
    let white = 0, sum = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      const b = (d[i] + d[i + 1] + d[i + 2]) / 3;
      sum += b;
      if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) white++;
    }
    return { whitePct: +(100 * white / n).toFixed(1), meanBrightness: +(sum / n).toFixed(1) };
  });
  stats[name] = { ...s, errors: [...new Set(errors)].slice(0, 4) };
  console.log(`${name.padEnd(6)} whitePct=${s?.whitePct}%  brightness=${s?.meanBrightness}  err=${stats[name].errors.length}`);
  await page.close();
}

fs.writeFileSync(`${OUT}/stats.json`, JSON.stringify(stats, null, 2));
await browser.close();
console.log('DONE →', OUT);
