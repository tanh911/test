// 🌍 Terrain + Skybox — Protocol mục 4.8
import * as THREE from 'three';
import { palette } from '../art/palette';

/** Mặt phẳng lớn màu cỏ/đất ngoài khu đô thị, y = -0.05 */
export function createTerrain(scene: THREE.Scene, size = 2000): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshLambertMaterial({ color: palette.grass });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  ground.name = 'terrain';
  scene.add(ground);
  return ground;
}

/** Trời gradient sky_top → sky_horizon + vài đám mây billboard */
export function createSkybox(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(900, 24, 12);
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

/** Sương mù tuyến tính 120 m → 350 m để che pop-in */
export function applyFog(scene: THREE.Scene): void {
  scene.fog = new THREE.Fog(palette.skyHorizon, 120, 350);
}
