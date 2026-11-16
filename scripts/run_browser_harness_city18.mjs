// 🤖 run_browser_harness_city18.mjs — Chạy autopilot xe THẬT trên trình duyệt Playwright
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('qa-autopilot', { recursive: true });

const BASE_URL = 'http://127.0.0.1:3000';
const SEED = '20261115';

async function runAutopilotSession(browser, runId) {
  console.log(`\n=== BẮT ĐẦU RUN ${runId} TRÊN XE THẬT (Chromium + Three.js GLB) ===`);
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  
  page.on('pageerror', (e) => console.log(`  [pageerror run${runId}]`, String(e).slice(0, 160)));

  const url = `${BASE_URL}/sim-dev?map=city18&drive=1&autopilot=1&seed=${SEED}&scenario=clean`;
  await page.goto(url);
  await page.bringToFront();

  // Đợi __simScene và xe thật khởi tạo xong
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 30000 });
  await page.waitForFunction(() => {
    const sc = window.__simScene;
    return sc && sc.vehicle !== null && sc.vehicle !== undefined;
  }, null, { timeout: 30000 });

  // Đợi 2 giây để Three.js ổn định
  await page.waitForTimeout(2000);

  // Bắt đầu autopilot
  const started = await page.evaluate(() => {
    const sc = window.__simScene;
    sc.autopilot?.start('clean');
    return sc.autopilot ? sc.autopilot.telemetry().active : false;
  });
  console.log(`Run ${runId} Autopilot started:`, started);

  const ticks = [];
  const visitedNodes = new Set();
  let done = false;
  let guard = 0;
  const maxPolls = 1500; // Mỗi poll ~300ms => tối đa ~450s sim
  let lastViolCount = 0;
  const violations = [];

  // A4 tracking
  let tStart100 = null;
  let tEnd100 = null;
  let zStart100 = null;
  let a4Duration = null;

  while (!done && guard < maxPolls) {
    guard++;
    await page.waitForTimeout(150); // poll mỗi 150ms

    const data = await page.evaluate(({ lastCount }) => {
      const sc = window.__simScene;
      const at = sc.autopilot?.telemetry();
      const v = sc.vehicle;
      const st = v ? v.state : null;
      const vAll = sc.getViolations ? sc.getViolations() : [];
      const vNew = vAll.slice(lastCount);
      return {
        at,
        st: st ? { x: st.x, z: st.z, speed: st.speed, heading: st.heading, t: st.t, gear: st.gear } : null,
        steerAngle: v ? v.steerAngle : 0,
        signal: v ? v.signal : null,
        vNew,
        vTotal: vAll.length,
        vAll
      };
    }, { lastCount: lastViolCount });

    if (!data.st || !data.at) continue;

    lastViolCount = data.vTotal;
    if (data.vNew && data.vNew.length > 0) {
      for (const vn of data.vNew) {
        violations.push(vn);
        console.log(`  [VIOLATION t=${vn.t.toFixed(1)}s] ${vn.severity.toUpperCase()} ${vn.type}: "${vn.message}" @ (${vn.x.toFixed(1)}, ${vn.z.toFixed(1)})`);
      }
    }

    ticks.push({
      t: data.st.t,
      x: data.st.x,
      z: data.st.z,
      speed: data.st.speed,
      heading: data.st.heading,
      steerAngle: data.steerAngle,
      roadId: data.at.roadId
    });

    // Đo A4 trên đoạn r01_start (Georgenstraße Süd, L=120m, chạy thẳng theo hướng Z tăng)
    if (data.at.roadId === 'r01_start' && Math.abs(data.st.speed - 30 / 3.6) < 0.5) {
      if (tStart100 === null) {
        tStart100 = data.st.t;
        zStart100 = data.st.z;
      } else if (tEnd100 === null && (data.st.z - zStart100) >= 100.0) {
        tEnd100 = data.st.t;
        a4Duration = tEnd100 - tStart100;
        console.log(`  [A4 MEASURED ON REAL CAR] 100m @ 30 km/h: ${a4Duration.toFixed(2)}s (Target 12.0s)`);
      }
    }

    if (data.at.done) {
      done = true;
      console.log(`Run ${runId} done trigger reached at t=${data.st.t.toFixed(1)}s!`);
      break;
    }
  }

  const finalTel = await page.evaluate(() => {
    const sc = window.__simScene;
    return {
      at: sc.autopilot?.telemetry(),
      vAll: sc.getViolations ? sc.getViolations() : []
    };
  });

  await page.close();

  return {
    runId,
    done,
    simTime: ticks.length > 0 ? ticks[ticks.length - 1].t : 0,
    ticks,
    violations: finalTel.vAll,
    a4Duration
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const run1 = await runAutopilotSession(browser, 1);
    const run2 = await runAutopilotSession(browser, 2);

    // So sánh sai lệch quỹ đạo từng tick giữa Run 1 và Run 2
    let maxPosDev = 0;
    const len = Math.min(run1.ticks.length, run2.ticks.length);
    for (let i = 0; i < len; i++) {
      const p1 = run1.ticks[i];
      const p2 = run2.ticks[i];
      const d = Math.hypot(p1.x - p2.x, p1.z - p2.z);
      if (d > maxPosDev) maxPosDev = d;
    }

    const report = {
      seed: SEED,
      run1: {
        done: run1.done,
        simTime: run1.simTime,
        ticksCount: run1.ticks.length,
        violationsCount: run1.violations.length,
        a4Duration: run1.a4Duration
      },
      run2: {
        done: run2.done,
        simTime: run2.simTime,
        ticksCount: run2.ticks.length,
        violationsCount: run2.violations.length,
        a4Duration: run2.a4Duration
      },
      maxTickPosDeviationMeters: maxPosDev,
      violations: run1.violations
    };

    writeFileSync('qa-autopilot/real_car_results.json', JSON.stringify(report, null, 2), 'utf-8');
    console.log('\n=== TỔNG KẾT BROWSER HARNESS TRÊN XE THẬT ===');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})();
