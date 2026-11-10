import os
import sys

# 1. Update src/world/roadMesh.ts
road_mesh_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\roadMesh.ts"
with open(road_mesh_path, "r", encoding="utf-8") as f:
    content = f.read()

# Kiểm tra junctionCutExtent
cut_extent_replacement = '''export function junctionCutExtent(road: MapRoad, end: 'from' | 'to', map: GameMap): number {
  const nodeId = road[end];
  const node = map.nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== 'intersection') return 0;
  const ix = map.intersections.find((i) => i.nodeId === nodeId);
  if (ix?.rule === 'roundabout') return junctionHalfExtent(map, nodeId) + 4;
  const connected = roadsAtNode(map, nodeId);
  if (connected.length < 2) return 0;
  const half = roadHalfWidth(road);
  const maxW = Math.max(...connected.map(c => roadHalfWidth(c.road)));
  const isMultiArm = connected.length >= 3;
  let d = isMultiArm ? Math.max(5.5, maxW * 1.5) : half + 0.75;

  // Kiểm tra nếu nhánh này nằm trong cặp góc nhọn (< 36 độ) -> mở rộng d tới điểm gore
  const pts = road.points;
  const myDirX = end === 'from' ? (pts[1][0] - pts[0][0]) : (pts[pts.length - 2][0] - pts[pts.length - 1][0]);
  const myDirZ = end === 'from' ? (pts[1][1] - pts[0][1]) : (pts[pts.length - 2][1] - pts[pts.length - 1][1]);
  const myLen = Math.hypot(myDirX, myDirZ) || 1;
  const ndx = myDirX / myLen, ndz = myDirZ / myLen;

  for (const other of connected) {
    if (other.road.id === road.id) continue;
    const dot = ndx * other.dirX + ndz * other.dirZ;
    if (dot > 0.8) { // góc < ~36 độ
      const otherHalf = roadHalfWidth(other.road);
      const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinHalf = Math.sin(ang / 2);
      const goreD = (half + otherHalf + 0.5) / (2 * Math.max(0.08, sinHalf));
      d = Math.max(d, goreD);
    }
  }

  const len = roadLength(road);
  return Math.min(d, len * 0.45);
}'''

# Thay thế junctionCutExtent cũ
start_marker = "export function junctionCutExtent("
end_marker = "export function roadSkipZones("
idx1 = content.find(start_marker)
idx2 = content.find(end_marker)
if idx1 != -1 and idx2 != -1:
    content = content[:idx1] + cut_extent_replacement + "\n\n" + content[idx2:]
    print("Updated junctionCutExtent successfully.")
else:
    print("Could not find junctionCutExtent markers!")

# Thay thế buildJunctionMesh
build_junction_replacement = '''export function buildJunctionMesh(
  nodeX: number,
  nodeZ: number,
  connectedRoads: Array<{ road: MapRoad; dirX: number; dirZ: number }>
): JunctionResult {
  const SIDEWALK_W = 2.5;
  const SIDEWALK_H = 0.15;
  const asphaltQuads: Quad[] = [];
  const sidewalkQuads: Quad[] = [];
  const curbQuads: Quad[] = [];

  if (connectedRoads.length < 2) {
    return { asphaltQuads, sidewalkQuads, curbQuads, poly: [] };
  }

  type Arm = {
    road: MapRoad;
    dir: [number, number];
    norm: [number, number];
    ang: number;
    half: number;
    d: number;
    L: [number, number];
    R: [number, number];
    L_out: [number, number];
    R_out: [number, number];
  };

  const maxW = Math.max(...connectedRoads.map(c => roadHalfWidth(c.road)));
  const isMultiArm = connectedRoads.length >= 3;

  // Tính arm cut có tính đến acute gore
  const arms: Arm[] = connectedRoads.map(({ road, dirX, dirZ }) => {
    const half = roadHalfWidth(road);
    // Góc CCW chuẩn Three.js trong mặt phẳng (X, Z) nhìn từ +Y xuống: (Math.atan2(-dz, dx) + 2*PI) % 2*PI
    const ang = ((Math.atan2(-dirZ, dirX) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Pháp tuyến bên phải khi đi từ node ra ngoài theo dir: quay 90 độ CW quanh +Y -> [-dirZ, dirX]
    const norm: [number, number] = [-dirZ, dirX];
    const len = roadLength(road);
    let d = isMultiArm ? Math.max(5.5, maxW * 1.5) : half + 0.75;

    // Check acute gore
    for (const other of connectedRoads) {
      if (other.road.id === road.id) continue;
      const dot = dirX * other.dirX + dirZ * other.dirZ;
      if (dot > 0.8) {
        const oHalf = roadHalfWidth(other.road);
        const angDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
        const sinHalf = Math.sin(angDiff / 2);
        const goreD = (half + oHalf + 0.5) / (2 * Math.max(0.08, sinHalf));
        d = Math.max(d, goreD);
      }
    }
    d = Math.min(d, len * 0.45);

    const px = nodeX + dirX * d;
    const pz = nodeZ + dirZ * d;
    // Đi từ node ra ngoài: Bên phải là +norm, Bên trái là -norm
    const R: [number, number] = [px + norm[0] * half, pz + norm[1] * half];
    const L: [number, number] = [px - norm[0] * half, pz - norm[1] * half];
    const R_out: [number, number] = [px + norm[0] * (half + SIDEWALK_W), pz + norm[1] * (half + SIDEWALK_W)];
    const L_out: [number, number] = [px - norm[0] * (half + SIDEWALK_W), pz - norm[1] * (half + SIDEWALK_W)];

    return { road, dir: [dirX, dirZ] as [number, number], norm, ang, half, d, L, R, L_out, R_out };
  }).sort((a, b) => a.ang - b.ang);

  const N = arms.length;
  const perimeter: Array<[number, number]> = [];

  // Danh sách các đoạn cạnh viền ngã tư (curb edge) cần làm vỉa hè
  type CurbEdge = {
    p1: [number, number];
    p2: [number, number];
    out1: [number, number];
    out2: [number, number];
  };
  const curbEdges: CurbEdge[] = [];

  for (let i = 0; i < N; i++) {
    const A = arms[i];
    const B = arms[(i + 1) % N];

    // Miệng nhánh A: đi từ R_A sang L_A theo chiều CCW
    perimeter.push(A.R);
    perimeter.push(A.L);

    // Góc bo giữa nhánh A và nhánh B kế tiếp: kết nối từ L_A sang R_B
    const dAx = A.dir[0], dAz = A.dir[1];
    const dBx = B.dir[0], dBz = B.dir[1];
    // Giao điểm 2 tia: L_A - d_A * t = R_B - d_B * u
    const det = dAz * dBx - dAx * dBz;
    let cornerPt: [number, number] | null = null;

    if (Math.abs(det) > 0.05) {
      const rx = A.L[0] - B.R[0];
      const rz = A.L[1] - B.R[1];
      const t = (-rx * dBz + rz * dBx) / det;
      const u = (-rx * dAz + rz * dAx) / det;

      if (t >= -0.5 && u >= -0.5) {
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

      // 2 cạnh góc bo: L_A -> cornerPt và cornerPt -> R_B
      // Pháp tuyến hướng ra ngoài vỉa hè (bên phải của vector đi E1 -> E2)
      const e1x = cornerPt[0] - A.L[0], e1z = cornerPt[1] - A.L[1];
      const l1 = Math.hypot(e1x, e1z) || 1;
      const n1x = e1z / l1, n1z = -e1x / l1;

      const e2x = B.R[0] - cornerPt[0], e2z = B.R[1] - cornerPt[1];
      const l2 = Math.hypot(e2x, e2z) || 1;
      const n2x = e2z / l2, n2z = -e2x / l2;

      // Điểm miter bên ngoài vỉa hè tại cornerPt
      const bisNx = (n1x + n2x) / 2, bisNz = (n1z + n2z) / 2;
      const bisLen = Math.hypot(bisNx, bisNz) || 1;
      const cOut: [number, number] = [
        cornerPt[0] + (bisNx / bisLen) * SIDEWALK_W,
        cornerPt[1] + (bisNz / bisLen) * SIDEWALK_W
      ];

      curbEdges.push({
        p1: A.L,
        p2: cornerPt,
        out1: A.L_out,
        out2: cOut
      });
      curbEdges.push({
        p1: cornerPt,
        p2: B.R,
        out1: cOut,
        out2: B.R_out
      });
    } else {
      // Chamfer trực tiếp từ L_A sang R_B
      const ex = B.R[0] - A.L[0], ez = B.R[1] - A.L[1];
      const l = Math.hypot(ex, ez) || 1;
      const nx = ez / l, nz = -ex / l;
      curbEdges.push({
        p1: A.L,
        p2: B.R,
        out1: A.L_out,
        out2: B.R_out
      });
    }
  }

  // Triangulate mặt đường ngã tư bằng Earcut (ShapeUtils.triangulateShape)
  const P_Y = 0.002;
  const vec2s = perimeter.map(([x, z]) => new THREE.Vector2(x, z));
  const tris = THREE.ShapeUtils.triangulateShape(vec2s, []);

  for (const [i0, i1, i2] of tris) {
    const p0 = perimeter[i0];
    const p1 = perimeter[i1];
    const p2 = perimeter[i2];
    asphaltQuads.push({
      a: [p0[0], P_Y, p0[1]],
      b: [p1[0], P_Y, p1[1]],
      c: [p2[0], P_Y, p2[1]],
      d: [p2[0], P_Y, p2[1]]
    });
  }

  // Dựng vỉa hè và bó vỉa từ các curbEdges
  for (const edge of curbEdges) {
    const { p1, p2, out1, out2 } = edge;

    // Mặt trên phẳng của vỉa hè
    sidewalkQuads.push({
      a: [p1[0], SIDEWALK_H, p1[1]],
      b: [p2[0], SIDEWALK_H, p2[1]],
      c: [out2[0], SIDEWALK_H, out2[1]],
      d: [out1[0], SIDEWALK_H, out1[1]]
    });

    // Mặt curb đứng
    curbQuads.push({
      a: [p1[0], 0, p1[1]],
      b: [p1[0], SIDEWALK_H, p1[1]],
      c: [p2[0], SIDEWALK_H, p2[1]],
      d: [p2[0], 0, p2[1]]
    });
  }

  const poly: Array<[number, number]> = perimeter.map(([x, z]) => [x - nodeX, z - nodeZ]);
  return { asphaltQuads, sidewalkQuads, curbQuads, poly };
}'''

start_marker2 = "export function buildJunctionMesh("
end_marker2 = "export function junctionPatchQuads("
idx3 = content.find(start_marker2)
idx4 = content.find(end_marker2)
if idx3 != -1 and idx4 != -1:
    content = content[:idx3] + build_junction_replacement + "\n\n" + content[idx4:]
    print("Updated buildJunctionMesh successfully.")
else:
    print("Could not find buildJunctionMesh markers!")

with open(road_mesh_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Saved roadMesh.ts.")
