// Smoke test 4: đề-pa ngang dốc trên Sa hình (qua Settings modal)
import { chromium } from 'playwright';
const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err).slice(0, 200)));
  const simState = () => page.evaluate(() => {
    const r = window.refs?.current;
    if (!r) return null;
    return { mapId: r.currentMapId, speed: Math.round(r.speed || 0), idx: r.scenarioIdx,
      active: r.activeScenario?.id || null, score: r.scoreState?.points,
      hillRolledBack: !!r.hillRolledBack, rollDist: Math.round((r.hillRollbackDist || 0) * 100) / 100,
      dist: Math.round(Math.abs(r.distanceTraveled || 0) - (r._scenarioBaseZ || 0)), carZ: Math.round(r.carZ || 0),
      onRamp: !!(r._ramps || []).length };
  });

  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});

  // Bắt đầu free-drive Berlin trước (để có header) rồi mở Settings
  const startBtn = page.locator('button:has-text("BẮT ĐẦU HÀNH TRÌNH")').first();
  if (await startBtn.isVisible().catch(() => false)) { await startBtn.click(); }
  await page.waitForTimeout(12000);

  // Mở Settings (nút gear) — tìm theo title
  const gear = page.locator('button[title*="ài đặt"], button[title*="Cài đặt"], button:has([class*="Settings"]), button:has(svg.lucide-settings)').first();
  const gearAlt = page.locator('.sim-header-btn-exit ~ button').first();
  let opened = false;
  for (const sel of [gear, page.locator('button:has(svg.lucide-settings-icon)').first(), page.locator('[class*="header"] button:nth-child(8)').first()]) {
    if (await sel.isVisible().catch(() => false)) { await sel.click().catch(() => {}); opened = true; break; }
  }
  console.log('settings opened:', opened);
  await page.waitForTimeout(1500);

  // Chọn tab SA HÌNH rồi bấm bắt đầu
  const saHinhTab = page.getByText('SA HÌNH', { exact: false }).first();
  if (await saHinhTab.isVisible().catch(() => false)) { await saHinhTab.click(); await page.waitForTimeout(800); }
  const goBtn = page.locator('button:has-text("Bắt đầu"), button:has-text("BẮT ĐẦU")').last();
  if (await goBtn.isVisible().catch(() => false)) { await goBtn.click(); console.log('clicked sa-hinh start'); }
  await page.waitForTimeout(14000);
  console.log('[SAHINH load]', JSON.stringify(await simState()));

  // Nổ máy, D, ga 8s để tiến lên vùng dốc (b2_hill z≈-25 => carZ 25)
  await page.keyboard.press('i');
  await page.waitForTimeout(1000);
  await page.keyboard.down('w');
  await page.waitForTimeout(5000);
  await page.keyboard.up('w');
  console.log('[on approach]', JSON.stringify(await simState()));
  // Nhả hết — xe phải tuột dốc nếu đang trên dốc lên
  await page.waitForTimeout(5000);
  console.log('[idle 5s]', JSON.stringify(await simState(), null, 1));
  await page.screenshot({ path: 'scratch/audit_shots/smoke4_hill.png' }).catch(() => {});
  console.log('pageerrors:', errors.length); errors.slice(0, 5).forEach(e => console.log('  ERR:', e));
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
