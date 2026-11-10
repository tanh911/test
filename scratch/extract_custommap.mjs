// Refactor B3: trích buildCustomMap + reloadCustomMap → customMapBuilder.js
import fs from 'fs';

const P = 'src/components/environment.js';
const src = fs.readFileSync(P, 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';

const startMarker = 'export function buildCustomMap';
const sIdx = src.indexOf(startMarker);
const body = src.slice(sIdx); // buildCustomMap + reloadCustomMap đến hết file
if (!body.includes('export function reloadCustomMap')) { console.error('reloadCustomMap missing'); process.exit(1); }

// quét deps của body (strip strings/comments)
const strip = (s) => s
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');
const code = strip(body);
const locals = new Set();
for (const m of code.matchAll(/(?:const|let|function|class)\s+([\w$]+)/g)) locals.add(m[1]);
for (const m of code.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=/g)) {
  for (const w of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) locals.add(w[0]);
}
const tokens = new Set();
for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) tokens.add(m[1]);
const missing = [...tokens].filter(t => !locals.has(t) && /^[A-Za-z_$]/.test(t) && !['scene', 'mapData', 'options', 'playerCar', 'aiCars', 'trafficLights', 'refs'].includes(t));
console.log('deps cần import:', missing.sort().join(', '));

// imports: từ environment imports gốc + streetProps
const out = (
  "// 🛠️ Custom Map Builder — dựng map từ elements của Map Editor (tách từ environment.js, phase B3)" + NL +
  "import * as THREE from 'three';" + NL +
  "import { createBuildingFacadeTexture, ensureUV2 } from './textures.js';" + NL +
  "import {" + NL +
  "  canvasTextureCache, getOrCreateCanvasTexture, getSharedTexturedMaterial, sharedMaterials," + NL +
  "  getOrCreateWallMaterial, getOrCreateAwningMaterial," + NL +
  "  makeGermanStVOSign, createFinishArch, createTrafficCone, createEntranceGate," + NL +
  "  createZebraCrosswalk, createParkingMarkings, createHillRamp, createPineTree," + NL +
  "  createRoadArrow, createSaHinhBanner, createTotemSign" + NL +
  "} from './streetProps.js';" + NL +
  "import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';" + NL + NL +
  body + NL
);
fs.writeFileSync('src/components/customMapBuilder.js', out);

// environment: bỏ body, import + re-export từ customMapBuilder
const head = src.slice(0, sIdx).rstrip
  ? null : null;
let headSrc = src.slice(0, sIdx).replace(/\r?\n+$/, NL);
// buildCustomMap cũ import từ đâu — head giữ nguyên; environment cần buildCustomMap cho DrivingSimulation import compatibility
const reexport = ("// 🛠️ Custom map builder tách sang customMapBuilder.js — re-export giữ tương thích" + NL +
  "import { buildCustomMap, reloadCustomMap } from './customMapBuilder.js';" + NL +
  "export { buildCustomMap, reloadCustomMap };" + NL);
fs.writeFileSync(P, headSrc + NL + reexport);
console.log('customMapBuilder extracted | env now:', (headSrc + NL + reexport).split(NL).length, 'lines');
