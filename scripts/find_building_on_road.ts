import muenchenMap from '../src/data/maps/berlin-mitte-clean.json';
import { allBuildingQuads, planCityBlockFill } from '../src/world/buildings';
import type { GameMap, MapRoad } from '../src/world/mapLoader';
import { roadPointAt, roadLength, roadFullWidth } from '../src/world/mapLoader';

const map = muenchenMap as unknown as GameMap;
const plan = planCityBlockFill(map);

console.log('Fill plan stats:', plan.stats);
console.log('Total fill rows:', plan.rows.length);

// Let's check roads r256, r56, r205 (at n153 where player spawns and looks)
const targetRoads = ['r256', 'r56', 'r205'];
for (const rid of targetRoads) {
  const road = map.roads.find(r => r.id === rid) as MapRoad;
  if (!road) continue;
  const L = roadLength(road);
  const half = roadFullWidth(road) / 2;
  console.log(`Checking road ${rid}, len=${L.toFixed(1)}, half=${half}`);
  for (const row of plan.rows) {
    if (row.roadId === rid) {
      console.log(`  Row ON THIS ROAD: side=${row.side}, s=${row.s}, len=${row.length}, depthOff=${row.depthOff}`);
    }
  }
}

// Now let's check which rows have building strip intersecting r256 or r56 or n153 junction!
const n153 = map.nodes.find(n => n.id === 'n153')!;
console.log('n153 pos:', n153.x, n153.z);
for (const row of plan.rows) {
  const rRoad = map.roads.find(r => r.id === row.roadId) as MapRoad;
  if (!rRoad) continue;
  const pt = roadPointAt(rRoad, row.s + row.length / 2);
  const dToN153 = Math.hypot(pt.x - n153.x, pt.z - n153.z);
  if (dToN153 < 40) {
    console.log(`Row NEAR n153 (${dToN153.toFixed(1)}m): road=${row.roadId}, side=${row.side}, s=${row.s}, len=${row.length}, depthOff=${row.depthOff}`);
  }
}
