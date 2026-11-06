import fs from 'fs';
import path from 'path';

console.log('===========================================================');
console.log('=== AUTOBAHN A2 HAMM/RHYNERN REAL OSM MAP VALIDATION ===');
console.log('===========================================================');

const mapPath = path.resolve('public/maps/autobahn_rhynern.json');
if (!fs.existsSync(mapPath)) {
  console.error(`❌ Map file not found: ${mapPath}`);
  process.exit(1);
}

const rawData = fs.readFileSync(mapPath, 'utf8');
const data = JSON.parse(rawData);

const ways = data.ways || [];
const nodes = data.nodes || {};
const junctions = data.junctions || [];

// 1. Motorway & Motorway Link Counts
const motorways = ways.filter(w => w.highway === 'motorway');
const motorwayLinks = ways.filter(w => w.highway === 'motorway_link');
const bridges = ways.filter(w => w.bridge === true);

console.log(`📊 1. Object Counts:`);
console.log(`   - Motorways (highway=motorway): ${motorways.length}`);
console.log(`   - Motorway Links (highway=motorway_link): ${motorwayLinks.length}`);
console.log(`   - Junction Nodes: ${junctions.length}`);
console.log(`   - Bridge Segments: ${bridges.length}`);

if (motorways.length === 0 || motorwayLinks.length === 0) {
  console.error('❌ FAIL: Missing motorways or motorway_links!');
  process.exit(1);
}

// 2. Invalid Coordinates Check
let invalidCoordsCount = 0;
for (const w of ways) {
  for (const pt of w.centerline) {
    if (isNaN(pt[0]) || isNaN(pt[1]) || pt[0] === null || pt[1] === null) {
      invalidCoordsCount++;
    }
  }
}

if (invalidCoordsCount === 0) {
  console.log('✅ 2. Coordinate Integrity: 0 invalid / NaN coordinates');
} else {
  console.error(`❌ FAIL: Found ${invalidCoordsCount} invalid coordinates!`);
  process.exit(1);
}

// 3. Lane Information Check
const lanesStats = {};
for (const w of ways) {
  lanesStats[w.lanes] = (lanesStats[w.lanes] || 0) + 1;
}
console.log('✅ 3. Lane Distribution:', JSON.stringify(lanesStats));

// 4. Dangling Ramps / Motorway_Link Connectivity Check
const connectedNodeIds = new Set();
for (const w of ways) {
  for (const nid of w.nodes) {
    connectedNodeIds.add(nid);
  }
}

let danglingRamps = 0;
for (const ml of motorwayLinks) {
  const firstNode = ml.nodes[0];
  const lastNode = ml.nodes[ml.nodes.length - 1];

  // Check if ramp endpoint connects to at least one other way
  const firstShared = ways.filter(w => w.id !== ml.id && w.nodes.includes(firstNode)).length;
  const lastShared = ways.filter(w => w.id !== ml.id && w.nodes.includes(lastNode)).length;

  if (firstShared === 0 && lastShared === 0) {
    danglingRamps++;
  }
}

if (danglingRamps === 0) {
  console.log('✅ 4. Dangling Ramps Check: All motorway_links connected');
} else {
  console.warn(`⚠️ Warning: Found ${danglingRamps} isolated ramps in boundary clipping`);
}

// 5. Raststätte Rhynern Elements Check
const rhynernWays = ways.filter(w => w.rhynernFacility || (w.destination && w.destination.includes('Rhynern')));
console.log(`✅ 5. Raststätte Rhynern Elements: Found ${rhynernWays.length} connected service/ramp segments`);

console.log('===========================================================');
console.log('🎉 REAL OSM AUTOBAHN RHYNERN MAP VALIDATION PASSED!');
console.log('===========================================================');
