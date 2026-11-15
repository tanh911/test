// 🔬 check_berlin_signs_live.mjs — mở /sim-dev?map=berlin&raw=1 headless:
// đếm lỗi console + đếm cột biển stvo_sign trong scene + chụp 2 ảnh gần cụm biển dày.
// Chạy: node scripts/check_berlin_signs_live.mjs
import { chromium } from 'playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('http://127.0.0.1:3000/sim-dev?map=berlin&raw=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
  await sleep(6000);

  const info = await page.evaluate(() => {
    const sc = window.__simScene;
    let poles = 0, boards = 0;
    sc.scene?.traverse?.((o) => {
      if (o.name && String(o.name).startsWith('stvo_sign_')) poles++;
    });
    // đếm mesh bảng biển (userData.signType)
    sc.scene?.traverse?.((o) => { if (o.userData?.signType) boards++; });
    return { poles, boards, camera: sc.camera?.position?.toArray?.() };
  });
  console.log('Cột biển (stvo_sign_*):', info.poles, ' · bảng biển:', info.boards);
  console.log('Console errors:', errors.length ? errors.slice(0, 5) : 'không có');

  // bay đến cụm biển dày ở đông-bắc (Hausvogteiplatz ~ x 380, z 260 theo plot)
  const spots = [
    { name: 'cluster-ne', x: 420, z: 240, h: 40 },
    { name: 'udl-west', x: -450, z: 60, h: 50 },
  ];
  for (const s of spots) {
    await page.evaluate(({ x, z, h }) => {
      const sc = window.__simScene;
      sc.camera.position.set(x, h, z);
      if (sc.camera.userData?._setPose) sc.camera.userData._setPose(0, -Math.PI / 2);
    }, s);
    await sleep(2000);
    await page.screenshot({ path: `qa-roads/live-${s.name}.png` });
    console.log('📸', `qa-roads/live-${s.name}.png`);
  }
  await browser.close();
}
main().catch((e) => { console.error('FAIL:', e); process.exit(1); });
