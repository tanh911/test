// E2E: luồng "Xóa Map Custom" trong Options menu — không được crash, khôi phục Sa Hình mặc định
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.join(process.cwd(), 'scratch', 'audit_shots');
fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CUSTOM_MAP = {
  mapInfo: { name: 'Custom Của Editor', type: 'custom', maxSpeedLimit: 50, gridSize: 10, spawnPoint: { x: 3.5, z: 5, rotation: 0 } },
  elements: [
    { id: 'road_main_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 160 },
    { id: 'spawn_start', type: 'SPAWN_POINT', x: 3.5, z: 5, rotation: 0, width: 3, height: 6 }
  ]
};

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 300)));
  page.on('console', (m) => {
    const t = m.text();
    if (/handleClearCustomMap|not defined|ReferenceError/i.test(t)) errors.push('[console] ' + t.slice(0, 300));
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(9000);

  const before = await page.evaluate(() => ({
    mapName: JSON.parse(localStorage.getItem('testMapData') || 'null')?.mapInfo?.name ?? null,
  }));
  console.log('BEFORE:', JSON.stringify(before));

  // Start menu là modal (che cả top bar) → phải BẮT ĐẦU HÀNH TRÌNH trước mới mở được Cài đặt
  await page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first().click();
  await sleep(5000);

  // Mở Options menu → kiểm tra danh sách Zone Berlin render không crash → bấm Xóa Map Custom
  await page.locator('button[title*="Cài đặt mô phỏng"]').first().click();
  await sleep(1000);
  const zoneBtns = await page.locator('button:has-text("Unter den Linden")').count();
  console.log('Berlin zone buttons trong Cài đặt:', zoneBtns);
  const clearBtn = page.locator('button:has-text("Xóa Map Custom")').first();
  if (!(await clearBtn.isVisible().catch(() => false))) {
    console.log('❌ Nút "Xóa Map Custom" không tìm thấy trong Options menu');
  } else {
    await clearBtn.click();
    await sleep(6000); // đợi hot-swap nạp lại map mặc định

    const after = await page.evaluate(() => ({
      localStorageCleared: localStorage.getItem('testMapData') === null,
      menuClosed: !(document.querySelector('button') && [...document.querySelectorAll('button')].some(b => b.textContent.includes('Xóa Map Custom'))),
    }));
    console.log('AFTER:', JSON.stringify(after));

    await page.screenshot({ path: path.join(OUT_DIR, 'clear_custom_map_after.png') });

    // Lái thử trên map khôi phục để chắc chắn scene còn sống
    await page.keyboard.press('b');
    await page.keyboard.down('w');
    await sleep(2000);
    await page.keyboard.up('w');
    const drive = await page.evaluate(() => {
      const r = window.refs.current;
      return { speedKmH: Math.round((r.speed || 0) * 3.6), carZ: Math.round(r.carZ) };
    });
    console.log('DRIVE AFTER CLEAR:', JSON.stringify(drive));
  }

  console.log('ERRORS:', errors.length === 0 ? 'none ✅' : errors.slice(0, 5));
  await browser.close();
  process.exit(errors.some(e => e.includes('pageerror') || e.includes('not defined')) ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
