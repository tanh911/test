// 💡 audit_lamp_orientation.mjs — PHẦN 8.1: phân tích hướng cột đèn đường.
// Đo: node scripts/audit_lamp_orientation.mjs before|after (tự chạy vitest dump nếu thiếu file)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tag = (process.argv[2] ?? 'before').replace(/[^a-z]/gi, '') || 'before';
const file = join(root, 'scripts', `lamp_telemetry_${tag}.json`);

if (!existsSync(file)) {
  console.log(`Telemetry thiếu → chạy vitest dump (LAMP_AUDIT_TAG=${tag})...`);
  const r = spawnSync('npx', ['vitest', 'run', 'src/world/lampAuditDump.test.ts'], {
    cwd: root, shell: true, stdio: 'inherit',
    env: { ...process.env, LAMP_AUDIT_TAG: tag },
  });
  if (r.status !== 0) { console.error('vitest dump thất bại'); process.exit(1); }
}

const data = JSON.parse(readFileSync(file, 'utf8'));
const lamps = data.lamps.filter(l => l.roadId && l.side);
const sl = lamps.filter(l => l.side === 'left');
const sr = lamps.filter(l => l.side === 'right');
const f1 = x => x.toFixed(1);

console.log(`\n═══ PHẦN 8.1 HƯỚNG CỘT ĐÈN ĐƯỜNG — tag: ${data.tag.toUpperCase()} ═══`);
console.log(`Props tổng: ${data.total} · cột có hướng đo được (street_lamp + bench): ${lamps.length}`);
console.log(`Idempotency P5 (placement 3 lần khớp từng bit): ${data.stable ? '✅ STABLE' : '❌ KHÔNG ỔN ĐỊNH'}`);
console.log(`Chóa đèn headZ = ${data.headZ} m dọc +Z local\n`);

// phân loại theo góc lệch (0° = tay đèn chỉ THẲNG vào tâm đường)
const dev = l => l.armAngleDeg;
const bucket = (lo, hi) => lamps.filter(l => dev(l) >= lo && dev(l) < hi);
console.log('── Phân bố góc lệch tay-đèn vs pháp-tuyến-vào-tâm-đường ──');
console.log(`  ≤ 15°  (ĐÚNG, P1): ${bucket(0, 15.0001).length}`);
console.log(`  15–60° (lệch):     ${bucket(15.0001, 60).length}`);
console.log(`  60–120° (sai trục model ~90°): ${bucket(60, 120).length}`);
console.log(`  120–150° (lệch nặng): ${bucket(120, 150).length}`);
console.log(`  ≥ 150° (ĐẢO DẤU ~180°): ${bucket(150, 180.0001).length}`);

console.log('\n── Tách theo SIDE ──');
for (const [name, arr] of [['trái (left)', sl], ['phải (right)', sr]]) {
  if (!arr.length) continue;
  const wrong = arr.filter(l => dev(l) > 15).length;
  const avg = arr.reduce((s, l) => s + dev(l), 0) / arr.length;
  console.log(`  ${name}: ${arr.length} cột · lệch >30°: ${arr.filter(l => dev(l) > 30).length} · lệch >15°: ${wrong} · góc TB: ${f1(avg)}°`);
}
const wL = sl.filter(l => dev(l) > 30).length, wR = sr.filter(l => dev(l) > 30).length;
console.log(`  → ${wL > 0 && wR > 0 ? 'CẢ HAI phía đều sai (lỗi hệ thống: trục model/hằng số yaw)' : wL + wR === 0 ? 'CẢ HAI phía ĐÚNG' : 'CHỈ MỘT phía sai (lỗi dấu theo side)'}`);

// P2: chóa đèn trên mặt đường?
const headInside = lamps.filter(l => l.inwardFromEdge >= 0.3).length;
const headOut = lamps.filter(l => l.inwardFromEdge < 0.3);
console.log(`\n── P2 chóa trên mặt đường (vào từ mép ≥ 0.3m): ${headInside}/${lamps.length} ✓ · ${headOut.length} ngoài (inward TB ${f1(headOut.length ? headOut.reduce((s, l) => s + l.inwardFromEdge, 0) / headOut.length : 0)}m)`);
// P3: chân cột ngoài vỉa hè?
const offSW = lamps.filter(l => l.poleOffSidewalk);
console.log(`── P3 chân cột trên vỉa hè (cách mép ≤ 3m): ${lamps.length - offSW.length}/${lamps.length} ✓ · ${offSW.length} cột lạc`);

console.log('\n── 10 ca tệ nhất (góc lệch lớn nhất) ──');
const worst = [...lamps].sort((a, b) => dev(b) - dev(a)).slice(0, 10);
for (const w of worst) {
  console.log(`  ${w.roadId} @s=${w.s} side=${w.side} góc=${f1(w.armAngleDeg)}° chóa inward=${w.inwardFromEdge}m`);
}

// Verdict
console.log('\n── Verdict ──');
const chk = (ok, label) => console.log(`  ${ok ? '✅' : '❌'} ${label}`);
chk(bucket(0, 15.0001).length === lamps.length, `P1 100% cột lệch ≤ 15° (hiện: ${bucket(0, 15.0001).length}/${lamps.length})`);
chk(headInside === lamps.length, `P2 chóa trên mặt đường ≥ 0.3m từ mép (hiện: ${headInside}/${lamps.length})`);
chk(offSW.length === 0, `P3 0 cột lạc ngoài vỉa hè (hiện: ${offSW.length})`);
chk(data.stable, 'P5 placement idempotent 3 lần');
console.log(`\nFile telemetry: scripts/lamp_telemetry_${data.tag}.json`);
