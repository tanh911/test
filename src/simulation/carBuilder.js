import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function create3DCockpit(scene, playerCar) {
  const cockpit = new THREE.Group();

  const darkLeatherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.2 });

  // 1. Ergonomic 3-Spoke Mercedes-Benz Sports Steering Wheel Assembly
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, -0.24, -0.48);
  wheelGroup.rotation.x = 0.30;

  const colGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.30, 16);
  colGeo.rotateX(Math.PI / 2);
  const column = new THREE.Mesh(colGeo, darkLeatherMat);
  column.position.set(0, 0, -0.12);
  wheelGroup.add(column);

  const stalkGroup = new THREE.Group();
  stalkGroup.position.set(-0.06, 0.02, -0.06);
  const stalkMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.3, metalness: 0.8 })
  );
  stalkMesh.rotation.z = Math.PI / 3;
  stalkGroup.add(stalkMesh);
  wheelGroup.add(stalkGroup);

  // Leather Wrapped Steering Wheel Rim (Slightly larger diameter for realism)
  const rimGeo = new THREE.TorusGeometry(0.22, 0.026, 16, 48);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.3 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.castShadow = true;
  wheelGroup.add(rim);

  // Mercedes Star Badge Center Hub
  const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.032, 24);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, darkLeatherMat);
  wheelGroup.add(hub);

  const badgeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.036, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.98, roughness: 0.05 })
  );
  badgeMesh.rotateX(Math.PI / 2);
  wheelGroup.add(badgeMesh);

  // 3-Spoke Metallic Accents
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
  [-0.10, 0.10].forEach(x => {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, 0.014), spokeMat);
    spoke.position.set(x, 0, 0); wheelGroup.add(spoke);
  });
  const botSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.014), spokeMat);
  botSpoke.position.set(0, -0.08, 0); wheelGroup.add(botSpoke);

  // Driver Hands Gripping Steering Wheel at 9-and-3 o'clock
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.3 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.175, 0, 0);
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.045), handMat);
  const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.035, 0.22, 12), sleeveMat);
  leftSleeve.position.set(-0.06, -0.10, 0.09); leftSleeve.rotation.z = Math.PI / 3.8; leftSleeve.rotation.x = -Math.PI / 4;
  leftArmGroup.add(leftHand); leftArmGroup.add(leftSleeve); wheelGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.175, 0, 0);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.045), handMat);
  const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.035, 0.22, 12), sleeveMat);
  rightSleeve.position.set(0.06, -0.10, 0.09); rightSleeve.rotation.z = -Math.PI / 3.8; rightSleeve.rotation.x = -Math.PI / 4;
  rightArmGroup.add(rightHand); rightArmGroup.add(rightSleeve); wheelGroup.add(rightArmGroup);

  cockpit.add(wheelGroup);

  // Windshield Wiper Assembly
  const wiperGroup = new THREE.Group();
  wiperGroup.position.set(-0.25, -0.38, -0.65);
  wiperGroup.rotation.z = -1.2;

  const wiperBladeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
  const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.45, 0.01), wiperBladeMat);
  wiperArm.position.set(0, 0.22, 0);
  wiperGroup.add(wiperArm);

  cockpit.add(wiperGroup);

  playerCar.add(cockpit);
  cockpit.position.set(-0.48, 1.22, -1.65);

  return { cockpit, wheelGroup, stalkGroup, wiperGroup };
}

// ── 3D Mercedes-Benz AMG Alloy Wheel & Brake Caliper Builder ─────────────────
export function create3DAlloyWheel() {
  const wheelAssembly = new THREE.Group();

  // 1. Heavy Rubber Tire Tread & Sidewall
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85, metalness: 0.1 });
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 32);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true; tire.receiveShadow = true;
  wheelAssembly.add(tire);

  // Tire Tread Grooves
  const grooveMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
  const groove = new THREE.Mesh(new THREE.CylinderGeometry(0.382, 0.382, 0.20, 24), grooveMat);
  groove.rotateZ(Math.PI / 2);
  wheelAssembly.add(groove);

  // 2. High-Gloss Metallic Chrome 5-Spoke AMG Alloy Rim
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.08 });
  const darkRimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });

  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 12, 24), rimMat);
  rimRing.rotation.y = Math.PI / 2;
  wheelAssembly.add(rimRing);

  // 5 Spoke Blades
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.28, 0.04), rimMat);
    spoke.rotation.x = (i * Math.PI * 2) / 5;
    spoke.position.x = 0.08;
    wheelAssembly.add(spoke);
  }

  // Mercedes Star Center Cap
  const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16);
  capGeo.rotateZ(Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, darkRimMat);
  cap.position.x = 0.09;
  wheelAssembly.add(cap);

  const starGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.045, 12);
  starGeo.rotateZ(Math.PI / 2);
  const star = new THREE.Mesh(starGeo, rimMat);
  star.position.x = 0.092;
  wheelAssembly.add(star);

  // 3. Metallic Brake Disc & Red Performance Caliper
  const brakeDiscMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const brakeDiscGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 24);
  brakeDiscGeo.rotateZ(Math.PI / 2);
  const brakeDisc = new THREE.Mesh(brakeDiscGeo, brakeDiscMat);
  brakeDisc.position.x = -0.04;
  wheelAssembly.add(brakeDisc);

  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5, roughness: 0.3 });
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.12), caliperMat);
  caliper.position.set(-0.04, 0.16, 0);
  wheelAssembly.add(caliper);

  return wheelAssembly;
}

// ── 3D Mercedes-Benz GLS 580 Player Car Builder ─────────────────────────────
export function create3DPlayerCar(scene) {
  const carGroup = new THREE.Group();

  // Active Rear LED Brake Lights & Turn Signals positioned at rear bumper (Rear axle at Z = 0.0, Rear Bumper at Z = +0.96m)
  const brakeLightPointL = new THREE.PointLight(0xef4444, 0.5, 6);
  brakeLightPointL.position.set(-0.75, 0.76, 0.96);
  carGroup.add(brakeLightPointL);

  const brakeLightPointR = new THREE.PointLight(0xef4444, 0.5, 6);
  brakeLightPointR.position.set(0.75, 0.76, 0.96);
  carGroup.add(brakeLightPointR);

  const blinkerLightPointL = new THREE.PointLight(0xf59e0b, 0, 6);
  blinkerLightPointL.position.set(-0.88, 0.76, 0.96);
  carGroup.add(blinkerLightPointL);

  const blinkerLightPointR = new THREE.PointLight(0xf59e0b, 0, 6);
  blinkerLightPointR.position.set(0.88, 0.76, 0.96);
  carGroup.add(blinkerLightPointR);

  // ── Create 4 Dynamic 3D Mercedes AMG Alloy Wheel Assemblies ─────────────
  // 1. Front Left Steering Wheel Assembly (FL) - Front Axle at Z = -2.90m
  const flPivot = new THREE.Group();
  flPivot.position.set(-0.94, 0.38, -2.90);
  const flWheel = create3DAlloyWheel();
  flPivot.add(flWheel);
  carGroup.add(flPivot);

  // 2. Front Right Steering Wheel Assembly (FR) - Front Axle at Z = -2.90m
  const frPivot = new THREE.Group();
  frPivot.position.set(0.94, 0.38, -2.90);
  const frWheel = create3DAlloyWheel();
  frWheel.scale.set(-1, 1, 1);
  frPivot.add(frWheel);
  carGroup.add(frPivot);

  // 3. Rear Left Wheel Assembly (RL) - Rear Axle Origin at Z = 0.0m
  const rlGroup = new THREE.Group();
  rlGroup.position.set(-0.94, 0.38, 0.0);
  const rlWheel = create3DAlloyWheel();
  rlGroup.add(rlWheel);
  carGroup.add(rlGroup);

  // 4. Rear Right Wheel Assembly (RR) - Rear Axle Origin at Z = 0.0m
  const rrGroup = new THREE.Group();
  rrGroup.position.set(0.94, 0.38, 0.0);
  const rrWheel = create3DAlloyWheel();
  rrWheel.scale.set(-1, 1, 1);
  rrGroup.add(rrWheel);
  carGroup.add(rrGroup);

  carGroup._rollingWheels = [flWheel, frWheel, rlWheel, rrWheel];
  carGroup._frontSteerPivots = [flPivot, frPivot];
  carGroup._proceduralWheels = [flPivot, frPivot, rlGroup, rrGroup];

  // ── Procedural Fallback SUV Chassis Structure (Renders instantly & aligns perfectly) ──
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'proceduralChassisFrame';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.88,
    roughness: 0.16,
    clearcoat: 1.0,
    reflectivity: 0.95
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1
  });

  // 1. Lower Body Chassis (-3.875m to +0.975m, centered at Z = -1.45m)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.55, 4.85), bodyMat);
  lowerBody.position.set(0, 0.52, -1.45);
  lowerBody.castShadow = true; lowerBody.receiveShadow = true;
  chassisGroup.add(lowerBody);

  // 2. SUV Cabin Greenhouse
  const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.68, 2.65), glassMat);
  cabinRoof.position.set(0, 1.14, -1.35);
  cabinRoof.castShadow = true; cabinRoof.receiveShadow = true;
  chassisGroup.add(cabinRoof);

  // 3. Front SUV Hood Section
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.22, 1.50), bodyMat);
  hood.position.set(0, 0.82, -3.10);
  hood.castShadow = true; hood.receiveShadow = true;
  chassisGroup.add(hood);

  // 4. Front Grille Chrome Trim
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.35, 0.08), chromeMat);
  grille.position.set(0, 0.65, -3.86);
  chassisGroup.add(grille);

  // 5. Left & Right Side Mirrors
  [-1.04, 1.04].forEach(x => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), bodyMat);
    mirror.position.set(x, 1.08, -2.15);
    chassisGroup.add(mirror);
  });

  carGroup.add(chassisGroup);
  carGroup._proceduralChassis = chassisGroup;

  // Load 3D GLB Model of Mercedes-Benz GLS 580
  const gltfLoader = new GLTFLoader();
  const modelUrl = '/simu/32-mercedes-benz-gls-580-2020/mercedes_gls580.glb';

  gltfLoader.load(modelUrl, (gltf) => {
    // Hide procedural fallback body and procedural wheels once high-detail GLB model finishes loading
    if (carGroup._proceduralChassis) {
      carGroup._proceduralChassis.visible = false;
    }
    if (carGroup._proceduralWheels) {
      carGroup._proceduralWheels.forEach(w => { w.visible = true; });
    }

    const mercedesModel = gltf.scene;

    const boxRaw = new THREE.Box3().setFromObject(mercedesModel);
    const sizeRaw = new THREE.Vector3();
    boxRaw.getSize(sizeRaw);
    const centerRaw = new THREE.Vector3();
    boxRaw.getCenter(centerRaw);

    const targetLength = 4.85; // Target length for Mercedes GLS 580 SUV
    const rawLen = sizeRaw.z > 0 ? sizeRaw.z : 5.922;
    const baseScale = targetLength / rawLen;

    // Create centered wrapper group
    const mercedesModelWrapper = new THREE.Group();
    mercedesModel.position.set(-centerRaw.x, -boxRaw.min.y, -centerRaw.z);
    mercedesModelWrapper.add(mercedesModel);

    mercedesModelWrapper._baseScale = baseScale;
    mercedesModelWrapper._baseCenterRaw = centerRaw.clone();
    mercedesModelWrapper._baseBoxRaw = boxRaw.clone();

    mercedesModelWrapper.scale.set(baseScale, baseScale, baseScale);
    mercedesModelWrapper.rotation.y = Math.PI; // Face forward along -Z direction
    mercedesModelWrapper.position.set(0, 0, -1.45); // Align GLB center to chassis wheelbase center (-1.45m)

    mercedesModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const matArray = Array.isArray(child.material) ? child.material : [child.material];
          matArray.forEach(m => {
            m.side = THREE.DoubleSide; // Render both interior ceiling & exterior roof faces!
            m.shadowSide = THREE.DoubleSide;

            if (m.name === 'Polar_White') {
              child._isBodyPaint = true;
              m.color.setHex(0x1e293b);
              m.metalness = 0.88;
              m.roughness = 0.16;
            } else if (m.name === 'Color_M02' || (child.name || '').toLowerCase().includes('chrome')) {
              m.metalness = 0.95;
              m.roughness = 0.1;
            } else if (m.name === 'Interior') {
              m.roughness = 0.7;
              m.color.setHex(0x334155);
            } else if (m.name === 'UnderCarriage') {
              m.color.setHex(0x0f172a);
            }
          });
        }
      }
    });

    carGroup.add(mercedesModelWrapper);
    carGroup._mercedesModel = mercedesModelWrapper;
  }, undefined, (error) => {
    console.warn('GLTFLoader fallback to procedurally generated Mercedes body:', error);
    if (carGroup._proceduralChassis) {
      carGroup._proceduralChassis.visible = true;
    }
    if (carGroup._proceduralWheels) {
      carGroup._proceduralWheels.forEach(w => { w.visible = true; });
    }
  });

  carGroup._brakeL = brakeLightPointL;
  carGroup._brakeR = brakeLightPointR;
  carGroup._blinkerL = blinkerLightPointL;
  carGroup._blinkerR = blinkerLightPointR;
  carGroup._frontSteerPivots = [flPivot, frPivot];
  carGroup._rollingWheels = [flWheel, frWheel, rlWheel, rrWheel];

  return carGroup;
}
