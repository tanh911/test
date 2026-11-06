import * as THREE from 'three';
import {
  createBuildingFacadeTexture,
  createPbrRoadMaterial,
  createPbrGrassMaterial,
  createBikeLaneMaterial,
  createSidewalkMaterial,
  createCobblestoneMaterial,
  ensureUV2
} from './textures.js';
import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';
import { buildBerlinMitteDistrict } from './berlinMitteDistrict.js';
import { buildLandstrasseDistrict } from './landstrasseDistrict.js';
import { buildAutobahnDistrict } from './autobahnDistrict.js';

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
export function buildCityWorld(scene, mapType = 'stadt_zentrum', options = {}) {
  const isPerformance = !!options.isPerformance;
  const mapConfigs = {
    // 🏙️ 1. STADT (Thành phố: 50 km/h)
    stadt_zentrum: {
      roadWidth: 16,
      roadLength: 1000,
      roadZ: -100,
      grassWidth: 650,
      hasIntersections: true,
      intersectionSpacing: 100,
      buildingDensity: 0.5,
      treeDensity: 0.25,
      hasAutobahn: false,
      maxSpeedLimit: 50,
      buildingHeight: 22,
      roadColor: 0x111827,
      grassColor: 0x166534, // Cỏ xanh tự nhiên Đức
      skyColor: 0x38bdf8,
      playerSpawn: { x: 2.5, z: 25.0, rotation: 0 },
      aiSpawns: [
        { x: -66.0, z: -50, speed: 40, isOpposite: true },
        { x: -74.0, z: -90, speed: 45, isOpposite: false },
        { x: -66.0, z: -140, speed: 45, isOpposite: true }
      ]
    },
    // 🛣️ 2. AUTOBAHN A2 (Cao tốc: 130 km/h)
    autobahn_a9: {
      roadWidth: 36,
      roadLength: 5000,
      roadZ: -2300,
      grassWidth: 800,
      hasIntersections: false,
      intersectionSpacing: 0,
      buildingDensity: 0.0,
      treeDensity: 0.2,
      hasAutobahn: true,
      maxSpeedLimit: 130,
      buildingHeight: 0,
      roadColor: 0x0f172a,
      grassColor: 0x1e293b,
      skyColor: 0x0284c7,
      // 🏘️ Spawn trong phố Rhynern (Werler Straße) — route vòng: phố → Auffahrt → A2
      // → U-turn cuối A2 → Ausfahrt → về phố (khớp road_graph_autobahn.json + maps.js)
      playerSpawn: { x: -396, z: 895, rotation: 157 },
      aiSpawns: [
        { x: 12.0, z: -100, speed: 140, isOpposite: false },
        { x: 6.0, z: -250, speed: 110, isOpposite: false },
        { x: -6.0, z: -400, speed: 120, isOpposite: true },
        { x: -12.0, z: -600, speed: 150, isOpposite: true }
      ]
    },
    // 🌲 3. AUF DEM LAND (Nông thôn / Landstraße: 100 km/h)
    landstrasse_b2: {
      roadWidth: 8,
      roadLength: 2500,
      roadZ: -1100,
      grassWidth: 600,
      hasIntersections: true,
      intersectionSpacing: 300,
      buildingDensity: 0.04,
      treeDensity: 0.9,
      hasAutobahn: false,
      maxSpeedLimit: 100,
      buildingHeight: 8,
      roadColor: 0x1f2937,
      grassColor: 0x15803d, // Cỏ xanh mướt nổi bật
      skyColor: 0x7dd3fc,
      playerSpawn: { x: 2.0, z: 0 }
    },
    // 🌲 3.5 LANDSTRASSE WALD (Đường Rừng Ngoài Đô Thị Đức: 100 km/h)
    landstrasse_wald: {
      roadWidth: 9,
      roadLength: 2600,
      roadZ: -1200,
      grassWidth: 700,
      hasIntersections: true,
      intersectionSpacing: 450,
      buildingDensity: 0.01,
      treeDensity: 0.95,
      hasAutobahn: false,
      maxSpeedLimit: 100,
      buildingHeight: 6,
      roadColor: 0x1f2937,
      grassColor: 0x14532d, // Rừng thông Đức xanh sẫm
      skyColor: 0x38bdf8,
      playerSpawn: { x: 2.25, z: 0 },
      aiSpawns: [
        { x: 2.25, z: -180, speed: 85, isOpposite: false },
        { x: -2.25, z: -350, speed: 90, isOpposite: true },
        { x: -2.25, z: -700, speed: 95, isOpposite: true }
      ]
    },
    // 🏎️ 4. SA HÌNH HỌC LÁI XE 3D (Fahrschule Training Ground - Sân Tập Bãi Lớn Đa Mô Hình)
    sa_hinh_fahrschule: {
      roadWidth: 240, // Khoảng sân bãi rộng lớn 240m
      roadLength: 1200, // Chiều dài 1200m trải dài từ Z = +250 đến Z = -950 (gương chiếu hậu soi rõ mặt đường phía sau)
      roadZ: -350, // Tâm sân tại Z = -350
      grassWidth: 600,
      hasIntersections: false,
      buildingDensity: 0.0,
      treeDensity: 0.1,
      hasAutobahn: false,
      maxSpeedLimit: 60, // Mở khóa tốc độ 60 km/h (hết bị giới hạn 30)
      buildingHeight: 0,
      roadColor: 0x1e293b,
      grassColor: 0x15803d,
      skyColor: 0x38bdf8,
      playerSpawn: { x: 3.5, z: 0 },
      aiSpawns: []
    }
  };

  if (mapType === 'autobahn_a' || mapType === 'AUTOBAHN' || mapType === 'autobahn') mapType = 'autobahn_a9';
  if (mapType === 'STADT' || mapType === 'stadt') mapType = 'stadt_zentrum';
  if (mapType === 'SA_HINH' || mapType === 'sa_hinh') mapType = 'sa_hinh_fahrschule';

  const config = mapConfigs[mapType]
    // 🎓 training_circuit không có entry riêng ở trên — phải trả config có graphSource
    // để autobahnDistrict dựng graph training + GLB training_circuit.glb (không phải autobahn);
    // playerSpawn phải khớp maps.js (environment return playerSpawnPos: config.playerSpawn)
    || (mapType === 'training_circuit'
      ? { roadWidth: 12, roadLength: 1600, graphSource: 'training', playerSpawn: { x: -400, z: 185, rotation: 180 } }
      : mapConfigs.stadt_zentrum);

  // Material nhựa đường PBR chân thực từ bộ texture Poly Haven (Tỉ lệ thực tế: 2m x 2m / tile)
  const roadMat = createPbrRoadMaterial({
    repeatX: Math.max(1, Math.round(config.roadWidth / 2.0)),
    repeatZ: Math.round(config.roadLength / 2.0),
    roughness: mapType === 'autobahn_a9' ? 0.35 : 0.82,
    metalness: mapType === 'autobahn_a9' ? 0.15 : 0.05
  });

  const isPbfMap = mapType === 'stadt_zentrum' || mapType === 'landstrasse_b2' || mapType === 'autobahn_a9' || mapType === 'training_circuit';
  const isStadtZentrum = isPbfMap;
  const grassLength = mapType === 'sa_hinh_fahrschule' ? 1500 : (isPbfMap ? 8000 : config.roadLength);
  const grassWidth = isPbfMap ? 4000 : config.grassWidth;
  const grassMat = createPbrGrassMaterial({
    repeatX: Math.round(grassWidth / 4.0),
    repeatZ: Math.round(grassLength / 4.0),
    // Autobahn: tint xanh đồng cỏ ấm (giống ảnh chụp NRW) đỡ xỉn tối; map khác giữ màu gốc
    color: mapType === 'autobahn_a9' ? 0xa8c884 : 0xffffff
  });

  const swMat = createSidewalkMaterial({
    repeatX: 2,
    repeatZ: Math.round(config.roadLength / 2.0)
  });
  const colliders = [];
  const saHinhRamps = []; // Dốc đề-pa sa hình (hill-start) — DrivingSimulation đọc qua refs._ramps
  const scenery = new THREE.Group();

  // 1. Mặt đường với kênh uv2 cho Ambient Occlusion chân thực (cho Sa hình hoặc synthetic test maps)
  if (!isPbfMap) {
    const roadGeo = new THREE.PlaneGeometry(config.roadWidth, config.roadLength);
    ensureUV2(roadGeo);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = config.roadZ;
    road.receiveShadow = true;
    scenery.add(road);
  }

  // 2. Mặt cỏ với kênh uv2 cho Ambient Occlusion chân thực (bao phủ rộng lớn khu vực OSM PBF 4x4 km)
  const isAutobahnGrass = mapType === 'autobahn_a9' || mapType === 'autobahn_a' || mapType === 'AUTOBAHN' || (mapType || '').toLowerCase().includes('autobahn');
  const grassL = isAutobahnGrass ? 14000 : (isPbfMap ? 4000 : (mapType === 'sa_hinh_fahrschule' ? 1500 : config.roadLength));
  const grassW = isAutobahnGrass ? 14000 : (isPbfMap ? 4000 : config.grassWidth);
  const grassZ = isPbfMap ? 0 : config.roadZ;
  const grassGeo = new THREE.PlaneGeometry(grassW, grassL);
  ensureUV2(grassGeo);
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.name = 'PBF_GroundPlane'; // đặt tên để Blender-GLB overlay KHÔNG ẩn mặt đất
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.01, grassZ);
  grass.receiveShadow = true;
  scenery.add(grass);

  if (isPbfMap) {
    scene.background = new THREE.Color(0x87ceeb);
    // Fog kết thúc trước camera.far (1500m) để nhà cửa tan dần vào sương thay vì bị cắt cụt đột ngột
    scene.fog = new THREE.Fog(0xbcd7ea, 380, 1380);
  } else {
    if (!scene.getObjectByName('physicalSky')) {
      scene.background = new THREE.Color(config.skyColor || 0x38bdf8);
    }
    scene.fog = new THREE.FogExp2(0x8faec2, 0.0007);
  }

  // ── ĐẶC THÙ MỖI MAP ───────────────────────────────────────────────
  if (!isPbfMap && config.hasAutobahn) {
    // AUTOBAHN SYNTHETIC: Dải phân cách với Hộ lan kim loại đôi (Doppelte Leitplanke)
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });

    // Dải phân cách giữa với cỏ/sỏi (Mittelstreifen)
    const medianStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, config.roadLength),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
    );
    medianStrip.rotation.x = -Math.PI / 2;
    medianStrip.position.set(0, 0.012, config.roadZ);
    scenery.add(medianStrip);

    // Cột chữ I đỡ hộ lan mỗi 6m
    for (let pz = config.roadZ + config.roadLength / 2; pz >= config.roadZ - config.roadLength / 2; pz -= 6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), postMat);
      post.position.set(0, 0.38, pz);
      scenery.add(post);
    }

    // 2 thanh lượn sóng thép W-Beam kép ở 2 bên dải phân cách
    [-0.55, 0.55].forEach(rx => {
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, config.roadLength), guardrailMat);
      railTop.position.set(rx, 0.55, config.roadZ);
      railTop.castShadow = true;
      scenery.add(railTop);
    });

    // Hộ lan lề ngoài cùng hai bên (Seitenleitplanke)
    [-17.8, 17.8].forEach(xRail => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, config.roadLength), guardrailMat);
      sideRail.position.set(xRail, 0.55, config.roadZ);
      sideRail.castShadow = true;
      scenery.add(sideRail);
    });

    // Vạch xương cá Sperrfläche tại điểm nhập cao tốc (như ảnh auffahren_autobahn1.jpg)
    const hatchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let hz = 20; hz >= -120; hz -= 6) {
      const hatch = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.4), hatchMat);
      hatch.rotation.x = -Math.PI / 2;
      hatch.rotation.z = Math.PI / 4;
      hatch.position.set(9.0, 0.025, hz);
      scenery.add(hatch);
    }

    // ── VẠCH KẺ ĐƯỜNG AUTOBAHN STVO (LANE MARKINGS) ──
    // 1. Vạch liền mép dải phân cách giữa (x = ±1.4) và mép làn dừng khẩn cấp Standstreifen (x = ±14.5)
    const solidLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-14.5, -1.4, 1.4, 14.5].forEach(lx => {
      const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(0.28, config.roadLength), solidLineMat);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(lx, 0.018, config.roadZ);
      edgeLine.receiveShadow = true;
      scenery.add(edgeLine);
    });

    // 2. Vạch đứt phân làn StVO Leitlinie (chu kỳ 12m: vạch trắng 6m, ngắt 6m)
    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 16;
    dashCanvas.height = 64;
    const dCtx = dashCanvas.getContext('2d');
    if (dCtx) {
      dCtx.clearRect(0, 0, 16, 64);
      dCtx.fillStyle = '#ffffff';
      dCtx.fillRect(0, 0, 16, 32);
    }
    const dashTex = new THREE.CanvasTexture(dashCanvas);
    dashTex.wrapS = THREE.RepeatWrapping;
    dashTex.wrapT = THREE.RepeatWrapping;
    dashTex.repeat.set(1, Math.round(config.roadLength / 12));
    const dashLineMat = new THREE.MeshBasicMaterial({
      map: dashTex,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false
    });

    [-10.0, -5.5, 5.5, 10.0].forEach(dx => {
      const dashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, config.roadLength), dashLineMat);
      dashMesh.rotation.x = -Math.PI / 2;
      dashMesh.position.set(dx, 0.02, config.roadZ);
      dashMesh.receiveShadow = true;
      scenery.add(dashMesh);
    });
  }

  if (!isPbfMap && mapType === 'landstrasse_b2') {
    // LANDSTRAßE: Cột mốc Leitpfosten phản quang Đức 2 bên đường
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const capMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });

    for (let z = config.roadZ; z > config.roadZ - config.roadLength; z -= 35) {
      [-4.5, 4.5].forEach(x => {
        const postGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.08), postMat);
        body.position.y = 0.5;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.09), capMat);
        cap.position.y = 0.9;
        const ref = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.25), reflectorMat);
        ref.position.set(0, 0.65, 0.05);

        postGroup.add(body); postGroup.add(cap); postGroup.add(ref);
        postGroup.position.set(x, 0, z);
        scenery.add(postGroup);
      });
    }
  }

  // ── BIỂN BÁO & CẢNH QUAN ──────────────────────────────────────────

  if (!isPbfMap && config.hasAutobahn) {
    [
      { z: -250, main: 'München · Nürnberg · Berlin', sub: 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot' },
      { z: -1000, main: 'Ausfahrt 1000m · Raststätte Frankenwald', sub: 'Tankstelle · WC · Restaurant 24h' },
      { z: -2000, main: 'Rettungsgasse bilden!', sub: 'Bei Stau: Gasse zwischen linker und mittlerer Spur' },
      { z: -3200, main: 'Ausfahrt 500m · Gewerbegebiet Süd', sub: 'Rechts einordnen · Blinker rechts' },
      { z: -4500, main: 'Autobahnende 500m', sub: 'Geschwindigkeit auf 80 km/h reduzieren' }
    ].forEach(g => {
      scenery.add(createAutobahnGantry(g.z, g.main, g.sub));
    });
  }

  const crossStreetZ = (!isPbfMap && mapType === 'stadt_zentrum') ? [-200, -510, -880] : [];
  if (!isPbfMap && config.hasIntersections && mapType !== 'stadt_zentrum') {
    for (let zVal = -80; zVal >= -config.roadLength + 200; zVal -= config.intersectionSpacing) {
      crossStreetZ.push(zVal);
    }
  }

  if (!isPbfMap && mapType !== 'stadt_zentrum') {
    crossStreetZ.forEach((zCross, idx) => {
      // Ngã tư
      const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(120, 16), roadMat);
      crossRoad.rotation.x = -Math.PI / 2;
      crossRoad.position.set(0, 0.025, zCross);
      scenery.add(crossRoad);

      // Cắm biển báo StVO chuẩn sắc nét
      const speedSign = makeGermanStVOSign('SPEED_LIMIT', config.maxSpeedLimit);
      speedSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 15);
      scenery.add(speedSign);

      if (idx % 2 === 0) {
        const stopSign = makeGermanStVOSign('STOP_SIGN');
        stopSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 8);
        scenery.add(stopSign);
      } else {
        const yieldSign = makeGermanStVOSign('YIELD');
        yieldSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 8);
        scenery.add(yieldSign);
      }
    });
  }

  // Cây cối & Tòa nhà cho các bản đồ tổng hợp Synthetic
  if (!isPbfMap) {
    const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
    const leafM1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    const buildingPalette = [0xf1f5f9, 0xe2e8f0, 0xcbd5e1, 0x94a3b8, 0xd1d5db];
    const bMats = buildingPalette.map((col, idx) => new THREE.MeshStandardMaterial({
      map: createBuildingFacadeTexture(col, idx),
      roughness: 0.5, metalness: 0.1
    }));

    const STEP = 12;
    const numSteps = Math.floor(config.roadLength / STEP);
    for (let i = 0; i < numSteps; i++) {
      const z = config.roadZ - i * STEP;
      const isAtIntersection = crossStreetZ.some(cz => Math.abs(cz - z) < 14);

      if (Math.random() < config.treeDensity && !isAtIntersection) {
        const treeXOffset = config.roadWidth / 2 + (mapType === 'landstrasse_b2' ? 2.0 : 4.0);
        [-treeXOffset, treeXOffset].forEach(x => {
          const g = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkM);
          trunk.position.y = 1.5; trunk.castShadow = true;
          const f1 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), leafM1);
          f1.position.y = 3.8; f1.castShadow = true;
          const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 6), leafM2);
          f2.position.set(0.3, 4.5, -0.2); f2.castShadow = true;
          g.add(trunk); g.add(f1); g.add(f2);
          g.position.set(x, 0, z);
          scenery.add(g);
        });
      }

      if (Math.random() < config.buildingDensity && !isAtIntersection) {
        const h = config.buildingHeight + (i % 5) * 4;
        const bXOffset = config.roadWidth / 2 + 10;
        [-bXOffset, bXOffset].forEach(x => {
          const b = new THREE.Mesh(new THREE.BoxGeometry(18, h, 24), bMats[i % bMats.length]);
          b.position.set(x, h / 2, z);
          b.castShadow = true; b.receiveShadow = true;
          scenery.add(b);
        });
      }
    }
  }

  // 🏙️ PHÁT TRIỂN BẢN ĐỒ ĐỨC CHUẨN STVO TỪ PBF (STADT, LANDSTRASSE, AUTOBAHN)
  if (isPbfMap) {
    if (mapType === 'autobahn_a9' || mapType === 'autobahn' || mapType === 'training_circuit' || (mapType || '').toLowerCase().includes('training')) {
      buildAutobahnDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config);
    } else if (mapType === 'landstrasse_b2' || mapType === 'land') {
      buildLandstrasseDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config);
    } else {
      buildBerlinMitteDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config, mapType);
    }

    // 🌲 Map Landstrasse: đồ đường OSM nằm lệch xa gốc (bounds ±6km) trong khi mặt cỏ 4x4km
    // đặt tại (0,0) → người chơi đứng giữa "tuyệt địa" trắng toát. Co giãn + dịch mặt cỏ
    // theo bounds thật của đồ đường sau khi district đã nạp xong.
    const pbfBounds = scene.userData.roadGraphData?.metadata?.bounds;
    if (pbfBounds && Number.isFinite(pbfBounds.minX) && Number.isFinite(pbfBounds.minZ)) {
      const spanX = pbfBounds.maxX - pbfBounds.minX;
      const spanZ = pbfBounds.maxZ - pbfBounds.minZ;
      if (spanX > 4200 || spanZ > 4200) {
        const gw = spanX + 3000;
        const gl = spanZ + 3000;
        grass.geometry.dispose();
        grass.geometry = new THREE.PlaneGeometry(gw, gl);
        grass.position.set((pbfBounds.minX + pbfBounds.maxX) / 2, -0.01, (pbfBounds.minZ + pbfBounds.maxZ) / 2);
        grass.material = createPbrGrassMaterial({
          repeatX: Math.max(1, Math.round(gw / 4.0)),
          repeatZ: Math.max(1, Math.round(gl / 4.0)),
          color: mapType === 'autobahn_a9' ? 0xa8c884 : 0xffffff
        });
      }
    }
  }

  // 🏎️ KHU SA HÌNH HỌC LÁI XE TỔNG HỢP 3D FAHRSCHULE (SÂN BÃI RỘNG LỚN ĐA MÔ HÌNH - VERKEHRSÜBUNGSPLATZ)
  if (mapType === 'sa_hinh_fahrschule') {
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const asphaltPadMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.8 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    // ── 0. HÀNG RÀO AN TOÀN BAO QUANH CHU VI SÂN BÃI (Perimeter Fencing) ──
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });

    // Cổng vào có barie & bốt kiểm soát tại Cạnh Bắc
    scenery.add(createEntranceGate(0, 243));

    // Cạnh Bắc (Z = +245): chừa cổng vào tại X: -10 đến +10
    for (let fx = -116; fx <= 116; fx += 5) {
      if (Math.abs(fx) > 9) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, 245);
        scenery.add(post);
      }
    }
    const railNorthL = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthL.position.set(-63, 0.85, 245);
    scenery.add(railNorthL);
    const railNorthR = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthR.position.set(63, 0.85, 245);
    scenery.add(railNorthR);

    // Cạnh Nam (Z = -265)
    for (let fx = -116; fx <= 116; fx += 5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
      post.position.set(fx, 0.7, -265);
      scenery.add(post);
    }
    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(232, 0.25, 0.1), railMat);
    railSouth.position.set(0, 0.85, -265);
    scenery.add(railSouth);

    // Cạnh Tây (X = -118) & Cạnh Đông (X = +118)
    for (let fz = -265; fz <= 245; fz += 6) {
      [-118, 118].forEach(fx => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, fz);
        scenery.add(post);
      });
    }
    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railWest.position.set(-118, 0.85, -10);
    scenery.add(railWest);
    const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railEast.position.set(118, 0.85, -10);
    scenery.add(railEast);

    // Đăng ký Collider Hàng Rào Chu Vi Sân Bãi
    colliders.push({
      id: 'perimeter_fences',
      type: 'fence',
      shape: 'boundary',
      minX: -116.5,
      maxX: 116.5,
      minZ: -263.5,
      maxZ: 243.5,
      gateMinX: -9.5,
      gateMaxX: 9.5,
      penalty: 25,
      messageVi: 'Đâm hàng rào an toàn ranh giới sân bãi!',
      messageDe: 'Kollision mit der Platzbegrenzung! (-25đ)'
    });

    // ── CỘT ĐÈN CAO ÁP SÂN VẬN ĐỘNG / SÂN TẬP (Stadium Floodlights) ──
    const floodlightPositions = [
      { x: -112, z: 230 }, { x: 112, z: 230 },
      { x: -112, z: 30 }, { x: 112, z: 30 },
      { x: -112, z: -100 }, { x: 112, z: -100 },
      { x: -112, z: -250 }, { x: 112, z: -250 }
    ];
    floodlightPositions.forEach((p, idx) => {
      scenery.add(createFloodlightTower(p.x, p.z));
      colliders.push({
        id: `floodlight_${idx}`,
        type: 'pole',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.85,
        penalty: 25,
        messageVi: 'Đâm cột đèn chiếu sáng sân tập!',
        messageDe: 'Kollision mit Flutlichtmast! (-25đ)'
      });
    });

    // ── TÒA NHÀ TRUNG TÂM ĐIỀU HÀNH & SÁT HẠCH LÁI XE (Prüfungszentrum) ──
    scenery.add(createControlCenterBuilding(82, 10, 22, 14, 10));
    colliders.push({
      id: 'building_control_center',
      type: 'building',
      shape: 'box',
      x: 82,
      z: 10,
      minX: 82 - 11.5,
      maxX: 82 + 11.5,
      minZ: 10 - 7.5,
      maxZ: 10 + 7.5,
      penalty: 30,
      messageVi: 'Va chạm tòa nhà trung tâm điều hành sát hạch!',
      messageDe: 'Kollision mit Prüfungszentrum! (-30đ)'
    });

    // Cây xanh cảnh quan xung quanh sân
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const addDecoTree = (tx, tz) => {
      const tg = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.5, 7), treeTrunkMat);
      tr.position.y = 1.75;
      const fol = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), treeLeavesMat);
      fol.position.y = 4.2;
      tg.add(tr); tg.add(fol);
      tg.position.set(tx, 0, tz);
      scenery.add(tg);
    };
    [-126, 126].forEach(tx => {
      for (let tz = -250; tz <= 230; tz += 35) {
        addDecoTree(tx, tz);
      }
    });

    // Cảnh quan phía sau vạch xuất phát (Z = +20 đến +240) để gương chiếu hậu soi thấy mặt đường và cây cối
    const rearDecoStep = isPerformance ? 44 : 22;
    for (let bz = 25; bz <= 235; bz += rearDecoStep) {
      [-12.5, 12.5].forEach(tx => {
        addDecoTree(tx, bz);
      });
      [-10.2, 10.2].forEach(px => {
        const pole = createCornerPole(px, bz, 0.9);
        scenery.add(pole);
        colliders.push({
          id: `pole_rear_${px}_${bz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: bz,
          radius: 0.28,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới lề đường phía sau!',
          messageDe: 'Begrenzungsstange berührt! (-15đ)'
        });
      });
    }

    // ── 1. TRỤC ĐƯỜNG CHÍNH BẮC - NAM (Central Avenue: rộng 14m) ──
    const dashLength = 3.0;
    const dashGap = 3.0;
    for (let z = 240; z > -232; z -= (dashLength + dashGap)) {
      if (z > -72 || z < -88) { // Bỏ trống tại ngã tư Z = -80
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, dashLength), whiteLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.02, z);
        scenery.add(dash);
      }
    }

    // Vạch viền vàng hai bên trục chính
    [-6.8, 6.8].forEach(xBorder => {
      const borderLineN = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 314), yellowLineMat);
      borderLineN.rotation.x = -Math.PI / 2;
      borderLineN.position.set(xBorder, 0.02, 85);
      scenery.add(borderLineN);

      const borderLineS = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 144), yellowLineMat);
      borderLineS.rotation.x = -Math.PI / 2;
      borderLineS.position.set(xBorder, 0.02, -160);
      scenery.add(borderLineS);
    });

    // Mũi tên sơn dẫn hướng trên trục chính
    scenery.add(createRoadArrow(3.5, 45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, 12, 0, 'turn_right'));
    scenery.add(createRoadArrow(-3.5, 12, 0, 'turn_left'));
    scenery.add(createRoadArrow(3.5, -45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, -135, 0, 'straight'));

    // ── 2. TRỤC ĐƯỜNG NGANG ĐÔNG - TÂY (Cross Avenue: Z = -80, rộng 14m, từ X = -95 đến +95) ──
    const crossRoadPlane = new THREE.Mesh(new THREE.PlaneGeometry(190, 14), branchMat);
    crossRoadPlane.rotation.x = -Math.PI / 2;
    crossRoadPlane.position.set(0, 0.01, -80);
    scenery.add(crossRoadPlane);

    // Vạch nét đứt đường ngang
    for (let cx = -90; cx <= 90; cx += 6) {
      if (Math.abs(cx) > 8) {
        const cDash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.18), whiteLineMat);
        cDash.rotation.x = -Math.PI / 2;
        cDash.position.set(cx, 0.02, -80);
        scenery.add(cDash);
      }
    }

    // Vạch vàng mép đường ngang
    [-73.2, -86.8].forEach(zy => {
      [-50, 50].forEach(cx => {
        const hBorder = new THREE.Mesh(new THREE.PlaneGeometry(84, 0.2), yellowLineMat);
        hBorder.rotation.x = -Math.PI / 2;
        hBorder.position.set(cx, 0.02, zy);
        scenery.add(hBorder);
      });
    });

    // Mũi tên sơn đường ngang
    scenery.add(createRoadArrow(-25, -80, -Math.PI / 2, 'straight'));
    scenery.add(createRoadArrow(25, -80, Math.PI / 2, 'straight'));

    // ── VẠCH XUẤT PHÁT & BANNER CHÀO MỪNG (Z = 0) ──
    const startLineMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.6), whiteLineMat);
    startLineMesh.rotation.x = -Math.PI / 2;
    startLineMesh.position.set(3.5, 0.03, 0);
    scenery.add(startLineMesh);

    scenery.add(createSaHinhBanner('KHU SA HÌNH LÁI XE TỔNG HỢP 3D', 'VERKEHRSÜBUNGSPLATZ - SÂN BÃI ĐA MÔ HÌNH LUYỆN TẬP', 0, 15, 22));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1: LÁI ZICZAC QUA CỌC TIÊU (SLALOM / SLALOMPARCOURS) ──────
    // Nằm ở cánh Tây Bắc (X: -30 đến -60, Z: 10 đến -60)
    // ══════════════════════════════════════════════════════════════════════
    const slalomPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 76), asphaltPadMat);
    slalomPad.rotation.x = -Math.PI / 2;
    slalomPad.position.set(-45, 0.015, -25);
    scenery.add(slalomPad);

    // Đường nối phía Bắc từ trục chính sang khu ziczac
    const slalomConnector = new THREE.Mesh(new THREE.PlaneGeometry(35, 10), branchMat);
    slalomConnector.rotation.x = -Math.PI / 2;
    slalomConnector.position.set(-22, 0.012, 5);
    scenery.add(slalomConnector);
    scenery.add(createRoadArrow(-18, 5, -Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const slalomExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    slalomExitConnector.rotation.x = -Math.PI / 2;
    slalomExitConnector.position.set(-45, 0.012, -69);
    scenery.add(slalomExitConnector);
    scenery.add(createRoadArrow(-45, -70, 0, 'turn_right'));

    scenery.add(createTotemSign('1. LÁI ZICZAC (SLALOM)', 'VẬN TỐC < 20 KM/H - UỐN LƯỢN QUA CỌC TIÊU', -30, 10, 0, '#0284c7'));

    const slalomPositions = [
      { x: -45, z: 2 },
      { x: -47.5, z: -8 },
      { x: -42.5, z: -18 },
      { x: -47.5, z: -28 },
      { x: -42.5, z: -38 },
      { x: -47.5, z: -48 },
      { x: -42.5, z: -58 },
      { x: -45, z: -68 }
    ];
    slalomPositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 1.25);
      scenery.add(cone);
      colliders.push({
        id: `cone_slalom_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.45,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm/làm đổ cọc tiêu ziczac Slalom!',
        messageDe: 'Leitkegel im Slalomparcours umgeworfen! (-10đ)'
      });
    });

    // Cọc rào viền mép bãi Slalom
    for (let sz = 10; sz >= -65; sz -= 15) {
      [-56, -34].forEach(px => {
        const pole = createCornerPole(px, sz, 1.0);
        scenery.add(pole);
        colliders.push({
          id: `pole_slalom_${px}_${sz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: sz,
          radius: 0.32,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc rào ranh giới bãi Slalom!',
          messageDe: 'Begrenzungsstange Slalom berührt! (-15đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1.5: DỐC ĐỀ-PA 10% (ANFAHREN AM BERG - Grundfahraufgabe) ──
    // Nằm ngay trên trục chính sau điểm xuất phát: xe leo dốc carZ 7→19, đỉnh
    // dốc 19→31, đổ xuống 31→43. Đăng ký vào `ramps` để vật lý leo dốc & phát
    // hiện tuột dốc (hillRolledBack — lỗi trượt bài khi xe lùi > 30cm) hoạt động.
    // LƯU Ý căn pha: physics đọc distFromStart = (carZ + centerZ) + length/2 với
    // centerZ = -25 → dốc vật lý trải carZ 7..43. Mesh createHillRamp vẽ từ gốc
    // group về phía -Z → đặt mesh tại worldZ = -7 để khớp chính xác sườn dốc.
    // ══════════════════════════════════════════════════════════════════════
    const hillRamp = createHillRamp(0, 0, 8.0, 36.0, 1.1);
    hillRamp.position.set(0, 0, -7);
    scenery.add(hillRamp);
    saHinhRamps.push({ centerX: 0, centerZ: -25, width: 8.0, length: 36.0, maxHeight: 1.1 });

    // Vạch đỏ Haltelinie giữa sườn dốc (điểm dừng đề-pa chuẩn, carZ ≈ 12)
    const hillHaltLine = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLine.rotation.x = -Math.PI / 2 + Math.atan2(1.1, 12.0);
    hillHaltLine.position.set(0, 0.5, -12.0);
    scenery.add(hillHaltLine);

    // Vạch đỏ thứ hai trên đỉnh dốc cho bài rèn cao hơn (carZ ≈ 25)
    const hillHaltLineTop = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLineTop.rotation.x = -Math.PI / 2;
    hillHaltLineTop.position.set(0, 1.12, -25.0);
    scenery.add(hillHaltLineTop);

    scenery.add(createTotemSign('2. ĐỀ-PA NGANG DỐC (ANFAHREN AM BERG)', 'DỪNG TRƯỚC VẠCH ĐỎ TRÊN DỐC - KÉO PHANH TAY - KHỞI HÀNH KHÔNG ĐỂ XE TUỘT LÙI', 13, -4, 0, '#dc2626'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 2: GHÉP XE SONG SONG (LÄNGSPARKEN) ────────────────────────
    // Nằm ở cánh Đông Bắc (X: 30 đến 60, Z: 10 đến -55)
    // ══════════════════════════════════════════════════════════════════════
    const parallelPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 70), asphaltPadMat);
    parallelPad.rotation.x = -Math.PI / 2;
    parallelPad.position.set(45, 0.015, -25);
    scenery.add(parallelPad);

    // Đường nối phía Bắc từ trục chính sang khu ghép song song
    const parallelConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), branchMat);
    parallelConnector.rotation.x = -Math.PI / 2;
    parallelConnector.position.set(20, 0.012, 5);
    scenery.add(parallelConnector);
    scenery.add(createRoadArrow(18, 5, Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const parallelExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    parallelExitConnector.rotation.x = -Math.PI / 2;
    parallelExitConnector.position.set(45, 0.012, -67);
    scenery.add(parallelExitConnector);
    scenery.add(createRoadArrow(45, -68, 0, 'turn_right'));

    // Vỉa hè bê tông mô phỏng lề đường
    const parallelSidewalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 68), sidewalkMat);
    parallelSidewalk.position.set(55, 0.08, -25);
    scenery.add(parallelSidewalk);

    // Vỉa đá ba-toa lề
    const curbP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 68), curbMat);
    curbP.position.set(53.1, 0.1, -25);
    scenery.add(curbP);

    scenery.add(createTotemSign('2. GHÉP XE SONG SONG', 'XI-NHAN PHẢI -> LÙI SỐ R VÀO Ô GIỮA 2 XE', 32, 10, 0, '#2563eb'));

    const pSign1 = makeGermanStVOSign('PARKING');
    pSign1.position.set(52, 0, 8);
    scenery.add(pSign1);

    // 2 Xe ô tô mô hình (Parked Dummy Cars) với chi tiết cao cấp
    const frontDummyCar = createParkedDummyCar(49.5, -10, 0x2563eb, 0);
    scenery.add(frontDummyCar);
    colliders.push({
      id: 'dummy_car_front',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -10,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -10 - 2.35,
      maxZ: -10 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía trước!',
      messageDe: 'Kollision mit vorderem geparkten Fahrzeug! (-30đ)'
    });

    const rearDummyCar = createParkedDummyCar(49.5, -40, 0xdc2626, 0);
    scenery.add(rearDummyCar);
    colliders.push({
      id: 'dummy_car_rear',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -40,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -40 - 2.35,
      maxZ: -40 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía sau!',
      messageDe: 'Kollision mit hinterem geparkten Fahrzeug! (-30đ)'
    });

    // Ô đỗ xe chuẩn StVO ở giữa 2 xe dummy
    scenery.add(createParkingMarkings(49.5, -25, 2.7, 7.2, true));

    // Cọc tiêu căn lề đuôi xe
    const parallelConePositions = [
      { x: 47.8, z: -17 }, { x: 51.2, z: -17 },
      { x: 47.8, z: -33 }, { x: 51.2, z: -33 }
    ];
    parallelConePositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 0.95);
      scenery.add(cone);
      colliders.push({
        id: `cone_park_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu căn chuồng ghép song song!',
        messageDe: 'Leitkegel beim Längsparken berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 3: GHÉP XE VUÔNG GÓC 90° (QUERPARKEN) ─────────────────────
    // Nằm ở cánh Đông Nam (X: 30 đến 65, Z: -95 đến -155)
    // ══════════════════════════════════════════════════════════════════════
    const querPad = new THREE.Mesh(new THREE.PlaneGeometry(28, 70), asphaltPadMat);
    querPad.rotation.x = -Math.PI / 2;
    querPad.position.set(48, 0.015, -125);
    scenery.add(querPad);

    // Đường nối phía Bắc vào khu ghép vuông góc
    const querNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), branchMat);
    querNorthConnector.rotation.x = -Math.PI / 2;
    querNorthConnector.position.set(48, 0.012, -88);
    scenery.add(querNorthConnector);

    // Đường nối phía Nam dẫn ra Trục chính
    const querExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(42, 12), branchMat);
    querExitConnector.rotation.x = -Math.PI / 2;
    querExitConnector.position.set(27, 0.012, -162);
    scenery.add(querExitConnector);
    scenery.add(createRoadArrow(20, -162, -Math.PI / 2, 'straight'));

    scenery.add(createTotemSign('3. GHÉP XE VUÔNG GÓC 90°', 'TIẾN QUA CỬA CHUỒNG -> LÙI SỐ R VUÔNG GÓC', 32, -88, 0, '#7c3aed'));

    const pSign2 = makeGermanStVOSign('PARKING');
    pSign2.position.set(38, 0, -96);
    scenery.add(pSign2);

    // 4 Chuồng đỗ xe vuông góc liên tiếp
    [-106, -118, -130, -142].forEach(stallZ => {
      scenery.add(createParkingMarkings(54, stallZ, 3.2, 6.2, false));
      // Cọc tiêu cửa chuồng và đáy chuồng
      [
        { x: 52.2, z: stallZ + 3.0 },
        { x: 55.8, z: stallZ + 3.0 },
        { x: 52.2, z: stallZ - 3.0 },
        { x: 55.8, z: stallZ - 3.0 }
      ].forEach(p => {
        const pole = createCornerPole(p.x, p.z, 1.1);
        scenery.add(pole);
        colliders.push({
          id: `pole_quer_${p.x}_${p.z}`,
          type: 'pole',
          shape: 'circle',
          x: p.x,
          z: p.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc giới hạn chuồng đỗ vuông góc 90°!',
          messageDe: 'Begrenzungsstange Querparken berührt! (-15đ)'
        });
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 4: VÒNG XUYẾN ĐẢO GIAO THÔNG (KREISVERKEHR) ───────────────
    // Nằm ở cánh Tây Nam (Tâm tại X: -55, Z: -125)
    // ══════════════════════════════════════════════════════════════════════
    const roundaboutGroup = new THREE.Group();
    // Đảo cỏ tròn trung tâm (bán kính 11m)
    const islandGeo = new THREE.CylinderGeometry(11, 11, 0.35, 32);
    const islandGrass = new THREE.Mesh(islandGeo, new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
    islandGrass.position.y = 0.17;
    roundaboutGroup.add(islandGrass);

    // Vỉa ba-toa bao quanh đảo tròn
    const islandCurb = new THREE.Mesh(new THREE.RingGeometry(10.8, 11.4, 32), curbMat);
    islandCurb.rotation.x = -Math.PI / 2;
    islandCurb.position.y = 0.36;
    roundaboutGroup.add(islandCurb);

    // Cây xanh cảnh quan ở tâm đảo
    const centerTreeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4.0, 8), treeTrunkMat);
    centerTreeTrunk.position.y = 2.2;
    const centerTreeFol = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), treeLeavesMat);
    centerTreeFol.position.y = 5.0;
    roundaboutGroup.add(centerTreeTrunk);
    roundaboutGroup.add(centerTreeFol);

    // Lòng đường vòng xuyến (Vành khăn nhựa asphalt: bán kính trong 11m, ngoài 21m)
    const ringRoad = new THREE.Mesh(new THREE.RingGeometry(11.2, 21.0, 36), branchMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.y = 0.015;
    roundaboutGroup.add(ringRoad);

    // Vạch sơn nét đứt phân 2 làn trong vòng xuyến (bán kính 16m)
    const numRingDashes = 18;
    for (let ri = 0; ri < numRingDashes; ri++) {
      const angle = (ri / numRingDashes) * Math.PI * 2;
      const rDash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.8), whiteLineMat);
      rDash.rotation.x = -Math.PI / 2;
      rDash.rotation.z = -angle;
      rDash.position.set(Math.cos(angle) * 16, 0.022, Math.sin(angle) * 16);
      roundaboutGroup.add(rDash);
    }

    roundaboutGroup.position.set(-55, 0, -125);
    scenery.add(roundaboutGroup);

    // Đăng ký Collider Đảo Vòng Xuyến
    colliders.push({
      id: 'roundabout_island',
      type: 'curb',
      shape: 'circle',
      x: -55,
      z: -125,
      radius: 11.2,
      penalty: 15,
      messageVi: 'Đè lên đảo cỏ vòng xuyến giao thông!',
      messageDe: 'Verkehrsinsel im Kreisverkehr überfahren! (-15đ)'
    });

    // Đường nối phía Bắc từ Cross Ave vào vòng xuyến
    const rbNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 20), branchMat);
    rbNorthConnector.rotation.x = -Math.PI / 2;
    rbNorthConnector.position.set(-55, 0.012, -96);
    scenery.add(rbNorthConnector);

    // Đường nối phía Đông từ Trục chính sang vòng xuyến
    const rbEastConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 12), branchMat);
    rbEastConnector.rotation.x = -Math.PI / 2;
    rbEastConnector.position.set(-20, 0.012, -125);
    scenery.add(rbEastConnector);

    // Đường nối phía Nam từ vòng xuyến sang khu cua chữ S
    const rbSouthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 26), branchMat);
    rbSouthConnector.rotation.x = -Math.PI / 2;
    rbSouthConnector.position.set(-55, 0.012, -156);
    scenery.add(rbSouthConnector);

    // Vạch răng cá mập (Haifischzähne) trước các cửa vào vòng xuyến
    scenery.add(createSharkTeethYield(-55, -104, 5, 1.1, 0));
    scenery.add(createSharkTeethYield(-34, -125, 5, 1.1, -Math.PI / 2));

    // Biển báo vòng xuyến StVO (Zeichen 215) & Nhường đường (Zeichen 205) tại các cửa vào
    const rbSignEast = makeGermanStVOSign('ROUNDABOUT');
    rbSignEast.position.set(-32, 0, -125);
    scenery.add(rbSignEast);

    const rbSignNorth = makeGermanStVOSign('ROUNDABOUT');
    rbSignNorth.position.set(-55, 0, -102);
    scenery.add(rbSignNorth);

    scenery.add(createTotemSign('4. VÒNG XUYẾN (KREISVERKEHR)', 'NHƯỜNG XE TRONG ĐẢO - XI-NHAN PHẢI KHI RA', -32, -88, 0, '#059669'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 5: GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU (KREUZUNG 4-WAY) ──────────
    // Giao điểm trung tâm tại X: 0, Z: -80
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createTotemSign('5. GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU', 'DỪNG TRƯỚC VẠCH ĐÈN ĐỎ - ƯU TIÊN BÊN PHẢI', 12, -65, 0, '#d97706'));

    // 4 Vạch người đi bộ qua đường (Zebrastreifen)
    scenery.add(createZebraCrosswalk(0, -68, 12, 4.5)); // Nhánh Bắc
    scenery.add(createZebraCrosswalk(0, -92, 12, 4.5)); // Nhánh Nam
    // Nhánh Đông & Tây
    const zebraEast = createZebraCrosswalk(10, -80, 12, 4.5);
    zebraEast.rotation.y = Math.PI / 2;
    scenery.add(zebraEast);
    const zebraWest = createZebraCrosswalk(-10, -80, 12, 4.5);
    zebraWest.rotation.y = Math.PI / 2;
    scenery.add(zebraWest);

    // 4 Vạch dừng màu đỏ (Haltelinie)
    const stopLineNorth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineNorth.rotation.x = -Math.PI / 2;
    stopLineNorth.position.set(0, 0.03, -65);
    scenery.add(stopLineNorth);

    const stopLineSouth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineSouth.rotation.x = -Math.PI / 2;
    stopLineSouth.position.set(0, 0.03, -95);
    scenery.add(stopLineSouth);

    // 4 Cột đèn tín hiệu giao thông (Traffic Lights) tại 4 góc ngã tư
    const tlNE = makeTrafficLight(true);
    tlNE.position.set(8.2, 0, -66);
    scenery.add(tlNE);

    const tlNW = makeTrafficLight(true);
    tlNW.position.set(-8.2, 0, -66);
    tlNW.rotation.y = Math.PI;
    scenery.add(tlNW);

    const tlSE = makeTrafficLight(true);
    tlSE.position.set(8.2, 0, -94);
    scenery.add(tlSE);

    const tlSW = makeTrafficLight(true);
    tlSW.position.set(-8.2, 0, -94);
    tlSW.rotation.y = Math.PI;
    scenery.add(tlSW);

    // Biển cảnh báo ngã tư / Ưu tiên bên phải
    const dangerSign1 = makeGermanStVOSign('DANGER');
    dangerSign1.position.set(8.5, 0, -50);
    scenery.add(dangerSign1);

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 6: ĐƯỜNG QUANH CO CHỮ S (S-KURVE) ─────────────────────────
    // Nằm ở khu vực phía Nam (X: -30 đến -70, Z: -170 đến -230)
    // ══════════════════════════════════════════════════════════════════════
    const scurvePad = new THREE.Mesh(new THREE.PlaneGeometry(42, 65), asphaltPadMat);
    scurvePad.rotation.x = -Math.PI / 2;
    scurvePad.position.set(-50, 0.015, -200);
    scenery.add(scurvePad);

    // Đường nối phía Nam dẫn từ cua chữ S về Trục chính & Cổng đích
    const scurveExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(36, 12), branchMat);
    scurveExitConnector.rotation.x = -Math.PI / 2;
    scurveExitConnector.position.set(-23, 0.012, -230);
    scenery.add(scurveExitConnector);
    scenery.add(createRoadArrow(-15, -230, Math.PI / 2, 'straight'));

    // Hàng rào lốp an toàn tại góc cua gắt ngoài cùng
    scenery.add(createTireWall(-64, -198, 7, Math.PI / 4));

    scenery.add(createTotemSign('6. ĐƯỜNG QUANH CO CHỮ S', 'CĂN ĐƯỜNG MỀM MẠI - KHÔNG ĐÈ CỌC VÀ VẠCH', -24, -170, 0, '#ea580c'));

    // Các cặp cọc tiêu uốn lượn hình chữ S
    const scurvePoints = [
      { x: -35, z: -175 }, { x: -45, z: -182 }, { x: -55, z: -190 },
      { x: -62, z: -198 }, { x: -55, z: -208 }, { x: -45, z: -216 },
      { x: -36, z: -224 }, { x: -45, z: -230 }
    ];
    scurvePoints.forEach((pt, idx) => {
      [-3.5, 3.5].forEach((ox, sideIdx) => {
        const px = pt.x + ox;
        const pole = createCornerPole(px, pt.z, 1.15);
        scenery.add(pole);
        colliders.push({
          id: `pole_scurve_${idx}_${sideIdx}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: pt.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới đoạn đường uốn lượn chữ S!',
          messageDe: 'Begrenzungsstange in S-Kurve berührt! (-15đ)'
        });
      });

      const cone = createTrafficCone(pt.x, pt.z, 0.9);
      scenery.add(cone);
      colliders.push({
        id: `cone_scurve_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: pt.x,
        z: pt.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu tim đường chữ S!',
        messageDe: 'Leitkegel in S-Kurve berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 7: LÀN PHANH DỪNG KHẨN CẤP (GEFAHRENBREMSUNG) ────────────
    // Làn thẳng riêng biệt tại X: 16 (từ Z: -150 đến -235)
    // ══════════════════════════════════════════════════════════════════════
    const brakePad = new THREE.Mesh(new THREE.PlaneGeometry(16, 85), asphaltPadMat);
    brakePad.rotation.x = -Math.PI / 2;
    brakePad.position.set(16, 0.015, -192);
    scenery.add(brakePad);

    // Đường nối phía Bắc vào làn phanh khẩn cấp
    const brakeConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 25), branchMat);
    brakeConnector.rotation.x = -Math.PI / 2;
    brakeConnector.position.set(16, 0.012, -140);
    scenery.add(brakeConnector);
    scenery.add(createRoadArrow(16, -142, 0, 'straight'));

    // Hàng rào lốp xe giảm chấn ở cuối làn phanh
    scenery.add(createTireWall(16, -238, 8, 0));

    scenery.add(createTotemSign('7. PHANH DỪNG KHẨN CẤP', 'TĂNG TỐC 30-50 KM/H -> ĐẠP PHANH HẾT CỠ DƯỚI 6M', 10, -150, 0, '#dc2626'));

    const speedSign50 = makeGermanStVOSign('SPEED_LIMIT', 50);
    speedSign50.position.set(24, 0, -160);
    scenery.add(speedSign50);

    const dangerSign2 = makeGermanStVOSign('DANGER');
    dangerSign2.position.set(24, 0, -172);
    scenery.add(dangerSign2);

    // Vạch vàng cảnh báo chuẩn bị phanh khẩn cấp tại Z = -188
    const brakeWarningLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), yellowLineMat);
    brakeWarningLine.rotation.x = -Math.PI / 2;
    brakeWarningLine.position.set(16, 0.03, -188);
    scenery.add(brakeWarningLine);

    // Vạch đỏ giới hạn dừng xe khẩn cấp Haltelinie tại Z = -205
    const brakeStopLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    brakeStopLine.rotation.x = -Math.PI / 2;
    brakeStopLine.position.set(16, 0.03, -205);
    scenery.add(brakeStopLine);

    // Hàng cọc tiêu giới hạn 2 bên làn phanh
    for (let bz = -165; bz >= -225; bz -= 8) {
      [9.5, 22.5].forEach((bx, sideIdx) => {
        const cone = createTrafficCone(bx, bz, 1.05);
        scenery.add(cone);
        colliders.push({
          id: `cone_brake_${bx}_${bz}`,
          type: 'cone',
          shape: 'circle',
          x: bx,
          z: bz,
          radius: 0.40,
          mesh: cone,
          penalty: 10,
          messageVi: 'Chạm cọc tiêu giới hạn làn phanh khẩn cấp!',
          messageDe: 'Leitkegel der Gefahrenbremsung berührt! (-10đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 8: CỔNG ĐÍCH & KẾT THÚC SA HÌNH (ZIEL & FINISH PARKPLATZ) ─
    // Cuối trục chính tại X: 0, Z: -235
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createSaHinhBanner('8. VẠCH ĐÍCH & KẾT THÚC SA HÌNH', 'XI-NHAN PHẢI TẤP LỀ - DỪNG BÁNH XE - VỀ SỐ P - KÉO PHANH TAY', 0, -228, 18));

    // Cổng vòm đích Finish Arch tại Z = -234
    scenery.add(createFinishArch(0, -234, 16));

    // Bãi đỗ xe trả bài thi kết thúc tại Z = -245
    scenery.add(createParkingMarkings(6.5, -246, 2.8, 6.5, true));
    scenery.add(createParkingMarkings(-6.5, -246, 2.8, 6.5, true));

    // Vòng quay đầu xe sau vạch đích để có thể tiếp tục lái dạo quanh sân
    const loopBackRoad = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), branchMat);
    loopBackRoad.rotation.x = -Math.PI / 2;
    loopBackRoad.position.set(0, 0.012, -255);
    scenery.add(loopBackRoad);

    const pSignFinal = makeGermanStVOSign('PARKING');
    pSignFinal.position.set(9.5, 0, -240);
    scenery.add(pSignFinal);
  }

  // 🌲 5. ĐƯỜNG NGOÀI ĐÔ THỊ ĐỨC (LANDSTRASSE WALD: RỪNG THÔNG, LEITPFOSTEN, WILDWECHSEL, 100 KM/H)
  if (mapType === 'landstrasse_wald') {
    // 1. Cọc tiêu phản quang Leitpfosten Z. 620 mỗi 45m dọc 2 bên lề đường
    for (let lz = 20; lz >= -2400; lz -= 45) {
      scenery.add(createLeitpfosten(-4.9, lz, 'left'));
      scenery.add(createLeitpfosten(4.9, lz, 'right'));
    }

    // 2. Hàng cây thông rừng Đức (Deutsche Waldtanne) 2 bên đường
    for (let tz = 30; tz >= -2500; tz -= 22) {
      [-12, -22, -35].forEach((ox, idx) => {
        const randScale = 0.85 + (Math.abs(tz * 7 + idx) % 5) * 0.15;
        const pTree = createPineTree(ox + (tz % 7) * 0.3, tz, randScale);
        scenery.add(pTree);
        colliders.push({
          id: `pine_L_${tz}_${idx}`,
          type: 'tree',
          shape: 'circle',
          x: ox,
          z: tz,
          radius: 0.55 * randScale,
          penalty: 25,
          messageVi: 'Đâm cây thông ven đường quốc lộ!',
          messageDe: 'Kollision mit Straßenbaum! (-25đ)'
        });
      });
      [12, 22, 35].forEach((ox, idx) => {
        const randScale = 0.85 + (Math.abs(tz * 11 + idx) % 5) * 0.15;
        const pTree = createPineTree(ox - (tz % 7) * 0.3, tz, randScale);
        scenery.add(pTree);
        colliders.push({
          id: `pine_R_${tz}_${idx}`,
          type: 'tree',
          shape: 'circle',
          x: ox,
          z: tz,
          radius: 0.55 * randScale,
          penalty: 25,
          messageVi: 'Đâm cây thông ven đường quốc lộ!',
          messageDe: 'Kollision mit Straßenbaum! (-25đ)'
        });
      });
    }

    // 3. Biển báo StVO đường trường
    // Z = -100: Tốc độ 100 km/h ngoài đô thị
    const s100 = makeGermanStVOSign('SPEED_LIMIT', 100);
    s100.position.set(5.5, 0, -100);
    scenery.add(s100);

    // Z = -240: Cảnh báo khúc cua nguy hiểm (Z. 103)
    const curveSign1 = makeGermanStVOSign('KURVE');
    curveSign1.position.set(5.5, 0, -240);
    scenery.add(curveSign1);

    // Z = -320: Tốc độ 70 km/h trước khúc cua
    const s70 = makeGermanStVOSign('SPEED_LIMIT', 70);
    s70.position.set(5.5, 0, -320);
    scenery.add(s70);

    // Z = -500: Tốc độ 80 km/h
    const s80 = makeGermanStVOSign('SPEED_LIMIT', 80);
    s80.position.set(5.5, 0, -500);
    scenery.add(s80);

    // Z = -840: Cảnh báo động vật hoang dã Wildwechsel (Z. 142)
    const wildSign1 = makeGermanStVOSign('WILDWECHSEL');
    wildSign1.position.set(5.5, 0, -840);
    scenery.add(wildSign1);

    // Z = -980: Mô hình nai rừng đứng mép bìa rừng
    const deerGroup = new THREE.Group();
    const deerMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const deerBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1.4), deerMat);
    deerBody.position.y = 1.0;
    const deerNeck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), deerMat);
    deerNeck.position.set(0, 1.5, -0.5);
    const deerHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.45), deerMat);
    deerHead.position.set(0, 1.8, -0.7);
    deerGroup.add(deerBody); deerGroup.add(deerNeck); deerGroup.add(deerHead);
    deerGroup.position.set(7.5, 0, -980);
    scenery.add(deerGroup);

    // Z = -1420: Cảnh báo công trường Baustelle (Z. 123)
    const bauSign = makeGermanStVOSign('BAUSTELLE');
    bauSign.position.set(5.5, 0, -1420);
    scenery.add(bauSign);

    // Cọc tiêu công trường tại Z = -1450 đến -1520
    for (let bcz = -1450; bcz >= -1520; bcz -= 12) {
      scenery.add(createTrafficCone(3.2, bcz, 1.1));
    }

    // Z = -1620: Hết mọi lệnh cấm / Trở lại 100 km/h
    const sEnd = makeGermanStVOSign('SPEED_LIMIT', 100);
    sEnd.position.set(5.5, 0, -1620);
    scenery.add(sEnd);

    // Z = -1720: Cổng vòm hoàn thành bài thi Landstraße
    scenery.add(createFinishArch(0, -1720, 14));
  }

  scene.add(scenery);

  // Tra về đầy đủ vị trí Spawn chuẩn xác & Colliders vật lý thế giới
  return {
    scenery,
    roadMat,
    crossStreetZ,
    config,
    disableSceneryMoving: true,
    playerSpawnPos: config.playerSpawn,
    aiSpawns: config.aiSpawns,
    colliders,
    ramps: saHinhRamps
  };
}

// Cây công viên dùng chung cho PARK & PROMENADE (thân + 2 tầng tán lá)
function createParkTree(scale = 1) {
  const treeGroup = new THREE.Group();
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, 2.8 * scale, 8), trunkM);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const leavesLow = new THREE.Mesh(new THREE.SphereGeometry(1.7 * scale, 8, 8), leafM);
  leavesLow.position.y = 3.2 * scale;
  leavesLow.castShadow = true;
  treeGroup.add(leavesLow);

  const leavesTop = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 8, 8), leafM2);
  leavesTop.position.y = 4.5 * scale;
  leavesTop.castShadow = true;
  treeGroup.add(leavesTop);

  return treeGroup;
}

// Ghế đá công viên (Parkbank Berlin kiểu băng ghế sơn xanh lá)
function createParkBench() {
  const bench = new THREE.Group();
  const woodM = new THREE.MeshStandardMaterial({ color: 0x2f6b4f, roughness: 0.75 });
  const legM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.3 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), woodM);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.06), woodM);
  backrest.position.set(0, 0.72, -0.2);
  backrest.rotation.x = -0.15;
  bench.add(backrest);

  [-0.75, 0.75].forEach(bx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.42), legM);
    leg.position.set(bx, 0.22, 0);
    bench.add(leg);
  });

  return bench;
}

// ── 3. CUSTOM MAP BUILDER (Build từ file JSON MapEditor) ────────────────────────
export function buildCustomMap(scene, mapData, options = {}) {
  if (!mapData) {
    return { scenery: null, roadMat: null, crossStreetZ: [], config: null, isCustomMap: false };
  }
  const isPerformance = !!options.isPerformance;

  const scenery = new THREE.Group();
  scenery.name = 'customMapScenery';

  const ambientLight = new THREE.AmbientLight(0xffffff, isPerformance ? 0.6 : 0.25);
  scenery.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, isPerformance ? 0.6 : 0.35);
  dirLight.position.set(50, 100, 50);
  dirLight.castShadow = !isPerformance;
  scenery.add(dirLight);

  const roadMat = createPbrRoadMaterial({ repeatX: 7, repeatZ: 40, roughness: 0.82 });
  const grassMat = createPbrGrassMaterial({ repeatX: 1000, repeatZ: 1000, color: 0xffffff });
  const swMat = createSidewalkMaterial({ repeatX: 2, repeatZ: 40 });
  const cobbleMat = createCobblestoneMaterial({ repeatX: 4, repeatZ: 4 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.05 });

  const customRamps = [];

  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  ensureUV2(groundGeo);
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  ground.receiveShadow = true;
  scenery.add(ground);

  if (mapData.elements) {
    mapData.elements.forEach((element) => {
      const x = element.x;
      const z = element.z || 0;
      const width = element.width;
      const height = element.height;
      const rotationDeg = element.rotation || 0;
      const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;

      const effWidth = isQuarterTurn ? height : width;
      const effHeight = isQuarterTurn ? width : height;

      const centerX = x + effWidth / 2;
      const centerZ = -(z + effHeight / 2);
      const rotRad = -(rotationDeg * Math.PI / 180);
      switch (element.type) {
        case 'ROAD':
        case 'ROAD_STRAIGHT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          // Road surface - Hỗ trợ mặt đường Asphalt hoặc Đá cuội Cobblestone
          const surfaceMat = element.roadType === 'cobblestone' ? cobbleMat : roadMat;
          const roadGeo = new THREE.PlaneGeometry(width, height);
          ensureUV2(roadGeo);
          const road = new THREE.Mesh(roadGeo, surfaceMat);
          road.rotation.x = -Math.PI / 2;
          road.receiveShadow = true;
          group.add(road);

          // Ray đôi tàu điện Straßenbahn Tram M8/12 nếu có hasTram
          if (element.hasTram) {
            const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
            [-0.75, 0.75].forEach(rX => {
              const rail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, height), railMat);
              rail.rotation.x = -Math.PI / 2;
              rail.position.set(rX, 0.007, 0);
              group.add(rail);
            });
          }

          // Làn đường xe đạp sơn đỏ chuyên dụng (Radwegefurt)
          if (element.bicycleLane) {
            const bikeLaneMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
            [-width / 2 + 0.9, width / 2 - 0.9].forEach(bX => {
              const bikeLane = new THREE.Mesh(new THREE.PlaneGeometry(1.3, height), bikeLaneMat);
              bikeLane.rotation.x = -Math.PI / 2;
              bikeLane.position.set(bX, 0.003, 0);
              group.add(bikeLane);
            });
          }

          // Center dashed white line (hoặc vạch kép nếu là đại lộ 4 làn)
          if (element.lanes === 4) {
            [-0.4, 0.4].forEach(offX => {
              const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
              borderLine.rotation.x = -Math.PI / 2;
              borderLine.position.set(offX, 0.005, 0);
              group.add(borderLine);
            });
          } else {
            const numDashes = Math.max(1, Math.floor(height / 4));
            for (let d = 0; d < numDashes; d++) {
              const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), lineMat);
              dash.rotation.x = -Math.PI / 2;
              dash.position.set(0, 0.005, -height / 2 + 1 + d * 4);
              group.add(dash);
            }
          }

          // Outer solid white lines
          [-width / 2 + 0.3, width / 2 - 0.3].forEach(lineX => {
            const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            borderLine.rotation.x = -Math.PI / 2;
            borderLine.position.set(lineX, 0.005, 0);
            group.add(borderLine);
          });

          // Vỉa hè 2 bên đường nếu sidewalk !== false
          if (element.sidewalk !== false) {
            [-width / 2 - 0.9, width / 2 + 0.9].forEach(swX => {
              const sw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, height), swMat);
              sw.position.set(swX, 0.075, 0);
              group.add(sw);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROAD_CURVE_90': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const tileSize = Math.max(width, height);
          const roadW = Math.min(width, height, 14);
          const Rcenter = tileSize / 2;
          const Rin = Math.max(2, Rcenter - roadW / 2);
          const Rout = Rcenter + roadW / 2;

          const arcGroup = new THREE.Group();
          arcGroup.position.set(-tileSize / 2, 0, tileSize / 2);

          const curveGeo = new THREE.RingGeometry(Rin, Rout, 36, 1, 0, Math.PI / 2);
          const curveMesh = new THREE.Mesh(curveGeo, roadMat);
          curveMesh.rotation.x = -Math.PI / 2;
          curveMesh.receiveShadow = true;
          arcGroup.add(curveMesh);

          // Vạch kẻ đứt cong ở giữa (Center curved dashed line)
          const numDashes = 6;
          const angleSpan = Math.PI / 2;
          for (let d = 0; d < numDashes; d++) {
            const startAng = (d / numDashes) * angleSpan + 0.04;
            const dashAng = (angleSpan / numDashes) * 0.55;
            const dashGeo = new THREE.RingGeometry(Rcenter - 0.12, Rcenter + 0.12, 6, 1, startAng, dashAng);
            const dashMesh = new THREE.Mesh(dashGeo, lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.y = 0.005;
            arcGroup.add(dashMesh);
          }

          // Vạch liền mép trong & mép ngoài
          const innerLineGeo = new THREE.RingGeometry(Rin + 0.3, Rin + 0.45, 36, 1, 0, Math.PI / 2);
          const innerLineMesh = new THREE.Mesh(innerLineGeo, lineMat);
          innerLineMesh.rotation.x = -Math.PI / 2;
          innerLineMesh.position.y = 0.005;
          arcGroup.add(innerLineMesh);

          const outerLineGeo = new THREE.RingGeometry(Rout - 0.45, Rout - 0.3, 36, 1, 0, Math.PI / 2);
          const outerLineMesh = new THREE.Mesh(outerLineGeo, lineMat);
          outerLineMesh.rotation.x = -Math.PI / 2;
          outerLineMesh.position.y = 0.005;
          arcGroup.add(outerLineMesh);

          // Vỉa hè cong mép ngoài & trong
          const outerCurbGeo = new THREE.RingGeometry(Rout, Rout + 1.2, 36, 1, 0, Math.PI / 2);
          const outerCurb = new THREE.Mesh(outerCurbGeo, swMat);
          outerCurb.rotation.x = -Math.PI / 2;
          outerCurb.position.y = 0.04;
          arcGroup.add(outerCurb);

          const innerCurbGeo = new THREE.RingGeometry(Math.max(0.1, Rin - 1.2), Rin, 36, 1, 0, Math.PI / 2);
          const innerCurb = new THREE.Mesh(innerCurbGeo, swMat);
          innerCurb.rotation.x = -Math.PI / 2;
          innerCurb.position.y = 0.04;
          arcGroup.add(innerCurb);

          // Gờ sa hình kerb sọc đỏ trắng ôm cua
          const numKerbs = 8;
          for (let k = 0; k < numKerbs; k++) {
            const kStart = (k / numKerbs) * angleSpan;
            const kLen = angleSpan / numKerbs;
            const kerbMat = (k % 2 === 0)
              ? new THREE.MeshBasicMaterial({ color: 0xef4444 })
              : new THREE.MeshBasicMaterial({ color: 0xffffff });
            const kGeo = new THREE.RingGeometry(Rin, Rin + 0.45, 4, 1, kStart, kLen);
            const kMesh = new THREE.Mesh(kGeo, kerbMat);
            kMesh.rotation.x = -Math.PI / 2;
            kMesh.position.y = 0.01;
            arcGroup.add(kMesh);
          }

          group.add(arcGroup);
          scenery.add(group);
          break;
        }
        case 'ROAD_S_CURVE': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const roadW = width || 14;
          const roadLen = height || 40;
          const steps = 40;
          const amplitude = element.amplitude || 4.2;

          const sCurveFunc = (t) => {
            return amplitude * Math.sin(Math.PI * 2 * t) * Math.pow(Math.sin(Math.PI * t), 1.5);
          };

          const positions = [];
          const uvs = [];
          const indices = [];

          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);

            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            positions.push(xLocal - nx * (roadW / 2), 0, zLocal - nz * (roadW / 2));
            uvs.push(0, t * (roadLen / 4));

            positions.push(xLocal + nx * (roadW / 2), 0, zLocal + nz * (roadW / 2));
            uvs.push(1, t * (roadLen / 4));

            if (i < steps) {
              const baseIdx = i * 2;
              indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
              indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
            }
          }

          const sGeo = new THREE.BufferGeometry();
          sGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
          sGeo.setIndex(indices);
          sGeo.computeVertexNormals();

          const sMesh = new THREE.Mesh(sGeo, roadMat);
          sMesh.receiveShadow = true;
          group.add(sMesh);

          // Vạch tim đường đứt khúc uốn lượn theo cua S
          const numDashes = Math.floor(roadLen / 3.5);
          for (let d = 0; d < numDashes; d++) {
            const t = (d + 0.5) / numDashes;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const dashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.8), lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.set(xLocal, 0.005, zLocal);
            group.add(dashMesh);
          }

          // Cọc tiêu sa hình phản quang (Traffic cones) dọc 2 mép bài thi đường quanh co
          for (let i = 2; i <= steps - 2; i += 4) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            [-roadW / 2 + 0.4, roadW / 2 - 0.4].forEach(sideOffset => {
              const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
              const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 0.6, 8), coneMat);
              cone.position.set(xLocal + nx * sideOffset, 0.3, zLocal + nz * sideOffset);
              cone.castShadow = true;
              group.add(cone);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROUNDABOUT_4WAY':
        case 'ROUNDABOUT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const outerR = Math.max(width, height) / 2;
          const innerR = Math.max(4, outerR - 9.5);

          // Mặt đường vòng xuyến (Circular asphalt ring)
          const ringGeo = new THREE.RingGeometry(innerR, outerR, 48);
          const ringMesh = new THREE.Mesh(ringGeo, roadMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.receiveShadow = true;
          group.add(ringMesh);

          // Đảo cỏ trung tâm & viền đá (Center island)
          const islandGeo = new THREE.CylinderGeometry(innerR, innerR + 0.25, 0.3, 48);
          const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
          const island = new THREE.Mesh(islandGeo, islandMat);
          island.position.y = 0.15;
          island.receiveShadow = true;
          group.add(island);

          // Cây xanh & tiểu cảnh trung tâm bùng binh
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 4.0, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
          trunk.position.y = 2.0;
          trunk.castShadow = true;
          group.add(trunk);

          const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
          crown.position.y = 4.8;
          crown.castShadow = true;
          group.add(crown);

          // 4 đường dẫn nối vào vòng xuyến (4 Approach legs with Shark's teeth markings)
          const legW = 14;
          const legLen = outerR;
          [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
            const legMesh = new THREE.Mesh(new THREE.PlaneGeometry(legW, legLen), roadMat);
            legMesh.rotation.x = -Math.PI / 2;
            legMesh.rotation.z = angle;
            const legDist = (outerR + innerR) / 2;
            legMesh.position.set(Math.sin(angle) * legDist, -0.002, Math.cos(angle) * legDist);
            group.add(legMesh);

            // Vạch răng cá mập StVO Zeichen 342 nhường đường khi vào vòng xuyến
            const numTeeth = 5;
            const toothW = (legW - 2) / numTeeth;
            for (let t = 0; t < numTeeth; t++) {
              const toothShape = new THREE.Shape();
              toothShape.moveTo(-toothW * 0.4, 0);
              toothShape.lineTo(toothW * 0.4, 0);
              toothShape.lineTo(0, toothW * 0.8);
              toothShape.closePath();
              const toothGeo = new THREE.ShapeGeometry(toothShape);
              const toothMesh = new THREE.Mesh(toothGeo, lineMat);
              toothMesh.rotation.x = -Math.PI / 2;
              toothMesh.rotation.z = angle;
              const tx = -legW / 2 + 1 + (t + 0.5) * toothW;
              const distFromCenter = outerR - 0.5;
              toothMesh.position.set(
                Math.sin(angle) * distFromCenter + Math.cos(angle) * tx,
                0.006,
                Math.cos(angle) * distFromCenter - Math.sin(angle) * tx
              );
              group.add(toothMesh);
            }
          });

          scenery.add(group);
          break;
        }
        case 'HILL_RAMP': {
          const rampWidth = width || 8.0;
          const rampLength = height || 36.0;
          const maxHeight = element.maxHeight || 1.1;

          const rampMesh = createHillRamp(0, 0, rampWidth, rampLength, maxHeight);
          rampMesh.position.set(centerX, 0, centerZ);
          rampMesh.rotation.y = rotRad;
          scenery.add(rampMesh);

          // Biển cảnh báo dốc 10% (StVO Zeichen 108: Steigung)
          const slopeSign = makeGermanStVOSign('PRIORITY', 10);
          slopeSign.position.set(centerX + rampWidth / 2 + 1.2, 0, centerZ + rampLength / 2);
          scenery.add(slopeSign);

          // Lưu thông tin ramp cho vật lý leo dốc & trôi dốc của xe
          customRamps.push({
            centerX,
            centerZ,
            width: rampWidth,
            length: rampLength,
            maxHeight,
            rotationDeg
          });
          break;
        }
        case 'JUNCTION_AMPEL':
        case 'INTERSECTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          // Intersection road base
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);

          // Crosswalk lines around all 4 entrances
          const numStripes = 6;
          const stripeWidth = (width - 2) / numStripes;

          // Top and Bottom crosswalks
          [-height / 2 + 1.2, height / 2 - 1.2].forEach(cwZ => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.8, 1.2), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(-width / 2 + 1 + i * stripeWidth + stripeWidth / 2, 0.005, cwZ);
              group.add(stripe);
            }
          });

          // Left and Right crosswalks
          [-width / 2 + 1.2, width / 2 - 1.2].forEach(cwX => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, stripeWidth * 0.8), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(cwX, 0.005, -height / 2 + 1 + i * stripeWidth + stripeWidth / 2);
              group.add(stripe);
            }
          });

          // Nếu có đèn tín hiệu giao thông (Ampel), đặt 4 cột đèn StVO § 37 ở 4 góc giao lộ
          if (element.hasTrafficLight || element.type === 'JUNCTION_AMPEL') {
            const tlPositions = [
              { x: width / 2 + 1.2, z: height / 2 + 1.2, rot: 0 },
              { x: -width / 2 - 1.2, z: height / 2 + 1.2, rot: Math.PI / 2 },
              { x: -width / 2 - 1.2, z: -height / 2 - 1.2, rot: Math.PI },
              { x: width / 2 + 1.2, z: -height / 2 - 1.2, rot: -Math.PI / 2 }
            ];
            tlPositions.forEach(pos => {
              const tl = makeTrafficLight(true);
              tl.position.set(pos.x, 0, pos.z);
              tl.rotation.y = pos.rot;
              group.add(tl);
            });
          }

          scenery.add(group);
          break;
        }
        case 'INTERSECTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width - 2, 0.4), lineMat);
          stopLine.rotation.x = -Math.PI / 2;
          stopLine.position.set(0, 0.005, height / 2 - 1.2);
          group.add(stopLine);

          scenery.add(group);
          break;
        }
        case 'LAMP_POST': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.0, 12), poleMat);
          pole.position.y = 3.0;
          pole.castShadow = true;
          group.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), poleMat);
          arm.position.set(0.5, 5.8, 0);
          group.add(arm);

          const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
          bulb.position.set(1.0, 5.7, 0);
          group.add(bulb);

          const light = new THREE.SpotLight(0xfef08a, 1.2, 25, Math.PI / 4, 0.5, 1);
          light.position.set(1.0, 5.7, 0);
          light.target.position.set(1.0, 0, 0);
          group.add(light);
          group.add(light.target);

          scenery.add(group);
          break;
        }
        case 'PARKING_BAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const numStalls = Math.max(1, Math.floor(width / 3.0));
          const stallW = width / numStalls;
          for (let s = 0; s <= numStalls; s++) {
            const pLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            pLine.rotation.x = -Math.PI / 2;
            pLine.position.set(-width / 2 + s * stallW, 0.005, 0);
            group.add(pLine);
          }

          // 🚗 Đỗ sẵn các xe ô tô bot trong ô đỗ xe bên đường
          const parkColors = [0x3b82f6, 0xef4444, 0x10b981, 0x64748b, 0x0f172a];
          const parkedCount = Math.min(numStalls, 3);
          for (let pIdx = 0; pIdx < parkedCount; pIdx++) {
            const parkedCar = createTrafficAICar(pIdx, parkColors[(pIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            const stallX = -width / 2 + (pIdx + 0.5) * stallW;
            parkedCar.position.set(stallX, 0, 0);
            parkedCar.rotation.y = Math.PI / 2;
            group.add(parkedCar);
          }

          scenery.add(group);
          break;
        }
        case 'BUILDING': {
          const styleIdx = Math.floor(Math.abs(centerX * 7 + centerZ * 13)) % 3;
          const facadeTex = createBuildingFacadeTexture(0xe2e8f0, styleIdx);
          const bldgMat = new THREE.MeshStandardMaterial({
            map: facadeTex,
            roughness: 0.5
          });

          const bldgHeight = Math.max(10, element.bldgHeight || 16);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            bldgMat
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          building.castShadow = true;
          building.receiveShadow = true;
          scenery.add(building);
          break;
        }
        case 'SIDEWALK': {
          const sidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.15, height),
            swMat
          );
          sidewalk.position.set(centerX, 0.075, centerZ);
          sidewalk.rotation.y = rotRad;
          sidewalk.receiveShadow = true;
          scenery.add(sidewalk);
          break;
        }
        case 'TREE': {
          const treeGroup = new THREE.Group();
          const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
          const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkM);
          trunk.position.y = 1.5;
          trunk.castShadow = true;

          const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), leafM);
          leaves.position.y = 3.6;
          leaves.castShadow = true;

          treeGroup.add(trunk);
          treeGroup.add(leaves);
          treeGroup.position.set(centerX, 0, centerZ);
          treeGroup.rotation.y = rotRad;
          scenery.add(treeGroup);
          break;
        }
        case 'SIGN': {
          const signObj = makeGermanStVOSign(element.signType || 'SPEED_LIMIT', element.value || 50);
          signObj.position.set(centerX, 0, centerZ);
          signObj.rotation.y = rotRad;
          scenery.add(signObj);
          break;
        }
        case 'TRAFFIC_LIGHT': {
          const tlObj = makeTrafficLight(true);
          tlObj.position.set(centerX, 0, centerZ);
          tlObj.rotation.y = rotRad;
          scenery.add(tlObj);
          break;
        }
        case 'STOP_LINE': {
          // Vạch dừng xe StVO Zeichen 294 (Haltelinie)
          const group = new THREE.Group();
          group.position.set(centerX, 0.035, centerZ);
          group.rotation.y = rotRad;

          const stopLineW = width || 7.0;
          const stopLineH = height || 0.6; // Bề dày chuẩn StVO 50-60cm
          const stopMesh = new THREE.Mesh(new THREE.PlaneGeometry(stopLineW, stopLineH), lineMat);
          stopMesh.rotation.x = -Math.PI / 2;
          stopMesh.receiveShadow = true;
          group.add(stopMesh);

          scenery.add(group);
          break;
        }
        case 'ZEBRA': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.04, centerZ);
          group.rotation.y = rotRad;

          const numStripes = 6;
          const stripeWidth = width / numStripes;
          for (let i = 0; i < numStripes; i += 2) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.85, height), lineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-width / 2 + i * stripeWidth + stripeWidth / 2, 0, 0);
            group.add(stripe);
          }
          scenery.add(group);
          break;
        }
        case 'SPAWN_POINT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.05, centerZ);
          group.rotation.y = rotRad;

          const spawnBoxMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.5 });
          const spawnBox = new THREE.Mesh(new THREE.PlaneGeometry(width, height), spawnBoxMat);
          spawnBox.rotation.x = -Math.PI / 2;
          group.add(spawnBox);

          // Arrow indicating start direction
          const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const arrowBody = new THREE.Mesh(new THREE.PlaneGeometry(0.4, height * 0.5), arrowMat);
          arrowBody.rotation.x = -Math.PI / 2;
          arrowBody.position.set(0, 0.01, 0.2);
          group.add(arrowBody);

          scenery.add(group);
          break;
        }
        case 'BRANDENBURGER_TOR':
        case 'LANDMARK': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const stoneMat = new THREE.MeshStandardMaterial({ color: 0xdfd7c2, roughness: 0.8 });
          const roofMat = new THREE.MeshStandardMaterial({ color: 0xc4b59d, roughness: 0.7 });
          const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x22553b, metalness: 0.6, roughness: 0.4 });

          // Attic / Dầm mái trên cùng
          const attic = new THREE.Mesh(new THREE.BoxGeometry(28, 3.8, 7.5), roofMat);
          attic.position.y = 11.5;
          attic.castShadow = true;
          group.add(attic);

          // Cụm tượng cỗ xe tứ mã Quadriga trên đỉnh
          const quadriga = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.2, 3.5), bronzeMat);
          quadriga.position.y = 14.8;
          quadriga.castShadow = true;
          group.add(quadriga);

          // 6 hàng cột trụ Doric tạo 5 cổng vòm
          const colXs = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5];
          colXs.forEach(cx => {
            [-2.2, 2.2].forEach(cz => {
              const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.8, 12), stoneMat);
              col.position.set(cx, 4.9, cz);
              col.castShadow = true;
              group.add(col);
            });
          });

          // Hai cánh cổng vây tường bên ngoài
          [-14.5, 14.5].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8.5, 7.5), stoneMat);
            wing.position.set(wx, 4.25, 0);
            wing.castShadow = true;
            group.add(wing);
          });

          scenery.add(group);
          break;
        }
        case 'TRAM_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          // Bục chờ hành khách
          const platform = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, height), swMat);
          platform.position.y = 0.125;
          group.add(platform);

          // Mái che trạm tàu
          const shelterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
          const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.1, height * 0.5), shelterMat);
          shelterRoof.position.set(0, 3.2, 0);
          group.add(shelterRoof);

          // Cột đỡ mái
          [-height * 0.2, height * 0.2].forEach(pz => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), shelterMat);
            pole.position.set(0, 1.6, pz);
            group.add(pole);
          });

          // Biển hiệu Tram chữ T màu đỏ
          const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), signMat);
          signMesh.position.set(0, 3.8, 0);
          group.add(signMesh);

          scenery.add(group);
          break;
        }
        case 'BUS_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const bvgMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
          const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 });

          const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, height * 0.6), bvgMat);
          roof.position.y = 2.8;
          group.add(roof);

          const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.7, height * 0.6), glassMat);
          backGlass.position.set(-width / 2 + 0.1, 1.35, 0);
          group.add(backGlass);

          // Biển tròn chữ H bến xe buýt StVO Zeichen 224
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), bvgMat);
          pole.position.set(width / 2 - 0.2, 1.5, height / 2);
          group.add(pole);

          const hSign = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x15803d }));
          hSign.rotation.x = Math.PI / 2;
          hSign.position.set(width / 2 - 0.2, 2.9, height / 2);
          group.add(hSign);

          scenery.add(group);
          break;
        }
        case 'PARKED_CAR': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const numCars = Math.max(1, Math.floor(height / 6));
          const parkColors = [0x2563eb, 0xdc2626, 0x475569, 0x1e293b, 0xffffff];
          for (let cIdx = 0; cIdx < numCars; cIdx++) {
            const pCar = createTrafficAICar(cIdx, parkColors[(cIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            pCar.position.set(0, 0, -height / 2 + 3 + cIdx * 5.5);
            group.add(pCar);
          }

          scenery.add(group);
          break;
        }
        case 'CONSTRUCTION': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
          const barrier = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, 0.15), barMat);
          barrier.position.y = 0.6;
          group.add(barrier);

          const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
          warnLight.position.set(0, 1.2, 0);
          group.add(warnLight);

          scenery.add(group);
          break;
        }
        case 'SHOP': {
          const bldgHeight = Math.max(10, element.bldgHeight || 14);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.6 })
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          scenery.add(building);

          const awningMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
          const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.1, 2.0), awningMat);
          awning.position.set(centerX, 3.2, centerZ + height / 2 + 0.8);
          awning.rotation.x = 0.2;
          awning.rotation.y = rotRad;
          scenery.add(awning);
          break;
        }
        case 'JUNCTION_AMPEL': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const interBase = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          interBase.rotation.x = -Math.PI / 2;
          interBase.receiveShadow = true;
          group.add(interBase);

          // 4 cột đèn tín hiệu ở 4 góc giao lộ
          const corners = [
            [-width / 2 + 1, -height / 2 + 1],
            [width / 2 - 1, -height / 2 + 1],
            [-width / 2 + 1, height / 2 - 1],
            [width / 2 - 1, height / 2 - 1]
          ];
          corners.forEach(([cx, cz]) => {
            const tl = makeTrafficLight(true);
            tl.position.set(cx, 0, cz);
            group.add(tl);
          });

          scenery.add(group);
          break;
        }
        case 'JUNCTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);
          scenery.add(group);
          break;
        }
        case 'JUNCTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);
          scenery.add(group);
          break;
        }
        case 'ARROW_STRAIGHT':
        case 'ARROW_LEFT':
        case 'ARROW_RIGHT': {
          // Mũi tên chỉ làn StVO Zeichen 297 sơn trắng trên mặt đường
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const arrowShape = new THREE.Shape();
          if (element.type === 'ARROW_STRAIGHT') {
            // Thân thẳng + đầu nhọn hướng tiến (Z. 297)
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.6);
            arrowShape.lineTo(-0.55, 0.6);
            arrowShape.lineTo(0, 1.5);
            arrowShape.lineTo(0.55, 0.6);
            arrowShape.lineTo(0.18, 0.6);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          } else {
            // Thân dọc + cánh ngang + đầu mũi tên rẽ (Z. 297-10 / 297-20)
            const dir = element.type === 'ARROW_LEFT' ? -1 : 1;
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.5);
            arrowShape.lineTo(dir * -1.75, 0.1);
            arrowShape.lineTo(dir * -1.2, -0.3);
            arrowShape.lineTo(0.18, -0.08);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          }

          const arrowGeo = new THREE.ShapeGeometry(arrowShape);
          const arrowMesh = new THREE.Mesh(arrowGeo, lineMat);
          arrowMesh.rotation.x = -Math.PI / 2;
          arrowMesh.position.y = 0.006;
          group.add(arrowMesh);

          scenery.add(group);
          break;
        }
        case 'PARK': {
          // Công viên xanh: thảm cỏ + lối đi + cây + ghế đá
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const lawn = new THREE.Mesh(new THREE.PlaneGeometry(width, height), grassMat);
          lawn.rotation.x = -Math.PI / 2;
          lawn.position.y = 0.01;
          lawn.receiveShadow = true;
          group.add(lawn);

          // Lối đi bộ vòng quanh mép công viên
          const pathMat = swMat;
          const pathW = 1.6;
          [
            [0, -height / 2 + pathW / 2, width, pathW],
            [0, height / 2 - pathW / 2, width, pathW]
          ].forEach(([px, pz, pw, ph]) => {
            const pathH = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pathMat);
            pathH.rotation.x = -Math.PI / 2;
            pathH.position.set(px, 0.02, pz);
            pathH.receiveShadow = true;
            group.add(pathH);
          });
          [
            [-width / 2 + pathW / 2, 0],
            [width / 2 - pathW / 2, 0]
          ].forEach(([px, pz]) => {
            const pathV = new THREE.Mesh(new THREE.PlaneGeometry(pathW, height - pathW * 2), pathMat);
            pathV.rotation.x = -Math.PI / 2;
            pathV.position.set(px, 0.02, pz);
            pathV.receiveShadow = true;
            group.add(pathV);
          });

          // Cây trồng so le theo lưới, tránh đè lối đi mép
          const treeStepX = Math.max(6, width / 4);
          const treeStepZ = Math.max(6, height / 4);
          let rowIdx = 0;
          for (let tz = -height / 2 + pathW + 2.5; tz <= height / 2 - pathW - 2.5; tz += treeStepZ) {
            for (let tx = -width / 2 + pathW + 2.5; tx <= width / 2 - pathW - 2.5; tx += treeStepX) {
              const jitterX = ((rowIdx % 2) * 0.5 - 0.25) * treeStepX * 0.3;
              const tree = createParkTree(0.9 + ((rowIdx % 3) * 0.15));
              tree.position.set(tx + jitterX, 0, tz);
              group.add(tree);
              rowIdx++;
            }
          }

          // Ghế đá đặt dọc lối đi phía bắc & nam
          [
            [-width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [-width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI],
            [width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI]
          ].forEach(([bx, bz, bRot]) => {
            const bench = createParkBench();
            bench.position.set(bx, 0, bz);
            bench.rotation.y = bRot;
            group.add(bench);
          });

          scenery.add(group);
          break;
        }
        case 'PROMENADE': {
          // Đại lộ đi bộ: sàn lát đá + hàng cây 2 bên + ghế nghỉ
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const promenadeFloor = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          promenadeFloor.rotation.x = -Math.PI / 2;
          promenadeFloor.receiveShadow = true;
          group.add(promenadeFloor);

          // Dải cỏ trung tâm tách luống đi bộ (Mitelstreifen)
          if (width >= 12) {
            const medianGrass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, height - 4), grassMat);
            medianGrass.rotation.x = -Math.PI / 2;
            medianGrass.position.y = 0.005;
            medianGrass.receiveShadow = true;
            group.add(medianGrass);
          }

          // Hàng cây dọc 2 mép mỗi 8m, xen kẽ ghế đá giữa các cây
          const treeXs = width >= 12 ? [-(width / 2 - 1.4), width / 2 - 1.4] : [-(width / 2 - 1.2), width / 2 - 1.2];
          let promIdx = 0;
          for (let pz = -height / 2 + 4; pz <= height / 2 - 4; pz += 8) {
            treeXs.forEach(tx => {
              const tree = createParkTree(1.0 + ((promIdx % 2) * 0.12));
              tree.position.set(tx, 0, pz);
              group.add(tree);
            });
            if (promIdx % 2 === 1) {
              const bench = createParkBench();
              bench.position.set(0, 0, pz - 2);
              bench.rotation.y = Math.PI / 2;
              group.add(bench);
            }
            promIdx++;
          }

          // Cột đèn lồng dọc promenade
          const lampM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.6 });
          const lampGlowM = new THREE.MeshBasicMaterial({ color: 0xfde68a });
          for (let pz = -height / 2 + 6; pz <= height / 2 - 6; pz += 12) {
            [-(width / 2 - 0.5), width / 2 - 0.5].forEach(lx => {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), lampM);
              pole.position.set(lx, 1.8, pz);
              pole.castShadow = true;
              group.add(pole);

              const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lampGlowM);
              lampHead.position.set(lx, 3.7, pz);
              group.add(lampHead);
            });
          }

          scenery.add(group);
          break;
        }
        default:
          break;
      }
    });
  }

  scene.add(scenery);

  let playerSpawnPos = { x: 3.5, z: 0 };

  // Ưu tiên sử dụng spawn point từ mapData nếu có
  if (mapData.mapInfo && mapData.mapInfo.spawnPoint) {
    console.log('🚗 Using spawn point from mapData:', mapData.mapInfo.spawnPoint);
    playerSpawnPos = {
      x: mapData.mapInfo.spawnPoint.x,
      z: mapData.mapInfo.spawnPoint.z,
      rotation: mapData.mapInfo.spawnPoint.rotation || 0
    };
  } else if (mapData.elements) {
    // Fallback: Tìm SPAWN_POINT hoặc đường đầu tiên nếu không có spawn point trong mapInfo
    const spawnEl = mapData.elements.find(el => el.type === 'SPAWN_POINT');
    if (spawnEl) {
      const isQuarterTurn = (spawnEl.rotation === 90 || spawnEl.rotation === 270);
      const effW = isQuarterTurn ? spawnEl.height : spawnEl.width;
      const effH = isQuarterTurn ? spawnEl.width : spawnEl.height;
      playerSpawnPos = {
        x: spawnEl.x + effW / 2,
        z: spawnEl.z + effH / 2,
        rotation: spawnEl.rotation || 0
      };
    } else {
      const firstRoad = mapData.elements.find(el => el.type === 'ROAD_STRAIGHT' || el.type === 'INTERSECTION_4WAY');
      if (firstRoad) {
        playerSpawnPos = {
          x: firstRoad.x + firstRoad.width / 2,
          z: firstRoad.z + firstRoad.height / 2,
          rotation: firstRoad.rotation || 0
        };
      }
    }
  }

  return {
    scenery,
    roadMat,
    crossStreetZ: [],
    config: mapData.mapInfo || { roadLength: 2000, maxSpeedLimit: 50 },
    isCustomMap: true,
    playerSpawnPos,
    disableSceneryMoving: true,
    ramps: customRamps
  };
}

// ── 4. CUSTOM MAP RELOAD HELPER ──────────────────────────────────────────────
export function reloadCustomMap(scene, mapData, playerCar, aiCars, trafficLights, refs) {
  if (!mapData) return;

  const oldScenery = scene.getObjectByName('customMapScenery');
  if (oldScenery) {
    scene.remove(oldScenery);
    oldScenery.clear();
  }

  aiCars.forEach(ai => scene.remove(ai.mesh));
  aiCars.length = 0;
  trafficLights.forEach(tl => scene.remove(tl.tl));
  trafficLights.length = 0;

  const { scenery, playerSpawnPos } = buildCustomMap(scene, mapData);

  console.log('🚗 Setting player car position to spawn point:', playerSpawnPos);
  playerCar.position.set(playerSpawnPos.x, 0, -playerSpawnPos.z);
  playerCar.rotation.y = -(playerSpawnPos.rotation || 0) * Math.PI / 180;
  playerCar.visible = true;

  refs.current.carX = playerSpawnPos.x;
  refs.current.carZ = playerSpawnPos.z;
  refs.current.heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
  refs.current.speed = 0;
  refs.current.isDriving = false;

  const cam = refs.current.camera || refs.current._camera;
  if (cam) {
    const spawnX = playerSpawnPos.x;
    const spawnZ = playerSpawnPos.z;
    const heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
    console.log('🎥 Setting camera position based on spawn point:', { spawnX, spawnZ });
    cam.position.set(
      spawnX - 5.2 * Math.sin(heading),
      2.2,
      -spawnZ + 5.2 * Math.cos(heading)
    );
    cam.lookAt(
      spawnX + 12 * Math.sin(heading),
      0.8,
      -spawnZ - 12 * Math.cos(heading)
    );
  }
}