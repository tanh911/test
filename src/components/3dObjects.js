import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── 1. Tạo hình ảnh texture bóng gầm xe (Contact Shadow) bằng Canvas ──────────
function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(128, 256, 10, 128, 256, 200);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.5)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ── 2. Cockpit Interior Setup (Sạch sẽ, không vẽ vô-lăng giả đè GLB) ──────────
export function create3DCockpit(scene, playerCar) {
  const cockpit = new THREE.Group();

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, -0.32, -0.55);
  cockpit.add(wheelGroup);

  const stalkGroup = new THREE.Group();
  wheelGroup.add(stalkGroup);

  const wiperGroup = new THREE.Group();
  wiperGroup.position.set(-0.25, -0.38, -0.65);
  wiperGroup.rotation.z = -1.2;

  const wiperBladeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
  const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.45, 0.01), wiperBladeMat);
  wiperArm.position.set(0, 0.22, 0);
  wiperGroup.add(wiperArm);

  cockpit.add(wiperGroup);

  playerCar.add(cockpit);
  cockpit.position.set(-0.45, 1.22, -1.68);

  return { cockpit, wheelGroup, stalkGroup, wiperGroup };
}

// ── 2.1 Cadillac Eldorado Cockpit (GLB) ──────────────────────────────────────
export function createCadillacCockpit(scene, playerCar) {
  const cockpit = new THREE.Group();
  const wheelGroup = new THREE.Group();
  const stalkGroup = new THREE.Group();
  const wiperGroup = new THREE.Group();

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    '/models/cadillac_eldorado_cockpit.glb',
    (gltf) => {
      const cadillacCockpit = gltf.scene;
      
      // Adjust position and rotation
      cadillacCockpit.position.set(0, 0, 0);
      cadillacCockpit.rotation.set(0, 0, 0);
      cadillacCockpit.scale.set(1, 1, 1);

      // Configure shadows
      cadillacCockpit.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      cockpit.add(cadillacCockpit);
      console.log("✅ Cadillac Eldorado Cockpit loaded!");
    },
    undefined,
    (error) => {
      console.error('❌ Error loading Cadillac cockpit:', error);
    }
  );

  playerCar.add(cockpit);
  cockpit.position.set(-0.45, 1.22, -1.68);

  return { cockpit, wheelGroup, stalkGroup, wiperGroup };
}

// Cache GLTF Toyota Corolla model in memory to prevent reload delays
let cachedCorollaGLTF = null;
let corollaLoadingPromise = null;

// ── 3. Player Car Builder (2014 Toyota Corolla EU with Interior) ─────────────
export function create3DPlayerCar(scene, onCarLoaded, onProgress) {
  const carGroup = new THREE.Group();

  // Đèn phanh sau
  const brakeLightPointL = new THREE.PointLight(0xef4444, 0.5, 8);
  brakeLightPointL.position.set(-0.75, 0.58, 0.96);
  carGroup.add(brakeLightPointL);

  const brakeLightPointR = new THREE.PointLight(0xef4444, 0.5, 8);
  brakeLightPointR.position.set(0.75, 0.58, 0.96);
  carGroup.add(brakeLightPointR);

  // Đèn xi-nhan
  const blinkerLightPointL = new THREE.PointLight(0xf59e0b, 0, 6);
  blinkerLightPointL.position.set(-0.88, 0.58, 0.96);
  carGroup.add(blinkerLightPointL);

  const blinkerLightPointR = new THREE.PointLight(0xf59e0b, 0, 6);
  blinkerLightPointR.position.set(0.88, 0.58, 0.96);
  carGroup.add(blinkerLightPointR);

  // Đèn pha trước
  const headLightL = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 5, 0.4, 1);
  headLightL.position.set(-0.75, 0.54, -3.78);
  headLightL.target.position.set(-0.75, 0.1, -45);
  carGroup.add(headLightL);
  carGroup.add(headLightL.target);

  const headLightR = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 5, 0.4, 1);
  headLightR.position.set(0.75, 0.54, -3.78);
  headLightR.target.position.set(0.75, 0.1, -45);
  carGroup.add(headLightR);
  carGroup.add(headLightR.target);

  // Contact Shadow Plane dưới gầm xe (sát mặt đường Y=0.015)
  const shadowGeo = new THREE.PlaneGeometry(2.6, 5.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.85
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.015, -1.45);
  carGroup.add(shadowMesh);

  // ── 1. Màn hình đồng hồ kỹ thuật số công tơ mét (Multi-Information Screen giữa 2 cụm đồng hồ vô lăng) ──
  const smalScreenCanvas = document.createElement('canvas');
  smalScreenCanvas.width = 256;
  smalScreenCanvas.height = 384;
  const smalScreenCtx = smalScreenCanvas.getContext('2d');
  const smalScreenTexture = new THREE.CanvasTexture(smalScreenCanvas);
  smalScreenTexture.minFilter = THREE.LinearFilter;
  smalScreenTexture.magFilter = THREE.LinearFilter;

  const smalScreenMat = new THREE.MeshBasicMaterial({
    map: smalScreenTexture,
    toneMapped: false
  });
  carGroup._smalScreenCanvas = smalScreenCanvas;
  carGroup._smalScreenCtx = smalScreenCtx;
  carGroup._smalScreenTexture = smalScreenTexture;
  carGroup._smalScreenMat = smalScreenMat;

  // ── 2. Màn hình giải trí & định vị GPS trung tâm (Center Console Infotainment) ──
  const navScreenCanvas = document.createElement('canvas');
  navScreenCanvas.width = 512;
  navScreenCanvas.height = 256;
  const navScreenCtx = navScreenCanvas.getContext('2d');
  const navScreenTexture = new THREE.CanvasTexture(navScreenCanvas);
  navScreenTexture.minFilter = THREE.LinearFilter;
  navScreenTexture.magFilter = THREE.LinearFilter;

  const navScreenMat = new THREE.MeshBasicMaterial({
    map: navScreenTexture,
    toneMapped: false
  });
  carGroup._navScreenCanvas = navScreenCanvas;
  carGroup._navScreenCtx = navScreenCtx;
  carGroup._navScreenTexture = navScreenTexture;
  carGroup._navScreenMat = navScreenMat;

  // Khởi tạo đồ họa hiển thị ban đầu
  drawSmallClusterScreen(smalScreenCtx, { speed: 0, rpm: 800, gear: 'P', headlights: false, handbrake: false });
  smalScreenTexture.needsUpdate = true;
  drawInfotainmentScreen(navScreenCtx, { speed: 0, rpm: 800, distanceTraveled: 0, scenarioName: 'Sa hình StVO' });
  navScreenTexture.needsUpdate = true;

  // ── Procedural Fallback Sedan Chassis (Ẩn hoàn toàn, không bao giờ hiện khung hộp đen) ──
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'proceduralChassisFrame';
  chassisGroup.visible = false; // Luôn ẩn, ngăn không cho khối hộp đen hiện lên mặt đường
  carGroup.add(chassisGroup);
  carGroup._proceduralChassis = chassisGroup;

  function attachCorollaModel(gltf) {
    // Ẩn khung xe fallback ngay khi GLB Toyota Corolla nạp xong
    if (carGroup._proceduralChassis) {
      carGroup._proceduralChassis.visible = false;
    }
    const carModel = gltf.scene.clone(true);
    const boxRaw = new THREE.Box3().setFromObject(carModel);
    const sizeRaw = new THREE.Vector3();
    boxRaw.getSize(sizeRaw);
    const centerRaw = new THREE.Vector3();
    boxRaw.getCenter(centerRaw);

    const targetLength = 4.65;
    const rawLen = Math.max(sizeRaw.x, sizeRaw.y, sizeRaw.z);
    const baseScale = targetLength / Math.max(rawLen, 0.001);

    const carModelWrapper = new THREE.Group();
    // Đặt đáy lốp xe chuẩn tiếp đất Y = 0 (loại bỏ hoàn toàn tình trạng xe bay lơ lửng)
    const wheelBottomY = -0.0062;
    carModel.position.set(-centerRaw.x, -wheelBottomY, -centerRaw.z);
    carModelWrapper.add(carModel);

    carModelWrapper._baseScale = baseScale;
    carModelWrapper.scale.set(baseScale, baseScale, baseScale);
    carModelWrapper.rotation.y = Math.PI;
    carModelWrapper.position.set(0, 0, 0);

    // Quét tìm bộ phận GLB Toyota Corolla
    let wheelMergedNode = null;
    carModel.traverse((child) => {
      const nodeName = child.name || '';

      // 1. Quét tìm Vô-lăng (corolla_e180_steering_wheel) và giữ nguyên vị trí chuẩn CAD
      if (nodeName === 'corolla_e180_steering_wheel') {
        child._initialQuaternion = child.quaternion.clone();
        carGroup._glbSteeringWheel = child;
      }

      // 2. Màn hình đồng hồ công tơ mét kỹ thuật số giữa 2 đồng hồ vô-lăng
      if (nodeName === 'corolla_e180_dashboard_smal_screen_0') {
        child.material = carGroup._smalScreenMat;
      }

      // 3. Màn hình giải trí & định vị GPS táp-lô trung tâm
      if (nodeName === 'corolla_e180_dashboard.001_screen_0') {
        child.material = carGroup._navScreenMat;
      }

      // 4. Bánh xe GLB
      if (nodeName === 'corolla_e180_wheels') {
        wheelMergedNode = child;
      }

      // 5. Gương chiếu hậu trong cabin (corolla_e180_interior1_miror_0) & ngoại thất
      if (child.isMesh && nodeName === 'corolla_e180_interior1_miror_0') {
        child.geometry = child.geometry.clone();
        const geo = child.geometry;
        if (geo && geo.attributes && geo.attributes.position && geo.attributes.uv) {
          const posAttr = geo.attributes.position;
          const uvAttr = geo.attributes.uv;
          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            // Ánh xạ tọa độ phẳng chuẩn xác từ đỉnh 3D thực tế của gương cabin Toyota Corolla:
            // x thuộc [-0.8154 (phải), -0.5921 (trái)] -> uNorm thuộc [0, 1]
            // z thuộc [0.2407 (dưới/mặt đường), 0.2972 (trên/bầu trời)] -> vNorm thuộc [0, 1]
            const uNorm = (x - (-0.8154)) / (-0.5921 - (-0.8154));
            const vNorm = (z - 0.2407) / (0.2972 - 0.2407);
            uvAttr.setXY(i, Math.min(1, Math.max(0, uNorm)), Math.min(1, Math.max(0, vNorm)));
          }
          uvAttr.needsUpdate = true;
        }

        const mirrorMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          toneMapped: false,
          side: THREE.FrontSide
        });
        child.material = mirrorMat;
        carGroup._mirrorMaterial = mirrorMat;
      }
      else if (child.isMesh && (nodeName === 'corolla_e180_body_miror_0' || nodeName.includes('miror'))) {
        child.geometry = child.geometry.clone();
        const geo = child.geometry;
        if (geo && geo.attributes && geo.attributes.position && geo.attributes.uv) {
          const posAttr = geo.attributes.position;
          const uvAttr = geo.attributes.uv;
          for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            let uNorm, vNorm;
            if (x > 0) {
              // Gương chiếu hậu ngoài bên trái (tài xế - Local x > 0 do trục xe quay 180°)
              // x thuộc [0.7956 (trong sát thân xe), 1.0068 (ngoài nhìn làn vượt/điểm mù)]
              // z thuộc [0.9278 (đáy gương soi mặt đường), 1.0537 (đỉnh gương)]
              uNorm = (x - 0.7956) / (1.0068 - 0.7956);
              vNorm = (z - 0.9278) / (1.0537 - 0.9278);
            } else {
              // Gương chiếu hậu ngoài bên phải (phụ lái - Local x < 0)
              uNorm = (-0.7956 - x) / (1.0068 - 0.7956);
              vNorm = (z - 0.9278) / (1.0537 - 0.9278);
            }
            uvAttr.setXY(i, Math.min(1, Math.max(0, uNorm)), Math.min(1, Math.max(0, vNorm)));
          }
          uvAttr.needsUpdate = true;
        }

        const sideMirrorMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          toneMapped: false,
          side: THREE.FrontSide
        });
        child.material = sideMirrorMat;
        carGroup._sideMirrorMaterial = sideMirrorMat;
      }

      // 3. Nâng cấp Vật liệu sắc nét: Khử triệt để lỗi kính phát quang (emissiveStrength 2.3) từ GLB
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        const matArray = Array.isArray(child.material) ? child.material : [child.material];
        matArray.forEach((m) => {
          const matName = (m.name || '').toLowerCase();
          
          // Khử triệt để mọi emissiveStrength rác từ file CAD/Blender GLB
          if (m.emissive) {
            m.emissive.setHex(0x000000);
          }
          if (m.emissiveIntensity !== undefined) {
            m.emissiveIntensity = 0.0;
          }

          // 1. Kính xe & Kính chắn gió (Material.004 / windows / glass):
          // Khử hoàn toàn lỗi emissiveStrength: 2.3 từ GLB phát sáng chói lóa làm đục trắng tầm nhìn người lái
          if (nodeName.includes('windows') || matName === 'material.004' || matName.includes('window') || matName.includes('glass') || matName.includes('klosz')) {
            child.castShadow = false;
            child.receiveShadow = false;
            m.transparent = true;
            m.opacity = 0.0; // Trong suốt 100% khi lái xe trong cabin (khử hoàn toàn lớp màng sương trắng đục chắn trước mắt)
            m.roughness = 0.0;
            m.metalness = 0.0;
            if (m.color) m.color.setHex(0x000000);
            if (m.emissive) m.emissive.setHex(0x000000);
            m.emissiveIntensity = 0.0;
            m.side = THREE.FrontSide;
            m.depthWrite = false;
          }
          // 2. Sơn xe
          else if (matName.includes('main_paint')) {
            m.metalness = 0.85;
            m.roughness = 0.25;
          }
          // 3. Vật liệu nội thất & taplo: nhựa sần đen, da, ghế, bảng điều khiển taplo (M_dashboard / Material.020)
          else if (matName.includes('plastic') || matName.includes('leather') || matName.includes('fabric') || matName.includes('grainy') || matName.includes('seat') || matName.includes('steering') || matName.includes('dashboard') || matName === 'material.020') {
            m.roughness = 0.88;
            m.metalness = 0.04;
            if (m.color) {
              m.color.setHex(0x181a20); // Nhựa taplo màu than chì sang trọng, chuẩn Toyota Corolla
            }
            if (m.emissive) {
              m.emissive.setHex(0x000000);
            }
            m.emissiveIntensity = 0.0;
          }
          // 4. Màn hình LCD trung tâm (nếu có mesh khác ngoài dashboard)
          else if (matName === 'screen' || matName === 'smal_screen') {
            m.roughness = 0.5;
            m.metalness = 0.1;
            m.color = new THREE.Color(0x050811);
            m.emissive = new THREE.Color(0x000000);
            m.emissiveIntensity = 0.0;
          }
          else {
            m.roughness = 0.6;
          }
        });
      }
    });

    // 4. Tách và thiết lập 4 bánh xe độc lập (FL, FR, RL, RR) để bẻ lái và lăn bánh chân thực
    if (wheelMergedNode) {
      wheelMergedNode.updateMatrixWorld(true);
      const centers = {
        fl: new THREE.Vector3(0.609895, 0.303191, 1.252858),
        fr: new THREE.Vector3(-0.609895, 0.303191, 1.252858),
        rl: new THREE.Vector3(0.609895, 0.303191, -1.293368),
        rr: new THREE.Vector3(-0.609895, 0.303191, -1.293368),
      };

      const hubs = {
        fl: new THREE.Group(),
        fr: new THREE.Group(),
        rl: new THREE.Group(),
        rr: new THREE.Group(),
      };
      const rollGroups = {
        fl: new THREE.Group(),
        fr: new THREE.Group(),
        rl: new THREE.Group(),
        rr: new THREE.Group(),
      };

      ['fl', 'fr', 'rl', 'rr'].forEach((k) => {
        hubs[k].position.copy(centers[k]);
        hubs[k].add(rollGroups[k]);
        carModel.add(hubs[k]);
      });

      wheelMergedNode.children.forEach((mesh) => {
        mesh.updateMatrixWorld(true);
        const geo = mesh.geometry;
        const index = geo.index;
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const uv = geo.attributes.uv;

        if (!index || !pos) return;

        const triangles = { fl: [], fr: [], rl: [], rr: [] };

        for (let i = 0; i < index.count; i += 3) {
          const ia = index.getX(i), ib = index.getX(i + 1), ic = index.getX(i + 2);
          const va = new THREE.Vector3(pos.getX(ia), pos.getY(ia), pos.getZ(ia)).applyMatrix4(mesh.matrixWorld);
          const vb = new THREE.Vector3(pos.getX(ib), pos.getY(ib), pos.getZ(ib)).applyMatrix4(mesh.matrixWorld);
          const vc = new THREE.Vector3(pos.getX(ic), pos.getY(ic), pos.getZ(ic)).applyMatrix4(mesh.matrixWorld);
          const wz = (va.z + vb.z + vc.z) / 3;
          const wx = (va.x + vb.x + vc.x) / 3;
          const key = wz > 0 ? (wx > 0 ? 'fl' : 'fr') : (wx > 0 ? 'rl' : 'rr');

          triangles[key].push({
            posA: va, posB: vb, posC: vc,
            normA: norm ? new THREE.Vector3(norm.getX(ia), norm.getY(ia), norm.getZ(ia)).transformDirection(mesh.matrixWorld) : null,
            normB: norm ? new THREE.Vector3(norm.getX(ib), norm.getY(ib), norm.getZ(ib)).transformDirection(mesh.matrixWorld) : null,
            normC: norm ? new THREE.Vector3(norm.getX(ic), norm.getY(ic), norm.getZ(ic)).transformDirection(mesh.matrixWorld) : null,
            uvA: uv ? [uv.getX(ia), uv.getY(ia)] : null,
            uvB: uv ? [uv.getX(ib), uv.getY(ib)] : null,
            uvC: uv ? [uv.getX(ic), uv.getY(ic)] : null,
          });
        }

        ['fl', 'fr', 'rl', 'rr'].forEach((k) => {
          const triList = triangles[k];
          const count = triList.length;
          if (count === 0) return;

          const subPos = new Float32Array(count * 9);
          const subNorm = norm ? new Float32Array(count * 9) : null;
          const subUv = uv ? new Float32Array(count * 6) : null;

          for (let i = 0; i < count; i++) {
            const t = triList[i];
            const vA = t.posA.sub(centers[k]);
            const vB = t.posB.sub(centers[k]);
            const vC = t.posC.sub(centers[k]);

            subPos[i * 9] = vA.x; subPos[i * 9 + 1] = vA.y; subPos[i * 9 + 2] = vA.z;
            subPos[i * 9 + 3] = vB.x; subPos[i * 9 + 4] = vB.y; subPos[i * 9 + 5] = vB.z;
            subPos[i * 9 + 6] = vC.x; subPos[i * 9 + 7] = vC.y; subPos[i * 9 + 8] = vC.z;

            if (subNorm && t.normA) {
              subNorm[i * 9] = t.normA.x; subNorm[i * 9 + 1] = t.normA.y; subNorm[i * 9 + 2] = t.normA.z;
              subNorm[i * 9 + 3] = t.normB.x; subNorm[i * 9 + 4] = t.normB.y; subNorm[i * 9 + 5] = t.normB.z;
              subNorm[i * 9 + 6] = t.normC.x; subNorm[i * 9 + 7] = t.normC.y; subNorm[i * 9 + 8] = t.normC.z;
            }

            if (subUv && t.uvA) {
              subUv[i * 6] = t.uvA[0]; subUv[i * 6 + 1] = t.uvA[1];
              subUv[i * 6 + 2] = t.uvB[0]; subUv[i * 6 + 3] = t.uvB[1];
              subUv[i * 6 + 4] = t.uvC[0]; subUv[i * 6 + 5] = t.uvC[1];
            }
          }

          const subGeo = new THREE.BufferGeometry();
          subGeo.setAttribute('position', new THREE.BufferAttribute(subPos, 3));
          if (subNorm) subGeo.setAttribute('normal', new THREE.BufferAttribute(subNorm, 3));
          if (subUv) subGeo.setAttribute('uv', new THREE.BufferAttribute(subUv, 2));

          const subMesh = new THREE.Mesh(subGeo, mesh.material);
          subMesh.castShadow = true;
          subMesh.receiveShadow = true;
          rollGroups[k].add(subMesh);
        });
      });

      wheelMergedNode.visible = false;

      // 2 bánh trước bẻ lái quanh trục Y
      carGroup._glbFrontWheels = [hubs.fl, hubs.fr];
      // Cả 4 bánh lăn quanh trục X theo tốc độ xe
      carGroup._glbAllWheels = [rollGroups.fl, rollGroups.fr, rollGroups.rl, rollGroups.rr];
    }

    carGroup.add(carModelWrapper);
    carGroup._mercedesModel = carModelWrapper;
    console.log('🚗 Loaded 2014 Toyota Corolla EU with Interior successfully!');
    if (onCarLoaded) onCarLoaded(carGroup);
  }

  // Load hoặc lấy từ Cache RAM model GLB 2014 Toyota Corolla EU
  if (cachedCorollaGLTF) {
    if (onProgress) onProgress(100);
    attachCorollaModel(cachedCorollaGLTF);
  } else if (corollaLoadingPromise) {
    corollaLoadingPromise.then((gltf) => {
      if (onProgress) onProgress(100);
      attachCorollaModel(gltf);
    }).catch(err => {
      console.error('❌ Error loading Toyota Corolla GLB:', err);
      if (onCarLoaded) onCarLoaded(carGroup);
    });
  } else {
    const gltfLoader = new GLTFLoader();
    const modelUrl = '/models/2014_toyota_corolla_e180_eu_with_interior.glb';
    corollaLoadingPromise = new Promise((resolve, reject) => {
      gltfLoader.load(modelUrl, (gltf) => {
        cachedCorollaGLTF = gltf;
        if (onProgress) onProgress(100);
        resolve(gltf);
      }, (xhr) => {
        if (xhr && xhr.total > 0 && onProgress) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          onProgress(pct);
        }
      }, reject);
    });

    corollaLoadingPromise.then((gltf) => {
      attachCorollaModel(gltf);
    }).catch(err => {
      console.error('❌ Error loading Toyota Corolla GLB:', err);
      if (onCarLoaded) onCarLoaded(carGroup);
    });
  }

  carGroup._brakeL = brakeLightPointL;
  carGroup._brakeR = brakeLightPointR;
  carGroup._blinkerL = blinkerLightPointL;
  carGroup._blinkerR = blinkerLightPointR;
  carGroup._headLightL = headLightL;
  carGroup._headLightR = headLightR;

  // Thêm bounding box cho va chạm
  const hitbox = new THREE.Box3();
  carGroup._hitbox = hitbox;

  return carGroup;
}

// Cache GLTF models to avoid redundant network download and parsing freeze
const botModelCache = new Map();
const botLoadingPromises = new Map();

const isMobileDevice = typeof window !== 'undefined' && (
  ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0 && window.innerWidth < 1024) ||
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
);

const BOT_MODELS = isMobileDevice
  ? ['/models/car_bot5.glb'] // 3 MB - Siêu nhẹ, tiết kiệm 95% RAM & dữ liệu mạng trên điện thoại
  : [
      '/models/car_bot5.glb', // 3 MB - Nhẹ nhất, tối ưu 60 FPS tức thì (Hatchback đô thị)
      '/models/car_bot4.glb', // 12 MB - Sedan Đức gắn biển số StVO Châu Âu
      '/models/car_bot2.glb', // 11 MB - Coupe thể thao
      '/models/car_bot.glb',  // 21 MB - Audi thể thao
      '/models/car_bot3.glb'  // 13 MB - Sedan Châu Âu
    ];

export function preloadBotModels() {
  if (typeof window === 'undefined') return;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return;
  if (!window.location || (window.location.protocol !== 'http:' && window.location.protocol !== 'https:')) return;

  const gltfLoader = new GLTFLoader();

  // Nạp tuần tự giãn cách (staggered) để không làm nghẽn CPU, RAM & mạng lúc vừa vào game
  const loadModelAsync = (url, delayMs = 0) => {
    if (botModelCache.has(url) || botLoadingPromises.has(url)) return;
    const p = new Promise((resolve) => {
      setTimeout(() => {
        try {
          gltfLoader.load(
            url,
            (gltf) => {
              botModelCache.set(url, gltf.scene);
              resolve(gltf.scene);
            },
            undefined,
            () => resolve(null)
          );
        } catch {
          resolve(null);
        }
      }, delayMs);
    });
    p.catch(() => {});
    botLoadingPromises.set(url, p);
  };

  // Nạp ngay model nhẹ nhất (car_bot5: 3MB)
  loadModelAsync(BOT_MODELS[0], 0);
  // Trên desktop mới nạp ngầm các model khác; trên mobile chỉ dùng car_bot5 để tiết kiệm 57MB VRAM và chống giật
  if (!isMobileDevice) {
    for (let i = 1; i < BOT_MODELS.length; i++) {
      loadModelAsync(BOT_MODELS[i], i * 2000);
    }
  }
}

// Tự động preload ngầm các mô hình xe bot 3D
if (typeof window !== 'undefined') {
  preloadBotModels();
}

// ── 4. Traffic AI Car Builder (Sử dụng 5 mô hình car_bot.glb thật, chuẩn PBR, có Cache tối ưu) ────────────────
export function createTrafficAICar(modelIndex = 0, colorHex = 0xef4444) {
  const aiCarGroup = new THREE.Group();

  // Procedural body (Tải tức thì 0ms làm fallback, đảm bảo không bao giờ bị tàng hình trong lúc tải)
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7, roughness: 0.2 });
  const fallbackBody = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.7, 4.2), bodyMat);
  fallbackBody.position.y = 0.45;
  fallbackBody.castShadow = true;
  fallbackBody.name = 'proceduralFallbackBody';
  aiCarGroup.add(fallbackBody);

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), roofMat);
  roof.position.set(0, 0.95, -0.2);
  roof.castShadow = true;
  roof.name = 'proceduralRoof';
  aiCarGroup.add(roof);

  const modelUrl = BOT_MODELS[Math.abs(modelIndex) % BOT_MODELS.length];

  const applyBotModel = (sourceScene) => {
    if (!sourceScene) return;
    const fb = aiCarGroup.getObjectByName('proceduralFallbackBody');
    if (fb) aiCarGroup.remove(fb);
    const rf = aiCarGroup.getObjectByName('proceduralRoof');
    if (rf) aiCarGroup.remove(rf);

    const aiModel = sourceScene.clone(true);
    const boxRaw = new THREE.Box3().setFromObject(aiModel);
    const sizeRaw = new THREE.Vector3();
    boxRaw.getSize(sizeRaw);
    const centerRaw = new THREE.Vector3();
    boxRaw.getCenter(centerRaw);

    const targetLength = 4.5;
    const rawLen = Math.max(sizeRaw.x, sizeRaw.y, sizeRaw.z);
    const baseScale = targetLength / Math.max(rawLen, 0.001);

    const aiModelWrapper = new THREE.Group();
    aiModelWrapper.name = 'realBotCarModel';
    // Đặt mô hình ở vị trí cân bằng ngang và bánh chạm sát mặt đường (Y = 0)
    aiModel.position.set(-centerRaw.x, -boxRaw.min.y, -centerRaw.z);
    aiModelWrapper.add(aiModel);

    aiModelWrapper._baseScale = baseScale;
    aiModelWrapper.scale.set(baseScale, baseScale, baseScale);

    // Chuẩn hóa hướng tiến: car_bot4.glb mũi xe quay về -Z; car_bot 1, 2, 3, 5 mũi xe quay về +Z
    aiModelWrapper.rotation.y = modelUrl.includes('car_bot4') ? 0 : Math.PI;
    aiModelWrapper.position.set(0, 0, 0);

    aiModel.traverse((child) => {
      if (child.isMesh && child.material) {
        // 🚀 Tối ưu GPU: Chỉ vỏ xe đổ bóng (castShadow), tắt receiveShadow trên hàng chục chi tiết nội thất xe bot
        child.castShadow = true;
        child.receiveShadow = false;

        if (colorHex !== undefined && colorHex !== null) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          let replaced = false;
          const newMats = mats.map((m) => {
            const mName = (m.name || '').toLowerCase();
            if (
              mName === 'paint' ||
              mName === 'body' ||
              mName === 'team3_sanchez_carbody' ||
              mName.includes('bodyalbedo') ||
              mName.includes('mainalbedo') ||
              (modelUrl.includes('car_bot3') && mName === 'material')
            ) {
              const tinted = m.clone();
              tinted.color = new THREE.Color(colorHex);
              tinted.metalness = Math.max(tinted.metalness || 0, 0.6);
              tinted.roughness = Math.min(tinted.roughness || 1, 0.35);
              replaced = true;
              return tinted;
            }
            return m;
          });
          if (replaced) {
            child.material = Array.isArray(child.material) ? newMats : newMats[0];
          }
        }
      }
    });

    aiCarGroup._aiModel = aiModelWrapper;
    aiCarGroup.add(aiModelWrapper);

    // 🚨 ĐÈN HẬU / ĐÈN PHANH (kích hoạt emissive khi xe bot giảm tốc — cập nhật bởi TrafficAIManager)
    aiCarGroup.updateMatrixWorld(true);
    const groupBox = new THREE.Box3().setFromObject(aiCarGroup);
    const groupSize = new THREE.Vector3();
    groupBox.getSize(groupSize);
    if (Number.isFinite(groupSize.z) && groupSize.z > 0.5) {
      const brakeGeo = new THREE.BoxGeometry(
        Math.min(0.3, groupSize.x * 0.16),
        Math.min(0.11, groupSize.y * 0.09),
        0.05
      );
      const brakeY = groupBox.min.y + groupSize.y * 0.55;
      const brakeX = groupSize.x * 0.29;
      [-1, 1].forEach(side => {
        const brakeMat = new THREE.MeshStandardMaterial({
          color: 0x450a0a,
          emissive: 0xff1a1a,
          emissiveIntensity: 0.5,
          roughness: 0.25
        });
        const brakeMesh = new THREE.Mesh(brakeGeo, brakeMat);
        brakeMesh.position.set(brakeX * side, brakeY, groupBox.max.z + 0.025);
        aiCarGroup.add(brakeMesh);
        if (!aiCarGroup._brakeLights) aiCarGroup._brakeLights = [];
        aiCarGroup._brakeLights.push(brakeMesh);
      });
    }

    // 🛞 THU THẬP BÁNH XE (lăn theo tốc độ thật trong TrafficAIManager.update)
    // Trục quay = chiều có kích thước mỏng nhất của bánh (trục cầu xe).
    // Guard kích thước: bỏ qua mesh gộp nhiều bánh/đồ bằng cả gầm (ví dụ "Wheels_0" của Audi)
    if (!aiCarGroup._wheels) aiCarGroup._wheels = [];
    aiModel.traverse((child) => {
      if (!/wheel|tyre|tire|rad\b/i.test(child.name || '')) return;
      const wb = new THREE.Box3().setFromObject(child);
      const ws = new THREE.Vector3();
      wb.getSize(ws);
      if (ws.x < 0.01 && ws.z < 0.01) return;
      if (Math.max(ws.x, ws.y, ws.z) > 1.2) return; // Quá lớn so với 1 chiếc bánh → không xoay
      const axis = ws.x <= ws.z ? 'x' : 'z';
      aiCarGroup._wheels.push({ node: child, axis, base: child.rotation[axis] || 0 });
    });

    if (aiCarGroup._hitbox) {
      aiCarGroup._hitbox.setFromObject(aiCarGroup);
    }
  };

  if (botModelCache.has(modelUrl)) {
    applyBotModel(botModelCache.get(modelUrl));
  } else if (botLoadingPromises.has(modelUrl)) {
    botLoadingPromises.get(modelUrl).then(scene => {
      if (scene) applyBotModel(scene);
    }).catch(() => {});
  } else {
    const isBrowserHttp = typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:') && !(typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');
    if (isBrowserHttp) {
      const gltfLoader = new GLTFLoader();
      const loadPromise = new Promise((resolve) => {
        try {
          gltfLoader.load(modelUrl, (gltf) => {
            botModelCache.set(modelUrl, gltf.scene);
            resolve(gltf.scene);
          }, undefined, () => resolve(null));
        } catch {
          resolve(null);
        }
      });
      loadPromise.catch(() => {});
      botLoadingPromises.set(modelUrl, loadPromise);
      loadPromise.then(scene => {
        if (scene) applyBotModel(scene);
      }).catch(() => {});
    }
  }

  const hitbox = new THREE.Box3();
  aiCarGroup._hitbox = hitbox;

  return aiCarGroup;
}

// ── 5. German Traffic Sign Builder ───────────────────────────────────────────
export function createSignCanvasTexture(type, value = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (type === 'SPEED_LIMIT') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 26; ctx.strokeStyle = '#dc2626'; ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 115px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(value || '50'), 128, 130);
  } else if (type === 'STOP_SIGN') {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const x = 128 + 120 * Math.cos(angle);
      const y = 128 + 120 * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 70px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('STOP', 128, 130);
  }

  // 🚀 Cache texture theo type+value: nhiều biển cùng loại dùng chung 1 texture
  const cacheKey = `sign3d_${type}_${value}`;
  const cached = createSignCanvasTexture._cache && createSignCanvasTexture._cache.get(cacheKey);
  if (cached) return cached;
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  createSignCanvasTexture._cache = createSignCanvasTexture._cache || new Map();
  createSignCanvasTexture._cache.set(cacheKey, tex);
  return tex;
}

export function makeGermanSign(type, value = '') {
  const signGroup = new THREE.Group();
  signGroup.name = 'germanSignGroup';

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.25 })
  );
  pole.position.y = 1.6; pole.castShadow = true;
  signGroup.add(pole);

  const signHeight = 2.6;

  if (type === 'SPEED_LIMIT') {
    const signTex = createSignCanvasTexture('SPEED_LIMIT', value);
    const signMat = signTex._sharedMat || (signTex._sharedMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3, side: THREE.DoubleSide }));
    const signMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 32), signMat);
    signMesh.rotation.x = Math.PI / 2; signMesh.position.y = signHeight; signMesh.castShadow = true;
    signGroup.add(signMesh);
  } else if (type === 'STOP_SIGN') {
    const signTex = createSignCanvasTexture('STOP_SIGN');
    const signMat = signTex._sharedMat || (signTex._sharedMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3, side: THREE.DoubleSide }));
    const stopMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 8), signMat);
    stopMesh.rotation.x = Math.PI / 2; stopMesh.position.y = signHeight; stopMesh.castShadow = true;
    signGroup.add(stopMesh);
  } else if (type === 'VORFAHRT' || type === 'YIELD') {
    const outerTri = new THREE.Mesh(
      new THREE.CylinderGeometry(0.40, 0.40, 0.03, 3),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide })
    );
    outerTri.rotation.x = Math.PI / 2; outerTri.rotation.z = Math.PI; outerTri.position.y = signHeight; outerTri.castShadow = true;
    const innerTri = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.30, 0.035, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    innerTri.rotation.x = Math.PI / 2; innerTri.rotation.z = Math.PI; innerTri.position.y = signHeight;
    signGroup.add(outerTri); signGroup.add(innerTri);
  } else if (type === 'PRIORITY') {
    const prioBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.48, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    prioBox.rotation.z = Math.PI / 4; prioBox.position.y = signHeight; prioBox.castShadow = true;
    const innerYellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.36, 0.035),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    innerYellow.rotation.z = Math.PI / 4; innerYellow.position.y = signHeight;
    signGroup.add(prioBox); signGroup.add(innerYellow);
  } else {
    const infoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, side: THREE.DoubleSide })
    );
    infoMesh.position.y = signHeight; infoMesh.castShadow = true;
    signGroup.add(infoMesh);
  }
  return signGroup;
}

// ── 6. German StVO Traffic Light Builder (Lichtsignalanlage StVO § 37) ────────
// 🚦 Shared materials cho TrafficLight (tránh ~800 material riêng khi đặt 110 cột đèn)
const _tlMatCache = new Map();
function _tlMat(key, factory) {
  if (!_tlMatCache.has(key)) _tlMatCache.set(key, factory());
  return _tlMatCache.get(key);
}

export function makeTrafficLight(isRed = true) {
  const g = new THREE.Group();
  g.name = 'trafficLightGroup';

  // 1. Đế cột bê tông / gang đúc (Bodenflansch)
  const baseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12),
    _tlMat('base', () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }))
  );
  baseFlange.position.set(0, 0.175, 0);
  baseFlange.castShadow = true;
  g.add(baseFlange);

  // 2. Thân cột thép tiêu chuẩn StVO Đức (Mast Ø 16-18cm, cao 3.6m)
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 3.4, 12),
    _tlMat('mast', () => new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 }))
  );
  mast.position.set(0, 1.85, 0);
  mast.castShadow = true;
  g.add(mast);

  // Nắp đỉnh cột thép (Mastkappe)
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.08, 0.08, 12),
    _tlMat('box', () => new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }))
  );
  cap.position.set(0, 3.59, 0);
  g.add(cap);

  // 3. Tay đòn bắt hộp đèn vào thân cột
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.26),
    _tlMat('mast', () => new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 }))
  );
  bracket.position.set(0, 3.25, 0.13);
  g.add(bracket);

  // 4. Bảng tương phản viền trắng StVO tiêu chuẩn Đức (Kontrastblende)
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 1.45, 0.02),
    _tlMat('lens', () => new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 }))
  );
  backboard.position.set(0, 3.25, 0.26);
  g.add(backboard);

  // Viền trắng phản quang xung quanh mép bảng Kontrastblende
  const borderMat = _tlMat('border', () => new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
  const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.022), borderMat);
  bTop.position.set(0, 3.25 + 1.45 / 2 - 0.025, 0.261);
  g.add(bTop);
  const bBottom = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.022), borderMat);
  bBottom.position.set(0, 3.25 - 1.45 / 2 + 0.025, 0.261);
  g.add(bBottom);
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.45, 0.022), borderMat);
  bLeft.position.set(-0.58 / 2 + 0.025, 3.25, 0.261);
  g.add(bLeft);
  const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.45, 0.022), borderMat);
  bRight.position.set(0.58 / 2 - 0.025, 3.25, 0.261);
  g.add(bRight);

  // 5. Thân hộp đèn 3 buồng (Signalgeber-Gehäuse)
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 1.25, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
  );
  house.position.set(0, 3.25, 0.37);
  house.castShadow = true;
  g.add(house);

  // 6. Mặt thấu kính đèn tín hiệu LED chuẩn (Rộng 28cm, phát sáng cực đại)
  const redMat = new THREE.MeshStandardMaterial({
    color: isRed ? 0xff1111 : 0x330000,
    emissive: isRed ? 0xff0000 : 0x000000,
    emissiveIntensity: isRed ? 3.0 : 0,
    roughness: 0.2
  });
  const red = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), redMat);
  red.rotation.x = Math.PI / 2;
  red.position.set(0, 3.65, 0.48);
  red.name = 'redLight';
  g.add(red);

  const yelMat = new THREE.MeshStandardMaterial({
    color: 0x332200,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.2
  });
  const yel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), yelMat);
  yel.rotation.x = Math.PI / 2;
  yel.position.set(0, 3.25, 0.48);
  yel.name = 'yellowLight';
  g.add(yel);

  const grnMat = new THREE.MeshStandardMaterial({
    color: !isRed ? 0x00ff44 : 0x003311,
    emissive: !isRed ? 0x00ff44 : 0x000000,
    emissiveIntensity: !isRed ? 3.0 : 0,
    roughness: 0.2
  });
  const grn = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), grnMat);
  grn.rotation.x = Math.PI / 2;
  grn.position.set(0, 2.85, 0.48);
  grn.name = 'greenLight';
  g.add(grn);

  // 7. Mái che chống lóa mặt trời (Sonnenblenden)
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
  [3.65, 3.25, 2.85].forEach(yPos => {
    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.16, 12, 1, true, 0, Math.PI),
      visorMat
    );
    visor.rotation.x = Math.PI / 2;
    visor.rotation.z = Math.PI;
    visor.position.set(0, yPos + 0.04, 0.50);
    g.add(visor);
  });

  g._redLight = red;
  g._yelLight = yel;
  g._grnLight = grn;
  return g;
}

// ── 7. Digital Instrument Cluster Renderer (Màn hình đồng hồ kỹ thuật số buồng lái) ──
export function drawDigitalCluster(ctx, data = {}) {
  if (!ctx) return;
  const {
    speed = 0,
    rpm = 800,
    gear = 'D',
    blinkerL = false,
    blinkerR = false,
    headlights = false,
    handbrake = false,
    hazard = false,
    seatBelt = false,
    laneWarning = false,
    distanceTraveled = 0,
    speedLimit = 50,
    warning = null
  } = data;

  const W = 512, H = 256;
  ctx.clearRect(0, 0, W, H);

  // 1. Nền màn hình táp-lô carbon cao cấp
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#040711');
  bgGrad.addColorStop(0.5, '#080d1a');
  bgGrad.addColorStop(1, '#02050b');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(4, 4, W - 8, H - 8, 16);
  } else {
    ctx.rect(4, 4, W - 8, H - 8);
  }
  ctx.fill();

  // Viền màn hình mạ titan phát sáng nhẹ
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 2. Đồng hồ vòng tua máy RPM (Tachometer) bên trái
  const cxL = 125, cyL = 135, rL = 80;
  ctx.beginPath();
  ctx.arc(cxL, cyL, rL, 0.75 * Math.PI, 1.75 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  const maxRpm = 8000;
  const rpmRatio = Math.min(1, Math.max(0, rpm / maxRpm));
  const rpmAngle = 0.75 * Math.PI + rpmRatio * Math.PI;

  const rpmGrad = ctx.createLinearGradient(50, 150, 180, 80);
  rpmGrad.addColorStop(0, '#0284c7');
  rpmGrad.addColorStop(0.7, '#38bdf8');
  rpmGrad.addColorStop(1, '#ef4444');

  ctx.beginPath();
  ctx.arc(cxL, cyL, rL, 0.75 * Math.PI, rpmAngle);
  ctx.strokeStyle = rpmGrad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('x1000 RPM', cxL, cyL + 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  ctx.fillText((rpm / 1000).toFixed(1), cxL, cyL + 8);

  // 3. Đồng hồ tốc độ (Speedometer) bên phải
  const cxR = 387, cyR = 135, rR = 80;
  ctx.beginPath();
  ctx.arc(cxR, cyR, rR, 1.25 * Math.PI, 2.25 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  const maxSpeed = 220;
  const spdRatio = Math.min(1, Math.max(0, speed / maxSpeed));
  const spdAngle = 1.25 * Math.PI + spdRatio * Math.PI;

  const spdGrad = ctx.createLinearGradient(300, 80, 450, 150);
  spdGrad.addColorStop(0, '#38bdf8');
  spdGrad.addColorStop(0.6, '#eab308');
  spdGrad.addColorStop(1, '#ef4444');

  ctx.beginPath();
  ctx.arc(cxR, cyR, rR, 1.25 * Math.PI, spdAngle);
  ctx.strokeStyle = spdGrad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Biển báo tốc độ tối đa kiểu Châu Âu (Speed Limit Sign)
  ctx.beginPath();
  ctx.arc(cxR, cyR + 15, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ef4444';
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(speedLimit || 50), cxR, cyR + 21);

  // 4. Khu vực trung tâm: Tốc độ số lớn, Hộp số PRND
  const isOverSpeed = speed > (speedLimit || 50);
  ctx.fillStyle = isOverSpeed ? '#ef4444' : '#f8fafc';
  ctx.font = '900 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(speed)), 256, 128);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 13px sans-serif';
  ctx.fillText('KM/H', 256, 146);

  // Dãy số: P R N D
  const activeMode = gear.startsWith('D') ? 'D' : (gear === 'R' ? 'R' : gear === 'N' ? 'N' : 'P');
  const gears = ['P', 'R', 'N', 'D'];
  const startGx = 256 - 54;
  gears.forEach((g, idx) => {
    const gx = startGx + idx * 36;
    const isAct = activeMode === g;
    if (isAct) {
      ctx.fillStyle = g === 'R' ? '#b91c1c' : g === 'P' ? '#b45309' : g === 'N' ? '#334155' : '#1d4ed8';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(gx - 14, 156, 28, 22, 5);
      } else {
        ctx.rect(gx - 14, 156, 28, 22);
      }
      ctx.fill();
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#475569';
    }
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g, gx, 172);
  });

  // 5. Thanh cảnh báo & biểu tượng trên đỉnh màn hình (Tablo Icons)
  if (blinkerL) {
    ctx.fillStyle = '#22c55e';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◀', 36, 40);
  }
  if (blinkerR) {
    ctx.fillStyle = '#22c55e';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('▶', W - 36, 40);
  }

  // 🔴 Seat belt telltale
  if (!seatBelt) {
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔴 BELT', 150, 38);
  }

  // 🟡 Lane assist telltale
  ctx.fillStyle = laneWarning ? '#f59e0b' : '#38bdf8';
  ctx.font = '900 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(laneWarning ? '🟡 LANE' : '🟢 LANE', 205, 38);

  // 🔵 High beam telltale
  if (headlights) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔵 BEAM', 260, 38);
  }

  // (P) Phanh tay
  if (handbrake) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('(P)', 312, 38);
  }
  if (hazard) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️', 356, 38);
  }

  // 6. Cảnh báo thông điệp dưới chân màn hình (Bottom Banner)
  if (warning) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(130, 188, 252, 26, 6);
    } else {
      ctx.rect(130, 188, 252, 26);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(warning, 256, 205);
  } else {
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const odoKm = (distanceTraveled / 1000).toFixed(1);
    ctx.fillText(`TRIP: ${odoKm} km  |  FUEL: 85%  |  TEMP: 90°C`, 256, 204);
  }
}

// ── 8. Multi-Information Screen (Màn hình đồng hồ số buồng lái phong cách Digital Cockpit) ──
export function drawSmallClusterScreen(ctx, data = {}) {
  if (!ctx) return;
  const {
    speed = 0,
    rpm = 800,
    gear = 'P',
    blinkerL = false,
    blinkerR = false,
    headlights = false,
    handbrake = false,
    hazard = false,
    seatBelt = false,
    laneWarning = false,
    distanceTraveled = 0,
    speedLimit = 50,
    warning = null
  } = data;

  const W = 256, H = 384;
  ctx.clearRect(0, 0, W, H);

  // 1. Nền màn hình OLED đen tuyền, viền xám mờ sang trọng (Mercedes/BMW Digital Cockpit)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#060913');
  bgGrad.addColorStop(0.5, '#0c1222');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // 2. Thanh Tell-tale trên cùng: Xi-nhan, Seat belt, Lane assist, High beam, Phanh tay
  ctx.fillStyle = blinkerL || hazard ? '#22c55e' : 'rgba(255,255,255,0.12)';
  ctx.font = '900 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('◀', 12, 30);

  ctx.fillStyle = blinkerR || hazard ? '#22c55e' : 'rgba(255,255,255,0.12)';
  ctx.textAlign = 'right';
  ctx.fillText('▶', W - 12, 30);

  // Seat belt telltale
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  if (!seatBelt) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('🔴 BELT', 58, 28);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('BELT', 58, 28);
  }

  // Lane assist telltale
  ctx.fillStyle = laneWarning ? '#f59e0b' : 'rgba(255,255,255,0.15)';
  ctx.fillText(laneWarning ? '🟠 LANE' : 'LANE', 108, 28);

  // High beam telltale
  if (headlights) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🔵 BEAM', 158, 28);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('BEAM', 158, 28);
  }

  // Handbrake telltale (P)
  if (handbrake) {
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 12px sans-serif';
    ctx.fillText('(P)', 202, 28);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '900 12px sans-serif';
    ctx.fillText('(P)', 202, 28);
  }

  // 3. Tốc độ số lớn nổi bật ở giữa (Speed is prominent)
  const isOverSpeed = speed > speedLimit;
  ctx.fillStyle = isOverSpeed ? '#ef4444' : '#f8fafc';
  ctx.font = '900 78px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(speed)), W / 2, 120);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 14px sans-serif';
  ctx.fillText('KM/H', W / 2, 142);

  // Biển báo tốc độ kiểu Châu Âu (StVO Zeichen 274)
  const limitSignX = W / 2 + 76;
  const limitSignY = 100;
  ctx.beginPath();
  ctx.arc(limitSignX, limitSignY, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#dc2626';
  ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.font = '900 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(speedLimit), limitSignX, limitSignY + 5);

  // 4. Thanh đo vòng tua máy tuyến tính (Linear Tachometer RPM x1000)
  ctx.fillStyle = '#64748b';
  ctx.font = '700 9px monospace';
  const rpmScale = ['0', '1', '2', '3', '4', '5', '6', '7'];
  const rpmBarX = 28, rpmBarW = W - 56, rpmBarY = 175;
  rpmScale.forEach((s, i) => {
    const tx = rpmBarX + (i / 7) * rpmBarW;
    ctx.fillStyle = i >= 6 ? '#ef4444' : i === 5 ? '#eab308' : '#64748b';
    ctx.fillText(s, tx, rpmBarY - 5);
  });

  // RPM Bar track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  if (ctx.roundRect) ctx.roundRect(rpmBarX, rpmBarY, rpmBarW, 6, 3);
  else ctx.rect(rpmBarX, rpmBarY, rpmBarW, 6);
  ctx.fill();

  // RPM Bar Fill
  const rpmRatio = Math.min(1, Math.max(0, rpm / 7000));
  if (rpmRatio > 0) {
    ctx.fillStyle = rpm > 6000 ? '#ef4444' : rpm > 5000 ? '#eab308' : '#38bdf8';
    if (ctx.roundRect) ctx.roundRect(rpmBarX, rpmBarY, rpmBarW * rpmRatio, 6, 3);
    else ctx.rect(rpmBarX, rpmBarY, rpmBarW * rpmRatio, 6);
    ctx.fill();
  }

  // RPM Readout text
  ctx.fillStyle = '#475569';
  ctx.font = '700 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('RPM x1000', rpmBarX, rpmBarY + 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = rpm > 6000 ? '#ef4444' : '#94a3b8';
  ctx.fillText(rpm > 0 ? `${Math.round(rpm)} RPM` : 'ENGINE OFF', rpmBarX + rpmBarW, rpmBarY + 18);

  // Đường phân cách mờ
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 210);
  ctx.lineTo(W - 28, 210);
  ctx.stroke();

  // 5. Hộp số PRND: Chỉ highlight một số hiện tại + hiện cấp số bên dưới
  const activeMode = gear.startsWith('D') ? 'D' : (gear === 'R' ? 'R' : gear === 'N' ? 'N' : 'P');
  const subGear = activeMode === 'D' ? (gear.startsWith('D') ? gear : 'D1') : activeMode === 'R' ? 'R' : activeMode === 'P' ? 'P' : 'N';
  const gears = ['P', 'R', 'N', 'D'];
  const startX = 42;
  gears.forEach((g, idx) => {
    const gx = startX + idx * 46;
    const isAct = activeMode === g;
    if (isAct) {
      ctx.fillStyle = g === 'R' ? '#b91c1c' : g === 'P' ? '#b45309' : g === 'N' ? '#334155' : '#1d4ed8';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(gx - 18, 226, 36, 26, 5);
      else ctx.rect(gx - 18, 226, 36, 26);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(gx - 18, 226, 36, 26, 5);
      else ctx.rect(gx - 18, 226, 36, 26);
      ctx.fill();
      ctx.fillStyle = '#475569';
    }
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g, gx, 244);
  });

  // Cấp số phụ bên dưới (D1, D2, P, R, N)
  ctx.fillStyle = activeMode === 'D' ? '#38bdf8' : activeMode === 'R' ? '#ef4444' : activeMode === 'P' ? '#f59e0b' : '#94a3b8';
  ctx.font = '900 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(subGear, W / 2, 276);

  // 6. Khu vực cảnh báo / Hành trình dưới đáy màn hình
  if (warning) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(16, 305, W - 32, 34, 6);
    else ctx.rect(16, 305, W - 32, 34);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(warning, W / 2, 327);
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    const odo = (distanceTraveled / 1000).toFixed(1);
    ctx.fillText(`TRIP: ${odo} KM`, W / 2, 325);
  }

  // Dòng chân táp-lô
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GERMAN STVO COCKPIT', W / 2, 364);
}

// ── 9. Infotainment & Navigation Screen (Màn hình trung tâm táp-lô Toyota Touch) ──
export function drawInfotainmentScreen(ctx, data = {}) {
  if (!ctx) return;
  const {
    speed = 0,
    rpm = 800,
    distanceTraveled = 0,
    scenarioName = 'Sa hình StVO Đức',
    scenarioDetail = 'Đang dẫn đường...'
  } = data;

  const W = 512, H = 256;
  ctx.clearRect(0, 0, W, H);

  // 1. Nền màn hình giải trí tối màu sang trọng
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(1, '#020408');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Thanh tiêu đề trên cùng (Top Header)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, 32);
  ctx.strokeStyle = 'rgba(56,189,248,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 32, W, 0);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🧭 TOYOTA TOUCH 2 NAVIGATION', 16, 21);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('14:32  |  BT 📶  |  FM 98.5', W - 16, 21);

  // 3. Khung bên trái: Bản đồ dẫn đường & chỉ dẫn bài thi (GPS Nav)
  const mapW = 280, mapH = 200, mapX = 14, mapY = 44;
  ctx.fillStyle = '#0a101d';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(mapX, mapY, mapW, mapH, 10);
  else ctx.rect(mapX, mapY, mapW, mapH);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mô phỏng đường dẫn GPS
  ctx.strokeStyle = 'rgba(56,189,248,0.5)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(mapX + 140, mapY + 180);
  ctx.lineTo(mapX + 140, mapY + 80);
  ctx.lineTo(mapX + 80, mapY + 30);
  ctx.stroke();

  // Mũi tên dẫn đường
  ctx.fillStyle = '#22c55e';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('↰', mapX + 50, mapY + 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(scenarioName, mapX + 80, mapY + 56);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText((scenarioDetail || 'Tuân thủ tốc độ và biển báo').slice(0, 30) + '...', mapX + 80, mapY + 76);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`Quãng đường: ${Math.round(distanceTraveled)}m`, mapX + 18, mapY + 175);

  // 4. Khung bên phải: Thông số xe & Media
  const statW = 186, statH = 200, statX = 312, statY = 44;
  ctx.fillStyle = '#0a101d';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(statX, statY, statW, statH, 10);
  else ctx.rect(statX, statY, statW, statH);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VẬN TỐC HIỆN TẠI', statX + statW / 2, statY + 30);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 42px sans-serif';
  ctx.fillText(String(Math.round(speed)), statX + statW / 2, statY + 75);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('KM / H', statX + statW / 2, statY + 95);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(statX + 16, statY + 112);
  ctx.lineTo(statX + statW - 16, statY + 112);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Động cơ: ${Math.round(rpm)} RPM`, statX + statW / 2, statY + 135);
  ctx.fillText('Nhiên liệu: 85% [|||||||| ]', statX + statW / 2, statY + 155);
  ctx.fillText('Trạng thái: Hoạt động tốt', statX + statW / 2, statY + 175);
}