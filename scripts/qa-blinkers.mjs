// QA tự động xi-nhan + nosignal + HUD (Protocol Prompt 10)
// Chạy: node scripts/qa-blinkers.mjs  — cần dev server http://localhost:3001
// Logic: latch xi-nhan khi |steer| > 0.2 rad && |speed| > 1 m/s; hold 1.6s sau thả lái;
// 'nosignal' khi kmh > 5 && tích heading ≥ 0.45 rad mà signal null.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.QA_BASE ?? 'http://localhost:3001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { scenarios: {}, consoleErrors: [] };

mkdirSync('scripts/qa-shots', { recursive: true });

const browser = await chromium.launch({ headless: true });
// Viewport nhỏ = rẻ GPU → RAF nhanh hơn. Tại 1280×800 headless chỉ đạt ~14fps,
// tap A 85ms trở thành 2 tick → steer 0.256 > 0.2 → latch xi-nhan sai. 640×400 nhắm ≥30fps.
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('console', (m) => { if (m.type() === 'error') out.consoleErrors.push(m.text()); });
page.on('pageerror', (e) => out.consoleErrors.push(String(e)));

// ── SCENARIO 1: latch xi-nhan khi rẽ + hold ~1.6s sau khi thả lái ──
await page.goto(`${BASE}/sim-dev?drive=1`);
await page.waitForSelector('#root canvas', { timeout: 30000 });
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 30000 });
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });

const s1 = [];
const snap = () => page.evaluate(() => {
  const ms = window.__simScene.getMapState();
  const rs = window.__simScene.getRuleState();
  return {
    signal: ms.player?.signal ?? null,
    x: ms.player ? Math.round(ms.player.x * 10) / 10 : null,
    z: ms.player ? Math.round(ms.player.z * 10) / 10 : null,
    heading: ms.player ? Math.round(ms.player.heading * 1000) / 1000 : null,
    speedKmh: rs?.speedKmh ?? null,
    violations: rs ? rs.violations.map(v => v.type) : []
  };
});

await page.keyboard.down('KeyW'); await sleep(1200); // ~11 km/h, không quá nhanh
await page.keyboard.down('KeyA'); await sleep(160);  // steer > 0.2 → latch 'left'
const latch = await snap();
s1.push({ step: 'latch yêu cầu: signal = left', ...latch });
await page.keyboard.up('KeyA');                       // thả lái → hold ~1.6s
await sleep(400);
s1.push({ step: 'hold +0.4s: phải vẫn left', ...(await snap()) });
await page.screenshot({ path: 'scripts/qa-shots/01-signal-left.png' });
await sleep(500);
s1.push({ step: 'hold +0.9s: phải vẫn left', ...(await snap()) });
await sleep(600);
s1.push({ step: 'hold +1.5s: biên 1.6s', ...(await snap()) });
await sleep(450);
const released = await snap();
s1.push({ step: '+2.0s: phải tắt (null)', ...released });
await page.keyboard.up('KeyW');
out.scenarios.blinkerLatchAndHold = s1;

// ── SCENARIO 2: nosignal — rẽ trái liên tục mà KHÔNG bật xi-nhan ở tốc độ > 5 km/h ──
// Chiến lược RAF shim determinism (thay tap phím CDP — tap 85ms trải 2–3 frame ở 32fps
// khiến δ vượt 0.2 → latch xi-nhan sai): URL có ?shim=1 → requestAnimationFrame trở thành
// hàng đợi; `__step(ms)` thủ công nâng đúng 1 frame game với dt = ms/1000 ⇒ input lái
// chính xác từng frame, không còn jitter. Game tính dt từ RAF timestamp (simScene tick),
// nên dt shim luôn đều đặn.
// Vật lý (vehicle.ts): STEER_FRAME = 1.8·0.03 = 0.054/step; ruleEngine chỉ decay ×0.92
// khi |dh|/tick < 0.002.
//  • Pha 1 thẳng: W giữ + __step(30) tới x ≥ −30 (spawn (−70, +1.5, heading π/2), ~40m).
//  • Pha 2 rẽ: 2 nhịp A init → δ = 0.108; sau đó luân phiên tuyệt đối D step / A step
//    (input lái luôn ≠ 0 → không bao giờ rơi nhánh decay STEER_CENTER 3.0·dt) →
//    δ dao động {0.054, 0.108} < ngưỡng latch 0.2 ⇒ xi-nhan KHÔNG lần nào bật khi đang rẽ.
//  • dh/step = (v/2.6)·tan(δ)·0.03 ≈ 0.003–0.008 ≥ 0.002 ⇒ turnAccum tích lũy thật,
//    đạt NOSIGNAL_TURN_RAD 0.45 sau ~74 bước (R = 2.6/tan(δ) ≈ 32m cố định; cung ~14m
//    kết thúc ~x=−16, z≈−1.7 — trong hành lang r3 |z| ≤ 3, dãy nhà r3 kết thúc ở x≈−8).
const hasNosignal = (v) => (v.violations ?? []).includes('nosignal');
const isCrashed = (v) => (v.violations ?? []).some((t) => t.startsWith('collid') || t.includes('collision'));
const s2 = [];
await page.goto(`${BASE}/sim-dev?drive=1`);
await page.waitForFunction(() => window.__simScene?.getRuleState?.() !== null, null, { timeout: 30000 });

// đo fps để đối chiếu ngưỡng decay |dh| < 0.002 (yaw mãe ≥ 0.002·fps)
out.scenarios.fps = await page.evaluate(() => new Promise((res) => {
  let n = 0;
  const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < 500) requestAnimationFrame(tick); else res(Math.round(n * 2)); };
  requestAnimationFrame(tick);
}));

// Shim RAF determinism: đăng ký qua addInitScript — chỉ kích hoạt khi URL có ?shim=1
// (Scenario 1 ?drive=1 và Scenario 3 ?big=1 vẫn dùng RAF thật). RAF thật trở thành hàng
// đợi; `__step(ms)` nâng đúng 1 frame game. `__t` là đồng hồ ảo thuần +ms/bước (KHÔNG
// resync wall-clock): evaluate round-trip thật 30–80ms từng khiến gap `real − __t` vượt
// 60ms → resync nhảy đột biến → dt spike → δ vượt 0.2 → latch xi-nhan trong pha rẽ →
// ruleEngine không bắn `nosignal` (cần signal === null suốt turnAccum 0.45 rad). Đồng hồ
// ảo đồng nghĩa dt luôn 30ms đều; lệch wall-clock chỉ ảnh hưởng phase đèn (noise vô hại).
await page.addInitScript(() => {
  if (!location.search.includes('shim=1')) return;
  const q = [];
  let rafId = 0;
  let __t = performance.now();
  window.__step = (ms = 30) => {
    const batch = q.slice();
    q.length = 0;
    __t += ms; // đồng hồ ảo thuần +ms mỗi bước — dt cho scene LUÔN đều = ms/1000
    for (const cb of batch) cb(__t);
  };
  window.requestAnimationFrame = (cb) => { q.push(cb); return ++rafId; };
});

let fired = false;
for (let attempt = 0; attempt <= 2 && !fired; attempt++) {
  if (attempt > 0) {
    s2.push({ step: `reload, thử lại lần ${attempt}`, ...(await snap()) });
  }
  // mỗi attempt = navigation sạch (keys Set reset theo navigation); polling: 100 vì
  // default polling của waitForFunction là RAF — mà RAF đã bị shim thay bằng hàng đợi.
  await page.goto(`${BASE}/sim-dev?drive=1&shim=1`);
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 30000, polling: 100 });

  // Boot pump: vehicle set async sau GLB load (fetch/promise — KHÔNG phụ thuộc RAF) nên
  // pump qua event loop thật: mỗi vòng nâng 2 frame 16ms + sleep 60ms ngoài cho fetch xong.
  let booted = false;
  for (let i = 0; i < 220 && !booted; i++) {
    booted = await page.evaluate(() => {
      window.__step(16);
      window.__step(16);
      return window.__simScene.getRuleState() !== null;
    });
    if (!booted) await sleep(60);
  }
  if (!booted) {
    s2.push({ step: `lần ${attempt} boot fail: ruleState vẫn null sau 220 vòng pump` });
    continue;
  }

  // Pha 1: giữ W đi thẳng tới x ≥ −30 (spawn x=−70; heading π/2 → sin h=1 → x tăng).
  // Synthetic KeyboardEvent — listener `driveKey` không kiểm tra isTrusted.
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })));
  let reached = false;
  let crashed = false;
  for (let i = 0; i < 320; i++) {
    const r1 = await page.evaluate(() => {
      window.__step(30);
      const ms = window.__simScene.getMapState();
      const rs = window.__simScene.getRuleState();
      return {
        x: ms.player?.x ?? 0,
        z: ms.player?.z ?? 0,
        kmh: rs?.speedKmh ?? 0,
        violations: (rs?.violations ?? []).map(v => v.type)
      };
    });
    if (isCrashed(r1)) {
      crashed = true;
      s2.push({ step: `lần ${attempt} BỊ ĐÂM khi đi thẳng (bước ${i})`, ...r1 });
      break;
    }
    if (i % 8 === 0) s2.push({ step: `lần ${attempt} thẳng bước ${i}`, x: Math.round(r1.x * 10) / 10, z: Math.round(r1.z * 10) / 10, kmh: r1.kmh, violations: r1.violations });
    if (r1.x >= -30) {
      reached = true;
      s2.push({ step: `lần ${attempt} tới điểm bắt đầu rẽ x≈${Math.round(r1.x)}`, ...r1 });
      break;
    }
  }
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })));
  if (crashed || !reached) {
    if (!crashed) s2.push({ step: `lần ${attempt} KHÔNG tới điểm rẽ sau 320 bước — phá vòng`, ...(await snap()) });
    continue;
  }

  // Pha 2: 2 nhịp A init → δ = 0.108; rồi luân phiên TUYỆT ĐỐI D-step / A-step
  // (input lái luôn ≠ 0 → không rơi nhánh decay STEER_CENTER; δ dao động {0.054, 0.108}
  // < ngưỡng latch 0.2 ⇒ xi-nhan KHÔNG bao giờ bật khi đang rẽ). Rẽ tới khi nosignal bắn.
  let cur = 'KeyA';
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })));
  await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), cur);
  await page.evaluate(() => { window.__step(30); window.__step(30); }); // init δ = 0.108
  for (let i = 0; i < 110 && !fired && !crashed; i++) {
    await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), cur);
    cur = cur === 'KeyA' ? 'KeyD' : 'KeyA';
    await page.evaluate((c) => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), cur);
    const r2 = await page.evaluate(() => {
      window.__step(30);
      const ms = window.__simScene.getMapState();
      const rs = window.__simScene.getRuleState();
      return {
        x: ms.player?.x ?? 0,
        z: ms.player?.z ?? 0,
        kmh: rs?.speedKmh ?? 0,
        signal: ms.player?.signal ?? null,
        violations: (rs?.violations ?? []).map(v => v.type)
      };
    });
    if (hasNosignal(r2)) fired = true;
    if (isCrashed(r2)) crashed = true;
    if (fired || crashed || i % 6 === 0) {
      s2.push({
        step: `lần ${attempt} rẽ bước ${i}${fired ? ' → nosignal ✓' : crashed ? ' → BỊ ĐÂM ✗' : ''}`,
        x: Math.round(r2.x * 10) / 10, z: Math.round(r2.z * 10) / 10, kmh: r2.kmh,
        signal: r2.signal, violations: r2.violations
      });
    }
  }
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
  });
}
s2.push({ step: fired ? 'nosignal đã ghi nhận ✓' : 'CHƯA xuất hiện nosignal ✗', ...(await snap()) });
await page.screenshot({ path: 'scripts/qa-shots/02-nosignal.png' });
await page.keyboard.up('KeyW');
out.scenarios.nosignal = { samples: s2, fired };

// ── SCENARIO 3: ?big=1 boot sạch (module graph + world build) ──
await page.goto(`${BASE}/sim-dev?drive=1&big=1`);
await page.waitForFunction(() => !!window.__simScene, null, { timeout: 40000 });
const s3 = await page.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  stats: window.__simScene.getStats?.() ?? null,
  mapStatePlayers: !!window.__simScene.getMapState().player
}));
out.scenarios.bigMap = s3;
await page.screenshot({ path: 'scripts/qa-shots/03-bigmap.png' });

await browser.close();
writeFileSync('scripts/qa-result.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
