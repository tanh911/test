import * as THREE from 'three';

// ── Textures & Shaders (Cached for zero startup lag) ─────────────────────────
const textureCache = new Map();
const textureLoader = new THREE.TextureLoader();

// ── PBR TEXTURE LOADER (ASPHALT PIT LANE & LEAFY GRASS) ─────────────────────
let _pbrTextures = null;

export function ensureUV2(geometry) {
  if (geometry && geometry.attributes && geometry.attributes.uv && !geometry.attributes.uv2) {
    geometry.setAttribute('uv2', geometry.attributes.uv);
  }
  return geometry;
}

export function cloneTexture(sourceTex, repeatX = 1, repeatZ = 1) {
  if (!sourceTex) return null;
  const tex = sourceTex.clone();
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatZ);
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

export function getPbrTextures() {
  if (_pbrTextures) return _pbrTextures;

  const loadTex = (url, isColor = false) => {
    try {
      const tex = textureLoader.load(url);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 16;
      if (isColor && THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      return tex;
    } catch {
      return null;
    }
  };

  // Vite serves public/ folder at root
  const asphaltDiff = loadTex('/textures/asphalt_pit_lane_diff_1k.jpg', true);
  const asphaltNor = loadTex('/textures/asphalt_pit_lane_nor_gl_1k.jpg', false);
  const asphaltArm = loadTex('/textures/asphalt_pit_lane_arm_1k.jpg', false);

  const grassDiff = loadTex('/textures/leafy_grass_diff_1k.jpg', true);
  const grassNor = loadTex('/textures/leafy_grass_nor_gl_1k.jpg', false);
  const grassArm = loadTex('/textures/leafy_grass_arm_1k.jpg', false);

  _pbrTextures = {
    asphalt: { diff: asphaltDiff, nor: asphaltNor, arm: asphaltArm },
    grass: { diff: grassDiff, nor: grassNor, arm: grassArm }
  };
  return _pbrTextures;
}

/**
 * Tạo Material nhựa đường PBR chân thực (Poly Haven Asphalt Pit Lane)
 * Giữ nguyên màu gốc ảnh diffuse và bổ sung 16x Anisotropic filtering + AO Map
 */
export function createPbrRoadMaterial({
  repeatX = 6,
  repeatZ = 800,
  roughness = 0.82,
  metalness = 0.05,
  wet = false,
  color = 0xffffff
} = {}) {
  const pbr = getPbrTextures();

  const diff = pbr.asphalt.diff ? cloneTexture(pbr.asphalt.diff, repeatX, repeatZ) : createRoadTexture();
  const nor = pbr.asphalt.nor ? cloneTexture(pbr.asphalt.nor, repeatX, repeatZ) : null;
  const arm = pbr.asphalt.arm ? cloneTexture(pbr.asphalt.arm, repeatX, repeatZ) : null;

  const matParams = {
    map: diff,
    roughness: wet ? 0.22 : roughness,
    metalness: wet ? 0.35 : metalness,
    color: color
  };

  if (nor) {
    matParams.normalMap = nor;
    matParams.normalScale = new THREE.Vector2(0.85, 0.85);
  }
  if (arm) {
    matParams.roughnessMap = arm;
    matParams.aoMap = arm;
    matParams.aoMapIntensity = 0.85;
  }

  return new THREE.MeshStandardMaterial(matParams);
}

/**
 * Tạo Material thảm cỏ PBR tự nhiên (Poly Haven Leafy Grass)
 * Tỉ lệ thực tế ~2m x 2m mỗi ô, giữ nguyên màu lá cỏ xanh tự nhiên không bị chói neon
 */
export function createPbrGrassMaterial({
  repeatX = 200,
  repeatZ = 800,
  color = 0xffffff
} = {}) {
  const pbr = getPbrTextures();

  const diff = pbr.grass.diff ? cloneTexture(pbr.grass.diff, repeatX, repeatZ) : createGrassTexture();
  const nor = pbr.grass.nor ? cloneTexture(pbr.grass.nor, repeatX, repeatZ) : null;
  const arm = pbr.grass.arm ? cloneTexture(pbr.grass.arm, repeatX, repeatZ) : null;

  const matParams = {
    map: diff,
    roughness: 0.88,
    metalness: 0.0,
    // Tint xanh Meadow sáng hơn (0x2d4a22 cũ rất tối làm cảnh xỉn)
    color: color === 0xffffff ? 0x5a7c44 : color
  };

  if (nor) {
    matParams.normalMap = nor;
    matParams.normalScale = new THREE.Vector2(0.4, 0.4);
  }
  if (arm) {
    matParams.roughnessMap = arm;
    matParams.aoMapIntensity = 0.05; // Disable heavy AO darkening on repeated tiles
  }

  return new THREE.MeshStandardMaterial(matParams);
}

/**
 * Tạo Material làn xe đạp đỏ (Radweg chuẩn StVO Đức)
 */
export function createBikeLaneMaterial({ repeatX = 1, repeatZ = 40 } = {}) {
  const pbr = getPbrTextures();
  const diff = pbr.asphalt.diff ? cloneTexture(pbr.asphalt.diff, repeatX, repeatZ) : createRoadTexture();
  const nor = pbr.asphalt.nor ? cloneTexture(pbr.asphalt.nor, repeatX, repeatZ) : null;

  return new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: nor,
    normalScale: new THREE.Vector2(0.5, 0.5),
    color: 0x991b1b, // Đỏ mận đặc trưng làn xe đạp Đức (như ảnh stadt2 & stadt8)
    roughness: 0.8,
    metalness: 0.05
  });
}

/**
 * Tạo Material vỉa hè lát đá khối Đức (Pflastersteine / Gehweg)
 */
export function createSidewalkMaterial({ repeatX = 2, repeatZ = 60 } = {}) {
  const pbr = getPbrTextures();
  const diff = pbr.asphalt.diff ? cloneTexture(pbr.asphalt.diff, repeatX, repeatZ) : createRoadTexture();
  const nor = pbr.asphalt.nor ? cloneTexture(pbr.asphalt.nor, repeatX, repeatZ) : null;
  const arm = pbr.asphalt.arm ? cloneTexture(pbr.asphalt.arm, repeatX, repeatZ) : null;

  return new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: nor,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: arm,
    aoMap: arm,
    aoMapIntensity: 0.8,
    color: 0x788596, // Bê tông xám phiến vỉa hè Đức (Gehwegplatten) - chống chói lóa mắt
    roughness: 0.90,
    metalness: 0.02
  });
}

/**
 * Tạo Material lát đá cuội cho khu đỗ xe & 30-Zone (Kopfsteinpflaster)
 */
export function createCobblestoneMaterial({ repeatX = 2, repeatZ = 10 } = {}) {
  const pbr = getPbrTextures();
  const diff = pbr.asphalt.diff ? cloneTexture(pbr.asphalt.diff, repeatX, repeatZ) : createRoadTexture();
  const nor = pbr.asphalt.nor ? cloneTexture(pbr.asphalt.nor, repeatX, repeatZ) : null;
  const arm = pbr.asphalt.arm ? cloneTexture(pbr.asphalt.arm, repeatX, repeatZ) : null;

  return new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: nor,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: arm,
    aoMap: arm,
    aoMapIntensity: 0.9,
    color: 0x64748b, // Đá phiến sỏi cuội sẫm tự nhiên (như ảnh 30zone.jpg)
    roughness: 0.9,
    metalness: 0.03
  });
}

export function createGrassTexture() {
  if (textureCache.has('grass')) return textureCache.get('grass');

  const pbr = getPbrTextures();
  if (pbr.grass.diff) {
    textureCache.set('grass', pbr.grass.diff);
    return pbr.grass.diff;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1b431c'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(34, 110, 34, 0.35)';
    for (let i = 0; i < 1000; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(120, 900);
  tex.anisotropy = 16;
  textureCache.set('grass', tex);
  return tex;
}

export function createRoadTexture() {
  if (textureCache.has('road')) return textureCache.get('road');

  const pbr = getPbrTextures();
  if (pbr.asphalt.diff) {
    textureCache.set('road', pbr.asphalt.diff);
    return pbr.asphalt.diff;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1c2026'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#2b3039';
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(8, 0, 8, 512);
    ctx.fillRect(496, 0, 8, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 400);
  tex.anisotropy = 16;
  textureCache.set('road', tex);
  return tex;
}

export function createBuildingFacadeTexture(baseHexColor, styleIdx) {
  const cacheKey = `facade_${styleIdx % 3}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseColor = '#' + (baseHexColor || 0x64748b).toString(16).padStart(6, '0');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  const style = styleIdx % 3;
  if (style === 0) {
    // Glass Skyscraper
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
        ctx.fillStyle = Math.random() > 0.3 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.5)';
        ctx.fillRect(x, y, 22, 28);
      }
    }
  } else if (style === 1) {
    // Classic German City Building with windows (Altbau / Klinkerbau)
    for (let y = 30; y < 420; y += 50) {
      for (let x = 20; x < 480; x += 44) {
        ctx.fillStyle = Math.random() > 0.2 ? '#fef08a' : '#1e293b';
        ctx.fillRect(x, y, 26, 32);
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 26, 32);
      }
    }
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 430, 512, 82);
    for (let s = 16; s < 480; s += 90) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(s, 444, 70, 56);
    }
  } else {
    // Modern Architectural Block
    for (let y = 24; y < 480; y += 60) {
      for (let x = 24; x < 480; x += 70) {
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
  tex.anisotropy = 16;
  textureCache.set(cacheKey, tex);
  return tex;
}

export function createSkyGradientTexture() {
  if (textureCache.has('sky')) return textureCache.get('sky');

  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(0.82, '#7dd3fc');
    grad.addColorStop(1.0, '#cbd5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('sky', tex);
  return tex;
}
