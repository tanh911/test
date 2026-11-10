// 🌍 Terrain + Skybox — Protocol mục 4.8
import * as THREE from 'three';
import { palette } from '../art/palette';

/** Mặt phẳng địa hình: nền cỏ ngoại ô (y = -0.055) + lớp đá lát quảng trường/sân trong Altstadt (y = -0.045) */
export function createTerrain(scene: THREE.Scene, size = 5000): THREE.Mesh {
  const group = new THREE.Group();
  group.name = 'terrain_group';

  // 1. Nền cỏ xanh tự nhiên ngoại vi thành phố xa (y = -0.055)
  const geoOuter = new THREE.PlaneGeometry(size, size);
  const matOuter = new THREE.MeshLambertMaterial({ color: palette.grass });
  const groundOuter = new THREE.Mesh(geoOuter, matOuter);
  groundOuter.rotation.x = -Math.PI / 2;
  groundOuter.position.y = -0.055;
  groundOuter.receiveShadow = true;
  groundOuter.name = 'terrain_outer_grass';
  group.add(groundOuter);

  // 2. Lớp đá lát quảng trường/phố đi bộ/sân trong Altstadt (y = -0.045, kích thước 2600x2600m)
  // Phủ kín toàn bộ vùng Altstadt và các vùng lân cận, không còn khoảng cỏ hoang lộ ra giữa phố
  const plazaSize = 2600;
  const geoPlaza = new THREE.PlaneGeometry(plazaSize, plazaSize);
  const matPlaza = new THREE.MeshLambertMaterial({ color: palette.plazaStone });
  const groundPlaza = new THREE.Mesh(geoPlaza, matPlaza);
  groundPlaza.rotation.x = -Math.PI / 2;
  groundPlaza.position.y = -0.045;
  groundPlaza.receiveShadow = true;
  groundPlaza.name = 'terrain_altstadt_plaza';
  group.add(groundPlaza);

  scene.add(group);
  return groundOuter;
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
        float t = clamp(h * 2.2 + 0.18, 0.0, 1.0);
        gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
      }
    `
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'skybox';
  scene.add(sky);
  return sky;
}

/** Sương mù che đường chân trời mượt mà, đồng màu với skyHorizon */
export function applyFog(scene: THREE.Scene): void {
  scene.fog = new THREE.Fog(palette.skyHorizon, 250, 1400);
}
