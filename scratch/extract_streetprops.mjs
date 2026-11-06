// Refactor B1: trích caches + prop factories từ environment.js → streetProps.js
import fs from 'fs';

const P = 'src/components/environment.js';
const src = fs.readFileSync(P, 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';

const c1Start = src.indexOf('// ── 0. GLOBAL CANVAS TEXTURE CACHE');
const c1End = src.indexOf('// ── 1. HELPER CHUẨN HÓA BIỂN BÁO');
const c2End = src.indexOf('export function buildCityWorld');
const chunk1 = src.slice(c1Start, c1End);
const chunk2 = src.slice(c1End, c2End);
const rest = src.slice(c2End);

// quét deps của chunk (strip strings/comments)
const strip = (s) => s
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');
const code = strip(chunk1 + chunk2);
const localDefs = new Set();
for (const m of code.matchAll(/(?:const|let|function|class)\s+([\w$]+)/g)) localDefs.add(m[1]);
const ext = new Set();
for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) {
  const t = m[1];
  if (!localDefs.has(t) && /^[A-Z]/.test(t)) ext.add(t);
}
console.log('external deps:', [...ext].sort().join(', '));

// imports cho streetProps: THREE + textures.js (một số factory dùng createBuildingFacadeTexture/ensureUV2)
const needTextures = /createBuildingFacadeTexture|createPbrRoadMaterial|createPbrGrassMaterial|createBikeLaneMaterial|createSidewalkMaterial|createCobblestoneMaterial|ensureUV2/.test(code);
const need3dObjects = /makeTrafficLight|createTrafficAICar/.test(code);

let imports = "import * as THREE from 'three';" + NL;
if (needTextures) imports += "import { createBuildingFacadeTexture, ensureUV2 } from './textures.js';" + NL;
if (need3dObjects) imports += "import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';" + NL;

const out = "// 🏗️ Street props & StVO sign factories — tách từ environment.js (refactor phase B1)." + NL +
  "// Lý do tách: phá import cycle environment ⇄ district builders (giờ cả 2 import module này)." + NL +
  imports + NL + chunk1 + chunk2;
fs.writeFileSync('src/components/streetProps.js', out);

// environment.js: bỏ 2 chunk, import + re-export từ streetProps
const newEnv = src.slice(0, c1Start) +
  '// 🧩 Caches + prop factories đã tách sang streetProps.js — re-export giữ tương thích' + NL +
  "export * from './streetProps.js';" + NL +
  "import {" + NL +
  "  canvasTextureCache, getOrCreateCanvasTexture, getSharedTexturedMaterial," + NL +
  "  sharedMaterials, getOrCreateWallMaterial, getOrCreateAwningMaterial," + NL +
  "  makeGermanStVOSign, createFinishArch, createAutobahnGantry" + NL +
  "} from './streetProps.js';" + NL + NL +
  rest;
fs.writeFileSync(P, newEnv);

// danh sách export của streetProps để district builders đổi import
const names = [];
for (const m of chunk1.matchAll(/export (?:const|function) ([\w$]+)/g)) names.push(m[1]);
for (const m of chunk2.matchAll(/export (?:const|function) ([\w$]+)/g)) names.push(m[1]);
fs.writeFileSync('scratch/streetprops_exports.txt', names.join('\n'));
console.log('streetProps exports:', names.length);
console.log('environment now:', newEnv.split(NL).length, 'lines');
