import * as THREE from 'three';

export function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1b431c'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(34, 110, 34, 0.4)' : 'rgba(12, 45, 12, 0.4)';
    ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(120, 900);
  tex.anisotropy = 16;
  return tex;
}

export function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1c2026'; ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#2b3039' : '#121519';
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 0, 18, 1024);
  ctx.fillRect(986, 0, 18, 1024);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 400);
  tex.anisotropy = 16;
  return tex;
}

export function createBuildingFacadeTexture(baseHexColor, styleIdx) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const baseColor = '#' + baseHexColor.toString(16).padStart(6, '0');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (styleIdx % 3 === 0) {
    // Glass Skyscraper with dark metallic mullions
    for (let y = 0; y < 512; y += 40) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, y, 512, 4);
    }
    for (let x = 0; x < 512; x += 32) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(x, 0, 4, 512);
    }
    for (let y = 10; y < 500; y += 40) {
      for (let x = 8; x < 500; x += 32) {
        ctx.fillStyle = Math.random() > 0.3 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(14, 165, 233, 0.45)';
        ctx.fillRect(x, y, 22, 28);
      }
    }
  } else if (styleIdx % 3 === 1) {
    // Classic German City Building with storefronts & windows
    for (let y = 30; y < 420; y += 50) {
      for (let x = 20; x < 490; x += 45) {
        ctx.fillStyle = Math.random() > 0.2 ? '#fef08a' : '#1e293b';
        ctx.fillRect(x, y, 26, 32);
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 26, 32);
      }
    }
    // Ground floor shopfronts
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 430, 512, 82);
    for (let s = 15; s < 490; s += 90) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(s, 445, 70, 55);
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2;
      ctx.strokeRect(s, 445, 70, 55);
    }
  } else {
    // Modern Architectural Block
    for (let y = 25; y < 480; y += 60) {
      for (let x = 25; x < 480; x += 70) {
        ctx.fillStyle = Math.random() > 0.25 ? '#e0f2fe' : '#0284c7';
        ctx.fillRect(x, y, 48, 38);
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 48, 38);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

export function createSkyGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#0284c7');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(0.82, '#7dd3fc');
  grad.addColorStop(1.0, '#cbd5e1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 512);
  return new THREE.CanvasTexture(canvas);
}
