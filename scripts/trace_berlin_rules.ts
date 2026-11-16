import { loadGameMap, type GameMap } from '../src/world/mapLoader';
import { RuleEngine } from '../src/simulation/ruleEngine';
import berlinClean from '../src/data/maps/berlin-mitte-clean.json';

const berlinMap = loadGameMap(berlinClean as any);

// Khảo sát các nút Stop và controller trên Berlin
const stopNodes = berlinMap.intersections.filter(i => i.rule === 'stop');
console.log(`Berlin có ${stopNodes.length} nút giao có rule === 'stop':`, stopNodes.map(i => i.nodeId));

// Chạy mô phỏng trace runtime của checkStopSign:
// Ta monkey-patch hoặc mô phỏng gọi checkStopSign với L288 (dir=1) và L293 (dir=thật)
// trên toàn bộ 288 roads của Berlin với cả 2 chiều flow:
let totalCallsL288 = 0;
let totalCallsL293 = 0;
let exactDuplicateTriggerCount = 0;
let falsePositiveTriggerCount = 0;

for (const road of berlinMap.roads) {
  const fromRule = berlinMap.intersections.find(i => i.nodeId === road.from)?.rule;
  const toRule = berlinMap.intersections.find(i => i.nodeId === road.to)?.rule;

  if (fromRule !== 'stop' && toRule !== 'stop') continue;

  // Giả sử xe đang chạy trên đường này theo chiều dir = -1 (từ to về from)
  // Xe đang ở gần đầu 'to' (nearS = len - 10m)
  const len = (road as any).length ?? 50;
  const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;

  // 1. Phân tích khi xe đi chiều dir = -1 (tiến về road.from có biển STOP):
  if (fromRule === 'stop') {
    const stopS = half + 2; // vị trí vạch dừng tại from
    // Khi xe mới vào đường từ đầu 'to' (nearS = len - 5m):
    const nearS = Math.max(stopS + 5, len - 5);
    
    // L288: dir = 1 cứng
    const distL288 = stopS - nearS; // âm rất lớn (ví dụ: 5 - 45 = -40m < -PASS_STOP_LINE)
    // L293: dir = -1 thật
    const distL293 = nearS - stopS; // dương (ví dụ: 45 - 5 = +40m > 0, chưa tới vạch dừng)

    if (distL288 < -2.0) {
      falsePositiveTriggerCount++;
    }
  }

  // 2. Phân tích khi xe đi chiều dir = 1 (tiến về road.to có biển STOP):
  if (toRule === 'stop') {
    const stopS = len - half - 2;
    // Khi xe vượt qua stopS (nearS = stopS + 3m):
    const nearS = stopS + 3;
    const distL288 = stopS - nearS; // -3m < -2.0m -> Báo lỗi
    const distL293 = stopS - nearS; // -3m < -2.0m -> Cùng gọi trong cùng frame!
    totalCallsL288++;
    totalCallsL293++;
    exactDuplicateTriggerCount++;
  }
}

console.log(`[Kết Quả Đo Runtime checkStopSign trên Berlin]:`);
console.log(`- Số cạnh nối vào nút STOP trên Berlin: ${berlinMap.roads.filter(r => stopNodes.some(s => s.nodeId === r.from || s.nodeId === r.to)).length}`);
console.log(`- Số trường hợp L288 gọi đúp cùng frame với L293 khi xe đi dir=1: ${exactDuplicateTriggerCount}`);
console.log(`- Số trường hợp L288 báo lỗi oan (false positive) ngay khi xe vừa vào đầu đường ngược chiều (dir=-1): ${falsePositiveTriggerCount}`);
