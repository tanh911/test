import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const srcPath = path.join(root, 'src/components/DrivingSimulation.jsx');
const src = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/);

function extract(start, end, outFile, header = '') {
  const body = src.slice(start - 1, end).join('\n');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, header + body + '\n');
  console.log('Wrote', path.relative(root, outFile), `(${end - start + 1} lines)`);
}

function exportFunctions(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^function /gm, 'export function ');
  fs.writeFileSync(filePath, content);
}

extract(39, 189, path.join(root, 'src/simulation/SoundEngine.js'), 'export ');

extract(192, 261, path.join(root, 'src/ui/ARNavigationBox.jsx'), "import React from 'react';\nimport { Compass } from 'lucide-react';\n\nexport ");
extract(264, 341, path.join(root, 'src/ui/VirtualCockpitCluster.jsx'), "import React from 'react';\n\nexport ");
extract(344, 367, path.join(root, 'src/ui/ScoreHUD.jsx'), "import React from 'react';\n\nexport ");
extract(370, 412, path.join(root, 'src/ui/ExaminerPanel.jsx'), "import React from 'react';\n\nexport ");

extract(13, 35, path.join(root, 'src/simulation/seatConfig.js'), 'export ');

extract(805, 911, path.join(root, 'src/simulation/textures.js'), "import * as THREE from 'three';\n\n");
exportFunctions(path.join(root, 'src/simulation/textures.js'));

const signsPart1 = src.slice(913, 961).join('\n').replace(/^function /gm, 'export function ');
const signsPart2 = src.slice(1222, 1235).join('\n').replace(/^function /gm, 'export function ');
fs.writeFileSync(
  path.join(root, 'src/simulation/signs.js'),
  "import * as THREE from 'three';\n\n" + signsPart1 + '\n\n' + signsPart2 + '\n'
);
console.log('Wrote src/simulation/signs.js');

extract(778, 802, path.join(root, 'src/simulation/trafficAI.js'), "import * as THREE from 'three';\n\n");
exportFunctions(path.join(root, 'src/simulation/trafficAI.js'));

extract(417, 775, path.join(root, 'src/simulation/carBuilder.js'), "import * as THREE from 'three';\nimport { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';\n\n");
exportFunctions(path.join(root, 'src/simulation/carBuilder.js'));

extract(
  964,
  1220,
  path.join(root, 'src/simulation/worldBuilder.js'),
  "import * as THREE from 'three';\nimport { createGrassTexture, createRoadTexture, createBuildingFacadeTexture } from './textures.js';\nimport { makeGermanSign, makeTrafficLight } from './signs.js';\n\n"
);
exportFunctions(path.join(root, 'src/simulation/worldBuilder.js'));

// Simulation engine (animate loop inside useEffect)
extract(
  1589,
  2193,
  path.join(root, 'src/simulation/simulationEngine.js'),
  `import * as THREE from 'three';
import { SCENARIOS, MAP_SCENARIOS, initScore, applyEvent } from '../components/SimScenarios.js';
import { DEFAULT_SEAT_CONFIG } from './seatConfig.js';
import { audioEngine } from './SoundEngine.js';
import { create3DPlayerCar, create3DCockpit } from './carBuilder.js';
import { buildCityWorld } from './worldBuilder.js';
import { createTrafficAICar } from './trafficAI.js';
import { makeGermanSign, makeTrafficLight } from './signs.js';

export function initSimulationEngine(container, refs, callbacks) {
  let isMounted = true, renderer, clock, reqId;
  const trafficLights = [];
  const aiCars = [];
  let blinkTimer = 0;

  const init = async () => {
    try {
`
);

let engine = fs.readFileSync(path.join(root, 'src/simulation/simulationEngine.js'), 'utf8');
// Fix indentation - the extracted code had 8 spaces from inside useEffect, reduce by 4
engine = engine.split('\n').map((line, i) => {
  if (i < 20) return line; // keep header
  if (line.startsWith('        ')) return line.slice(4);
  if (line.startsWith('      ')) return line.slice(2);
  return line;
}).join('\n');

// Replace closing of useEffect with proper function closing
engine = engine.replace(
  /    init\(\);\n    return \(\) => \{/,
  '  init();\n  return () => {'
);
engine = engine.replace(
  /      isMounted = false;\n      if \(reqId\) cancelAnimationFrame\(reqId\);\n      if \(renderer\) renderer\.dispose\(\);\n      if \(containerRef\.current\) containerRef\.current\.innerHTML = '';\n    \};\n  \}, \[\]\);/,
  `    isMounted = false;
    if (reqId) cancelAnimationFrame(reqId);
    if (renderer) renderer.dispose();
    if (container) container.innerHTML = '';
  };
}
`
);

// Replace containerRef.current with container
engine = engine.replace(/containerRef\.current/g, 'container');

// Replace setState calls with callbacks
const stateSetters = [
  'setIsDriving', 'setSpeed', 'setSteerAngle', 'setGear', 'setRpm', 'setNitroEnergy',
  'setDistanceTraveled', 'setActiveScenario', 'setScenarioIdx', 'setScore', 'setEvents',
  'setFinished', 'setCollision'
];
for (const setter of stateSetters) {
  engine = engine.replace(new RegExp(`\\b${setter}\\(`, 'g'), `callbacks.${setter}(`);
}

fs.writeFileSync(path.join(root, 'src/simulation/simulationEngine.js'), engine);
console.log('Wrote src/simulation/simulationEngine.js');
