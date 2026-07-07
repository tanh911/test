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
    check: (speed) => speed <= 55,
    theoryRule: {
      title: 'Tốc độ trong đô thị (Innerorts)',
      rule: 'Theo Điều 3 Luật Giao thông Đường bộ Đức (StVO), tốc độ tối đa cho phép trong khu vực đô thị (bắt đầu từ biển báo tên thành phố nền vàng) là 50 km/h đối với tất cả các phương tiện cơ giới.'
    }
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
    theoryRule: {
      title: 'Chấp hành Đèn tín hiệu (Ampel)',
      rule: 'Vượt đèn đỏ (Rotlichtverstoß) là lỗi vi phạm nghiêm trọng nhóm A ở Đức. Bạn bắt buộc phải dừng hẳn xe trước vạch dừng (Haltelinie) khi đèn chuyển sang màu đỏ.'
    }
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
    theoryRule: {
      title: 'Biển báo dừng STOP (Zeichen 206)',
      rule: 'Tại biển STOP, bạn bắt buộc phải dừng bánh xe hoàn toàn (tốc độ = 0 km/h) tại vạch dừng hoặc mép giao lộ ít nhất 3 giây để quan sát và nhường đường cho mọi phương tiện trên đường cắt ngang.'
    }
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
    theoryRule: {
      title: 'Biển nhường đường (Zeichen 205)',
      rule: 'Biển tam giác ngược yêu cầu nhường quyền đi trước (Vorfahrt gewähren). Bạn phải chủ động giảm tốc độ sớm (dưới 30 km/h) để sẵn sàng phanh dừng nhường đường cho xe trên đường giao cắt.'
    }
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
    theoryRule: {
      title: 'Khu vực giới hạn 30 km/h (Tempo-30-Zone)',
      rule: 'Thường áp dụng trong các khu dân cư, trường học. Hãy đặc biệt chú ý đến trẻ em qua đường và áp dụng nguyên tắc nhường đường bên phải trước (Rechts vor Links) tại các ngã tư không có biển báo.'
    }
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
    theoryRule: {
      title: 'Quy tắc Đèn vàng và Đèn đỏ',
      rule: 'Khi đèn chuyển sang màu vàng (Gelbphase), bạn phải dừng lại nếu việc phanh không gây nguy hiểm cho xe phía sau. Đèn đỏ tuyệt đối không được vượt qua.'
    }
  },
  {
    id: 's7', type: 'PRIORITY',
    triggerZ: 1100, resolveZ: 1140,
    sign: 'priority',
    warn: '✅ Đường ưu tiên — Bạn có quyền đi trước!',
    passMsg: '✅ Tiếp tục đúng luật!',
    failMsg: null,
    check: () => true,
    theoryRule: {
      title: 'Đường ưu tiên (Vorfahrtsstraße - Zeichen 306)',
      rule: 'Biển hình thoi vàng viền trắng cho biết bạn đang di chuyển trên đường ưu tiên. Tại các giao lộ tiếp theo có biển này, bạn được quyền ưu tiên đi trước các xe đi ra từ các đường nhánh.'
    }
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
    theoryRule: {
      title: 'Tốc độ ngoài đô thị (Außerorts)',
      rule: 'Tốc độ tối đa cho phép đối với ô tô con trên các tuyến đường quốc lộ/tỉnh lộ ngoài đô thị (Landstraße) là 100 km/h nếu không có biển báo giới hạn khác.'
    }
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
