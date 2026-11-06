// Phân tích identifier thiếu trong createLoadMapIntoScene.js
import fs from 'fs';

const src = fs.readFileSync('scratch/driv_old.jsx', 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';
const start = src.indexOf('        const loadMapIntoScene = (mapId, mapData) => {');
const end = src.indexOf(NL + '        };', start) + (NL + '        };').length;
let code = src.slice(start, end);
code = code.replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '');
const locals = new Set();
for (const m of code.matchAll(/(?:const|let|function)\s+([\w$]+)/g)) locals.add(m[1]);
locals.add('mapId'); locals.add('mapData');
const params = new Set(['refs', 'scene', 'isPerformance', 'setPlayerCarWorldPos', 'setCurrentZone']);
const importsKnown = new Set(['MAPS', 'MAP_SCENARIOS', 'SCENARIOS', 'buildCityWorld', 'buildCustomMap',
  'disposeGroupDeep', 'snapSpawnToLaneCenter', 'detectZoneForMap', 'BERLIN_FIXED_SPAWN',
  'Math', 'Object', 'JSON', 'window', 'document', 'console', 'Date', 'parseFloat', 'parseInt', 'Number',
  'String', 'isNaN', 'isFinite', 'setTimeout', 'clearTimeout', 'performance', 'localStorage',
  'undefined', 'true', 'false', 'null', 'Infinity']);
const tokens = new Set();
for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) tokens.add(m[1]);
const missing = [...tokens].filter(t => !locals.has(t) && !params.has(t) && !importsKnown.has(t) && /^[A-Z]/.test(t));
console.log('MISSING (uppercase):', missing.sort().join(', '));
const stop = new Set(['length', 'value', 'items', 'forEach', 'push', 'index', 'entry', 'group', 'scene', 'cache', 'state', 'map', 'data', 'name', 'road', 'light', 'spawn', 'route', 'filter', 'some', 'find', 'keys', 'has', 'get', 'set', 'player', 'traffic', 'lights', 'scenario', 'corridor', 'cross', 'street', 'dist', 'speed', 'zone', 'colliders', 'mesh', 'position', 'rotation', 'current', 'world', 'moving', 'scene', 'temp', 'list', 'count', 'first', 'safe', 'prev', 'next']);
const lower = [...tokens].filter(t => !locals.has(t) && !params.has(t) && !importsKnown.has(t) && /^[a-z]/.test(t) && !stop.has(t) && t.length > 3);
console.log('LOWER suspects:', lower.sort().join(', '));
