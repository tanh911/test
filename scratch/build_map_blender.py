# -*- coding: utf-8 -*-
"""Blender pipeline v3: graph OSM -> GLB co TEXTURE + PROPS.
Moi: asphalt/facade/roof texture tu sinh (numpy), UV mapping, cot den duong,
guardrail W-beam lien tuc 2 le motorway.
Chay: blender.exe --background --python scratch/build_map_blender.py
Vertex: (graphX, HEIGHT, graphZ) = he three.js, export_yup=False.
"""
import json
import math
import os
import random

import bpy
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
_args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
GRAPH = _args[0] if len(_args) > 0 else os.path.join(ROOT, 'src', 'simulation', 'data', 'road_graph_autobahn.json')
OUT = _args[1] if len(_args) > 1 else os.path.join(ROOT, 'public', 'maps', 'autobahn_v2_blender.glb')

URBAN = {'primary', 'secondary', 'tertiary', 'residential', 'living_street', 'unclassified'}
CELL = 200.0


def make_image(name, w, h, painter):
    img = bpy.data.images.get(name)
    if img:
        return img
    img = bpy.data.images.new(name, w, h, alpha=True)
    buf = np.zeros(w * h * 4, dtype=np.float32)
    painter(buf, w, h)
    img.pixels.foreach_set(buf)
    img.pack()
    return img


def paint_asphalt(buf, w, h):
    rng = np.random.default_rng(7)
    n = (w * h, 3)
    base = np.array([0.085, 0.089, 0.098])
    noise = rng.normal(0, 0.016, n)
    px = base + noise
    mask = rng.random(n[0]) < 0.04
    px[mask] += 0.045
    # 🛞 vệt bánh xe: 2 dải tối dọc theo chiều dài đường (u ≈ 0.30 và 0.70)
    px2 = px.reshape(h, w, 3)
    uu = np.linspace(0, 1, w, endpoint=False)[None, :].repeat(h, 0)
    vv = np.linspace(0, 1, h, endpoint=False)[:, None].repeat(w, 1)
    for uc in (0.30, 0.70):
        px2[np.abs(uu - uc) < 0.055] -= 0.020
    # 🩹 miếng vá asphalt tối hơn
    for (ax, ay, awd, aht) in ((0.18, 0.30, 0.16, 0.22), (0.62, 0.62, 0.20, 0.16)):
        px2[(uu >= ax) & (uu <= ax + awd) & (vv >= ay) & (vv <= ay + aht)] -= 0.028
    # 🕸️ vết nứt: polyline tối mảnh chạy dọc
    for _ in range(4):
        cx = rng.uniform(0.1, 0.9)
        jit = rng.normal(0, 0.02, h)
        for row in range(h):
            x = int((cx + jit[row]) * w) % w
            px2[row, x] -= 0.05
            if row + 1 < h:
                px2[row + 1, min(w - 1, x + 1)] -= 0.03
    px = np.clip(px2.reshape(h * w, 3), 0, 1)
    buf[0::4] = px[:, 0]
    buf[1::4] = px[:, 1]
    buf[2::4] = px[:, 2]
    buf[3::4] = 1.0


def paint_facade(buf, w, h, tint):
    rng = np.random.default_rng(11)
    px = np.tile(tint, (w * h, 1))
    # nhụa vữa: mảng loang tần số thấp + nhiễu mịn
    cell = max(8, w // 8)
    gh, gw = math.ceil(h / cell), math.ceil(w / cell)
    blotch = rng.normal(0, 0.030, (gh, gw, 1))
    blotch = np.repeat(np.repeat(blotch, cell, 0), cell, 1)[:h, :w, 0]
    px += blotch.reshape(w * h, 1)
    px += rng.normal(0, 0.015, (w * h, 3))
    uu = np.tile(np.linspace(0, 1, w, endpoint=False), h)
    vm = np.repeat(np.linspace(0, 1, h, endpoint=False), w)
    win_u = (uu > 0.20) & (uu < 0.80)
    win_v = (vm > 0.28) & (vm < 0.74)
    frame_u = (uu > 0.15) & (uu < 0.85)
    frame_v = (vm > 0.23) & (vm < 0.79)
    frame = frame_u & frame_v & ~(win_u & win_v)
    glass = win_u & win_v
    px[frame] = np.array([0.92, 0.92, 0.90])
    # kính: gradient dọc — trên tối, dưới sáng phản trời
    gv = vm[glass]
    px[glass] = np.stack([0.20 + 0.16 * (1 - gv),
                          0.27 + 0.18 * (1 - gv),
                          0.36 + 0.20 * (1 - gv)], axis=1) + rng.normal(0, 0.02, (int(glass.sum()), 3))
    px[frame_u & (vm >= 0.74) & (vm < 0.79)] = np.array([0.95, 0.95, 0.93])   # sill
    px[frame_u & (vm >= 0.23) & (vm < 0.26)] = np.array([0.90, 0.90, 0.88])   # lintel
    buf[0::4] = np.clip(px[:, 0], 0, 1)
    buf[1::4] = np.clip(px[:, 1], 0, 1)
    buf[2::4] = np.clip(px[:, 2], 0, 1)
    buf[3::4] = 1.0


def paint_facade_beige(buf, w, h):
    paint_facade(buf, w, h, np.array([0.62, 0.58, 0.52]))


def paint_facade_gray(buf, w, h):
    paint_facade(buf, w, h, np.array([0.52, 0.55, 0.58]))


def paint_roof(buf, w, h):
    """Ngói xếp hàng so le — kiểu mái Đức."""
    rng = np.random.default_rng(23)
    px = np.full((h, w, 3), 0.16)
    tw, th = 32, 18
    for row in range(h // th + 1):
        y0 = row * th + 2
        y1 = min(h, y0 + th - 2)
        if y0 >= h:
            break
        off = (row % 2) * (tw // 2)
        for x0 in range(-tw, w + tw, tw):
            xx0, xx1 = x0 + off, x0 + off + tw - 2
            if xx1 <= 0 or xx0 >= w or y1 <= y0:
                continue
            v = float(np.clip(0.44 + rng.normal(0, 0.05), 0.32, 0.58))
            px[y0:y1, max(0, xx0):min(w, xx1), 0] = v * 0.98
            px[y0:y1, max(0, xx0):min(w, xx1), 1] = v * 0.60
            px[y0:y1, max(0, xx0):min(w, xx1), 2] = v * 0.52
    px += rng.normal(0, 0.02, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_brick(buf, w, h):
    """Gạch chạy mạch so le + mạch vữa sáng."""
    rng = np.random.default_rng(53)
    px = np.full((h, w, 3), 0.74)
    row_h, bh, bw = 16, 12, 30
    for row in range(h // row_h + 1):
        y0 = row * row_h + 2
        y1 = min(h, y0 + bh)
        if y0 >= h:
            break
        off = (row % 2) * (bw // 2)
        for x0 in range(-bw, w + bw, bw + 2):
            xx0, xx1 = x0 + off + 2, x0 + off + bw
            if xx1 <= 0 or xx0 >= w or y1 <= y0:
                continue
            v = float(np.clip(0.40 + rng.normal(0, 0.06), 0.26, 0.56))
            px[y0:y1, max(0, xx0):min(w, xx1), 0] = v
            px[y0:y1, max(0, xx0):min(w, xx1), 1] = v * 0.58
            px[y0:y1, max(0, xx0):min(w, xx1), 2] = v * 0.46
    px += rng.normal(0, 0.015, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_tree(buf, w, h):
    """Billboard cây RGBA: thân + tán cụm tròn, alpha clip."""
    rng = np.random.default_rng(71)
    px = np.zeros((h, w, 4))
    yy, xx = np.mgrid[0:h, 0:w]
    yy, xx = yy.astype(np.float32), xx.astype(np.float32)
    tx = w * 0.5 + float(rng.normal(0, w * 0.015))
    trunk_m = (np.abs(xx - tx) < w * 0.022) & (yy > h * 0.60)
    px[trunk_m, 0] = 0.32
    px[trunk_m, 1] = 0.22
    px[trunk_m, 2] = 0.13
    px[trunk_m, 3] = 1.0
    for _ in range(52):
        cx = w * 0.5 + float(rng.normal(0, w * 0.20))
        cy = h * 0.50 + float(rng.normal(0, h * 0.17))
        r = float(rng.uniform(h * 0.06, h * 0.15))
        m = ((xx - cx) ** 2 + (yy - cy) ** 2) < r * r
        sh = float(rng.uniform(0.0, 1.0))
        px[m, 0] = 0.09 + sh * 0.10
        px[m, 1] = 0.28 + sh * 0.18
        px[m, 2] = 0.07 + sh * 0.06
        px[m, 3] = 1.0
    hl = (yy < h * 0.30) & (px[:, :, 3] > 0)
    px[hl, 0] += 0.06
    px[hl, 1] += 0.08
    px[hl, 2] += 0.04
    px = np.clip(px, 0, 1)
    buf[:] = px.reshape(-1)


def paint_cobble(buf, w, h):
    """Đá cobblestone 8x8 viên/tile: nền vữa tối, viên đá sáng lệch sắc từng viên."""
    rng = np.random.default_rng(31)
    px = np.full((h, w, 3), 0.30)
    n_cell = 8
    cw, ch = w // n_cell, h // n_cell
    for cy in range(n_cell):
        for cx in range(n_cell):
            v = float(np.clip(0.50 + rng.normal(0, 0.06), 0.34, 0.70))
            x0 = cx * cw + 3
            x1 = (cx + 1) * cw - 3
            y0 = cy * ch + 3
            y1 = (cy + 1) * ch - 3
            if x1 <= x0 or y1 <= y0:
                continue
            px[y0:y1, x0:x1, 0] = v
            px[y0:y1, x0:x1, 1] = v
            px[y0:y1, x0:x1, 2] = min(1.0, v * 1.04)
    px += rng.normal(0, 0.018, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_shopfront(buf, w, h):
    """Mặt tiền cửa hàng: mái hiên sọc đỏ (trên) + kính tối khung xám (dưới)."""
    rng = np.random.default_rng(41)
    px = np.zeros((h, w, 3))
    aw = int(h * 0.30)
    px[:aw, :, :] = np.array([0.55, 0.16, 0.14])          # mái hiên đỏ
    for sx in range(0, w, 32):                              # sọc sáng 16px
        px[:aw, sx:sx + 16, :] *= 1.30
    gy = aw + int(h * 0.06)
    px[gy:, :, :] = np.array([0.10, 0.14, 0.18])           # kính xanh tối
    px[gy:, :, :] += rng.normal(0, 0.02, (h - gy, w, 3))
    for sx in (0, w // 2, w - 3):                           # cột khung dọc
        px[aw:, sx:sx + 3, :] = 0.42
    dx0, dx1 = int(w * 0.42), int(w * 0.58)
    px[gy + 6:int(h * 0.92), dx0:dx1, :] = 0.24            # cửa đi giữa
    px[int(h * 0.92):, :, :] = 0.30                         # bậc cửa
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def emit_box(acc, cx, cy, cz, sx, sy, sz, yaw):
    """Box 5 mặt (bỏ đáy) xoay yaw quanh trục Y — dùng cho xe đỗ."""
    c, s = math.cos(yaw), math.sin(yaw)
    pts = []
    for dy in (0.0, 1.0):
        for dx in (-1.0, 1.0):
            for dz in (-1.0, 1.0):
                lx, lz = dx * sx * 0.5, dz * sz * 0.5
                pts.append((cx + lx * c - lz * s, cy + dy * sy, cz + lx * s + lz * c))
    # 0(-x,-z,dưới) 1(-x,+z,dưới) 2(+x,-z,dưới) 3(+x,+z,dưới)
    # 4(-x,-z,trên) 5(-x,+z,trên) 6(+x,-z,trên) 7(+x,+z,trên)
    acc.quad(pts[4], pts[5], pts[7], pts[6])   # nóc
    acc.quad(pts[2], pts[3], pts[7], pts[6])   # đầu +x
    acc.quad(pts[0], pts[1], pts[5], pts[4])   # đuôi -x
    acc.quad(pts[1], pts[3], pts[7], pts[5])   # hông +z
    acc.quad(pts[0], pts[2], pts[6], pts[4])   # hông -z


def mat_tex_alpha(name, img, rough=0.9):
    """Material texture có alpha (billboard cây) — GLTF export alphaMode mask/blend."""
    m = mat_tex(name, img, rough)
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    for n in nt.nodes:
        if n.type == 'TEX_IMAGE':
            nt.links.new(n.outputs['Alpha'], bsdf.inputs['Alpha'])
            break
    for attr, val in (('blend_method', 'CLIP'), ('shadow_method', 'CLIP')):
        try:
            setattr(m, attr, val)
        except Exception:
            pass
    return m


def mat_tex(name, img, rough=0.9):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rough
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    tex.extension = 'REPEAT'
    nt.links.new(bsdf.inputs['Base Color'], tex.outputs['Color'])
    return m


def mat(name, color, rough=0.9, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    return m


class MeshAcc:
    def __init__(self, name, material, use_uv=False):
        self.name = name
        self.material = material
        self.verts = []
        self.faces = []
        self.uvs = []
        self.use_uv = use_uv

    def quad(self, a, b, c, d, uvs=None):
        base = len(self.verts)
        self.verts.extend([a, b, c, d])
        self.faces.append((base, base + 1, base + 2, base + 3))
        if self.use_uv:
            self.uvs.extend(uvs or [(0, 0), (1, 0), (1, 1), (0, 1)])

    def disc(self, cx, cy, cz, radius, n=14):
        ring = []
        for i in range(n):
            ang = 2 * math.pi * i / n
            ring.append(len(self.verts))
            self.verts.append((cx + math.cos(ang) * radius, cy, cz + math.sin(ang) * radius))
            if self.use_uv:
                self.uvs.append(((cx + math.cos(ang) * radius) / 2.0, (cz + math.sin(ang) * radius) / 2.0))
        center = len(self.verts)
        self.verts.append((cx, cy, cz))
        if self.use_uv:
            self.uvs.append((cx / 2.0, cz / 2.0))
        for i in range(n):
            self.faces.append((ring[i], ring[(i + 1) % n], center))

    def commit(self, chunk_size=250.0):
        """Chia mesh theo ô spatial 250m → three.js frustum culling hoạt động
        (mesh phủ cả map 12km → không bao giờ bị cull → 500k+ verts render mỗi frame).
        Mỗi chunk = 1 mesh riêng có bbox nhỏ → chỉ render vùng camera nhìn thấy."""
        if not self.faces:
            return
        cells = {}
        for fi, face in enumerate(self.faces):
            xs = [self.verts[vi][0] for vi in face]
            zs = [self.verts[vi][2] for vi in face]
            cx = int(math.floor(sum(xs) / len(xs) / chunk_size))
            cz = int(math.floor(sum(zs) / len(zs) / chunk_size))
            cells.setdefault((cx, cz), []).append(fi)

        for (cx, cz), face_ids in cells.items():
            vert_map = {}
            local_verts = []
            local_faces = []
            local_uvs = []
            for fi in face_ids:
                face = self.faces[fi]
                local_face = []
                for vi in face:
                    if vi not in vert_map:
                        vert_map[vi] = len(local_verts)
                        local_verts.append(self.verts[vi])
                        if self.use_uv and self.uvs:
                            local_uvs.append(self.uvs[vi])
                    local_face.append(vert_map[vi])
                local_faces.append(tuple(local_face))
            mesh = bpy.data.meshes.new(f'{self.name}_{cx}_{cz}')
            mesh.from_pydata(local_verts, [], local_faces)
            if self.use_uv and local_uvs:
                uv_layer = mesh.uv_layers.new(name='UVMap')
                flat = np.zeros(len(local_verts) * 2, dtype=np.float32)
                for i, uv in enumerate(local_uvs):
                    flat[i * 2] = uv[0]
                    flat[i * 2 + 1] = uv[1]
                uv_layer.data.foreach_set('uv', flat)
            mesh.materials.append(self.material)
            obj = bpy.data.objects.new(f'{self.name}_{cx}_{cz}', mesh)
            bpy.context.scene.collection.objects.link(obj)
        # ✅ idempotent: dọn buffer — commit 2 lần không nhân đôi geometry
        self.verts = []
        self.faces = []
        self.uvs = []


def build_elev_index(graph):
    grid = {}

    def add(ax, az, bx, bz, h):
        c0x = int(math.floor(min(ax, bx) / CELL))
        c1x = int(math.floor(max(ax, bx) / CELL))
        c0z = int(math.floor(min(az, bz) / CELL))
        c1z = int(math.floor(max(az, bz) / CELL))
        for cx in range(c0x, c1x + 1):
            for cz in range(c0z, c1z + 1):
                grid.setdefault((cx, cz), []).append((ax, az, bx, bz, h))

    for r in graph['roads']:
        if r['highway'] == 'motorway' and len(r.get('centerline') or []) >= 2:
            cl = r['centerline']
            for i in range(len(cl) - 1):
                add(cl[i][0], cl[i][1], cl[i + 1][0], cl[i + 1][1], 6)
    for w in graph.get('waterways') or []:
        if (w.get('width') or 0) < 12 or w.get('isClosed') or len(w.get('points') or []) < 2:
            continue
        pts = w['points']
        for i in range(len(pts) - 1):
            add(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3)
    return grid


def seg_intersect(a, b, c, d):
    r1x, r1z = b[0] - a[0], b[1] - a[1]
    r2x, r2z = d[0] - c[0], d[1] - c[1]
    den = r1x * r2z - r1z * r2x
    if abs(den) < 1e-9:
        return None
    t = ((c[0] - a[0]) * r2z - (c[1] - a[1]) * r2x) / den
    u = ((c[0] - a[0]) * r1z - (c[1] - a[1]) * r1x) / den
    if t < 0 or t > 1 or u < 0 or u > 1:
        return None
    return (a[0] + t * r1x, a[1] + t * r1z)


def road_crossings(graph, elev_grid, road):
    out = []
    if road.get('bridge') or (road.get('layer') or 0) > 0 or road['highway'] == 'motorway':
        return out
    cl = road.get('centerline') or []
    if len(cl) < 2:
        return out
    for i in range(len(cl) - 1):
        a, b = cl[i], cl[i + 1]
        c0x = int(math.floor(min(a[0], b[0]) / CELL))
        c1x = int(math.floor(max(a[0], b[0]) / CELL))
        c0z = int(math.floor(min(a[1], b[1]) / CELL))
        c1z = int(math.floor(max(a[1], b[1]) / CELL))
        seen = set()
        for cx in range(c0x, c1x + 1):
            for cz in range(c0z, c1z + 1):
                for sg in elev_grid.get((cx, cz), ()):
                    k = (sg[0], sg[1], sg[2], sg[3])
                    if k in seen:
                        continue
                    seen.add(k)
                    hit = seg_intersect(a, b, (sg[0], sg[1]), (sg[2], sg[3]))
                    if hit:
                        out.append((hit[0], hit[1], sg[4]))
    return out


def point_y(road, p, crossings, cum_frac):
    if road['highway'] in ('motorway', 'motorway_link'):
        y = 0.1
    else:
        y = 0.02
    if road.get('bridge') or (road.get('layer') or 0) > 0:
        H = max(4.0, (road.get('layer') or 1) * 5.5)
        ramp = max(0.0, min(1.0, min(cum_frac, 1.0 - cum_frac) / 0.3))
        y = max(y, 0.02 + (H - 0.02) * ramp)
    for cx, cz, h in crossings:
        dd = math.hypot(p[0] - cx, p[1] - cz)
        prof = 130.0 if h >= 6 else 90.0
        y = max(y, h * max(0.0, min(1.0, (prof - dd) / prof)))
    return y


def main():
    with open(GRAPH, encoding='utf-8') as f:
        graph = json.load(f)
    print('graph roads:', len(graph['roads']))

    bpy.ops.wm.read_factory_settings(use_empty=True)

    img_asphalt = make_image('V2_TexAsphalt', 256, 256, paint_asphalt)
    img_facade = make_image('V2_TexFacadeBeige', 256, 256, paint_facade_beige)
    img_facade2 = make_image('V2_TexFacadeGray', 256, 256, paint_facade_gray)
    img_roof = make_image('V2_TexRoof', 128, 128, paint_roof)
    img_cobble = make_image('V2_TexCobble', 256, 256, paint_cobble)
    img_shop = make_image('V2_TexShopfront', 256, 128, paint_shopfront)
    img_brick = make_image('V2_TexGach', 256, 256, paint_brick)
    img_tree = make_image('V2_TexCayBill', 256, 256, paint_tree)

    MATS = {
        'asphalt': mat_tex('V2_AsfaltTex', img_asphalt, 0.96),
        'asphalt2': mat_tex('V2_AsfaltTex2', img_asphalt, 0.95),
        'wall': mat_tex('V2_NhaTexBeige', img_facade, 0.85),
        'wall2': mat_tex('V2_NhaTexGray', img_facade2, 0.85),
        'roof': mat_tex('V2_MaiTex', img_roof, 0.9),
        'white': mat('V2_VachTrang', (0.90, 0.91, 0.92), 0.7),
        'sidewalk': mat_tex('V2_ViaHeCobble', img_cobble, 0.95),
        'shop': mat_tex('V2_CuaHang', img_shop, 0.75),
        'car_white': mat('V2_XeTrang', (0.82, 0.83, 0.84), 0.45, 0.25),
        'car_dark': mat('V2_XeDen', (0.09, 0.10, 0.12), 0.4, 0.3),
        'car_silver': mat('V2_XeBac', (0.52, 0.54, 0.56), 0.42, 0.35),
        'car_red': mat('V2_XeDo', (0.42, 0.09, 0.08), 0.45, 0.2),
        'car_blue': mat('V2_XeXanh', (0.10, 0.18, 0.40), 0.45, 0.2),
        'wheel': mat('V2_LopXe', (0.05, 0.05, 0.055), 0.9),
        'curb': mat('V2_Curb', (0.44, 0.47, 0.50), 0.85),
        'junc': mat_tex('V2_GiaoLoCobble', img_cobble, 0.95),
        'wall_brick': mat_tex('V2_NhaGachTex', img_brick, 0.9),
        'roof_flat': mat('V2_MaiBang', (0.16, 0.17, 0.18), 0.95),
        'tree': mat_tex_alpha('V2_CayBillTex', img_tree, 0.95),
        'hedge': mat('V2_RaoCay', (0.12, 0.30, 0.10), 1.0),
        'pole': mat('V2_CotDen', (0.30, 0.32, 0.34), 0.7, 0.5),
        'lamp': mat('V2_DenLamp', (0.95, 0.95, 0.85), 0.4),
        'rail': mat('V2_Guardrail', (0.62, 0.65, 0.68), 0.5, 0.7),
        'concrete': mat('V2_CauBeTong', (0.30, 0.32, 0.34), 0.85),
        'pier': mat('V2_TruCau', (0.26, 0.28, 0.30), 0.9),
        'park': mat('V2_ThaoNhien', (0.20, 0.36, 0.16), 1.0),
        'water': mat('V2_Nuoc', (0.10, 0.28, 0.42), 0.25),
        'railbed': mat('V2_DuongSat', (0.22, 0.21, 0.20), 0.95),
        'rail': mat('V2_Rail', (0.14, 0.14, 0.16), 0.5, 0.7),
    }

    elev_grid = build_elev_index(graph)

    # 🚦 Vị trí junction CÓ ĐÈN TÍN HIỆU (key = node name 'node_x_y') — cho stop bar + lane arrow
    signal_nodes = {}
    for j in graph.get('junctions', []):
        if j.get('trafficSignals'):
            signal_nodes[(j.get('id') or '').replace('junc_', '')] = (j.get('x'), j.get('z'))

    # 🏪 lưới ô 50m chứa điểm centerline đường phố — truy vấn nhanh "building mặt phố"
    urban_cells = {}
    for rd in graph['roads']:
        if rd.get('highway') in URBAN:
            for p in rd['centerline'][::3]:
                urban_cells.setdefault((int(p[0] // 50), int(p[1] // 50)), []).append((p[0], p[1]))

    def near_urban(x, z, r=28.0):
        cx, cz = int(x // 50), int(z // 50)
        for ix in (cx - 1, cx, cx + 1):
            for iz in (cz - 1, cz, cz + 1):
                for q in urban_cells.get((ix, iz), ()):
                    if (q[0] - x) ** 2 + (q[1] - z) ** 2 < r * r:
                        return True
        return False

    acc_road = MeshAcc('V2_DuongAsphalt', MATS['asphalt'], use_uv=True)
    acc_road2 = MeshAcc('V2_DuongAsphalt2', MATS['asphalt2'], use_uv=True)
    acc_junc = MeshAcc('V2_GiaoLo', MATS['junc'], use_uv=False)
    acc_white = MeshAcc('V2_VachTrang', MATS['white'])
    acc_walk = MeshAcc('V2_ViaHe', MATS['sidewalk'], use_uv=True)
    acc_shop = MeshAcc('V2_CuaHangStore', MATS['shop'], use_uv=True)
    acc_car_white = MeshAcc('V2_XeDoTrang', MATS['car_white'])
    acc_car_dark = MeshAcc('V2_XeDoDen', MATS['car_dark'])
    acc_car_silver = MeshAcc('V2_XeDoBac', MATS['car_silver'])
    acc_car_red = MeshAcc('V2_XeDoDo', MATS['car_red'])
    acc_car_blue = MeshAcc('V2_XeDoXanh', MATS['car_blue'])
    acc_wheel = MeshAcc('V2_XeLop', MATS['wheel'])
    _car_accs = (acc_car_white, acc_car_dark, acc_car_silver, acc_car_red, acc_car_blue)
    acc_brick = MeshAcc('V2_NhaGach', MATS['wall_brick'], use_uv=True)
    acc_roof_flat = MeshAcc('V2_MaiBang', MATS['roof_flat'])
    acc_tree = MeshAcc('V2_CayBill', MATS['tree'], use_uv=True)
    acc_hedge = MeshAcc('V2_RaoCayRunh', MATS['hedge'])
    acc_curb = MeshAcc('V2_Curb', MATS['curb'])
    acc_wall = MeshAcc('V2_NhaTuong', MATS['wall'], use_uv=True)
    acc_wall2 = MeshAcc('V2_NhaTuong2', MATS['wall2'], use_uv=True)
    acc_roof = MeshAcc('V2_NhaMai', MATS['roof'], use_uv=True)
    acc_park = MeshAcc('V2_ThaoNhien', MATS['park'])
    acc_water = MeshAcc('V2_Nuoc', MATS['water'])
    acc_railbed = MeshAcc('V2_DuongSat', MATS['railbed'])
    acc_rail = MeshAcc('V2_Rail', MATS['rail'])
    acc_bridge = MeshAcc('V2_CauDeck', MATS['concrete'])
    acc_pier = MeshAcc('V2_TruCau', MATS['pier'])
    acc_pole = MeshAcc('V2_CotDenDuong', MATS['pole'])
    acc_lamp = MeshAcc('V2_DenDuong', MATS['lamp'])
    acc_guard = MeshAcc('V2_GuardrailA2', MATS['rail'])

    rng = random.Random(42)

    for road in graph['roads']:
        cl = road.get('centerline') or []
        if len(cl) < 2:
            continue
        hw = road['highway']
        lanes = road.get('lanes') or 2
        width = road.get('width') or (lanes * 3.5)
        half = width / 2.0
        oneway = road.get('oneway', False)
        is_bridge = bool(road.get('bridge')) or (road.get('layer') or 0) > 0

        cum = [0.0]
        for i in range(1, len(cl)):
            cum.append(cum[i - 1] + math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]))
        total = cum[-1] or 1.0
        # 🛡️ đường degenerate (length < 1m) → seg_intersect chia 0 → NaN elevation →
        # quad NaN phủ toàn màn hình (bug "map trắng") — bỏ hẳn
        if total < 1.0:
            continue
        crossings = road_crossings(graph, elev_grid, road)

        acc = acc_road if hw in ('motorway', 'motorway_link', 'trunk') else acc_road2

        def py_at(i):
            y_ = point_y(road, cl[i], crossings, cum[i] / total)
            return y_ if math.isfinite(y_) else 0.02

        rib = []
        for i in range(len(cl)):
            p = cl[i]
            if i == 0:
                dx, dz = cl[1][0] - p[0], cl[1][1] - p[1]
            elif i == len(cl) - 1:
                dx, dz = p[0] - cl[i - 1][0], p[1] - cl[i - 1][1]
            else:
                dx, dz = cl[i + 1][0] - cl[i - 1][0], cl[i + 1][1] - cl[i - 1][1]
            L = math.hypot(dx, dz) or 1.0
            nx, nz = -dz / L, dx / L
            y = py_at(i)
            v = cum[i] / 4.0
            rib.append((p[0] - nx * half, y, p[1] - nz * half,
                        p[0] + nx * half, y, p[1] + nz * half, nx, nz, v))
        for i in range(len(rib) - 1):
            l0, r0 = rib[i], rib[i + 1]
            acc.quad(
                (l0[0], l0[1], l0[2]), (r0[0], r0[1], r0[2]),
                (r0[3], r0[4], r0[5]), (l0[3], l0[4], l0[5]),
                uvs=[(0, l0[8]), (1, l0[8]), (1, r0[8]), (0, r0[8])],
            )

        # 🛟 Standstreifen (làn khẩn cấp 2.6m) cho motorway: dải nhựa + vạch rời Z. 295
        if hw in ('motorway',) and len(rib) >= 2:
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                # nhựa Standstreifen bên PHẢI chiều đi (motorway oneway)
                ss0a = (l0[3] + n0x * 0.1, l0[1], l0[2] + n0z * 0.1)
                ss0b = (l0[3] + n0x * 2.7, l0[1], l0[2] + n0z * 2.7)
                ss1a = (r0[3] + n1x * 0.1, r0[1], r0[2] + n1z * 0.1)
                ss1b = (r0[3] + n1x * 2.7, r0[1], r0[2] + n1z * 2.7)
                acc.quad(ss0a, ss0b, ss1b, ss1a)
                # vạch trắng rời tại mép làn (0.18m)
                acc_white.quad(
                    (l0[3] + n0x * 0.02, l0[1] + 0.012, l0[2] + n0z * 0.02),
                    (l0[3] + n0x * 0.2, l0[1] + 0.012, l0[2] + n0z * 0.2),
                    (r0[3] + n1x * 0.2, r0[1] + 0.012, r0[2] + n1z * 0.2),
                    (r0[3] + n1x * 0.02, r0[1] + 0.012, r0[2] + n1z * 0.02),
                )

        edge_offset = half - 0.22
        is_urban = hw in URBAN
        for side in (-1.0, 1.0):
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                # 🛣️ VẠCH MÉP 0.18m: code cũ nối mép trái rib[i] → mép trái rib[i+1] →
                # mép phải rib[i+1] → mép phải rib[i] = BĂNG TRẮNG PHỦ KÍN mặt đường
                # (asphalt chỉ ló 0.22m mỗi bên → "đường trắng" trên mọi map GLB)
                # base tâm: vạch mép tại ±(half − 0.22) — code cũ base mép trái
                # → vạch phải mất, vạch trái lệch vào giữa trên road 2 chiều
                cx0 = (l0[0] + l0[3]) / 2
                cz0 = (l0[2] + l0[5]) / 2
                cx1 = (r0[0] + r0[3]) / 2
                cz1 = (r0[2] + r0[5]) / 2
                e0 = edge_offset - 0.09
                e1 = edge_offset + 0.09
                acc_white.quad(
                    (cx0 + n0x * side * e0, l0[1] + 0.012, cz0 + n0z * side * e0),
                    (cx0 + n0x * side * e1, l0[1] + 0.012, cz0 + n0z * side * e1),
                    (cx1 + n1x * side * e1, r0[1] + 0.012, cz1 + n1z * side * e1),
                    (cx1 + n1x * side * e0, r0[1] + 0.012, cz1 + n1z * side * e0),
                )

        # ⛔ Markierung 340: vạch LIỀN giữa đường tại khúc cua/đèo (cấm vượt)
        # — nơi góc đổi hướng giữa 2 segment liên tiếp > 0.3 rad
        for i in range(len(rib) - 1):
            h0 = math.atan2(cl[min(i + 1, len(cl) - 1)][0] - cl[i][0], cl[min(i + 1, len(cl) - 1)][1] - cl[i][1])
            h1 = math.atan2(cl[min(i + 2, len(cl) - 1)][0] - cl[min(i + 1, len(cl) - 1)][0],
                            cl[min(i + 2, len(cl) - 1)][1] - cl[min(i + 1, len(cl) - 1)][1])
            dh = abs(h1 - h0)
            if dh > math.pi:
                dh = abs(dh - 2 * math.pi)
            if dh < 0.3:
                continue
            l0s, r0s = rib[i], rib[i + 1]
            acc_white.quad(
                ((l0s[0] + l0s[3]) / 2 - l0s[6] * 0.09, l0s[1] + 0.012, (l0s[2] + l0s[5]) / 2 - l0s[7] * 0.09),
                ((l0s[0] + l0s[3]) / 2 + l0s[6] * 0.09, l0s[1] + 0.012, (l0s[2] + l0s[5]) / 2 + l0s[7] * 0.09),
                ((r0s[0] + r0s[3]) / 2 + r0s[6] * 0.09, r0s[1] + 0.012, (r0s[2] + r0s[5]) / 2 + r0s[7] * 0.09),
                ((r0s[0] + r0s[3]) / 2 - r0s[6] * 0.09, r0s[1] + 0.012, (r0s[2] + r0s[5]) / 2 - r0s[7] * 0.09),
            )

        def center_at(fr):
            target = fr * total
            for i in range(len(cum) - 1):
                if cum[i + 1] >= target:
                    t = (target - cum[i]) / max(0.001, cum[i + 1] - cum[i])
                    px = cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t
                    pz = cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t
                    nxx = cl[i + 1][1] - cl[i][1]
                    nzz = -(cl[i + 1][0] - cl[i][0])
                    nl = math.hypot(nxx, nzz) or 1.0
                    yv = point_y(road, (px, pz), crossings, fr)
                    return (px, yv + 0.012, pz, nxx / nl, nzz / nl)
            return None

        for k in range(int(total // 9.0)):
            a0 = center_at(k * 9.0 / total)
            a1 = center_at((k * 9.0 + 3.0) / total)
            if not a0 or not a1:
                continue
            if hw in ('motorway', 'motorway_link', 'trunk', 'primary') and oneway and lanes >= 2:
                for ln in range(1, lanes):
                    off = -half + ln * (width / lanes)
                    acc_white.quad(
                        (a0[0] + a0[3] * off - a0[3] * 0.09, a0[1], a0[2] + a0[4] * off - a0[4] * 0.09),
                        (a0[0] + a0[3] * off + a0[3] * 0.09, a0[1], a0[2] + a0[4] * off + a0[4] * 0.09),
                        (a1[0] + a1[3] * off + a1[3] * 0.09, a1[1], a1[2] + a1[4] * off + a1[4] * 0.09),
                        (a1[0] + a1[3] * off - a1[3] * 0.09, a1[1], a1[2] + a1[4] * off - a1[4] * 0.09),
                    )
            elif is_urban or not oneway:
                acc_white.quad(
                    (a0[0] - a0[3] * 0.09, a0[1], a0[2] - a0[4] * 0.09),
                    (a0[0] + a0[3] * 0.09, a0[1], a0[2] + a0[4] * 0.09),
                    (a1[0] + a1[3] * 0.09, a1[1], a1[2] + a1[4] * 0.09),
                    (a1[0] - a1[3] * 0.09, a1[1], a1[2] - a1[4] * 0.09),
                )

        if hw in URBAN:
            sw_in = half + 0.35
            sw_out = half + 2.4
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                for side in (-1.0, 1.0):
                    # 🛣️ base = TÂM đường (l0[0] là MÉP — dùng làm gốc làm cobble
                    # leo vào giữa đường trên road 2 chiều 2 làn như Hauptstraße)
                    cx0 = (l0[0] + l0[3]) / 2
                    cz0 = (l0[2] + l0[5]) / 2
                    cx1 = (r0[0] + r0[3]) / 2
                    cz1 = (r0[2] + r0[5]) / 2
                    ax0 = cx0 + n0x * side * sw_in
                    az0 = cz0 + n0z * side * sw_in
                    ax1 = cx1 + n1x * side * sw_in
                    az1 = cz1 + n1z * side * sw_in
                    bx1 = cx1 + n1x * side * sw_out
                    bz1 = cz1 + n1z * side * sw_out
                    bx0 = cx0 + n0x * side * sw_out
                    bz0 = cz0 + n0z * side * sw_out
                    acc_walk.quad(
                        (ax0, l0[1] + 0.14, az0), (ax1, r0[1] + 0.14, az1),
                        (bx1, r0[1] + 0.14, bz1), (bx0, l0[1] + 0.14, bz0),
                        uvs=[(ax0 / 2.0, az0 / 2.0), (ax1 / 2.0, az1 / 2.0),
                             (bx1 / 2.0, bz1 / 2.0), (bx0 / 2.0, bz0 / 2.0)],
                    )
                    acc_curb.quad(
                        (cx0 + n0x * side * half, 0.0, cz0 + n0z * side * half),
                        (cx1 + n1x * side * half, 0.0, cz1 + n1z * side * half),
                        (cx1 + n1x * side * half, 0.15, cz1 + n1z * side * half),
                        (cx0 + n0x * side * half, 0.15, cz0 + n0z * side * half),
                    )

        if hw in ('primary', 'secondary', 'tertiary'):
            k = 0
            step = 60.0
            while k * step < total:
                fr = (k * step + 10) / total
                tgt = fr * total
                for i in range(len(cum) - 1):
                    if cum[i + 1] >= tgt:
                        t = (tgt - cum[i]) / max(0.001, cum[i + 1] - cum[i])
                        px = cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t
                        pz = cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t
                        py = point_y(road, (px, pz), crossings, fr)
                        dx = cl[i + 1][0] - cl[i][0]
                        dz = cl[i + 1][1] - cl[i][1]
                        L = math.hypot(dx, dz) or 1.0
                        rnx = -dz / L
                        rnz = dx / L
                        px_b = px + rnx * (half + 1.2)
                        pz_b = pz + rnz * (half + 1.2)
                        base = len(acc_pole.verts)
                        for k8 in range(6):
                            ang = 2 * math.pi * k8 / 6
                            acc_pole.verts.append((px_b + math.cos(ang) * 0.09, py, pz_b + math.sin(ang) * 0.09))
                        for k8 in range(6):
                            ang = 2 * math.pi * k8 / 6
                            acc_pole.verts.append((px_b + math.cos(ang) * 0.09, py + 5.0, pz_b + math.sin(ang) * 0.09))
                        for k8 in range(6):
                            a0i = base + k8
                            a1i = base + (k8 + 1) % 6
                            b0i = base + 6 + k8
                            b1i = base + 6 + (k8 + 1) % 6
                            acc_pole.faces.append((a0i, a1i, b1i, b0i))
                        arm_x = px_b - rnx * 1.6
                        arm_z = pz_b - rnz * 1.6
                        acc_pole.quad(
                            (px_b, py + 5.0, pz_b), (px_b, py + 4.85, pz_b),
                            (arm_x, py + 4.75, arm_z), (arm_x, py + 4.9, arm_z),
                        )
                        acc_lamp.quad(
                            (arm_x - 0.35, py + 4.78, arm_z - 0.35),
                            (arm_x + 0.35, py + 4.78, arm_z - 0.35),
                            (arm_x + 0.35, py + 4.86, arm_z + 0.35),
                            (arm_x - 0.35, py + 4.86, arm_z + 0.35),
                        )
                        break
                k += 1

        # 🚗 XE ĐỖ LỀ ĐƯỜNG: thân + khoang + 4 bánh, dọc phố mỗi ~21m, bỏ gần giao lộ
        if hw in ('primary', 'secondary', 'residential') and total > 60:
            for si in range(int((total - 24) / 30.0)):
                if rng.random() < 0.62:
                    continue
                fr = (12 + si * 21.0) / total
                side = 1.0 if rng.random() < 0.5 else -1.0
                tgt = fr * total
                px_c = pz_c = tx = tz = None
                for gi in range(len(cum) - 1):
                    if cum[gi + 1] >= tgt:
                        t = (tgt - cum[gi]) / max(0.001, cum[gi + 1] - cum[gi])
                        px_c = cl[gi][0] + (cl[gi + 1][0] - cl[gi][0]) * t
                        pz_c = cl[gi][1] + (cl[gi + 1][1] - cl[gi][1]) * t
                        tx = cl[gi + 1][0] - cl[gi][0]
                        tz = cl[gi + 1][1] - cl[gi][1]
                        tl = math.hypot(tx, tz) or 1.0
                        tx, tz = tx / tl, tz / tl
                        break
                if px_c is None:
                    continue
                nxc, nzc = -tz, tx
                off = half - 1.05
                cxp = px_c + nxc * side * off
                czp = pz_c + nzc * side * off
                pyp = point_y(road, (cxp, czp), crossings, fr)
                yaw = math.atan2(tz, tx)
                acc_car = _car_accs[int(rng.random() * len(_car_accs))]
                emit_box(acc_car, cxp, pyp + 0.18, czp, 4.1, 0.62, 1.72, yaw)
                emit_box(acc_car, cxp - tx * 0.25, pyp + 0.80, czp - tz * 0.25, 2.15, 0.55, 1.58, yaw)
                # 2 trục bánh (box full-width) — nhẹ hơn 4 bánh rời
                for lwx in (-1.35, 1.35):
                    emit_box(acc_wheel,
                             cxp + lwx * tx, pyp, czp + lwx * tz,
                             0.62, 0.34, 1.74, yaw)

        # 🛑 STOP BAR (Z. 294) + 🔀 LANE ARROW (Z. 297) trước junction CÓ ĐÈN:
        # bar ngang 0.5m qua full-width, cách mút đường 4m; arrow thẳng mỗi làn cách 25m.
        endKey = road.get('endNode') or ''
        startKey = road.get('startNode') or ''
        for atEnd, key in ((True, endKey), (False, startKey)):
            if key not in signal_nodes:
                continue
            if len(rib) < 2:
                continue
            edge = rib[-1] if atEnd else rib[0]
            prevEdge = rib[-2] if atEnd and len(rib) >= 2 else rib[1]
            ex, ey, ez = edge[0], edge[1], edge[2]
            exC = (edge[0] + edge[3]) / 2
            ezC = (edge[2] + edge[5]) / 2
            nx_, nz_ = edge[6], edge[7]
            tx_, tz_ = (ex - prevEdge[0]), (ez - prevEdge[2])
            tl = math.hypot(tx_, tz_) or 1.0
            tx_, tz_ = tx_ / tl, tz_ / tl
            sign = 1.0 if atEnd else -1.0  # lùi vào trong tuyến
            # ── Stop bar: dải 0.5m cách mút 4m, full width ──
            bl = max(0.35, min(2.0, half - 0.2))
            for (qq, dd) in ((0, 4.0), (1, 3.5)):
                pxq = exC - tx_ * sign * dd
                pzq = ezC - tz_ * sign * dd
                if dd == 4.0:
                    barA_l = (pxq + nx_ * bl, ey + 0.014, pzq + nz_ * bl)
                    barA_r = (pxq - nx_ * bl, ey + 0.014, pzq - nz_ * bl)
                else:
                    barB_l = (pxq + nx_ * bl, ey + 0.014, pzq + nz_ * bl)
                    barB_r = (pxq - nx_ * bl, ey + 0.014, pzq - nz_ * bl)
            acc_white.quad(barA_l, barA_r, barB_r, barB_l)
            # ── Lane arrow: thẳng, mỗi làn, cách mút 25m ──
            ad = min(25.0, total * 0.3)
            for ln in range(lanes):
                off = -half + (ln + 0.5) * (width / lanes)
                pxl = exC - tx_ * sign * ad
                pzl = ezC - tz_ * sign * ad
                hx, hz = pxl + tx_ * 1.2, pzl + tz_ * 1.2
                bx, bz = pxl - tx_ * 1.1, pzl - tz_ * 1.1
                acc_white.quad(
                    (bx + nx_ * 0.16, ey + 0.013, bz + nz_ * 0.16),
                    (bx - nx_ * 0.16, ey + 0.013, bz - nz_ * 0.16),
                    (hx - nx_ * 0.16, ey + 0.013, hz - nz_ * 0.16),
                    (hx + nx_ * 0.16, ey + 0.013, hz + nz_ * 0.16),
                )
                # Đầu nhọn (2 quad nghiêng tạo tam giác)
                hx2, hz2 = pxl + tx_ * 2.3, pzl + tz_ * 2.3
                acc_white.quad(
                    (hx + nx_ * 0.16, ey + 0.013, hz + nz_ * 0.16),
                    (hx - nx_ * 0.16, ey + 0.013, hz - nz_ * 0.16),
                    (hx2, ey + 0.013, hz2),
                    (hx2, ey + 0.013, hz2),
                )

        if hw == 'motorway':
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                for side in (-1.0, 1.0):
                    gx0 = l0[0] + n0x * side * (half + 0.5)
                    gz0 = l0[2] + n0z * side * (half + 0.5)
                    gx1 = r0[0] + n1x * side * (half + 0.5)
                    gz1 = r0[2] + n1z * side * (half + 0.5)
                    acc_guard.quad(
                        (gx0, l0[1] + 0.30, gz0), (gx1, r0[1] + 0.30, gz1),
                        (gx1, r0[1] + 0.72, gz1), (gx0, l0[1] + 0.72, gz0),
                    )
                    acc_guard.quad(
                        (gx0, l0[1], gz0), (gx0 + n0x * 0.06, l0[1], gz0 + n0z * 0.06),
                        (gx0 + n0x * 0.06, l0[1] + 0.3, gz0 + n0z * 0.06), (gx0, l0[1] + 0.3, gz0),
                    )

        if is_bridge:
            step = max(12, int(total // 28.0))
            for k in range(0, int(total) + 1, step):
                fr = k / max(1.0, total)
                tgt = fr * total
                for i in range(len(cum) - 1):
                    if cum[i + 1] >= tgt:
                        t = (tgt - cum[i]) / max(0.001, cum[i + 1] - cum[i])
                        px = cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t
                        pz = cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t
                        py = point_y(road, (px, pz), crossings, fr)
                        ring_top = len(acc_pier.verts)
                        for k8 in range(8):
                            ang = 2 * math.pi * k8 / 8
                            acc_pier.verts.append((px + math.cos(ang) * 0.45, py, pz + math.sin(ang) * 0.45))
                        for k8 in range(8):
                            ang = 2 * math.pi * k8 / 8
                            acc_pier.verts.append((px + math.cos(ang) * 0.45, 0.0, pz + math.sin(ang) * 0.45))
                        for k8 in range(8):
                            a0i = ring_top + k8
                            a1i = ring_top + (k8 + 1) % 8
                            b0i = ring_top + 8 + k8
                            b1i = ring_top + 8 + (k8 + 1) % 8
                            acc_pier.faces.append((a0i, a1i, b1i, b0i))
                        break
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                for side in (-1.0, 1.0):
                    acc_bridge.quad(
                        (l0[0] + n0x * side * half, l0[1], l0[2] + n0z * side * half),
                        (r0[0] + n1x * side * half, r0[1], r0[2] + n1z * side * half),
                        (r0[0] + n1x * side * half, r0[1] + 0.85, r0[2] + n1z * side * half),
                        (l0[0] + n0x * side * half, l0[1] + 0.85, l0[2] + n0z * side * half),
                    )

    for b in graph.get('landmarks') or []:
        pts = b.get('points') or []
        if len(pts) < 3:
            continue
        h = b.get('height') or 9.0
        r_pick = rng.random()
        if r_pick < 0.45:
            acc = acc_wall
        elif r_pick < 0.82:
            acc = acc_wall2
        else:
            acc = acc_brick
        for i in range(len(pts)):
            p1 = pts[i]
            p2 = pts[(i + 1) % len(pts)]
            wall_len = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
            u2 = wall_len / 3.0
            v2 = h / 3.0
            acc.quad(
                (p1[0], 0.0, p1[1]), (p2[0], 0.0, p2[1]),
                (p2[0], h, p2[1]), (p1[0], h, p1[1]),
                uvs=[(0, 0), (u2, 0), (u2, v2), (0, v2)],
            )
        # 🏪 shop front tầng trệt (0 → 3.1m): kính + mái hiên, chỉ building mặt phố
        if h >= 5.5 and near_urban(sum(p[0] for p in pts) / len(pts),
                                   sum(p[1] for p in pts) / len(pts)):
            for i in range(len(pts)):
                p1 = pts[i]
                p2 = pts[(i + 1) % len(pts)]
                elen = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
                if elen < 3.0 or elen > 34.0 or rng.random() < 0.25:
                    continue
                nx_ = -(p2[1] - p1[1]) / elen
                nz_ = (p2[0] - p1[0]) / elen
                mx_ = (p1[0] + p2[0]) / 2 - sum(q[0] for q in pts) / len(pts)
                mz_ = (p1[1] + p2[1]) / 2 - sum(q[1] for q in pts) / len(pts)
                if nx_ * mx_ + nz_ * mz_ < 0:
                    nx_, nz_ = -nx_, -nz_
                o = 0.035
                acc_shop.quad(
                    (p1[0] + nx_ * o, 0.05, p1[1] + nz_ * o),
                    (p2[0] + nx_ * o, 0.05, p2[1] + nz_ * o),
                    (p2[0] + nx_ * o, 3.1, p2[1] + nz_ * o),
                    (p1[0] + nx_ * o, 3.1, p1[1] + nz_ * o),
                    uvs=[(0, 0), (elen / 3.0, 0), (elen / 3.0, 1), (0, 1)],
                )
        # 🏠 MÁI v2: mái dốc 2 nước + ống khói + đầu hồi cho nhà đều; mái bằng + parapet cho còn lại
        xs_ = [q[0] for q in pts]
        zs_ = [q[1] for q in pts]
        minx_, maxx_ = min(xs_), max(xs_)
        minz_, maxz_ = min(zs_), max(zs_)
        bw_, bz_ = maxx_ - minx_, maxz_ - minz_
        n_pts = len(pts)
        area_poly = abs(sum(pts[i][0] * pts[(i + 1) % n_pts][1] - pts[(i + 1) % n_pts][0] * pts[i][1]
                            for i in range(n_pts))) / 2.0
        is_regular = bw_ > 4 and bz_ > 4 and area_poly / max(0.01, bw_ * bz_) > 0.72
        if h <= 13 and is_regular:
            over = 0.30
            if bw_ >= bz_:
                rx0, rx1 = minx_ - over, maxx_ + over
                rzc = (minz_ + maxz_) / 2
                e0, e1 = minz_ - over, maxz_ + over
                slope = math.hypot((e1 - e0) / 2.0, 3.0)
                for ze in (e0, e1):
                    acc_roof.quad(
                        (rx0, h, ze), (rx1, h, ze),
                        (rx1, h + 3.0, rzc), (rx0, h + 3.0, rzc),
                        uvs=[(0, 0), ((rx1 - rx0) / 2.2, 0), ((rx1 - rx0) / 2.2, slope / 2.2), (0, slope / 2.2)],
                    )
                for xe in (rx0, rx1):   # đầu hồi tam giác
                    acc.quad(
                        (xe, h, e0), (xe, h, e1),
                        (xe, h + 3.0, rzc), (xe, h + 3.0, rzc),
                        uvs=[(0, 0), ((e1 - e0) / 3.0, 0), (0, 0), (0, 0)],
                    )
                if rng.random() < 0.75:
                    cxm = rng.uniform(minx_ + 1.2, maxx_ - 1.2)
                    emit_box(acc_brick, cxm, h + 2.1, rzc + rng.uniform(-bz_ * 0.25, bz_ * 0.25),
                             0.55, 1.6, 0.55, 0.0)
            else:
                rz0, rz1 = minz_ - over, maxz_ + over
                rxc = (minx_ + maxx_) / 2
                e0, e1 = minx_ - over, maxx_ + over
                slope = math.hypot((e1 - e0) / 2.0, 3.0)
                for xe in (e0, e1):
                    acc_roof.quad(
                        (xe, h, rz0), (xe, h, rz1),
                        (rxc, h + 3.0, rz1), (rxc, h + 3.0, rz0),
                        uvs=[(0, 0), ((rz1 - rz0) / 2.2, 0), ((rz1 - rz0) / 2.2, slope / 2.2), (0, slope / 2.2)],
                    )
                for ze in (rz0, rz1):
                    acc.quad(
                        (e0, h, ze), (e1, h, ze),
                        (rxc, h + 3.0, ze), (rxc, h + 3.0, ze),
                        uvs=[(0, 0), ((e1 - e0) / 3.0, 0), (0, 0), (0, 0)],
                    )
                if rng.random() < 0.75:
                    czm = rng.uniform(minz_ + 1.2, maxz_ - 1.2)
                    emit_box(acc_brick, rxc + rng.uniform(-bw_ * 0.25, bw_ * 0.25), h + 2.1, czm,
                             0.55, 1.6, 0.55, 0.0)
            # hàng rào cây bụi trước nhà thấp
            if h <= 10 and rng.random() < 0.5:
                i_ = max(range(n_pts), key=lambda ii: math.hypot(pts[(ii + 1) % n_pts][0] - pts[ii][0],
                                                                 pts[(ii + 1) % n_pts][1] - pts[ii][1]))
                p1_ = pts[i_]
                p2_ = pts[(i_ + 1) % n_pts]
                el_ = math.hypot(p2_[0] - p1_[0], p2_[1] - p1_[1])
                if 6.0 < el_ < 30.0:
                    nx_ = -(p2_[1] - p1_[1]) / el_
                    nz_ = (p2_[0] - p1_[0]) / el_
                    cx_ = (p1_[0] + p2_[0]) / 2
                    cz_ = (p1_[1] + p2_[1]) / 2
                    if (cx_ - (minx_ + maxx_) / 2) * nx_ + (cz_ - (minz_ + maxz_) / 2) * nz_ < 0:
                        nx_, nz_ = -nx_, -nz_
                    emit_box(acc_hedge, cx_ + nx_ * 3.4, 0.0, cz_ + nz_ * 3.4,
                             el_ - 1.5, 0.85, 0.45, math.atan2(p2_[1] - p1_[1], p2_[0] - p1_[0]))
        else:
            base = len(acc_roof_flat.verts)
            for q in pts:
                acc_roof_flat.verts.append((q[0], h + 0.35, q[1]))
            acc_roof_flat.faces.append(tuple(range(base, base + n_pts)))
            for i in range(n_pts):   # parapet
                p1 = pts[i]
                p2 = pts[(i + 1) % n_pts]
                acc_roof_flat.quad(
                    (p1[0], h, p1[1]), (p2[0], h, p2[1]),
                    (p2[0], h + 0.55, p2[1]), (p1[0], h + 0.55, p1[1]),
                )


    # 🌳 CÂY BILLBOARD (kiểu Gobesdorf): 2 quad chéo 90° + texture alpha — rẻ & thật hơn cone
    tree_rng = random.Random(99)
    for road in graph['roads']:
        hw_t = road['highway']
        if hw_t not in ('residential', 'living_street', 'tertiary', 'secondary'):
            continue
        cl_t = road.get('centerline') or []
        if len(cl_t) < 2:
            continue
        w_t = road.get('width') or 7.0
        cum_t = [0.0]
        for i in range(1, len(cl_t)):
            cum_t.append(cum_t[i-1] + math.hypot(cl_t[i][0]-cl_t[i-1][0], cl_t[i][1]-cl_t[i-1][1]))
        total_t = cum_t[-1] or 1.0
        if total_t < 50:
            continue
        n_trees = int(total_t // 42)
        for k in range(n_trees):
            fr = (k * 42 + 20) / total_t
            tgt = fr * total_t
            for i in range(len(cum_t) - 1):
                if cum_t[i + 1] >= tgt:
                    t = (tgt - cum_t[i]) / max(0.001, cum_t[i + 1] - cum_t[i])
                    px = cl_t[i][0] + (cl_t[i + 1][0] - cl_t[i][0]) * t
                    pz = cl_t[i][1] + (cl_t[i + 1][1] - cl_t[i][1]) * t
                    dx = cl_t[i + 1][0] - cl_t[i][0]
                    dz = cl_t[i + 1][1] - cl_t[i][1]
                    L = math.hypot(dx, dz) or 1.0
                    nx, nz = -dz / L, dx / L
                    ddx, ddz = dx / L, dz / L
                    for side in (-1.0, 1.0):
                        if tree_rng.random() < 0.42:
                            continue
                        off = w_t / 2.0 + 3.0 + tree_rng.random() * 1.5
                        tx = px + nx * side * off
                        tz = pz + nz * side * off
                        tree_h = 3.5 + tree_rng.random() * 2.5
                        canopy_r = 1.4 + tree_rng.random() * 0.9
                        tw_ = canopy_r * 2.7
                        th_ = tree_h + canopy_r * 1.5
                        uv_t = ((0, 0), (1, 0), (1, 1), (0, 1))
                        acc_tree.quad(   # quad vuông góc đường
                            (tx - nx * tw_ * 0.5, 0.0, tz - nz * tw_ * 0.5),
                            (tx + nx * tw_ * 0.5, 0.0, tz + nz * tw_ * 0.5),
                            (tx + nx * tw_ * 0.5, th_, tz + nz * tw_ * 0.5),
                            (tx - nx * tw_ * 0.5, th_, tz - nz * tw_ * 0.5),
                            uvs=uv_t)
                        acc_tree.quad(   # quad dọc đường
                            (tx - ddx * tw_ * 0.5, 0.0, tz - ddz * tw_ * 0.5),
                            (tx + ddx * tw_ * 0.5, 0.0, tz + ddz * tw_ * 0.5),
                            (tx + ddx * tw_ * 0.5, th_, tz + ddz * tw_ * 0.5),
                            (tx - ddx * tw_ * 0.5, th_, tz - ddz * tw_ * 0.5),
                            uvs=uv_t)
                    break

    for j in graph.get('junctions', []):
        if (j.get('degree') or 0) >= 3:
            acc_junc.disc(j['x'], 0.008, j['z'], 9.0, 14)
    for pk in graph.get('parks') or []:
        pts = pk.get('points') or []
        if len(pts) >= 3:
            base = len(acc_park.verts)
            for p in pts:
                acc_park.verts.append((p[0], 0.004, p[1]))
            acc_park.faces.append(tuple(range(base, base + len(pts))))
    for w in graph.get('waterways') or []:
        pts = w.get('points') or []
        if w.get('isClosed') and len(pts) >= 3:
            base = len(acc_water.verts)
            for p in pts:
                acc_water.verts.append((p[0], 0.006, p[1]))
            acc_water.faces.append(tuple(range(base, base + len(pts))))
        elif len(pts) >= 2:
            half_w = (w.get('width') or 18.0) / 2.0
            for i in range(len(pts) - 1):
                dx = pts[i + 1][0] - pts[i][0]
                dz = pts[i + 1][1] - pts[i][1]
                L = math.hypot(dx, dz) or 1.0
                nx, nz = -dz / L, dx / L
                acc_water.quad(
                    (pts[i][0] - nx * half_w, 0.005, pts[i][1] - nz * half_w),
                    (pts[i][0] + nx * half_w, 0.005, pts[i][1] + nz * half_w),
                    (pts[i + 1][0] + nx * half_w, 0.005, pts[i + 1][1] + nz * half_w),
                    (pts[i + 1][0] - nx * half_w, 0.005, pts[i + 1][1] - nz * half_w),
                )
    for r in graph.get('railways') or []:
        pts = r.get('points') or []
        if len(pts) < 2:
            continue
        half_w = 2.6
        for i in range(len(pts) - 1):
            dx = pts[i + 1][0] - pts[i][0]
            dz = pts[i + 1][1] - pts[i][1]
            L = math.hypot(dx, dz) or 1.0
            nx, nz = -dz / L, dx / L
            acc_railbed.quad(
                (pts[i][0] - nx * half_w, 0.01, pts[i][1] - nz * half_w),
                (pts[i][0] + nx * half_w, 0.01, pts[i][1] + nz * half_w),
                (pts[i + 1][0] + nx * half_w, 0.01, pts[i + 1][1] + nz * half_w),
                (pts[i + 1][0] - nx * half_w, 0.01, pts[i + 1][1] - nz * half_w),
            )
            for rail_off in (-1.5, 1.5):
                acc_rail.quad(
                    (pts[i][0] - nx * (rail_off - 0.08), 0.05, pts[i][1] - nz * (rail_off - 0.08)),
                    (pts[i][0] - nx * (rail_off + 0.08), 0.05, pts[i][1] - nz * (rail_off + 0.08)),
                    (pts[i + 1][0] - nx * (rail_off + 0.08), 0.05, pts[i + 1][1] - nz * (rail_off + 0.08)),
                    (pts[i + 1][0] - nx * (rail_off - 0.08), 0.05, pts[i + 1][1] - nz * (rail_off - 0.08)),
                )

    for acc in [acc_road, acc_road2, acc_junc, acc_white, acc_walk, acc_curb,
                acc_wall, acc_wall2, acc_roof, acc_park, acc_water, acc_railbed, acc_rail,
                acc_bridge, acc_pier, acc_pole, acc_lamp, acc_guard,
                acc_shop, acc_car_white, acc_car_dark, acc_car_silver, acc_car_red,
                acc_car_blue, acc_wheel,
                acc_brick, acc_roof_flat, acc_tree, acc_hedge]:
        acc.commit()
    print('all meshes committed')

    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format='GLB',
        export_yup=False,
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print('EXPORTED:', OUT, os.path.getsize(OUT) / 1048576.0, 'MB')


if __name__ == '__main__':
    main()
