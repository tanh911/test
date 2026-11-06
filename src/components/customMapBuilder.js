// 🛠️ Custom Map Builder — dựng map từ elements của Map Editor (tách từ environment.js, phase B3)
import * as THREE from 'three';
import { createBuildingFacadeTexture, ensureUV2, createCobblestoneMaterial, createPbrGrassMaterial, createPbrRoadMaterial, createSidewalkMaterial } from './textures.js';
import {
  canvasTextureCache, getOrCreateCanvasTexture, getSharedTexturedMaterial, sharedMaterials,
  getOrCreateWallMaterial, getOrCreateAwningMaterial,
  makeGermanStVOSign, createFinishArch, createTrafficCone, createEntranceGate,
  createZebraCrosswalk, createParkingMarkings, createHillRamp, createPineTree,
  createRoadArrow, createSaHinhBanner, createTotemSign
} from './streetProps.js';
import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';

export function createParkTree(scale = 1) {
  const treeGroup = new THREE.Group();
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, 2.8 * scale, 8), trunkM);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const leavesLow = new THREE.Mesh(new THREE.SphereGeometry(1.7 * scale, 8, 8), leafM);
  leavesLow.position.y = 3.2 * scale;
  leavesLow.castShadow = true;
  treeGroup.add(leavesLow);

  const leavesTop = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 8, 8), leafM2);
  leavesTop.position.y = 4.5 * scale;
  leavesTop.castShadow = true;
  treeGroup.add(leavesTop);

  return treeGroup;
}

// Ghế đá công viên (Parkbank Berlin kiểu băng ghế sơn xanh lá)
export function createParkBench() {
  const bench = new THREE.Group();
  const woodM = new THREE.MeshStandardMaterial({ color: 0x2f6b4f, roughness: 0.75 });
  const legM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.3 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), woodM);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.06), woodM);
  backrest.position.set(0, 0.72, -0.2);
  backrest.rotation.x = -0.15;
  bench.add(backrest);

  [-0.75, 0.75].forEach(bx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.42), legM);
    leg.position.set(bx, 0.22, 0);
    bench.add(leg);
  });

  return bench;
}

// ── 3. CUSTOM MAP BUILDER (Build từ file JSON MapEditor) ────────────────────────

//

export function buildCustomMap(scene, mapData, options = {}) {
  if (!mapData) {
    return { scenery: null, roadMat: null, crossStreetZ: [], config: null, isCustomMap: false };
  }
  const isPerformance = !!options.isPerformance;

  const scenery = new THREE.Group();
  scenery.name = 'customMapScenery';

  const ambientLight = new THREE.AmbientLight(0xffffff, isPerformance ? 0.6 : 0.25);
  scenery.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, isPerformance ? 0.6 : 0.35);
  dirLight.position.set(50, 100, 50);
  dirLight.castShadow = !isPerformance;
  scenery.add(dirLight);

  const roadMat = createPbrRoadMaterial({ repeatX: 7, repeatZ: 40, roughness: 0.82 });
  const grassMat = createPbrGrassMaterial({ repeatX: 1000, repeatZ: 1000, color: 0xffffff });
  const swMat = createSidewalkMaterial({ repeatX: 2, repeatZ: 40 });
  const cobbleMat = createCobblestoneMaterial({ repeatX: 4, repeatZ: 4 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.05 });

  const customRamps = [];

  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  ensureUV2(groundGeo);
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  ground.receiveShadow = true;
  scenery.add(ground);

  if (mapData.elements) {
    mapData.elements.forEach((element) => {
      const x = element.x;
      const z = element.z || 0;
      const width = element.width;
      const height = element.height;
      const rotationDeg = element.rotation || 0;
      const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;

      const effWidth = isQuarterTurn ? height : width;
      const effHeight = isQuarterTurn ? width : height;

      const centerX = x + effWidth / 2;
      const centerZ = -(z + effHeight / 2);
      const rotRad = -(rotationDeg * Math.PI / 180);
      switch (element.type) {
        case 'ROAD':
        case 'ROAD_STRAIGHT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          // Road surface - Hỗ trợ mặt đường Asphalt hoặc Đá cuội Cobblestone
          const surfaceMat = element.roadType === 'cobblestone' ? cobbleMat : roadMat;
          const roadGeo = new THREE.PlaneGeometry(width, height);
          ensureUV2(roadGeo);
          const road = new THREE.Mesh(roadGeo, surfaceMat);
          road.rotation.x = -Math.PI / 2;
          road.receiveShadow = true;
          group.add(road);

          // Ray đôi tàu điện Straßenbahn Tram M8/12 nếu có hasTram
          if (element.hasTram) {
            const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
            [-0.75, 0.75].forEach(rX => {
              const rail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, height), railMat);
              rail.rotation.x = -Math.PI / 2;
              rail.position.set(rX, 0.007, 0);
              group.add(rail);
            });
          }

          // Làn đường xe đạp sơn đỏ chuyên dụng (Radwegefurt)
          if (element.bicycleLane) {
            const bikeLaneMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
            [-width / 2 + 0.9, width / 2 - 0.9].forEach(bX => {
              const bikeLane = new THREE.Mesh(new THREE.PlaneGeometry(1.3, height), bikeLaneMat);
              bikeLane.rotation.x = -Math.PI / 2;
              bikeLane.position.set(bX, 0.003, 0);
              group.add(bikeLane);
            });
          }

          // Center dashed white line (hoặc vạch kép nếu là đại lộ 4 làn)
          if (element.lanes === 4) {
            [-0.4, 0.4].forEach(offX => {
              const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
              borderLine.rotation.x = -Math.PI / 2;
              borderLine.position.set(offX, 0.005, 0);
              group.add(borderLine);
            });
          } else {
            const numDashes = Math.max(1, Math.floor(height / 4));
            for (let d = 0; d < numDashes; d++) {
              const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), lineMat);
              dash.rotation.x = -Math.PI / 2;
              dash.position.set(0, 0.005, -height / 2 + 1 + d * 4);
              group.add(dash);
            }
          }

          // Outer solid white lines
          [-width / 2 + 0.3, width / 2 - 0.3].forEach(lineX => {
            const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            borderLine.rotation.x = -Math.PI / 2;
            borderLine.position.set(lineX, 0.005, 0);
            group.add(borderLine);
          });

          // Vỉa hè 2 bên đường nếu sidewalk !== false
          if (element.sidewalk !== false) {
            [-width / 2 - 0.9, width / 2 + 0.9].forEach(swX => {
              const sw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, height), swMat);
              sw.position.set(swX, 0.075, 0);
              group.add(sw);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROAD_CURVE_90': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const tileSize = Math.max(width, height);
          const roadW = Math.min(width, height, 14);
          const Rcenter = tileSize / 2;
          const Rin = Math.max(2, Rcenter - roadW / 2);
          const Rout = Rcenter + roadW / 2;

          const arcGroup = new THREE.Group();
          arcGroup.position.set(-tileSize / 2, 0, tileSize / 2);

          const curveGeo = new THREE.RingGeometry(Rin, Rout, 36, 1, 0, Math.PI / 2);
          const curveMesh = new THREE.Mesh(curveGeo, roadMat);
          curveMesh.rotation.x = -Math.PI / 2;
          curveMesh.receiveShadow = true;
          arcGroup.add(curveMesh);

          // Vạch kẻ đứt cong ở giữa (Center curved dashed line)
          const numDashes = 6;
          const angleSpan = Math.PI / 2;
          for (let d = 0; d < numDashes; d++) {
            const startAng = (d / numDashes) * angleSpan + 0.04;
            const dashAng = (angleSpan / numDashes) * 0.55;
            const dashGeo = new THREE.RingGeometry(Rcenter - 0.12, Rcenter + 0.12, 6, 1, startAng, dashAng);
            const dashMesh = new THREE.Mesh(dashGeo, lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.y = 0.005;
            arcGroup.add(dashMesh);
          }

          // Vạch liền mép trong & mép ngoài
          const innerLineGeo = new THREE.RingGeometry(Rin + 0.3, Rin + 0.45, 36, 1, 0, Math.PI / 2);
          const innerLineMesh = new THREE.Mesh(innerLineGeo, lineMat);
          innerLineMesh.rotation.x = -Math.PI / 2;
          innerLineMesh.position.y = 0.005;
          arcGroup.add(innerLineMesh);

          const outerLineGeo = new THREE.RingGeometry(Rout - 0.45, Rout - 0.3, 36, 1, 0, Math.PI / 2);
          const outerLineMesh = new THREE.Mesh(outerLineGeo, lineMat);
          outerLineMesh.rotation.x = -Math.PI / 2;
          outerLineMesh.position.y = 0.005;
          arcGroup.add(outerLineMesh);

          // Vỉa hè cong mép ngoài & trong
          const outerCurbGeo = new THREE.RingGeometry(Rout, Rout + 1.2, 36, 1, 0, Math.PI / 2);
          const outerCurb = new THREE.Mesh(outerCurbGeo, swMat);
          outerCurb.rotation.x = -Math.PI / 2;
          outerCurb.position.y = 0.04;
          arcGroup.add(outerCurb);

          const innerCurbGeo = new THREE.RingGeometry(Math.max(0.1, Rin - 1.2), Rin, 36, 1, 0, Math.PI / 2);
          const innerCurb = new THREE.Mesh(innerCurbGeo, swMat);
          innerCurb.rotation.x = -Math.PI / 2;
          innerCurb.position.y = 0.04;
          arcGroup.add(innerCurb);

          // Gờ sa hình kerb sọc đỏ trắng ôm cua
          const numKerbs = 8;
          for (let k = 0; k < numKerbs; k++) {
            const kStart = (k / numKerbs) * angleSpan;
            const kLen = angleSpan / numKerbs;
            const kerbMat = (k % 2 === 0)
              ? new THREE.MeshBasicMaterial({ color: 0xef4444 })
              : new THREE.MeshBasicMaterial({ color: 0xffffff });
            const kGeo = new THREE.RingGeometry(Rin, Rin + 0.45, 4, 1, kStart, kLen);
            const kMesh = new THREE.Mesh(kGeo, kerbMat);
            kMesh.rotation.x = -Math.PI / 2;
            kMesh.position.y = 0.01;
            arcGroup.add(kMesh);
          }

          group.add(arcGroup);
          scenery.add(group);
          break;
        }
        case 'ROAD_S_CURVE': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const roadW = width || 14;
          const roadLen = height || 40;
          const steps = 40;
          const amplitude = element.amplitude || 4.2;

          const sCurveFunc = (t) => {
            return amplitude * Math.sin(Math.PI * 2 * t) * Math.pow(Math.sin(Math.PI * t), 1.5);
          };

          const positions = [];
          const uvs = [];
          const indices = [];

          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);

            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            positions.push(xLocal - nx * (roadW / 2), 0, zLocal - nz * (roadW / 2));
            uvs.push(0, t * (roadLen / 4));

            positions.push(xLocal + nx * (roadW / 2), 0, zLocal + nz * (roadW / 2));
            uvs.push(1, t * (roadLen / 4));

            if (i < steps) {
              const baseIdx = i * 2;
              indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
              indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
            }
          }

          const sGeo = new THREE.BufferGeometry();
          sGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
          sGeo.setIndex(indices);
          sGeo.computeVertexNormals();

          const sMesh = new THREE.Mesh(sGeo, roadMat);
          sMesh.receiveShadow = true;
          group.add(sMesh);

          // Vạch tim đường đứt khúc uốn lượn theo cua S
          const numDashes = Math.floor(roadLen / 3.5);
          for (let d = 0; d < numDashes; d++) {
            const t = (d + 0.5) / numDashes;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const dashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.8), lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.set(xLocal, 0.005, zLocal);
            group.add(dashMesh);
          }

          // Cọc tiêu sa hình phản quang (Traffic cones) dọc 2 mép bài thi đường quanh co
          for (let i = 2; i <= steps - 2; i += 4) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            [-roadW / 2 + 0.4, roadW / 2 - 0.4].forEach(sideOffset => {
              const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
              const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 0.6, 8), coneMat);
              cone.position.set(xLocal + nx * sideOffset, 0.3, zLocal + nz * sideOffset);
              cone.castShadow = true;
              group.add(cone);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROUNDABOUT_4WAY':
        case 'ROUNDABOUT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const outerR = Math.max(width, height) / 2;
          const innerR = Math.max(4, outerR - 9.5);

          // Mặt đường vòng xuyến (Circular asphalt ring)
          const ringGeo = new THREE.RingGeometry(innerR, outerR, 48);
          const ringMesh = new THREE.Mesh(ringGeo, roadMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.receiveShadow = true;
          group.add(ringMesh);

          // Đảo cỏ trung tâm & viền đá (Center island)
          const islandGeo = new THREE.CylinderGeometry(innerR, innerR + 0.25, 0.3, 48);
          const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
          const island = new THREE.Mesh(islandGeo, islandMat);
          island.position.y = 0.15;
          island.receiveShadow = true;
          group.add(island);

          // Cây xanh & tiểu cảnh trung tâm bùng binh
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 4.0, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
          trunk.position.y = 2.0;
          trunk.castShadow = true;
          group.add(trunk);

          const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
          crown.position.y = 4.8;
          crown.castShadow = true;
          group.add(crown);

          // 4 đường dẫn nối vào vòng xuyến (4 Approach legs with Shark's teeth markings)
          const legW = 14;
          const legLen = outerR;
          [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
            const legMesh = new THREE.Mesh(new THREE.PlaneGeometry(legW, legLen), roadMat);
            legMesh.rotation.x = -Math.PI / 2;
            legMesh.rotation.z = angle;
            const legDist = (outerR + innerR) / 2;
            legMesh.position.set(Math.sin(angle) * legDist, -0.002, Math.cos(angle) * legDist);
            group.add(legMesh);

            // Vạch răng cá mập StVO Zeichen 342 nhường đường khi vào vòng xuyến
            const numTeeth = 5;
            const toothW = (legW - 2) / numTeeth;
            for (let t = 0; t < numTeeth; t++) {
              const toothShape = new THREE.Shape();
              toothShape.moveTo(-toothW * 0.4, 0);
              toothShape.lineTo(toothW * 0.4, 0);
              toothShape.lineTo(0, toothW * 0.8);
              toothShape.closePath();
              const toothGeo = new THREE.ShapeGeometry(toothShape);
              const toothMesh = new THREE.Mesh(toothGeo, lineMat);
              toothMesh.rotation.x = -Math.PI / 2;
              toothMesh.rotation.z = angle;
              const tx = -legW / 2 + 1 + (t + 0.5) * toothW;
              const distFromCenter = outerR - 0.5;
              toothMesh.position.set(
                Math.sin(angle) * distFromCenter + Math.cos(angle) * tx,
                0.006,
                Math.cos(angle) * distFromCenter - Math.sin(angle) * tx
              );
              group.add(toothMesh);
            }
          });

          scenery.add(group);
          break;
        }
        case 'HILL_RAMP': {
          const rampWidth = width || 8.0;
          const rampLength = height || 36.0;
          const maxHeight = element.maxHeight || 1.1;

          const rampMesh = createHillRamp(0, 0, rampWidth, rampLength, maxHeight);
          rampMesh.position.set(centerX, 0, centerZ);
          rampMesh.rotation.y = rotRad;
          scenery.add(rampMesh);

          // Biển cảnh báo dốc 10% (StVO Zeichen 108: Steigung)
          const slopeSign = makeGermanStVOSign('PRIORITY', 10);
          slopeSign.position.set(centerX + rampWidth / 2 + 1.2, 0, centerZ + rampLength / 2);
          scenery.add(slopeSign);

          // Lưu thông tin ramp cho vật lý leo dốc & trôi dốc của xe
          customRamps.push({
            centerX,
            centerZ,
            width: rampWidth,
            length: rampLength,
            maxHeight,
            rotationDeg
          });
          break;
        }
        case 'JUNCTION_AMPEL':
        case 'INTERSECTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          // Intersection road base
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);

          // Crosswalk lines around all 4 entrances
          const numStripes = 6;
          const stripeWidth = (width - 2) / numStripes;

          // Top and Bottom crosswalks
          [-height / 2 + 1.2, height / 2 - 1.2].forEach(cwZ => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.8, 1.2), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(-width / 2 + 1 + i * stripeWidth + stripeWidth / 2, 0.005, cwZ);
              group.add(stripe);
            }
          });

          // Left and Right crosswalks
          [-width / 2 + 1.2, width / 2 - 1.2].forEach(cwX => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, stripeWidth * 0.8), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(cwX, 0.005, -height / 2 + 1 + i * stripeWidth + stripeWidth / 2);
              group.add(stripe);
            }
          });

          // Nếu có đèn tín hiệu giao thông (Ampel), đặt 4 cột đèn StVO § 37 ở 4 góc giao lộ
          if (element.hasTrafficLight || element.type === 'JUNCTION_AMPEL') {
            const tlPositions = [
              { x: width / 2 + 1.2, z: height / 2 + 1.2, rot: 0 },
              { x: -width / 2 - 1.2, z: height / 2 + 1.2, rot: Math.PI / 2 },
              { x: -width / 2 - 1.2, z: -height / 2 - 1.2, rot: Math.PI },
              { x: width / 2 + 1.2, z: -height / 2 - 1.2, rot: -Math.PI / 2 }
            ];
            tlPositions.forEach(pos => {
              const tl = makeTrafficLight(true);
              tl.position.set(pos.x, 0, pos.z);
              tl.rotation.y = pos.rot;
              group.add(tl);
            });
          }

          scenery.add(group);
          break;
        }
        case 'INTERSECTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width - 2, 0.4), lineMat);
          stopLine.rotation.x = -Math.PI / 2;
          stopLine.position.set(0, 0.005, height / 2 - 1.2);
          group.add(stopLine);

          scenery.add(group);
          break;
        }
        case 'LAMP_POST': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.0, 12), poleMat);
          pole.position.y = 3.0;
          pole.castShadow = true;
          group.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), poleMat);
          arm.position.set(0.5, 5.8, 0);
          group.add(arm);

          const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
          bulb.position.set(1.0, 5.7, 0);
          group.add(bulb);

          const light = new THREE.SpotLight(0xfef08a, 1.2, 25, Math.PI / 4, 0.5, 1);
          light.position.set(1.0, 5.7, 0);
          light.target.position.set(1.0, 0, 0);
          group.add(light);
          group.add(light.target);

          scenery.add(group);
          break;
        }
        case 'PARKING_BAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const numStalls = Math.max(1, Math.floor(width / 3.0));
          const stallW = width / numStalls;
          for (let s = 0; s <= numStalls; s++) {
            const pLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            pLine.rotation.x = -Math.PI / 2;
            pLine.position.set(-width / 2 + s * stallW, 0.005, 0);
            group.add(pLine);
          }

          // 🚗 Đỗ sẵn các xe ô tô bot trong ô đỗ xe bên đường
          const parkColors = [0x3b82f6, 0xef4444, 0x10b981, 0x64748b, 0x0f172a];
          const parkedCount = Math.min(numStalls, 3);
          for (let pIdx = 0; pIdx < parkedCount; pIdx++) {
            const parkedCar = createTrafficAICar(pIdx, parkColors[(pIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            const stallX = -width / 2 + (pIdx + 0.5) * stallW;
            parkedCar.position.set(stallX, 0, 0);
            parkedCar.rotation.y = Math.PI / 2;
            group.add(parkedCar);
          }

          scenery.add(group);
          break;
        }
        case 'BUILDING': {
          const styleIdx = Math.floor(Math.abs(centerX * 7 + centerZ * 13)) % 3;
          const facadeTex = createBuildingFacadeTexture(0xe2e8f0, styleIdx);
          const bldgMat = new THREE.MeshStandardMaterial({
            map: facadeTex,
            roughness: 0.5
          });

          const bldgHeight = Math.max(10, element.bldgHeight || 16);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            bldgMat
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          building.castShadow = true;
          building.receiveShadow = true;
          scenery.add(building);
          break;
        }
        case 'SIDEWALK': {
          const sidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.15, height),
            swMat
          );
          sidewalk.position.set(centerX, 0.075, centerZ);
          sidewalk.rotation.y = rotRad;
          sidewalk.receiveShadow = true;
          scenery.add(sidewalk);
          break;
        }
        case 'TREE': {
          const treeGroup = new THREE.Group();
          const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
          const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkM);
          trunk.position.y = 1.5;
          trunk.castShadow = true;

          const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), leafM);
          leaves.position.y = 3.6;
          leaves.castShadow = true;

          treeGroup.add(trunk);
          treeGroup.add(leaves);
          treeGroup.position.set(centerX, 0, centerZ);
          treeGroup.rotation.y = rotRad;
          scenery.add(treeGroup);
          break;
        }
        case 'SIGN': {
          const signObj = makeGermanStVOSign(element.signType || 'SPEED_LIMIT', element.value || 50);
          signObj.position.set(centerX, 0, centerZ);
          signObj.rotation.y = rotRad;
          scenery.add(signObj);
          break;
        }
        case 'TRAFFIC_LIGHT': {
          const tlObj = makeTrafficLight(true);
          tlObj.position.set(centerX, 0, centerZ);
          tlObj.rotation.y = rotRad;
          scenery.add(tlObj);
          break;
        }
        case 'STOP_LINE': {
          // Vạch dừng xe StVO Zeichen 294 (Haltelinie)
          const group = new THREE.Group();
          group.position.set(centerX, 0.035, centerZ);
          group.rotation.y = rotRad;

          const stopLineW = width || 7.0;
          const stopLineH = height || 0.6; // Bề dày chuẩn StVO 50-60cm
          const stopMesh = new THREE.Mesh(new THREE.PlaneGeometry(stopLineW, stopLineH), lineMat);
          stopMesh.rotation.x = -Math.PI / 2;
          stopMesh.receiveShadow = true;
          group.add(stopMesh);

          scenery.add(group);
          break;
        }
        case 'ZEBRA': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.04, centerZ);
          group.rotation.y = rotRad;

          const numStripes = 6;
          const stripeWidth = width / numStripes;
          for (let i = 0; i < numStripes; i += 2) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.85, height), lineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-width / 2 + i * stripeWidth + stripeWidth / 2, 0, 0);
            group.add(stripe);
          }
          scenery.add(group);
          break;
        }
        case 'SPAWN_POINT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.05, centerZ);
          group.rotation.y = rotRad;

          const spawnBoxMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.5 });
          const spawnBox = new THREE.Mesh(new THREE.PlaneGeometry(width, height), spawnBoxMat);
          spawnBox.rotation.x = -Math.PI / 2;
          group.add(spawnBox);

          // Arrow indicating start direction
          const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const arrowBody = new THREE.Mesh(new THREE.PlaneGeometry(0.4, height * 0.5), arrowMat);
          arrowBody.rotation.x = -Math.PI / 2;
          arrowBody.position.set(0, 0.01, 0.2);
          group.add(arrowBody);

          scenery.add(group);
          break;
        }
        case 'BRANDENBURGER_TOR':
        case 'LANDMARK': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const stoneMat = new THREE.MeshStandardMaterial({ color: 0xdfd7c2, roughness: 0.8 });
          const roofMat = new THREE.MeshStandardMaterial({ color: 0xc4b59d, roughness: 0.7 });
          const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x22553b, metalness: 0.6, roughness: 0.4 });

          // Attic / Dầm mái trên cùng
          const attic = new THREE.Mesh(new THREE.BoxGeometry(28, 3.8, 7.5), roofMat);
          attic.position.y = 11.5;
          attic.castShadow = true;
          group.add(attic);

          // Cụm tượng cỗ xe tứ mã Quadriga trên đỉnh
          const quadriga = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.2, 3.5), bronzeMat);
          quadriga.position.y = 14.8;
          quadriga.castShadow = true;
          group.add(quadriga);

          // 6 hàng cột trụ Doric tạo 5 cổng vòm
          const colXs = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5];
          colXs.forEach(cx => {
            [-2.2, 2.2].forEach(cz => {
              const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.8, 12), stoneMat);
              col.position.set(cx, 4.9, cz);
              col.castShadow = true;
              group.add(col);
            });
          });

          // Hai cánh cổng vây tường bên ngoài
          [-14.5, 14.5].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8.5, 7.5), stoneMat);
            wing.position.set(wx, 4.25, 0);
            wing.castShadow = true;
            group.add(wing);
          });

          scenery.add(group);
          break;
        }
        case 'TRAM_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          // Bục chờ hành khách
          const platform = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, height), swMat);
          platform.position.y = 0.125;
          group.add(platform);

          // Mái che trạm tàu
          const shelterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
          const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.1, height * 0.5), shelterMat);
          shelterRoof.position.set(0, 3.2, 0);
          group.add(shelterRoof);

          // Cột đỡ mái
          [-height * 0.2, height * 0.2].forEach(pz => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), shelterMat);
            pole.position.set(0, 1.6, pz);
            group.add(pole);
          });

          // Biển hiệu Tram chữ T màu đỏ
          const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), signMat);
          signMesh.position.set(0, 3.8, 0);
          group.add(signMesh);

          scenery.add(group);
          break;
        }
        case 'BUS_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const bvgMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
          const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 });

          const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, height * 0.6), bvgMat);
          roof.position.y = 2.8;
          group.add(roof);

          const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.7, height * 0.6), glassMat);
          backGlass.position.set(-width / 2 + 0.1, 1.35, 0);
          group.add(backGlass);

          // Biển tròn chữ H bến xe buýt StVO Zeichen 224
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), bvgMat);
          pole.position.set(width / 2 - 0.2, 1.5, height / 2);
          group.add(pole);

          const hSign = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x15803d }));
          hSign.rotation.x = Math.PI / 2;
          hSign.position.set(width / 2 - 0.2, 2.9, height / 2);
          group.add(hSign);

          scenery.add(group);
          break;
        }
        case 'PARKED_CAR': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const numCars = Math.max(1, Math.floor(height / 6));
          const parkColors = [0x2563eb, 0xdc2626, 0x475569, 0x1e293b, 0xffffff];
          for (let cIdx = 0; cIdx < numCars; cIdx++) {
            const pCar = createTrafficAICar(cIdx, parkColors[(cIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            pCar.position.set(0, 0, -height / 2 + 3 + cIdx * 5.5);
            group.add(pCar);
          }

          scenery.add(group);
          break;
        }
        case 'CONSTRUCTION': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
          const barrier = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, 0.15), barMat);
          barrier.position.y = 0.6;
          group.add(barrier);

          const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
          warnLight.position.set(0, 1.2, 0);
          group.add(warnLight);

          scenery.add(group);
          break;
        }
        case 'SHOP': {
          const bldgHeight = Math.max(10, element.bldgHeight || 14);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.6 })
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          scenery.add(building);

          const awningMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
          const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.1, 2.0), awningMat);
          awning.position.set(centerX, 3.2, centerZ + height / 2 + 0.8);
          awning.rotation.x = 0.2;
          awning.rotation.y = rotRad;
          scenery.add(awning);
          break;
        }
        case 'JUNCTION_AMPEL': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const interBase = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          interBase.rotation.x = -Math.PI / 2;
          interBase.receiveShadow = true;
          group.add(interBase);

          // 4 cột đèn tín hiệu ở 4 góc giao lộ
          const corners = [
            [-width / 2 + 1, -height / 2 + 1],
            [width / 2 - 1, -height / 2 + 1],
            [-width / 2 + 1, height / 2 - 1],
            [width / 2 - 1, height / 2 - 1]
          ];
          corners.forEach(([cx, cz]) => {
            const tl = makeTrafficLight(true);
            tl.position.set(cx, 0, cz);
            group.add(tl);
          });

          scenery.add(group);
          break;
        }
        case 'JUNCTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);
          scenery.add(group);
          break;
        }
        case 'JUNCTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);
          scenery.add(group);
          break;
        }
        case 'ARROW_STRAIGHT':
        case 'ARROW_LEFT':
        case 'ARROW_RIGHT': {
          // Mũi tên chỉ làn StVO Zeichen 297 sơn trắng trên mặt đường
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const arrowShape = new THREE.Shape();
          if (element.type === 'ARROW_STRAIGHT') {
            // Thân thẳng + đầu nhọn hướng tiến (Z. 297)
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.6);
            arrowShape.lineTo(-0.55, 0.6);
            arrowShape.lineTo(0, 1.5);
            arrowShape.lineTo(0.55, 0.6);
            arrowShape.lineTo(0.18, 0.6);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          } else {
            // Thân dọc + cánh ngang + đầu mũi tên rẽ (Z. 297-10 / 297-20)
            const dir = element.type === 'ARROW_LEFT' ? -1 : 1;
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.5);
            arrowShape.lineTo(dir * -1.75, 0.1);
            arrowShape.lineTo(dir * -1.2, -0.3);
            arrowShape.lineTo(0.18, -0.08);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          }

          const arrowGeo = new THREE.ShapeGeometry(arrowShape);
          const arrowMesh = new THREE.Mesh(arrowGeo, lineMat);
          arrowMesh.rotation.x = -Math.PI / 2;
          arrowMesh.position.y = 0.006;
          group.add(arrowMesh);

          scenery.add(group);
          break;
        }
        case 'PARK': {
          // Công viên xanh: thảm cỏ + lối đi + cây + ghế đá
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const lawn = new THREE.Mesh(new THREE.PlaneGeometry(width, height), grassMat);
          lawn.rotation.x = -Math.PI / 2;
          lawn.position.y = 0.01;
          lawn.receiveShadow = true;
          group.add(lawn);

          // Lối đi bộ vòng quanh mép công viên
          const pathMat = swMat;
          const pathW = 1.6;
          [
            [0, -height / 2 + pathW / 2, width, pathW],
            [0, height / 2 - pathW / 2, width, pathW]
          ].forEach(([px, pz, pw, ph]) => {
            const pathH = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pathMat);
            pathH.rotation.x = -Math.PI / 2;
            pathH.position.set(px, 0.02, pz);
            pathH.receiveShadow = true;
            group.add(pathH);
          });
          [
            [-width / 2 + pathW / 2, 0],
            [width / 2 - pathW / 2, 0]
          ].forEach(([px, pz]) => {
            const pathV = new THREE.Mesh(new THREE.PlaneGeometry(pathW, height - pathW * 2), pathMat);
            pathV.rotation.x = -Math.PI / 2;
            pathV.position.set(px, 0.02, pz);
            pathV.receiveShadow = true;
            group.add(pathV);
          });

          // Cây trồng so le theo lưới, tránh đè lối đi mép
          const treeStepX = Math.max(6, width / 4);
          const treeStepZ = Math.max(6, height / 4);
          let rowIdx = 0;
          for (let tz = -height / 2 + pathW + 2.5; tz <= height / 2 - pathW - 2.5; tz += treeStepZ) {
            for (let tx = -width / 2 + pathW + 2.5; tx <= width / 2 - pathW - 2.5; tx += treeStepX) {
              const jitterX = ((rowIdx % 2) * 0.5 - 0.25) * treeStepX * 0.3;
              const tree = createParkTree(0.9 + ((rowIdx % 3) * 0.15));
              tree.position.set(tx + jitterX, 0, tz);
              group.add(tree);
              rowIdx++;
            }
          }

          // Ghế đá đặt dọc lối đi phía bắc & nam
          [
            [-width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [-width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI],
            [width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI]
          ].forEach(([bx, bz, bRot]) => {
            const bench = createParkBench();
            bench.position.set(bx, 0, bz);
            bench.rotation.y = bRot;
            group.add(bench);
          });

          scenery.add(group);
          break;
        }
        case 'PROMENADE': {
          // Đại lộ đi bộ: sàn lát đá + hàng cây 2 bên + ghế nghỉ
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const promenadeFloor = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          promenadeFloor.rotation.x = -Math.PI / 2;
          promenadeFloor.receiveShadow = true;
          group.add(promenadeFloor);

          // Dải cỏ trung tâm tách luống đi bộ (Mitelstreifen)
          if (width >= 12) {
            const medianGrass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, height - 4), grassMat);
            medianGrass.rotation.x = -Math.PI / 2;
            medianGrass.position.y = 0.005;
            medianGrass.receiveShadow = true;
            group.add(medianGrass);
          }

          // Hàng cây dọc 2 mép mỗi 8m, xen kẽ ghế đá giữa các cây
          const treeXs = width >= 12 ? [-(width / 2 - 1.4), width / 2 - 1.4] : [-(width / 2 - 1.2), width / 2 - 1.2];
          let promIdx = 0;
          for (let pz = -height / 2 + 4; pz <= height / 2 - 4; pz += 8) {
            treeXs.forEach(tx => {
              const tree = createParkTree(1.0 + ((promIdx % 2) * 0.12));
              tree.position.set(tx, 0, pz);
              group.add(tree);
            });
            if (promIdx % 2 === 1) {
              const bench = createParkBench();
              bench.position.set(0, 0, pz - 2);
              bench.rotation.y = Math.PI / 2;
              group.add(bench);
            }
            promIdx++;
          }

          // Cột đèn lồng dọc promenade
          const lampM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.6 });
          const lampGlowM = new THREE.MeshBasicMaterial({ color: 0xfde68a });
          for (let pz = -height / 2 + 6; pz <= height / 2 - 6; pz += 12) {
            [-(width / 2 - 0.5), width / 2 - 0.5].forEach(lx => {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), lampM);
              pole.position.set(lx, 1.8, pz);
              pole.castShadow = true;
              group.add(pole);

              const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lampGlowM);
              lampHead.position.set(lx, 3.7, pz);
              group.add(lampHead);
            });
          }

          scenery.add(group);
          break;
        }
        default:
          break;
      }
    });
  }

  scene.add(scenery);

  let playerSpawnPos = { x: 3.5, z: 0 };

  // Ưu tiên sử dụng spawn point từ mapData nếu có
  if (mapData.mapInfo && mapData.mapInfo.spawnPoint) {
    console.log('🚗 Using spawn point from mapData:', mapData.mapInfo.spawnPoint);
    playerSpawnPos = {
      x: mapData.mapInfo.spawnPoint.x,
      z: mapData.mapInfo.spawnPoint.z,
      rotation: mapData.mapInfo.spawnPoint.rotation || 0
    };
  } else if (mapData.elements) {
    // Fallback: Tìm SPAWN_POINT hoặc đường đầu tiên nếu không có spawn point trong mapInfo
    const spawnEl = mapData.elements.find(el => el.type === 'SPAWN_POINT');
    if (spawnEl) {
      const isQuarterTurn = (spawnEl.rotation === 90 || spawnEl.rotation === 270);
      const effW = isQuarterTurn ? spawnEl.height : spawnEl.width;
      const effH = isQuarterTurn ? spawnEl.width : spawnEl.height;
      playerSpawnPos = {
        x: spawnEl.x + effW / 2,
        z: spawnEl.z + effH / 2,
        rotation: spawnEl.rotation || 0
      };
    } else {
      const firstRoad = mapData.elements.find(el => el.type === 'ROAD_STRAIGHT' || el.type === 'INTERSECTION_4WAY');
      if (firstRoad) {
        playerSpawnPos = {
          x: firstRoad.x + firstRoad.width / 2,
          z: firstRoad.z + firstRoad.height / 2,
          rotation: firstRoad.rotation || 0
        };
      }
    }
  }

  return {
    scenery,
    roadMat,
    crossStreetZ: [],
    config: mapData.mapInfo || { roadLength: 2000, maxSpeedLimit: 50 },
    isCustomMap: true,
    playerSpawnPos,
    disableSceneryMoving: true,
    ramps: customRamps
  };
}

// ── 4. CUSTOM MAP RELOAD HELPER ──────────────────────────────────────────────
export function reloadCustomMap(scene, mapData, playerCar, aiCars, trafficLights, refs) {
  if (!mapData) return;

  const oldScenery = scene.getObjectByName('customMapScenery');
  if (oldScenery) {
    scene.remove(oldScenery);
    oldScenery.clear();
  }

  aiCars.forEach(ai => scene.remove(ai.mesh));
  aiCars.length = 0;
  trafficLights.forEach(tl => scene.remove(tl.tl));
  trafficLights.length = 0;

  const { scenery, playerSpawnPos } = buildCustomMap(scene, mapData);

  console.log('🚗 Setting player car position to spawn point:', playerSpawnPos);
  playerCar.position.set(playerSpawnPos.x, 0, -playerSpawnPos.z);
  playerCar.rotation.y = -(playerSpawnPos.rotation || 0) * Math.PI / 180;
  playerCar.visible = true;

  refs.current.carX = playerSpawnPos.x;
  refs.current.carZ = playerSpawnPos.z;
  refs.current.heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
  refs.current.speed = 0;
  refs.current.isDriving = false;

  const cam = refs.current.camera || refs.current._camera;
  if (cam) {
    const spawnX = playerSpawnPos.x;
    const spawnZ = playerSpawnPos.z;
    const heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
    console.log('🎥 Setting camera position based on spawn point:', { spawnX, spawnZ });
    cam.position.set(
      spawnX - 5.2 * Math.sin(heading),
      2.2,
      -spawnZ + 5.2 * Math.cos(heading)
    );
    cam.lookAt(
      spawnX + 12 * Math.sin(heading),
      0.8,
      -spawnZ - 12 * Math.cos(heading)
    );
  }
}
