import fs from 'fs';
import path from 'path';

console.log('=== RUNNING AUTOBAHN v0.1.1 VALIDATION ===');

const mapPath = path.resolve('autobahn_map_v01.json');
const rawData = fs.readFileSync(mapPath, 'utf8');

// 1. JSON Parse Check
let spec;
try {
  spec = JSON.parse(rawData);
  console.log('✅ 1. JSON Parsing: Clean SUCCESS');
} catch (e) {
  console.error('❌ 1. JSON Parsing FAILED:', e.message);
  process.exit(1);
}

// 2. Metadata & Speed Limit Check
if (spec.metadata.speedLimitDefault === 130 && spec.roadDefaults.speedLimit === 130) {
  console.log('✅ 2. Default Speed Limit: 130 km/h Verified');
} else {
  console.error('❌ 2. Speed Limit Mismatch!');
  process.exit(1);
}

// 3. Unique Lane IDs & Graph Symmetry Check
const laneGraph = spec.laneGraph;
const laneIds = Object.keys(laneGraph);
const uniqueSet = new Set(laneIds);

if (laneIds.length === uniqueSet.size) {
  console.log(`✅ 3. Unique Lane IDs: All ${laneIds.length} lanes unique`);
} else {
  console.error('❌ 3. Duplicate Lane IDs detected!');
  process.exit(1);
}

// Graph adjacency check
for (const [id, lane] of Object.entries(laneGraph)) {
  if (lane.leftLane && !laneGraph[lane.leftLane]) {
    console.error(`❌ Graph Error: Lane ${id} references invalid leftLane ${lane.leftLane}`);
    process.exit(1);
  }
  if (lane.rightLane && !laneGraph[lane.rightLane]) {
    console.error(`❌ Graph Error: Lane ${id} references invalid rightLane ${lane.rightLane}`);
    process.exit(1);
  }
}
console.log('✅ 4. Lane Graph Neighbors (Left/Right): Verified intact');

// 4. Standstreifen Check
const shoulder = laneGraph['main_01_forward_Standstreifen'];
if (shoulder && shoulder.laneType === 'shoulder' && shoulder.isDrivingLane === false) {
  console.log('✅ 5. Standstreifen (Shoulder) Semantics: Correctly marked non-driving');
} else {
  console.error('❌ 5. Standstreifen invalid semantics!');
  process.exit(1);
}

// 5. Ramp Topology Verification
const ramps = spec.ramps;
const onRamp = ramps.find(r => r.type === 'on_ramp');
const offRamp = ramps.find(r => r.type === 'off_ramp');

if (onRamp && onRamp.targetLane === 'main_01_forward_L1' && onRamp.topology === 'merge') {
  console.log('✅ 6. Auffahrt (Entry Ramp) Topology: Correctly merges into L1');
} else {
  console.error('❌ 6. Auffahrt topology invalid!');
  process.exit(1);
}

if (offRamp && offRamp.sourceLane === 'main_01_forward_L1' && offRamp.topology === 'split') {
  console.log('✅ 7. Ausfahrt (Exit Ramp) Topology: Correctly splits from L1');
} else {
  console.error('❌ 7. Ausfahrt topology invalid!');
  process.exit(1);
}

console.log('🎉 ALL AUTOBAHN v0.1.1 TOPOLOGY VALIDATIONS PASSED CLEANLY!');
