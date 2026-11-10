// Test migration V1 → V2 với Node.js
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock migration functions (simplified for Node.js test)
const migrateMapV1ToV2 = (oldMap) => {
  console.log('🔄 Migrating map from V1 to V2...');

  const newMap = {
    version: 2,
    metadata: {
      name: oldMap.mapInfo?.name || 'Migrated Map',
      description: `Migrated from V1 on ${new Date().toISOString()}`,
      gridSize: oldMap.mapInfo?.gridSize || 10
    },
    nodes: [],
    roads: [],
    objects: [],
    spawnPoints: []
  };

  let nodeIdCounter = 0;
  let roadIdCounter = 0;
  let objectIdCounter = 0;
  let spawnIdCounter = 0;

  const generateNodeId = () => `node_${String(++nodeIdCounter).padStart(3, '0')}`;
  const generateRoadId = () => `road_${String(++roadIdCounter).padStart(3, '0')}`;
  const generateObjectId = () => `obj_${String(++objectIdCounter).padStart(3, '0')}`;
  const generateSpawnId = () => `spawn_${String(++spawnIdCounter).padStart(3, '0')}`;

  const getCenterPoint = (element) => ({
    x: element.x + element.width / 2,
    z: element.z + element.height / 2
  });

  // Migrate spawn point from mapInfo
  if (oldMap.mapInfo?.spawnPoint) {
    const spawn = oldMap.mapInfo.spawnPoint;
    newMap.spawnPoints.push({
      id: generateSpawnId(),
      x: spawn.x,
      z: spawn.z,
      rotation: 0,
      laneId: null,
      roadId: null,
      type: 'PLAYER'
    });
  }

  // Migrate road elements
  if (oldMap.elements) {
    const roadElements = oldMap.elements.filter(el =>
      el.type === 'ROAD_STRAIGHT' || el.type === 'INTERSECTION_4WAY'
    );

    roadElements.forEach(element => {
      const nodeId1 = generateNodeId();
      const nodeId2 = generateNodeId();

      // Simple corners (ignoring rotation for now)
      const startCorner = { x: element.x, z: element.z };
      const endCorner = { x: element.x + element.width, z: element.z + element.height };

      newMap.nodes.push({ id: nodeId1, x: startCorner.x, z: startCorner.z, type: 'DEFAULT' });
      newMap.nodes.push({ id: nodeId2, x: endCorner.x, z: endCorner.z, type: 'DEFAULT' });

      const isIntersection = element.type === 'INTERSECTION_4WAY';
      newMap.roads.push({
        id: generateRoadId(),
        startNode: nodeId1,
        endNode: nodeId2,
        lanes: isIntersection ? 4 : 2,
        laneWidth: 3.5,
        speedLimit: oldMap.mapInfo?.maxSpeedLimit || 50,
        type: isIntersection ? 'INTERSECTION' : 'STRAIGHT',
        oneWay: false,
        priority: 'NORMAL'
      });
    });

    // Migrate non-road elements
    oldMap.elements.forEach(element => {
      if (element.type === 'ROAD_STRAIGHT' || element.type === 'INTERSECTION_4WAY') {
        return;
      }

      const center = getCenterPoint(element);

      if (element.type === 'SPAWN_POINT') {
        newMap.spawnPoints.push({
          id: generateSpawnId(),
          x: center.x,
          z: center.z,
          rotation: element.rotation || 0,
          laneId: null,
          roadId: null,
          type: 'PLAYER'
        });
        return;
      }

      newMap.objects.push({
        id: generateObjectId(),
        type: element.type,
        x: center.x,
        z: center.z,
        rotation: element.rotation || 0,
        ...(element.signType && { signType: element.signType }),
        ...(element.value !== undefined && { value: element.value }),
        ...(element.width && { width: element.width }),
        ...(element.height && { height: element.height })
      });
    });
  }

  console.log('✅ Migration complete:', {
    nodes: newMap.nodes.length,
    roads: newMap.roads.length,
    objects: newMap.objects.length,
    spawnPoints: newMap.spawnPoints.length
  });

  return newMap;
};

// Run test
try {
  const testMapPath = join(__dirname, 'test-driving-map.json');
  const testMapContent = readFileSync(testMapPath, 'utf-8');
  const testMapV1 = JSON.parse(testMapContent);

  console.log('🧪 Testing migration V1 → V2...');
  console.log('📥 Input map V1:', JSON.stringify(testMapV1, null, 2).substring(0, 500) + '...');

  const migratedMap = migrateMapV1ToV2(testMapV1);

  console.log('📤 Output map V2:', JSON.stringify(migratedMap, null, 2));

  // Save migrated map
  const outputPath = join(__dirname, 'test-driving-map-v2.json');
  writeFileSync(outputPath, JSON.stringify(migratedMap, null, 2));
  console.log('💾 Migrated map saved to:', outputPath);

} catch (error) {
  console.error('❌ Test failed:', error);
}