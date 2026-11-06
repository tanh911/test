import * as THREE from 'three';

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

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
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

export function makeTrafficLight(isRed = true) {
  const g = new THREE.Group();
  g.name = 'trafficLightGroup';

  const baseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  baseFlange.position.set(0, 0.175, 0);
  baseFlange.castShadow = true;
  g.add(baseFlange);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 3.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 })
  );
  mast.position.set(0, 1.85, 0);
  mast.castShadow = true;
  g.add(mast);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.08, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
  );
  cap.position.set(0, 3.59, 0);
  g.add(cap);

  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 })
  );
  bracket.position.set(0, 3.25, 0.13);
  g.add(bracket);

  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 1.45, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
  );
  backboard.position.set(0, 3.25, 0.26);
  g.add(backboard);

  const borderMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
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

  const house = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 1.25, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
  );
  house.position.set(0, 3.25, 0.37);
  house.castShadow = true;
  g.add(house);

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
