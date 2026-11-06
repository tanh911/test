/**
 * 🗺️ MULTI-CITY MAP & SCENARIO MANAGER
 * Supports seamless switching between multiple German cities (Berlin, Munich, Hamburg)
 * and custom scenario presets.
 */

export const GERMAN_CITIES = [
  {
    id: 'stadt_zentrum',
    nameVi: '1. Nội Đô Berlin (Stadtfahrt - stadt.pbf)',
    nameDe: '1. Stadtfahrt Berlin-Mitte (stadt.pbf)',
    pbfFile: 'stadt.pbf',
    jsonFile: '/src/simulation/data/road_graph.json',
    bounds: { minX: -600, maxX: 600, minZ: -600, maxZ: 600 },
    spawnPoint: { x: -2.88, z: 32.0, rot: 0 },
    icon: '🏙️'
  },
  {
    id: 'landstrasse_b2',
    nameVi: '2. Đường Liên Tỉnh (Landstraße - land.pbf)',
    nameDe: '2. Landstraße Bundesstraße (land.pbf)',
    pbfFile: 'land.pbf',
    jsonFile: '/src/simulation/data/road_graph_land.json',
    bounds: { minX: -1500, maxX: 1500, minZ: -1500, maxZ: 1500 },
    spawnPoint: { x: 0, z: 0, rot: 0 },
    icon: '🌲'
  },
  {
    id: 'autobahn_a9',
    nameVi: '3. Cao Tốc Đức (Autobahn - autobahn.pbf)',
    nameDe: '3. Autobahn Fernstraße (autobahn.pbf)',
    pbfFile: 'autobahn.pbf',
    jsonFile: '/src/simulation/data/road_graph_autobahn.json',
    bounds: { minX: -2000, maxX: 2000, minZ: -2000, maxZ: 2000 },
    spawnPoint: { x: 135.0, z: -2680.0, rot: 0 },
    icon: '🏎️'
  }
];

export class MultiCityMapManager {
  constructor() {
    this.activeCity = GERMAN_CITIES[0];
  }

  selectCity(cityId) {
    const city = GERMAN_CITIES.find(c => c.id === cityId);
    if (city) {
      this.activeCity = city;
      return city;
    }
    return null;
  }
}
