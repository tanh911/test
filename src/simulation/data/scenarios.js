// Re-exporting scenarios flattened for easy lookup by ID
import { MAP_SCENARIOS, SCENARIOS as DEFAULT_SCENARIOS } from '../../components/SimScenarios.js';

const allScenariosMap = {};

// Flatten MAP_SCENARIOS
Object.keys(MAP_SCENARIOS).forEach(mapType => {
  MAP_SCENARIOS[mapType].forEach(sc => {
    allScenariosMap[sc.id] = sc;
  });
});

// Add DEFAULT_SCENARIOS
DEFAULT_SCENARIOS.forEach(sc => {
  if (!allScenariosMap[sc.id]) {
    allScenariosMap[sc.id] = sc;
  }
});

export const SCENARIOS = allScenariosMap;

export { initScore, applyEvent, MAX_SCORE } from '../../components/SimScenarios.js';
