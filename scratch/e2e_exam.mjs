// ══════════════════════════════════════════════════════════════════
// E2E EXAM RUN: thi thật bài Autobahn từ đầu đến cuối
// Người lái "giỏi": seatbelt → nổ máy → D → xi-nhan/Schulterblick đúng lúc
// → giữ W (lane-keep assist bám làn) → hazard khi rettungsgasse → xi-nhan phải khi thoát
// ══════════════════════════════════════════════════════════════════
import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=default', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  await page.goto('http://localhost:3000/simulation', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  await page.waitForSelector('canvas', { timeout: 30000 }).catch(() => {});
  await page.getByText('Autobahn', { exact: false }).first().dblclick({ force: true }).catch(() => {});
  await page.waitForTimeout(20000);

  const state = () => page.evaluate(() => {
    const r = window.refs.current;
    return {
      odo: Math.round(r._odoDist || 0), spd: Math.round(r.speed || 0),
      idx: r.scenarioIdx, active: r.activeScenario?.id || null,
      score: r.scoreState?.points, finished: !!r.finished,
      engine: !!r.isEngineRunning, map: r.currentMapId
    };
  });

  // Chuẩn bị: thắt dây an toàn (b) + nổ máy (i) + vào D (d) — kiểu tài xế giỏi
  await page.keyboard.press('b');
  await page.keyboard.press('i');
  await page.waitForTimeout(1200);
  await page.keyboard.press('d');
  console.log('[START]', JSON.stringify(await state()));

  await page.keyboard.down('w'); // giữ ga — lane-keep assist bám làn
  let hazardDone = false, enterSignals = false, exitSignals = false;
  const t0 = Date.now();
  let lastLog = 0;

  while (Date.now() - t0 < 300000) { // tối đa 5 phút
    await page.waitForTimeout(1000);
    const s = await state();

    // 1. Trước Auffahrt (odo 1350+): xi-nhan trái + Schulterblick trái
    if (!enterSignals && s.odo >= 1350 && s.active === 'ab_enter') {
      await page.keyboard.press('q'); // xi-nhan trái
      await page.waitForTimeout(400);
      await page.keyboard.press('z'); // Schulterblick trái
      enterSignals = true;
      console.log(`[odo ${s.odo}] Q + Z — xi-nhan trái & Schulterblick trước khi nhập làn`);
    }
    // Tắt xi-nhan sau khi nhập xong (odo > 1850)
    if (enterSignals && s.odo >= 1900 && s.odo < 2000) {
      await page.keyboard.press('q');
      console.log(`[odo ${s.odo}] tắt xi-nhan trái`);
    }
    // 2. Rettungsgasse (3300-3700): bật hazard
    if (!hazardDone && s.odo >= 3300 && s.odo <= 3750) {
      await page.keyboard.press('h'); // hazard
      hazardDone = true;
      console.log(`[odo ${s.odo}] H — hazard đèn cảnh báo (Rettungsgasse)`);
    }
    // Tắt hazard sau window
    if (hazardDone && s.odo > 3800 && s.odo < 3900) {
      await page.keyboard.press('h');
      console.log(`[odo ${s.odo}] tắt hazard`);
    }
    // 3. Trước Ausfahrt (odo 3800+): xi-nhan phải + Schulterblick phải
    if (!exitSignals && s.odo >= 3850 && s.active === 'ab_exit') {
      await page.keyboard.press('e'); // xi-nhan phải
      await page.waitForTimeout(400);
      await page.keyboard.press('x'); // Schulterblick phải
      exitSignals = true;
      console.log(`[odo ${s.odo}] E + X — xi-nhan phải & Schulterblick trước khi thoát`);
      // Rẽ phải vào làn thoát: nhả ga + đánh lái phải 1.2s
      await page.keyboard.up('w');
      await page.keyboard.down('d');
      await page.waitForTimeout(1400);
      await page.keyboard.up('d');
      await page.keyboard.down('w');
      console.log('[steer] đánh lái phải vào làn thoát');
    }
    if (s.finished) { console.log(`[FINISH] odo ${s.odo}`); break; }
    if (Date.now() - lastLog > 20000) {
      lastLog = Date.now();
      console.log(`[t=${Math.round((Date.now()-t0)/1000)}s]`, JSON.stringify(s));
    }
  }
  await page.keyboard.up('w');

  const final = await state();
  const events = await page.evaluate(() => (window.refs.current.scoreState?.events || []).map(e => `${e.passed ? 'PASS' : 'FAIL'}: ${e.msg?.slice(0, 60)}`));
  console.log('\n═══════ KẾT QUẢ BÀI THI ═══════');
  console.log('Score:', final.score, '/ 100', '| finished:', final.finished, '| odo:', final.odo, 'm');
  events.forEach(e => console.log('  ' + e));
  console.log('pageerrors:', errors.length); errors.slice(0, 3).forEach(e => console.log('  ', e));
  await page.screenshot({ path: 'scratch/audit_shots/e2e_final.png' });
  await browser.close();
};
run().catch(e => { console.error('FAILED:', e); process.exit(1); });
