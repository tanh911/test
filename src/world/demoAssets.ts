// 🚗 demoAssets.ts — load GLB assets (Prompt 5) vào scene /sim-dev để verify G4
// Quy ước GLB: mặt trước −Z khi rotation=0 (protocol mục 1).
// Đặt xe đúng làn lưu thông: heading h → rotation.y = h + π.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap } from './mapLoader';

export interface DemoAssetsResult {
  group: THREE.Group;
  dispose: () => void;
}

function loadGLB(loader: GLTFLoader, url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
  });
}

/** Đặt xe dọc road: s = mét từ đầu road, laneOff = lệch phải flow (m), h = heading flow */
function carTransform(x: number, z: number, heading: number, laneOff: number): { pos: [number, number, number]; rotY: number } {
  const rx = -Math.cos(heading); // phải flow = (−cos h, sin h)
  const rz = Math.sin(heading);
  return {
    pos: [x + rx * laneOff, 0, z + rz * laneOff],
    rotY: heading + Math.PI
  };
}

export async function loadDemoAssets(scene: THREE.Scene, map: GameMap): Promise<DemoAssetsResult> {
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.name = 'demoAssets_v2';

  const urls = [
    '/simv2/car_player.glb',
    '/simv2/car_npc_sedan_red.glb',
    '/simv2/car_npc_kombi_grey.glb',
    '/simv2/car_npc_suv_blue.glb',
    '/simv2/car_npc_transporter_white.glb',
    '/simv2/tram.glb',
    ...Array.from({ length: 8 }, (_, i) => `/simv2/ped_${i + 1}.glb`)
  ];
  const loaded = await Promise.all(urls.map(u => loadGLB(loader, u).catch(() => null)));
  const [player, sedan, kombi, suv, transporter, tram, ...peds] = loaded;

  const place = (obj: THREE.Group | null, x: number, z: number, rotY = 0, scale = 1) => {
    if (!obj) return;
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    obj.scale.setScalar(scale);
    obj.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    group.add(obj);
  };

  // xe người chơi: r4 (nam), s=20 → (0,60), làn phải hướng bắc (flow (0,−1), h=π) → laneOff 1.5 về đông
  const r4heading = Math.PI; // flow (0,−1)
  const p = carTransform(0, 60, r4heading, 1.5);
  place(player, p.pos[0], p.pos[2], p.rotY);

  // sedan đỏ: r1 (đông), s=30 → (30,0), flow (1,0) h=π/2 → làn phải = phía nam z+1.5
  const s = carTransform(30, 0, Math.PI / 2, 1.5);
  place(sedan, s.pos[0], s.pos[2], s.rotY);

  // kombi: r3 (tây) → (−50,0), flow đông h=π/2, làn phải z+1.5
  const k = carTransform(-50, 0, Math.PI / 2, 1.5);
  place(kombi, k.pos[0], k.pos[2], k.rotY);

  // suv đỗ r1 phía nam: x=20, z=2.05, hướng đông
  const su2 = carTransform(20, 2.05, Math.PI / 2, 0);
  place(suv, su2.pos[0], su2.pos[2], su2.rotY);

  // transporter: r2 hướng nam (flow (0,1), h=0) tại (0,−25), làn phải = tây x−1.5
  const t = carTransform(0, -25, 0, 1.5);
  place(transporter, t.pos[0], t.pos[2], t.rotY);

  // tram: r3 giữa (−45, 0), dọc đường đông-tây, đầu về tây
  place(tram, -45, 0, Math.PI / 2);

  // người đi bộ trên vỉa hè
  if (peds[0]) place(peds[0], -4.2, -15, Math.PI / 2);   // vỉa hè tây r2, nhìn đông
  if (peds[1]) place(peds[1], -4.6, -18, Math.PI * 0.8);
  if (peds[2]) place(peds[2], 25, 4.3, 0);               // vỉa hè nam r1
  if (peds[3]) place(peds[3], 27, 4.5, -Math.PI / 2);
  if (peds[4]) place(peds[4], 4.3, 12, Math.PI);         // vỉa hè đông r4
  if (peds[5]) place(peds[5], 4.6, 16, Math.PI * 1.2);
  if (peds[6]) place(peds[6], -25, 4.4, Math.PI / 2);
  if (peds[7]) place(peds[7], -28, 4.6, Math.PI * 0.9);

  scene.add(group);
  return {
    group,
    dispose: () => {
      group.traverse(o => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => m?.dispose());
        }
      });
      scene.remove(group);
    }
  };
}
