// Refactor B2: trích khối sa_hinh_fahrschule → saHinhWorld.js
import fs from 'fs';

const P = 'src/components/environment.js';
const src = fs.readFileSync(P, 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';

const startMarker = "  // 🏎️ KHU SA HÌNH HỌC LÁI XE TỔNG HỢP 3D FAHRSCHULE";
const endMarker = "  if (mapType === 'landstrasse_wald') {";
const sIdx = src.indexOf(startMarker);
const eIdx = src.indexOf(endMarker, sIdx);
if (sIdx === -1 || eIdx === -1) { console.error('markers missing'); process.exit(1); }

const ifBlock = src.slice(sIdx, eIdx);
// nội dung bên trong if { ... }
const openIdx = ifBlock.indexOf('{');
const body = ifBlock.slice(openIdx + 1).replace(/\r?\n\}\s*$/, '');

// quét deps của body
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
const params = new Set(['scene', 'scenery', 'colliders', 'config', 'spawnX', 'initWorldZ', 'grassL', 'grassWidth', 'grassLength']);
const missing = [...tokens].filter(t => !locals.has(t) && !params.has(t) && /^[a-zA-Z_$]/.test(t));
console.log('missing (cần import hoặc param):', missing.sort().join(', '));

const fn = (
  "// 🏁 SA HÌNH FAHRSCHULE — sân bãi đa mô hình Verkehrsübungsplatz (tách từ environment.js, phase B2)" + NL +
  "import * as THREE from 'three';" + NL +
  "import {" + NL +
  "  createEntranceGate, createFloodlightTower, createControlCenterBuilding," + NL +
  "  createTrafficCone, createRoadArrow, createSharkTeethYield, createTireWall," + NL +
  "  createSaHinhBanner, createHillRamp, createZebraCrosswalk, createParkingMarkings," + NL +
  "  createFinishArch, createTotemSign, createPineTree, createLeitpfosten," + NL +
  "  createParkedDummyCar, makeGermanStVOSign, createCornerPole" + NL +
  "} from './streetProps.js';" + NL +
  "import { makeTrafficLight } from './3dObjects.js';" + NL + NL +
  "export function buildSaHinhWorld(scene, scenery, colliders, saHinhRamps, isPerformance) {" + NL +
  body + NL +
  "}" + NL
);
fs.writeFileSync('src/components/saHinhWorld.js', fn);

// thay block trong buildCityWorld bằng call
const callBlock = "  // 🏎️ Khu sa hình — tách sang saHinhWorld.js (phase B2)" + NL +
  "  if (mapType === 'sa_hinh_fahrschule') {" + NL +
  "    buildSaHinhWorld(scene, scenery, colliders, saHinhRamps, isPerformance);" + NL +
  "  }" + NL + NL;
let newSrc = src.slice(0, sIdx) + callBlock + src.slice(eIdx);

// import buildSaHinhWorld
const impAnchor = "import { buildAutobahnDistrict } from './autobahnDistrict.js';";
newSrc = newSrc.replace(impAnchor, impAnchor + NL + "import { buildSaHinhWorld } from './saHinhWorld.js';");
fs.writeFileSync(P, newSrc);
console.log('saHinhWorld extracted | env now:', newSrc.split(NL).length, 'lines');
