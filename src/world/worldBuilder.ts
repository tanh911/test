// 🌍 world builder tổng hợp — Protocol Prompt 2-4: đường + giao lộ + vạch + vỉa hè + nhà + props
import * as THREE from 'three';
import type { GameMap, MapIntersection } from './mapLoader';
import { loadGameMap, nodeById } from './mapLoader';
import { palette } from '../art/palette';
import { ChunkBuilder } from './chunkBuilder';
import { roadRibbonQuads, junctionPatchQuads, roadsAtNode, junctionHalfExtent, roadSkipZones } from './roadMesh';
import { roadMarkingQuads } from './roadMarkings';
import { sidewalkBoxes, sidewalkCornerPads } from './sidewalk';
import { placeSigns } from './trafficSigns';
import { placeTrafficLights, applyLightVisuals, TrafficLightController } from './trafficLights';
import { allBuildingQuads } from './buildings';
import { placeProps, type PropsResult } from './props';
import type { Quad } from './roadMesh';

const MAT_LOOKUP: Record<string, string> = {
  road: 'asphalt',
  road_worn: 'asphaltWorn',
  white: 'lineWhite',
  sidewalk: 'sidewalk'
};

export interface WorldMeshResult {
  group: THREE.Group;
  controllers: TrafficLightController[];
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

  // ── 3.5 Biển báo StVO ──
  placeSigns(scene, map);
  const { controllers, lightsGroup } = placeTrafficLights(scene, map);
  const props = placeProps(scene, map);

  // ── 4. Vỉa hè: mặt trên phẳng + mặt curb đứng ──
  for (const road of map.roads) {
    for (const piece of sidewalkBoxes(road, map)) {
      const [t0, t1, t2, t3] = piece.top;
      cb.addQuad({ a: t0, b: t1, c: t2, d: t3 }, 'sidewalk');
      if (piece.curb) {
        const [c0, c1, c2, c3] = piece.curb;
        cb.addQuad({ a: c0, b: c1, c: c2, d: c3 }, 'sidewalk');
      }
    }
  }

  // ── 4.5 Pad vỉa hè 4 góc giao lộ ──
  for (const pad of sidewalkCornerPads(map)) {
    cb.addQuad(pad.top, 'sidewalk');
    for (const curb of pad.curbs) cb.addQuad(curb, 'sidewalk');
  }

  // ── 4.6 Nhà phố (vertex color facade + cửa sổ + AO) ──
  for (const bq of allBuildingQuads(map)) {
    cb.addQuad(bq.quad, 'building', bq.colors);
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
    sidewalk: new THREE.MeshLambertMaterial({ color: palette.sidewalk }),
    building: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  };

  const meshes = cb.build();
  let triangles = 0;
  for (const m of meshes) {
    const mat = materials[m.material] || materials.road;
    const mesh = new THREE.Mesh(m.geometry, mat);
    mesh.receiveShadow = true;
    if (m.material === 'building') mesh.castShadow = true; // nhà đổ bóng xuống đường
    mesh.name = `chunk_${m.chunkKey}_${m.material}`;
    group.add(mesh);
    const posAttr = m.geometry.getAttribute('position');
    triangles += m.geometry.index ? m.geometry.index.count / 3 : posAttr.count / 3;
  }

  scene.add(group);

  let controllerTimer = 0;
  return {
    group,
    controllers,
    stats: { drawCalls: meshes.length, triangles: Math.round(triangles), chunks: cb.chunkCount },
    update(dt: number) {
      controllerTimer += dt;
      void controllerTimer;
      controllers.forEach(c => c.update(dt));
      applyLightVisuals(lightsGroup);
    },
    dispose() {
      for (const m of meshes) m.geometry.dispose();
      scene.remove(group);
      scene.remove(lightsGroup);
      props.dispose();
    }
  };
}

export { loadGameMap } from './mapLoader';
export type { GameMap } from './mapLoader';
export type { MapIntersection } from './mapLoader';
