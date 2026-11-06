# -*- coding: utf-8 -*-
import io

p = 'src/components/autobahnDistrict.js'
src = io.open(p, encoding='utf-8').read()

# 1. Bỏ khối aufTarget cũ (trước guidanceGroup)
old_target = """    // Auffahrt gần spawn nhất (đầu ramp) + destination của nó
    let aufTarget = null;
    let aufD = Infinity;
    for (const l of links) {
      const p = l.centerline[0];
      const dd = Math.hypot(p[0] - FOCUS.x, p[1] - FOCUS.z);
      if (dd < aufD) { aufD = dd; aufTarget = p; }
    }
    let aufDest = 'Bielefeld';
    if (aufTarget) {
      for (const l of links) {
        const dd = Math.hypot(l.centerline[0][0] - aufTarget[0], l.centerline[0][1] - aufTarget[1]);
        if (dd < 40 && l.destination) { aufDest = l.destination.split(';')[0].trim(); break; }
      }
    }

    const guidanceGroup = new THREE.Group();"""
new_target = "    const guidanceGroup = new THREE.Group();"
assert old_target in src, 'old target block'
src = src.replace(old_target, new_target, 1)

# 2. Thay khối dijkstra + BFS debug bằng logic mới
old_dij = """    if (aufTarget) {
      const startId = snapNearest(FOCUS.x, FOCUS.z);
      const endId = snapNearest(aufTarget[0], aufTarget[1]);
      const path = startId && endId ? dijkstra(startId, endId) : null;"""
new_dij = """    if (aufTarget) {
      // 🎯 Spawn node + BFS reachable set
      const startId = snapNearest(FOCUS.x, FOCUS.z);
      const reachable = new Set([startId]);
      const _q = [startId];
      while (_q.length) {
        const _u = _q.shift();
        for (const _e of (adj.get(_u) || [])) {
          if (!_reachableHas(reachable, _e.to)) { reachable.add(_e.to); _q.push(_e.to); }
        }
      }
      function _reachableHas(set, k) { return set.has(k); }
      // 🎯 Chọn Auffahrt: ramp gần nhất mà đầu-ramp CÓ NỐI vào mạng phố reachable
      // (ramp mồ côi chỉ nối mainline → target không reachable → mất toàn bộ biển)
      let endId = null;
      let aufLocalId = null;
      let bestD = Infinity;
      for (const l of links) {
        const p = l.centerline[0];
        const localId = snapNearest(p[0], p[1]);
        if (!localId || !reachable.has(localId)) continue;
        const lp = nodePos.get(localId);
        const dLocal = Math.hypot(lp[0] - p[0], lp[1] - p[1]);
        if (dLocal > 80) continue;
        const dd = Math.hypot(p[0] - FOCUS.x, p[1] - FOCUS.z);
        if (dd < bestD) { bestD = dd; endId = localId; aufLocalId = localId; }
      }
      const path = startId && endId ? dijkstra(startId, endId) : null;"""
assert old_dij in src, 'old dijkstra block'
src = src.replace(old_dij, new_dij, 1)

# 3. Bỏ BFS debug block cũ (nếu còn)
old_dbg = """      {
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
      console.log('[guidance-debug] startId', startId, 'endId', endId, 'adjSize', adj.size, 'nodePosSize', nodePos.size,
        'startInAdj', adj.has(startId), 'endInAdj', adj.has(endId), 'pathLen', path ? path.length : null);
      if (path && path.length >= 3) {"""
new_dbg = "      if (path && path.length >= 3) {"
if old_dbg in src:
    src = src.replace(old_dbg, new_dbg, 1)
    print('old debug removed')
else:
    print('old debug block not found (already clean?)')

# 4. aufTarget được dùng ở dưới (placeSignAt cuối) — biến đã nằm ở scope ngoài qua endId/aufLocalId
# cần đặt lại aufTarget/aufDest sau khi chọn để phần "biển cuối" dùng
old_final = "        // Biển cuối ngay trước cửa Auffahrt\n        placeSignAt(aufTarget[0], aufTarget[1], prevDir ? prevDir.x : 1, prevDir ? prevDir.z : 0, `A 2 ${aufDest}`, '↗');"
new_final = """        // Biển cuối ngay trước cửa Auffahrt
        const finalPos = nodePos.get(endId) || [FOCUS.x, FOCUS.z];
        placeSignAt(finalPos[0], finalPos[1], prevDir ? prevDir.x : 1, prevDir ? prevDir.z : 0, `A 2 ${aufDest}`, '↗');"""
if old_final in src:
    src = src.replace(old_final, new_final, 1)
    print('final sign updated')

# 5. aufDest: tính lại sau khi chọn endId — chèn ngay trước "const path"
old_dest = "      const path = startId && endId ? dijkstra(startId, endId) : null;"
new_dest = """      // destination của ramp được chọn
      let aufDest = 'Bielefeld';
      for (const l of links) {
        const dd = Math.hypot(l.centerline[0][0] - (nodePos.get(endId) || [0, 0])[0],
                              l.centerline[0][1] - (nodePos.get(endId) || [0, 0])[1]);
        if (dd < 60 && l.destination) { aufDest = l.destination.split(';')[0].trim(); break; }
      }
      const path = startId && endId ? dijkstra(startId, endId) : null;"""
assert old_dest in src, 'dest anchor'
src = src.replace(old_dest, new_dest, 1)

io.open(p, 'w', encoding='utf-8').write(src)
print('guidance target selection rewritten')
