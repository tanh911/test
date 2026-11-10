// 🧩 chunkManager.ts — streaming chunk 100 m (Protocol Prompt 6 / mục 7)
// Nạp cell (chunk+material → mesh) khi vào bán kính camera, hủy khi ra xa + hysteresis.
// Ngân sách G5: draw calls ≤300 trên map 2km×2km.
import * as THREE from 'three';
import type { ChunkBuilder, MaterialKey } from './chunkBuilder';
import { CHUNK_SIZE_M } from './chunkBuilder';

export interface ChunkManagerOptions {
  loadRadius: number;    // m — nạp cell khi tâm cell cách camera < loadRadius
  unloadRadius: number;  // m — hủy khi > unloadRadius (loadRadius + hysteresis)
  materials: Record<string, THREE.Material>;
  /** object phụ (đèn/biển) gắn theo cell — add/remove cùng cell, KHÔNG dispose (dùng lại) */
  extras?: Map<string, THREE.Object3D[]>;
}

export interface ChunkStats {
  cellsLoaded: number;
  cellsTotal: number;
  meshes: number;
}

export class ChunkManager {
  private loaded = new Map<string, THREE.Mesh[]>();
  private extrasLoaded = new Set<string>();
  private opts: ChunkManagerOptions;
  private group = new THREE.Group();
  readonly totalCells: number;

  constructor(private builder: ChunkBuilder, private scene: THREE.Scene, opts: ChunkManagerOptions) {
    this.opts = opts;
    this.totalCells = builder.cellCount;
    this.group.name = 'chunkStreaming';
    scene.add(this.group);
  }

  /** Mở rộng bán kính nạp theo độ cao camera — nhìn từ trên cao phải thấy cả quận,
   *  không thể chỉ nạp đĩa 300 m quanh chân máy quay (hysteresis giữ nguyên +120 m). */
  setLoadRadius(loadRadius: number): void {
    this.opts.loadRadius = loadRadius;
    this.opts.unloadRadius = loadRadius + 120;
  }

  /** Gọi mỗi frame với vị trí camera — nạp/hủy cell */
  update(camX: number, camZ: number): ChunkStats {
    const { loadRadius, unloadRadius } = this.opts;
    let loaded = 0;
    let meshes = 0;

    // hủy cell ngoài bán kính (mesh geometry dispose + extras remove)
    for (const [key, cellMeshes] of this.loaded) {
      const c = this.builder.cellCenter(key);
      const d = Math.hypot(c.x - camX, c.z - camZ);
      if (d > unloadRadius) {
        for (const m of cellMeshes) {
          this.group.remove(m);
          m.geometry.dispose();
        }
        this.loaded.delete(key);
      }
    }
    if (this.opts.extras) {
      for (const key of this.extrasLoaded) {
        const parts = this.opts.extras.get(key);
        if (!parts) continue;
        // tâm cell extras: tính từ key
        const [ix, iz] = key.split(',').map(Number);
        const cx = (ix + 0.5) * 100;
        const cz = (iz + 0.5) * 100;
        if (Math.hypot(cx - camX, cz - camZ) > unloadRadius) {
          for (const o of parts) this.scene.remove(o);
          this.extrasLoaded.delete(key);
        }
      }
    }

    // nạp cell trong bán kính — quét grid quanh camera
    const half = Math.ceil(loadRadius / CHUNK_SIZE_M);
    const baseX = Math.floor(camX / CHUNK_SIZE_M);
    const baseZ = Math.floor(camZ / CHUNK_SIZE_M);
    for (let ix = baseX - half; ix <= baseX + half; ix++) {
      for (let iz = baseZ - half; iz <= baseZ + half; iz++) {
        const key = `${ix},${iz}`;
        if (!this.loaded.has(key) && this.builder.hasCell(key)) {
          const c = this.builder.cellCenter(key);
          if (Math.hypot(c.x - camX, c.z - camZ) <= loadRadius) {
            const cellMeshes: THREE.Mesh[] = [];
            for (const { geometry, material } of this.builder.buildCell(key)) {
              const mat = this.opts.materials[material] || this.opts.materials.road;
              const mesh = new THREE.Mesh(geometry, mat);
              mesh.receiveShadow = true;
              if (material === ('building' satisfies MaterialKey)) mesh.castShadow = true;
              mesh.name = `chunk_${key}_${material}`;
              this.group.add(mesh);
              cellMeshes.push(mesh);
            }
            this.loaded.set(key, cellMeshes);
          }
        }
        // extras (đèn/biển) của cell
        if (this.opts.extras && !this.extrasLoaded.has(key)) {
          const parts = this.opts.extras.get(key);
          if (parts && parts.length) {
            const cx = (ix + 0.5) * 100;
            const cz = (iz + 0.5) * 100;
            if (Math.hypot(cx - camX, cz - camZ) <= loadRadius) {
              for (const o of parts) this.scene.add(o);
              this.extrasLoaded.add(key);
            }
          }
        }
      }
    }

    for (const cellMeshes of this.loaded.values()) {
      loaded++;
      meshes += cellMeshes.length;
    }
    return { cellsLoaded: loaded, cellsTotal: this.totalCells, meshes };
  }

  dispose(): void {
    for (const cellMeshes of this.loaded.values()) {
      for (const m of cellMeshes) m.geometry.dispose();
    }
    this.loaded.clear();
    if (this.opts.extras) {
      for (const key of this.extrasLoaded) {
        for (const o of this.opts.extras.get(key) ?? []) this.scene.remove(o);
      }
    }
    this.extrasLoaded.clear();
    this.group.parent?.remove(this.group);
  }
}
