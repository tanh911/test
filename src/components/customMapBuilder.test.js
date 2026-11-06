import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildCustomMap } from './environment.js';

/**
 * Custom Map Builder Tests — buildCustomMap phải xử lý đầy đủ mọi loại phần tử
 * mà MapEditor palette cung cấp (không phần tử nào bị bỏ qua vô hình).
 */
describe('buildCustomMap (MapEditor JSON → 3D Scene)', () => {
  const makeScene = () => {
    const scene = new THREE.Scene();
    return scene;
  };

  it('should return isCustomMap:false and no scenery for empty mapData', () => {
    const scene = makeScene();
    const result = buildCustomMap(scene, null);
    expect(result.isCustomMap).toBe(false);
    expect(result.scenery).toBeNull();
  });

  it('should render lane arrows (Z. 297) for ARROW_STRAIGHT, ARROW_LEFT and ARROW_RIGHT', () => {
    const scene = makeScene();
    const mapData = {
      mapInfo: { maxSpeedLimit: 50 },
      elements: [
        { id: 'a1', type: 'ARROW_STRAIGHT', x: 0, z: 0, width: 2, height: 5, rotation: 0 },
        { id: 'a2', type: 'ARROW_LEFT', x: 10, z: 0, width: 3, height: 5, rotation: 0 },
        { id: 'a3', type: 'ARROW_RIGHT', x: 20, z: 0, width: 3, height: 5, rotation: 0 }
      ]
    };
    const { scenery, isCustomMap } = buildCustomMap(scene, mapData);
    expect(isCustomMap).toBe(true);

    // Mỗi mũi tên tạo 1 group con chứa ShapeGeometry sơn trắng
    const arrowMeshes = [];
    scenery.traverse(obj => {
      if (obj.isMesh && obj.geometry?.type === 'ShapeGeometry') arrowMeshes.push(obj);
    });
    expect(arrowMeshes.length).toBe(3);
  });

  it('should render PARK with lawn, paths, trees and benches', () => {
    const scene = makeScene();
    const mapData = {
      mapInfo: { maxSpeedLimit: 50 },
      elements: [
        { id: 'park1', type: 'PARK', x: 0, z: 0, width: 30, height: 30, rotation: 0 }
      ]
    };
    const { scenery } = buildCustomMap(scene, mapData);

    const meshes = [];
    scenery.traverse(obj => { if (obj.isMesh) meshes.push(obj); });
    // Thảm cỏ + 4 lối đi + cây (thân + 2 tầng tán) + ghế (nệm + tựa + 2 chân)
    expect(meshes.length).toBeGreaterThanOrEqual(10);

    // Ít nhất 2 ghế đá (seat box 1.8 x 0.07 x 0.45)
    const benchSeats = meshes.filter(m =>
      Math.abs(m.geometry.parameters?.width - 1.8) < 0.001 &&
      Math.abs(m.geometry.parameters?.height - 0.07) < 0.001
    );
    expect(benchSeats.length).toBe(4);
  });

  it('should render PROMENADE with stone floor, tree rows and lamp posts', () => {
    const scene = makeScene();
    const mapData = {
      mapInfo: { maxSpeedLimit: 50 },
      elements: [
        { id: 'prom1', type: 'PROMENADE', x: 0, z: 0, width: 14, height: 60, rotation: 0 }
      ]
    };
    const { scenery } = buildCustomMap(scene, mapData);

    const meshes = [];
    scenery.traverse(obj => { if (obj.isMesh) meshes.push(obj); });
    expect(meshes.length).toBeGreaterThan(10);

    // Cây: 2 hàng x mỗi 8m trên chiều dài 60 => ít nhất 14 thân cây (cylinder r0.16-0.26)
    const trunks = meshes.filter(m => m.geometry?.type === 'CylinderGeometry');
    expect(trunks.length).toBeGreaterThanOrEqual(14);
  });

  it('should respect SPAWN_POINT element for player spawn position', () => {
    const scene = makeScene();
    const mapData = {
      mapInfo: {},
      elements: [
        { id: 'road1', type: 'ROAD_STRAIGHT', x: 0, z: 0, width: 14, height: 80, rotation: 0 },
        { id: 'spawn1', type: 'SPAWN_POINT', x: 4, z: 10, width: 2, height: 4, rotation: 0 }
      ]
    };
    const { playerSpawnPos } = buildCustomMap(scene, mapData);
    expect(playerSpawnPos.x).toBe(4 + 1);
    expect(playerSpawnPos.z).toBe(10 + 2);
  });

  it('should place elements with 90° rotation using swapped effective dimensions', () => {
    const scene = makeScene();
    const mapData = {
      mapInfo: {},
      elements: [
        // Đại lộ dọc 18x60 xoay ngang 90° → chiếm 60 theo x, 18 theo z
        { id: 'roadRot', type: 'ROAD_STRAIGHT', x: 0, z: 0, width: 18, height: 60, rotation: 90 }
      ]
    };
    const { scenery } = buildCustomMap(scene, mapData);
    const group = scenery.children.find(c => c.isGroup && Math.abs(c.rotation.y + Math.PI / 2) < 0.01);
    expect(group).toBeDefined();
  });
});
