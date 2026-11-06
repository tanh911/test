// Smoke test cho DrivingSimulation sau khi hoàn thiện va chạm + scenario checks
// Usage: node scratch/smoke_test_sim.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const results = [];

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 300)));
  page.on('console', (msg) => {
    const t = msg.text();
    if (/Uncaught|TypeError|ReferenceError|RangeError|THREE\.WebGL/i.test(t)) errors.push(t.slice(0, 300));
  });

  await page.goto(`${BASE}/simulation`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // Đợi canvas Three.js xuất hiện (menu chính hiển thị trước)
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);

  const hasMenu = await page.locator('text=Chọn bản đồ').first().isVisible().catch(() => false) ||
    await page.locator('text=Bản đồ').first().isVisible().catch(() => false);
  results.push(`menu visible: ${hasMenu}`);

  // Hàm: double-click card map để vào free-drive
  const openMap = async (cardText) => {
    const card = page.locator(`div:has-text("${cardText}")`).last();
    // Double click trực tiếp trên element có cursor pointer chứa tên map
    const target = page.getByText(cardText, { exact: false }).first();
    await target.dblclick({ force: true }).catch(async () => {
      await target.click({ force: true });
      await target.click({ force: true });
    });
    await page.waitForTimeout(15000); // đợi map build + loading
  };

  const simState = () => page.evaluate(() => {
    const r = window.refs;
    if (!r?.current) return null;
    return {
      mapId: r.current.currentMapId,
      speed: Math.round(r.current.speed || 0),
      collisionOff: !!r.current._disableCollisionCheck,
      worldColliders: (r.current.worldColliders || []).length,
      aiBots: r.current.trafficAIManager ? r.current.trafficAIManager.botCars?.length : (r.current.aiCars || []).length,
      scenarios: (r.current.currentScenarios || []).map(s => s.id),
      scenarioIdx: r.current.scenarioIdx,
      activeScenario: r.current.activeScenario?.id || null,
      score: r.current.scoreState?.points,
      hillRolledBack: !!r.current.hillRolledBack,
      crossedCenter: !!r.current.crossedCenter,
      isDriving: !!r.current.isDriving,
      finished: !!r.current.finished
    };
  });

  // ── TEST 1: Autobahn free-drive (chạy engine three.js, không còn Babylon redirect) ──
  await openMap('Autobahn');
  let st = await simState();
  results.push(`[AUTOBAHN load] ${JSON.stringify(st)}`);

  // Nổ máy (I), vào D (phím d... cần số D qua UI/phím), giữ ga 12s
  await page.keyboard.press('i');
  await page.waitForTimeout(1500);
  await page.keyboard.press('d');
  await page.waitForTimeout(800);
  await page.keyboard.down('w');
  await page.waitForTimeout(12000);
  await page.keyboard.up('w');
  st = await simState();
  results.push(`[AUTOBAHN drive] ${JSON.stringify(st)}`);
  await page.screenshot({ path: 'scratch/audit_shots/smoke_autobahn.png' }).catch(() => {});

  // ── TEST 2: quay lại menu, vào Stadt ──
  const menuBtn = page.locator('button:has-text("Menu")').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(2500);
  }
  await openMap('Đường Tỉnh');
  st = await simState();
  results.push(`[LAND load] ${JSON.stringify(st)}`);
  await page.keyboard.press('i');
  await page.waitForTimeout(1200);
  await page.keyboard.down('w');
  await page.waitForTimeout(9000);
  await page.keyboard.up('w');
  st = await simState();
  results.push(`[LAND drive] ${JSON.stringify(st)}`);
  await page.screenshot({ path: 'scratch/audit_shots/smoke_land.png' }).catch(() => {});

  results.push(`pageerrors: ${errors.length}`);
  errors.slice(0, 8).forEach(e => results.push(`  ERR: ${e}`));

  console.log(results.join('\n'));
  await browser.close();
};

run().catch(e => { console.error('SMOKE FAILED:', e); process.exit(1); });
