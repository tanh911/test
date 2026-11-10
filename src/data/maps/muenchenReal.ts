// 🇩🇪 muenchenReal.ts — map Munich Altstadt từ OSM thật (GeoJSON overpass-turbo)
// Đủ lớn cho 1 đoạn bài thi Stadtfahrt: đường chính, zona 30, giao lộ, vòng xuyến nhỏ.
import type { GameMap } from '../../world/mapLoader';
import { parseOSMToGameMap } from './osmConverter';
import muenchenGeoJson from './muenchen-altstadt-real.json';

interface GeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: Record<string, string>;
  geometry: {
    type: 'LineString' | 'Polygon' | 'Point';
    coordinates: Array<[number, number]>; // [lon, lat]
  };
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/** Chuyển GeoJSON LineString (highway) sang Overpass elements[] để dùng parseOSMToGameMap. */
function geoJsonToOverpassElements(geojson: GeoJSON): Array<{
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags: Record<string, string>;
}> {
  const osmNodes = new Map<string, { lat: number; lon: number; __id: number }>();
  const elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    nodes?: number[];
    tags: Record<string, string>;
  }> = [];
  let nodeIdCounter = 0;

  function getOrCreateNode(lon: number, lat: number): number {
    const key = `${lon.toFixed(6)},${lat.toFixed(6)}`;
    const existing = osmNodes.get(key);
    if (existing) return existing.__id;
    const id = nodeIdCounter++;
    osmNodes.set(key, { lat, lon, __id: id });
    elements.push({ type: 'node', id, lat, lon, tags: {} });
    return id;
  }

  let wayId = 100_000;
  for (const feat of geojson.features) {
    if (feat.geometry.type !== 'LineString') continue;
    const coords = feat.geometry.coordinates as [number, number][];
    if (coords.length < 2) continue;

    const tags: Record<string, string> = { ...feat.properties };
    // Đảm bảo có highway tag
    if (!tags.highway) tags.highway = 'unclassified';

    const nodes: number[] = coords.map(([lon, lat]) => getOrCreateNode(lon, lat));
    elements.push({ type: 'way', id: wayId++, nodes, tags });
  }

  return elements;
}

/** Tính trung tâm bbox từ tất cả coordinates để đặt origin. */
function computeCenter(geojson: GeoJSON): { lat: number; lon: number } {
  let latSum = 0;
  let lonSum = 0;
  let count = 0;
  for (const feat of geojson.features) {
    if (feat.geometry.type !== 'LineString') continue;
    for (const [lon, lat] of feat.geometry.coordinates as [number, number][]) {
      latSum += lat;
      lonSum += lon;
      count++;
    }
  }
  if (count === 0) return { lat: 48.137, lon: 11.576 };
  return { lat: latSum / count, lon: lonSum / count };
}

export function generateMuenchenRealMap(): GameMap {
  const elements = geoJsonToOverpassElements(muenchenGeoJson as GeoJSON);
  const center = computeCenter(muenchenGeoJson as GeoJSON);

  // Tìm road đẻ đi đầu tiên (không phải đường đi bộ / 보도)
  const drivableWay = elements.find(
    (e) =>
      e.type === 'way' &&
      e.tags.highway &&
      !['pedestrian', 'footway', 'path', 'steps', 'cycleway', 'service'].includes(e.tags.highway) &&
      e.nodes &&
      e.nodes.length > 0
  );

  const spawnOsmNodeId = drivableWay?.nodes?.[0];

  return parseOSMToGameMap(elements, center.lat, center.lon, spawnOsmNodeId);
}
