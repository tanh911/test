import { CITY_18_NODES, generateCityMap } from '../src/data/maps/cityGenerator';
import { loadGameMap } from '../src/world/mapLoader';
import { auditStrictVisualSidewalkAndTriangles } from '../src/world/mapIntegrityAudit.test';
import { collectBoundaryIssues, collectSawtoothIssues, collectSeamIssues } from '../src/world/testJunctionBoundary';

const map5c1 = loadGameMap(generateCityMap(CITY_18_NODES, { excludeWaterParks: true }));
const map5c2 = loadGameMap(generateCityMap(CITY_18_NODES));

function auditMap(map: any) {
  const sv = auditStrictVisualSidewalkAndTriangles(map);
  let seams = 0, bounds = 0, sawteeth = 0;
  for (const n of map.nodes) {
    if (n.type === 'intersection') {
      seams += collectSeamIssues(map, n).length;
      bounds += collectBoundaryIssues(map, n).length;
    }
  }
  for (const r of map.roads) {
    sawteeth += collectSawtoothIssues(map, r).length;
  }
  return {
    nodes: map.nodes.length,
    roads: map.roads.length,
    waters: map.waters?.length ?? 0,
    parks: map.parks?.length ?? 0,
    bridges: map.roads.filter((r: any) => r.bridge).length,
    sv1Intrusions: sv.intrusions.length,
    sv1Degenerate: sv.degenerateTriangles.length,
    seams,
    boundaries: bounds,
    sawteeth
  };
}

console.log('5C-1 (clean mode):', auditMap(map5c1));
console.log('5C-2 (full mode):', auditMap(map5c2));
