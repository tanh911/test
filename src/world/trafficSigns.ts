// 🪧 trafficSigns.ts — biển báo StVO (Protocol mục 4.6)
// Texture atlas sinh bằng canvas. Mỗi biển = mặt phẳng + cột trụ 2.2m xám.
// userData.signType trùng signs[].type trong JSON để rule engine tra cứu.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapSign } from './mapLoader';
import { roadById, pointAtS, roadFullWidth } from './mapLoader';
import { chunkKeyFor } from './chunkBuilder';

// ── Mô hình 3D biển thật (CC0 — Stadt Rostock /3DModels) ──
const loader3D = new GLTFLoader();
const glbCache = new Map<string, Promise<THREE.Group | null>>();
function glbUrlFor(type: string, value?: number): string | null {
  if (type === '274') return `/simv2/signs/274-${value ?? 30}.glb`;
  const known: Record<string, string> = {
    '205': '205', '206': '206', '306': '306', '267': '267', '301': '301',
    '102': '102', '215': '215', '101': '101-10', '220': '220-10'
  };
  const base = known[type];
  return base ? `/simv2/signs/${base}.glb` : null;
}
function loadSignModel(type: string, value?: number): Promise<THREE.Group | null> {
  const url = glbUrlFor(type, value);
  if (!url) return Promise.resolve(null);
  let p = glbCache.get(url);
  if (!p) {
    p = loader3D.loadAsync(url).then(g => {
      const grp = g.scene;
      grp.updateMatrixWorld(true);

      // 1) Bake transform + xoay 180° quanh trục Y trực tiếp trên geometry:
      //    Trong bộ GLB Rostock gốc, mặt biển có texture (prim 0) nằm ở z = -0.002 với
      //    pháp tuyến (0, 0, -1), còn tấm lưng xám (prim 1) nằm ở z = 0 với pháp tuyến (0, 0, +1).
      //    Nếu đặt rotation/position trên grp thì khi clone() ở upgradeBucketsWithModels
      //    gán model.rotation.y = rot sẽ GHI ĐÈ mất góc xoay, khiến toàn bộ biển quay lưng xám
      //    về phía tài xế ("mất mặt") và biển Z.267 quay ngược chiều!
      const frontMeshes: THREE.Mesh[] = [];
      const backMeshes: THREE.Mesh[] = [];
      grp.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const rawMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
        const hasTex = Boolean(rawMat?.map) || Boolean(rawMat?.name?.toLowerCase().includes('schildfront'));
        if (hasTex) frontMeshes.push(mesh);
        else backMeshes.push(mesh);
      });

      // Xóa tấm lưng xám không texture (nguyên nhân khiến biển nhìn từ bên trái/ngược chiều bị "mất mặt" trắng/xám)
      for (const bm of backMeshes) {
        bm.parent?.remove(bm);
      }

      const finalMeshes: THREE.Mesh[] = [];
      for (const mesh of frontMeshes) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.applyMatrix4(mesh.matrixWorld);
        // Xoay geometry 180° quanh Y để mặt trước có texture hướng về +Z
        mesh.geometry.rotateY(Math.PI);

        const rawMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
        const mat = rawMat.clone();
        mat.side = THREE.FrontSide;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -2;
        mat.polygonOffsetUnits = -2;
        mat.roughness = 0.42;
        mat.metalness = 0.06;
        if (mat.map) {
          mat.map.anisotropy = 8;
          mat.map.needsUpdate = true;
        }
        mat.needsUpdate = true;
        mesh.material = mat;

        // Mặt sau: nhân bản mặt có texture xoay 180° quanh Y (hướng về -Z, cách 10mm) để nhìn từ mọi góc đều rõ nét, không bao giờ mất mặt
        const backGeo = mesh.geometry.clone();
        backGeo.rotateY(Math.PI);
        backGeo.translate(0, 0, -0.005);
        mesh.geometry.translate(0, 0, 0.005);

        const backClone = new THREE.Mesh(backGeo, mat);
        grp.add(backClone);
        finalMeshes.push(mesh, backClone);
      }

      // Reset toàn bộ node transform về đơn vị sau khi đã bake vào geometry
      grp.traverse(o => {
        o.position.set(0, 0, 0);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, 1, 1);
      });
      grp.updateMatrixWorld(true);

      // 2) Căn tâm geometry về (0, 0, 0) và chuẩn hóa kích thước đồng bộ (tránh biển Z.267 quá khổ)
      const box = new THREE.Box3().setFromObject(grp);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, 0.001);
      const targetMaxDim = type === '220' ? 0.62 : 0.54;
      const scaleFactor = targetMaxDim / maxDim;

      for (const mesh of finalMeshes) {
        mesh.geometry.translate(-center.x, -center.y, -center.z);
        mesh.geometry.scale(scaleFactor, scaleFactor, 1);
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }

      return grp;
    }).catch(() => null);
    glbCache.set(url, p);
  }
  return p;
}

interface SignDef {
  code: string;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
  width: number;  // chiều rộng biển (m)
  height: number; // chiều cao biển (m)
}

// ── Các hàm vẽ hình cơ bản ──
function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = r * 0.16;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawOctagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * 2 * Math.PI) / 8;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string, lineWidth: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawSquare(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, fill: string, stroke: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = size * 0.05;
  ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
}

// ── Định nghĩa 15 biển StVO ──
const SIGN_DEFS: Record<string, SignDef> = {
  '205': { // Vorfahrt gewähren — tam giác ngược đỏ-trắng
    code: '205', width: 0.6, height: 0.6,
    draw: (ctx, s) => drawTriangle(ctx, s/2, s/2, s*0.4, '#ffffff', '#dc2626')
  },
  '206': { // Halt! Vorfahrt gewähren — bát giác đỏ
    code: '206', width: 0.6, height: 0.6,
    draw: (ctx, s) => {
      drawOctagon(ctx, s/2, s/2, s*0.42, '#dc2626', '#ffffff');
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${s*0.22}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('STOP', s/2, s/2);
    }
  },
  '301': { // Vorfahrt — thoi vàng
    code: '301', width: 0.6, height: 0.6,
    draw: (ctx, s) => drawDiamond(ctx, s/2, s/2, s*0.42, '#fbbf24', '#0f172a')
  },
  '306': { // Vorfahrtstraße — thoi vàng viền trắng
    code: '306', width: 0.6, height: 0.6,
    draw: (ctx, s) => drawDiamond(ctx, s/2, s/2, s*0.42, '#fbbf24', '#ffffff')
  },
  '102': { // Rechts vor links — tam giác ngược trắng viền đỏ với chữ X
    code: '102', width: 0.6, height: 0.6,
    draw: (ctx, s) => {
      drawTriangle(ctx, s/2, s/2, s*0.4, '#ffffff', '#dc2626');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.moveTo(s*0.35, s*0.35); ctx.lineTo(s*0.65, s*0.55);
      ctx.moveTo(s*0.65, s*0.35); ctx.lineTo(s*0.35, s*0.55);
      ctx.stroke();
    }
  },
  '274': { // Giới hạn tốc độ — tròn trắng viền đỏ
    code: '274', width: 0.5, height: 0.5,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s/2, s*0.4, '#ffffff', '#dc2626', s*0.1);
      ctx.fillStyle = '#0f172a';
      ctx.font = `900 ${s*0.3}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('50', s/2, s/2);
    }
  },
  '274.1': { // Tempo-30-Zone — tròn trắng viền đỏ + chữ Zone
    code: '274.1', width: 0.5, height: 0.6,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s*0.35, s*0.28, '#ffffff', '#dc2626', s*0.07);
      ctx.fillStyle = '#0f172a';
      ctx.font = `900 ${s*0.18}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('30', s/2, s*0.35);
      ctx.fillStyle = '#0f172a';
      ctx.font = `700 ${s*0.14}px Arial`;
      ctx.fillText('Zone', s/2, s*0.72);
    }
  },
  '220': { // Einbahnstraße — vuông xanh mũi tên trắng
    code: '220', width: 0.5, height: 0.7,
    draw: (ctx, s) => {
      drawSquare(ctx, s/2, s/2, s*0.7, '#2563eb', '#ffffff');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(s*0.5, s*0.15);
      ctx.lineTo(s*0.7, s*0.5);
      ctx.lineTo(s*0.58, s*0.5);
      ctx.lineTo(s*0.58, s*0.85);
      ctx.lineTo(s*0.42, s*0.85);
      ctx.lineTo(s*0.42, s*0.5);
      ctx.lineTo(s*0.3, s*0.5);
      ctx.closePath();
      ctx.fill();
    }
  },
  '267': { // Verbot der Einfahrt — tròn đỏ với thanh trắng ngang
    code: '267', width: 0.5, height: 0.5,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s/2, s*0.42, '#dc2626', '#dc2626', 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s*0.15, s*0.42, s*0.7, s*0.16);
    }
  },
  '283': { // Absolutes Haltverbot — tròn xanh viền đỏ chéo
    code: '283', width: 0.5, height: 0.5,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s/2, s*0.4, '#1e3a5f', '#dc2626', s*0.1);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = s*0.07;
      ctx.beginPath();
      ctx.moveTo(s*0.22, s*0.22);
      ctx.lineTo(s*0.78, s*0.78);
      ctx.stroke();
    }
  },
  '286': { // Eingeschränktes Haltverbot — tròn xanh viền đỏ chéo đứt
    code: '286', width: 0.5, height: 0.5,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s/2, s*0.4, '#1e3a5f', '#dc2626', s*0.1);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = s*0.06;
      ctx.setLineDash([s*0.08, s*0.08]);
      ctx.beginPath();
      ctx.moveTo(s*0.22, s*0.22);
      ctx.lineTo(s*0.78, s*0.78);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },
  '314': { // Parken — vuông xanh với chữ P trắng
    code: '314', width: 0.5, height: 0.6,
    draw: (ctx, s) => {
      drawSquare(ctx, s/2, s/2, s*0.7, '#2563eb', '#ffffff');
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${s*0.4}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('P', s/2, s*0.55);
    }
  },
  '350': { // Fußgängerüberweg — vuông xanh với hình người đi
    code: '350', width: 0.5, height: 0.6,
    draw: (ctx, s) => {
      drawSquare(ctx, s/2, s/2, s*0.7, '#2563eb', '#ffffff');
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s*0.04;
      // người đi bộ đơn giản
      ctx.beginPath();
      ctx.arc(s*0.44, s*0.28, s*0.07, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s*0.44, s*0.35); ctx.lineTo(s*0.44, s*0.55);
      ctx.moveTo(s*0.44, s*0.42); ctx.lineTo(s*0.56, s*0.48);
      ctx.moveTo(s*0.44, s*0.55); ctx.lineTo(s*0.38, s*0.68);
      ctx.moveTo(s*0.44, s*0.55); ctx.lineTo(s*0.5, s*0.68);
      ctx.stroke();
      // vạch kẻ
      ctx.beginPath();
      ctx.moveTo(s*0.2, s*0.72); ctx.lineTo(s*0.8, s*0.72);
      ctx.stroke();
    }
  },
  '101': { // Gefahrstelle — tam giác ngược viền đỏ
    code: '101', width: 0.6, height: 0.6,
    draw: (ctx, s) => {
      drawTriangle(ctx, s/2, s/2, s*0.4, '#fefce8', '#dc2626');
      ctx.fillStyle = '#0f172a';
      ctx.font = `800 ${s*0.18}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', s/2, s*0.55);
    }
  },
  '138': { // Radfahrer — tam giác ngược viền đỏ với xe đạp
    code: '138', width: 0.6, height: 0.6,
    draw: (ctx, s) => {
      drawTriangle(ctx, s/2, s/2, s*0.4, '#fefce8', '#dc2626');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = s*0.02;
      ctx.beginPath();
      ctx.arc(s*0.4, s*0.58, s*0.07, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s*0.6, s*0.58, s*0.07, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s*0.4, s*0.58); ctx.lineTo(s*0.5, s*0.48);
      ctx.lineTo(s*0.6, s*0.58);
      ctx.moveTo(s*0.5, s*0.48); ctx.lineTo(s*0.45, s*0.42);
      ctx.stroke();
    }
  },
  '215': { // Kreisverkehr — tròn xanh với mũi tên vòng
    code: '215', width: 0.5, height: 0.5,
    draw: (ctx, s) => {
      drawCircle(ctx, s/2, s/2, s*0.4, '#2563eb', '#ffffff', s*0.05);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s*0.06;
      ctx.beginPath();
      ctx.arc(s/2, s/2, s*0.22, -0.5, Math.PI*1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s*0.32, s*0.15);
      ctx.lineTo(s*0.48, s*0.08);
      ctx.lineTo(s*0.48, s*0.28);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
};

// ── Sinh texture atlas ──
function createSignAtlasTexture(signType: string, value?: number): THREE.CanvasTexture {
  const def = SIGN_DEFS[signType] || SIGN_DEFS['101'];
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    def.draw(ctx, size);
    // vẽ giá trị (274: tốc độ)
    if (signType === '274' && value !== undefined) {
      ctx.fillStyle = '#0f172a';
      ctx.font = `900 ${size * 0.3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.clearRect(size * 0.18, size * 0.38, size * 0.64, size * 0.24);
      ctx.fillText(String(value), size / 2, size / 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// ── Đặt biển từ signs[] trong JSON ──
// Trả signsByCell: biển gắn theo chunk cell → chunkManager nạp/hủy theo camera (G5).
// Các biển đứng gần nhau (≤ 1.6 m) CHỒNG CHUNG 1 CỘT (như StVO thật): bảng đầu
// trên đỉnh, các bảng sau xếp dưới lần lượt — hết "rừng cột" tại ngã tư nhiều nhánh.
export function placeSigns(map: GameMap): {
  signsByCell: Map<string, THREE.Group[]>;
  allSignGroups: THREE.Group[];
} {
  const signsByCell = new Map<string, THREE.Group[]>();
  const allSignGroups: THREE.Group[] = [];

  interface PendingSign {
    sign: MapSign;
    x: number;
    z: number;
    y: number; // cao độ TÂM bảng
    def: SignDef;
  }
  const pending: PendingSign[] = [];

  for (const sign of map.signs as MapSign[]) {
    const road = roadById(map, sign.roadId);
    if (!road) continue;

    const pt = pointAtS(road, sign.s);
    const fullWidth = roadFullWidth(road);
    const sideOffset = sign.side === 'right' ? fullWidth / 2 + 1.2 : -(fullWidth / 2 + 1.2);
    // flow = (sin h, cos h) → PHẢI flow = (−cos h, sin h)
    const flowX = Math.sin(pt.heading);
    const flowZ = Math.cos(pt.heading);
    const rx = -flowZ;
    const rz = flowX;
    const signX = pt.x + rx * sideOffset;
    const signZ = pt.z + rz * sideOffset;
    const def = SIGN_DEFS[sign.type] || SIGN_DEFS['101'];
    const defScaled: SignDef = { ...def, width: def.width * 1.08, height: def.height * 1.08 };
    pending.push({ sign, x: signX, z: signZ, y: 0, def: defScaled });
  }

  // gom cụm theo vị trí (bucket 1.6 m) — chỉ gom biển cùng road & cùng chiều flip
  const buckets: Array<{ x: number; z: number; items: PendingSign[] }> = [];
  for (const ps of pending) {
    const hit = buckets.find(
      (b) =>
        Math.hypot(b.x - ps.x, b.z - ps.z) <= 1.6 &&
        b.items[0].sign.roadId === ps.sign.roadId &&
        Boolean(b.items[0].sign.flip) === Boolean(ps.sign.flip)
    );
    if (hit) {
      hit.items.push(ps);
    } else {
      buckets.push({ x: ps.x, z: ps.z, items: [ps] });
    }
  }

  for (const bucket of buckets) {
    // bảng cao nhất đứng trên; sắp theo height giảm dần; TỐI ĐA 3 bảng/cột
    bucket.items.sort((a, b) => b.def.height - a.def.height);
    if (bucket.items.length > 3) bucket.items.length = 3;
    const lead = bucket.items[0];

    const g = new THREE.Group();
    (bucket as unknown as { _group?: THREE.Group })._group = g;
    g.name = `stvo_sign_${lead.sign.type}_${bucket.items.length}`;

    // Cột cao đủ tới đỉnh bảng trên cùng (2.55) — bảng không lơ lửng trên cột
    const poleH = 2.6;
    const poleGeo = new THREE.CylinderGeometry(0.045, 0.045, poleH, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x9a9a96 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(bucket.x, poleH / 2, bucket.z);
    g.add(pole);
    g.userData._pole = pole;

    // Các bảng xếp chồng từ đỉnh xuống
    let boardTop = poleH;
    for (const item of bucket.items) {
      const tex = createSignAtlasTexture(item.sign.type, item.sign.value);
      const signMat = new THREE.MeshLambertMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
      });
      const signGeo = new THREE.PlaneGeometry(item.def.width, item.def.height);
      const signMesh = new THREE.Mesh(signGeo, signMat);
      const y = boardTop - item.def.height / 2;
      signMesh.position.set(bucket.x, y, bucket.z);
      // mặt quay ngược flow; flip = quay theo flow (Z.267 chiếu xe ngược chiều)
      signMesh.rotation.y = pointAtS(roadById(map, item.sign.roadId)!, item.sign.s).heading + (item.sign.flip ? 0 : Math.PI);
      signMesh.userData.signType = item.sign.type;
      g.add(signMesh);
      boardTop = y - item.def.height / 2 - 0.06; // bảng sau chồng dưới, hở 6 cm
    }

    allSignGroups.push(g);
    const cellKey = chunkKeyFor(bucket.x, bucket.z);
    if (!signsByCell.has(cellKey)) signsByCell.set(cellKey, []);
    signsByCell.get(cellKey)!.push(g);
  }

  // Nâng cấp lên mô hình 3D thật (async, không chặn render — canvas plane là placeholder)
  for (const b of buckets) (b as unknown as { _map?: GameMap })._map = map;
  void upgradeBucketsWithModels(buckets);

  return { signsByCell, allSignGroups };
}

/** Khi GLB của MỌI biển trong bucket load xong → thay cả bucket bằng clone GLB
 *  đặt so le 0.4 m; nếu 1 biển không có GLB thì giữ nguyên bộ canvas stack. */
async function upgradeBucketsWithModels(buckets: Array<{ x: number; z: number; items: Array<{ sign: MapSign; x: number; z: number; y: number; def: SignDef }> }>): Promise<void> {
  for (const bucket of buckets) {
    const models = await Promise.all(bucket.items.map(it => loadSignModel(it.sign.type, it.sign.value)));
    if (models.some(m => m === null)) continue; // thiếu model → giữ canvas placeholder
    const group = (bucket as unknown as { _group?: THREE.Group })._group;
    const map = (bucket as unknown as { _map?: GameMap })._map;
    if (!group) continue;
    const pole = group.userData._pole as THREE.Mesh | undefined;
    // bỏ canvas boards, GIỮ pole
    for (const child of [...group.children]) {
      if (child !== pole) group.remove(child);
    }
    // GLB gắn lên cột: bảng đầu tâm ~2.1 m, bảng sau chồng DƯỚI (StVO thật)
    let boardBottom = 2.55;
    bucket.items.forEach((it) => {
      const model = models[bucket.items.indexOf(it)]!.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const h = box.getSize(new THREE.Vector3()).y;
      const cy = boardBottom - h / 2;
      boardBottom = cy - h / 2 - 0.05;
      const rot = pointAtS(roadById(map!, it.sign.roadId)!, it.sign.s).heading + (it.sign.flip ? 0 : Math.PI);
      model.rotation.y = rot;
      const fwdX = Math.sin(rot), fwdZ = Math.cos(rot);
      model.position.set(bucket.x + fwdX * 0.07, cy, bucket.z + fwdZ * 0.07);
      model.userData.signType = it.sign.type;
      group.add(model);
    });
  }
}

export { SIGN_DEFS };
