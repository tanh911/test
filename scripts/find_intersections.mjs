import fs from 'fs';

const map = JSON.parse(fs.readFileSync('src/data/maps/muenchen-altstadt-clean.json', 'utf8'));

function roadHalfWidth(road) {
  const full = (road.lanesForward + road.lanesBackward) * road.laneWidth;
  return full / 2;
}

function roadLength(road) {
  let len = 0;
  for (let i = 1; i < road.points.length; i++) {
    len += Math.hypot(road.points[i][0] - road.points[i - 1][0], road.points[i][1] - road.points[i - 1][1]);
  }
  return len;
}

function roadsAtNode(map, nodeId) {
  const out = [];
  for (const road of map.roads) {
    const pts = road.points;
    if (road.from === nodeId) {
      const dx = pts[1][0] - pts[0][0];
      const dz = pts[1][1] - pts[0][1];
      const l = Math.hypot(dx, dz) || 1;
      out.push({ road, dirX: dx / l, dirZ: dz / l });
    } else if (road.to === nodeId) {
      const dx = pts[pts.length - 2][0] - pts[pts.length - 1][0];
      const dz = pts[pts.length - 2][1] - pts[pts.length - 1][1];
      const l = Math.hypot(dx, dz) || 1;
      out.push({ road, dirX: dx / l, dirZ: dz / l });
    }
  }
  return out;
}

function segmentsIntersect(p1, p2, p3, p4) {
  const ccw = (a, b, c) => (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function findSelfIntersections(perimeter) {
  const n = perimeter.length;
  const hits = [];
  for (let i = 0; i < n; i++) {
    const p1 = perimeter[i];
    const p2 = perimeter[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue;
      const p3 = perimeter[j];
      const p4 = perimeter[(j + 1) % n];
      if (segmentsIntersect(p1, p2, p3, p4)) {
        hits.push({ i, j, p1, p2, p3, p4 });
      }
    }
  }
  return hits;
}

function testNode(node) {
  const connectedRoads = roadsAtNode(map, node.id);
  if (connectedRoads.length < 2) return null;

  const maxW = Math.max(...connectedRoads.map(c => roadHalfWidth(c.road)));
  const isMultiArm = connectedRoads.length >= 3;

  const arms = connectedRoads.map(({ road, dirX, dirZ }) => {
    const half = roadHalfWidth(road);
    const ang = ((Math.atan2(-dirZ, dirX) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const norm = [-dirZ, dirX];
    const len = roadLength(road);
    let d = isMultiArm ? Math.max(5.5, maxW * 1.5) : half + 0.75;
    return { road, dir: [dirX, dirZ], norm, ang, half, d, len };
  }).sort((a, b) => a.ang - b.ang);

  const N = arms.length;

  // Tính d an toàn giữa các cặp nhánh liền kề
  for (let i = 0; i < N; i++) {
    const A = arms[i];
    const B = arms[(i + 1) % N];
    const dot = A.dir[0] * B.dir[0] + A.dir[1] * B.dir[1];
    if (dot > 0.5) { // góc < ~60°
      const angDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinHalf = Math.sin(angDiff / 2);
      const goreD = (A.half + B.half + 0.2) / (2 * Math.max(0.08, sinHalf));
      A.d = Math.max(A.d, goreD);
      B.d = Math.max(B.d, goreD);
    }
  }

  // Kẹp trần d theo chiều dài đường
  for (const A of arms) {
    A.d = Math.min(A.d, A.len * 0.45);
    const px = node.x + A.dir[0] * A.d;
    const pz = node.z + A.dir[1] * A.d;
    A.R = [px + A.norm[0] * A.half, pz + A.norm[1] * A.half];
    A.L = [px - A.norm[0] * A.half, pz - A.norm[1] * A.half];
  }

  const perimeter = [];

  for (let i = 0; i < N; i++) {
    const A = arms[i];
    const B = arms[(i + 1) % N];
    perimeter.push(A.R);
    perimeter.push(A.L);

    const dAx = A.dir[0], dAz = A.dir[1];
    const dBx = B.dir[0], dBz = B.dir[1];
    const det = dAz * dBx - dAx * dBz;
    let cornerPt = null;

    if (Math.abs(det) > 0.05) {
      const rx = A.L[0] - B.R[0];
      const rz = A.L[1] - B.R[1];
      const t = (-rx * dBz + rz * dBx) / det;
      const u = (-rx * dAz + rz * dAx) / det;

      // CHỐNG TỰ CẮT: t và u phải dương (hướng về phía node), không được đâm ra phía sau miệng nhánh
      if (t >= 0.0 && u >= 0.0) {
        const cx = A.L[0] - dAx * t;
        const cz = A.L[1] - dAz * t;
        const midX = (A.L[0] + B.R[0]) / 2;
        const midZ = (A.L[1] + B.R[1]) / 2;
        const distToChord = Math.hypot(cx - midX, cz - midZ);

        if (distToChord <= 6.0) {
          cornerPt = [cx, cz];
        }
      }
    }

    if (cornerPt) {
      perimeter.push(cornerPt);
    }
  }

  const hits = findSelfIntersections(perimeter);
  return { perimeter, hits, arms };
}

let totalFailed = 0;
for (const ix of map.intersections) {
  const node = map.nodes.find(n => n.id === ix.nodeId);
  if (!node) continue;
  const res = testNode(node);
  if (res && res.hits.length > 0) {
    totalFailed++;
    console.log(`Node ${node.id} has ${res.hits.length} self-intersections!`);
  }
}
console.log('Test completed! Total nodes with self-intersection:', totalFailed);
