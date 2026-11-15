// 📸 capture_lamp_orientation.mjs — PHẦN 8.3: chụp cột đèn trái+phải (r274) và đoạn cong (r283).
// Chạy: node scripts/capture_lamp_orientation.mjs before|after → qa-roads/lamp-<tag>-*.png
import { chromium } from 'playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = (process.argv[2] ?? 'after').replace(/[^a-z]/gi, '') || 'after';

// r18: đường CONG (5 điểm) có đèn CẢ HAI phía — trái (235.12, 2.79) + phải (232.60, 11.25)
// r243: cặp đèn thứ hai để đối chứng — trái (161.29, 3.96) + phải (150.91, 2.43)
const spots = [
  { name: 'pair-r18', x: 233.9, z: 7.0, h: 20 },
  { name: 'pair-r243', x: 156.1, z: 3.2, h: 20 },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.goto('http://localhost:3000/sim-dev?map=berlin');
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await sleep(7000); // chờ world build + chunk quanh spawn
for (const s of spots) {
  await page.evaluate(({ x, z, h }) => {
    const sc = window.__simScene;
    sc.camera.position.set(x, h, z);
    sc.camera.userData._setPose(0, -Math.PI / 2); // nhìn thẳng xuống
  }, s);
  // chờ chunk quanh vị trí mới: đợi camera update + cell build xong
  await page.waitForFunction(() => {
    const sc = window.__simScene;
    if (!sc) return false;
    const stats = sc.chunkStats ?? {};
    return !stats.loading && (stats.pending ?? 0) === 0;
  }, null, { timeout: 20000 }).catch(() => {});
  await sleep(4000); // thêm margin render
  await page.screenshot({ path: `qa-roads/lamp-${tag}-${s.name}.png` });
  console.log(`Saved qa-roads/lamp-${tag}-${s.name}.png`);
}
await browser.close();
