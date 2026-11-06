// 🏁 SA HÌNH FAHRSCHULE — sân bãi đa mô hình Verkehrsübungsplatz (tách từ environment.js, phase B2)
import * as THREE from 'three';
import {
  createEntranceGate, createFloodlightTower, createControlCenterBuilding,
  createTrafficCone, createRoadArrow, createSharkTeethYield, createTireWall,
  createSaHinhBanner, createHillRamp, createZebraCrosswalk, createParkingMarkings,
  createFinishArch, createTotemSign, createPineTree, createLeitpfosten,
  createParkedDummyCar, makeGermanStVOSign, createCornerPole
} from './streetProps.js';
import { makeTrafficLight } from './3dObjects.js';

export function buildSaHinhWorld(scene, scenery, colliders, saHinhRamps, isPerformance) {

    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const asphaltPadMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.8 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    // ── 0. HÀNG RÀO AN TOÀN BAO QUANH CHU VI SÂN BÃI (Perimeter Fencing) ──
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });

    // Cổng vào có barie & bốt kiểm soát tại Cạnh Bắc
    scenery.add(createEntranceGate(0, 243));

    // Cạnh Bắc (Z = +245): chừa cổng vào tại X: -10 đến +10
    for (let fx = -116; fx <= 116; fx += 5) {
      if (Math.abs(fx) > 9) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, 245);
        scenery.add(post);
      }
    }
    const railNorthL = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthL.position.set(-63, 0.85, 245);
    scenery.add(railNorthL);
    const railNorthR = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthR.position.set(63, 0.85, 245);
    scenery.add(railNorthR);

    // Cạnh Nam (Z = -265)
    for (let fx = -116; fx <= 116; fx += 5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
      post.position.set(fx, 0.7, -265);
      scenery.add(post);
    }
    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(232, 0.25, 0.1), railMat);
    railSouth.position.set(0, 0.85, -265);
    scenery.add(railSouth);

    // Cạnh Tây (X = -118) & Cạnh Đông (X = +118)
    for (let fz = -265; fz <= 245; fz += 6) {
      [-118, 118].forEach(fx => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, fz);
        scenery.add(post);
      });
    }
    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railWest.position.set(-118, 0.85, -10);
    scenery.add(railWest);
    const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railEast.position.set(118, 0.85, -10);
    scenery.add(railEast);

    // Đăng ký Collider Hàng Rào Chu Vi Sân Bãi
    colliders.push({
      id: 'perimeter_fences',
      type: 'fence',
      shape: 'boundary',
      minX: -116.5,
      maxX: 116.5,
      minZ: -263.5,
      maxZ: 243.5,
      gateMinX: -9.5,
      gateMaxX: 9.5,
      penalty: 25,
      messageVi: 'Đâm hàng rào an toàn ranh giới sân bãi!',
      messageDe: 'Kollision mit der Platzbegrenzung! (-25đ)'
    });

    // ── CỘT ĐÈN CAO ÁP SÂN VẬN ĐỘNG / SÂN TẬP (Stadium Floodlights) ──
    const floodlightPositions = [
      { x: -112, z: 230 }, { x: 112, z: 230 },
      { x: -112, z: 30 }, { x: 112, z: 30 },
      { x: -112, z: -100 }, { x: 112, z: -100 },
      { x: -112, z: -250 }, { x: 112, z: -250 }
    ];
    floodlightPositions.forEach((p, idx) => {
      scenery.add(createFloodlightTower(p.x, p.z));
      colliders.push({
        id: `floodlight_${idx}`,
        type: 'pole',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.85,
        penalty: 25,
        messageVi: 'Đâm cột đèn chiếu sáng sân tập!',
        messageDe: 'Kollision mit Flutlichtmast! (-25đ)'
      });
    });

    // ── TÒA NHÀ TRUNG TÂM ĐIỀU HÀNH & SÁT HẠCH LÁI XE (Prüfungszentrum) ──
    scenery.add(createControlCenterBuilding(82, 10, 22, 14, 10));
    colliders.push({
      id: 'building_control_center',
      type: 'building',
      shape: 'box',
      x: 82,
      z: 10,
      minX: 82 - 11.5,
      maxX: 82 + 11.5,
      minZ: 10 - 7.5,
      maxZ: 10 + 7.5,
      penalty: 30,
      messageVi: 'Va chạm tòa nhà trung tâm điều hành sát hạch!',
      messageDe: 'Kollision mit Prüfungszentrum! (-30đ)'
    });

    // Cây xanh cảnh quan xung quanh sân
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const addDecoTree = (tx, tz) => {
      const tg = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.5, 7), treeTrunkMat);
      tr.position.y = 1.75;
      const fol = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), treeLeavesMat);
      fol.position.y = 4.2;
      tg.add(tr); tg.add(fol);
      tg.position.set(tx, 0, tz);
      scenery.add(tg);
    };
    [-126, 126].forEach(tx => {
      for (let tz = -250; tz <= 230; tz += 35) {
        addDecoTree(tx, tz);
      }
    });

    // Cảnh quan phía sau vạch xuất phát (Z = +20 đến +240) để gương chiếu hậu soi thấy mặt đường và cây cối
    const rearDecoStep = isPerformance ? 44 : 22;
    for (let bz = 25; bz <= 235; bz += rearDecoStep) {
      [-12.5, 12.5].forEach(tx => {
        addDecoTree(tx, bz);
      });
      [-10.2, 10.2].forEach(px => {
        const pole = createCornerPole(px, bz, 0.9);
        scenery.add(pole);
        colliders.push({
          id: `pole_rear_${px}_${bz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: bz,
          radius: 0.28,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới lề đường phía sau!',
          messageDe: 'Begrenzungsstange berührt! (-15đ)'
        });
      });
    }

    // ── 1. TRỤC ĐƯỜNG CHÍNH BẮC - NAM (Central Avenue: rộng 14m) ──
    const dashLength = 3.0;
    const dashGap = 3.0;
    for (let z = 240; z > -232; z -= (dashLength + dashGap)) {
      if (z > -72 || z < -88) { // Bỏ trống tại ngã tư Z = -80
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, dashLength), whiteLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.02, z);
        scenery.add(dash);
      }
    }

    // Vạch viền vàng hai bên trục chính
    [-6.8, 6.8].forEach(xBorder => {
      const borderLineN = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 314), yellowLineMat);
      borderLineN.rotation.x = -Math.PI / 2;
      borderLineN.position.set(xBorder, 0.02, 85);
      scenery.add(borderLineN);

      const borderLineS = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 144), yellowLineMat);
      borderLineS.rotation.x = -Math.PI / 2;
      borderLineS.position.set(xBorder, 0.02, -160);
      scenery.add(borderLineS);
    });

    // Mũi tên sơn dẫn hướng trên trục chính
    scenery.add(createRoadArrow(3.5, 45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, 12, 0, 'turn_right'));
    scenery.add(createRoadArrow(-3.5, 12, 0, 'turn_left'));
    scenery.add(createRoadArrow(3.5, -45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, -135, 0, 'straight'));

    // ── 2. TRỤC ĐƯỜNG NGANG ĐÔNG - TÂY (Cross Avenue: Z = -80, rộng 14m, từ X = -95 đến +95) ──
    const crossRoadPlane = new THREE.Mesh(new THREE.PlaneGeometry(190, 14), branchMat);
    crossRoadPlane.rotation.x = -Math.PI / 2;
    crossRoadPlane.position.set(0, 0.01, -80);
    scenery.add(crossRoadPlane);

    // Vạch nét đứt đường ngang
    for (let cx = -90; cx <= 90; cx += 6) {
      if (Math.abs(cx) > 8) {
        const cDash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.18), whiteLineMat);
        cDash.rotation.x = -Math.PI / 2;
        cDash.position.set(cx, 0.02, -80);
        scenery.add(cDash);
      }
    }

    // Vạch vàng mép đường ngang
    [-73.2, -86.8].forEach(zy => {
      [-50, 50].forEach(cx => {
        const hBorder = new THREE.Mesh(new THREE.PlaneGeometry(84, 0.2), yellowLineMat);
        hBorder.rotation.x = -Math.PI / 2;
        hBorder.position.set(cx, 0.02, zy);
        scenery.add(hBorder);
      });
    });

    // Mũi tên sơn đường ngang
    scenery.add(createRoadArrow(-25, -80, -Math.PI / 2, 'straight'));
    scenery.add(createRoadArrow(25, -80, Math.PI / 2, 'straight'));

    // ── VẠCH XUẤT PHÁT & BANNER CHÀO MỪNG (Z = 0) ──
    const startLineMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.6), whiteLineMat);
    startLineMesh.rotation.x = -Math.PI / 2;
    startLineMesh.position.set(3.5, 0.03, 0);
    scenery.add(startLineMesh);

    scenery.add(createSaHinhBanner('KHU SA HÌNH LÁI XE TỔNG HỢP 3D', 'VERKEHRSÜBUNGSPLATZ - SÂN BÃI ĐA MÔ HÌNH LUYỆN TẬP', 0, 15, 22));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1: LÁI ZICZAC QUA CỌC TIÊU (SLALOM / SLALOMPARCOURS) ──────
    // Nằm ở cánh Tây Bắc (X: -30 đến -60, Z: 10 đến -60)
    // ══════════════════════════════════════════════════════════════════════
    const slalomPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 76), asphaltPadMat);
    slalomPad.rotation.x = -Math.PI / 2;
    slalomPad.position.set(-45, 0.015, -25);
    scenery.add(slalomPad);

    // Đường nối phía Bắc từ trục chính sang khu ziczac
    const slalomConnector = new THREE.Mesh(new THREE.PlaneGeometry(35, 10), branchMat);
    slalomConnector.rotation.x = -Math.PI / 2;
    slalomConnector.position.set(-22, 0.012, 5);
    scenery.add(slalomConnector);
    scenery.add(createRoadArrow(-18, 5, -Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const slalomExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    slalomExitConnector.rotation.x = -Math.PI / 2;
    slalomExitConnector.position.set(-45, 0.012, -69);
    scenery.add(slalomExitConnector);
    scenery.add(createRoadArrow(-45, -70, 0, 'turn_right'));

    scenery.add(createTotemSign('1. LÁI ZICZAC (SLALOM)', 'VẬN TỐC < 20 KM/H - UỐN LƯỢN QUA CỌC TIÊU', -30, 10, 0, '#0284c7'));

    const slalomPositions = [
      { x: -45, z: 2 },
      { x: -47.5, z: -8 },
      { x: -42.5, z: -18 },
      { x: -47.5, z: -28 },
      { x: -42.5, z: -38 },
      { x: -47.5, z: -48 },
      { x: -42.5, z: -58 },
      { x: -45, z: -68 }
    ];
    slalomPositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 1.25);
      scenery.add(cone);
      colliders.push({
        id: `cone_slalom_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.45,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm/làm đổ cọc tiêu ziczac Slalom!',
        messageDe: 'Leitkegel im Slalomparcours umgeworfen! (-10đ)'
      });
    });

    // Cọc rào viền mép bãi Slalom
    for (let sz = 10; sz >= -65; sz -= 15) {
      [-56, -34].forEach(px => {
        const pole = createCornerPole(px, sz, 1.0);
        scenery.add(pole);
        colliders.push({
          id: `pole_slalom_${px}_${sz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: sz,
          radius: 0.32,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc rào ranh giới bãi Slalom!',
          messageDe: 'Begrenzungsstange Slalom berührt! (-15đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1.5: DỐC ĐỀ-PA 10% (ANFAHREN AM BERG - Grundfahraufgabe) ──
    // Nằm ngay trên trục chính sau điểm xuất phát: xe leo dốc carZ 7→19, đỉnh
    // dốc 19→31, đổ xuống 31→43. Đăng ký vào `ramps` để vật lý leo dốc & phát
    // hiện tuột dốc (hillRolledBack — lỗi trượt bài khi xe lùi > 30cm) hoạt động.
    // LƯU Ý căn pha: physics đọc distFromStart = (carZ + centerZ) + length/2 với
    // centerZ = -25 → dốc vật lý trải carZ 7..43. Mesh createHillRamp vẽ từ gốc
    // group về phía -Z → đặt mesh tại worldZ = -7 để khớp chính xác sườn dốc.
    // ══════════════════════════════════════════════════════════════════════
    const hillRamp = createHillRamp(0, 0, 8.0, 36.0, 1.1);
    hillRamp.position.set(0, 0, -7);
    scenery.add(hillRamp);
    saHinhRamps.push({ centerX: 0, centerZ: -25, width: 8.0, length: 36.0, maxHeight: 1.1 });

    // Vạch đỏ Haltelinie giữa sườn dốc (điểm dừng đề-pa chuẩn, carZ ≈ 12)
    const hillHaltLine = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLine.rotation.x = -Math.PI / 2 + Math.atan2(1.1, 12.0);
    hillHaltLine.position.set(0, 0.5, -12.0);
    scenery.add(hillHaltLine);

    // Vạch đỏ thứ hai trên đỉnh dốc cho bài rèn cao hơn (carZ ≈ 25)
    const hillHaltLineTop = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLineTop.rotation.x = -Math.PI / 2;
    hillHaltLineTop.position.set(0, 1.12, -25.0);
    scenery.add(hillHaltLineTop);

    scenery.add(createTotemSign('2. ĐỀ-PA NGANG DỐC (ANFAHREN AM BERG)', 'DỪNG TRƯỚC VẠCH ĐỎ TRÊN DỐC - KÉO PHANH TAY - KHỞI HÀNH KHÔNG ĐỂ XE TUỘT LÙI', 13, -4, 0, '#dc2626'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 2: GHÉP XE SONG SONG (LÄNGSPARKEN) ────────────────────────
    // Nằm ở cánh Đông Bắc (X: 30 đến 60, Z: 10 đến -55)
    // ══════════════════════════════════════════════════════════════════════
    const parallelPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 70), asphaltPadMat);
    parallelPad.rotation.x = -Math.PI / 2;
    parallelPad.position.set(45, 0.015, -25);
    scenery.add(parallelPad);

    // Đường nối phía Bắc từ trục chính sang khu ghép song song
    const parallelConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), branchMat);
    parallelConnector.rotation.x = -Math.PI / 2;
    parallelConnector.position.set(20, 0.012, 5);
    scenery.add(parallelConnector);
    scenery.add(createRoadArrow(18, 5, Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const parallelExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    parallelExitConnector.rotation.x = -Math.PI / 2;
    parallelExitConnector.position.set(45, 0.012, -67);
    scenery.add(parallelExitConnector);
    scenery.add(createRoadArrow(45, -68, 0, 'turn_right'));

    // Vỉa hè bê tông mô phỏng lề đường
    const parallelSidewalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 68), sidewalkMat);
    parallelSidewalk.position.set(55, 0.08, -25);
    scenery.add(parallelSidewalk);

    // Vỉa đá ba-toa lề
    const curbP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 68), curbMat);
    curbP.position.set(53.1, 0.1, -25);
    scenery.add(curbP);

    scenery.add(createTotemSign('2. GHÉP XE SONG SONG', 'XI-NHAN PHẢI -> LÙI SỐ R VÀO Ô GIỮA 2 XE', 32, 10, 0, '#2563eb'));

    const pSign1 = makeGermanStVOSign('PARKING');
    pSign1.position.set(52, 0, 8);
    scenery.add(pSign1);

    // 2 Xe ô tô mô hình (Parked Dummy Cars) với chi tiết cao cấp
    const frontDummyCar = createParkedDummyCar(49.5, -10, 0x2563eb, 0);
    scenery.add(frontDummyCar);
    colliders.push({
      id: 'dummy_car_front',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -10,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -10 - 2.35,
      maxZ: -10 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía trước!',
      messageDe: 'Kollision mit vorderem geparkten Fahrzeug! (-30đ)'
    });

    const rearDummyCar = createParkedDummyCar(49.5, -40, 0xdc2626, 0);
    scenery.add(rearDummyCar);
    colliders.push({
      id: 'dummy_car_rear',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -40,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -40 - 2.35,
      maxZ: -40 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía sau!',
      messageDe: 'Kollision mit hinterem geparkten Fahrzeug! (-30đ)'
    });

    // Ô đỗ xe chuẩn StVO ở giữa 2 xe dummy
    scenery.add(createParkingMarkings(49.5, -25, 2.7, 7.2, true));

    // Cọc tiêu căn lề đuôi xe
    const parallelConePositions = [
      { x: 47.8, z: -17 }, { x: 51.2, z: -17 },
      { x: 47.8, z: -33 }, { x: 51.2, z: -33 }
    ];
    parallelConePositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 0.95);
      scenery.add(cone);
      colliders.push({
        id: `cone_park_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu căn chuồng ghép song song!',
        messageDe: 'Leitkegel beim Längsparken berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 3: GHÉP XE VUÔNG GÓC 90° (QUERPARKEN) ─────────────────────
    // Nằm ở cánh Đông Nam (X: 30 đến 65, Z: -95 đến -155)
    // ══════════════════════════════════════════════════════════════════════
    const querPad = new THREE.Mesh(new THREE.PlaneGeometry(28, 70), asphaltPadMat);
    querPad.rotation.x = -Math.PI / 2;
    querPad.position.set(48, 0.015, -125);
    scenery.add(querPad);

    // Đường nối phía Bắc vào khu ghép vuông góc
    const querNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), branchMat);
    querNorthConnector.rotation.x = -Math.PI / 2;
    querNorthConnector.position.set(48, 0.012, -88);
    scenery.add(querNorthConnector);

    // Đường nối phía Nam dẫn ra Trục chính
    const querExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(42, 12), branchMat);
    querExitConnector.rotation.x = -Math.PI / 2;
    querExitConnector.position.set(27, 0.012, -162);
    scenery.add(querExitConnector);
    scenery.add(createRoadArrow(20, -162, -Math.PI / 2, 'straight'));

    scenery.add(createTotemSign('3. GHÉP XE VUÔNG GÓC 90°', 'TIẾN QUA CỬA CHUỒNG -> LÙI SỐ R VUÔNG GÓC', 32, -88, 0, '#7c3aed'));

    const pSign2 = makeGermanStVOSign('PARKING');
    pSign2.position.set(38, 0, -96);
    scenery.add(pSign2);

    // 4 Chuồng đỗ xe vuông góc liên tiếp
    [-106, -118, -130, -142].forEach(stallZ => {
      scenery.add(createParkingMarkings(54, stallZ, 3.2, 6.2, false));
      // Cọc tiêu cửa chuồng và đáy chuồng
      [
        { x: 52.2, z: stallZ + 3.0 },
        { x: 55.8, z: stallZ + 3.0 },
        { x: 52.2, z: stallZ - 3.0 },
        { x: 55.8, z: stallZ - 3.0 }
      ].forEach(p => {
        const pole = createCornerPole(p.x, p.z, 1.1);
        scenery.add(pole);
        colliders.push({
          id: `pole_quer_${p.x}_${p.z}`,
          type: 'pole',
          shape: 'circle',
          x: p.x,
          z: p.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc giới hạn chuồng đỗ vuông góc 90°!',
          messageDe: 'Begrenzungsstange Querparken berührt! (-15đ)'
        });
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 4: VÒNG XUYẾN ĐẢO GIAO THÔNG (KREISVERKEHR) ───────────────
    // Nằm ở cánh Tây Nam (Tâm tại X: -55, Z: -125)
    // ══════════════════════════════════════════════════════════════════════
    const roundaboutGroup = new THREE.Group();
    // Đảo cỏ tròn trung tâm (bán kính 11m)
    const islandGeo = new THREE.CylinderGeometry(11, 11, 0.35, 32);
    const islandGrass = new THREE.Mesh(islandGeo, new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
    islandGrass.position.y = 0.17;
    roundaboutGroup.add(islandGrass);

    // Vỉa ba-toa bao quanh đảo tròn
    const islandCurb = new THREE.Mesh(new THREE.RingGeometry(10.8, 11.4, 32), curbMat);
    islandCurb.rotation.x = -Math.PI / 2;
    islandCurb.position.y = 0.36;
    roundaboutGroup.add(islandCurb);

    // Cây xanh cảnh quan ở tâm đảo
    const centerTreeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4.0, 8), treeTrunkMat);
    centerTreeTrunk.position.y = 2.2;
    const centerTreeFol = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), treeLeavesMat);
    centerTreeFol.position.y = 5.0;
    roundaboutGroup.add(centerTreeTrunk);
    roundaboutGroup.add(centerTreeFol);

    // Lòng đường vòng xuyến (Vành khăn nhựa asphalt: bán kính trong 11m, ngoài 21m)
    const ringRoad = new THREE.Mesh(new THREE.RingGeometry(11.2, 21.0, 36), branchMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.y = 0.015;
    roundaboutGroup.add(ringRoad);

    // Vạch sơn nét đứt phân 2 làn trong vòng xuyến (bán kính 16m)
    const numRingDashes = 18;
    for (let ri = 0; ri < numRingDashes; ri++) {
      const angle = (ri / numRingDashes) * Math.PI * 2;
      const rDash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.8), whiteLineMat);
      rDash.rotation.x = -Math.PI / 2;
      rDash.rotation.z = -angle;
      rDash.position.set(Math.cos(angle) * 16, 0.022, Math.sin(angle) * 16);
      roundaboutGroup.add(rDash);
    }

    roundaboutGroup.position.set(-55, 0, -125);
    scenery.add(roundaboutGroup);

    // Đăng ký Collider Đảo Vòng Xuyến
    colliders.push({
      id: 'roundabout_island',
      type: 'curb',
      shape: 'circle',
      x: -55,
      z: -125,
      radius: 11.2,
      penalty: 15,
      messageVi: 'Đè lên đảo cỏ vòng xuyến giao thông!',
      messageDe: 'Verkehrsinsel im Kreisverkehr überfahren! (-15đ)'
    });

    // Đường nối phía Bắc từ Cross Ave vào vòng xuyến
    const rbNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 20), branchMat);
    rbNorthConnector.rotation.x = -Math.PI / 2;
    rbNorthConnector.position.set(-55, 0.012, -96);
    scenery.add(rbNorthConnector);

    // Đường nối phía Đông từ Trục chính sang vòng xuyến
    const rbEastConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 12), branchMat);
    rbEastConnector.rotation.x = -Math.PI / 2;
    rbEastConnector.position.set(-20, 0.012, -125);
    scenery.add(rbEastConnector);

    // Đường nối phía Nam từ vòng xuyến sang khu cua chữ S
    const rbSouthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 26), branchMat);
    rbSouthConnector.rotation.x = -Math.PI / 2;
    rbSouthConnector.position.set(-55, 0.012, -156);
    scenery.add(rbSouthConnector);

    // Vạch răng cá mập (Haifischzähne) trước các cửa vào vòng xuyến
    scenery.add(createSharkTeethYield(-55, -104, 5, 1.1, 0));
    scenery.add(createSharkTeethYield(-34, -125, 5, 1.1, -Math.PI / 2));

    // Biển báo vòng xuyến StVO (Zeichen 215) & Nhường đường (Zeichen 205) tại các cửa vào
    const rbSignEast = makeGermanStVOSign('ROUNDABOUT');
    rbSignEast.position.set(-32, 0, -125);
    scenery.add(rbSignEast);

    const rbSignNorth = makeGermanStVOSign('ROUNDABOUT');
    rbSignNorth.position.set(-55, 0, -102);
    scenery.add(rbSignNorth);

    scenery.add(createTotemSign('4. VÒNG XUYẾN (KREISVERKEHR)', 'NHƯỜNG XE TRONG ĐẢO - XI-NHAN PHẢI KHI RA', -32, -88, 0, '#059669'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 5: GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU (KREUZUNG 4-WAY) ──────────
    // Giao điểm trung tâm tại X: 0, Z: -80
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createTotemSign('5. GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU', 'DỪNG TRƯỚC VẠCH ĐÈN ĐỎ - ƯU TIÊN BÊN PHẢI', 12, -65, 0, '#d97706'));

    // 4 Vạch người đi bộ qua đường (Zebrastreifen)
    scenery.add(createZebraCrosswalk(0, -68, 12, 4.5)); // Nhánh Bắc
    scenery.add(createZebraCrosswalk(0, -92, 12, 4.5)); // Nhánh Nam
    // Nhánh Đông & Tây
    const zebraEast = createZebraCrosswalk(10, -80, 12, 4.5);
    zebraEast.rotation.y = Math.PI / 2;
    scenery.add(zebraEast);
    const zebraWest = createZebraCrosswalk(-10, -80, 12, 4.5);
    zebraWest.rotation.y = Math.PI / 2;
    scenery.add(zebraWest);

    // 4 Vạch dừng màu đỏ (Haltelinie)
    const stopLineNorth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineNorth.rotation.x = -Math.PI / 2;
    stopLineNorth.position.set(0, 0.03, -65);
    scenery.add(stopLineNorth);

    const stopLineSouth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineSouth.rotation.x = -Math.PI / 2;
    stopLineSouth.position.set(0, 0.03, -95);
    scenery.add(stopLineSouth);

    // 4 Cột đèn tín hiệu giao thông (Traffic Lights) tại 4 góc ngã tư
    const tlNE = makeTrafficLight(true);
    tlNE.position.set(8.2, 0, -66);
    scenery.add(tlNE);

    const tlNW = makeTrafficLight(true);
    tlNW.position.set(-8.2, 0, -66);
    tlNW.rotation.y = Math.PI;
    scenery.add(tlNW);

    const tlSE = makeTrafficLight(true);
    tlSE.position.set(8.2, 0, -94);
    scenery.add(tlSE);

    const tlSW = makeTrafficLight(true);
    tlSW.position.set(-8.2, 0, -94);
    tlSW.rotation.y = Math.PI;
    scenery.add(tlSW);

    // Biển cảnh báo ngã tư / Ưu tiên bên phải
    const dangerSign1 = makeGermanStVOSign('DANGER');
    dangerSign1.position.set(8.5, 0, -50);
    scenery.add(dangerSign1);

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 6: ĐƯỜNG QUANH CO CHỮ S (S-KURVE) ─────────────────────────
    // Nằm ở khu vực phía Nam (X: -30 đến -70, Z: -170 đến -230)
    // ══════════════════════════════════════════════════════════════════════
    const scurvePad = new THREE.Mesh(new THREE.PlaneGeometry(42, 65), asphaltPadMat);
    scurvePad.rotation.x = -Math.PI / 2;
    scurvePad.position.set(-50, 0.015, -200);
    scenery.add(scurvePad);

    // Đường nối phía Nam dẫn từ cua chữ S về Trục chính & Cổng đích
    const scurveExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(36, 12), branchMat);
    scurveExitConnector.rotation.x = -Math.PI / 2;
    scurveExitConnector.position.set(-23, 0.012, -230);
    scenery.add(scurveExitConnector);
    scenery.add(createRoadArrow(-15, -230, Math.PI / 2, 'straight'));

    // Hàng rào lốp an toàn tại góc cua gắt ngoài cùng
    scenery.add(createTireWall(-64, -198, 7, Math.PI / 4));

    scenery.add(createTotemSign('6. ĐƯỜNG QUANH CO CHỮ S', 'CĂN ĐƯỜNG MỀM MẠI - KHÔNG ĐÈ CỌC VÀ VẠCH', -24, -170, 0, '#ea580c'));

    // Các cặp cọc tiêu uốn lượn hình chữ S
    const scurvePoints = [
      { x: -35, z: -175 }, { x: -45, z: -182 }, { x: -55, z: -190 },
      { x: -62, z: -198 }, { x: -55, z: -208 }, { x: -45, z: -216 },
      { x: -36, z: -224 }, { x: -45, z: -230 }
    ];
    scurvePoints.forEach((pt, idx) => {
      [-3.5, 3.5].forEach((ox, sideIdx) => {
        const px = pt.x + ox;
        const pole = createCornerPole(px, pt.z, 1.15);
        scenery.add(pole);
        colliders.push({
          id: `pole_scurve_${idx}_${sideIdx}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: pt.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới đoạn đường uốn lượn chữ S!',
          messageDe: 'Begrenzungsstange in S-Kurve berührt! (-15đ)'
        });
      });

      const cone = createTrafficCone(pt.x, pt.z, 0.9);
      scenery.add(cone);
      colliders.push({
        id: `cone_scurve_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: pt.x,
        z: pt.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu tim đường chữ S!',
        messageDe: 'Leitkegel in S-Kurve berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 7: LÀN PHANH DỪNG KHẨN CẤP (GEFAHRENBREMSUNG) ────────────
    // Làn thẳng riêng biệt tại X: 16 (từ Z: -150 đến -235)
    // ══════════════════════════════════════════════════════════════════════
    const brakePad = new THREE.Mesh(new THREE.PlaneGeometry(16, 85), asphaltPadMat);
    brakePad.rotation.x = -Math.PI / 2;
    brakePad.position.set(16, 0.015, -192);
    scenery.add(brakePad);

    // Đường nối phía Bắc vào làn phanh khẩn cấp
    const brakeConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 25), branchMat);
    brakeConnector.rotation.x = -Math.PI / 2;
    brakeConnector.position.set(16, 0.012, -140);
    scenery.add(brakeConnector);
    scenery.add(createRoadArrow(16, -142, 0, 'straight'));

    // Hàng rào lốp xe giảm chấn ở cuối làn phanh
    scenery.add(createTireWall(16, -238, 8, 0));

    scenery.add(createTotemSign('7. PHANH DỪNG KHẨN CẤP', 'TĂNG TỐC 30-50 KM/H -> ĐẠP PHANH HẾT CỠ DƯỚI 6M', 10, -150, 0, '#dc2626'));

    const speedSign50 = makeGermanStVOSign('SPEED_LIMIT', 50);
    speedSign50.position.set(24, 0, -160);
    scenery.add(speedSign50);

    const dangerSign2 = makeGermanStVOSign('DANGER');
    dangerSign2.position.set(24, 0, -172);
    scenery.add(dangerSign2);

    // Vạch vàng cảnh báo chuẩn bị phanh khẩn cấp tại Z = -188
    const brakeWarningLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), yellowLineMat);
    brakeWarningLine.rotation.x = -Math.PI / 2;
    brakeWarningLine.position.set(16, 0.03, -188);
    scenery.add(brakeWarningLine);

    // Vạch đỏ giới hạn dừng xe khẩn cấp Haltelinie tại Z = -205
    const brakeStopLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    brakeStopLine.rotation.x = -Math.PI / 2;
    brakeStopLine.position.set(16, 0.03, -205);
    scenery.add(brakeStopLine);

    // Hàng cọc tiêu giới hạn 2 bên làn phanh
    for (let bz = -165; bz >= -225; bz -= 8) {
      [9.5, 22.5].forEach((bx, sideIdx) => {
        const cone = createTrafficCone(bx, bz, 1.05);
        scenery.add(cone);
        colliders.push({
          id: `cone_brake_${bx}_${bz}`,
          type: 'cone',
          shape: 'circle',
          x: bx,
          z: bz,
          radius: 0.40,
          mesh: cone,
          penalty: 10,
          messageVi: 'Chạm cọc tiêu giới hạn làn phanh khẩn cấp!',
          messageDe: 'Leitkegel der Gefahrenbremsung berührt! (-10đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 8: CỔNG ĐÍCH & KẾT THÚC SA HÌNH (ZIEL & FINISH PARKPLATZ) ─
    // Cuối trục chính tại X: 0, Z: -235
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createSaHinhBanner('8. VẠCH ĐÍCH & KẾT THÚC SA HÌNH', 'XI-NHAN PHẢI TẤP LỀ - DỪNG BÁNH XE - VỀ SỐ P - KÉO PHANH TAY', 0, -228, 18));

    // Cổng vòm đích Finish Arch tại Z = -234
    scenery.add(createFinishArch(0, -234, 16));

    // Bãi đỗ xe trả bài thi kết thúc tại Z = -245
    scenery.add(createParkingMarkings(6.5, -246, 2.8, 6.5, true));
    scenery.add(createParkingMarkings(-6.5, -246, 2.8, 6.5, true));

    // Vòng quay đầu xe sau vạch đích để có thể tiếp tục lái dạo quanh sân
    const loopBackRoad = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), branchMat);
    loopBackRoad.rotation.x = -Math.PI / 2;
    loopBackRoad.position.set(0, 0.012, -255);
    scenery.add(loopBackRoad);

    const pSignFinal = makeGermanStVOSign('PARKING');
    pSignFinal.position.set(9.5, 0, -240);
    scenery.add(pSignFinal);
}
