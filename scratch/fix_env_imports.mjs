// Quét deps thiếu trong environment.js (buildCityWorld + buildCustomMap) so với exports của streetProps
import fs from 'fs';

const src = fs.readFileSync('src/components/environment.js', 'utf8');
const exportsList = fs.readFileSync('scratch/streetprops_exports.txt', 'utf8').split('\n').filter(Boolean);

const strip = (s) => s
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');

// bỏ phần import của file, chỉ scan thân
const bodyStart = src.lastIndexOf("} from './streetProps.js';");
const body = strip(src.slice(bodyStart));
const locals = new Set();
for (const m of body.matchAll(/(?:const|let|function|class)\s+([\w$]+)/g)) locals.add(m[1]);
for (const m of body.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=/g)) {
  for (const w of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) locals.add(w[0]);
}
// imports hiện có của environment
const imports = new Set();
for (const m of src.matchAll(/import\s+(?:\{([^}]*)\}|([\w$]+))\s+from/g)) {
  if (m[1]) for (const w of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) imports.add(w[0]);
  if (m[2]) imports.add(m[2]);
}
const tokens = new Set();
for (const m of body.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) tokens.add(m[1]);
const missing = [...tokens].filter(t => exportsList.includes(t) && !locals.has(t) && !imports.has(t));
console.log('missing from streetProps import:', missing.sort().join(', '));
