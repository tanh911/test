// QA bay camera trong map München OSM thật (không drive)
// Chạy: node scripts/qa-muenchen-fly.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { checks: [], consoleErrors: [] };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

// Mở map München không drive (chế độ bay tự do)
await page.goto(`${BASE}/sim-dev?map=muenchen`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 60000 });
await sleep(600);

// Lấy thông tin bản đồ ban đầu
const info = await page.evaluate(() => {
  const s = window.__simScene;
  const map = s.map;
  return {
    nodes: map.nodes.length,
    roads: map.roads.length,
    intersections: map.intersections.length,
    stats: s.getStats?.(),
  };
});
out.checks.push({ step: 'boot München OSM', info });

// Hàm bay camera đến vị trí (x, z), nhìn về (0,0,0)
const flyTo = async (x, z, label) => {
  await page.evaluate(({ x, z }) => {
    const s = window.__simScene;
    if (!s || !s.camera) return false;
    s.camera.position.set(x, 500, 550);
    s.camera.lookAt(0, 0, 0);
    s.camera.updateProjectionMatrix();
    return true;
  }, { x, z });
  await sleep(300);
  const stats = await page.evaluate(() => {
    const s = window.__simScene;
    return s.getStats?.();
  });
  out.checks.push({ step: label, x, z, stats });
};

// Bay qua các điểm khác nhau của bản đồ München
await flyTo(0, 0, 'trung tâm bản đồ');
await flyTo(200, 200, 'góc đông-nam');
await flyTo(-200, -200, 'góc tây-bắc');
await flyTo(400, 0, 'phía đông');
await flyTo(0, 400, 'phía nam');
await flyTo(-400, 0, 'phía tây');
await flyTo(0, -400, 'phía bắc');

// Kiểm tra không có console error
out.checks.push({ step: 'check console errors', consoleErrors: out.consoleErrors.length });

await browser.close();
writeFileSync('scripts/qa-result-muenchen-fly.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
