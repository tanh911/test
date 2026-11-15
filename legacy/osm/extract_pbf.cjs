// Extract OSM ways, nodes, traffic signals, crossings, waterways,
// railways, parks, and landmarks from local PBF.

const fs = require('fs');
const path = require('path');
const parsePbf = require('tiny-osmpbf');

const PBF_FILENAME = process.argv[2] || 'stadt.pbf';
const OUT_FILENAME = process.argv[3] || 'osm_pbf_extracted_stadt.json';

const pbfFile = path.resolve(
  __dirname,
  '../public/maps',
  PBF_FILENAME
);

const outFile = path.resolve(
  __dirname,
  OUT_FILENAME
);

if (!fs.existsSync(pbfFile)) {
  console.error(`PBF file not found: ${pbfFile}`);
  process.exit(1);
}

console.log(`[PBF Extractor] Reading: ${pbfFile}`);

const t0 = performance.now();

const buf = fs.readFileSync(pbfFile);

const allNodes = new Map();

const trafficSignalNodes = new Set();
const crossingNodes = new Set();
const stopNodes = new Set();
const giveWayNodes = new Set();

const drivableWays = [];
const waterways = [];
const railways = [];
const parks = [];
const landmarkNodes = [];
const landmarkWays = [];

// Roads that the simulator can drive on.
const DRIVABLE = new Set([
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'residential',
  'living_street'
]);

/*
 * Generic OSM landmark detection.
 *
 * This deliberately does NOT contain Berlin-specific landmarks.
 * The PBF is now the source of truth.
 */
function getLandmarkCategory(tags) {
  if (!tags) return null;

  if (
    tags.historic === 'monument' ||
    tags.historic === 'memorial' ||
    tags.memorial
  ) {
    return 'monument';
  }

  if (
    tags.tourism === 'attraction' ||
    tags.tourism === 'viewpoint' ||
    tags.tourism === 'museum'
  ) {
    return 'attraction';
  }

  if (
    tags.man_made === 'tower' ||
    tags.man_made === 'communications_tower' ||
    tags.man_made === 'lighthouse' ||
    tags.tower
  ) {
    return 'tower';
  }

  if (
    tags.building === 'church' ||
    tags.building === 'cathedral' ||
    tags.amenity === 'place_of_worship'
  ) {
    return 'church';
  }

  if (
    tags.building === 'castle' ||
    tags.historic === 'castle'
  ) {
    return 'castle';
  }

  if (
    tags.building === 'townhall' ||
    tags.amenity === 'townhall'
  ) {
    return 'civic';
  }

  if (
    tags.amenity === 'school' ||
    tags.amenity === 'university' ||
    tags.building === 'university'
  ) {
    return 'education';
  }

  return null;
}

function isLandmark(tags) {
  if (!tags) return false;

  // A named object is required so we don't turn every generic
  // building/tower into a landmark.
  if (!tags.name) return false;

  return getLandmarkCategory(tags) !== null;
}

parsePbf(buf, (el) => {
  if (el.type === 'node') {
    allNodes.set(el.id, [el.lat, el.lon]);

    if (el.tags) {
      if (el.tags.highway === 'traffic_signals') {
        trafficSignalNodes.add(el.id);
      }

      if (
        el.tags.highway === 'crossing' ||
        el.tags.crossing
      ) {
        crossingNodes.add(el.id);
      }

      if (el.tags.highway === 'stop') {
        stopNodes.add(el.id);
      }

      if (el.tags.highway === 'give_way') {
        giveWayNodes.add(el.id);
      }

      // Generic OSM landmark node.
      if (isLandmark(el.tags)) {
        landmarkNodes.push({
          id: el.id,
          name: el.tags.name,
          category: getLandmarkCategory(el.tags),
          lat: el.lat,
          lon: el.lon,
          tags: el.tags
        });
      }
    }
  }

  else if (el.type === 'way') {
    if (!el.tags) return;

    // ------------------------------------------------------------
    // 1. Drivable roads
    // ------------------------------------------------------------

    if (DRIVABLE.has(el.tags.highway)) {
      drivableWays.push({
        id: el.id,
        nodes: el.nodes,
        tags: el.tags
      });
    }

    // ------------------------------------------------------------
    // 2. Waterways
    // ------------------------------------------------------------

    if (
      el.tags.waterway ||
      (
        el.tags.natural === 'water' &&
        (
          el.tags.water === 'river' ||
          el.tags.water === 'canal' ||
          el.tags.water === 'basin'
        )
      )
    ) {
      waterways.push({
        id: el.id,
        nodes: el.nodes,
        tags: el.tags
      });
    }

    // ------------------------------------------------------------
    // 3. Railways
    // ------------------------------------------------------------

    if (
      el.tags.railway === 'rail' ||
      el.tags.railway === 'tram' ||
      el.tags.railway === 'light_rail' ||
      el.tags.railway === 'subway'
    ) {
      railways.push({
        id: el.id,
        nodes: el.nodes,
        tags: el.tags
      });
    }

    // ------------------------------------------------------------
    // 4. Parks & green spaces
    // ------------------------------------------------------------

    if (
      el.tags.leisure === 'park' ||
      el.tags.leisure === 'garden' ||
      (
        el.tags.landuse === 'grass' &&
        el.tags.name
      )
    ) {
      parks.push({
        id: el.id,
        nodes: el.nodes,
        tags: el.tags
      });
    }

    // ------------------------------------------------------------
    // 5. Generic OSM landmarks
    // ------------------------------------------------------------

    if (isLandmark(el.tags)) {
      landmarkWays.push({
        id: el.id,
        name: el.tags.name,
        category: getLandmarkCategory(el.tags),
        nodes: el.nodes,
        tags: el.tags
      });
    }
  }
});

console.log(
  `[PBF Extractor] Parsed PBF in ${(performance.now() - t0).toFixed(0)} ms.`
);

console.log(`  - Drivable ways: ${drivableWays.length}`);
console.log(`  - Waterways: ${waterways.length}`);
console.log(`  - Railways: ${railways.length}`);
console.log(`  - Parks: ${parks.length}`);
console.log(
  `  - Landmark ways: ${landmarkWays.length}, nodes: ${landmarkNodes.length}`
);

// ------------------------------------------------------------
// Collect only nodes referenced by extracted objects.
// ------------------------------------------------------------

const usedNodes = {};

function registerNode(nid) {
  if (allNodes.has(nid) && !usedNodes[nid]) {
    const [lat, lon] = allNodes.get(nid);

    usedNodes[nid] = {
      lat,
      lon,
      trafficSignal: trafficSignalNodes.has(nid),
      crossing: crossingNodes.has(nid),
      stop: stopNodes.has(nid),
      giveWay: giveWayNodes.has(nid)
    };
  }
}

drivableWays.forEach((w) => {
  w.nodes.forEach(registerNode);
});

waterways.forEach((w) => {
  w.nodes.forEach(registerNode);
});

railways.forEach((w) => {
  w.nodes.forEach(registerNode);
});

parks.forEach((w) => {
  w.nodes.forEach(registerNode);
});

landmarkWays.forEach((w) => {
  w.nodes.forEach(registerNode);
});

landmarkNodes.forEach((n) => {
  registerNode(n.id);
});

console.log(
  `[PBF Extractor] Referenced nodes count: ${Object.keys(usedNodes).length}`
);

// ------------------------------------------------------------
// Output
// ------------------------------------------------------------

const result = {
  metadata: {
    source: `public/maps/${PBF_FILENAME}`,
    extractedAt: new Date().toISOString(),

    bbox: {
      minLon: 13.345,
      minLat: 52.455,
      maxLon: 13.393,
      maxLat: 52.473
    },

    wayCount: drivableWays.length,
    waterwayCount: waterways.length,
    railwayCount: railways.length,
    parkCount: parks.length,
    landmarkCount:
      landmarkNodes.length + landmarkWays.length,
    nodeCount: Object.keys(usedNodes).length
  },

  nodes: usedNodes,

  ways: drivableWays,

  waterways,

  railways,

  parks,

  landmarks: {
    nodes: landmarkNodes,
    ways: landmarkWays
  }
};

fs.writeFileSync(
  outFile,
  JSON.stringify(result),
  'utf-8'
);

console.log(
  `[PBF Extractor] Saved extracted data to: ${outFile} ` +
  `(${(fs.statSync(outFile).size / 1024 / 1024).toFixed(2)} MB)`
);