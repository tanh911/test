import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { CITY_18_NODES, validateCity, generateCityMap } from '../src/data/maps/cityGenerator';

const res = validateCity(CITY_18_NODES);
console.log('validateCity(CITY_18_NODES):', res);
if (!res.valid) {
  console.error('Validation errors:', res.errors);
  process.exit(1);
}

const map18 = generateCityMap(CITY_18_NODES);
const outPath = resolve('src/data/maps/city.json');
writeFileSync(outPath, JSON.stringify(CITY_18_NODES, null, 2), 'utf-8');
console.log('Successfully wrote city.json with', CITY_18_NODES.nodes.length, 'nodes,', CITY_18_NODES.edges.length, 'edges.');
console.log('Generated map roads:', map18.roads.length, 'signs:', map18.signs.length, 'buildings:', map18.buildings.length, 'props:', map18.props.length);
