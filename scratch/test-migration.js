// Test script cho migration V1 → V2
// Chạy trong browser console: copy/paste đoạn này

const testMapV1 = {
  mapInfo: {
    name: 'Test Map V1',
    type: 'custom',
    maxSpeedLimit: 50,
    gridSize: 10,
    spawnPoint: {
      x: 7,
      z: 2
    }
  },
  elements: [
    { id: 'road_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 40 },
    { id: 'road_2', type: 'ROAD_STRAIGHT', x: 0, z: 40, rotation: 0, width: 14, height: 30 },
    { id: 'intersection_1', type: 'INTERSECTION_4WAY', x: 0, z: 70, rotation: 0, width: 14, height: 14 },
    { id: 'sign_speed_1', type: 'SIGN', x: 8, z: 10, rotation: 0, width: 2, height: 4, signType: 'SPEED_LIMIT', value: 50 },
    { id: 'spawn_1', type: 'SPAWN_POINT', x: 5, z: 1, rotation: 0, width: 3, height: 5 },
  ],
  createdAt: new Date().toISOString()
};

console.log('🧪 Testing migration V1 → V2...');
console.log('📥 Input map V1:', testMapV1);

// Import migration functions (trong thực tế sẽ import từ file)
// Đây là test, nên ta cần load module trước

// Sau khi import:
// import { ensureMapV2, validateMapV2 } from './src/simulation/data/mapMigration.js';

// const migratedMap = ensureMapV2(testMapV1);
// console.log('📤 Output map V2:', migratedMap);

// const validation = validateMapV2(migratedMap);
// console.log('✅ Validation result:', validation);

console.log('🔄 Để test thực tế, cần import modules trong context React/Node.js');