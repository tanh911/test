// 📦 chunkBuilder.ts — gộp quad theo chunk 100 m (Protocol mục 7, phần G1)
// Mỗi chunk + material = 1 BufferGeometry → 1 draw call.
// addQuad nhận màu tùy chọn (4 đỉnh) → geometry có attribute 'color' cho material vertexColors.
import * as THREE from 'three';
import type { Quad } from './roadMesh';

export type MaterialKey = 'road' | 'road_worn' | 'white' | 'sidewalk' | 'building';

const CHUNK_SIZE = 100;

type RGB = [number, number, number];

interface Buf {
  positions: number[];
  indices: number[];
  colors: number[];
  vertexCount: number;
}

export class ChunkBuilder {
  private chunks = new Map<string, Map<MaterialKey, Buf>>();

  addQuad(quad: Quad, material: MaterialKey, colors?: RGB[]): void {
    const cx = (quad.a[0] + quad.b[0] + quad.c[0] + quad.d[0]) / 4;
    const cz = (quad.a[2] + quad.b[2] + quad.c[2] + quad.d[2]) / 4;
    const key = `${Math.floor(cx / CHUNK_SIZE)},${Math.floor(cz / CHUNK_SIZE)}`;
    let byMat = this.chunks.get(key);
    if (!byMat) {
      byMat = new Map();
      this.chunks.set(key, byMat);
    }
    let buf = byMat.get(material);
    if (!buf) {
      buf = { positions: [], indices: [], colors: [], vertexCount: 0 };
      byMat.set(material, buf);
    }
    for (const v of [quad.a, quad.b, quad.c, quad.d]) {
      buf.positions.push(v[0], v[1], v[2]);
    }
    if (colors) {
      // 4 màu khớp thứ tự a,b,c,d — thiếu thì lặp màu cuối
      for (let i = 0; i < 4; i++) {
        const c = colors[Math.min(i, colors.length - 1)];
        buf.colors.push(c[0], c[1], c[2]);
      }
    } else if (buf.colors.length > 0) {
      // quad không màu trong material đã có màu → trắng (khớp vertexColors lighting)
      for (let i = 0; i < 4; i++) buf.colors.push(1, 1, 1);
    }
    const b = buf.vertexCount;
    buf.indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
    buf.vertexCount += 4;
  }

  /** Build tất cả chunk → meshes (mỗi chunk+material 1 mesh) */
  build(): Array<{ geometry: THREE.BufferGeometry; material: MaterialKey; chunkKey: string }> {
    const out: Array<{ geometry: THREE.BufferGeometry; material: MaterialKey; chunkKey: string }> = [];
    for (const [chunkKey, byMat] of this.chunks) {
      for (const [material, buf] of byMat) {
        if (buf.vertexCount === 0) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.positions, 3));
        if (buf.colors.length === buf.positions.length) {
          geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.colors, 3));
        }
        geo.setIndex(buf.indices);
        geo.computeVertexNormals();
        out.push({ geometry: geo, material, chunkKey });
      }
    }
    return out;
  }

  get chunkCount(): number {
    return this.chunks.size;
  }
}

export function chunkKeyFor(x: number, z: number): string {
  return `${Math.floor(x / CHUNK_SIZE)},${Math.floor(z / CHUNK_SIZE)}`;
}
