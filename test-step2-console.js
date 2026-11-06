// Test Script cho Step 2 - chạy trong browser console
// Mở MapEditor → F12 → paste đoạn này → Enter

console.log('🧪 STEP 2 TEST SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test 1: Create test map với các rotation
const testMapData = {
  mapInfo: {
    name: 'Step 2 Test Map',
    type: 'custom',
    maxSpeedLimit: 50,
    gridSize: 10,
    spawnPoint: {
      x: 7,
      z: 2,
      rotation: 90  // Test spawn rotation
    }
  },
  elements: [
    // Road với các rotation khác nhau
    { id: 'road_0', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 20 },
    { id: 'road_90', type: 'ROAD_STRAIGHT', x: 20, z: 0, rotation: 90, width: 14, height: 20 },
    { id: 'road_180', type: 'ROAD_STRAIGHT', x: 40, z: 0, rotation: 180, width: 14, height: 20 },
    { id: 'road_270', type: 'ROAD_STRAIGHT', x: 60, z: 0, rotation: 270, width: 14, height: 20 },
    // Spawn point với rotation
    { id: 'spawn_1', type: 'SPAWN_POINT', x: 5, z: 1, rotation: 45, width: 3, height: 5 },
  ],
  createdAt: new Date().toISOString()
};

console.log('📝 Test map created with rotations: 0°, 90°, 180°, 270°');
console.log('📝 Spawn point rotation: 45°');

// Lưu test map vào localStorage
localStorage.setItem('step2TestMap', JSON.stringify(testMapData));
console.log('💾 Test map saved to localStorage as "step2TestMap"');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 TEST CHECKLIST:');
console.log('');
console.log('1️⃣ ZOOM TEST:');
console.log('   - Zoom 50%, 100%, 150%, 200%');
console.log('   - Kéo road/object → phải bám đúng con trỏ');
console.log('');
console.log('2️⃣ ROTATION TEST:');
console.log('   - Xoay liên tục: 0 → 90 → 180 → 270 → 0');
console.log('   - Kiểm tra kích thước và connector không lệch');
console.log('');
console.log('3️⃣ RESIZE TEST:');
console.log('   - Resize ở từng mức zoom');
console.log('   - Không được nhảy vị trí/kích thước');
console.log('');
console.log('4️⃣ SPAWN TEST:');
console.log('   - Đặt spawn ở 0°, 90°, 180°, 270°');
console.log('   - Run Test → xe + camera phải quay cùng hướng');
console.log('');
console.log('5️⃣ SAVE/LOAD TEST:');
console.log('   - Save map');
console.log('   - Reload');
console.log('   - Kiểm tra rotation + spawn rotation vẫn giữ nguyên');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 ĐỂ TẢI TEST MAP VÀO EDITOR:');
console.log('   localStorage.setItem("testMapData", JSON.stringify(');
console.log('     JSON.parse(localStorage.getItem("step2TestMap"))');
console.log('   ));');
console.log('   window.location.href = "/map-editor";');
console.log('');
console.log('✅ Hoặc test thủ công trong editor hiện tại');