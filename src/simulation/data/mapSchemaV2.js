// ── MAP SCHEMA V2 - Node-Road-Lane Architecture ────────────────────────────────
// Cấu trúc map mới dựa trên graph topology thay vì các rectangle độc lập

/**
 * Map Schema V2
 * {
 *   version: 2,
 *   metadata: { ... },
 *   nodes: [ ... ],
 *   roads: [ ... ],
 *   objects: [ ... ],
 *   spawnPoints: [ ... ]
 * }
 */

// ── 1. NODES ─────────────────────────────────────────────────────────────────
// Node là điểm kết nối giữa các đường
export const createNode = (id, x, z) => ({
  id,
  x,
  z,
  type: 'DEFAULT' // DEFAULT, INTERSECTION, DEAD_END
});

// ── 2. ROADS ───────────────────────────────────────────────────────────────────
// Road nối 2 nodes với thông tin về lanes
export const createRoad = (id, startNode, endNode, options = {}) => ({
  id,
  startNode,
  endNode,
  lanes: options.lanes || 2,
  laneWidth: options.laneWidth || 3.5,
  speedLimit: options.speedLimit || 50,
  type: options.type || 'STRAIGHT', // STRAIGHT, CURVE, INTERSECTION
  oneWay: options.oneWay || false,
  priority: options.priority || 'NORMAL' // NORMAL, PRIORITY, YIELD
});

// ── 3. OBJECTS ─────────────────────────────────────────────────────────────────
// Objects decor và các yếu tố giao thông
export const createObject = (id, type, x, z, options = {}) => ({
  id,
  type, // SIGN, TRAFFIC_LIGHT, BUILDING, TREE, SIDEWALK, ZEBRA, etc.
  x,
  z,
  rotation: options.rotation || 0,
  // Type-specific properties
  ...(type === 'SIGN' && {
    signType: options.signType, // SPEED_LIMIT, STOP, PRIORITY, YIELD
    value: options.value // cho SPEED_LIMIT
  }),
  ...(type === 'TRAFFIC_LIGHT' && {
    initialState: options.initialState || 'RED'
  }),
  ...(type === 'BUILDING' && {
    width: options.width || 6,
    height: options.height || 8,
    depth: options.depth || 8
  }),
  ...(type === 'TREE' && {
    species: options.species || 'DEFAULT'
  })
});

// ── 4. SPAWN POINTS ─────────────────────────────────────────────────────────────
// Spawn points cho xe người chơi và AI
export const createSpawnPoint = (id, x, z, options = {}) => ({
  id,
  x,
  z,
  rotation: options.rotation || 0,
  laneId: options.laneId || null, // Optional: gắn với lane cụ thể
  roadId: options.roadId || null, // Optional: gắn với road cụ thể
  type: options.type || 'PLAYER' // PLAYER, AI, PEDESTRIAN
});

// ── 5. COMPLETE MAP STRUCTURE ──────────────────────────────────────────────────
export const createMapV2 = (metadata = {}) => ({
  version: 2,
  metadata: {
    name: metadata.name || 'Untitled Map',
    description: metadata.description || '',
    author: metadata.author || '',
    createdAt: metadata.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gridSize: metadata.gridSize || 10
  },
  nodes: [],
  roads: [],
  objects: [],
  spawnPoints: []
});

// ── 6. VALIDATION HELPERS ──────────────────────────────────────────────────────
export const validateMapV2 = (map) => {
  const errors = [];
  const warnings = [];

  // Validate version
  if (map.version !== 2) {
    errors.push(`Invalid map version: ${map.version}, expected 2`);
  }

  // Validate nodes
  const nodeIds = new Set();
  map.nodes.forEach(node => {
    if (!node.id) {
      errors.push('Node missing id');
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }

    if (typeof node.x !== 'number' || typeof node.z !== 'number') {
      errors.push(`Node ${node.id} has invalid coordinates`);
    }
  });

  // Validate roads
  const roadIds = new Set();
  map.roads.forEach(road => {
    if (!road.id) {
      errors.push('Road missing id');
    } else if (roadIds.has(road.id)) {
      errors.push(`Duplicate road id: ${road.id}`);
    } else {
      roadIds.add(road.id);
    }

    if (!nodeIds.has(road.startNode)) {
      errors.push(`Road ${road.id} references missing startNode: ${road.startNode}`);
    }

    if (!nodeIds.has(road.endNode)) {
      errors.push(`Road ${road.id} references missing endNode: ${road.endNode}`);
    }

    if (road.startNode === road.endNode) {
      errors.push(`Road ${road.id} has same start and end node`);
    }

    if (road.lanes < 1 || road.lanes > 8) {
      warnings.push(`Road ${road.id} has unusual lane count: ${road.lanes}`);
    }

    if (road.laneWidth < 2 || road.laneWidth > 5) {
      warnings.push(`Road ${road.id} has unusual lane width: ${road.laneWidth}`);
    }
  });

  // Validate spawn points
  map.spawnPoints.forEach(spawn => {
    if (!spawn.id) {
      errors.push('Spawn point missing id');
    }

    if (typeof spawn.x !== 'number' || typeof spawn.z !== 'number') {
      errors.push(`Spawn point ${spawn.id} has invalid coordinates`);
    }

    if (spawn.roadId && !roadIds.has(spawn.roadId)) {
      warnings.push(`Spawn point ${spawn.id} references missing road: ${spawn.roadId}`);
    }
  });

  // Check for isolated nodes
  const connectedNodeIds = new Set();
  map.roads.forEach(road => {
    connectedNodeIds.add(road.startNode);
    connectedNodeIds.add(road.endNode);
  });

  map.nodes.forEach(node => {
    if (!connectedNodeIds.has(node.id)) {
      warnings.push(`Node ${node.id} is isolated (no connected roads)`);
    }
  });

  // Check for disconnected road segments
  if (map.roads.length > 1) {
    const visitedRoads = new Set();
    const visitedNodes = new Set();

    // Start from first road
    const startRoad = map.roads[0];
    visitedRoads.add(startRoad.id);
    visitedNodes.add(startRoad.startNode);
    visitedNodes.add(startRoad.endNode);

    // Traverse graph
    let changed = true;
    while (changed) {
      changed = false;
      map.roads.forEach(road => {
        if (!visitedRoads.has(road.id)) {
          if (visitedNodes.has(road.startNode) || visitedNodes.has(road.endNode)) {
            visitedRoads.add(road.id);
            visitedNodes.add(road.startNode);
            visitedNodes.add(road.endNode);
            changed = true;
          }
        }
      });
    }

    if (visitedRoads.size < map.roads.length) {
      warnings.push(`Map has disconnected road segments (${visitedRoads.size}/${map.roads.length} connected)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// ── 7. GRAPH ANALYSIS HELPERS ───────────────────────────────────────────────────
export const buildRoadGraph = (map) => {
  const graph = {};

  map.roads.forEach(road => {
    // Forward direction
    if (!graph[road.startNode]) {
      graph[road.startNode] = [];
    }
    graph[road.startNode].push({
      roadId: road.id,
      targetNode: road.endNode,
      oneWay: road.oneWay
    });

    // Reverse direction (if not one-way)
    if (!road.oneWay) {
      if (!graph[road.endNode]) {
        graph[road.endNode] = [];
      }
      graph[road.endNode].push({
        roadId: road.id,
        targetNode: road.startNode,
        oneWay: road.oneWay
      });
    }
  });

  return graph;
};

export const getConnectedRoads = (map, nodeId) => {
  const graph = buildRoadGraph(map);
  return graph[nodeId] || [];
};

export const findPath = (map, startNodeId, endNodeId) => {
  const graph = buildRoadGraph(map);
  const visited = new Set();
  const queue = [[startNodeId, []]];

  while (queue.length > 0) {
    const [currentNodeId, path] = queue.shift();

    if (currentNodeId === endNodeId) {
      return path;
    }

    if (visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    const connections = graph[currentNodeId] || [];
    connections.forEach(conn => {
      if (!visited.has(conn.targetNode)) {
        queue.push([conn.targetNode, [...path, conn]]);
      }
    });
  }

  return null; // No path found
};