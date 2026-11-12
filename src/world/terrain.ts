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

/** Trời gradient + vầng mặt trời + mây thủ tục (procedural clouds).
 *  QUAN TRỌNG: fog của three.js trộn SAU chunk tonemapping/colorspace — màu fog
 *  hiển thị = giá trị LINEAR thô của hex. ShaderMaterial tự viết không qua
 *  tonemapping/colorspace chunk → output raw linear Y HỆT fog → chân trời khớp
 *  tuyệt đối với vật thể hoà sương, không seam. Tuyệt đối KHÔNG thêm ACES/sRGB
 *  vào shader này nếu không sẽ hở seam trời–đất. */
export function createSkybox(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.SphereGeometry(3000, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(palette.skyTop) },
      horizonColor: { value: new THREE.Color(palette.skyHorizon) },
      sunDir: { value: new THREE.Vector3(140, 200, 90).normalize() },
      sunColor: { value: new THREE.Color(0xfff0d0) },
      uTime: { value: 0 }
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
      uniform vec3 sunDir;
      uniform vec3 sunColor;
      uniform float exposure;
      uniform float uTime;
      varying vec3 vWorldPos;

      // ── Value noise 2 octave cho mây mềm ──
      float hash12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
          mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        return 0.55 * vnoise(p) + 0.30 * vnoise(p * 2.13 + 17.7) + 0.15 * vnoise(p * 4.41 + 43.1);
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = dir.y;
        // Giữ NGUYÊN màu skyHorizon quanh chân trời (h <= 0.06) để khớp 100% với
        // fog màu skyHorizon — trên đó gradient mượt lên skyTop.
        float t = smoothstep(0.06, 0.9, h);
        vec3 col = mix(horizonColor, topColor, t);

        float ndl = max(dot(dir, sunDir), 0.0);
        // Vầng hào quang quanh mặt trời (halo rộng + đĩa lõi)
        col += sunColor * pow(ndl, 6.0) * 0.22;
        col += sunColor * pow(ndl, 320.0) * 1.6;

        // ── Mây: chiếu hướng nhìn lên mặt phẳng y=1 trôi chậm theo gió ──
        if (h > 0.02) {
          vec2 cuv = dir.xz / max(dir.y, 0.06) * 0.42;
          float drift = uTime * 0.004;
          float d1 = fbm(cuv * 0.55 + vec2(drift, drift * 0.4));
          float d2 = fbm(cuv * 1.3 + vec2(-drift * 1.6, drift * 0.7) + 5.2);
          float cover = smoothstep(0.48, 0.78, d1 * 0.72 + d2 * 0.28);
          // fade mây tan dần gần chân trời + nhạt dần khi nhìn ngang
          cover *= smoothstep(0.02, 0.22, h);
          vec3 cloudLit = vec3(1.15, 1.14, 1.12);
          vec3 cloudDark = vec3(0.82, 0.84, 0.90);
          // đáy mây tối hơn (chiều dày) — sample d1 lệch hướng mặt trời làm bóng
          float thick = smoothstep(0.5, 0.85, d1);
          vec3 cloudCol = mix(cloudLit, cloudDark, thick * 0.55);
          // viền mây hướng mặt trời ấm lên
          cloudCol += sunColor * pow(ndl, 3.0) * 0.25 * (1.0 - thick);
          col = mix(col, cloudCol, cover * 0.92);
        }

        // Output RAW linear — khớp fog (three trộn fog sau colorspace, giá trị thô)
        gl_FragColor = vec4(col, 1.0);
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
