# make_assets.py — sinh asset GLB low-poly cho simulator v2 (Protocol Prompt 5 / mục G4)
# Chạy: blender -b -P assets/blender/make_assets.py -- --out public/simv2
# Quy ước trục: dựng trong Blender với MẶT TRƯỚC = +Y (Blender) → GLB mặt trước = -Z (three.js),
# đúng protocol mục 1: "car faces -Z at rotation=0". Blender Z-up → glTF Y-up tự động.
# Ngân sách poly (mục 2): player ≤8000, NPC ≤1500, pedestrian ~200.
import bpy
import bmesh
import math
import os
import sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[argv.index('--out') + 1] if '--out' in argv else 'public/simv2'
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)


# ───────────────────────── helpers ─────────────────────────
def mat(name, color, rough=0.75, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (color[0], color[1], color[2], 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    return m


def link(obj):
    bpy.context.collection.objects.link(obj)


def box(name, size, loc=(0, 0, 0), material=None, rot=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    obj.scale = (size[0], size[1], size[2])
    obj.location = loc
    obj.rotation_euler = rot
    if material:
        obj.data.materials.append(material)
    return obj


def cyl(name, r, depth, loc, material, verts=10, rot=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    if material:
        obj.data.materials.append(material)
    return obj


def sphere(name, r, loc, material, segs=8, rings=6):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    obj.location = loc
    if material:
        obj.data.materials.append(material)
    return obj


def torus(name, major, minor, loc, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=14, minor_segments=6,
        location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj


def taper_top(obj, sx, fy_mul, ry_mul, y_split=0.25):
    """Thu nhỏ các đỉnh nửa trên: x *= sx; đầu +Y (mũi) lùi fy_mul, đầu -Y lùi ry_mul"""
    me = obj.data
    for v in me.vertices:
        z = v.co.z
        if z > 0.01:
            v.co.x *= sx
            if v.co.y > y_split:
                v.co.y = v.co.y * fy_mul + y_split * (1 - fy_mul)
            elif v.co.y < -y_split:
                v.co.y = v.co.y * ry_mul - y_split * (1 - ry_mul)
    me.update()


def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    return obj


def bake_transforms(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def export(obj, path):
    bake_transforms(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True)
    print('exported:', path)


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


# ───────────────────────── materials chung ─────────────────────────
M_GLASS = mat('glass', (0.16, 0.22, 0.28), rough=0.2)
M_TIRE = mat('tire', (0.05, 0.05, 0.055), rough=0.9)
M_RIM = mat('rim', (0.55, 0.56, 0.58), rough=0.4, metal=0.6)
M_TRIM = mat('trim', (0.12, 0.12, 0.13), rough=0.6)
M_HEADLIGHT = mat('headlight', (1.0, 0.96, 0.82), rough=0.3)
M_TAILLIGHT = mat('taillight', (0.75, 0.08, 0.05), rough=0.3)
M_SKIN = mat('skin', (0.87, 0.68, 0.55), rough=0.8)
M_HAIR = mat('hair', (0.18, 0.12, 0.08), rough=0.9)


# ───────────────────────── XE ─────────────────────────
def make_car(name, body_color, style='sedan'):
    """Xe hướng +Y (Blender). style: sedan | kombi | suv | transporter"""
    body_m = mat(f'paint_{name}', body_color, rough=0.35, metal=0.25)
    parts = []

    if style == 'sedan':
        body = box('body', (1.75, 4.3, 0.62), (0, 0, 0.56), body_m)
        cabin = box('cabin', (1.62, 2.3, 0.62), (0, -0.15, 1.15), M_GLASS)
        taper_top(cabin, 0.8, 0.62, 0.72)
        parts += [body, cabin]
    elif style == 'kombi':
        body = box('body', (1.78, 4.6, 0.62), (0, 0, 0.56), body_m)
        cabin = box('cabin', (1.66, 3.1, 0.66), (0, -0.35, 1.2), M_GLASS)
        taper_top(cabin, 0.84, 0.6, 0.94)
        parts += [body, cabin]
    elif style == 'suv':
        body = box('body', (1.86, 4.4, 0.78), (0, 0, 0.72), body_m)
        cabin = box('cabin', (1.72, 2.7, 0.72), (0, -0.25, 1.45), M_GLASS)
        taper_top(cabin, 0.82, 0.62, 0.8)
        parts += [body, cabin]
    else:  # transporter
        body = box('body', (1.98, 5.0, 1.7), (0, -0.25, 1.2), body_m)
        hood = box('hood', (1.9, 1.1, 0.7), (0, 2.0, 0.7), body_m)
        wind = box('wind', (1.8, 0.06, 0.85), (0, 1.55, 1.55), M_GLASS, rot=(0.35, 0, 0))
        parts += [body, hood, wind]

    # đèn
    z_h = 0.75 if style != 'transporter' else 1.0
    parts.append(box('hl_l', (0.34, 0.06, 0.14), (0.58, 2.14 if style != 'transporter' else 2.5, z_h), M_HEADLIGHT))
    parts.append(box('hl_r', (0.34, 0.06, 0.14), (-0.58, 2.14 if style != 'transporter' else 2.5, z_h), M_HEADLIGHT))
    parts.append(box('tl_l', (0.34, 0.06, 0.14), (0.58, -(2.14 if style != 'transporter' else 2.5), z_h), M_TAILLIGHT))
    parts.append(box('tl_r', (0.34, 0.06, 0.14), (-0.58, -(2.14 if style != 'transporter' else 2.5), z_h), M_TAILLIGHT))

    # bánh xe: trục ngang X — cylinder mặc định trục Z → quay 90° quanh Y
    wheel_y = 1.35
    wheel_z = 0.32 if style != 'suv' else 0.38
    wr = 0.32 if style != 'suv' else 0.38
    ww = 0.24
    for x in (0.78, -0.78):
        for y in (wheel_y, -wheel_y):
            parts.append(cyl('wheel', wr, ww, (x, y, wheel_z), M_TIRE, verts=10, rot=(0, math.pi / 2, 0)))
            parts.append(cyl('rim', wr * 0.55, ww + 0.02, (x, y, wheel_z), M_RIM, verts=8, rot=(0, math.pi / 2, 0)))

    obj = join(parts, name)
    return obj


def make_player_car():
    """Xe người chơi + nội thất cơ bản (cabin nhìn được từ ghế lái)"""
    M_PAINT = mat('paint_player', (0.72, 0.74, 0.76), rough=0.3, metal=0.35)
    M_DASH = mat('dash', (0.1, 0.1, 0.11), rough=0.85)
    M_SEAT = mat('seat', (0.14, 0.13, 0.15), rough=0.9)

    parts = [
        box('body', (1.75, 4.3, 0.62), (0, 0, 0.56), M_PAINT),
        box('cabin', (1.62, 2.3, 0.62), (0, -0.15, 1.15), M_GLASS),
        box('hl_l', (0.34, 0.06, 0.14), (0.58, 2.14, 0.75), M_HEADLIGHT),
        box('hl_r', (0.34, 0.06, 0.14), (-0.58, 2.14, 0.75), M_HEADLIGHT),
        box('tl_l', (0.34, 0.06, 0.14), (0.58, -2.14, 0.75), M_TAILLIGHT),
        box('tl_r', (0.34, 0.06, 0.14), (-0.58, -2.14, 0.75), M_TAILLIGHT),
    ]
    taper_top(parts[1], 0.8, 0.62, 0.72)

    # gương chiếu hậu
    parts.append(box('mirror_l', (0.16, 0.1, 0.22), (0.95, 0.85, 1.05), M_TRIM))
    parts.append(box('mirror_r', (0.16, 0.1, 0.22), (-0.95, 0.85, 1.05), M_TRIM))

    # bánh xe
    for x in (0.78, -0.78):
        for y in (1.35, -1.35):
            parts.append(cyl('wheel', 0.32, 0.24, (x, y, 0.32), M_TIRE, verts=10, rot=(0, math.pi / 2, 0)))
            parts.append(cyl('rim', 0.18, 0.26, (x, y, 0.32), M_RIM, verts=8, rot=(0, math.pi / 2, 0)))

    # ── nội thất: dashboard + vô lăng + 2 ghế — GHI SỐ LÁI TRÁI (LHD Đức, x âm) ──
    # Blender z (cao) thấp hơn mắt lái (~1.15 glTF) để không che tầm nhìn ra windshield
    parts.append(box('dash', (1.5, 0.42, 0.24), (0, 0.82, 0.85), M_DASH))
    parts.append(torus('steering', 0.19, 0.028, (-0.38, 0.66, 0.88), M_TRIM, rot=(1.15, 0, 0)))
    parts.append(box('seat_base_driver', (0.5, 0.52, 0.16), (-0.38, -0.25, 0.95), M_SEAT))
    parts.append(box('seat_back_driver', (0.5, 0.14, 0.6), (-0.38, -0.52, 1.28), M_SEAT))
    parts.append(box('seat_base_pass', (0.5, 0.52, 0.16), (0.38, -0.25, 0.95), M_SEAT))
    parts.append(box('seat_back_pass', (0.5, 0.14, 0.6), (0.38, -0.52, 1.28), M_SEAT))

    return join(parts, 'car_player')


# ───────────────────────── NGƯỜI ĐI BỘ ─────────────────────────
SHIRTS = [
    (0.75, 0.25, 0.2), (0.2, 0.35, 0.6), (0.85, 0.65, 0.15), (0.3, 0.5, 0.3),
    (0.6, 0.6, 0.62), (0.5, 0.25, 0.45), (0.9, 0.9, 0.88), (0.25, 0.25, 0.28)
]
PANTS = [
    (0.15, 0.18, 0.25), (0.25, 0.22, 0.2), (0.35, 0.38, 0.45), (0.1, 0.1, 0.12),
    (0.45, 0.4, 0.35), (0.2, 0.3, 0.35), (0.3, 0.25, 0.3), (0.18, 0.22, 0.18)
]


def make_pedestrian(idx):
    shirt_m = mat(f'shirt_{idx}', SHIRTS[idx % len(SHIRTS)], rough=0.85)
    pants_m = mat(f'pants_{idx}', PANTS[idx % len(PANTS)], rough=0.9)
    parts = []
    h_scale = 0.94 + (idx % 4) * 0.04  # biến thể chiều cao

    # chân (2 trụ), thân (trụ hơi nở), đầu (cầu), tóc (cầu dẹt), tay (2 trụ nghiêng nhẹ)
    for x in (0.09, -0.09):
        parts.append(cyl(f'leg', 0.075, 0.78, (x, 0, 0.39 * 2 * h_scale / 2), pants_m, verts=6))
    parts[0].location.z = 0.39
    parts[1].location.z = 0.39
    torso = cyl('torso', 0.16, 0.62, (0, 0, 1.05 * h_scale), shirt_m, verts=7)
    parts.append(torso)
    parts.append(sphere('head', 0.115, (0, 0, 1.52 * h_scale), M_SKIN, segs=8, rings=5))
    hair = sphere('hair', 0.12, (0, -0.015, 1.55 * h_scale), M_HAIR, segs=8, rings=5)
    hair.scale = (1.0, 1.0, 0.6)
    parts.append(hair)
    for x, tilt in ((0.21, 0.12), (-0.21, -0.12)):
        arm = cyl('arm', 0.055, 0.55, (x, 0, 1.08 * h_scale), shirt_m, verts=5, rot=(tilt, 0, 0))
        parts.append(arm)

    return join(parts, f'ped_{idx + 1}')


# ───────────────────────── TRAM ─────────────────────────
def make_tram():
    """Đường sá Mercedes/AGO Berlin — thân vàng kem, 30 m, pantograph"""
    M_BODY = mat('tram_body', (0.95, 0.78, 0.2), rough=0.4)
    parts = [
        box('body', (2.3, 30, 2.5), (0, 0, 1.85), M_BODY),
        # dải cửa sổ liền (kính tối) hơi rộng hơn thân
        box('windows', (2.34, 26.5, 1.0), (0, 0, 2.55), M_GLASS),
        # đầu xe vát kính
        box('wind_front', (2.0, 0.08, 1.6), (0, 14.7, 2.4), M_GLASS, rot=(-0.3, 0, 0)),
        box('coupler', (0.6, 0.5, 0.5), (0, 15.2, 0.8), M_TRIM),
        box('coupler', (0.6, 0.5, 0.5), (0, -15.2, 0.8), M_TRIM),
    ]
    # 4 cửa 2 bên (kính tối)
    for y in (-10.5, -3.5, 3.5, 10.5):
        for x in (1.16, -1.16):
            parts.append(box('door', (0.06, 1.3, 2.0), (x, y, 1.7), M_GLASS))
    # cửa trời + pantograph
    parts.append(box('roof_ac', (1.8, 3.0, 0.35), (0, 0, 3.25), M_TRIM))
    parts.append(box('panto_base', (0.8, 0.8, 0.1), (0, 4.0, 3.15), M_TRIM))
    parts.append(box('panto_arm1', (0.05, 0.05, 1.6), (0, 3.4, 3.9), M_TRIM, rot=(0.5, 0, 0)))
    parts.append(box('panto_arm2', (0.05, 0.05, 1.6), (0, 4.6, 4.5), M_TRIM, rot=(-0.5, 0, 0)))
    parts.append(box('panto_bar', (1.4, 0.08, 0.06), (0, 4.6, 5.2), M_TRIM))
    # đèn pha
    parts.append(box('tram_hl_l', (0.3, 0.06, 0.16), (0.7, 15.05, 1.0), M_HEADLIGHT))
    parts.append(box('tram_hl_r', (0.3, 0.06, 0.16), (-0.7, 15.05, 1.0), M_HEADLIGHT))
    return join(parts, 'tram')


# ───────────────────────── SINH + EXPORT ─────────────────────────
assets = [
    ('car_player.glb', make_player_car),
    ('car_npc_sedan_red.glb', lambda: make_car('car_sedan_red', (0.62, 0.12, 0.1), 'sedan')),
    ('car_npc_kombi_grey.glb', lambda: make_car('car_kombi_grey', (0.55, 0.57, 0.6), 'kombi')),
    ('car_npc_suv_blue.glb', lambda: make_car('car_suv_blue', (0.13, 0.22, 0.42), 'suv')),
    ('car_npc_transporter_white.glb', lambda: make_car('car_transporter_white', (0.88, 0.88, 0.86), 'transporter')),
    ('tram.glb', make_tram),
]
for i in range(8):
    assets.append((f'ped_{i + 1}.glb', lambda i=i: make_pedestrian(i)))

for fname, builder in assets:
    clear_scene()
    obj = builder()
    export(obj, os.path.join(OUT, fname))

print('DONE —', len(assets), 'assets →', OUT)
