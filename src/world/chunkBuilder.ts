// 📦 chunkBuilder.ts — lưu quad theo chunk 100 m (Protocol mục 7 G5)
// addQuad chỉ LƯU dữ liệu quad per-cell; buildCell(cellKey) tạo geometry theo yêu cầu
// → chunkManager nạp/hủy mesh theo vị trí camera, không build toàn map.
import * as THREE from 'three';
import type { Quad } from './roadMesh';

export type MaterialKey = 'road' | 'road_worn' | 'white' | 'sidewalk' | 'curb' | 'water' | 'bank' | 'building';

const CHUNK_SIZE = 100;

type RGB = [number, number, number];

interface QuadEntry {
  pts: number[];      // 12 số: a,b,c,d (x,y,z)
  colors?: number[];  // 12 số: màu 4 đỉnh — chỉ material vertexColors
}

export class ChunkBuilder {
  private cells = new Map<string, Map<MaterialKey, QuadEntry[]>>();

  addQuad(quad: Quad, material: MaterialKey, colors?: RGB[]): void {
    const cx = (quad.a[0] + quad.b[0] + quad.c[0] + quad.d[0]) / 4;
    const cz = (quad.a[2] + quad.b[2] + quad.c[2] + quad.d[2]) / 4;
    const key = chunkKeyFor(cx, cz);
    let byMat = this.cells.get(key);
    if (!byMat) {
      byMat = new Map();
      this.cells.set(key, byMat);
    }
    let list = byMat.get(material);
    if (!list) {
      list = [];
      byMat.set(material, list);
    }
    const pts: number[] = [];
    for (const v of [quad.a, quad.b, quad.c, quad.d]) pts.push(v[0], v[1], v[2]);
    let cols: number[] | undefined;
    if (colors) {
      cols = [];
      for (let i = 0; i < 4; i++) {
        const c = colors[Math.min(i, colors.length - 1)];
        cols.push(c[0], c[1], c[2]);
      }
    }
    list.push({ pts, colors: cols });
  }

  /** Danh sách cell key có dữ liệu */
  cellKeys(): string[] {
    return Array.from(this.cells.keys());
  }

  hasCell(key: string): boolean {
    return this.cells.has(key);
  }

  /** Cell chứa các điểm trong bán kính quanh (x,z)? — bbox thô theo tâm cell */
  cellCenter(key: string): { x: number; z: number } {
    const [ix, iz] = key.split(',').map(Number);
    return { x: (ix + 0.5) * CHUNK_SIZE, z: (iz + 0.5) * CHUNK_SIZE };
  }

  /** Build geometry cho 1 cell — mỗi material 1 geometry (caller chịu dispose) */
  buildCell(key: string): Array<{ geometry: THREE.BufferGeometry; material: MaterialKey }> {
    const byMat = this.cells.get(key);
    if (!byMat) return [];
    const out: Array<{ geometry: THREE.BufferGeometry; material: MaterialKey }> = [];
    for (const [material, list] of byMat) {
      if (!list.length) continue;
      let vertCount = 0;
      let hasColor = false;
      for (const e of list) {
        vertCount += 4;
        if (e.colors) hasColor = true;
      }
      const positions = new Float32Array(vertCount * 3);
      const colors = hasColor ? new Float32Array(vertCount * 3) : null;
      const indices = new Uint32Array(list.length * 6);
      let v = 0;
      let ii = 0;
      for (const e of list) {
        positions.set(e.pts, v * 3);
        if (colors) {
          colors.set(e.colors ?? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], v * 3);
        }
        indices[ii++] = v; indices[ii++] = v + 1; indices[ii++] = v + 2;
        indices[ii++] = v; indices[ii++] = v + 2; indices[ii++] = v + 3;
        v += 4;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (colors) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      out.push({ geometry: geo, material });
    }
    return out;
  }

  get cellCount(): number {
    return this.cells.size;
  }

  /** Tổng số quad đã lưu (không build geometry) */
  get quadCount(): number {
    let n = 0;
    for (const byMat of this.cells.values()) {
      for (const list of byMat.values()) n += list.length;
    }
    return n;
  }
}

export function chunkKeyFor(x: number, z: number): string {
  return `${Math.floor(x / CHUNK_SIZE)},${Math.floor(z / CHUNK_SIZE)}`;
}

export const CHUNK_SIZE_M = CHUNK_SIZE;
