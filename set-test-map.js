// Chạy đoạn này trong browser console để set test map
const testMapData = {
  mapInfo: {
    name: 'Sa hình thi lái xe Đức',
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
    { id: 'road_3', type: 'ROAD_STRAIGHT', x: 0, z: 84, rotation: 0, width: 14, height: 30 },
    { id: 'road_4', type: 'ROAD_STRAIGHT', x: -25, z: 70, rotation: 90, width: 14, height: 50 },
    { id: 'road_5', type: 'ROAD_STRAIGHT', x: 25, z: 70, rotation: 90, width: 14, height: 50 },
    { id: 'sign_speed_1', type: 'SIGN', x: 8, z: 10, rotation: 0, width: 2, height: 4, signType: 'SPEED_LIMIT', value: 50 },
    { id: 'sign_speed_2', type: 'SIGN', x: 8, z: 50, rotation: 0, width: 2, height: 4, signType: 'SPEED_LIMIT', value: 50 },
    { id: 'sign_stop_1', type: 'SIGN', x: 8, z: 65, rotation: 0, width: 2, height: 4, signType: 'STOP' },
    { id: 'sign_priority_1', type: 'SIGN', x: -8, z: 75, rotation: 90, width: 2, height: 4, signType: 'PRIORITY' },
    { id: 'traffic_light_1', type: 'TRAFFIC_LIGHT', x: 8, z: 70, rotation: 0, width: 1, height: 4 },
    { id: 'zebra_1', type: 'ZEBRA', x: 0, z: 30, rotation: 0, width: 4, height: 2 },
    { id: 'zebra_2', type: 'ZEBRA', x: 0, z: 60, rotation: 0, width: 4, height: 2 },
    { id: 'sidewalk_1', type: 'SIDEWALK', x: -9, z: 0, rotation: 0, width: 2, height: 70 },
    { id: 'sidewalk_2', type: 'SIDEWALK', x: 9, z: 0, rotation: 0, width: 2, height: 70 },
    { id: 'spawn_1', type: 'SPAWN_POINT', x: 5, z: 1, rotation: 0, width: 3, height: 5 },
    { id: 'building_1', type: 'BUILDING', x: -15, z: 10, rotation: 0, width: 6, height: 8 },
    { id: 'building_2', type: 'BUILDING', x: 15, z: 20, rotation: 0, width: 6, height: 8 },
    { id: 'building_3', type: 'BUILDING', x: -15, z: 50, rotation: 0, width: 6, height: 8 }
  ],
  createdAt: new Date().toISOString()
};

localStorage.setItem('testMapData', JSON.stringify(testMapData));
console.log('✅ Đã lưu test map vào localStorage!');
console.log('🔄 Navigate sang /simulation để test');

// Sau đó navigate sang simulation
window.location.href = '/simulation';