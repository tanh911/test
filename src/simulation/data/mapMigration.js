// ── MAP MIGRATION LAYER - V1 → V2 ─────────────────────────────────────────────
// Chuyển đổi từ rectangle-based map sang node-road-lane graph

import {
  createMapV2,
  createNode,
  createRoad,
  createObject,
  createSpawnPoint
} from './mapSchemaV2.js';

/**
 * Chuyển đổi map V1 sang V2
 * @param {Object} oldMap - Map theo schema cũ (rectangle-based)
 * @returns {Object} Map theo schema mới (node-road-lane)
 */
export const migrateMapV1ToV2 = (oldMap) => {
  console.log('🔄 Migrating map from V1 to V2...');

  const newMap = createMapV2({
    name: oldMap.mapInfo?.name || 'Migrated Map',
    description: `Migrated from V1 on ${new Date().toISOString()}`,
    gridSize: oldMap.mapInfo?.gridSize || 10
  });

  const nodeIdCounter = { count: 0 };
  const roadIdCounter = { count: 0 };
  const objectIdCounter = { count: 0 };
  const spawnIdCounter = { count: 0 };

  // Helper: Generate unique node ID
  const generateNodeId = () => {
    nodeIdCounter.count++;
    return `node_${String(nodeIdCounter.count).padStart(3, '0')}`;
  };

  // Helper: Generate unique road ID
  const generateRoadId = () => {
    roadIdCounter.count++;
    return `road_${String(roadIdCounter.count).padStart(3, '0')}`;
  };

  // Helper: Generate unique object ID
  const generateObjectId = () => {
    objectIdCounter.count++;
    return `obj_${String(objectIdCounter.count).padStart(3, '0')}`;
  };

  // Helper: Generate unique spawn ID
  const generateSpawnId = () => {
    spawnIdCounter.count++;
    return `spawn_${String(spawnIdCounter.count).padStart(3, '0')}`;
  };

  // Helper: Calculate center point of rectangle
  const getCenterPoint = (element) => {
    const x = element.x + element.width / 2;
    const z = element.z + element.height / 2;
    return { x, z };
  };

  // Helper: Calculate corners of rectangle
  const getCorners = (element) => {
    const x = element.x;
    const z = element.z;
    const width = element.width;
    const height = element.height;
    const rotation = (element.rotation || 0) * Math.PI / 180;

    // Base corners (without rotation)
    const corners = [
      { x: x, z: z },           // Top-left
      { x: x + width, z: z },   // Top-right
      { x: x + width, z: z + height },  // Bottom-right
      { x: x, z: z + height }  // Bottom-left
    ];

    // Apply rotation around center
    const centerX = x + width / 2;
    const centerZ = z + height / 2;

    if (rotation !== 0) {
      return corners.map(corner => {
        const dx = corner.x - centerX;
        const dz = corner.z - centerZ;
        return {
          x: centerX + dx * Math.cos(rotation) - dz * Math.sin(rotation),
          z: centerZ + dx * Math.sin(rotation) + dz * Math.cos(rotation)
        };
      });
    }

    return corners;
  };

  // ── MIGRATE SPAWN POINTS ─────────────────────────────────────────────────────
  if (oldMap.mapInfo?.spawnPoint) {
    const spawn = oldMap.mapInfo.spawnPoint;
    newMap.spawnPoints.push(createSpawnPoint(
      generateSpawnId(),
      spawn.x,
      spawn.z,
      {
        rotation: 0,
        type: 'PLAYER'
      }
    ));
  }

  // ── MIGRATE ROAD ELEMENTS TO NODES + ROADS ────────────────────────────────────
  if (oldMap.elements) {
    const roadElements = oldMap.elements.filter(el =>
      el.type === 'ROAD_STRAIGHT' || el.type === 'INTERSECTION_4WAY'
    );

    // Create nodes for each road element
    const elementToNodes = {}; // Map element ID to [startNode, endNode]

    roadElements.forEach(element => {
      const corners = getCorners(element);
      const nodeId1 = generateNodeId();
      const nodeId2 = generateNodeId();

      // Determine start and end based on rotation
      let startCorner, endCorner;
      const rotation = element.rotation || 0;

      if (rotation === 0 || rotation === 180) {
        // Horizontal road
        startCorner = corners[0]; // Top-left
        endCorner = corners[2];   // Bottom-right
      } else if (rotation === 90 || rotation === 270) {
        // Vertical road
        startCorner = corners[0]; // Top-left
        endCorner = corners[2];   // Bottom-right
      } else {
        // Diagonal - use first and last corners
        startCorner = corners[0];
        endCorner = corners[2];
      }

      // Create nodes
      newMap.nodes.push(createNode(nodeId1, startCorner.x, startCorner.z));
      newMap.nodes.push(createNode(nodeId2, endCorner.x, endCorner.z));

      elementToNodes[element.id] = [nodeId1, nodeId2];

      // Create road
      const isIntersection = element.type === 'INTERSECTION_4WAY';
      newMap.roads.push(createRoad(
        generateRoadId(),
        nodeId1,
        nodeId2,
        {
          lanes: isIntersection ? 4 : 2,
          laneWidth: 3.5,
          speedLimit: oldMap.mapInfo?.maxSpeedLimit || 50,
          type: isIntersection ? 'INTERSECTION' : 'STRAIGHT'
        }
      ));
    });

    // ── CONNECT NODES BASED ON PROXIMITY ───────────────────────────────────────
    // Merge nodes that are close to each other (for intersections)
    const SNAP_THRESHOLD = 5; // 5 units
    const nodesToMerge = [];

    for (let i = 0; i < newMap.nodes.length; i++) {
      for (let j = i + 1; j < newMap.nodes.length; j++) {
        const node1 = newMap.nodes[i];
        const node2 = newMap.nodes[j];
        const distance = Math.sqrt(
          Math.pow(node1.x - node2.x, 2) +
          Math.pow(node1.z - node2.z, 2)
        );

        if (distance < SNAP_THRESHOLD) {
          nodesToMerge.push([node1.id, node2.id]);
        }
      }
    }

    // Merge duplicate nodes
    const nodeMerges = {}; // Map old node ID to new node ID
    nodesToMerge.forEach(([id1, id2]) => {
      if (!nodeMerges[id1] && !nodeMerges[id2]) {
        // Keep id1, merge id2 into id1
        nodeMerges[id2] = id1;
      } else if (nodeMerges[id1] && !nodeMerges[id2]) {
        // id1 already merged, merge id2 into the same target
        nodeMerges[id2] = nodeMerges[id1];
      } else if (!nodeMerges[id1] && nodeMerges[id2]) {
        // id2 already merged, merge id1 into the same target
        nodeMerges[id1] = nodeMerges[id2];
      }
    });

    // Apply node merges to roads
    newMap.roads.forEach(road => {
      if (nodeMerges[road.startNode]) {
        road.startNode = nodeMerges[road.startNode];
      }
      if (nodeMerges[road.endNode]) {
        road.endNode = nodeMerges[road.endNode];
      }
    });

    // Remove merged nodes
    const mergedNodeIds = new Set(Object.keys(nodeMerges));
    newMap.nodes = newMap.nodes.filter(node => !mergedNodeIds.has(node.id));

    // ── MIGRATE NON-ROAD ELEMENTS TO OBJECTS ───────────────────────────────────
    oldMap.elements.forEach(element => {
      if (element.type === 'ROAD_STRAIGHT' || element.type === 'INTERSECTION_4WAY') {
        return; // Already handled as roads
      }

      const center = getCenterPoint(element);
      let objectType = element.type;

      // Map old types to new object types
      if (element.type === 'SIGN') {
        objectType = 'SIGN';
      } else if (element.type === 'TRAFFIC_LIGHT') {
        objectType = 'TRAFFIC_LIGHT';
      } else if (element.type === 'BUILDING') {
        objectType = 'BUILDING';
      } else if (element.type === 'TREE') {
        objectType = 'TREE';
      } else if (element.type === 'SIDEWALK') {
        objectType = 'SIDEWALK';
      } else if (element.type === 'ZEBRA') {
        objectType = 'ZEBRA';
      } else if (element.type === 'SPAWN_POINT') {
        // Handle as spawn point, not object
        newMap.spawnPoints.push(createSpawnPoint(
          generateSpawnId(),
          center.x,
          center.z,
          {
            rotation: element.rotation || 0,
            type: 'PLAYER'
          }
        ));
        return;
      }

      newMap.objects.push(createObject(
        generateObjectId(),
        objectType,
        center.x,
        center.z,
        {
          rotation: element.rotation || 0,
          width: element.width,
          height: element.height,
          signType: element.signType,
          value: element.value
        }
      ));
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

/**
 * Detect map version and auto-migrate if needed
 * @param {Object} map - Map data (any version)
 * @returns {Object} Map in V2 format
 */
export const ensureMapV2 = (map) => {
  if (!map) {
    console.warn('⚠️ No map data provided');
    return createMapV2();
  }

  if (map.version === 2) {
    console.log('✅ Map already in V2 format');
    return map;
  }

  if (map.version === 1 || !map.version) {
    console.log('🔄 Map in V1 format, migrating...');
    return migrateMapV1ToV2(map);
  }

  console.warn(`⚠️ Unknown map version: ${map.version}`);
  return createMapV2();
};