// ── Scenario types ──────────────────────────────────────────────────────────
// Each scenario triggers when player reaches `triggerZ` (world units traveled)
// and resolves when player passes `resolveZ`

export const SCENARIOS = [
  {
    id: 's1', type: 'SPEED_LIMIT', limit: 50,
    triggerZ: 80, resolveZ: 200,
    sign: 'limit_50',
    warn: '⚠️ Khu vực 50 km/h — Giảm tốc độ!',
    passMsg: '✅ Tốt! Đã giảm đúng tốc độ.',
    failMsg: '❌ Vượt tốc độ! (-10 điểm)',
    failPenalty: 10,
    check: (speed) => speed <= 55, // allow 5 km/h tolerance
  },
  {
    id: 's2', type: 'TRAFFIC_LIGHT',
    triggerZ: 250, resolveZ: 310, lightDuration: 4,
    warn: '🚦 Đèn đỏ — Dừng lại!',
    passMsg: '✅ Dừng đúng luật! (+5 điểm)',
    passBonus: 5,
    failMsg: '❌ Vượt đèn đỏ! (-25 điểm)',
    failPenalty: 25,
    check: (speed) => speed < 2,
  },
  {
    id: 's3', type: 'STOP_SIGN',
    triggerZ: 420, resolveZ: 470,
    sign: 'stop',
    warn: '🛑 Biển STOP — Dừng hẳn xe rồi mới đi!',
    passMsg: '✅ Dừng đúng! (+5 điểm)',
    passBonus: 5,
    failMsg: '❌ Không dừng hẳn tại STOP! (-20 điểm)',
    failPenalty: 20,
    check: (speed) => speed < 1,
  },
  {
    id: 's4', type: 'YIELD',
    triggerZ: 580, resolveZ: 640,
    sign: 'yield',
    warn: '⚠️ Nhường đường (Vorfahrt) — Giảm tốc & nhường!',
    passMsg: '✅ Nhường đúng!',
    failMsg: '❌ Không nhường đường! (-15 điểm)',
    failPenalty: 15,
    check: (speed) => speed <= 30,
  },
  {
    id: 's5', type: 'SPEED_LIMIT', limit: 30,
    triggerZ: 720, resolveZ: 870,
    sign: 'limit_30',
    warn: '🏫 Khu dân cư 30 km/h — Có trẻ em!',
    passMsg: '✅ Giảm tốc đúng!',
    failMsg: '❌ Vượt tốc độ khu dân cư! (-15 điểm)',
    failPenalty: 15,
    check: (speed) => speed <= 35,
  },
  {
    id: 's6', type: 'TRAFFIC_LIGHT',
    triggerZ: 950, resolveZ: 1010, lightDuration: 4,
    warn: '🚦 Đèn đỏ — Dừng lại!',
    passMsg: '✅ Xuất sắc!',
    passBonus: 5,
    failMsg: '❌ Vượt đèn đỏ! (-25 điểm)',
    failPenalty: 25,
    check: (speed) => speed < 2,
  },
  {
    id: 's7', type: 'PRIORITY',
    triggerZ: 1100, resolveZ: 1140,
    sign: 'priority',
    warn: '✅ Đường ưu tiên — Bạn có quyền đi trước!',
    passMsg: '✅ Tiếp tục đúng luật!',
    failMsg: null,
    check: () => true,
  },
  {
    id: 's8', type: 'SPEED_LIMIT', limit: 100,
    triggerZ: 1200, resolveZ: 1400,
    sign: 'limit_100',
    warn: '🛣️ Đường ngoài đô thị — Tối đa 100 km/h',
    passMsg: '✅ Lái đúng tốc độ!',
    failMsg: '❌ Vượt tốc độ! (-10 điểm)',
    failPenalty: 10,
    check: (speed) => speed <= 105,
  },
];

export const MAX_SCORE = 100;

export const initScore = () => ({ points: MAX_SCORE, events: [] });

export const applyEvent = (scoreState, scenario, passed) => {
  const bonus = passed ? (scenario.passBonus || 0) : 0;
  const penalty = passed ? 0 : (scenario.failPenalty || 0);
  const newPoints = Math.max(0, Math.min(MAX_SCORE + 10, scoreState.points + bonus - penalty));
  const msg = passed ? scenario.passMsg : scenario.failMsg;
  return {
    points: newPoints,
    events: msg ? [...scoreState.events, { msg, passed, time: Date.now() }] : scoreState.events,
  };
};
