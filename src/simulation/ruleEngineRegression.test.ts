import { describe, expect, it } from 'vitest';
import { generateCityMap, CITY_18_NODES } from '../data/maps/cityGenerator';
import { RuleEngine } from './ruleEngine';
import type { PlayerState } from './ruleEngine';
import { TrafficLightController } from '../world/trafficLights';

describe('Bộ Test Hồi Quy Nhóm 1: RuleEngine Fixes', () => {
  const map = generateCityMap(CITY_18_NODES);
  const ctrlAmpel = new TrafficLightController('n04_ampel', 15, 3, 15);
  const controllers = [ctrlAmpel];

  // ── 1. Lỗi #1 và #5 ──
  it('1.1. Lỗi #1: Xe tại ngã tư n04_ampel hướng về r09_ampel_east KHÔNG được bị báo stop_sign', () => {
    const re = new RuleEngine(map, controllers);
    const p: PlayerState = {
      x: -1.0,
      z: 279.2,
      heading: 0.1,
      speed: 8.0,
      stopped: false
    };

    re.update(0.1, p, []);
    const stopViol = re.violations.filter(v => v.type === 'stop_sign');
    expect(stopViol.length, 'Không được có lỗi stop_sign oan tại n04_ampel').toBe(0);
  });

  it('1.2. Lỗi #5: Xe đã qua n04_ampel đi vào r09_ampel_east KHÔNG được bị báo redlight cho đèn phía sau', () => {
    ctrlAmpel.timer = 20; // rơi vào phase RED
    const re = new RuleEngine(map, controllers);

    // Frame 1: đầu đường r09_ampel_east @ (2.0, 280.0)
    re.update(0.1, { x: 2.0, z: 280.0, heading: Math.PI / 2, speed: 7.0, stopped: false }, []);
    // Frame 2: tiến về East @ (5.6, 280.0), đèn n04_ampel ở sau lưng xe
    re.update(0.1, { x: 5.6, z: 280.0, heading: Math.PI / 2, speed: 7.0, stopped: false }, []);

    const redViol = re.violations.filter(v => v.type === 'redlight');
    expect(redViol.length, 'Không được có lỗi redlight oan cho đèn phía sau lưng xe').toBe(0);
  });

  // ── 2. nosignal ──
  it('2.1. nosignal: Đi theo đường cong liên tục (không đổi road) KHÔNG bị báo nosignal', () => {
    const re = new RuleEngine(map, controllers);
    // Đoạn r07_to_curv1 là đường cong: xe đi uốn lượn nhưng trên cùng một road
    let h = 0;
    for (let i = 0; i < 30; i++) {
      h += 0.05; // tích lũy góc quay tổng cộng 1.5 rad (~86 độ)
      re.update(0.1, { x: 0, z: 20 + i * 2, heading: h, speed: 8.0, signal: null, stopped: false }, []);
    }
    const noSigViol = re.violations.filter(v => v.type === 'nosignal');
    expect(noSigViol.length, 'Đi theo đường cong tự nhiên không được bị phạt nosignal').toBe(0);
  });

  it('2.2. nosignal: Rẽ tại nút giao sang road mới (góc >= 35°) mà không xi-nhan PHẢI bị phạt nosignal', () => {
    const re = new RuleEngine(map, controllers);
    // Frame 1: xe trên r01_start (heading 0 = Bắc)
    re.update(0.1, { x: 0, z: 98, heading: 0, speed: 6.0, signal: null, stopped: false }, []);
    // Frame 2: xe rẽ sang r14_rvl_east (heading PI/2 = Đông, góc lệch 90° >= 35°) mà không xi-nhan
    re.update(0.1, { x: 5, z: 100, heading: Math.PI / 2, speed: 6.0, signal: null, stopped: false }, []);

    const noSigViol = re.violations.filter(v => v.type === 'nosignal');
    expect(noSigViol.length, 'Rẽ chuyển road tại ngã tư không bật đèn phải bị phạt nosignal').toBeGreaterThanOrEqual(1);
  });

  // ── 3. collision ──
  it('3.1. collision: Xe đứng yên tại chỗ va chạm KHÔNG bị lặp lỗi mỗi 3s (chỉ 1 lần duy nhất)', () => {
    const re = new RuleEngine(map, controllers);
    // Frame 1: va chạm công trình lần đầu
    re.update(0.1, { x: -6.9, z: 414.8, heading: 0, speed: 0, stopped: true }, ['building']);
    expect(re.violations.filter(v => v.type === 'collision').length).toBe(1);

    // Frame 2: sau 4 giây xe vẫn đứng nguyên tại chỗ (-6.9, 414.8)
    for (let i = 0; i < 40; i++) {
      re.update(0.1, { x: -6.9, z: 414.8, heading: 0, speed: 0, stopped: true }, ['building']);
    }
    // Không được tăng thêm lỗi collision spam
    expect(re.violations.filter(v => v.type === 'collision').length, 'Không được lặp lại lỗi va chạm khi chưa thoát ly >= 1.5m').toBe(1);

    // Frame 3: lùi ra xa >= 1.5m rồi đâm lại
    re.update(0.1, { x: -6.9, z: 412.0, heading: 0, speed: 2.0, stopped: false }, []);
    re.update(0.1, { x: -6.9, z: 414.8, heading: 0, speed: 2.0, stopped: false }, ['building']);
    expect(re.violations.filter(v => v.type === 'collision').length, 'Sau khi thoát ly và va chạm lại mới ghi nhận lỗi mới').toBe(2);
  });

  it('3.2. collision: NPC đâm vào xe người chơi khi người chơi đang dừng đèn/không có lỗi KHÔNG bị phạt', () => {
    const re = new RuleEngine(map, controllers);
    // Xe người chơi đang dừng đèn (speed = 0, rightPriorityThreat = false)
    re.update(0.1, { x: 0, z: 275, heading: 0, speed: 0, stopped: true, rightPriorityThreat: false }, ['npc-0']);
    const colViol = re.violations.filter(v => v.type === 'collision');
    expect(colViol.length, 'Người chơi không có lỗi khi NPC đâm vào xe đang dừng').toBe(0);
  });

  // ── 4. out_of_bounds ──
  it('4.1. out_of_bounds: Xe vượt ra ngoài bounding box map + 10m PHẢI bị phạt Major', () => {
    const re = new RuleEngine(map, controllers);
    // Vị trí nằm ngoài map cực xa (ví dụ x = 9999)
    re.update(0.1, { x: 9999, z: 9999, heading: 0, speed: 8.0, stopped: false }, []);
    const oobViol = re.violations.filter(v => v.type === 'out_of_bounds');
    expect(oobViol.length, 'Chạy ra ngoài map phải kích hoạt out_of_bounds').toBeGreaterThanOrEqual(1);
    expect(oobViol[0].severity).toBe('major');
  });
});
