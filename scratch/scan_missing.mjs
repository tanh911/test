// Quét identifier còn thiếu trong createLoadMapIntoScene.js — chạy lặp đến khi trống
import fs from 'fs';

const src = fs.readFileSync('src/components/sim/createLoadMapIntoScene.js', 'utf8');
let code = src
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');

const locals = new Set();
for (const m of code.matchAll(/(?:const|let|function|class)\s+([\w$]+)/g)) locals.add(m[1]);
for (const m of code.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=/g)) {
  for (const w of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) locals.add(w[0]);
}
const params = new Set();
const fp = code.match(/createLoadMapIntoScene = \(\{([^}]*)\}\)/);
if (fp) for (const w of fp[1].matchAll(/[A-Za-z_$][\w$]*/g)) params.add(w[0]);
params.add('mapId'); params.add('mapData');
const imports = new Set();
for (const m of src.matchAll(/import\s+(?:\{([^}]*)\}|([\w$]+))\s+from/g)) {
  if (m[1]) for (const w of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) imports.add(w[0]);
  if (m[2]) imports.add(m[2]);
}
const globals = new Set(['Math', 'Object', 'JSON', 'window', 'document', 'console', 'Date', 'parseFloat',
  'parseInt', 'Number', 'String', 'Boolean', 'isNaN', 'isFinite', 'setTimeout', 'clearTimeout', 'setInterval',
  'clearInterval', 'requestAnimationFrame', 'performance', 'localStorage', 'undefined', 'true', 'false', 'null',
  'Infinity', 'Array', 'Error', 'Promise', 'Map', 'Set']);

const tokens = new Set();
for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) tokens.add(m[1]);
const missing = [...tokens].filter(t => !locals.has(t) && !params.has(t) && !imports.has(t) && !globals.has(t));
console.log('MISSING:', missing.sort().join(', ') || '(none)');
