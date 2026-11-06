import bpy
import mathutils
import math

coll_name = "A2_Rhynern_Deterministic_OSM_Mesh"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")
mat_concrete = bpy.data.materials.get("Support Side Bridge") or bpy.data.materials.get("Support Spring")

pts = [(3420.65, 1517.33, 8.61), (3379.64, 1514.16, 8.61)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_8088288")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_8088288", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3407.88, 1499.81, 5.6), (3576.52, 1513.96, 5.6), (3874.71, 1539.06, 5.6)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_8088808")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_8088808", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3366.21, 1496.59, 10.19), (3407.88, 1499.81, 10.19)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_8089228")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_8089228", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3838.02, 1929.7, 5.52), (3791.31, 1911.3, 5.1), (3761.81, 1897.69, 4.72), (3733.93, 1882.89, 4.09), (3703.72, 1863.94, 3.65), (3672.93, 1841.79, 3.39), (3633.35, 1806.4, 2.82), (3611.28, 1782.89, 2.72), (3571.69, 1733.36, 2.33)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_23196719")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23196719", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(2449.55, 1425.24, -13.5), (2401.35, 1418.15, -13.54), (2324.52, 1405.3, -13.58), (2239.08, 1389.14, -13.54), (2147.84, 1370.7, -13.64), (2059.01, 1350.15, -13.78), (1970.22, 1328.62, -13.79), (1845.35, 1295.72, -13.8), (1809.85, 1286.36, -13.85), (1645.83, 1240.81, -13.65), (1464.98, 1190.8, -13.66), (995.61, 1061.26, -13.68), (610.92, 955.02, -13.61), (516.87, 928.87, -13.76), (481.16, 918.95, -13.89)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_26464323")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26464323", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(524.91, 915.07, -13.34), (999.45, 1046.51, -13.75), (1181.22, 1096.87, -13.61), (1369.47, 1148.29, -13.62), (1466.57, 1175.37, -13.69), (1647.66, 1224.83, -13.96), (1812.85, 1270.83, -13.64), (1898.11, 1294.74, -13.59), (1974.51, 1314.17, -13.66), (2062.14, 1335.4, -13.48), (2153.18, 1355.39, -13.28), (2236.37, 1372.94, -13.25), (2325.95, 1389.69, -12.62), (2407.78, 1403.5, -12.46), (2538.81, 1422.65, -12.31), (2635.06, 1433.96, -11.87), (2745.62, 1444.71, -10.79), (2880.21, 1456.07, -10.44), (2972.29, 1463.75, -8.51), (2987.38, 1465.01, -5.75), (3198.93, 1482.69, -4.31), (3366.21, 1496.59, -3.13)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_102150740")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_102150740", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(1910.88, 484.6, -3.28), (1913.52, 479.84, -3.28), (1917.51, 476.11, -3.28), (1922.46, 473.82, -3.13), (1927.89, 473.19, -2.98), (1933.23, 474.27, -2.83), (1937.98, 476.96, -2.68), (1941.65, 480.99, -2.89), (1943.9, 485.97, -3.24), (1944.47, 491.39, -3.6), (1943.34, 496.73, -3.95), (1940.43, 501.65, -4.31), (1936.08, 505.36, -4.42), (1930.75, 507.47, -4.53), (1925.03, 507.7, -4.63), (1919.55, 506.07, -4.74), (1914.89, 502.73, -4.85), (1911.26, 497.35, -4.54), (1909.85, 491.02, -4.46), (1910.88, 484.6, -4.33)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_130987118")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_130987118", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(1901.3, 481.1, -3.25), (1838.29, 456.78, -3.79), (1725.58, 413.25, -3.79), (1693.01, 400.67, -3.68)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_130987119")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_130987119", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(2371.81, 662.46, -2.44), (2332.99, 646.93, -2.24), (2312.16, 638.6, -2.32), (2235.33, 608.88, -2.53), (2180.32, 587.95, -2.66), (2115.2, 563.05, -3.44), (1951.57, 499.96, -3.89), (1943.34, 496.73, -4.31)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_137056721")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137056721", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3082.89, 1269.26, -5.14), (3047.87, 1241.64, -5.09), (3006.08, 1208.69, -4.77), (2967.29, 1174.97, -4.82), (2921.2, 1132.09, -4.95), (2852.97, 1062.66, -4.9), (2830.05, 1037.27, -4.9)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_137056722")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137056722", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3894.39, 1556.84, 8.31), (3810.83, 1550.18, 6.52), (3575.16, 1530.24, 6.52), (3420.65, 1517.33, 4.92)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_270684301")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684301", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(2830.05, 1037.27, -4.18), (2768.96, 968.3, -4.42), (2714.19, 906.02, -4.42), (2684.13, 873.15, -3.8)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_425750949")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425750949", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3566.19, 1725.55, 1.01), (3518.79, 1657.95, 1.04), (3455.22, 1572.57, 1.25), (3404.23, 1514.47, 1.31), (3366.7, 1476.35, 1.3), (3355.64, 1466.7, 1.83), (3350.91, 1462.56, 1.6), (3328.83, 1444.71, 0.95), (3291.02, 1415.06, 0.12), (3246.18, 1382.57, -0.71), (3151.67, 1318.01, -1.96), (3144.97, 1313.38, -2.9), (3138.37, 1308.81, -3.32), (3082.89, 1269.26, -3.47)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_427160544")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_427160544", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3571.69, 1733.36, 1.0), (3566.19, 1725.55, 1.0)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_427162186")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_427162186", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(1463.51, 298.74, -0.26), (1420.54, 265.44, 1.53), (1369.62, 214.31, 2.51), (1329.55, 158.93, 5.45), (1309.46, 121.92, 5.88), (1292.5, 87.66, 7.47), (1271.85, 37.3, 7.67)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_494966488")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966488", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(1693.01, 400.67, -4.57), (1562.97, 351.99, -4.63), (1509.2, 327.59, -4.63), (1463.51, 298.74, -4.37)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_664213525")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_664213525", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(2684.13, 873.15, -3.11), (2627.11, 819.51, -3.38), (2615.14, 809.2, -3.19), (2603.55, 799.23, -2.4), (2588.81, 788.19, -2.91), (2555.19, 761.71, -2.58), (2533.22, 747.39, -2.17), (2516.85, 736.81, -2.1)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_791472616")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472616", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3896.06, 1947.13, 7.38), (3879.62, 1943.13, 7.31), (3868.21, 1939.85, 7.31), (3838.02, 1929.7, 7.18)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_791670858")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791670858", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(1910.88, 484.6, -3.71), (1901.3, 481.1, -3.71)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_793787586")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793787586", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(2516.85, 736.81, -2.44), (2468.52, 708.4, -2.84), (2433.43, 690.66, -2.47), (2421.15, 684.83, -2.61), (2397.19, 673.48, -2.66), (2384.97, 667.94, -2.89), (2371.81, 662.46, -2.5)]
if len(pts) >= 2:
    half_w = 4.25
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_793787587")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793787587", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

pts = [(3379.64, 1514.16, -2.94), (3197.48, 1498.05, -5.33), (2987.52, 1481.17, -6.8), (2744.92, 1461.17, -8.94), (2629.71, 1448.85, -10.42), (2534.89, 1437.7, -11.69), (2494.79, 1431.9, -11.48), (2449.55, 1425.24, -11.08)]
if len(pts) >= 2:
    half_w = 5.75
    verts = []
    faces = []
    for i in range(len(pts)):
        x, y, z = pts[i]
        if i < len(pts) - 1:
            dx = pts[i+1][0] - x
            dy = pts[i+1][1] - y
        else:
            dx = x - pts[i-1][0]
            dy = y - pts[i-1][1]
        
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            length = 1.0
        
        # Horizontal normal in XY plane
        nx = -dy / length
        ny = dx / length
        
        v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
        v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
        verts.append(v_left)
        verts.append(v_right)
        
        if i > 0:
            v1 = (i - 1) * 2
            v2 = (i - 1) * 2 + 1
            v3 = i * 2 + 1
            v4 = i * 2
            faces.append((v1, v2, v3, v4))
            
    mesh_data = bpy.data.meshes.new("Mesh_1498285739")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1498285739", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)
