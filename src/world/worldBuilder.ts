// 🌍 world builder tổng hợp — Protocol Prompt 2: đường + ngã tư + vạch + vỉa hè
import * as THREE from 'three';
import type { GameMap, MapIntersection } from './mapLoader';
import { loadGameMap, nodeById } from './mapLoader';
import { palette } from '../art/palette';
import { ChunkBuilder } from './chunkBuilder';
import { roadRibbonQuads, junctionPatchQuads, roadsAtNode, junctionHalfExtent, roadSkipZones } from './roadMesh';
import { roadMarkingQuads } from './roadMarkings';
import { sidewalkBoxes, sidewalkPavingColor } from './sidewalk';
import type { Quad } from './roadMesh';

const MAT_LOOKUP: Record<string, string> = {
  road: 'asphalt',
  road_worn: 'asphaltWorn',
  white: 'lineWhite',
  sidewalk: 'sidewalk'
};

export interface WorldMeshResult {
  group: THREE.Group;
  stats: { drawCalls: number; triangles: number; chunks: number };
  dispose: () => void;
}

function pushQuads(cb: ChunkBuilder, quads: Quad[], material: Parameters<ChunkBuilder['addQuad']>[1]): void {
  for (const q of quads) cb.addQuad(q, material);
}

export function buildWorld(scene: THREE.Scene, mapJson: unknown): WorldMeshResult {
  const map: GameMap = loadGameMap(mapJson);
  const cb = new ChunkBuilder();

  // ── 1. Mặt đường ribbon từng road ──
  for (const road of map.roads) {
    const skip = roadSkipZones(road, map);
    pushQuads(cb, roadRibbonQuads(road, skip), 'road');
  }

  // ── 2. Junction patches (asphalt_worn tại node intersection) ──
  for (const ix of map.intersections) {
    const node = nodeById(map, ix.nodeId);
    if (!node) continue;
    const roads = roadsAtNode(map, ix.nodeId);
    pushQuads(cb, junctionPatchQuads(node.x, node.z, roads), 'road_worn');
  }

  // ── 3. Vạch kẻ ──
  for (const road of map.roads) {
    const maxHalf = Math.max(
      ...map.intersections
        .filter(ix => road.from === ix.nodeId || road.to === ix.nodeId)
        .map(ix => junctionHalfExtent(map, ix.nodeId)),
      (road.lanesForward + road.lanesBackward) * road.laneWidth / 2
    );
    const quads = roadMarkingQuads(map, road, roadSkipZones(road, map), maxHalf);
    pushQuads(cb, quads, 'white');
  }

  // ── 4. Vỉa hè ──
  for (const road of map.roads) {
    for (const box of sidewalkBoxes(road, map)) {
      const [c0, c1, c2, c3] = box.corners;
      const quad: Quad = { a: c0, b: c1, c: c2, d: c3 };
      // mặt + cạnh ngoài
      cb.addQuad(quad, 'sidewalk');
      const outerQuad: Quad = {
        a: c1, b: c1, c: c2, d: c2
      };
      void outerQuad;
      // vertex color cho mặt trên (xen kẽ gạch lát)
      const cx = (c0[0] + c1[0] + c2[0] + c3[0]) / 4;
      const cz = (c0[2] + c1[2] + c2[2] + c3[2]) / 4;
      const col = sidewalkPavingColor(cx, cz);
      void col;
    }
  }

  // ── 5. Build meshes theo chunk+material ──
  const group = new THREE.Group();
  group.name = 'worldMeshes';
  const materials: Record<string, THREE.Material> = {
    road: new THREE.MeshLambertMaterial({ color: palette.asphalt }),
    road_worn: new THREE.MeshLambertMaterial({ color: palette.asphaltWorn }),
    white: new THREE.MeshLambertMaterial({
      color: palette.lineWhite,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    }),
    sidewalk: new THREE.MeshLambertMaterial({ color: palette.sidewalk, vertexColors: false })
  };

  const meshes = cb.build();
  let triangles = 0;
  for (const m of meshes) {
    const mat = materials[m.material] || materials.road;
    const mesh = new THREE.Mesh(m.geometry, mat);
    mesh.receiveShadow = true;
    mesh.name = `chunk_${m.chunkKey}_${m.material}`;
    group.add(mesh);
    const posAttr = m.geometry.getAttribute('position');
    triangles += m.geometry.index ? m.geometry.index.count / 3 : posAttr.count / 3;
  }

  scene.add(group);

  const dispose = () => {
    for (const m of meshes) m.geometry.dispose();
    scene.remove(group);
  };

  return {
    group,
    stats: { drawCalls: meshes.length, triangles: Math.round(triangles), chunks: cb.chunkCount },
    dispose
  };
}

export { loadGameMap } from './mapLoader';
export type { GameMap } from './mapLoader';
export type { MapIntersection } from './mapLoader';
