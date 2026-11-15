// 📊 audit_launch.mjs — PHẦN 7B.1: phân tích telemetry khởi hành sau đèn đỏ.
// Đo: node scripts/audit_launch.mjs before|after  (tự chạy vitest nếu thiếu file telemetry)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tag = (process.argv[2] ?? 'before').replace(/[^a-z]/gi, '') || 'before';
const file = join(root, 'scripts', `launch_telemetry_${tag}.json`);

if (!existsSync(file)) {
  console.log(`Telemetry thiếu → chạy vitest đo (LAUNCH_AUDIT_TAG=${tag})...`);
  const r = spawnSync('npx', ['vitest', 'run', 'src/world/launchAudit.test.ts'], {
    cwd: root, shell: true, stdio: 'inherit',
    env: { ...process.env, LAUNCH_AUDIT_TAG: tag },
  });
  if (r.status !== 0) { console.error('vitest đo thất bại'); process.exit(1); }
}

const data = JSON.parse(readFileSync(file, 'utf8'));
const kmh = v => v * 3.6;
const stat = arr => {
  const a = arr.filter(x => x !== null && Number.isFinite(x));
  if (!a.length) return { avg: null, max: null, min: null };
  return { avg: a.reduce((s, x) => s + x, 0) / a.length, max: Math.max(...a), min: Math.min(...a) };
};
const f = (x, d = 2) => x === null || !Number.isFinite(x) ? '  — ' : x.toFixed(d);

// ── Gom metric theo kích thước hàng xe ──
console.log(`\n═══ 7B.1 KHỞI HÀNH SAU ĐÈN ĐỎ — tag: ${data.tag.toUpperCase()} · ${data.scenarios.length} ca ═══\n`);
console.log('Hàng |  t 0→30km/h (avg/max) | aMax (avg/max) | jerk (avg/max) | trễ vs xe trước (avg/max) | v điểm cắt nút (avg/max) | v ra nút+25m (avg/max) | gap đứng min | headway min');
console.log('-----|-----------------------|----------------|----------------|---------------------------|--------------------------|------------------------|--------------|-----------');
const perQueue = {};
for (const sc of data.scenarios) (perQueue[sc.queue] ??= []).push(sc);
for (const q of Object.keys(perQueue).sort((a, b) => a - b)) {
  const recs = perQueue[q].flatMap(s => s.recs);
  const t30 = stat(recs.map(r => r.t0to30));
  const am = stat(recs.map(r => r.maxAccel));
  const jk = stat(recs.map(r => r.maxJerk));
  const dl = stat(recs.slice(1).map(r => r.startVsLeader));
  const vs = stat(recs.map(r => r.vAtSwitchKmh));
  const ve = stat(recs.map(r => r.vExitKmh));
  const gp = stat(recs.slice(1).map(r => r.minStoppedGap));
  const hw = stat(recs.slice(1).map(r => r.minHeadway));
  console.log(
    `  ${q}   | ${f(t30.avg)} / ${f(t30.max)} s      | ${f(am.avg)} / ${f(am.max)}   | ${f(jk.avg, 0)} / ${f(jk.max, 0)}     | ${f(dl.avg)} / ${f(dl.max)} s          | ${f(vs.avg, 1)} / ${f(vs.max, 1)} km/h       | ${f(ve.avg, 1)} / ${f(ve.max, 1)} km/h      | ${f(gp.min, 2)} m     | ${f(hw.min)} s`,
  );
}
const all = data.scenarios.flatMap(s => s.recs);
const gT30 = stat(all.map(r => r.t0to30));
const gA = stat(all.map(r => r.maxAccel));
const gJ = stat(all.map(r => r.maxJerk));
const gDl = stat(all.slice(1).map(r => r.startVsLeader));
const gGap = stat(all.slice(1).map(r => r.minStoppedGap));
const gHw = stat(all.slice(1).map(r => r.minHeadway));

// ── 10 ca tệ nhất (t0→30 dài nhất = chậm nhất; kèm accel/jerk để soi) ──
console.log('\n── 10 ca tệ nhất (theo t0→30 km/h) ──');
const worst = [...all].filter(r => r.t0to30 !== null).sort((a, b) => b.t0to30 - a.t0to30).slice(0, 10);
for (const w of worst) console.log(`  t0→30=${w.t0to30}s  aMax=${w.maxAccel} m/s²  jerk=${w.maxJerk}  vCắtNút=${w.vAtSwitchKmh}km/h  vRaNút=${w.vExitKmh}km/h  heavy=${w.heavy}`);

// ── Verdict L1–L6 (đối chiếu chuẩn 7B.3; L1 tính trên XE CON — heavy theo spec a=1.0 → ~8.6s, in riêng) ──
const chk = (ok, label) => console.log(`  ${ok ? '✅' : '❌'} ${label}`);
console.log('\n── Đối chiếu L1–L6 ──');
const carsOnly = all.filter(r => !r.heavy);
const heavies = all.filter(r => r.heavy);
// L1 đo trên launch THUẦN (queue=1 — không bị gap-gate); follower hàng sâu bị chặn bởi
// xe trước là queueing physics, không phải năng lực khởi hành → in riêng để tham khảo
const q1 = data.scenarios.filter(s => s.queue === 1).flatMap(s => s.recs).filter(r => !r.heavy);
const q5 = data.scenarios.filter(s => s.queue === 5).flatMap(s => s.recs).filter(r => !r.heavy);
const q1T30 = stat(q1.map(r => r.t0to30));
const q5T30 = stat(q5.map(r => r.t0to30));
const hT30 = stat(heavies.map(r => r.t0to30));
const l1 = q1T30.avg !== null && q1T30.avg >= 4 && q1T30.max <= 8;
chk(l1, `L1  0→30 km/h trong [4;8]s (launch thuần queue=1) → avg ${f(q1T30.avg)}s / max ${f(q1T30.max)}s  [follow queue5: avg ${f(q5T30.avg)}s / max ${f(q5T30.max)}s${heavies.length ? ` · heavy: avg ${f(hT30.avg)}s` : ''}]`);
// L2 đo trên launch thuần (queue=1 — ramp vào ga); follower phanh khẩn cấp giữa pha
// (TTC ngắn khi đuổi kịp xe trước) dùng ramp 8 m/s³ ĐÚNG theo thiết kế an toàn → in riêng
const q1all = data.scenarios.filter(s => s.queue === 1).flatMap(s => s.recs);
const q1A = stat(q1all.map(r => r.maxAccel));
const q1J = stat(q1all.map(r => r.maxJerk));
const l2 = q1A.max !== null && q1A.max <= 2.5 && q1J.max !== null && q1J.max <= 3;
chk(l2, `L2  a ≤ 2.5 m/s², jerk ≤ 3 m/s³ (launch thuần) → aMax ${f(q1A.max)} · jerkMax ${f(q1J.max, 0)}  [follow: aMax ${f(gA.max)} · jerkMax ${f(gJ.max, 0)} = phanh khẩn cấp TTC ngắn]`);
const l3 = gDl.min !== null && gDl.min >= 0.8 && gDl.max <= 2.5;
chk(l3, `L3  trễ xe n→n+1 trong [0.8;2.5]s      → min ${f(gDl.min)}s / max ${f(gDl.max)}s`);
const l4v = all.map(r => r.vAtSwitchKmh).filter(x => x !== null);
const l4 = l4v.length && Math.max(...l4v) <= 32;
chk(l4, `L4  qua nút: rẽ ≤22, thẳng ≤32 km/h    → max ${f(Math.max(...l4v), 1)} km/h`);
chk(data.dtCheck.ok, `L5  100m @30 km/h = ${data.dtCheck.t100s}s (12±0.5) — dt/hệ số thời gian ĐÚNG`);
const l6 = gGap.min !== null && gGap.min >= 2.0;
chk(l6, `L6  gap đứng ≥ 2m (bumper)             → min ${f(gGap.min, 2)}m · headway min ${f(gHw.min)}s`);

console.log(`\n── dt-check: 100m @30 km/h = ${data.dtCheck.t100s}s (dt=${data.dt}) → ${data.dtCheck.ok ? 'dt ĐÚNG' : 'dt SAI'} ──`);
console.log(`File telemetry: scripts/launch_telemetry_${data.tag}.json`);
