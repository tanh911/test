# -*- coding: utf-8 -*-
"""Fix sign orientation: gantry/VZ330/Baustelle quay mặt về phía xe đang tới."""
import io

P = 'src/components/autobahnDistrict.js'
src = io.open(P, encoding='utf-8').read()

# ── 1. GANTRY ──
old_gantry = """    motorways.forEach((r) => {
      if (!r.centerline || r.centerline.length < 2) return;
      const p1 = r.centerline[0];
      const p2 = r.centerline[r.centerline.length - 1];
      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      if (len < 1) return;

      gantryAcc += len;

      while (gantryAcc >= GANTRY_INTERVAL) {
        gantryAcc -= GANTRY_INTERVAL;
        const remainingDistOnSeg = len - gantryAcc;
        const t = Math.max(0, Math.min(1, remainingDistOnSeg / len));
        const midX = p1[0] + dx * t;
        const midZ = p1[1] + dz * t;
        const rotY = Math.atan2(dx, dz);

        const textMain = totalSignCount % 2 === 0 ? 'A 2 Hannover / Dortmund' : 'A 2 Oberhausen / Köln';
        const textSub = totalSignCount % 2 === 0 ? 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot' : 'Ausfahrt Rhynern 500m · LKW Überholverbot';

        const gantry = createAutobahnGantry(midX, midZ, rotY, textMain, textSub);
        signsGroup.add(gantry);
        totalSignCount++;
      }
    });"""

new_gantry = """    // 🪧 GANTRY: node order way OSM oneway = HƯỚNG LƯU THÔNG thật. Mặt biển quay
    // NGƯỢC chiều chạy (rotY = atan2(-dx,-dz)) — trước đây quay theo chiều node →
    // driver nhìn thấy mặt lưng (chữ mirror). Destination lấy từ tag `destination`
    // của ramp motorway_link PHÍA TRƯỚC theo chiều chạy (≤ 2km).
    motorways.forEach((r) => {
      if (!r.centerline || r.centerline.length < 2) return;
      const p1 = r.centerline[0];
      const p2 = r.centerline[r.centerline.length - 1];
      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      if (len < 1) return;
      const ux = dx / len, uz = dz / len;

      gantryAcc += len;

      while (gantryAcc >= GANTRY_INTERVAL) {
        gantryAcc -= GANTRY_INTERVAL;
        const remainingDistOnSeg = len - gantryAcc;
        const t = Math.max(0, Math.min(1, remainingDistOnSeg / len));
        const gx = p1[0] + dx * t;
        const gz = p1[1] + dz * t;
        const rotY = Math.atan2(-ux, -uz);

        let textMain = 'A 2 Hannover / Dortmund';
        let textSub = 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot';
        let bestExit = null;
        let bestExitD = Infinity;
        for (const link of motorwayLinks) {
          if (!link.destination || !link.centerline || link.centerline.length < 2) continue;
          const ex = link.centerline[link.centerline.length - 1][0] - gx;
          const ez = link.centerline[link.centerline.length - 1][1] - gz;
          const distE = Math.hypot(ex, ez);
          if (distE > 2000 || distE < 5) continue;
          if ((ex / distE) * ux + (ez / distE) * uz < 0.4) continue;
          if (distE < bestExitD) { bestExitD = distE; bestExit = link; }
        }
        if (bestExit) {
          textMain = 'A 2 ' + bestExit.destination.split(';')[0].trim();
          textSub = 'Ausfahrt ' + Math.max(1, Math.round(bestExitD / 100) * 100) + 'm · Rechtsfahrgebot';
        }

        const gantry = createAutobahnGantry(gx, gz, rotY, textMain, textSub);
        signsGroup.add(gantry);
        totalSignCount++;
      }
    });"""

assert old_gantry in src, 'gantry block not found'
src = src.replace(old_gantry, new_gantry, 1)

# ── 2. VZ 330.1 ──
old_vz = """      const autoStartSign = makeGermanStVOSign('AUTOBAHN_START');
      if (autoStartSign) {
        autoStartSign.position.set(rx + 2.5, 0, rz + 2.5);
        signsGroup.add(autoStartSign);
        totalSignCount++;
      }"""

new_vz = """      const autoStartSign = makeGermanStVOSign('AUTOBAHN_START');
      if (autoStartSign) {
        // Đặt ở ĐẦU ramp (nơi xe từ phố lói vào), lệch PHẢI chiều chạy, mặt quay
        // ngược hướng chạy để người nhập làn đọc được chữ
        const rdx = pt2[0] - pt1[0];
        const rdz = pt2[1] - pt1[1];
        const rLen = Math.hypot(rdx, rdz) || 1;
        const rnx = -rdz / rLen;
        const rnz = rdx / rLen;
        autoStartSign.position.set(pt1[0] + rnx * 4.2, 0, pt1[1] + rnz * 4.2);
        autoStartSign.rotation.y = Math.atan2(-rdx / rLen, -rdz / rLen);
        signsGroup.add(autoStartSign);
        totalSignCount++;
      }"""

assert old_vz in src, 'vz block not found'
src = src.replace(old_vz, new_vz, 1)

# ── 3. BAUSTELLE ──
old_bau = """      const [pt1, pt2] = r.centerline;
      const bx = (pt1[0] + pt2[0]) / 2;
      const bz = (pt1[1] + pt2[1]) / 2;
      const rotY = Math.atan2(pt2[0] - pt1[0], pt2[1] - pt1[1]);

      // Biển cảnh báo Baustelle + Biển 80 km/h
      const bauSign = makeGermanStVOSign('BAUSTELLE');
      if (bauSign) {
        bauSign.position.set(bx + 12.0, 0, bz + 10.0);
        bauSign.rotation.y = rotY;
        signsGroup.add(bauSign);
        totalSignCount++;
      }
      const limit80 = makeGermanStVOSign('SPEED_LIMIT', 80);
      if (limit80) {
        limit80.position.set(bx + 12.0, 0, bz);
        limit80.rotation.y = rotY;
        signsGroup.add(limit80);
        totalSignCount++;
      }

      // Cột nón cảnh báo / Baustellenbaken dọc lề đường công trường
      const bakeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      for (let offsetZ = -30; offsetZ <= 30; offsetZ += 6) {
        const bake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.1), bakeMat);
        bake.position.set(bx + 6.5, 0.55, bz + offsetZ);
        bake.rotation.y = rotY;
        signsGroup.add(bake);
      }"""

new_bau = """      const [pt1, pt2] = r.centerline;
      const bdx = pt2[0] - pt1[0];
      const bdz = pt2[1] - pt1[1];
      const bLen = Math.hypot(bdx, bdz) || 1;
      const bx = (pt1[0] + pt2[0]) / 2;
      const bz = (pt1[1] + pt2[1]) / 2;
      // Mặt biển quay NGƯỢC chiều chạy + đứng bên PHẢI lề xe đang tới
      const rotY = Math.atan2(-bdx / bLen, -bdz / bLen);
      const rnx = -bdz / bLen;
      const rnz = bdx / bLen;
      const fx = bdx / bLen, fz = bdz / bLen;

      const bauSign = makeGermanStVOSign('BAUSTELLE');
      if (bauSign) {
        bauSign.position.set(bx + rnx * 12.0 - fx * 20.0, 0, bz + rnz * 12.0 - fz * 20.0);
        bauSign.rotation.y = rotY;
        signsGroup.add(bauSign);
        totalSignCount++;
      }
      const limit80 = makeGermanStVOSign('SPEED_LIMIT', 80);
      if (limit80) {
        limit80.position.set(bx + rnx * 12.0 + fx * 20.0, 0, bz + rnz * 12.0 + fz * 20.0);
        limit80.rotation.y = rotY;
        signsGroup.add(limit80);
        totalSignCount++;
      }

      // Baustellenbaken dọc LỀ PHẢI công trường
      const bakeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      for (let offsetAlong = -30; offsetAlong <= 30; offsetAlong += 6) {
        const bake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.1), bakeMat);
        bake.position.set(bx + rnx * 6.5 + fx * offsetAlong, 0.55, bz + rnz * 6.5 + fz * offsetAlong);
        bake.rotation.y = Math.atan2(fx, fz);
        signsGroup.add(bake);
      }"""

assert old_bau in src, 'baustelle block not found'
src = src.replace(old_bau, new_bau, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('sign orientation fixed: gantry + vz330 + baustelle')
