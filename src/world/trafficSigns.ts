// 🪧 trafficSigns.ts — biển báo StVO (Protocol mục 4.6)
// Texture atlas sinh bằng canvas. Mỗi biển = mặt phẳng + cột trụ 2.2m xám.
// userData.signType trùng signs[].type trong JSON để rule engine tra cứu.
import * as THREE from 'three';
import type { GameMap, MapSign } from './mapLoader';
import { roadById, pointAtS, roadFullWidth } from './mapLoader';
import { chunkKeyFor } from './chunkBuilder';

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
// Trả signsByCell: biển gắn theo chunk cell → chunkManager nạp/hủy theo camera (G5)
export function placeSigns(map: GameMap): {
  signsByCell: Map<string, THREE.Group[]>;
  allSignGroups: THREE.Group[];
} {
  const signsByCell = new Map<string, THREE.Group[]>();
  const allSignGroups: THREE.Group[] = [];

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

    // 1 group = cột + mặt biển (nạp/hủy cùng cell)
    const g = new THREE.Group();
    g.name = `stvo_sign_${sign.type}_${sign.s}`;

    // Cột trụ 2.2 m xám
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x9a9a96 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(signX, 1.1, signZ);
    g.add(pole);

    // Mặt biển: plane + texture
    const def = SIGN_DEFS[sign.type] || SIGN_DEFS['101'];
    const tex = createSignAtlasTexture(sign.type, sign.value);
    const signMat = new THREE.MeshLambertMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const signGeo = new THREE.PlaneGeometry(def.width, def.height);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    // Biển quay mặt về hướng ngược chiều xe chạy (từ `from` đến `to`)
    signMesh.position.set(signX, 2.2 - def.height / 2, signZ);
    signMesh.rotation.y = pt.heading + Math.PI; // mặt về hướng -heading
    signMesh.userData.signType = sign.type;
    g.add(signMesh);

    allSignGroups.push(g);
    const cellKey = chunkKeyFor(signX, signZ);
    if (!signsByCell.has(cellKey)) signsByCell.set(cellKey, []);
    signsByCell.get(cellKey)!.push(g);
  }

  return { signsByCell, allSignGroups };
}

export { SIGN_DEFS };
