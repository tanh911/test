// 🚁 drone_scan.mjs — bot drone bay lưới chụp toàn map Berlin-Mitte để soát lỗi bằng mắt
// Kết quả: qa-drone/cell_<i>_<j>.png + qa-drone/manifest.json (toạ độ từng ô)
// Chạy: node scripts/drone_scan.mjs   (cần dev server localhost:3000)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa-drone');
mkdirSync(outDir, { recursive: true });

// map bounds (berlin-mitte-clean.json): x ±685, z ±644
const X0 = -685, X1 = 685, Z0 = -644, Z1 = 644;
const STEP = 220;       // bước lưới (m) — FOV 60° ở h=90 phủ ~104m bán kính, chồng lấn nhẹ
const ALT = 90;         // cao độ bay

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000/sim-dev?map=berlin');
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(6000); // đợi chunk load đợt đầu

  const cols = Math.ceil((X1 - X0) / STEP);
  const rows = Math.ceil((Z1 - Z0) / STEP);
  const manifest = { alt: ALT, step: STEP, cells: [] };

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = X0 + (i + 0.5) * ((X1 - X0) / cols);
      const z = Z0 + (j + 0.5) * ((Z1 - Z0) / rows);
      await page.evaluate(({ x, z, h }) => {
        const sc = window.__simScene;
        sc.camera.position.set(x, h, z);
        sc.camera.userData._setPose(0, -Math.PI / 2);
      }, { x, z, h: ALT });
      // Đợi chunk stream xong: cellsLoaded ổn định 3 lần poll liên tiếp (tối đa 8 s)
      await page.waitForFunction(() => {
        const sc = window.__simScene;
        if (!sc) return false;
        const s = sc.getStats();
        const w = window;
        if (w.__lastCells === s.cellsLoaded) {
          w.__stable = (w.__stable ?? 0) + 1;
        } else {
          w.__stable = 0;
          w.__lastCells = s.cellsLoaded;
        }
        return w.__stable >= 3;
      }, { timeout: 8000, polling: 250 }).catch(() => { /* hết giờ vẫn chụp */ });
      const name = `cell_${String(i).padStart(2, '0')}_${String(j).padStart(2, '0')}.png`;
      await page.screenshot({ path: join(outDir, name) });
      manifest.cells.push({ name, x: Math.round(x), z: Math.round(z) });
      process.stdout.write(`.`);
    }
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nĐã chụp ${manifest.cells.length} ô → ${outDir}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
