# -*- coding: utf-8 -*-
import io

p = 'src/components/autobahnDistrict.js'
src = io.open(p, encoding='utf-8').read()

old = "      console.log('[guidance-debug] startId', startId, 'endId', endId, 'adjSize', adj.size, 'nodePosSize', nodePos.size,"
new = """      {
        const _seen = new Set([startId]);
        const _q = [startId];
        while (_q.length) {
          const _u = _q.shift();
          for (const _e of (adj.get(_u) || [])) {
            if (!_seen.has(_e.to)) { _seen.add(_e.to); _q.push(_e.to); }
          }
        }
        console.log('[guidance-debug] BFS from startId reaches', _seen.size, '| endId reachable:', _seen.has(endId));
      }
      console.log('[guidance-debug] startId', startId, 'endId', endId, 'adjSize', adj.size, 'nodePosSize', nodePos.size,"""

assert old in src, 'anchor not found'
src = src.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(src)
print('BFS debug added')
