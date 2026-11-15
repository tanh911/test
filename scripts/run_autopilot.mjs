// 🤖 run_autopilot.mjs — PHẦN 9: chạy autopilot tuyến thi trong trang sim thật (playwright),
// chụp ảnh checkpoint, ghi qa-autopilot/manifest.json, tự kiểm A1–A6.
// Chạy: node scripts/run_autopilot.mjs [--seed 1] [--scenario clean] [--no-capture] [--runs 2]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'qa-autopilot');
mkdirSync(outDir, { recursive: true });

// ── args ──
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const seed = arg('seed', '1');
const scenario = arg('scenario', 'clean');
const doCapture = !process.argv.includes('--no-capture');
const runs = parseInt(arg('runs', '2'), 10);
const maxGuard = parseInt(arg('maxGuard', '4000'), 10);
const BASE_URL = process.env.SIM_URL ?? 'http://localhost:3000';

const route = JSON.parse(readFileSync(join(root, 'qa-autopilot/route.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── một lần chạy tuyến trong 1 trang ──
async function runOnce(browser, runIdx, withCapture) {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  page.on('pageerror', (e) => console.log(`  [pageerror run${runIdx}]`, String(e).slice(0, 160)));
  page.on('crash', () => console.log(`  [crash run${runIdx}] tab crashed`));
  const url = `${BASE_URL}/sim-dev?map=berlin&drive=1&raw=1&autopilot=1&seed=${seed}&scenario=${scenario}`;
  await page.goto(url);
  await page.bringToFront(); // headless: tránh throttle setTimeout background-tab
  await page.waitForFunction(() => !!window.__simScene, null, { timeout: 90000 });
  // đợi vehicle sẵn sàng (autopilot.attach sau khi GLB load)
  await page.waitForFunction(() => {
    const sc = window.__simScene;
    return sc && sc.vehicle !== null && sc.vehicle !== undefined;
  }, null, { timeout: 60000 });
  await sleep(3000); // ổn định frame đầu

  const started = await page.evaluate((scn) => {
    const sc = window.__simScene;
    sc.autopilot?.start(scn);
    return sc.autopilot ? sc.autopilot.telemetry().active : false;
  }, scenario);
  if (!started) throw new Error('autopilot không start được — thiếu route/hook?');

  const wallStart = Date.now();
  const checkpoints = [];
  const samples = []; // fps/draws sampling
  const anomalies = [];
  let captured = 0;
  let lastSimT = 0;
  let lastViolCount = 0;
  const allViol = [];
  let simT0 = null;
  let doneFlag = false;
  let guard = 0;

  while (!doneFlag && guard < maxGuard) {
    guard++;
    await sleep(300);
    const tel = await page.evaluate(({ lastCount }) => {
      const sc = window.__simScene;
      const rs = sc.getRuleState();
      const st = sc.getStats();
      const pd = sc.getPosDebug();
      const at = sc.autopilot?.telemetry() ?? null;
      const vAll = sc.getViolations?.() ?? [];
      const vNew = vAll.slice(lastCount).map(v => ({ t: +v.t.toFixed(1), type: v.type, sev: v.severity, x: +v.x.toFixed(0), z: +v.z.toFixed(0), msg: v.message }));
      const npcs = sc.getMapState().npcs ?? [];
      const p = sc.vehicle?.state;
      let npcAhead = null;
      if (p) {
        const fh = Math.sin(p.heading), fz = Math.cos(p.heading);
        for (const n of npcs) {
          const dx = n.x - p.x, dz = n.z - p.z;
          const fwd = dx * fh + dz * fz;
          if (fwd > 1 && fwd < 20 && Math.hypot(dx, dz) < 8) npcAhead = Math.min(npcAhead ?? 99, +fwd.toFixed(1));
        }
      }
      return { rs: rs ? { major: rs.violationsBySeverity?.major?.length ?? 0, minor: rs.violationsBySeverity?.minor?.length ?? 0, limit: rs.speedLimit, summary: rs.summary, signal: rs.signal } : null, st, pd, at, vNew, vCount: vAll.length, npcAhead }
    }, { lastCount: lastViolCount });
    const { rs, st, pd, at, vNew, vCount, npcAhead } = tel;
    lastViolCount = vCount ?? lastViolCount;
    if (!at) throw new Error('mất telemetry autopilot');
    if (simT0 === null && at.simTime > 0) simT0 = { sim: at.simTime, wall: Date.now() };
    samples.push({ t: +at.simTime.toFixed(1), fps: st.fps, draws: st.drawCalls, cells: st.cellsLoaded, x: +pd.x.toFixed(1), z: +pd.z.toFixed(1), speed: +at.speed.toFixed(2), step: at.stepIdx, road: at.roadId, s: +at.s.toFixed(1), phase: at.phase, dStop: at.distToStopLine, signal: rs?.signal ?? null, waitingRed: !!at.waitingRed, npcAhead, vNew });
    if (vNew.length) allViol.push(...vNew);
    if (at.events?.some(e => e.kind === 'stuck' && !anomalies.some(a => a.detail === e.detail))) {
      const ev = at.events.find(e => e.kind === 'stuck' && !anomalies.some(a => a.detail === e.detail));
      if (ev) anomalies.push({ t: ev.t, kind: 'stuck', detail: ev.detail, x: ev.x, z: ev.z });
    }
    // checkpoint trigger → pause + chờ chunk + chụp
    const cpId = await page.evaluate(() => window.__simScene.autopilot?.consumeTriggeredCp() ?? null);
    if (cpId !== null && cpId !== undefined) {
      const cp = route.checkpoints.find(c => c.id === cpId);
      await page.evaluate(() => window.__simScene.autopilot?.pause());
      // chờ chunk ổn định (không sleep cố định): cellsLoaded đứng yên 3 lần poll
      let lastCells = -1, stable = 0;
      for (let i = 0; i < 40; i++) {
        await sleep(700);
        const cells = await page.evaluate(() => window.__simScene.getStats().cellsLoaded);
        if (cells === lastCells) { stable++; if (stable >= 3) break; }
        else { stable = 0; lastCells = cells; }
      }
      await sleep(800); // xe đã ổn định: sim đang pause (đứng yên ≥0.5s thỏa)
      let imgName = null;
      if (withCapture && doCapture) {
        const safe = (cp.roadName || cp.roadId).replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 28);
        imgName = `${String(cpId).padStart(2, '0')}_${cp.type}_${safe}_${cp.roadId}.png`;
        // 1. ảnh camera người lái (hood — nhìn đường rõ, không bị cụm đồng hồ che)
        await page.evaluate(() => {
          window.__simScene.autopilot?.setCam('hood');
          window.__simScene.autopilot?.requestRender();
        });
        await sleep(450);
        await page.evaluate(() => window.__simScene.autopilot?.requestRender());
        await sleep(120);
        await page.screenshot({ path: join(outDir, imgName) });
        // 2. ảnh top-down cùng thời điểm
        await page.evaluate(() => {
          window.__simScene.autopilot?.setDebugCam('topdown');
          window.__simScene.autopilot?.requestRender();
        });
        await sleep(450);
        await page.evaluate(() => window.__simScene.autopilot?.requestRender());
        await sleep(120);
        const topName = imgName.replace('.png', '_top.png');
        await page.screenshot({ path: join(outDir, topName) });
        await page.evaluate(() => {
          window.__simScene.autopilot?.setDebugCam('none');
          window.__simScene.autopilot?.setCam('hood');
        });
        captured += 2;
      }
      const cpTel = await page.evaluate(() => {
        const sc = window.__simScene;
        const rs2 = sc.getRuleState();
        const at2 = sc.autopilot?.telemetry();
        const pd2 = sc.getPosDebug();
        return {
          rs: rs2 ? { major: rs2.violationsBySeverity?.major ?? [], minor: rs2.violationsBySeverity?.minor ?? [], limit: rs2.speedLimit } : null,
          at: at2, pd: pd2,
        };
      });
      const majorList = cpTel.rs?.major ?? [];
      const minorList = cpTel.rs?.minor ?? [];
      checkpoints.push({
        cpId, type: cp.type, roadId: cp.roadId, roadName: cp.roadName,
        img: imgName,
        simTime: cpTel.at?.simTime ?? null, wallTime: Math.round((Date.now() - wallStart) / 1000),
        x: +cpTel.pd.x.toFixed(2), z: +cpTel.pd.z.toFixed(2), headingDeg: cpTel.pd.headingDeg,
        roadIdHud: cpTel.pd.road, roadNameHud: cpTel.pd.roadName ?? '',
        speed: cpTel.at?.speed ?? null, speedKmh: cpTel.at ? Math.round(cpTel.at.speed * 3.6) : null,
        speedLimit: cpTel.rs?.limit ?? null,
        phase: cpTel.at?.phase ?? null, distToStopLine: cpTel.at?.distToStopLine ?? null,
        steerAngle: null, waitingRed: cpTel.at?.waitingRed ?? false,
        ruleMajor: majorList.length, ruleMinor: minorList.length,
        newViolations: [
          ...majorList.slice(-2).map(v => ({ sev: 'major', type: v.type, msg: v.message })),
          ...minorList.slice(-2).map(v => ({ sev: 'minor', type: v.type, msg: v.message })),
        ],
        fps: null,
      });
      await page.evaluate(() => window.__simScene.autopilot?.resume());
    }
    // rule violations giữa chừng (không ở checkpoint)
    if (rs && (rs.major > (checkpoints.at(-1)?.ruleMajor ?? 0))) {
      // ghi vào anomaly — báo cáo cuối
    }
    doneFlag = at.done;
    lastSimT = at.simTime;
    if (process.env.AP_TRACE && guard % 10 === 0) console.log(`  t=${at.simTime?.toFixed(0)} step=${at.stepIdx} road=${at.roadId} s=${at.s} v=${at.speed?.toFixed(1)} pos=(${pd.x?.toFixed(0)},${pd.z?.toFixed(0)}) dbg=${JSON.stringify(at.dbg)}`);
    if (guard === maxGuard - 1) anomalies.push({ t: at.simTime, kind: 'timeout', detail: `chạy quá ${maxGuard} vòng poll mà chưa done`, x: at.events?.at(-1)?.x ?? 0, z: at.events?.at(-1)?.z ?? 0 });
  }

  // tổng kết route
  const final = await page.evaluate(() => {
    const sc = window.__simScene;
    const rs = sc.getRuleState();
    const at = sc.autopilot?.telemetry();
    return {
      major: rs?.violationsBySeverity?.major ?? [],
      minor: rs?.violationsBySeverity?.minor ?? [],
      summary: rs?.summary ?? '', bestanden: rs?.bestanden ?? false,
      simTime: at?.simTime ?? 0, events: at?.events ?? [],
    };
  });
  const wallSec = Math.round((Date.now() - wallStart) / 1000);
  // dt check: (a) sim/wall ratio (thông tin throughput harness — headless render-skip);
  // (b) thời gian SIM để đi 100m ở cruise ~30 km/h — đúng chuẩn A4 (12 ± 1.5s sim-time)
  const simPerWall = simT0 && lastSimT > 0 ? +(lastSimT / ((Date.now() - wallStart) / 1000)).toFixed(2) : null;
  let t100 = null;
  {
    // quét cửa sổ cruise: speed 7.2–9.5 m/s liên tục, tổng quãng đường ≥ 100m
    let seg = [];
    for (const s of samples) {
      if (s.speed >= 7.2 && s.speed <= 9.5 && s.x !== undefined) seg.push(s);
      else { if (seg.length) { const d = Math.hypot(seg.at(-1).x - seg[0].x, seg.at(-1).z - seg[0].z); if (d >= 100) { t100 = +(100 / (d / (seg.at(-1).t - seg[0].t))).toFixed(1); break; } seg = []; } }
    }
    if (t100 === null && seg.length) {
      const d = Math.hypot(seg.at(-1).x - seg[0].x, seg.at(-1).z - seg[0].z);
      if (d >= 100) t100 = +(100 / (d / (seg.at(-1).t - seg[0].t))).toFixed(1);
    }
  }
  const fpsVals = samples.map(s2 => s2.fps).filter(f => f > 0);
  const routeLen = route.steps.reduce((acc, st2) => {
    // quãng đường theo steps — dùng precomputed từ planner (route.json không có len — tính lại nhỏ)
    return acc;
  }, 0);
  await page.close();
  writeFileSync(join(outDir, `gd0v2_samples_run${runIdx}.json`), JSON.stringify({ seed, scenario, runIdx, samples, violations: allViol }, null, 1));
  console.log(`   samples: ${samples.length} · violations: ${allViol.length} → gd0v2_samples_run${runIdx}.json`);
  return {
    runIdx, checkpoints, anomalies, captured, samples, allViol,
    totalSimTime: final.simTime, wallSec, simPerWall,
    ruleMajor: final.major, ruleMinor: final.minor, summary: final.summary, bestanden: final.bestanden,
    fpsMin: fpsVals.length ? Math.min(...fpsVals) : null,
    fpsAvg: fpsVals.length ? +(fpsVals.reduce((a, b) => a + b, 0) / fpsVals.length).toFixed(1) : null,
    t100SimSec: t100,
    events: final.events,
  };
}

// ── main ──
const results = [];
// channel 'chromium' = FULL browser headless (headless-shell hay crash tab sau vài phút
// với scene nặng + loop 30ms); fps 28 vs 12 → sim ~2.8x realtime
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--disable-dev-shm-usage'] });
for (let i = 1; i <= runs; i++) {
  const withCapture = doCapture && i === 1;
  console.log(`── Run ${i}/${runs} (capture=${withCapture}, seed=${seed}, scenario=${scenario}) ──`);
  let r;
  try {
    r = await runOnce(browser, i, withCapture);
  } catch (e) {
    console.log(`   RUN CRASHED: ${String(e).slice(0, 200)}`);
    results.push({ runIdx: i, checkpoints: [], anomalies: [{ kind: 'browser_crash', detail: String(e).slice(0, 160), t: 0, x: 0, z: 0 }], captured: 0, totalSimTime: 0, wallSec: 0, simPerWall: null, ruleMajor: [], ruleMinor: [], summary: '', bestanden: false, fpsMin: null, fpsAvg: null, t100SimSec: null, events: [] });
    continue;
  }
  console.log(`   done sim=${r.totalSimTime}s wall=${r.wallSec}s · CP ${r.checkpoints.length} · ảnh ${r.captured} · rule ${r.ruleMajor.length}major/${r.ruleMinor.length}minor · fps avg ${r.fpsAvg}`);
  results.push(r);
}
await browser.close();

// ── A1: deterministic giữa 2 run ──
const a1 = { pass: null, maxDiff: 0, details: [] };
if (results.length >= 2) {
  const [r1, r2] = results;
  if (r1.checkpoints.length !== r2.checkpoints.length || r1.checkpoints.length === 0) {
    a1.pass = false; a1.details.push(`số checkpoint lệch: ${r1.checkpoints.length} vs ${r2.checkpoints.length}`);
  } else {
    for (let i = 0; i < r1.checkpoints.length; i++) {
      const c1 = r1.checkpoints[i], c2 = r2.checkpoints[i];
      const d = Math.hypot(c1.x - c2.x, c1.z - c2.z);
      a1.maxDiff = Math.max(a1.maxDiff, +d.toFixed(2));
      if (d > 0.5) a1.details.push(`CP${c1.cpId} lệch ${d.toFixed(2)}m`);
    }
    a1.pass = a1.maxDiff <= 0.5;
  }
}

// ── tổng manifest (run 1 làm chính) ──
const r1 = results[0];
const manifest = {
  seed, scenario, generatedAt: new Date().toISOString(),
  route: { steps: route.steps.length, checkpoints: route.checkpoints.length, coverage: route.coverage },
  checkpoints: r1.checkpoints,
  anomalies: r1.anomalies,
  totals: {
    simTimeSec: r1.totalSimTime, wallSec: r1.wallSec, simPerWall: r1.simPerWall,
    ruleMajor: r1.ruleMajor.length, ruleMinor: r1.ruleMinor.length,
    summary: r1.summary, bestanden: r1.bestanden,
    images: r1.captured,
  },
  checks: {
    A1_determinism: a1,
    A2_route_completed: { pass: r1.checkpoints.length >= route.checkpoints.length * 0.8 && r1.anomalies.filter(a => a.kind === 'timeout').length === 0, note: `${r1.checkpoints.length}/${route.checkpoints.length} CP trigger · anomalies ${r1.anomalies.length}` },
    A3_clean_no_faults: { pass: scenario !== 'clean' ? 'n/a' : r1.ruleMajor.length === 0 && r1.ruleMinor.length === 0, major: r1.ruleMajor, minor: r1.ruleMinor },
    A4_dt_ratio: { pass: r1.t100SimSec !== null && Math.abs(r1.t100SimSec - 12) <= 1.5, t100SimSec: r1.t100SimSec, simPerWall: r1.simPerWall, note: '100m @~30 km/h theo ĐỒNG HỒ SIM (chuẩn 12±1.5s); sim/wall = throughput harness headless (render-skip), không phải hệ số thời gian game' },
    A5_roadName_sample: { note: 'đối chiếu thủ công trên ảnh — xem báo cáo' },
    A6_fps: { min: r1.fpsMin, avg: r1.fpsAvg, note: 'headless software-GL — thấp hơn máy thật' },
  },
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// ── báo cáo console ──
console.log('\n═══ A1–A6 ═══');
console.log(`A1 deterministic: ${manifest.checks.A1_determinism.pass ? '✅' : '❌'} maxDiff=${a1.maxDiff}m ${a1.details.slice(0, 3).join('; ')}`);
console.log(`A2 route hoàn thành: ${manifest.checks.A2_route_completed.pass ? '✅' : '❌'} — ${manifest.checks.A2_route_completed.note}`);
console.log(`A3 clean 0 lỗi: ${manifest.checks.A3_clean_no_faults.pass === true ? '✅' : manifest.checks.A3_clean_no_faults.pass === false ? '❌' : 'n/a'} — major ${r1.ruleMajor.length}, minor ${r1.ruleMinor.length}`);
for (const v of r1.ruleMajor.slice(0, 5)) console.log(`   major: ${v.type} @(${Math.round(v.x)},${Math.round(v.z)}) t=${Math.round(v.t)}s — ${v.message}`);
for (const v of r1.ruleMinor.slice(0, 5)) console.log(`   minor: ${v.type} @(${Math.round(v.x)},${Math.round(v.z)}) t=${Math.round(v.t)}s — ${v.message}`);
console.log(`A4 dt: ${manifest.checks.A4_dt_ratio.pass ? '✅' : '❌'} 100m@30km/h = ${r1.t100SimSec}s sim (chuẩn 12±1.5) · throughput ${r1.simPerWall}x wall`);
console.log(`A6 fps: min ${r1.fpsMin} · avg ${r1.fpsAvg}`);
console.log(`\nmanifest → qa-autopilot/manifest.json · ảnh ${r1.captured}`);
console.log(`Anomalies: ${r1.anomalies.length ? JSON.stringify(r1.anomalies, null, 1).slice(0, 600) : 'không có'}`);
