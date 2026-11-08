// Patch: Berlin/land facade variety qua vertexColors (proceduralRoadGenerator.js)
import fs from 'fs';

const P = 'src/simulation/proceduralRoadGenerator.js';
let src = fs.readFileSync(P, 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';
const j = (...lines) => lines.join(NL);

// 1) material vertexColors + palette
const oldMat = j(
  "    this.buildingMat = new THREE.MeshStandardMaterial({",
  "      map: createFacadeTexture(),",
  "      color: 0xffffff,",
  "      roughness: 0.8,",
  "      metalness: 0.05,",
  "      side: THREE.DoubleSide",
  "    });");
const newMat = j(
  "    this.buildingMat = new THREE.MeshStandardMaterial({",
  "      map: createFacadeTexture(),",
  "      color: 0xffffff,",
  "      roughness: 0.8,",
  "      metalness: 0.05,",
  "      vertexColors: true,",
  "      side: THREE.DoubleSide",
  "    });",
  "    // Facade palette Duc (vertex tint per building)",
  "    this.facadePalette = [",
  "      [1.0, 1.0, 1.0],",
  "      [1.0, 0.93, 0.72],",
  "      [1.0, 0.78, 0.62],",
  "      [0.78, 0.9, 0.74],",
  "      [0.94, 0.8, 0.72],",
  "      [0.82, 0.88, 0.94]",
  "    ];");
if (!src.includes('this.facadePalette')) {
  if (!src.includes(oldMat)) { console.error('mat anchor missing'); process.exit(1); }
  src = src.replace(oldMat, newMat);
}

// 2) buffers + colors
const oldBuf = "    const buildingBuffers = { vertices: [], uvs: [], indices: [] };";
const newBuf = "    const buildingBuffers = { vertices: [], uvs: [], indices: [], colors: [] };\n    let facadeTintIdx = 0;";
if (!src.includes('facadeTintIdx')) {
  if (!src.includes(oldBuf)) { console.error('buf anchor missing'); process.exit(1); }
  src = src.replace(oldBuf, newBuf.replace('\n', NL));
}

// 3) wall loop tint
const oldWall = j(
  "          for (let i = 0; i < pts.length; i++) {",
  "            const p1 = pts[i];",
  "            const p2 = pts[(i + 1) % pts.length];",
  "",
  "            const bBase = buildingBuffers.vertices.length / 3;",
  "            buildingBuffers.vertices.push(",
  "              p1[0], 0, p1[1],",
  "              p2[0], 0, p2[1],",
  "              p2[0], height, p2[1],",
  "              p1[0], height, p1[1]",
  "            );");
const newWall = j(
  "          const tint = this.facadePalette[facadeTintIdx % this.facadePalette.length];",
  "          facadeTintIdx++;",
  "          for (let i = 0; i < pts.length; i++) {",
  "            const p1 = pts[i];",
  "            const p2 = pts[(i + 1) % pts.length];",
  "",
  "            const bBase = buildingBuffers.vertices.length / 3;",
  "            buildingBuffers.vertices.push(",
  "              p1[0], 0, p1[1],",
  "              p2[0], 0, p2[1],",
  "              p2[0], height, p2[1],",
  "              p1[0], height, p1[1]",
  "            );",
  "            for (let ci = 0; ci < 4; ci++) buildingBuffers.colors.push(tint[0], tint[1], tint[2]);");
if (!src.includes('const tint = this.facadePalette')) {
  if (!src.includes(oldWall)) { console.error('wall anchor missing'); process.exit(1); }
  src = src.replace(oldWall, newWall);
}

// 4) box landmark tint
const oldBox = j(
  "        } else if (Number.isFinite(lm.x) && Number.isFinite(lm.z)) {",
  "          const h = 18;",
  "          const w = 3.5;",
  "          const bBase = buildingBuffers.vertices.length / 3;");
if (!src.includes('boxTint')) {
  if (!src.includes(oldBox)) { console.error('box anchor missing'); process.exit(1); }
  src = src.replace(oldBox, j(
    "        } else if (Number.isFinite(lm.x) && Number.isFinite(lm.z)) {",
    "          const h = 18;",
    "          const w = 3.5;",
    "          const boxTint = this.facadePalette[facadeTintIdx % this.facadePalette.length];",
    "          facadeTintIdx++;",
    "          const bBase = buildingBuffers.vertices.length / 3;"));
}

// 5) box colors push sau UV box
const oldUv = j(
  "          for (let q = 0; q < 4; q++) {",
  "            buildingBuffers.uvs.push(",
  "              0, 0,",
  "              (w * 2) / FACADE_TILE_W, 0,",
  "              (w * 2) / FACADE_TILE_W, h / FACADE_TILE_H,",
  "              0, h / FACADE_TILE_H",
  "            );",
  "          }",
  "        }",
  "      });",
  "    }");
if (!src.includes('boxTint[0], boxTint[1], boxTint[2]')) {
  if (!src.includes(oldUv)) { console.error('uv anchor missing'); process.exit(1); }
  src = src.replace(oldUv, j(
    "          for (let q = 0; q < 4; q++) {",
    "            buildingBuffers.uvs.push(",
    "              0, 0,",
    "              (w * 2) / FACADE_TILE_W, 0,",
    "              (w * 2) / FACADE_TILE_W, h / FACADE_TILE_H,",
    "              0, h / FACADE_TILE_H",
    "            );",
    "          }",
    "          for (let cv = 0; cv < 16; cv++) buildingBuffers.colors.push(boxTint[0], boxTint[1], boxTint[2]);",
    "        }",
    "      });",
    "    }"));
}

// 6) color attribute khi dựng mesh
const oldMesh = j(
  "      buildGeo.setAttribute('position', new THREE.Float32BufferAttribute(buildingBuffers.vertices, 3));",
  "      if (buildingBuffers.uvs.length === buildingBuffers.vertices.length / 3 * 2) {",
  "        buildGeo.setAttribute('uv', new THREE.Float32BufferAttribute(buildingBuffers.uvs, 2));",
  "      }",
  "      buildGeo.setIndex(buildingBuffers.indices);",
  "      buildGeo.computeVertexNormals();",
  "      const buildMesh = new THREE.Mesh(buildGeo, this.buildingMat);",
  "      buildMesh.name = 'PBF_BuildingWalls';");
if (!src.includes("buildingBuffers.colors, 3")) {
  if (!src.includes(oldMesh)) { console.error('mesh anchor missing'); process.exit(1); }
  src = src.replace(oldMesh, j(
    "      buildGeo.setAttribute('position', new THREE.Float32BufferAttribute(buildingBuffers.vertices, 3));",
    "      if (buildingBuffers.uvs.length === buildingBuffers.vertices.length / 3 * 2) {",
    "        buildGeo.setAttribute('uv', new THREE.Float32BufferAttribute(buildingBuffers.uvs, 2));",
    "      }",
    "      if (buildingBuffers.colors.length === buildingBuffers.vertices.length) {",
    "        buildGeo.setAttribute('color', new THREE.Float32BufferAttribute(buildingBuffers.colors, 3));",
    "      }",
    "      buildGeo.setIndex(buildingBuffers.indices);",
    "      buildGeo.computeVertexNormals();",
    "      const buildMesh = new THREE.Mesh(buildGeo, this.buildingMat);",
    "      buildMesh.name = 'PBF_BuildingWalls';"));
}

fs.writeFileSync(P, src);
console.log('facade variety applied OK');
