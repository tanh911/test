// 🏗️ Street props & StVO sign factories — tách từ environment.js (refactor phase B1).
// Lý do tách: phá import cycle environment ⇄ district builders (giờ cả 2 import module này).
import * as THREE from 'three';
import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';

// ── 0. GLOBAL CANVAS TEXTURE CACHE & ZERO-ALLOCATION HELPERS ───────────────
export const canvasTextureCache = new Map();

export function getOrCreateCanvasTexture(key, drawFn, width = 512, height = 512) {
  if (canvasTextureCache.has(key)) {
    return canvasTextureCache.get(key);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, canvas);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  canvasTextureCache.set(key, tex);
  return tex;
}

// 🚀 SHARED MATERIAL CACHE theo texture: biển báo/bảng hiệu mỗi cái trước đây tạo
// MeshBasicMaterial RIÊNG (~70-100 unique materials trên 1 map) → three.js phải duyệt
// getParameters/getProgram cho từng material mỗi frame × 2 render pass (main + gương)
// = ~40% CPU. Materials dùng chung theo texture → chương trình shader giảm về vài cái,
// frame time giảm mạnh trên mọi GPU (không đổi hình ảnh vì biển không đổi opacity/runtime).
const sharedTexturedMaterialCache = new Map();
export function getSharedTexturedMaterial(tex, opts = {}) {
  if (!tex) return new THREE.MeshBasicMaterial(opts);
  const key = `${tex.uuid}|${opts.transparent ? 1 : 0}|${opts.side === THREE.FrontSide ? 'front' : 'double'}`;
  let mat = sharedTexturedMaterialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: opts.side === THREE.FrontSide ? THREE.FrontSide : THREE.DoubleSide,
      transparent: !!opts.transparent
    });
    sharedTexturedMaterialCache.set(key, mat);
  }
  return mat;
}

// ── SHARED SINGLETON MATERIALS FOR ZERO-ALLOCATION & FAST SHADER COMPILATION ──
export const sharedMaterials = {
  poleMetal: new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 }),
  trussMetal: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 }),
  lampPole: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 }),
  lampHead: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
  urbanTrunk: new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.95 }),
  urbanLeafMain: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }),
  urbanLeafHigh: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 }),
  urbanLeafShadow: new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 }),
  urbanGrate: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 }),
  urbanSoil: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 1.0 }),
  manholeRim: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.6, metalness: 0.85 }),
  manholePlate: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.5, metalness: 0.9 }),
  drainIron: new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.85, roughness: 0.4 }),
  drainFrame: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }),
  groundFloor: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 }),
  cornice: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
  windowGlass: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.85, transparent: true, opacity: 0.85 }),
  windowFrame: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 }),
  bollard: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 }),
  whiteBasic: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  redBasic: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
  yellowBasic: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  curbConcrete: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }),
  roofDark: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }),
  stoneVolks: new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 }),
  darkStoneVolks: new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 }),
  doorVolks: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.4, metalness: 0.6 }),
  columnVolks: new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.75 })
};

export const wallMaterialCache = new Map();
export function getOrCreateWallMaterial(colorHex) {
  if (wallMaterialCache.has(colorHex)) return wallMaterialCache.get(colorHex);
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.88 });
  wallMaterialCache.set(colorHex, mat);
  return mat;
}

export const awningMaterialCache = new Map();
export function getOrCreateAwningMaterial(colorHex) {
  if (awningMaterialCache.has(colorHex)) return awningMaterialCache.get(colorHex);
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
  awningMaterialCache.set(colorHex, mat);
  return mat;
}

// ── 1. HELPER CHUẨN HÓA BIỂN BÁO GIAO THÔNG ĐỨC (StVO) ──────────────────────
export function makeGermanStVOSign(rawType, value = 50) {
  let type = rawType || 'SPEED_LIMIT';
  if (type === 'STOP') type = 'STOP_SIGN';
  if (type === 'PRIORITY' || type === 'VORFAHRT') type = 'PRIORITY_ROAD';
  if (type === 'ONEWAY') type = 'ONE_WAY';
  if (type === 'NO_ENTRY') type = 'VERBOT_EINFAHRT';
  if (type === 'YIELD') type = 'VORFAHRT_GEWAEHREN';

  const group = new THREE.Group();

  // Cột sắt (Pfosten)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 12), sharedMaterials.poleMetal);
  pole.position.y = 1.25;
  pole.castShadow = true;
  group.add(pole);

  const signZ = 0.06;

  // Sử dụng texture cache để không bao giờ tạo lại canvas/texture trùng lặp
  const cacheKey = `sign_${type}_${value}`;
  const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 512, 512);

    if (type === 'SPEED_LIMIT') {
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fillStyle = '#DC2626';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 200px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value), 256, 266);
    } else if (type === 'STOP_SIGN') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const x = 256 + 230 * Math.cos(angle);
        const y = 256 + 230 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 16;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 130px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STOP', 256, 260);
    } else if (type === 'YIELD' || type === 'VORFAHRT_GEWAEHREN') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 480);
      ctx.lineTo(20, 30);
      ctx.lineTo(492, 30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 380);
      ctx.lineTo(90, 80);
      ctx.lineTo(422, 80);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'PRIORITY_ROAD') {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 20); ctx.lineTo(492, 256); ctx.lineTo(256, 492); ctx.lineTo(20, 256);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.moveTo(256, 90); ctx.lineTo(422, 256); ctx.lineTo(256, 422); ctx.lineTo(90, 256);
      ctx.closePath(); ctx.fill();
    } else if (type === 'PARKING') {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(20, 20, 472, 472);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 320px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 256, 256);
    } else if (type === 'SLOPE_WARNING') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 110px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('10%', 256, 330);
    } else if (type === 'PEDESTRIAN_CROSSING') {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(20, 20, 472, 472);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 60); ctx.lineTo(450, 440); ctx.lineTo(62, 440);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(150, 360, 212, 24);
      ctx.fillRect(170, 310, 172, 24);
      ctx.fillRect(190, 260, 132, 24);
    } else if (type === 'DANGER') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 150px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 256, 310);
    } else if (type === 'WILDWECHSEL') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 110px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦌', 256, 310);
    } else if (type === 'KURVE') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 130px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // value = -1: cua trái (Z.103-L), mặc định cua phải (Z.103-R)
      ctx.fillText(value === -1 ? '↩' : '↪', 256, 305);
    } else if (type === 'BAUSTELLE') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 110px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚧', 256, 310);
    } else if (type === 'AUTOBAHN_START' || type === 'AUTOBAHN') {
      ctx.fillStyle = '#00438a';
      ctx.fillRect(20, 20, 472, 472);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 14;
      ctx.strokeRect(32, 32, 448, 448);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(90, 310, 80, 140);
      ctx.fillRect(342, 310, 80, 140);
      ctx.fillRect(90, 260, 332, 50);
      ctx.beginPath();
      ctx.moveTo(180, 450); ctx.lineTo(220, 100); ctx.lineTo(292, 100); ctx.lineTo(332, 450);
      ctx.closePath(); ctx.fill();
    } else if (type === 'TEMPO_30_ZONE') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 10, 492, 492);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 492, 492);

      ctx.beginPath();
      ctx.arc(256, 210, 150, 0, Math.PI * 2);
      ctx.fillStyle = '#DC2626';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(256, 210, 110, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 130px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value || 30), 256, 218);

      ctx.font = '900 64px Arial, sans-serif';
      ctx.fillText('ZONE', 256, 420);
    } else if (type === 'TEMPO_30_ZONE_END') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 10, 492, 492);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, 492, 492);

      ctx.beginPath();
      ctx.arc(256, 210, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(256, 210, 105, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 120px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value || 30), 256, 218);

      ctx.font = '900 58px Arial, sans-serif';
      ctx.fillText('ZONE', 256, 420);

      // 4 gạch chéo xám đen StVO
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14;
      for (let sl = -30; sl <= 30; sl += 20) {
        ctx.beginPath();
        ctx.moveTo(90 + sl, 350);
        ctx.lineTo(410 + sl, 70);
        ctx.stroke();
      }
    } else if (type === 'ROUNDABOUT' || type === 'KREISVERKEHR') {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 220px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔄', 256, 260);
    } else if (type === 'BUS_STOP' || type === 'HALTESTELLE') {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 26;
      ctx.stroke();

      ctx.fillStyle = '#15803d';
      ctx.font = '900 280px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', 256, 265);
    } else if (type === 'RECHTS_VOR_LINKS') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();

      // Dấu X đen đặc trưng Kreuzung (Zeichen 102)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(180, 230); ctx.lineTo(332, 380);
      ctx.moveTo(332, 230); ctx.lineTo(180, 380);
      ctx.stroke();
    } else if (type === 'WARNING_CHILDREN' || type === 'KINDER') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(256, 30); ctx.lineTo(492, 470); ctx.lineTo(20, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 110); ctx.lineTo(430, 430); ctx.lineTo(82, 430);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 120px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚸', 256, 310);
    } else if (type === 'ONE_WAY' || type === 'EINBAHNSTRASSE') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(10, 110, 492, 292);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 110, 492, 292);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 160px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('➡', 256, 215);

      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillText('Einbahnstraße', 256, 330);
    } else if (type === 'NO_ENTRY' || type === 'VERBOT_EINFAHRT') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, 216, 352, 80);
    } else if (type === 'ORTSTAFEL') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 80, 492, 352);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 80, 492, 352);

      ctx.fillStyle = '#000000';
      ctx.font = '900 68px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value || 'BERLIN'), 256, 200);

      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText('Bundesstadt · 50 km/h', 256, 280);
    } else if (type === 'ORTSTAFEL_ENDE') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 80, 492, 352);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 80, 492, 352);

      ctx.fillStyle = '#000000';
      ctx.font = '900 68px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(value || 'BERLIN'), 256, 200);

      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText('Tempo 100 km/h', 256, 280);

      // Vạch chéo đỏ gạch bỏ tên thành phố
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(30, 410);
      ctx.lineTo(482, 100);
      ctx.stroke();
    }
  });

  if (type === 'SPEED_LIMIT' || type === 'ROUNDABOUT' || type === 'KREISVERKEHR' || type === 'BUS_STOP' || type === 'HALTESTELLE' || type === 'NO_ENTRY' || type === 'VERBOT_EINFAHRT') {
    const signGeo = new THREE.CircleGeometry(0.45, 32);
    const signMat = getSharedTexturedMaterial(tex);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.1, signZ);
    group.add(signMesh);
  } else if (type === 'STOP_SIGN') {
    const signGeo = new THREE.CircleGeometry(0.45, 8);
    signGeo.rotateZ(Math.PI / 8);
    const signMat = getSharedTexturedMaterial(tex);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.1, signZ);
    group.add(signMesh);
  } else if (type === 'YIELD' || type === 'VORFAHRT_GEWAEHREN' || type === 'SLOPE_WARNING' || type === 'DANGER' || type === 'WILDWECHSEL' || type === 'KURVE' || type === 'BAUSTELLE' || type === 'RECHTS_VOR_LINKS' || type === 'WARNING_CHILDREN' || type === 'KINDER') {
    const signGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const signMat = getSharedTexturedMaterial(tex, { transparent: true });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.1, signZ);
    group.add(signMesh);
  } else if (type === 'PRIORITY_ROAD' || type === 'PARKING' || type === 'PEDESTRIAN_CROSSING' || type === 'TEMPO_30_ZONE' || type === 'TEMPO_30_ZONE_END') {
    const signGeo = new THREE.PlaneGeometry(0.7, 0.7);
    const signMat = getSharedTexturedMaterial(tex);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.1, signZ);
    group.add(signMesh);
  } else if (type === 'ORTSTAFEL' || type === 'ORTSTAFEL_ENDE' || type === 'ONE_WAY' || type === 'EINBAHNSTRASSE') {
    const signGeo = new THREE.PlaneGeometry(0.95, 0.65);
    const signMat = getSharedTexturedMaterial(tex);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.1, signZ);
    group.add(signMesh);
  }

  return group;
}

export function createFinishArch(x, z, width = 18) {
  const group = new THREE.Group();
  const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.2, 16), sharedMaterials.lampHead);
  leftPole.position.set(-width / 2, 2.6, 0);
  const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.2, 16), sharedMaterials.lampHead);
  rightPole.position.set(width / 2, 2.6, 0);
  group.add(leftPole); group.add(rightPole);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.35, 0.35), sharedMaterials.lampHead);
  topBar.position.set(0, 5.2, 0);
  group.add(topBar);

  const tex = getOrCreateCanvasTexture('finish_arch_banner', (ctx) => {
    const cols = 16, rows = 4;
    const cw = 1024 / cols, ch = 256 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(140, 40, 744, 176);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 8;
    ctx.strokeRect(140, 40, 744, 176);

    ctx.fillStyle = '#4ade80';
    ctx.font = '900 62px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 FINISH - ĐÍCH ĐẾN SA HÌNH', 512, 100);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('FAHRSCHULE PRÜFUNG BESTANDEN', 512, 165);
  }, 1024, 256);

  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.72, 2.2),
    getSharedTexturedMaterial(tex)
  );
  bannerMesh.position.set(0, 4.0, 0);
  group.add(bannerMesh);

  // Vạch đích hoàn thành (Finish line)
  const finishLine = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.5, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  finishLine.rotation.x = -Math.PI / 2;
  finishLine.position.set(0, 0.04, 0);
  group.add(finishLine);

  group.position.set(x, 0, z);
  return group;
}

// ── 1.4 HELPER GIÀN BIỂN BÁO TRÊN CAO AUTOBAHN (Schilderbrücke) ──────────────
export function createAutobahnGantry(arg1, arg2, arg3, arg4, arg5) {
  let x = 0, z = 0, rotY = 0, textMain = '', textSub = '';
  if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    x = arg1;
    z = arg2;
    rotY = typeof arg3 === 'number' ? arg3 : 0;
    textMain = typeof arg3 === 'string' ? arg3 : (arg4 || '');
    textSub = arg5 || (typeof arg3 === 'string' ? arg4 : '');
  } else {
    z = typeof arg1 === 'number' ? arg1 : 0;
    textMain = arg2 || '';
    textSub = arg3 || '';
  }

  const group = new THREE.Group();

  // 2 trụ thép đôi 2 bên lề cao tốc (đường rộng 36m, trụ đặt tại x = -18.4 và +18.4)
  [-18.4, 18.4].forEach(px => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 8.2, 12), sharedMaterials.trussMetal);
    pillar.position.set(px, 4.1, 0);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Xà ngang giàn không gian
  const crossbarTop = new THREE.Mesh(new THREE.BoxGeometry(37.2, 0.45, 0.45), sharedMaterials.trussMetal);
  crossbarTop.position.set(0, 8.0, 0);
  crossbarTop.castShadow = true;
  group.add(crossbarTop);

  const crossbarBottom = new THREE.Mesh(new THREE.BoxGeometry(37.2, 0.35, 0.35), sharedMaterials.trussMetal);
  crossbarBottom.position.set(0, 5.2, 0);
  group.add(crossbarBottom);

  // Biển báo chỉ dẫn màu xanh chuẩn Autobahn Đức (Zeichen 448 / Schilderbrücke)
  const cacheKey = `autobahn_gantry_${textMain || ''}_${textSub || ''}`;
  const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = '#00438a';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 1000, 232);

    // Biểu tượng Autobahn A9
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(45, 40, 110, 65, 8);
    ctx.fill();
    ctx.fillStyle = '#00438a';
    ctx.font = '900 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A 2', 100, 73);

    // Tiêu đề chính
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(textMain || 'München · Nürnberg · Berlin', 185, 78);

    // Dòng phụ / Vận tốc đề xuất
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText(textSub || 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot', 185, 155);

    // Mũi tên chỉ làn hướng đi
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬇️              ⬇️              ⬇️', 512, 215);
  }, 1024, 256);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(24.0, 2.6),
    getSharedTexturedMaterial(tex)
  );
  signMesh.position.set(0, 6.6, 0);
  group.add(signMesh);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ── 1.5 HELPER SA HÌNH 3D OBSTACLES (Shared Materials for Zero-Allocation & Fast Rendering) ──
const sharedConeBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
const sharedConeBodyMat = new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.4 });
const sharedConeStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

const sharedPoleBaseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const sharedPoleMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
const sharedPoleMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
const sharedPoleMetaMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });

export function createTrafficCone(x, z, scale = 1.0) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.05 * scale, 0.4 * scale), sharedConeBaseMat);
  base.position.y = 0.025 * scale;
  base.castShadow = true;
  group.add(base);

  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.18 * scale, 0.65 * scale, 12), sharedConeBodyMat);
  cone.position.y = 0.35 * scale;
  cone.castShadow = true;
  group.add(cone);

  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 0.18 * scale, 12), sharedConeStripeMat);
  stripe.position.y = 0.35 * scale;
  group.add(stripe);

  group.position.set(x, 0, z);
  return group;
}

export function createCornerPole(x, z, height = 1.4) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.1, 10), sharedPoleBaseMat);
  base.position.y = 0.05;
  group.add(base);

  const numStripes = 6;
  const stripeH = (height - 0.1) / numStripes;

  for (let i = 0; i < numStripes; i++) {
    const mat = (i % 2 === 0) ? sharedPoleMatRed : sharedPoleMatWhite;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, stripeH, 10), mat);
    stripe.position.y = 0.1 + i * stripeH + stripeH / 2;
    stripe.castShadow = true;
    group.add(stripe);
  }

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), sharedPoleMatRed);
  cap.position.y = height;
  group.add(cap);

  group.position.set(x, 0, z);
  return group;
}

// 🇩🇪 CỌC TIÊU PHẢN QUANG ĐƯỜNG TRƯỜNG ĐỨC (LEITPFOSTEN Z. 620)
export function createLeitpfosten(x, z, side = 'right') {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.08), postMat);
  post.position.y = 0.5;
  group.add(post);

  // Đầu vát đen đặc trưng
  const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.22, 0.085), capMat);
  cap.position.y = 0.89;
  group.add(cap);

  // Miếng phản quang (Bên phải: Đỏ hình chữ nhật; Bên trái: Trắng 2 vạch)
  const refMat = new THREE.MeshBasicMaterial({ color: side === 'right' ? 0xdc2626 : 0xffffff });
  const ref = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.12), refMat);
  ref.position.set(0, 0.88, 0.045);
  group.add(ref);

  group.position.set(x, 0, z);
  return group;
}

// 🌲 CÂY THÔNG RỪNG ĐỨC 3D (DEUTSCHE WALDTANNE)
export function createPineTree(x, z, scale = 1.0) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 2.8 * scale, 7), trunkMat);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const tiers = [
    { r: 2.3 * scale, h: 2.6 * scale, y: 3.0 * scale },
    { r: 1.8 * scale, h: 2.2 * scale, y: 4.5 * scale },
    { r: 1.2 * scale, h: 1.8 * scale, y: 5.8 * scale }
  ];
  tiers.forEach(t => {
    const tier = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), pineMat);
    tier.position.y = t.y;
    tier.castShadow = true;
    group.add(tier);
  });

  group.position.set(x, 0, z);
  return group;
}

// 🚗 MÔ HÌNH XE ĐỖ MÔ PHỎNG CHI TIẾT (SỬ DỤNG 3D CAR GLTF THẬT TỪ 3dObjects - Ưu tiên model nhẹ tối ưu FPS)
export function createParkedDummyCar(x, z, colorHex = 0x3b82f6, rotY = 0, modelIndex) {
  const mIdx = modelIndex !== undefined ? modelIndex : Math.abs(Math.floor(x * 17 + z * 31)) % 3;
  const car = createTrafficAICar(mIdx, colorHex);
  car.position.set(x, 0, z);
  car.rotation.y = rotY;
  return car;
}

// 🔀 VẠCH KẺ MŨI TÊN DẪN HƯỚNG TRÊN MẶT ĐƯỜNG (ROAD MARKING ARROWS)
export function createRoadArrow(x, z, rotY = 0, type = 'straight') {
  const group = new THREE.Group();
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Thân mũi tên
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 2.5), arrowMat);
  shaft.rotation.x = -Math.PI / 2;
  shaft.position.set(0, 0.024, -0.3);
  group.add(shaft);

  // Đầu nhọn mũi tên
  const headShape = new THREE.Shape();
  headShape.moveTo(-0.65, 0);
  headShape.lineTo(0.65, 0);
  headShape.lineTo(0, 1.25);
  headShape.closePath();
  const headGeo = new THREE.ShapeGeometry(headShape);
  headGeo.rotateX(-Math.PI / 2);
  const head = new THREE.Mesh(headGeo, arrowMat);
  head.position.set(0, 0.025, 0.95);
  group.add(head);

  if (type === 'right' || type === 'turn_right') {
    const branch = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.4), arrowMat);
    branch.rotation.x = -Math.PI / 2;
    branch.rotation.z = -Math.PI / 3.2;
    branch.position.set(0.55, 0.024, 0.15);
    group.add(branch);

    const bHead = new THREE.Mesh(headGeo, arrowMat);
    bHead.scale.set(0.65, 0.65, 0.65);
    bHead.rotation.y = -Math.PI / 3.2;
    bHead.position.set(1.1, 0.025, 0.55);
    group.add(bHead);
  } else if (type === 'left' || type === 'turn_left') {
    const branch = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 1.4), arrowMat);
    branch.rotation.x = -Math.PI / 2;
    branch.rotation.z = Math.PI / 3.2;
    branch.position.set(-0.55, 0.024, 0.15);
    group.add(branch);

    const bHead = new THREE.Mesh(headGeo, arrowMat);
    bHead.scale.set(0.65, 0.65, 0.65);
    bHead.rotation.y = Math.PI / 3.2;
    bHead.position.set(-1.1, 0.025, 0.55);
    group.add(bHead);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🦈 VẠCH RĂNG CÁ MẬP NHƯỜNG ĐƯỜNG (HAIFISCHZÄHNE - StVO ZEICHEN 342)
export function createSharkTeethYield(x, z, count = 5, spacing = 1.1, rotY = 0) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const toothShape = new THREE.Shape();
  toothShape.moveTo(-0.35, 0);
  toothShape.lineTo(0.35, 0);
  toothShape.lineTo(0, 0.85);
  toothShape.closePath();
  const toothGeo = new THREE.ShapeGeometry(toothShape);
  toothGeo.rotateX(-Math.PI / 2);

  const startOffset = -((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    const tooth = new THREE.Mesh(toothGeo, mat);
    tooth.position.set(startOffset + i * spacing, 0.025, 0);
    group.add(tooth);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🛡️ HÀNG RÀO LỐP XE AN TOÀN (TIRE WALL SAFETY BARRIER)
export function createTireWall(x, z, count = 6, rotY = 0) {
  const group = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });

  for (let i = 0; i < count; i++) {
    const px = (i - count / 2) * 0.92;
    [0.22, 0.62].forEach((ty, level) => {
      const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.38, 12);
      const tire = new THREE.Mesh(tireGeo, (level + i) % 2 === 0 ? tireMat : stripeMat);
      tire.position.set(px, ty, 0);
      tire.castShadow = true;
      group.add(tire);
    });
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🚪 CỔNG VÀO & TRẠM BẢO VỆ BARIE SA HÌNH (ENTRANCE BARRIER GATE)
export function createEntranceGate(x, z) {
  const group = new THREE.Group();
  const boothMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

  // Bốt bảo vệ kiểm soát
  const booth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 2.0), boothMat);
  booth.position.set(-6.5, 1.4, 0);
  booth.castShadow = true;
  group.add(booth);

  const windowM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), sharedMaterials.windowGlass);
  windowM.position.set(-5.28, 1.5, 0);
  windowM.rotation.y = Math.PI / 2;
  group.add(windowM);

  // Trụ xoay barie
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), sharedMaterials.lampPole);
  stand.position.set(-4.5, 0.55, 0);
  group.add(stand);

  // Thanh chắn đỏ trắng nâng 30 độ chào đón xe
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.5, 8), barrierMat);
  arm.rotation.z = Math.PI / 2 - 0.52;
  arm.position.set(-1.0, 2.1, 0);
  group.add(arm);

  for (let s = -2.5; s <= 2.5; s += 1.2) {
    const sStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.35, 8), sharedMaterials.whiteBasic);
    sStripe.rotation.z = Math.PI / 2 - 0.52;
    sStripe.position.set(-1.0 + s * Math.cos(0.52), 2.1 + s * Math.sin(0.52), 0);
    group.add(sStripe);
  }

  group.position.set(x, 0, z);
  return group;
}

export function createSaHinhBanner(title, subtitle, x, z, width = 16) {
  const group = new THREE.Group();
  const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 10), sharedMaterials.trussMetal);
  leftPole.position.set(-width / 2, 2.25, 0);
  const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 10), sharedMaterials.trussMetal);
  rightPole.position.set(width / 2, 2.25, 0);
  group.add(leftPole); group.add(rightPole);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.2, 0.2), sharedMaterials.trussMetal);
  crossbar.position.set(0, 4.4, 0);
  group.add(crossbar);

  const cacheKey = `sahinh_banner_${title}_${subtitle || ''}`;
  const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 122);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 256, 14);

    if (subtitle) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(subtitle, 256, 72);
    }
  }, 512, 128);

  const boardGeo = new THREE.PlaneGeometry(width * 0.75, 1.8);
  const boardMat = getSharedTexturedMaterial(tex);
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.position.set(0, 3.4, 0);
  group.add(boardMesh);

  group.position.set(x, 0, z);
  return group;
}

export function createTotemSign(title, subtitle, x, z, rotY = 0, headerColor = '#1d4ed8') {
  const group = new THREE.Group();
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), sharedMaterials.trussMetal);
  postL.position.set(-1.8, 1.6, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), sharedMaterials.trussMetal);
  postR.position.set(1.8, 1.6, 0);
  group.add(postL); group.add(postR);

  const cacheKey = `totem_${title}_${headerColor}`;
  const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, 512, 70);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 250);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 36);

    if (subtitle) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(subtitle, 256, 135);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('STVO FAHRSCHULE ÜBUNGSPLATZ 3D', 256, 210);
  }, 512, 256);

  const boardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.0, 2.0),
    getSharedTexturedMaterial(tex)
  );
  boardMesh.position.set(0, 2.2, 0);
  group.add(boardMesh);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

export function createFloodlightTower(x, z) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 12, 8), poleMat);
  pole.position.y = 6.0;
  group.add(pole);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const headFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.4), poleMat);
  headFrame.position.y = 12.1;
  group.add(headFrame);

  [-0.9, -0.3, 0.3, 0.9].forEach(ox => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.3), headMat);
    lamp.position.set(ox, 11.9, 0.15);
    lamp.rotation.x = 0.35;
    group.add(lamp);
  });

  group.position.set(x, 0, z);
  return group;
}

export function createControlCenterBuilding(x, z, width = 16, depth = 12, height = 9) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  main.position.y = height / 2;
  main.castShadow = true;
  group.add(main);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 1.0, 0.6, depth + 1.0), roofMat);
  roof.position.y = height + 0.3;
  group.add(roof);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.8, height * 0.55), glassMat);
  glass.position.set(0, height * 0.5, depth / 2 + 0.05);
  group.add(glass);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TRUNG TÂM SÁT HẠCH LÁI XE', 256, 42);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('FAHRSCHULE PRÜFUNGSZENTRUM', 256, 88);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.75, 2.2), getSharedTexturedMaterial(tex, { side: THREE.FrontSide }));
  sign.position.set(0, height + 1.4, depth / 2 + 0.1);
  group.add(sign);

  group.position.set(x, 0, z);
  return group;
}

export function createHillRamp(startX, startZ, width = 5.0, length = 36.0, maxHeight = 1.1) {
  const group = new THREE.Group();

  const upLength = 12.0;
  const topLength = 12.0;
  const downLength = 12.0;

  const rampMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const stopMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const upShape = new THREE.Shape();
  upShape.moveTo(0, 0);
  upShape.lineTo(upLength, maxHeight);
  upShape.lineTo(upLength, 0);
  upShape.closePath();

  const extrudeSettings = { depth: width, bevelEnabled: false };
  const upGeo = new THREE.ExtrudeGeometry(upShape, extrudeSettings);
  upGeo.rotateY(Math.PI / 2);
  // Sau rotateY(π/2), extrude chiếm X ∈ [0, width] → dịch -width/2 để sườn dốc
  // centered quanh trục X (đồng bộ với đỉnh dốc, lan can & hitbox physics)
  const upMesh = new THREE.Mesh(upGeo, rampMat);
  upMesh.position.set(-width / 2, 0, 0);
  group.add(upMesh);

  const topGeo = new THREE.BoxGeometry(width, maxHeight, topLength);
  const topMesh = new THREE.Mesh(topGeo, rampMat);
  topMesh.position.set(0, maxHeight / 2, -upLength - topLength / 2);
  group.add(topMesh);

  const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.4, 0.5), stopMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(0, maxHeight + 0.01, -upLength - topLength / 2);
  group.add(stopLine);

  const downShape = new THREE.Shape();
  downShape.moveTo(0, maxHeight);
  downShape.lineTo(downLength, 0);
  downShape.lineTo(0, 0);
  downShape.closePath();

  const downGeo = new THREE.ExtrudeGeometry(downShape, extrudeSettings);
  downGeo.rotateY(Math.PI / 2);
  const downMesh = new THREE.Mesh(downGeo, rampMat);
  downMesh.position.set(-width / 2, 0, -upLength - topLength);
  group.add(downMesh);

  const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8 });
  [-width / 2 - 0.1, width / 2 + 0.1].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, length), railMat);
    rail.position.set(x, maxHeight + 0.3, -length / 2);
    group.add(rail);
  });

  group.position.set(startX, 0, startZ);
  return group;
}

export function createZebraCrosswalk(x, z, width = 10, length = 6) {
  const group = new THREE.Group();
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const stripeWidth = 0.5;
  const gap = 0.5;
  const numStripes = Math.floor(width / (stripeWidth + gap));

  const startX = -width / 2 + stripeWidth / 2;
  for (let i = 0; i < numStripes; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth, length), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(startX + i * (stripeWidth + gap), 0.03, 0);
    group.add(stripe);
  }

  group.position.set(x, 0, z);
  return group;
}

export function createParkingMarkings(x, z, width, depth, isParallel = true) {
  const group = new THREE.Group();
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineThick = 0.15;

  if (isParallel) {
    const frontLine = new THREE.Mesh(new THREE.PlaneGeometry(width, lineThick), lineMat);
    frontLine.rotation.x = -Math.PI / 2;
    frontLine.position.set(0, 0.025, depth / 2);

    const backLine = new THREE.Mesh(new THREE.PlaneGeometry(width, lineThick), lineMat);
    backLine.rotation.x = -Math.PI / 2;
    backLine.position.set(0, 0.025, -depth / 2);

    const sideLine = new THREE.Mesh(new THREE.PlaneGeometry(lineThick, depth), lineMat);
    sideLine.rotation.x = -Math.PI / 2;
    sideLine.position.set(width / 2, 0.025, 0);

    group.add(frontLine); group.add(backLine); group.add(sideLine);

    [
      [-width / 2, depth / 2],
      [width / 2, depth / 2],
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2]
    ].forEach(([cx, cz]) => {
      group.add(createCornerPole(cx, cz, 1.3));
    });
  } else {
    const backLine = new THREE.Mesh(new THREE.PlaneGeometry(width, lineThick), lineMat);
    backLine.rotation.x = -Math.PI / 2;
    backLine.position.set(0, 0.025, -depth / 2);

    const leftLine = new THREE.Mesh(new THREE.PlaneGeometry(lineThick, depth), lineMat);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-width / 2, 0.025, 0);

    const rightLine = new THREE.Mesh(new THREE.PlaneGeometry(lineThick, depth), lineMat);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(width / 2, 0.025, 0);

    group.add(backLine); group.add(leftLine); group.add(rightLine);

    [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [-width / 2, depth / 2],
      [width / 2, depth / 2]
    ].forEach(([cx, cz]) => {
      group.add(createCornerPole(cx, cz, 1.3));
    });
  }

  group.position.set(x, 0, z);
  return group;
}

// ── 1.6 GERMAN CITY 3D BUILDER PROPS (STADT-MÖBLIERUNG & GEBÄUDE) ─────────────

// 💡 Cột đèn đường đô thị Đức (Straßenlaterne mit LED-Leuchte)
export function createGermanStreetLamp(x, z, rotY = 0) {
  const group = new THREE.Group();

  // Cột đứng cao 6.8m
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.8, 8), sharedMaterials.lampPole);
  pole.position.y = 3.4;
  pole.castShadow = true;
  group.add(pole);

  // Cần vươn cong ra lòng đường 2.2m
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), sharedMaterials.lampPole);
  arm.rotation.z = -Math.PI / 3.2;
  arm.position.set(0.95, 6.5, 0);
  group.add(arm);

  // Hộp đèn LED dẹt hiện đại
  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.38), sharedMaterials.lampHead);
  lampHead.position.set(1.9, 6.9, 0);
  lampHead.rotation.z = -0.15;
  group.add(lampHead);

  // Mặt kính phát quang LED ấm áp
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.3), sharedMaterials.lampGlow);
  glow.rotation.x = Math.PI / 2;
  glow.position.set(1.9, 6.82, 0);
  group.add(glow);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🚏 Trạm xe buýt Đức hiện đại (Bushaltestelle mit Glaswartehäuschen & Zick-Zack-Linie)
export function createGermanBusStop(x, z, rotY = 0) {
  const group = new THREE.Group();

  // 1. Khung nhà chờ kính (Wartehäuschen)
  const width = 4.8, height = 2.6, depth = 1.8;
  // Mái che vòm nhẹ
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.15, depth + 0.4), sharedMaterials.roofDark);
  roof.position.set(0, height + 0.08, 0);
  roof.castShadow = true;
  group.add(roof);

  // 4 cột trụ thép góc
  [
    [-width / 2 + 0.1, -depth / 2 + 0.1],
    [width / 2 - 0.1, -depth / 2 + 0.1],
    [-width / 2 + 0.1, depth / 2 - 0.1],
    [width / 2 - 0.1, depth / 2 - 0.1]
  ].forEach(([cx, cz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, height, 6), sharedMaterials.trussMetal);
    post.position.set(cx, height / 2, cz);
    group.add(post);
  });

  // Vách kính sau lưng
  const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.2, height - 0.3), sharedMaterials.windowGlass);
  backGlass.position.set(0, height / 2 + 0.1, -depth / 2 + 0.1);
  group.add(backGlass);

  // Vách kính hông bên trái
  const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(depth - 0.2, height - 0.3), sharedMaterials.windowGlass);
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.position.set(-width / 2 + 0.1, height / 2 + 0.1, 0);
  group.add(sideGlass);

  // Ghế ngồi gỗ dài bên trong
  const bench = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.08, 0.45), sharedMaterials.urbanTrunk);
  bench.position.set(0, 0.48, -depth / 2 + 0.45);
  group.add(bench);

  // 2. Bảng thông tin lộ trình & giờ xe chạy (Fahrplan-Kasten)
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.08), sharedMaterials.whiteBasic);
  board.position.set(width / 2 - 0.6, 1.5, -depth / 2 + 0.15);
  group.add(board);

  // 3. Biển báo trạm xe buýt StVO Zeichen 224 (Chữ H tròn vàng viền xanh)
  const busSign = makeGermanStVOSign('BUS_STOP');
  busSign.position.set(width / 2 + 0.8, 0, depth / 2);
  group.add(busSign);

  // 4. Thùng rác công cộng
  const trashBin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.65, 8), sharedMaterials.urbanLeafMain);
  trashBin.position.set(-width / 2 - 0.4, 0.75, depth / 2);
  group.add(trashBin);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🏢 Mặt tiền cửa hàng đô thị Đức chuẩn chân thực (Bäckerei, Apotheke, Supermarkt, Sparkasse, Fahrschule)
export function createGermanStorefront(x, z, width = 16, height = 20, depth = 16, type = 'BAECKEREI', rotY = 0, customConfig = null) {
  const group = new THREE.Group();

  // Màu sắc kiến trúc đặc trưng từng loại cửa hàng Đức (Độ phản xạ albedo 45-55% chống lóa sáng chói mắt)
  const themeColors = {
    BAECKEREI: { wall: 0xd9cebe, signBg: '#78350f', signText: '#fde68a', title: 'BÄCKEREI & CAFÉ MÜLLER', sub: 'Frische Brötchen · Kaffee · Kuchen', awning: 0xb45309 },
    APOTHEKE: { wall: 0xc4cbd3, signBg: '#ffffff', signText: '#dc2626', title: 'STADT-APOTHEKE', sub: 'Notdienst 24h · Arzneimittel', awning: 0xdc2626 },
    SUPERMARKT: { wall: 0xbfc5cc, signBg: '#b91c1c', signText: '#ffffff', title: 'REWE CITY', sub: 'Täglich frisch bis 22 Uhr', awning: 0xb91c1c },
    SPARKASSE: { wall: 0xc8ced4, signBg: '#dc2626', signText: '#ffffff', title: 'SPARKASSE', sub: 'Geldautomat 24h · SB-Filiale', awning: 0x991b1b },
    FAHRSCHULE: { wall: 0xb5c9d6, signBg: '#0284c7', signText: '#ffffff', title: 'FAHRSCHULE SCHMIDT', sub: 'Klasse B · Theorie & Praxis StVO', awning: 0x0284c7 }
  };
  const baseTheme = themeColors[type] || themeColors.BAECKEREI;
  const theme = customConfig ? { ...baseTheme, ...customConfig } : baseTheme;

  const wallMat = getOrCreateWallMaterial(theme.wall);
  const awningMat = getOrCreateAwningMaterial(theme.awning);

  // Khối tòa nhà chính
  const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  mainBuilding.position.y = height / 2;
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  group.add(mainBuilding);

  // Tầng trệt (Ground floor facade kính & ốp đá sẫm màu)
  const gfHeight = 4.2;
  const gfFacade = new THREE.Mesh(new THREE.BoxGeometry(width + 0.15, gfHeight, depth + 0.15), sharedMaterials.groundFloor);
  gfFacade.position.y = gfHeight / 2;
  group.add(gfFacade);

  // Gờ chỉ phân tầng kiến trúc Đức (Gesimsband)
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.22, depth + 0.3), sharedMaterials.cornice);
  cornice.position.y = gfHeight + 0.11;
  group.add(cornice);

  // Cửa kính trưng bày lớn (Schaufenster)
  const windowWidth = width * 0.75;
  const shopWindow = new THREE.Mesh(new THREE.PlaneGeometry(windowWidth, 2.6), sharedMaterials.windowGlass);
  shopWindow.position.set(0, 1.8, depth / 2 + 0.1);
  group.add(shopWindow);

  // Biển hiệu cửa hàng phía trên mặt tiền (Leuchtreklame)
  const cacheKey = `storefront_sign_${type}_${theme.title || ''}`;
  const signTex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = theme.signBg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = theme.signText;
    ctx.font = '900 34px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(theme.title, 256, 44);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(theme.sub, 256, 92);
  }, 512, 128);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.78, 1.5),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 3.6, depth / 2 + 0.15);
  group.add(signMesh);

  // Mái hiên che nắng gấp vát (Markise)
  const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.08, 1.6), awningMat);
  awning.rotation.x = 0.25;
  awning.position.set(0, 3.3, depth / 2 + 0.85);
  awning.castShadow = true;
  group.add(awning);

  // Ban công & Cửa sổ mặt trước các tầng trên
  for (let floorY = 6.2; floorY < height - 2; floorY += 4.0) {
    [-width * 0.25, width * 0.25].forEach(wx => {
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), sharedMaterials.windowGlass);
      windowMesh.position.set(wx, floorY, depth / 2 + 0.06);
      group.add(windowMesh);

      const sill = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.25), sharedMaterials.windowFrame);
      sill.position.set(wx, floorY - 1.15, depth / 2 + 0.12);
      group.add(sill);
    });
  }

  // Nếu là tiệm bánh Bäckerei: Thêm 2 bàn cà phê vỉa hè
  if (type === 'BAECKEREI') {
    [-2.2, 2.2].forEach(tx => {
      const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 10), sharedMaterials.trussMetal);
      tableTop.position.set(tx, 0.75, depth / 2 + 1.4);
      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6), sharedMaterials.trussMetal);
      tableLeg.position.set(tx, 0.38, depth / 2 + 1.4);
      group.add(tableTop); group.add(tableLeg);

      [-0.45, 0.45].forEach(cy => {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), sharedMaterials.poleMetal);
        chair.position.set(tx, 0.23, depth / 2 + 1.4 + cy);
        group.add(chair);
      });
    });
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 📮 Tiện ích đường phố đô thị Đức (Hộp thư bưu điện vàng, bãi xe đạp, cột ngăn vỉa hè)
export function createGermanStreetProp(x, z, type = 'MAILBOX', rotY = 0, customText = null) {
  const group = new THREE.Group();

  if (type === 'MAILBOX') {
    // Hộp thư Deutsche Post màu vàng tươi đặc trưng
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), sharedMaterials.lampPole);
    pole.position.y = 0.38;
    group.add(pole);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.4), sharedMaterials.yellowBasic);
    box.position.y = 1.05;
    box.castShadow = true;
    group.add(box);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.02), sharedMaterials.bollard);
    slot.position.set(0, 1.25, 0.21);
    group.add(slot);
  } else if (type === 'BIKE_RACK') {
    // Giá để xe đạp bằng inox (Fahrradbügel)
    [-0.6, 0.6].forEach(bx => {
      const uBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), sharedMaterials.poleMetal);
      uBar.position.set(bx, 0.45, 0);
      group.add(uBar);
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), sharedMaterials.poleMetal);
      topBar.position.set(bx, 0.88, 0);
      group.add(topBar);
    });

    const wheel = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.32, 10), sharedMaterials.bollard);
    wheel.position.set(0, 0.32, 0.15);
    group.add(wheel);
  } else if (type === 'BOLLARD') {
    // Cọc ngăn xe lên vỉa hè (Poller)
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.95, 8), sharedMaterials.bollard);
    post.position.y = 0.48;
    post.castShadow = true;
    group.add(post);

    const redStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.12, 8), sharedMaterials.whiteBasic);
    redStripe.position.y = 0.78;
    group.add(redStripe);
  } else if (type === 'STREET_SIGN') {
    // Biển tên đường màu xanh đặc trưng nước Đức
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6), sharedMaterials.trussMetal);
    pole.position.y = 1.4;
    group.add(pole);

    const cacheKey = `streetsign_${customText || 'Hauptstraße'}`;
    const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customText || 'Hauptstraße 1-38', 256, 64);
    }, 512, 128);

    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), getSharedTexturedMaterial(tex));
    signMesh.position.set(0, 2.6, 0);
    group.add(signMesh);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ⚡ Bảng radar đo tốc độ điện tử Đức (Geschwindigkeitsanzeige: "SIE FAHREN ... km/h")
export function createSpeedRadarDisplay(x, z, rotY = 0, limit = 50) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6), sharedMaterials.lampPole);
  pole.position.y = 1.4;
  group.add(pole);

  const cacheKey = `speed_radar_${limit}`;
  const tex = getOrCreateCanvasTexture(cacheKey, (ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 368);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SIE FAHREN', 256, 58);

    ctx.fillStyle = '#22c55e';
    ctx.font = '900 130px monospace';
    ctx.fillText(String(limit), 256, 185);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('km/h · DANKE! 😊', 256, 310);
  }, 512, 384);

  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.15), getSharedTexturedMaterial(tex));
  board.position.set(0, 2.25, 0);
  group.add(board);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ⛽ Cây xăng ngoại vi đô thị Đức (Deutsche Tankstelle)
export function createGasStation(x, z, rotY = 0) {
  const group = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
  const columnMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const hoseMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

  // Mái che lớn hình chữ nhật
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 12), roofMat);
  canopy.position.set(0, 5.2, 0);
  canopy.castShadow = true;
  group.add(canopy);

  // 4 cột trụ thép lớn
  [
    [-5.5, -3.5], [5.5, -3.5],
    [-5.5, 3.5], [5.5, 3.5]
  ].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.2, 8), sharedMaterials.curbConcrete);
    col.position.set(cx, 2.6, cz);
    col.castShadow = true;
    group.add(col);
  });

  // 2 đảo bơm xăng (Zapfsäulen)
  [-3.2, 3.2].forEach(px => {
    const island = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 6.0), sharedMaterials.curbConcrete);
    island.position.set(px, 0.12, 0);
    group.add(island);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 1.4), sharedMaterials.lampHead);
    pump.position.set(px, 1.05, 0);
    pump.castShadow = true;
    group.add(pump);

    // Vòi bơm xăng xanh
    const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), sharedMaterials.urbanLeafHigh);
    nozzle.position.set(px + 0.38, 1.1, 0);
    group.add(nozzle);
  });

  // Biển Totem báo giá xăng (Preisanzeige)
  const totemTex = getOrCreateCanvasTexture('gas_station_totem', (ctx) => {
    ctx.fillStyle = '#0284c7'; ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = '#ffffff'; ctx.font = '900 42px Arial'; ctx.textAlign = 'center';
    ctx.fillText('TANKEN', 128, 60);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 28px monospace';
    ctx.fillText('Diesel 1.62 €', 128, 160);
    ctx.fillText('Super  1.74 €', 128, 230);
    ctx.fillText('E10    1.68 €', 128, 300);
    ctx.fillStyle = '#22c55e'; ctx.font = 'bold 30px Arial';
    ctx.fillText('OPEN 24h', 128, 420);
  }, 256, 512);
  const totem = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.5, 0.4), new THREE.MeshBasicMaterial({ map: totemTex }));
  totem.position.set(-11, 2.75, 6);
  group.add(totem);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🏛️ NHÀ HÁT KỊCH BIỂU TƯỢNG THỦ ĐÔ BERLIN: VOLKSBÜHNE AM ROSA-LUXEMBURG-PLATZ
export function createVolksbuehneTheater(x, z, rotY = 0) {
  const group = new THREE.Group();

  // 1. Thềm bậc tam cấp (Grand podium steps)
  const baseWidth = 32, baseDepth = 26, baseHeight = 1.2;
  const basePodium = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth), sharedMaterials.darkStoneVolks);
  basePodium.position.y = baseHeight / 2;
  basePodium.receiveShadow = true;
  group.add(basePodium);

  for (let s = 1; s <= 4; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(baseWidth * 0.75, 0.25, 1.2 * s), sharedMaterials.darkStoneVolks);
    step.position.set(0, 0.12 * (5 - s), baseDepth / 2 + 0.6 * s);
    group.add(step);
  }

  // 2. Khối sảnh chính (Main Portico)
  const porticoW = 28, porticoH = 16, porticoD = 18;
  const lobbyBody = new THREE.Mesh(new THREE.BoxGeometry(porticoW, porticoH, porticoD), sharedMaterials.stoneVolks);
  lobbyBody.position.set(0, baseHeight + porticoH / 2, 0);
  lobbyBody.castShadow = true;
  lobbyBody.receiveShadow = true;
  group.add(lobbyBody);

  // 3. Khối nhà hát lớn phía sau (Auditorium Hall)
  const hallW = 26, hallH = 22, hallD = 16;
  const hallBody = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, hallD), sharedMaterials.stoneVolks);
  hallBody.position.set(0, baseHeight + hallH / 2, -10);
  hallBody.castShadow = true;
  group.add(hallBody);

  // Mái vòm nhà hát (Curved barrel roof)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(hallW * 0.5, hallW * 0.5, hallD, 12, 1, false, 0, Math.PI), sharedMaterials.roofDark);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0, baseHeight + hallH, -10);
  group.add(roof);

  // 4. Hàng cột tân cổ điển mặt tiền (6 Columns)
  const colCount = 6;
  const colSpacing = 4.4;
  for (let i = 0; i < colCount; i++) {
    const cx = (i - (colCount - 1) / 2) * colSpacing;
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 11, 8), sharedMaterials.columnVolks);
    colMesh.position.set(cx, baseHeight + 5.5, porticoD / 2 + 0.8);
    colMesh.castShadow = true;
    group.add(colMesh);

    const colBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), sharedMaterials.darkStoneVolks);
    colBase.position.set(cx, baseHeight + 0.3, porticoD / 2 + 0.8);
    group.add(colBase);
  }

  // 5. Cửa đại sảnh vào nhà hát (Bronze entrance doors)
  [-6, 0, 6].forEach(dx => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.3), sharedMaterials.doorVolks);
    door.position.set(dx, baseHeight + 2.1, porticoD / 2 + 0.1);
    group.add(door);

    const transom = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.8), sharedMaterials.windowGlass);
    transom.position.set(dx, baseHeight + 5.3, porticoD / 2 + 0.16);
    group.add(transom);
  });

  // 6. Trán tường & Dòng chữ nổi biểu tượng "VOLKSBÜHNE"
  const entablature = new THREE.Mesh(new THREE.BoxGeometry(porticoW + 1.2, 2.6, 3.2), sharedMaterials.stoneVolks);
  entablature.position.set(0, baseHeight + 12.3, porticoD / 2 + 0.8);
  entablature.castShadow = true;
  group.add(entablature);

  const textTex = getOrCreateCanvasTexture('volksbuehne_banner', (ctx) => {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VOLKSBÜHNE', 512, 105);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('BERLIN · AM ROSA-LUXEMBURG-PLATZ', 512, 185);
  }, 1024, 256);

  const textSign = new THREE.Mesh(
    new THREE.PlaneGeometry(porticoW * 0.8, 2.2),
    getSharedTexturedMaterial(textTex)
  );
  textSign.position.set(0, baseHeight + 12.3, porticoD / 2 + 2.45);
  group.add(textSign);

  // 7. Cột cờ Berlin trước sân
  [-11, 11].forEach(fx => {
    const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 12, 6), sharedMaterials.darkStoneVolks);
    flagpole.position.set(fx, baseHeight + 6, porticoD / 2 + 5);
    group.add(flagpole);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), sharedMaterials.redBasic);
    flag.position.set(fx + 1.2, baseHeight + 10.5, porticoD / 2 + 5);
    group.add(flag);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🚇 LỐI VÀO GA TÀU ĐIỆN NGẦM BERLIN U-BAHN (BVG U-BHF ROSA-LUXEMBURG-PLATZ U2)
export function createUBahnEntrance(x, z, rotY = 0, stationName = 'U Rosa-Luxemburg-Platz') {
  const group = new THREE.Group();
  const w = 3.6, d = 7.0, h = 1.1;

  const pitVoid = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), sharedMaterials.lampHead);
  pitVoid.rotation.x = -Math.PI / 2;
  pitVoid.position.set(0, 0.04, 0);
  group.add(pitVoid);

  // Bậc thang đi xuống
  for (let st = 0; st < 5; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.15, 0.7), sharedMaterials.groundFloor);
    step.position.set(0, -0.12 * st, -d / 2 + 1.0 + st * 0.8);
    group.add(step);
  }

  // Gờ đá bao quanh miệng hầm
  const curb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), sharedMaterials.curbConcrete);
  curb.position.set(0, 0.12, 0);
  group.add(curb);

  // Lan can sắt mỹ thuật Berlin U-Bahn
  [-w / 2 + 0.1, w / 2 - 0.1].forEach(rx => {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, d), sharedMaterials.urbanLeafHigh);
    sideRail.position.set(rx, h / 2 + 0.15, 0);
    group.add(sideRail);
  });
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), sharedMaterials.urbanLeafHigh);
  backRail.position.set(0, h / 2 + 0.15, -d / 2 + 0.1);
  group.add(backRail);

  // Biển biểu tượng U-Bahn Berlin (Biển chữ U màu xanh đậm phát quang)
  const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6), sharedMaterials.lampPole);
  signPole.position.set(w / 2 + 0.4, 2.1, d / 2);
  group.add(signPole);

  const uCubeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const uCube = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.3), uCubeMat);
  uCube.position.set(w / 2 + 0.4, 4.2, d / 2);
  group.add(uCube);

  const uTex = getOrCreateCanvasTexture('ubahn_cube_u', (ctx) => {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 190px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('U', 128, 128);
  }, 256, 256);

  const uFace1 = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({ map: uTex, side: THREE.DoubleSide }));
  uFace1.position.set(w / 2 + 0.4, 4.2, d / 2 + 0.16);
  group.add(uFace1);

  // Bảng tên ga "U Rosa-Luxemburg-Platz (U2)"
  const nameCacheKey = `ubahn_name_${stationName}`;
  const nameTex = getOrCreateCanvasTexture(nameCacheKey, (ctxName) => {
    ctxName.fillStyle = '#0284c7';
    ctxName.fillRect(0, 0, 512, 128);
    ctxName.strokeStyle = '#ffffff';
    ctxName.lineWidth = 6;
    ctxName.strokeRect(4, 4, 504, 120);

    ctxName.fillStyle = '#dc2626';
    ctxName.fillRect(16, 24, 75, 80);
    ctxName.fillStyle = '#ffffff';
    ctxName.font = 'bold 44px Arial';
    ctxName.textAlign = 'center';
    ctxName.fillText('U2', 53, 80);

    ctxName.font = 'bold 30px Arial';
    ctxName.textAlign = 'left';
    ctxName.fillText('Rosa-Luxemburg-Pl.', 105, 76);
  }, 512, 128);

  const nameSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: nameTex, side: THREE.DoubleSide }));
  nameSign.position.set(0, 2.2, d / 2 + 0.2);
  group.add(nameSign);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🚏 BIỂN KHUNG TREO CHỈ HƯỚNG GIAO LỘ LỚN BERLIN MITTE (WEGWEISER GANTRY)
export function createBerlinGantrySign(x, z, rotY = 0) {
  const group = new THREE.Group();
  const span = 16;
  [-span / 2, span / 2].forEach(px => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.5, 6), sharedMaterials.trussMetal);
    post.position.set(px, 3.75, 0);
    group.add(post);
  });

  const beam = new THREE.Mesh(new THREE.BoxGeometry(span + 1.2, 0.45, 0.45), sharedMaterials.trussMetal);
  beam.position.set(0, 7.0, 0);
  group.add(beam);

  const tex = getOrCreateCanvasTexture('berlin_gantry_sign', (ctx) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('⬅  Rosa-Luxemburg-Str. / Alexanderplatz', 40, 75);
    ctx.fillText('⬆  Mollstraße / Prenzlauer Berg', 40, 140);
    ctx.fillText('➡  Prenzlauer Allee (B109)', 40, 205);
  }, 1024, 256);

  const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.0), getSharedTexturedMaterial(tex));
  signBoard.position.set(0, 5.8, 0.3);
  group.add(signBoard);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🌳 Cây xanh đô thị Đức phân tầng tự nhiên kèm nắp lưới gang bảo vệ gốc cây (Baumscheibengitter)
export function createRealisticUrbanTree(x, z, scale = 1.0) {
  const group = new THREE.Group();

  // 1. Nắp lưới gang bảo vệ gốc cây trên vỉa hè (Baumscheibengitter 2m x 2m)
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(2.2 * scale, 2.2 * scale), sharedMaterials.urbanGrate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.y = 0.095;
  group.add(grate);

  // Đất mùn sẫm màu trong hố cây
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.85 * scale, 8), sharedMaterials.urbanSoil);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.10;
  group.add(soil);

  // 2. Thân cây chính uốn lượn tự nhiên
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.20 * scale, 0.35 * scale, 4.2 * scale, 6), sharedMaterials.urbanTrunk);
  trunk.position.y = 2.1 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  // 3. Tán lá đan xen phân tầng (2 khối cầu nhẹ, không cast shadow để giữ 60 FPS)
  const canopyMain = new THREE.Mesh(new THREE.SphereGeometry(2.2 * scale, 7, 6), sharedMaterials.urbanLeafMain);
  canopyMain.position.set(0, 4.8 * scale, 0);
  group.add(canopyMain);

  const canopyCrown = new THREE.Mesh(new THREE.SphereGeometry(1.6 * scale, 6, 5), sharedMaterials.urbanLeafHigh);
  canopyCrown.position.set(0.3 * scale, 6.2 * scale, -0.2 * scale);
  group.add(canopyCrown);

  group.position.set(x, 0, z);
  return group;
}

// 🕳️ Nắp cống thoát nước tròn bằng gang đúc Đức (Kanalisationsdeckel - DIN EN 124)
export function createGermanManhole(x, z) {
  const group = new THREE.Group();

  const rim = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.46, 16), sharedMaterials.manholeRim);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.024;
  group.add(rim);

  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), sharedMaterials.manholePlate);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.025;
  group.add(plate);

  group.position.set(x, 0, z);
  return group;
}

// 🌧️ Cửa hố ga thu nước mưa gang xám sát mép vỉa hè (Straßeneinlauf / Gulli)
export function createGermanStreetDrain(x, z, rotY = 0) {
  const group = new THREE.Group();

  // Khung viền bê tông/gang
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.85), sharedMaterials.drainFrame);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = 0.024;
  group.add(frame);

  // 3 Nan sắt thu nước mưa
  [-0.2, 0, 0.2].forEach(s => {
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.06), sharedMaterials.drainIron);
    slot.rotation.x = -Math.PI / 2;
    slot.position.set(0, 0.026, s);
    group.add(slot);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🏛️ Cột quảng cáo tròn truyền thống Đức (Litfaßsäule)
export function createLitfasssaeule(x, z) {
  const group = new THREE.Group();

  // Thân trụ tròn cao 3.8m, đường kính 1.4m
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 3.4, 16), sharedMaterials.curbConcrete);
  body.position.y = 1.7;
  body.castShadow = true;
  group.add(body);

  // Mái vòm trang trí trên đỉnh
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.22, 16), sharedMaterials.roofDark);
  cap.position.y = 3.5;
  group.add(cap);

  // Poster dán kín quanh thân cột (Texture Canvas phong phú áp phích)
  const tex = getOrCreateCanvasTexture('litfass_posters', (ctx) => {
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(10, 15, 150, 226);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 20px Arial'; ctx.fillText('PHILHARMONIE', 16, 45);
    ctx.fillStyle = '#ffffff'; ctx.font = '14px Arial'; ctx.fillText('BERLIN 2026', 16, 75);

    ctx.fillStyle = '#b91c1c'; ctx.fillRect(175, 15, 150, 226);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.fillText('KUNST', 190, 50);
    ctx.fillText('MUSEUM', 190, 80);

    ctx.fillStyle = '#0284c7'; ctx.fillRect(340, 15, 160, 226);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.fillText('THEATER', 355, 50);
  }, 512, 256);

  const posterWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.725, 0.725, 2.5, 16), getSharedTexturedMaterial(tex, { side: THREE.FrontSide }));
  posterWrap.position.y = 1.75;
  group.add(posterWrap);

  group.position.set(x, 0, z);
  return group;
}

// ♻️ Cụm thùng thu gom thủy tinh tái chế Đức (Altglascontainer: Trắng, Xanh, Nâu)
export function createAltglascontainer(x, z) {
  const group = new THREE.Group();
  const cTypes = [
    { mat: sharedMaterials.whiteBasic, ox: -1.2 },
    { mat: sharedMaterials.urbanLeafMain, ox: 0 },
    { mat: sharedMaterials.urbanTrunk, ox: 1.2 }
  ];

  cTypes.forEach(ct => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.4, 1.1), ct.mat);
    box.position.set(ct.ox, 0.7, 0);
    box.castShadow = true;
    group.add(box);

    [-0.22, 0.22].forEach(hx => {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.10, 8), sharedMaterials.lampHead);
      hole.position.set(ct.ox + hx, 1.1, 0.56);
      group.add(hole);
    });
  });

  group.position.set(x, 0, z);
  return group;
}

// ⏰ Đồng hồ công cộng đô thị Đức hai mặt (Straßenuhr)
export function createStreetClock(x, z, rotY = 0) {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 4.2, 8), sharedMaterials.lampHead);
  pole.position.y = 2.1;
  pole.castShadow = true;
  group.add(pole);

  const clockHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16), sharedMaterials.lampHead);
  clockHousing.rotation.z = Math.PI / 2;
  clockHousing.position.y = 4.3;
  group.add(clockHousing);

  [-0.155, 0.155].forEach(dx => {
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16), sharedMaterials.whiteBasic);
    dial.rotation.y = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
    dial.position.set(dx, 4.3, 0);
    group.add(dial);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🅿️ Máy bán vé đỗ xe tự động năng lượng mặt trời (Parkscheinautomat)
export function createParkingMeter(x, z, rotY = 0) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), sharedMaterials.lampPole);
  body.position.y = 0.8;
  body.castShadow = true;
  group.add(body);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), sharedMaterials.poleMetal);
  screen.position.set(0, 1.15, 0.18);
  group.add(screen);

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// 🏁 Vệt lốp phanh cao su bám trên mặt đường (Bremsspuren)
export function createTireSkidMarks(x, z, length = 14) {
  const group = new THREE.Group();
  const skidMat = new THREE.MeshBasicMaterial({
    color: 0x09090b,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });

  [-0.95, 0.95].forEach(tx => {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.24, length), skidMat);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(tx, 0.024, 0);
    group.add(mark);
  });

  group.position.set(x, 0, z);
  return group;
}

// ── 2. XÂY DỰNG 3 MÔI TRƯỜNG CHỈNH CHU (STADT, AUTOBAHN, LANDSTRASSE) ──────────
