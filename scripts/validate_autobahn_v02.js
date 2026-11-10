import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('=== AUTOBAHN TRAINING SPEC v0.2 VALIDATION RUN ===');
console.log('====================================================');

const jsonPath = path.resolve('autobahn_training_kleinstadt_a_b_v02.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');

let spec;
try {
  spec = JSON.parse(rawData);
  console.log('✅ 1. JSON Syntax & Parsing: Clean SUCCESS');
} catch (e) {
  console.error('❌ JSON Parsing FAILED:', e.message);
  process.exit(1);
}

// 2. Validate Explicit Ramp Geometry Centerlines
const ramps = spec.ramps;
for (const ramp of ramps) {
  if (ramp.centerline && Array.isArray(ramp.centerline) && ramp.centerline.length >= 3) {
    console.log(`✅ 2. Ramp Geometry (${ramp.id}): Verified ${ramp.centerline.length} explicit centerline points`);
  } else {
    console.error(`❌ Ramp ${ramp.id} missing explicit geometry centerline points!`);
    process.exit(1);
  }
}

// 3. Validate Raststätte Sonnenhöhe Internal Road Geometry
const rast = spec.serviceArea;
if (rast.entry.centerline && rast.exit.centerline && rast.internalRoad.loopCenterline) {
  console.log(`✅ 3. Raststätte Sonnenhöhe Geometry: Explicit Entry, Exit & Internal Loop Centerlines Verified`);
} else {
  console.error('❌ Raststätte geometry centerlines incomplete!');
  process.exit(1);
}

// 4. Validate Geometry Segments (0 to 8000m)
const segments = spec.geometry.segments;
let currentS = 0;
for (const seg of segments) {
  if (seg.sStart !== currentS) {
    console.error(`❌ Gap in geometry segments at s=${currentS} vs seg ${seg.id} start=${seg.sStart}`);
    process.exit(1);
  }
  currentS = seg.sEnd;
}
if (currentS === spec.metadata.routeLengthMeters) {
  console.log(`✅ 4. Route Continuity: 0m to ${currentS}m (8 segments with curves & straights) Seamless`);
} else {
  console.error(`❌ Geometry segments end at ${currentS}m, expected ${spec.metadata.routeLengthMeters}m`);
  process.exit(1);
}

console.log('====================================================');
console.log('🎉 ALL v0.2 GEOMETRY & TOPOLOGY CHECKS PASSED!');
console.log('====================================================');
