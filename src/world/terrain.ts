// 🌍 Terrain + Skybox — Protocol mục 4.8
import * as THREE from 'three';
import { palette } from '../art/palette';

/** Mặt phẳng địa hình: nền cỏ ngoại ô (y = -0.055) + lớp đá lát quảng trường/sân trong Altstadt (y = -0.045).
 *  Cỏ là KHUNG 4 dải bao quanh plaza — KHÔNG chồng lấn: 2 mặt phẳng chồng nhau chỉ cách 1 cm
 *  sẽ z-fighting thành sọc moiré khi nhìn từ trên cao (depth precision ở 500 m chỉ còn ~5 cm). */
export function createTerrain(scene: THREE.Scene, size = 5000): THREE.Group {
  const group = new THREE.Group();
  group.name = 'terrain_group';

  const matGrass = new THREE.MeshLambertMaterial({ color: palette.grass });
  const matPlaza = new THREE.MeshLambertMaterial({ color: palette.plazaStone });
  const half = size / 2;
  const plazaHalf = 1300; // plaza 2600×2600
  const frameDepth = half - plazaHalf; // 1200 m

  const addStrip = (w: number, h: number, x: number, z: number, name: string, mat: THREE.Material): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, mat === matPlaza ? -0.045 : -0.055, z);
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };

  // 1. Lớp đá lát quảng trường/phố đi bộ trong Altstadt (2600×2600, y = -0.045)
  addStrip(plazaHalf * 2, plazaHalf * 2, 0, 0, 'terrain_altstadt_plaza', matPlaza);
  // 2. Nền cỏ 4 dải bao quanh — bắc/nam phủ hết chiều x, đông/tây lấp hai bên hông
  addStrip(size, frameDepth, 0, -(plazaHalf + frameDepth / 2), 'terrain_grass_north', matGrass);
  addStrip(size, frameDepth, 0, plazaHalf + frameDepth / 2, 'terrain_grass_south', matGrass);
  addStrip(frameDepth, plazaHalf * 2, -(plazaHalf + frameDepth / 2), 0, 'terrain_grass_west', matGrass);
  addStrip(frameDepth, plazaHalf * 2, plazaHalf + frameDepth / 2, 0, 'terrain_grass_east', matGrass);

  scene.add(group);
  return group;
}

/** Trời gradient sky_top → sky_horizon */
export function createSkybox(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(3000, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(palette.skyTop) },
      horizonColor: { value: new THREE.Color(palette.skyHorizon) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        // Giữ NGUYÊN màu skyHorizon quanh chân trời (h <= 0.06) để khớp 100% với
        // fog màu skyHorizon — không còn seam "rìa hành tinh"; trên đó gradient mượt lên skyTop.
        float t = smoothstep(0.06, 0.9, h);
        gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'skybox';
  scene.add(sky);
  return sky;
}

/** Sương mù che đường chân trời mượt mà, đồng màu với skyHorizon.
 *  Trả về THREE.Fog để host cập nhật near/far theo độ cao camera mỗi frame:
 *  nhìn từ trên cao (fly/aerial) fog phải lùi ra xa, không nuốt cả thành phố. */
export function applyFog(scene: THREE.Scene): THREE.Fog {
  const fog = new THREE.Fog(palette.skyHorizon, 250, 1400);
  scene.fog = fog;
  return fog;
}
