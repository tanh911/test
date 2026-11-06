import * as THREE from 'three';
import { createGrassTexture, createRoadTexture, createBuildingFacadeTexture } from './textures.js';
import { makeGermanSign, makeTrafficLight } from './signs.js';

export function buildCityWorld(scene) {
  const grassMat = new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.95 });
  const roadMat = new THREE.MeshStandardMaterial({ map: createRoadTexture(), roughness: 0.75, metalness: 0.1 });
  const swMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });

  // Main Asphalt Road Network Plane (Expanded for Stadtfahrt & Autobahn Highway)
  const road = new THREE.Mesh(new THREE.PlaneGeometry(28, 3600), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.z = -1350;
  road.receiveShadow = true;
  scene.add(road);

  // Grass Terrain Background
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(500, 3600), grassMat);
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.01, -1350);
  grass.receiveShadow = true;
  scene.add(grass);

  // Sidewalk Strips on Both Sides of Boulevard
  [-14.5, 14.5].forEach(x => {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3600), swMat);
    sw.rotation.x = -Math.PI / 2; sw.position.set(x, 0.02, -1350);
    sw.receiveShadow = true;
    scene.add(sw);
  });

  const scenery = new THREE.Group();
  const LOOP = 160, STEP = 10;
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
  const leafM1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9 });

  const buildingPalette = [0xf1f5f9, 0xe2e8f0, 0xcbd5e1, 0x94a3b8, 0xe2e8f0, 0xd1d5db];
  const bMats = buildingPalette.map((col, idx) => new THREE.MeshStandardMaterial({
    map: createBuildingFacadeTexture(col, idx),
    roughness: 0.5, metalness: 0.1
  }));

  // Intersecting Cross-Streets (Ngã 3 & Ngã 4 thành phố Đức mỗi 75m - Cho phép rẽ 90°)
  const crossStreetZ = [];
  for (let zVal = -60; zVal >= -1300; zVal -= 75) {
    crossStreetZ.push(zVal);
  }

  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  crossStreetZ.forEach((zCross, idx) => {
    // 1. Asphalt Cross Road Plane (Ngã tư mở rộng 120m về hai bên X cho phép xe rẽ vào)
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(140, 20), roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(0, 0.025, zCross);
    scenery.add(crossRoad);

    // Sidewalk extensions for side streets
    [-11.5, 11.5].forEach(zRel => {
      const swSide = new THREE.Mesh(new THREE.PlaneGeometry(140, 3), swMat);
      swSide.rotation.x = -Math.PI / 2;
      swSide.position.set(0, 0.026, zCross + zRel);
      scenery.add(swSide);
    });

    // 2. Zebrastreifen (Vạch sang đường đi bộ 3D tại lối vào ngã tư)
    [-11.0, 11.0].forEach(zZebra => {
      for (let s = -8.5; s <= 8.5; s += 1.4) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 4.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(s, 0.035, zCross + zZebra);
        scenery.add(stripe);
      }
    });

    // 3. Haltelinie (Vạch dừng xe Stop Line trắng dầy trước ngã tư)
    const haltLine = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    haltLine.rotation.x = -Math.PI / 2;
    haltLine.position.set(4.2, 0.036, zCross + 12.5);
    scenery.add(haltLine);

    // 4. Mũi tên sơn chỉ hướng Rẽ Trái, Rẽ Phải (Turn Left, Turn Right Paint Arrows)
    const arrowLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.8), arrowMat);
    arrowLeft.rotation.x = -Math.PI / 2;
    arrowLeft.position.set(-4.2, 0.036, zCross + 22.0);
    scenery.add(arrowLeft);

    const arrowRight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.8), arrowMat);
    arrowRight.rotation.x = -Math.PI / 2;
    arrowRight.position.set(4.2, 0.036, zCross + 22.0);
    scenery.add(arrowRight);

    // 5. Đèn giao thông Ampel / Biển STOP Đức ở góc phải ngã tư
    if (idx % 2 === 0) {
      const trafficLight = makeTrafficLight(idx % 4 === 0);
      trafficLight.position.set(12.5, 0, zCross + 12.0);
      scenery.add(trafficLight);
    } else {
      const stopSign = makeGermanSign('STOP_SIGN');
      stopSign.position.set(12.5, 0, zCross + 12.0);
      scenery.add(stopSign);
    }
  });

  // ── 🔄 3D GERMAN KREISVERKEHR ROUNDABOUT ISLAND (Z = -150m) ───────────────────
  const rbGroup = new THREE.Group();
  rbGroup.position.set(0, 0, -150);

  // Center Grass Island Base
  const rbIslandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const rbIsland = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.0, 0.45, 32), rbIslandMat);
  rbIsland.position.y = 0.22; rbIsland.receiveShadow = true; rbIsland.castShadow = true;
  rbGroup.add(rbIsland);

  // Cobblestone Curb Ring around Roundabout Center
  const rbCobbleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
  const rbCobble = new THREE.Mesh(new THREE.CylinderGeometry(11.0, 11.0, 0.15, 32), rbCobbleMat);
  rbCobble.position.y = 0.08; rbCobble.receiveShadow = true;
  rbGroup.add(rbCobble);

  // Decorative Center Landmark Tree & Flowers
  const rbTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8), trunkM);
  rbTrunk.position.y = 1.95; rbTrunk.castShadow = true; rbGroup.add(rbTrunk);
  const rbFoliage = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), leafM2);
  rbFoliage.position.y = 4.2; rbFoliage.castShadow = true; rbGroup.add(rbFoliage);

  // German Roundabout Entry Sign (Zeichen 215 - 3 Circular Blue Arrows) & Yield Sign (Zeichen 205)
  const rbSignPostMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const rbSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), rbSignPostMat);
  rbSignPost.position.set(9.5, 1.6, 18.0); rbGroup.add(rbSignPost);

  // Blue Roundabout Circle Disc
  const rbDiscMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.3 });
  const rbDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 24), rbDiscMat);
  rbDisc.rotation.x = Math.PI / 2; rbDisc.position.set(9.5, 2.6, 18.0); rbGroup.add(rbDisc);

  // Yield Sign (Zeichen 205 - Upside Down Red Triangle)
  const yieldShape = new THREE.BufferGeometry();
  const yieldVertices = new Float32Array([
    -0.6, 0.6, 0,
     0.6, 0.6, 0,
     0.0, -0.6, 0
  ]);
  yieldShape.setAttribute('position', new THREE.BufferAttribute(yieldVertices, 3));
  const yieldMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
  const yieldMesh = new THREE.Mesh(yieldShape, yieldMat);
  yieldMesh.position.set(9.5, 1.6, 18.0); rbGroup.add(yieldMesh);

  scenery.add(rbGroup);

  // German City Blocks & High-Rise Buildings (Z = 0 đến Z = -1300m)
  for (let i = 0; i < 130; i++) {
    const z = -i * STEP;
    const isAtIntersection = crossStreetZ.some(cz => Math.abs(cz - z) < 14);

    [-4.5, 0, 4.5].forEach(x => {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.03, z); scenery.add(d);
    });

    // Street Lamps
    if (i % 4 === 0 && !isAtIntersection) {
      [-13.8, 13.8].forEach(x => {
        const lampGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 5.5, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 }));
        pole.position.y = 2.75; lampGroup.add(pole);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        head.position.set(x > 0 ? -0.3 : 0.3, 5.4, 0); lampGroup.add(head);
        lampGroup.position.set(x, 0, z);
        scenery.add(lampGroup);
      });
    }

    // Realistic Multi-Layered Urban Trees
    if (i % 2 === 0 && !isAtIntersection) {
      [-16.5, 16.5].forEach(x => {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.8, 8), trunkM);
        trunk.position.y = 1.4; trunk.castShadow = true;
        const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), leafM1);
        f1.position.y = 3.2; f1.castShadow = true;
        const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 6, 6), leafM2);
        f2.position.set(0.3, 3.8, -0.2); f2.castShadow = true;
        g.add(trunk); g.add(f1); g.add(f2);
        g.position.set(x, 0, z); scenery.add(g);
      });
    }

    // German City Buildings
    if (i % 3 === 0 && !isAtIntersection) {
      const h = 12 + (i % 6) * 4.5;
      [-28, 28].forEach(x => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(18, h, 24), bMats[i % bMats.length]);
        b.position.set(x, h / 2, z); b.castShadow = true; b.receiveShadow = true;
        scenery.add(b);
      });
    }
  }

  // ── 🛣️ 6-LANE GERMAN AUTOBAHN HIGHWAY SECTION (Z = -1350m đến -2800m) ──────
  const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
  const centerGuardrail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 1450), guardrailMat);
  centerGuardrail.position.set(0, 0.45, -2075);
  centerGuardrail.castShadow = true;
  scenery.add(centerGuardrail);

  // Outer Highway Guardrails
  [-13.8, 13.8].forEach(xGuard => {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 1450), guardrailMat);
    sideRail.position.set(xGuard, 0.4, -2075);
    sideRail.castShadow = true;
    scenery.add(sideRail);
  });

  // German Overhead Autobahn Highway Gantry Bridges
  const gantryPillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const gantrySignMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.3, roughness: 0.4 });
  const finishBannerMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.4, roughness: 0.3 });

  [
    { z: -1380, text: '🇩🇪 AUTOBAHN A1 — EINFAHRT (BESCHLEUNIGUNGSSTREIFEN > 65 KM/H)' },
    { z: -1650, text: '🚀 RICHTGESCHWINDIGKEIT 130 KM/H — FREIE FAHRT' },
    { z: -1950, text: '🚑 RETTUNGSGASSE BILDEN — LÀN CỨU HỘ KHẨN CẤP' },
    { z: -2200, text: '↘️ AUSFAHRT 500M — CHUẨN BỊ RỜI CAO TỐC' },
  ].forEach(gItem => {
    const gantry = new THREE.Group();
    [-14.5, 14.5].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7.2, 10), gantryPillarMat);
      pillar.position.set(px, 3.6, gItem.z); pillar.castShadow = true;
      gantry.add(pillar);
    });
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(29.5, 0.4, 0.4), gantryPillarMat);
    crossbar.position.set(0, 7.1, gItem.z); crossbar.castShadow = true;
    gantry.add(crossbar);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(22, 2.0, 0.1), gantrySignMat);
    signBoard.position.set(0, 6.0, gItem.z); signBoard.castShadow = true;
    gantry.add(signBoard);

    scenery.add(gantry);
  });

  // 🏁 FINAL EXAM FINISH ARCH (Z = -2450m)
  const finishGantry = new THREE.Group();
  [-14.5, 14.5].forEach(px => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 7.5, 10), gantryPillarMat);
    pillar.position.set(px, 3.75, -2450); pillar.castShadow = true;
    finishGantry.add(pillar);
  });
  const finishCrossbar = new THREE.Mesh(new THREE.BoxGeometry(29.5, 0.5, 0.5), gantryPillarMat);
  finishCrossbar.position.set(0, 7.4, -2450); finishCrossbar.castShadow = true;
  finishGantry.add(finishCrossbar);

  const finishSignBoard = new THREE.Mesh(new THREE.BoxGeometry(24, 2.4, 0.12), finishBannerMat);
  finishSignBoard.position.set(0, 6.1, -2450); finishSignBoard.castShadow = true;
  finishGantry.add(finishSignBoard);

  scenery.add(finishGantry);

  scene.add(scenery);
  return { scenery, roadMat, crossStreetZ };
}
