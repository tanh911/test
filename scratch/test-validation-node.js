// Test validation cho map V2
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simplified validation (matching the schema)
const validateMapV2 = (map) => {
  const errors = [];
  const warnings = [];

  if (map.version !== 2) {
    errors.push(`Invalid map version: ${map.version}, expected 2`);
  }

  const nodeIds = new Set();
  map.nodes.forEach(node => {
    if (!node.id) {
      errors.push('Node missing id');
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }
  });

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
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Run test
try {
  const testMapPath = join(__dirname, 'test-driving-map-v2.json');
  const testMapContent = readFileSync(testMapPath, 'utf-8');
  const testMapV2 = JSON.parse(testMapContent);

  console.log('🧪 Testing validation for V2 map...');

  const validation = validateMapV2(testMapV2);

  console.log('✅ Validation result:', validation);

  if (validation.valid) {
    console.log('🎉 Map V2 is valid!');
  } else {
    console.log('❌ Map V2 has errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

} catch (error) {
  console.error('❌ Test failed:', error);
}