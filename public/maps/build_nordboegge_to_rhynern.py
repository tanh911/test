import bpy
import mathutils
import math

coll_name = "A2_Nordboegge_to_Rhynern_3D"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")
mat_concrete = bpy.data.materials.get("Support Side Bridge") or bpy.data.materials.get("Support Spring")
mat_grass = bpy.data.materials.get("Autobahn_Grass_Mat") or bpy.data.materials.get("Terrain Spring")

# Segment 4685992 (motorway_link)
pts = [(-2244.78, 99.16, 5.35), (-2223.13, 105.96, 3.57), (-2212.46, 112.59, 3.57), (-2196.97, 119.35, 1.82), (-2111.34, 155.84, -1.43), (-2085.37, 164.29, -2.19), (-2075.27, 164.91, -2.19), (-2065.17, 163.03, -2.19), (-2056.74, 157.99, -3.09), (-2049.41, 150.98, -3.09), (-2043.81, 141.14, -3.59), (-2041.57, 132.52, -3.59), (-2041.22, 123.01, -3.59), (-2043.25, 113.8, -4.19), (-2047.01, 106.03, -4.19), (-2052.13, 100.87, -4.19), (-2057.3, 95.23, -4.19), (-2067.79, 88.78, 1.82), (-2096.82, 77.65, -3.54), (-2110.21, 65.81, 0.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_4685992")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_4685992", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 4686056 (secondary)
pts = [(-2884.41, 2576.71, -14.9), (-2876.77, 2463.52, -14.9), (-2866.55, 2291.16, -9.82), (-2860.87, 2202.72, -15.59), (-2852.48, 2049.5, -16.93), (-2851.81, 1919.15, -12.54), (-2851.74, 1910.43, -12.54), (-2851.59, 1897.37, -14.1), (-2851.36, 1883.56, -14.1), (-2851.13, 1867.72, -14.82), (-2851.63, 1746.62, -13.67), (-2851.01, 1656.4, -11.98)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_4686056")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_4686056", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 4686300 (motorway_link)
pts = [(-2563.48, -120.98, 1.21), (-2519.45, -115.61, -0.0), (-2505.92, -115.24, -1.76), (-2491.81, -115.96, -2.37), (-2477.72, -120.08, -2.37), (-2460.7, -129.12, -0.32), (-2444.3, -144.19, -0.32), (-2432.65, -156.17, -1.63), (-2432.61, -156.21, -1.63), (-2421.89, -167.29, -0.82)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_4686300")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_4686300", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 5733983 (motorway_link)
pts = [(4200.27, 1489.67, 17.36), (4200.16, 1497.73, 17.36), (4197.46, 1508.96, 19.23), (4197.26, 1517.01, 19.23), (4198.89, 1525.3, 19.23), (4204.1, 1536.88, 19.23), (4211.7, 1547.25, 18.28), (4225.36, 1556.25, 18.28), (4239.56, 1562.29, 18.63), (4251.54, 1571.28, 18.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_5733983")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_5733983", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 8088288 (motorway)
pts = [(3420.65, 1517.33, 8.65), (3379.64, 1514.16, 8.57)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 8088808 (motorway)
pts = [(3407.88, 1499.81, 3.67), (3576.52, 1513.96, 4.94), (3874.71, 1539.06, 8.2)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 8089228 (motorway)
pts = [(3366.21, 1496.59, 9.21), (3407.88, 1499.81, 11.17)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 21117378 (tertiary)
pts = [(-770.99, -1622.25, -4.99), (-773.02, -1656.11, -4.99), (-776.15, -1699.15, -4.64), (-778.49, -1727.67, -4.64), (-781.22, -1743.2, -4.64), (-785.94, -1762.57, -4.64), (-794.54, -1779.02, 2.65), (-807.53, -1793.27, 2.65), (-816.4, -1801.05, 2.65), (-837.96, -1816.83, 6.25), (-845.81, -1821.2, 6.25), (-853.74, -1825.43, 5.32), (-898.79, -1847.05, 0.84), (-910.04, -1850.99, -4.37), (-931.61, -1857.28, -4.37), (-988.09, -1873.82, -7.02), (-1037.27, -1888.38, -7.73), (-1046.49, -1891.35, -7.73), (-1094.47, -1906.27, -10.02), (-1144.42, -1921.84, -12.04), (-1156.22, -1926.97, -12.04), (-1165.68, -1933.86, -12.04), (-1214.33, -1974.15, -13.1), (-1226.93, -1986.69, -13.1), (-1240.15, -1999.84, -12.02), (-1252.71, -2013.48, -12.02), (-1259.55, -2020.95, -13.24), (-1287.82, -2052.93, -13.24), (-1306.37, -2074.83, -12.8), (-1310.76, -2080.02, -12.8), (-1322.98, -2096.68, -15.79), (-1326.91, -2102.03, -15.79), (-1334.96, -2111.69, -15.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_21117378")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_21117378", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 23196719 (secondary)
pts = [(3838.02, 1929.7, 7.1), (3791.31, 1911.3, 5.45), (3761.81, 1897.69, 4.0), (3733.93, 1882.89, 3.85), (3703.72, 1863.94, 3.22), (3672.93, 1841.79, 3.91), (3633.35, 1806.4, 3.28), (3611.28, 1782.89, 2.71), (3571.69, 1733.36, 1.0)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 23478278 (tertiary)
pts = [(4304.76, -75.94, 8.89), (4183.26, -106.92, 9.49), (4150.1, -119.35, 9.42), (4117.11, -133.88, 9.65), (4030.25, -173.96, 9.65), (3974.08, -199.91, 10.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_23478278")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23478278", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 23478309 (tertiary)
pts = [(-3053.47, 301.24, -3.1), (-3075.0, 302.21, -1.49), (-3093.96, 303.88, -3.31), (-3109.94, 306.48, -3.51), (-3122.68, 309.78, -3.51), (-3133.64, 313.02, -3.28), (-3157.15, 321.66, -2.4), (-3182.6, 333.02, -2.4), (-3211.59, 347.47, -2.92)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_23478309")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23478309", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 23542530 (secondary)
pts = [(878.75, -798.94, 14.59), (891.89, -825.58, 14.59), (939.27, -930.44, 13.89), (970.44, -1016.74, 14.0), (978.68, -1043.72, 14.0), (993.51, -1105.99, 13.85), (1001.92, -1174.37, 13.85), (1001.63, -1242.12, 13.85), (993.53, -1305.53, 13.85), (975.89, -1368.03, 14.0), (950.17, -1438.79, 13.89), (932.7, -1476.5, 13.89), (913.57, -1512.23, 16.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_23542530")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23542530", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 23678088 (tertiary)
pts = [(1186.36, 3208.62, -14.11), (1194.73, 3234.37, -14.11), (1209.2, 3284.14, -14.11), (1220.25, 3325.49, -14.26), (1227.17, 3367.99, -14.26), (1228.56, 3383.91, -14.26), (1229.26, 3398.52, -14.26), (1229.31, 3418.21, -14.26), (1226.93, 3480.29, -14.26), (1218.32, 3558.51, -14.11), (1211.2, 3632.98, -14.11), (1208.71, 3678.59, -14.11)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_23678088")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23678088", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 23769755 (tertiary)
pts = [(2762.89, 753.84, -0.13), (2806.51, 688.38, -0.41), (2815.62, 674.36, -0.41), (2833.64, 648.72, 1.26), (2849.75, 624.57, 6.47), (2873.2, 590.56, 5.25), (2886.86, 569.94, 4.53), (2909.58, 533.85, 4.83), (2915.6, 524.39, 4.83), (2920.79, 514.39, 5.91), (2927.26, 498.44, 5.91), (2932.98, 482.38, 7.38), (2955.35, 420.5, 8.8), (3040.47, 85.18, 12.72), (3047.55, 56.5, 12.72), (3073.96, -47.38, 12.23), (3121.77, -236.37, 12.09), (3122.7, -243.06, 12.09)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_23769755")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_23769755", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24621001 (tertiary)
pts = [(-5357.93, -302.87, -17.79), (-5324.17, -276.61, -18.11), (-5295.47, -247.19, -15.91), (-5168.12, -107.98, -7.72), (-5103.58, -38.77, -6.62), (-5055.35, 9.74, -6.1), (-5028.18, 29.79, -5.08), (-4999.94, 46.24, -5.08)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24621001")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24621001", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24650091 (tertiary)
pts = [(-1813.12, 3931.25, -21.16), (-1811.49, 3925.31, -21.16), (-1809.36, 3916.01, -22.59), (-1808.17, 3908.13, -22.59), (-1806.1, 3892.74, -22.59), (-1803.21, 3870.75, -22.59), (-1795.79, 3820.4, -22.59), (-1794.42, 3810.56, -22.59), (-1789.42, 3776.26, -22.59), (-1787.01, 3758.31, -22.59), (-1785.37, 3747.23, -22.59), (-1777.75, 3695.9, -22.59), (-1777.41, 3693.13, -22.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24650091")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24650091", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24650092 (tertiary)
pts = [(1137.48, 3027.01, -13.78), (1179.79, 3022.35, -13.62), (1210.17, 3017.63, -13.75), (1245.16, 3011.23, -12.3), (1279.64, 3003.15, -11.05), (1361.67, 2982.13, -12.97), (1390.94, 2975.03, -12.97), (1421.75, 2968.45, -12.22), (1455.01, 2961.68, -13.48), (1473.95, 2958.3, -11.15), (1514.56, 2952.16, -11.19), (1560.04, 2946.99, -14.08), (1589.73, 2944.84, -13.8), (1613.11, 2943.22, -13.8), (1634.44, 2942.48, -14.14), (1675.45, 2941.59, -13.22), (1697.69, 2941.95, -13.01), (1729.84, 2942.8, -14.14), (1785.3, 2946.37, -14.06), (1824.35, 2950.17, -13.08), (1861.09, 2955.31, -13.29), (1897.61, 2961.29, -14.24), (1933.83, 2968.01, -14.88), (1966.41, 2974.96, -14.88), (1995.33, 2982.06, -13.17), (2020.29, 2989.25, -13.74), (2042.35, 2995.63, -13.46), (2065.7, 3002.83, -12.79), (2092.91, 3012.39, -12.48), (2120.01, 3021.96, -13.85), (2148.18, 3033.0, -11.85), (2175.86, 3043.71, -10.02), (2197.73, 3053.15, -13.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24650092")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24650092", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24738807 (motorway_link)
pts = [(-1891.44, 146.63, -6.42), (-1939.79, 137.42, -7.0), (-1958.27, 135.88, -6.83), (-1964.16, 135.78, -6.83), (-1971.45, 136.65, -6.83), (-1990.72, 143.06, -4.95), (-2004.91, 149.84, -4.82), (-2031.15, 165.54, -4.82), (-2045.21, 172.51, -3.09), (-2065.02, 175.16, -2.19), (-2085.6, 173.54, -2.19), (-2112.08, 163.52, -1.43), (-2151.05, 147.28, 1.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24738807")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24738807", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24748898 (tertiary)
pts = [(-380.72, 3942.89, -10.98), (-376.62, 3927.28, -10.98), (-367.38, 3895.45, -10.04), (-348.36, 3831.98, -10.04), (-344.52, 3820.47, -10.04), (-341.35, 3813.17, -10.04), (-336.75, 3806.23, -10.04), (-331.47, 3800.45, -11.54), (-324.25, 3794.71, -11.54), (-314.98, 3789.78, -11.54), (-304.31, 3786.86, -11.51), (-292.57, 3785.87, -11.51), (-244.99, 3785.87, -11.87), (-232.44, 3785.32, -11.87), (-220.37, 3783.41, -11.87), (-210.93, 3780.93, -11.61), (-198.72, 3775.93, -11.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24748898")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24748898", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24772943 (tertiary)
pts = [(-81.48, 3530.29, -11.45), (-78.03, 3504.7, -11.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24772943")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24772943", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 24930964 (secondary)
pts = [(-1742.14, -313.44, -7.27), (-1761.16, -319.48, -5.86), (-1776.18, -324.15, -2.62), (-1808.29, -334.02, -2.62), (-1815.72, -335.77, -2.24), (-1832.73, -338.38, -2.91), (-1849.39, -340.07, -2.91), (-1867.4, -340.48, -3.25), (-1884.66, -340.26, -3.25), (-1921.42, -338.55, -2.81), (-1960.98, -336.37, 0.22), (-2015.05, -333.0, -6.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_24930964")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_24930964", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25017086 (secondary)
pts = [(-3888.59, -2875.84, -4.69), (-3879.94, -2858.27, -4.69), (-3869.78, -2839.57, -4.52), (-3848.39, -2802.32, -4.52), (-3833.32, -2779.45, -3.26), (-3818.74, -2760.21, 0.3), (-3814.33, -2754.88, 0.3), (-3807.59, -2747.12, 0.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25017086")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25017086", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25414506 (motorway_link)
pts = [(4249.04, 1587.09, 18.56), (4235.42, 1594.25, 18.56), (4221.63, 1598.54, 18.13), (4218.77, 1599.67, 18.13), (4207.78, 1605.45, 19.58), (4197.75, 1615.08, 19.58), (4190.34, 1627.81, 19.58), (4187.79, 1640.36, 20.05), (4189.16, 1651.54, 20.05), (4188.89, 1662.27, 15.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25414506")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25414506", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25416796 (tertiary)
pts = [(-4999.94, 46.24, -5.08), (-4967.93, 61.89, -5.09), (-4935.81, 73.23, -5.09), (-4898.23, 82.56, -5.09), (-4860.12, 89.56, -5.51), (-4765.4, 105.95, -5.51)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25416796")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25416796", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25421590 (secondary)
pts = [(-2236.86, 66.81, 4.37), (-2233.25, 40.68, 4.78)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25421590")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25421590", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25421591 (secondary)
pts = [(-2234.38, -23.42, -5.65), (-2236.5, -41.16, 1.61), (-2241.49, -62.17, 1.61), (-2251.96, -93.76, 2.55), (-2259.64, -112.33, 0.1), (-2268.68, -128.53, 0.1)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25421591")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25421591", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25421606 (tertiary)
pts = [(-2912.62, -282.73, 2.46), (-2896.13, -197.99, 8.17)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25421606")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25421606", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25436693 (secondary)
pts = [(-2147.98, 3474.02, -14.1), (-2157.83, 3460.33, -12.22), (-2174.72, 3436.89, -11.46)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25436693")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25436693", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25436695 (secondary)
pts = [(-2174.72, 3436.89, -18.96), (-2188.75, 3417.1, -18.96), (-2192.31, 3410.56, -18.96)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25436695")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25436695", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479593 (secondary)
pts = [(-1121.75, -402.16, -11.83), (-1130.36, -406.36, -11.83), (-1143.84, -407.65, -4.73), (-1153.75, -409.12, -4.73)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479593")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479593", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479602 (secondary)
pts = [(-1107.03, -422.0, -9.09), (-1102.12, -421.87, -9.09), (-1098.38, -420.78, -9.09), (-1094.58, -418.56, -9.09), (-1091.47, -415.43, -9.09), (-1090.17, -413.15, -9.09), (-1089.28, -411.61, -9.09), (-1088.14, -407.35, -9.09), (-1088.34, -401.68, -10.41), (-1090.39, -396.41, -10.41), (-1094.07, -392.08, -10.41), (-1098.96, -389.22, -10.41), (-1102.36, -388.36, -10.41), (-1104.52, -388.11, -10.41), (-1110.13, -388.91, -10.41), (-1114.83, -391.25, -10.41), (-1116.5, -392.88, -10.41), (-1118.59, -394.92, -10.41), (-1121.05, -399.54, -11.83), (-1121.75, -402.16, -11.83), (-1121.99, -404.71, -11.83), (-1121.3, -409.91, -8.58), (-1119.24, -414.39, -9.09), (-1115.98, -418.09, -9.09), (-1111.79, -420.7, -9.09), (-1107.03, -422.0, -9.09)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479602")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479602", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479719 (secondary)
pts = [(-1377.44, -348.04, -1.53), (-1437.02, -322.71, 1.46)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479719")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479719", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479770 (motorway)
pts = [(-1292.78, 330.79, -0.21), (-1270.96, 337.87, -1.46)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479770")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479770", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479783 (motorway)
pts = [(-1093.94, 412.16, -7.75), (-1259.78, 357.57, -8.96)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479783")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479783", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479784 (motorway)
pts = [(-1059.65, 423.62, 3.03), (-1093.94, 412.16, -0.25)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479784")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479784", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479799 (motorway)
pts = [(-1103.41, 393.48, 2.82), (-1066.31, 405.55, 2.17)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479799")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479799", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479800 (motorway)
pts = [(-1066.31, 405.55, -5.33), (-901.56, 459.63, -6.85), (-769.69, 504.02, -5.58), (-570.7, 569.7, -6.68), (-492.06, 595.7, -7.2), (-371.71, 635.49, -8.51)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479800")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479800", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25479995 (tertiary)
pts = [(-1102.36, -388.36, -10.41), (-1106.73, -380.08, -10.41), (-1107.59, -371.42, -10.76), (-1109.26, -365.22, -10.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25479995")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25479995", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25514062 (tertiary)
pts = [(-167.7, 3757.08, -11.79), (-151.74, 3747.07, -10.72), (-133.2, 3734.08, -11.29), (-125.79, 3726.64, -11.29), (-118.77, 3717.53, -11.29), (-113.18, 3706.4, -11.29), (-109.14, 3695.27, -11.29), (-99.96, 3647.6, -11.63), (-87.57, 3565.24, -11.63), (-81.48, 3530.29, -11.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25514062")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25514062", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25514063 (tertiary)
pts = [(-198.72, 3775.93, -4.29), (-167.7, 3757.08, -4.29)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25514063")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25514063", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25558324 (motorway_link)
pts = [(-2357.16, -227.21, -2.17), (-2373.14, -208.93, -0.86), (-2383.0, -197.96, -0.86), (-2393.76, -186.0, -1.36), (-2407.14, -163.39, -0.82), (-2410.78, -153.56, -1.63), (-2414.08, -141.66, -1.63), (-2414.13, -124.5, -1.31), (-2413.17, -110.85, -1.31), (-2409.47, -100.04, -1.31), (-2403.03, -86.55, -2.05), (-2395.36, -76.89, -2.05), (-2387.37, -68.89, -2.05), (-2360.0, -44.56, -1.69)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25558324")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25558324", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25824302 (motorway_link)
pts = [(4115.93, 1560.04, 17.12), (4133.22, 1551.35, 17.12), (4149.69, 1546.2, 17.12), (4163.88, 1536.69, 17.49), (4175.2, 1523.38, 19.23), (4187.44, 1502.96, 17.36), (4191.92, 1496.31, 17.36), (4200.27, 1489.67, 17.36)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25824302")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25824302", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25948446 (tertiary)
pts = [(-1422.08, -2370.58, -16.57), (-1426.07, -2383.07, -16.57), (-1430.88, -2400.94, -11.28), (-1434.99, -2425.86, -11.28), (-1435.94, -2449.93, -11.28), (-1435.22, -2472.19, -11.28), (-1434.13, -2501.25, -11.28), (-1432.81, -2531.06, -11.28), (-1434.03, -2547.61, -11.28), (-1437.9, -2561.14, -11.28), (-1444.79, -2573.29, -11.28), (-1455.83, -2585.28, -11.28)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25948446")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25948446", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 25984210 (secondary)
pts = [(-2364.95, -232.63, -5.67), (-2353.63, -245.61, -5.67), (-2339.3, -253.83, -4.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_25984210")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_25984210", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26007218 (tertiary)
pts = [(-1476.57, -2602.4, -8.01), (-1508.92, -2629.24, -12.31), (-1538.37, -2651.33, -13.68), (-1607.86, -2694.09, -16.31), (-1705.39, -2756.5, -14.79), (-1715.93, -2762.88, -13.59), (-1720.67, -2765.44, -13.59), (-1733.86, -2771.66, -13.59), (-1742.85, -2774.78, -13.59), (-1745.77, -2775.38, -13.59), (-1755.63, -2777.39, -12.15), (-1771.87, -2779.96, -11.93), (-1820.09, -2788.89, -14.82), (-1839.04, -2794.11, -14.4), (-1856.92, -2800.78, -14.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26007218")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26007218", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26007275 (tertiary)
pts = [(-1455.83, -2585.28, -3.78), (-1476.57, -2602.4, -0.51)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26007275")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26007275", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26114585 (tertiary)
pts = [(-554.8, 601.03, -9.27), (-565.46, 642.84, -10.8), (-567.1, 652.02, -9.06), (-573.73, 687.44, -10.76), (-581.48, 728.03, -10.0), (-589.29, 773.32, -10.73), (-595.19, 810.69, -10.3), (-597.24, 822.1, -10.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26114585")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26114585", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26114784 (tertiary)
pts = [(120.93, 2602.77, -11.55), (128.92, 2571.19, -12.32), (136.92, 2538.24, -11.71), (148.58, 2495.8, -11.31), (169.8, 2437.23, -13.46), (174.05, 2426.57, -12.93), (181.66, 2395.37, -11.28), (186.05, 2373.33, -13.64), (193.57, 2327.13, -12.22), (202.68, 2272.83, -11.95)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26114784")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26114784", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26114994 (tertiary)
pts = [(-545.49, 566.55, 0.96), (-554.8, 601.03, -1.77)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26114994")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26114994", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26118756 (secondary)
pts = [(-3532.26, -2349.66, 0.86), (-3497.1, -2208.47, 0.86), (-3472.43, -2106.91, 2.75), (-3453.05, -2028.22, 2.75), (-3443.29, -1992.47, 2.75), (-3432.04, -1956.59, -0.78), (-3423.93, -1934.39, -0.78), (-3412.89, -1911.65, -3.67), (-3392.31, -1874.09, -3.67), (-3369.58, -1836.0, -0.58), (-3356.14, -1815.4, 3.97), (-3341.49, -1793.49, 3.97), (-3328.74, -1774.6, 3.97), (-3306.24, -1738.58, 5.34), (-3299.7, -1727.37, 6.35)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26118756")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26118756", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26134999 (tertiary)
pts = [(-1885.05, -1404.05, -14.91), (-1870.53, -1371.31, -14.91), (-1866.93, -1363.19, -14.4), (-1862.43, -1355.67, -14.4), (-1859.37, -1351.77, -14.4), (-1854.82, -1347.54, -14.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26134999")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26134999", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26135001 (tertiary)
pts = [(-2238.4, -1520.14, -9.86), (-2236.36, -1526.93, -9.86), (-2233.8, -1531.26, -9.86), (-2230.0, -1538.23, -11.45), (-2228.44, -1543.26, -11.45), (-2227.44, -1548.99, -11.45), (-2227.21, -1553.86, -11.45), (-2228.55, -1577.66, -11.45), (-2230.11, -1605.31, -11.45), (-2229.8, -1611.31, -11.45), (-2228.19, -1617.33, -11.45), (-2226.35, -1620.78, -11.45), (-2223.25, -1625.45, -11.45), (-2219.98, -1629.06, -11.45), (-2214.95, -1632.63, -11.45), (-2210.43, -1634.24, -10.97), (-2205.6, -1635.44, -10.97), (-2199.06, -1635.88, -10.97), (-2187.08, -1636.45, -10.97), (-2171.82, -1636.58, -12.44), (-2150.09, -1636.77, -13.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26135001")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26135001", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26135003 (tertiary)
pts = [(-2050.69, -1633.55, -13.37), (-2043.75, -1629.36, -13.37), (-2039.27, -1624.86, -14.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26135003")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26135003", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26135004 (tertiary)
pts = [(-1966.0, -1541.14, -14.57), (-1957.26, -1539.78, -14.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26135004")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26135004", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26135005 (tertiary)
pts = [(-1920.68, -1454.65, -14.02), (-1921.85, -1450.61, -14.02), (-1924.13, -1446.86, -14.02)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26135005")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26135005", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26221001 (secondary)
pts = [(-3777.2, -2713.71, 0.16), (-3742.89, -2679.81, 2.6)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26221001")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26221001", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26221019 (secondary)
pts = [(-3807.59, -2747.12, 7.8), (-3787.02, -2724.49, 7.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26221019")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26221019", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26236661 (tertiary)
pts = [(-1106.93, -313.22, -12.2), (-1104.98, -253.99, -13.5), (-1103.21, -200.65, -12.97), (-1102.99, -193.89, -12.97), (-1100.99, -133.41, -12.33), (-1100.38, -110.15, -11.75), (-1098.2, -53.36, -9.83), (-1097.93, -44.03, -9.83), (-1095.42, -36.0, -12.3), (-1091.3, -28.35, -12.3), (-1086.37, -21.21, -12.3), (-1077.0, -13.43, -11.41), (-1066.31, -7.85, -11.41), (-1053.7, -3.92, -9.74), (-1021.98, 6.45, -12.47), (-995.26, 15.5, -11.75), (-975.57, 22.14, -11.75), (-962.08, 26.7, -11.29), (-922.54, 40.11, -12.11), (-842.99, 66.21, -11.68), (-794.4, 82.16, -10.81), (-733.31, 102.2, -10.6), (-712.41, 109.05, -9.8), (-704.42, 111.68, -9.8), (-695.83, 114.49, -9.8), (-685.96, 117.73, -9.8), (-601.13, 145.94, -9.83), (-570.79, 156.03, -8.59), (-532.41, 168.8, -9.99), (-520.32, 172.67, -9.99), (-509.29, 176.29, -9.99), (-445.15, 197.35, -9.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26236661")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26236661", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26311650 (tertiary)
pts = [(-2150.09, -1628.24, -13.05), (-2171.89, -1628.99, -12.44), (-2187.16, -1629.52, -10.97), (-2195.25, -1628.97, -10.97), (-2203.55, -1627.55, -10.97), (-2210.34, -1625.06, -10.97), (-2215.19, -1621.67, -11.45), (-2219.71, -1615.87, -11.45), (-2221.65, -1610.75, -11.45), (-2222.71, -1602.85, -11.45), (-2222.79, -1595.3, -11.45), (-2221.49, -1578.09, -11.45), (-2219.76, -1554.85, -11.45), (-2219.8, -1546.63, -11.45), (-2220.32, -1540.47, -11.45), (-2221.67, -1534.8, -11.45), (-2224.5, -1529.25, -11.45), (-2227.98, -1524.7, -11.45), (-2231.16, -1522.2, -11.45), (-2238.4, -1520.14, -9.86)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26311650")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26311650", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26311654 (tertiary)
pts = [(-2238.4, -1520.14, -9.86), (-2246.17, -1517.52, -9.86), (-2252.99, -1516.7, -9.86), (-2259.45, -1516.96, -9.86), (-2267.18, -1518.88, -9.86), (-2276.15, -1521.82, -9.02)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26311654")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26311654", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26464323 (motorway)
pts = [(2449.55, 1425.24, -12.99), (2401.35, 1418.15, -13.85), (2324.52, 1405.3, -13.66), (2239.08, 1389.14, -13.68), (2147.84, 1370.7, -13.7), (2059.01, 1350.15, -12.79), (1970.22, 1328.62, -14.36), (1845.35, 1295.72, -14.36), (1809.85, 1286.36, -13.72), (1645.83, 1240.81, -13.78), (1464.98, 1190.8, -13.03), (995.61, 1061.26, -13.38), (610.92, 955.02, -14.37), (516.87, 928.87, -13.82), (481.16, 918.95, -13.47)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 26733736 (tertiary)
pts = [(-116.21, -1079.33, 0.26), (-134.96, -1083.92, 0.26), (-179.16, -1099.39, -1.51), (-228.32, -1122.64, -3.5), (-265.89, -1143.94, -4.63), (-297.41, -1163.18, -4.81), (-301.51, -1165.68, -4.81), (-316.18, -1174.76, -1.16), (-345.72, -1191.96, 0.14), (-348.28, -1193.45, 0.14), (-359.61, -1200.04, 0.14), (-375.98, -1209.15, -1.73)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26733736")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26733736", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26743367 (tertiary)
pts = [(-436.96, 200.57, -9.81), (-449.78, 247.97, -8.03), (-474.67, 336.33, -9.11), (-478.97, 350.25, -9.11), (-482.33, 360.46, -9.11), (-494.32, 395.4, -10.84), (-514.85, 452.35, -8.65), (-537.63, 537.76, -11.68), (-544.95, 564.57, -6.54), (-545.49, 566.55, -6.54)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26743367")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26743367", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26777465 (tertiary)
pts = [(-2927.73, -564.04, 0.23), (-2922.01, -570.72, 0.23), (-2914.16, -579.07, -7.43), (-2903.66, -588.57, -7.43)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26777465")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26777465", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26777551 (tertiary)
pts = [(-2896.13, -197.99, 0.67), (-2895.28, -192.91, 0.67), (-2893.32, -183.09, 0.3), (-2891.55, -167.09, 0.3), (-2890.47, -148.78, -1.1), (-2891.82, -129.37, -1.1), (-2893.98, -111.5, -1.76), (-2897.12, -91.58, -2.29)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26777551")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26777551", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26777843 (secondary)
pts = [(-2736.11, 972.36, -10.74), (-2734.48, 970.98, -10.74), (-2732.45, 969.14, -10.74), (-2699.65, 944.68, -14.06), (-2694.51, 941.19, -14.06), (-2658.19, 919.78, -14.43), (-2609.37, 894.17, -15.92), (-2561.06, 867.66, -15.67), (-2521.29, 843.24, -16.02), (-2489.61, 817.21, -11.65), (-2463.98, 791.56, -9.83), (-2442.52, 765.31, -13.5), (-2420.61, 731.05, -13.45), (-2399.77, 686.58, -11.59), (-2385.29, 642.52, -12.02), (-2373.81, 588.02, -10.42), (-2349.83, 445.06, -7.74), (-2329.52, 362.1, -3.07), (-2320.71, 328.89, -5.21), (-2317.43, 317.41, -5.21)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26777843")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26777843", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26782956 (tertiary)
pts = [(1497.71, -2477.43, 19.84), (1501.34, -2484.14, 19.84), (1520.56, -2513.54, 19.81), (1575.9, -2595.26, 16.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26782956")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26782956", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26829426 (motorway_link)
pts = [(-3513.41, -481.57, -10.55), (-3479.94, -483.46, -10.64)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26829426")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26829426", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26855479 (secondary)
pts = [(-2857.32, 1282.23, -15.92), (-2857.69, 1253.01, -15.46), (-2856.78, 1213.63, -15.7), (-2854.44, 1187.84, -15.02)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26855479")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26855479", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26856415 (secondary)
pts = [(-3742.89, -2679.81, 2.6), (-3695.04, -2632.94, -0.44), (-3647.68, -2582.45, -2.6), (-3611.76, -2534.86, -2.6), (-3595.28, -2508.71, 1.6), (-3581.82, -2485.25, 2.45), (-3573.41, -2466.99, 2.45), (-3565.7, -2449.04, 2.45), (-3550.98, -2410.27, 3.75), (-3532.26, -2349.66, 0.86)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26856415")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26856415", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26859117 (secondary)
pts = [(-350.28, -658.13, -5.2), (-380.34, -658.49, -4.53), (-414.2, -662.83, -5.17), (-453.77, -671.07, -4.45), (-501.26, -679.1, -3.82), (-550.53, -680.61, -2.84), (-586.46, -676.19, -4.14), (-624.96, -666.03, -4.59), (-662.27, -648.85, -4.48), (-693.7, -630.74, -4.67), (-739.96, -598.89, -5.67), (-811.43, -543.68, -5.93), (-897.27, -469.29, -6.19), (-918.77, -449.36, -6.37), (-930.1, -439.74, -6.37), (-941.68, -431.28, -8.18), (-951.06, -424.84, -7.73), (-965.26, -417.33, -7.73), (-982.91, -410.3, -7.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26859117")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26859117", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 26976252 (tertiary)
pts = [(-3243.1, 363.74, 4.58), (-3211.59, 347.47, 4.58)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_26976252")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_26976252", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27251785 (tertiary)
pts = [(2524.89, 1462.22, -2.4), (2533.61, 1397.51, -3.5)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27251785")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27251785", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27251787 (tertiary)
pts = [(2533.61, 1397.51, -11.0), (2554.99, 1223.37, -10.76), (2555.9, 1215.65, -10.76), (2558.53, 1189.21, -10.84), (2560.43, 1176.42, -10.84), (2564.86, 1158.53, -10.57), (2578.74, 1104.6, -9.45), (2584.38, 1088.94, -9.45), (2594.37, 1071.0, -9.44), (2603.74, 1057.91, -5.99), (2610.15, 1045.79, -5.99), (2623.31, 1011.63, -8.15), (2629.89, 994.54, -8.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27251787")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27251787", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27251805 (tertiary)
pts = [(2374.71, 2105.71, -15.07), (2353.37, 2102.21, -15.24), (2335.26, 2098.75, -15.24), (2318.14, 2094.5, -14.98), (2279.44, 2083.67, -13.02), (2230.44, 2070.31, -14.59), (2217.17, 2067.17, -14.59), (2198.83, 2063.57, -14.73), (2178.1, 2060.9, -10.9), (2134.05, 2056.47, -14.21), (2076.64, 2051.65, -14.57), (2021.99, 2048.26, -15.28), (1977.64, 2046.55, -14.61), (1892.57, 2047.62, -14.76), (1805.71, 2048.15, -12.27)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27251805")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27251805", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27252575 (tertiary)
pts = [(263.21, 1199.07, -13.67), (250.01, 1235.66, -13.92), (238.62, 1257.81, -13.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27252575")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27252575", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27252985 (tertiary)
pts = [(-532.1, 2949.43, -9.57), (-522.21, 2952.36, -9.57), (-480.02, 2966.64, -8.23), (-457.35, 2975.48, -8.23), (-453.99, 2976.75, -8.23), (-429.07, 2985.65, -11.29)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27252985")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27252985", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27260092 (tertiary)
pts = [(76.89, 3087.65, -12.18), (56.46, 3082.24, -11.17), (50.91, 3081.03, -11.17)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27260092")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27260092", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27329814 (tertiary)
pts = [(2675.86, -2273.15, 10.86), (2734.81, -2236.17, 10.56), (2755.75, -2223.31, 10.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27329814")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27329814", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 27862914 (tertiary)
pts = [(-3566.49, 3094.35, -18.7), (-3566.57, 3100.58, -18.7), (-3574.23, 3138.78, -18.7), (-3586.46, 3199.64, -18.7), (-3586.82, 3200.94, -18.7), (-3589.07, 3211.03, -18.7), (-3589.55, 3214.63, -18.7), (-3590.91, 3220.6, -18.7), (-3591.54, 3223.97, -18.7), (-3591.73, 3224.89, -18.7), (-3592.08, 3226.13, -18.7), (-3594.51, 3232.94, -19.5), (-3596.74, 3237.35, -19.5), (-3600.49, 3242.93, -19.5), (-3603.94, 3247.73, -19.5), (-3607.95, 3252.47, -19.5), (-3612.83, 3257.82, -20.26), (-3625.51, 3271.06, -20.26), (-3685.22, 3330.76, -21.82), (-3705.29, 3351.36, -21.82), (-3776.85, 3423.13, -23.98)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_27862914")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_27862914", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 29733387 (secondary)
pts = [(-2086.15, -329.71, -7.44), (-2084.16, -332.87, -7.44), (-2081.59, -335.58, -7.44), (-2077.45, -338.34, -7.44), (-2072.75, -339.94, -7.44), (-2067.79, -340.28, -7.44), (-2062.91, -339.35, -7.44), (-2058.43, -337.2, -8.18), (-2054.64, -333.97, -8.18), (-2051.81, -329.87, -8.18), (-2050.11, -325.17, -8.18), (-2049.68, -320.19, -8.18), (-2050.79, -314.56, -8.18), (-2053.51, -309.51, -7.5), (-2057.58, -305.47, -7.5), (-2062.67, -302.82, -6.86), (-2069.22, -301.77, -6.86), (-2075.74, -303.0, -6.86), (-2079.43, -304.86, -6.86), (-2082.63, -307.47, -6.86), (-2085.2, -310.7, -6.86), (-2087.03, -314.4, -7.44), (-2088.03, -318.41, -7.44), (-2088.15, -322.53, -7.44), (-2087.51, -326.22, -7.44), (-2086.15, -329.71, -7.44)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_29733387")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_29733387", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 34137274 (secondary)
pts = [(-2244.78, 99.16, 1.85), (-2242.6, 91.25, 1.85), (-2236.86, 66.81, 4.37)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_34137274")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_34137274", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 34137275 (secondary)
pts = [(-2247.23, 108.92, 1.85), (-2244.78, 99.16, 1.85)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_34137275")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_34137275", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 37948862 (tertiary)
pts = [(1497.71, -2477.43, 19.84), (1502.2, -2477.57, 19.84), (1518.8, -2475.66, 19.81), (1543.02, -2469.94, 24.2), (1552.1, -2467.27, 24.2), (1556.04, -2465.59, 24.2), (1564.76, -2461.87, 16.05), (1576.44, -2454.23, 16.05), (1586.94, -2446.23, 13.73), (1591.41, -2442.46, 13.73), (1600.08, -2435.4, 13.73), (1608.82, -2427.63, 13.73), (1654.87, -2392.16, 14.33), (1707.69, -2364.21, 14.28), (1733.47, -2352.77, 14.28), (1766.35, -2342.81, 14.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_37948862")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_37948862", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 37948863 (tertiary)
pts = [(1468.21, -2450.88, 19.84), (1471.49, -2452.38, 19.84), (1474.68, -2454.6, 19.84), (1478.26, -2458.45, 19.84), (1491.85, -2473.4, 19.84), (1494.53, -2475.91, 19.84), (1497.71, -2477.43, 19.84)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_37948863")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_37948863", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 37949309 (tertiary)
pts = [(3134.53, -1113.02, 9.8), (3139.09, -1242.1, 9.67), (3139.42, -1250.61, 9.67), (3140.79, -1285.53, 9.67), (3148.72, -1511.23, 9.67), (3155.11, -1663.17, 9.67), (3156.66, -1717.2, 9.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_37949309")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_37949309", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 37949312 (tertiary)
pts = [(3128.46, -953.28, 9.8), (3129.76, -986.56, 9.8), (3132.32, -1064.54, 9.8), (3134.53, -1113.02, 9.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_37949312")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_37949312", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241483 (tertiary)
pts = [(-2487.76, -1559.05, -9.3), (-2501.5, -1559.3, -10.85), (-2513.16, -1559.1, -10.85), (-2524.55, -1558.38, -11.44), (-2531.49, -1557.72, -11.44), (-2547.85, -1555.9, -11.44), (-2561.32, -1553.97, -12.54), (-2589.49, -1549.44, -13.22), (-2599.11, -1547.79, -13.22), (-2601.1, -1547.45, -13.22), (-2629.38, -1543.17, -13.5), (-2636.73, -1542.1, -14.04)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241483")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241483", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241498 (tertiary)
pts = [(-2276.15, -1521.82, -9.02), (-2307.88, -1532.34, -9.44), (-2337.56, -1538.63, -9.63), (-2364.91, -1543.47, -7.52), (-2415.71, -1550.8, -6.91), (-2420.57, -1551.57, -6.91), (-2428.58, -1552.66, -6.91), (-2441.21, -1554.39, -6.91), (-2463.42, -1557.1, -9.3), (-2487.76, -1559.05, -9.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241498")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241498", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241518 (tertiary)
pts = [(-375.98, -1209.15, -1.73), (-379.29, -1210.94, -1.73), (-392.74, -1218.21, -1.85), (-413.36, -1224.7, -1.85), (-444.39, -1226.63, -1.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241518")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241518", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241648 (tertiary)
pts = [(-445.15, 197.35, -9.81), (-441.04, 198.99, -9.81), (-436.96, 200.57, -9.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241648")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241648", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241649 (tertiary)
pts = [(-436.96, 200.57, -9.81), (-430.21, 202.37, -9.81), (-401.16, 212.46, -8.97), (-258.93, 262.88, -10.58), (-227.25, 274.87, -9.66), (-211.23, 280.81, -11.06), (-75.83, 330.88, -10.29), (-55.18, 338.39, -11.92), (-20.55, 352.03, -10.43), (125.51, 413.89, -12.32), (154.99, 425.93, -10.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241649")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241649", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 38241674 (tertiary)
pts = [(-597.24, 822.1, -10.3), (-597.31, 822.46, -10.3), (-598.4, 828.38, -11.07), (-611.73, 901.09, -10.72), (-621.93, 951.05, -11.44), (-623.51, 964.19, -11.42), (-623.72, 972.0, -11.42), (-622.11, 979.61, -11.42), (-618.57, 988.63, -11.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_38241674")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_38241674", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 40696602 (tertiary)
pts = [(1192.41, -2553.34, 14.99), (1195.82, -2551.44, 14.99), (1217.82, -2539.15, 14.99), (1239.21, -2523.97, 16.19), (1264.99, -2506.01, 16.19), (1282.6, -2497.26, 15.48), (1341.81, -2481.52, 15.25), (1364.93, -2475.03, 15.42), (1377.93, -2471.68, 15.42), (1412.5, -2462.18, 15.27), (1449.81, -2453.01, 17.21), (1459.92, -2451.22, 17.21), (1464.6, -2450.85, 17.21), (1468.21, -2450.88, 19.84)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_40696602")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_40696602", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 40696603 (tertiary)
pts = [(1904.11, -2307.81, 14.57), (1950.27, -2290.33, 14.49), (2006.05, -2265.15, 14.16), (2068.03, -2246.13, 14.32), (2097.46, -2237.92, 14.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_40696603")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_40696603", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 40870542 (motorway_link)
pts = [(-2329.3, -203.22, -0.93), (-2345.06, -208.05, -0.93), (-2355.69, -210.95, -0.86), (-2373.14, -208.93, -0.86)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_40870542")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_40870542", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 40870543 (secondary)
pts = [(-2339.3, -253.83, -4.75), (-2344.13, -242.58, -5.55), (-2345.4, -240.01, -5.55), (-2357.16, -227.21, -5.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_40870543")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_40870543", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 40870544 (secondary)
pts = [(-2339.3, -253.83, -4.75), (-2326.74, -265.92, -5.04), (-2313.23, -276.65, -5.04), (-2298.33, -288.11, -6.64)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_40870544")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_40870544", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 42833736 (tertiary)
pts = [(-2927.73, -564.04, 0.23), (-2931.45, -558.08, 1.45), (-2933.72, -552.46, 1.45), (-2935.15, -545.62, 1.45), (-2935.19, -534.96, 1.45), (-2932.92, -507.7, 5.66)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_42833736")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_42833736", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 42833738 (tertiary)
pts = [(-2932.92, -507.7, 5.66), (-2928.75, -461.7, 10.75), (-2925.02, -419.12, 8.85), (-2921.49, -379.75, 5.26), (-2920.92, -373.34, 1.64)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_42833738")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_42833738", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 43965250 (tertiary)
pts = [(1575.9, -2595.26, 23.55), (1586.28, -2610.66, 21.23)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_43965250")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_43965250", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 45991296 (tertiary)
pts = [(696.13, 3034.37, -11.81), (705.44, 3032.69, -14.57), (709.03, 3032.05, -14.57), (759.46, 3025.69, -15.22), (791.82, 3023.46, -15.39), (830.95, 3023.16, -15.6), (875.46, 3024.55, -15.9), (960.27, 3028.63, -16.2), (1013.52, 3031.35, -17.29), (1042.19, 3031.54, -17.29), (1080.27, 3030.75, -17.35), (1126.67, 3028.11, -13.78)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_45991296")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_45991296", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 45991299 (tertiary)
pts = [(76.89, 3087.65, -12.18), (92.56, 3091.97, -12.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_45991299")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_45991299", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 55971342 (tertiary)
pts = [(-4765.4, 105.95, -5.51), (-4680.08, 121.78, -5.22), (-4664.85, 124.5, -5.22), (-4465.99, 159.46, -5.47)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_55971342")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_55971342", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 67378839 (secondary)
pts = [(-2357.16, -227.21, -5.67), (-2364.95, -232.63, -5.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_67378839")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_67378839", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69113725 (tertiary)
pts = [(491.86, 592.28, -13.34), (452.2, 709.44, -12.72), (414.11, 810.91, -11.25)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69113725")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69113725", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69895540 (tertiary)
pts = [(1766.35, -2342.81, 14.75), (1849.25, -2325.58, 14.67), (1904.11, -2307.81, 14.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69895540")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69895540", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69896463 (tertiary)
pts = [(3159.39, -1895.85, 9.67), (3158.73, -1911.36, 9.67), (3158.45, -1968.86, 9.67), (3161.1, -2013.17, 9.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69896463")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69896463", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69896808 (tertiary)
pts = [(3129.29, -414.43, 12.59), (3123.9, -467.76, 11.09), (3119.81, -523.97, 13.2), (3119.5, -530.31, 11.61), (3117.13, -603.32, 10.37), (3117.4, -645.17, 9.83), (3118.34, -685.36, 10.35), (3120.97, -758.26, 9.8), (3128.46, -953.28, 9.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69896808")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69896808", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69896950 (tertiary)
pts = [(2570.67, -503.84, 14.94), (2314.63, -493.99, 13.51), (2280.14, -492.41, 13.77), (2242.44, -491.44, 14.36), (2202.95, -489.34, 13.91), (2117.24, -484.12, 13.01)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69896950")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69896950", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69896951 (tertiary)
pts = [(3129.29, -414.43, 12.59), (3125.99, -414.9, 12.59), (2899.93, -438.29, 12.05), (2843.36, -450.02, 13.63), (2591.02, -501.23, 14.94), (2570.67, -503.84, 14.94)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69896951")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69896951", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69897809 (tertiary)
pts = [(2648.76, 927.95, -6.24), (2659.92, 909.57, -5.73), (2681.09, 877.73, -5.12), (2684.13, 873.15, -5.12)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69897809")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69897809", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69897810 (tertiary)
pts = [(2629.89, 994.54, -8.15), (2637.52, 965.87, -5.42), (2643.32, 942.97, -6.24), (2648.76, 927.95, -6.24)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69897810")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69897810", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69901653 (secondary)
pts = [(-2861.84, 3004.85, -21.34), (-2861.7, 3001.02, -21.34), (-2860.36, 2988.0, -23.47), (-2856.4, 2941.79, -23.99), (-2854.5, 2920.84, -23.03), (-2853.07, 2901.53, -23.03), (-2851.85, 2884.06, -22.63), (-2851.85, 2877.94, -22.63), (-2852.32, 2871.96, -22.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69901653")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69901653", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69901734 (secondary)
pts = [(-3292.4, 3105.2, -18.13), (-3188.33, 3114.7, -21.45), (-3171.0, 3115.22, -21.45), (-3154.98, 3114.38, -21.45), (-3145.57, 3112.91, -22.57), (-3134.59, 3111.15, -22.57), (-3096.25, 3101.21, -22.76), (-3091.92, 3100.03, -21.3), (-3027.84, 3083.1, -23.58), (-3003.73, 3077.0, -23.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69901734")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69901734", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69969395 (secondary)
pts = [(-5229.75, 2439.98, -17.62), (-5123.4, 2514.61, -14.42), (-5015.38, 2590.34, -21.09), (-4888.59, 2679.9, -11.19), (-4825.45, 2726.28, -6.65), (-4794.12, 2750.67, -19.56), (-4763.15, 2777.84, -22.42), (-4641.26, 2879.04, -24.6), (-4628.88, 2891.23, -24.6), (-4597.75, 2918.85, -24.49), (-4508.01, 2995.2, -25.59), (-4462.4, 3024.34, -25.25), (-4452.64, 3030.59, -25.25), (-4414.32, 3050.93, -25.25), (-4375.59, 3063.93, -25.38), (-4349.25, 3071.38, -25.38), (-4308.26, 3081.37, -25.38), (-4238.23, 3092.27, -25.38), (-4090.22, 3111.39, -25.38), (-3950.97, 3131.91, -25.37), (-3920.63, 3132.97, -25.09), (-3888.88, 3131.11, -25.18), (-3773.92, 3116.36, -23.98), (-3672.6, 3106.21, -21.82)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69969395")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69969395", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 69969539 (tertiary)
pts = [(-5175.91, 1136.33, -15.53), (-5113.04, 1093.39, -14.9), (-5037.58, 1044.31, -16.31), (-5029.27, 1037.99, -16.09), (-5021.97, 1029.82, -16.09), (-5020.13, 1025.81, -16.09), (-5019.32, 1021.65, -16.09), (-5018.88, 1016.57, -16.09), (-5019.64, 1011.43, -15.1), (-5028.85, 985.87, -15.1), (-5042.22, 953.36, -15.07), (-5044.54, 945.1, -14.53), (-5046.29, 937.41, -14.53), (-5047.99, 924.21, -14.53), (-5048.77, 911.63, -14.4), (-5050.01, 847.1, -14.1), (-5048.87, 827.79, -13.71), (-5046.48, 810.53, -13.71), (-5040.61, 779.38, -12.99), (-5039.23, 767.8, -12.99), (-5038.67, 757.04, -12.66), (-5038.16, 730.65, -12.13), (-5038.6, 718.57, -12.13), (-5040.15, 706.83, -12.13), (-5049.0, 671.17, -9.98), (-5052.78, 657.17, -9.98), (-5054.67, 642.65, -8.63), (-5055.0, 628.43, -8.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_69969539")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_69969539", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 82105961 (motorway)
pts = [(-1382.59, 317.41, -10.71), (-1446.64, 296.21, -10.47), (-1525.48, 270.57, -9.69), (-1636.07, 233.55, -11.02), (-1671.09, 221.78, -11.34), (-1683.26, 217.68, -11.34), (-1719.43, 205.52, -11.12)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_82105961")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_82105961", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 82551479 (secondary)
pts = [(-2329.3, -203.22, -4.43), (-2334.97, -208.51, -4.43), (-2337.28, -210.46, -4.43), (-2347.74, -219.15, -4.36), (-2357.16, -227.21, -5.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_82551479")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_82551479", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 98335942 (tertiary)
pts = [(3971.25, -201.21, 10.13), (3935.21, -217.82, 11.19), (3913.41, -227.39, 13.18), (3907.37, -229.47, 13.18), (3901.34, -230.79, 13.18), (3839.03, -236.52, 12.54), (3823.22, -237.89, 11.59), (3801.54, -239.76, 13.3), (3775.74, -243.22, 13.3), (3718.06, -259.77, 11.04)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_98335942")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_98335942", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 98335948 (tertiary)
pts = [(3718.06, -259.77, 11.04), (3626.49, -285.61, 11.53), (3600.63, -294.59, 11.53), (3575.88, -306.12, 15.47), (3514.2, -344.21, 12.13), (3461.7, -375.69, 11.47), (3413.1, -403.83, 11.09), (3398.63, -410.46, 10.52), (3383.37, -414.18, 10.52), (3371.11, -416.01, 10.52), (3262.6, -412.94, 10.99), (3194.21, -413.02, 9.98), (3133.09, -414.14, 12.59), (3129.29, -414.43, 12.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_98335948")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_98335948", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 101496464 (motorway)
pts = [(245.12, 851.06, -13.86), (82.17, 800.56, -13.52), (34.59, 785.07, -13.07), (-131.68, 730.97, -12.2), (-375.61, 650.28, -10.91), (-500.47, 608.9, -7.2), (-906.95, 474.22, -6.85), (-1059.65, 423.62, -4.47)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_101496464")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_101496464", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 102150740 (motorway)
pts = [(524.91, 915.07, -13.32), (999.45, 1046.51, -13.38), (1181.22, 1096.87, -13.32), (1369.47, 1148.29, -14.99), (1466.57, 1175.37, -13.03), (1647.66, 1224.83, -13.38), (1812.85, 1270.83, -13.72), (1898.11, 1294.74, -14.69), (1974.51, 1314.17, -13.39), (2062.14, 1335.4, -12.79), (2153.18, 1355.39, -13.7), (2236.37, 1372.94, -12.84), (2325.95, 1389.69, -13.66), (2407.78, 1403.5, -13.27), (2538.81, 1422.65, -9.62), (2635.06, 1433.96, -12.91), (2745.62, 1444.71, -12.08), (2880.21, 1456.07, -11.49), (2972.29, 1463.75, -7.85), (2987.38, 1465.01, -7.85), (3198.93, 1482.69, -3.26), (3366.21, 1496.59, 1.71)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 108038267 (motorway)
pts = [(481.16, 918.95, -13.47), (362.9, 885.85, -12.92), (245.12, 851.06, -13.86)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_108038267")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_108038267", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 108205657 (secondary)
pts = [(-2896.71, 3068.9, -22.05), (-2883.87, 3067.44, -22.05), (-2872.61, 3066.95, -22.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_108205657")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_108205657", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 112665903 (tertiary)
pts = [(1805.71, 2048.15, -4.77), (1799.51, 2048.35, -4.77)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_112665903")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_112665903", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 112665909 (tertiary)
pts = [(1799.51, 2048.35, -12.27), (1769.89, 2048.64, -15.01), (1760.08, 2048.36, -15.01), (1751.94, 2047.3, -14.74), (1744.87, 2045.27, -14.74), (1739.04, 2042.68, -14.74), (1725.17, 2035.08, -14.68), (1699.5, 2016.83, -14.85), (1688.41, 2010.41, -15.15), (1678.48, 2005.96, -15.79), (1666.08, 2002.33, -15.79), (1655.07, 1999.5, -13.51), (1635.45, 1994.35, -15.04), (1599.99, 1984.64, -14.23), (1584.62, 1979.16, -14.23), (1571.85, 1973.27, -14.08), (1481.68, 1929.5, -14.47), (1436.49, 1908.77, -15.28), (1427.63, 1905.37, -12.22), (1419.9, 1903.24, -12.22), (1410.75, 1901.65, -12.22), (1402.61, 1901.34, -13.22), (1395.06, 1901.88, -13.22), (1361.63, 1908.87, -17.23), (1335.89, 1913.03, -16.98), (1314.5, 1915.33, -16.61), (1286.66, 1917.6, -16.12), (1267.72, 1918.55, -16.53), (1248.06, 1917.39, -16.53), (1230.16, 1914.0, -14.98), (1215.73, 1908.56, -13.7), (1200.99, 1901.43, -13.7), (1146.88, 1873.34, -17.09)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_112665909")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_112665909", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 112665912 (tertiary)
pts = [(2358.52, 2433.55, -7.85), (2357.64, 2420.8, -7.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_112665912")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_112665912", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 112665915 (tertiary)
pts = [(2357.64, 2420.8, -15.07), (2357.91, 2409.78, -15.07), (2359.43, 2394.12, -14.86), (2362.08, 2380.87, -14.86), (2369.31, 2354.25, -15.56), (2385.2, 2298.3, -15.17), (2394.08, 2262.93, -15.75), (2396.41, 2251.28, -15.75), (2399.16, 2233.42, -15.92), (2408.68, 2149.39, -15.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_112665915")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_112665915", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 123645546 (motorway)
pts = [(-1270.96, 337.87, -8.96), (-1103.41, 393.48, -4.68)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_123645546")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_123645546", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 123645548 (motorway)
pts = [(-1275.65, 352.72, -1.46), (-1299.35, 344.87, -2.12)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_123645548")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_123645548", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271647 (secondary)
pts = [(-2892.68, -573.95, -9.55), (-2859.26, -536.4, -9.24), (-2848.89, -527.79, -8.66), (-2838.54, -519.19, -8.43), (-2813.8, -502.12, -8.43), (-2744.65, -461.07, -8.62)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271647")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271647", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271655 (tertiary)
pts = [(-4058.4, 325.71, -7.56), (-4005.61, 348.24, -7.32)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271655")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271655", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271659 (tertiary)
pts = [(-3755.33, 417.72, -1.57), (-3722.67, 418.18, -5.2), (-3685.56, 417.09, -5.17)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271659")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271659", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271660 (tertiary)
pts = [(-3685.56, 417.09, -5.17), (-3659.2, 416.46, -2.77), (-3636.25, 415.42, -3.72)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271660")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271660", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271661 (tertiary)
pts = [(-4437.58, 165.31, -5.47), (-4422.83, 168.99, -5.47), (-4401.47, 175.22, -5.47), (-4384.73, 181.86, -4.79), (-4348.75, 201.2, -4.79), (-4261.08, 258.3, -8.3), (-4234.76, 273.75, -7.28), (-4215.14, 283.18, -7.28), (-4199.74, 289.19, -7.28), (-4184.67, 293.69, -7.28), (-4166.21, 298.56, -7.28), (-4115.91, 307.84, -7.56), (-4093.27, 313.71, -7.56), (-4074.74, 319.74, -7.56), (-4058.4, 325.71, -7.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271661")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271661", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271662 (tertiary)
pts = [(-4005.61, 348.24, -7.32), (-3927.28, 381.97, -4.35), (-3907.42, 389.29, -4.35), (-3885.57, 396.32, -6.08), (-3855.96, 404.24, -5.7), (-3835.87, 408.47, -4.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271662")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271662", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271663 (tertiary)
pts = [(-3636.25, 415.42, -3.72), (-3580.22, 413.11, -6.61), (-3509.72, 409.89, -7.03), (-3419.03, 406.22, -4.62), (-3385.36, 404.91, -4.62), (-3353.53, 401.34, -3.52), (-3341.12, 399.51, -3.52), (-3328.09, 396.89, -3.52), (-3310.0, 391.95, 2.33), (-3291.41, 385.61, 0.77), (-3274.73, 379.09, 0.77), (-3262.44, 373.52, -1.74), (-3243.1, 363.74, -2.92)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271663")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271663", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271688 (tertiary)
pts = [(-1108.1, -351.76, -10.76), (-1106.93, -313.22, -12.2)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271688")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271688", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271693 (tertiary)
pts = [(1146.88, 1873.34, -17.09), (1123.33, 1857.44, -17.09), (1103.2, 1842.01, -15.6), (1033.25, 1786.96, -16.1), (964.7, 1733.97, -14.07), (923.62, 1705.15, -13.91), (873.45, 1673.82, -14.43), (837.0, 1655.56, -10.1), (781.77, 1632.41, -13.3), (776.11, 1631.33, -12.69), (769.83, 1630.98, -12.69), (613.55, 1680.08, -11.94), (601.36, 1682.54, -8.79), (590.73, 1684.35, -8.79), (493.59, 1697.3, -11.43), (398.34, 1712.38, -10.68), (318.51, 1727.08, -11.14), (295.31, 1730.09, -11.19), (268.96, 1731.06, -11.19), (207.37, 1732.81, -10.51), (176.11, 1731.69, -10.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271693")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271693", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271694 (tertiary)
pts = [(218.77, 1404.34, -12.44), (176.19, 1725.24, -10.57), (176.11, 1731.69, -10.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271694")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271694", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 125271699 (tertiary)
pts = [(2432.65, 2985.84, -12.74), (2431.51, 2978.56, -12.74), (2429.91, 2971.27, -12.74), (2422.02, 2945.13, -13.02), (2413.1, 2917.23, -13.59), (2403.42, 2887.74, -14.11), (2396.54, 2867.9, -14.11), (2391.74, 2856.38, -13.79), (2385.16, 2845.16, -14.29), (2377.63, 2834.75, -14.44), (2369.29, 2824.27, -14.44), (2366.91, 2820.01, -14.88), (2364.66, 2813.69, -14.88), (2362.61, 2801.01, -15.36), (2363.05, 2736.34, -15.29), (2364.62, 2603.76, -15.42), (2365.21, 2550.09, -15.16), (2365.86, 2507.58, -15.26), (2365.55, 2495.13, -15.57), (2363.75, 2474.29, -15.57), (2361.69, 2458.23, -15.35), (2358.52, 2433.55, -15.35)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_125271699")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_125271699", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 130897499 (tertiary)
pts = [(1195.58, 762.76, -11.7), (1253.29, 751.52, -11.2), (1298.28, 735.66, -12.65), (1316.62, 729.19, -11.58), (1341.26, 720.4, -11.73), (1368.64, 706.02, -12.11), (1410.63, 679.31, -11.67), (1438.0, 660.66, -10.8), (1479.3, 630.89, -9.61), (1527.96, 607.38, -9.44), (1568.25, 595.52, -9.26)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_130897499")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_130897499", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 130987118 (secondary)
pts = [(1910.88, 484.6, -3.28), (1913.52, 479.84, -3.28), (1917.51, 476.11, -3.28), (1922.46, 473.82, -3.28), (1927.89, 473.19, -3.28), (1933.23, 474.27, -2.53), (1937.98, 476.96, -2.53), (1941.65, 480.99, -2.53), (1943.9, 485.97, -2.53), (1944.47, 491.39, -4.31), (1943.34, 496.73, -4.31), (1940.43, 501.65, -4.31), (1936.08, 505.36, -4.31), (1930.75, 507.47, -4.31), (1925.03, 507.7, -4.85), (1919.55, 506.07, -4.85), (1914.89, 502.73, -4.85), (1911.26, 497.35, -4.85), (1909.85, 491.02, -4.85), (1910.88, 484.6, -3.28)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 130987119 (secondary)
pts = [(1901.3, 481.1, -4.14), (1838.29, 456.78, 0.24), (1725.58, 413.25, -5.86), (1693.01, 400.67, -5.41)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 131380638 (tertiary)
pts = [(-587.17, 1605.29, -11.73), (-584.78, 1612.89, -11.73), (-582.71, 1622.58, -11.73), (-581.81, 1631.09, -12.97), (-581.5, 1642.85, -12.97), (-583.65, 1683.67, -12.62), (-585.56, 1708.61, -13.44), (-591.57, 1782.13, -11.09), (-591.81, 1793.83, -7.63), (-591.49, 1801.85, -7.63), (-590.69, 1809.4, -7.63), (-588.68, 1824.77, -11.77), (-586.14, 1839.6, -11.77), (-583.08, 1853.69, -12.16), (-581.04, 1862.41, -12.16), (-578.18, 1871.64, -12.16), (-575.36, 1880.37, -13.59), (-571.89, 1888.86, -13.59), (-568.34, 1895.37, -13.59), (-564.18, 1901.83, -13.59), (-548.91, 1924.47, -13.77), (-545.87, 1930.22, -13.77), (-543.31, 1936.01, -11.48), (-541.59, 1942.09, -11.84), (-540.46, 1948.34, -11.84), (-539.98, 1954.66, -11.84), (-539.96, 1960.9, -11.84), (-540.35, 1966.63, -11.84), (-541.18, 1972.29, -11.1), (-542.69, 1977.59, -11.1), (-544.69, 1982.42, -7.84), (-547.48, 1987.95, -7.84), (-555.62, 2000.62, -7.84), (-630.08, 2114.01, -11.93), (-632.53, 2118.37, -11.93), (-635.31, 2123.32, -11.93), (-643.46, 2137.22, -10.64), (-684.8, 2213.63, -12.68), (-729.32, 2298.9, -11.66), (-733.29, 2309.13, -11.66), (-736.65, 2319.23, -11.44), (-739.44, 2328.01, -11.44), (-799.15, 2516.16, -10.45), (-837.07, 2646.41, -9.82), (-844.83, 2676.64, -11.14)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_131380638")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_131380638", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 131412075 (tertiary)
pts = [(-526.22, -1254.24, -4.56), (-538.02, -1265.91, -4.56), (-548.61, -1278.44, -3.09), (-557.23, -1288.06, -3.09), (-582.97, -1318.19, -3.53), (-586.32, -1322.07, -3.53), (-593.38, -1330.46, -3.53), (-601.45, -1340.08, -3.53), (-605.29, -1346.0, -3.5), (-607.28, -1349.38, -3.5), (-608.84, -1353.73, -3.5), (-611.2, -1365.06, -3.5), (-613.21, -1372.6, -3.5), (-616.32, -1377.81, -3.5)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_131412075")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_131412075", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 131425405 (tertiary)
pts = [(1907.94, 510.84, -4.99), (1889.93, 528.3, -6.01), (1869.12, 545.43, -6.03), (1831.86, 568.63, -7.88), (1810.93, 579.26, -7.55), (1787.65, 587.49, -9.03), (1760.07, 593.23, -9.03), (1731.33, 595.78, -9.31), (1679.02, 593.52, -9.4), (1641.87, 590.91, -9.19), (1625.18, 590.26, -9.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_131425405")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_131425405", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 137055580 (tertiary)
pts = [(3238.54, -2066.84, 9.0), (3249.59, -2068.67, 9.0), (3262.52, -2071.79, 8.05), (3290.84, -2081.04, 7.87), (3302.51, -2083.73, 7.87), (3316.0, -2085.17, 8.09), (3346.7, -2084.5, 8.37), (3364.8, -2083.95, 8.37), (3397.43, -2082.41, 8.33), (3447.09, -2077.76, 10.5), (3464.62, -2076.97, 8.51), (3483.54, -2078.06, 7.95), (3513.52, -2081.35, 7.95), (3563.41, -2088.66, 6.2), (3598.45, -2092.32, 5.33), (3638.76, -2092.68, 5.49), (3664.08, -2090.11, 5.66), (3733.63, -2074.24, 5.02), (3859.22, -2046.9, 5.14), (3888.81, -2040.35, 4.87), (3923.36, -2032.86, 4.66), (3950.41, -2026.31, 4.21), (3964.87, -2022.26, 4.21), (3979.5, -2017.0, 4.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_137055580")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137055580", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 137055581 (tertiary)
pts = [(2755.75, -2223.31, 10.56), (2763.4, -2218.02, 10.56), (2797.99, -2197.1, 10.36), (2809.61, -2191.4, 10.36), (2819.2, -2188.49, 10.36), (2854.06, -2181.19, 10.22), (2866.67, -2177.77, 10.22), (2879.08, -2172.85, 10.22), (2888.21, -2167.32, 9.87), (2901.56, -2156.9, 9.87), (2916.37, -2144.71, 10.01)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_137055581")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137055581", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 137056718 (tertiary)
pts = [(2117.24, -484.12, 13.01), (2071.33, -481.02, 17.44), (2044.67, -477.9, 17.44), (1983.55, -466.88, 15.75), (1956.09, -463.16, 15.74), (1937.22, -461.09, 15.74), (1928.51, -461.07, 15.74)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_137056718")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137056718", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 137056721 (secondary)
pts = [(2371.81, 662.46, -3.27), (2332.99, 646.93, -3.65), (2312.16, 638.6, -0.41), (2235.33, 608.88, -1.63), (2180.32, 587.95, -2.65), (2115.2, 563.05, -4.31), (1951.57, 499.96, -4.31), (1943.34, 496.73, -4.31)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 137056722 (secondary)
pts = [(3082.89, 1269.26, -4.68), (3047.87, 1241.64, -5.61), (3006.08, 1208.69, -5.13), (2967.29, 1174.97, -4.93), (2921.2, 1132.09, -3.51), (2852.97, 1062.66, -4.92), (2830.05, 1037.27, -6.26)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 137057839 (tertiary)
pts = [(2566.95, 4310.75, -9.95), (2560.58, 4306.97, -10.66), (2555.55, 4302.52, -10.66), (2550.53, 4296.17, -10.66), (2544.72, 4287.23, -10.66), (2542.75, 4283.2, -10.66), (2541.14, 4277.8, -11.03), (2536.43, 4262.02, -11.03), (2527.67, 4230.07, -11.03), (2523.74, 4212.07, -11.03), (2520.26, 4187.36, -11.03), (2517.68, 4147.91, -11.03), (2517.52, 4117.02, -11.03), (2520.42, 4001.31, -11.03), (2521.81, 3940.2, -11.03), (2524.62, 3799.75, -11.03), (2528.49, 3659.66, -11.03)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_137057839")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_137057839", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 140222983 (primary)
pts = [(4119.98, 3762.28, -6.47), (4115.17, 3784.69, -6.47), (4111.87, 3796.08, -6.85)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_140222983")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_140222983", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 140222989 (primary)
pts = [(4129.2, 3685.8, -6.47), (4128.8, 3692.9, -6.47), (4127.83, 3705.28, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_140222989")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_140222989", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 140224014 (secondary)
pts = [(-2918.93, 2781.73, -19.4), (-2922.37, 2779.95, -22.82), (-2929.22, 2776.06, -22.82), (-2943.72, 2767.18, -18.01)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_140224014")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_140224014", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 146513893 (motorway_link)
pts = [(4188.89, 1662.27, 15.8), (4182.96, 1655.42, 20.05), (4178.63, 1647.2, 20.05), (4170.05, 1627.31, 17.74), (4164.5, 1615.63, 17.74), (4155.37, 1604.32, 17.74), (4146.17, 1594.95, 15.18), (4130.57, 1587.69, 15.18), (4111.41, 1575.29, 14.72)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_146513893")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_146513893", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 147579767 (secondary)
pts = [(-1213.71, -401.03, -5.5), (-1266.23, -388.98, -4.73), (-1296.15, -379.62, -6.88), (-1323.76, -369.87, -3.25), (-1377.44, -348.04, -9.03)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_147579767")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_147579767", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 147579768 (secondary)
pts = [(-2015.05, -333.0, -6.52), (-2044.19, -323.67, -8.18), (-2049.68, -320.19, -8.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_147579768")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_147579768", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 147579769 (secondary)
pts = [(-982.91, -410.3, -7.45), (-997.32, -406.39, -9.75), (-1013.64, -404.32, -11.15), (-1031.85, -403.87, -11.8), (-1051.53, -405.0, -11.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_147579769")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_147579769", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 157831249 (tertiary)
pts = [(280.07, 1150.52, -14.68), (272.28, 1173.42, -14.01), (267.52, 1187.44, -14.01), (263.21, 1199.07, -13.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_157831249")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_157831249", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 157831250 (tertiary)
pts = [(409.12, 824.66, -5.5), (373.3, 914.49, -3.69)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_157831250")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_157831250", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 157831251 (tertiary)
pts = [(373.3, 914.49, -11.19), (341.01, 995.32, -12.39), (312.73, 1065.59, -14.22)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_157831251")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_157831251", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 157852147 (tertiary)
pts = [(238.62, 1257.81, -13.67), (236.43, 1269.83, -13.67), (235.1, 1293.97, -12.89)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_157852147")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_157852147", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 157852150 (tertiary)
pts = [(176.11, 1731.69, -10.57), (165.93, 1728.98, -10.57), (149.81, 1721.58, -10.45), (-22.7, 1628.31, -10.87), (-42.41, 1618.41, -10.82), (-59.19, 1611.32, -10.96), (-86.6, 1602.86, -10.49), (-129.56, 1590.92, -9.36), (-168.5, 1584.12, -10.33), (-180.56, 1582.91, -10.33), (-190.42, 1582.42, -10.33), (-200.91, 1583.0, -9.35), (-210.9, 1585.07, -9.35), (-235.64, 1590.33, -9.9), (-248.58, 1592.55, -9.9), (-261.21, 1593.74, -10.46), (-276.75, 1594.04, -10.06), (-288.77, 1594.36, -10.06), (-297.85, 1594.17, -10.06), (-310.44, 1592.7, -10.06), (-380.55, 1575.96, -10.94), (-395.74, 1573.3, -11.87), (-407.52, 1572.21, -11.87), (-414.81, 1572.87, -11.87), (-482.76, 1584.48, -12.54), (-560.08, 1596.78, -10.61), (-567.21, 1598.33, -11.66), (-572.64, 1599.65, -11.66), (-576.27, 1601.06, -11.73), (-587.17, 1605.29, -11.73)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_157852150")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_157852150", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 160950932 (tertiary)
pts = [(-1679.74, 3198.29, -18.92), (-1672.08, 3173.47, -18.92), (-1667.37, 3161.34, -18.92), (-1665.24, 3157.02, -18.92), (-1662.29, 3152.5, -18.92), (-1659.12, 3148.07, -18.92), (-1656.24, 3144.53, -18.23), (-1645.37, 3131.36, -18.23), (-1638.21, 3122.62, -18.23), (-1628.15, 3110.35, -17.9), (-1618.33, 3098.22, -17.9), (-1609.53, 3087.39, -17.9), (-1590.08, 3063.9, -18.28), (-1569.06, 3038.1, -17.57), (-1541.42, 3004.18, -17.04), (-1539.62, 3001.97, -16.99), (-1532.0, 2992.86, -16.99), (-1506.56, 2961.28, -16.52), (-1399.71, 2830.4, -12.75), (-1394.94, 2825.99, -12.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_160950932")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_160950932", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 160950937 (secondary)
pts = [(-1987.41, 3758.64, -20.81), (-1994.09, 3748.91, -20.81), (-2009.02, 3726.18, -20.23), (-2010.99, 3723.28, -20.23), (-2013.61, 3719.18, -20.23), (-2034.11, 3688.59, -20.23), (-2048.42, 3668.09, -19.28), (-2061.28, 3651.63, -19.34), (-2077.77, 3629.63, -19.34), (-2085.45, 3619.29, -19.34), (-2092.83, 3608.72, -19.34), (-2098.55, 3598.49, -19.68), (-2107.49, 3580.19, -19.68), (-2113.92, 3563.25, -19.68), (-2116.94, 3550.12, -21.6), (-2118.63, 3540.77, -21.6), (-2120.4, 3532.81, -21.6), (-2122.39, 3525.29, -21.6), (-2126.08, 3515.3, -21.6), (-2130.31, 3505.92, -21.6), (-2136.41, 3494.0, -21.6), (-2140.32, 3487.06, -21.6), (-2143.69, 3481.32, -21.6), (-2147.98, 3474.02, -21.6)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_160950937")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_160950937", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 160950938 (secondary)
pts = [(-2394.84, 3333.16, -21.91), (-2397.38, 3332.22, -21.91), (-2399.86, 3331.06, -21.91), (-2420.94, 3320.09, -21.83), (-2428.51, 3315.9, -21.83), (-2438.9, 3308.89, -21.83), (-2454.19, 3297.79, -21.53), (-2479.33, 3280.37, -21.46), (-2490.63, 3273.08, -21.46), (-2497.85, 3269.04, -21.46), (-2550.41, 3238.13, -24.33)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_160950938")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_160950938", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 160951653 (secondary)
pts = [(-3382.57, 2480.83, -11.06), (-3426.44, 2450.48, -10.35)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_160951653")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_160951653", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 160951656 (secondary)
pts = [(-3610.5, 2279.57, -14.76), (-3623.28, 2254.75, -9.02), (-3638.29, 2219.25, -13.58), (-3652.37, 2185.12, -15.33), (-3659.37, 2168.57, -15.33), (-3666.79, 2152.43, -18.83), (-3677.14, 2132.5, -21.03), (-3682.11, 2123.98, -21.66), (-3685.73, 2118.66, -21.66), (-3693.46, 2107.23, -21.66), (-3700.67, 2097.56, -21.66), (-3708.42, 2087.9, -19.64), (-3719.07, 2076.04, -19.64), (-3730.19, 2064.57, -22.03), (-3752.24, 2045.38, -20.58), (-3760.54, 2038.62, -20.58), (-3763.99, 2036.23, -20.58), (-3769.19, 2032.21, -22.24), (-3779.0, 2025.98, -18.64), (-3790.07, 2019.63, -20.87), (-3797.73, 2015.32, -20.87), (-3814.83, 2007.03, -20.87), (-3829.77, 2000.98, -17.24), (-3841.47, 1996.47, -17.24), (-3857.31, 1991.59, -18.4), (-3881.29, 1985.45, -18.67), (-3952.11, 1970.08, -16.31), (-4008.2, 1957.62, -19.48), (-4059.92, 1946.76, -19.16), (-4078.24, 1941.53, -19.16), (-4109.39, 1927.5, -17.12), (-4148.46, 1903.44, -19.79), (-4211.27, 1864.88, -20.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_160951656")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_160951656", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 181281785 (secondary)
pts = [(511.01, -2053.4, 11.22), (478.12, -2101.23, 10.83), (447.76, -2149.57, 10.91), (423.7, -2192.91, 11.22), (400.17, -2239.45, 10.72), (386.4, -2271.04, 10.72), (374.58, -2300.94, 10.64), (361.8, -2337.75, 10.64), (351.81, -2371.66, 10.15), (351.12, -2374.01, 10.15), (341.45, -2412.04, 10.15), (332.51, -2453.83, 10.15), (325.5, -2499.58, 10.15), (320.6, -2546.76, 10.15), (318.22, -2592.57, 10.15), (318.59, -2642.24, 10.15), (321.4, -2692.7, 10.15), (324.69, -2741.92, 10.15), (324.95, -2744.92, 10.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_181281785")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_181281785", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 183477560 (tertiary)
pts = [(-58.8, 3365.58, -11.45), (-55.32, 3341.18, -11.45), (-54.84, 3338.0, -11.45), (-54.09, 3332.96, -11.45), (-47.57, 3290.24, -11.45), (-45.95, 3278.23, -11.38), (-41.5, 3250.44, -11.38), (-37.61, 3229.94, -11.38), (-22.72, 3168.48, -12.66)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_183477560")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_183477560", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 183477563 (tertiary)
pts = [(2.29, 3070.42, -12.66), (12.86, 3071.89, -11.5), (25.15, 3075.48, -11.5), (50.91, 3081.03, -11.17)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_183477563")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_183477563", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 186513187 (motorway_link)
pts = [(-2236.86, 66.81, 7.87), (-2233.99, 83.26, 7.87), (-2229.55, 96.27, 3.57), (-2223.13, 105.96, 3.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_186513187")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_186513187", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 198310506 (secondary)
pts = [(-2857.94, 3084.3, -23.88), (-2861.29, 3085.51, -23.88), (-2864.84, 3085.66, -22.05), (-2868.28, 3084.71, -22.05), (-2871.26, 3082.77, -22.05), (-2873.52, 3080.01, -22.05), (-2874.83, 3076.7, -22.05), (-2875.08, 3073.28, -22.05), (-2874.32, 3069.93, -22.05), (-2872.61, 3066.95, -22.05), (-2870.44, 3064.84, -22.05), (-2867.79, 3063.37, -22.05), (-2864.5, 3062.6, -22.05), (-2861.12, 3062.81, -23.88), (-2857.95, 3063.97, -23.88), (-2855.62, 3065.66, -23.88), (-2853.77, 3067.89, -23.88), (-2852.24, 3071.45, -23.88), (-2851.99, 3075.32, -23.88), (-2852.95, 3078.91, -23.88), (-2855.01, 3082.01, -23.88), (-2857.94, 3084.3, -23.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_198310506")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_198310506", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 198310508 (secondary)
pts = [(-2862.66, 3035.7, -21.69), (-2862.39, 3017.18, -21.34), (-2861.84, 3004.85, -21.34)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_198310508")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_198310508", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 205606351 (primary)
pts = [(4111.87, 3796.08, -6.85), (4107.95, 3809.62, -6.85), (4081.64, 3892.46, -7.09)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_205606351")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_205606351", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 205606353 (primary)
pts = [(4127.83, 3705.28, -6.47), (4123.9, 3737.49, -6.47), (4119.98, 3762.28, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_205606353")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_205606353", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 205606357 (primary)
pts = [(4130.11, 3679.19, -6.47), (4129.2, 3685.8, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_205606357")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_205606357", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 205622061 (primary)
pts = [(4142.24, 3568.71, -6.47), (4132.34, 3661.63, -6.47), (4130.11, 3679.19, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_205622061")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_205622061", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 214169373 (primary)
pts = [(4143.51, 3557.86, -6.47), (4142.24, 3568.71, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_214169373")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_214169373", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 219437106 (secondary)
pts = [(-3566.49, 3094.35, -18.7), (-3538.98, 3092.86, -21.42), (-3523.77, 3092.63, -21.94), (-3522.06, 3092.58, -21.94), (-3452.48, 3092.56, -21.16)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_219437106")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_219437106", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 219437116 (tertiary)
pts = [(2426.04, 2085.28, -14.63), (2441.25, 2051.63, -14.27), (2455.43, 2018.13, -15.05), (2462.37, 1997.81, -14.61), (2482.97, 1920.98, -14.74)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_219437116")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_219437116", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 219437117 (tertiary)
pts = [(2482.97, 1920.98, -14.74), (2501.73, 1842.96, -14.53), (2511.27, 1794.37, -14.38), (2517.25, 1762.37, -14.22), (2520.12, 1731.87, -13.76), (2520.74, 1705.42, -13.68), (2519.94, 1684.88, -13.58)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_219437117")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_219437117", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 220908466 (secondary)
pts = [(805.61, -805.56, 12.84), (793.07, -814.72, 12.84), (774.93, -826.16, 12.62), (749.55, -840.74, 12.57), (730.08, -850.98, 12.57), (708.27, -860.89, 12.29), (682.57, -871.44, 11.96), (660.0, -879.02, 11.87), (621.53, -890.74, 11.49), (585.75, -899.45, 11.79), (518.92, -911.7, 11.22), (445.55, -921.98, 10.91), (390.75, -932.1, 10.72), (352.17, -941.22, 10.15), (308.98, -954.8, 9.33), (272.0, -968.7, 8.69), (176.25, -1010.66, 10.49), (152.08, -1021.01, 10.49)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_220908466")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_220908466", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 223604535 (secondary)
pts = [(-3156.39, 2635.28, -18.3), (-3211.78, 2600.19, -17.3), (-3251.63, 2573.91, -14.68), (-3288.09, 2549.14, -15.94), (-3320.35, 2525.57, -16.68), (-3323.66, 2522.89, -16.68), (-3382.57, 2480.83, -11.06)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_223604535")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_223604535", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 223980111 (primary)
pts = [(4299.04, 2184.69, 11.43), (4295.93, 2209.5, 10.89), (4272.28, 2421.82, 4.56), (4165.58, 3359.69, -5.63), (4143.51, 3557.86, -6.47)]
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
            
    mesh_data = bpy.data.meshes.new("Mesh_223980111")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_223980111", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 248345503 (secondary)
pts = [(-3103.81, -1219.17, 7.7), (-3048.39, -1102.61, 6.02), (-3024.08, -1052.17, 5.58), (-2989.64, -972.54, 2.67), (-2977.81, -935.11, -5.49)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_248345503")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_248345503", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 248345507 (secondary)
pts = [(-2977.81, -935.11, -5.49), (-2970.01, -895.2, -5.49), (-2964.77, -854.95, -5.49), (-2956.1, -768.87, -2.79), (-2952.31, -729.13, -2.79), (-2950.04, -708.93, -7.57), (-2946.89, -692.0, -7.57), (-2943.74, -677.68, 1.05), (-2938.85, -663.05, 1.05), (-2932.32, -644.53, 5.36)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_248345507")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_248345507", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 257924124 (tertiary)
pts = [(552.27, -2685.55, 11.79), (573.52, -2680.97, 11.79), (644.69, -2668.35, 11.87), (661.72, -2665.81, 11.87), (682.82, -2662.66, 11.96), (718.93, -2658.33, 12.29), (768.72, -2653.18, 12.62), (819.31, -2649.2, 13.51), (853.65, -2646.16, 13.45), (883.65, -2641.22, 14.59), (934.5, -2631.49, 13.89), (984.53, -2621.92, 14.0), (1019.28, -2615.27, 13.65), (1087.0, -2602.31, 14.28), (1103.47, -2597.4, 14.28)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_257924124")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_257924124", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 264094888 (motorway)
pts = [(-4990.33, -1021.4, -18.43), (-4918.02, -1001.0, -18.43), (-4853.77, -981.0, -18.43), (-4794.99, -960.84, -18.43), (-4736.18, -940.02, -18.43), (-4701.8, -927.23, -18.43), (-4583.91, -883.37, -18.43), (-4372.49, -803.74, -18.43), (-4271.49, -766.49, -18.43), (-4075.98, -692.47, -17.14), (-3723.43, -561.09, -14.23)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_264094888")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_264094888", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 264094891 (motorway)
pts = [(-3480.51, -452.78, -3.8), (-3729.84, -546.38, -12.15), (-4046.82, -665.25, -15.09), (-4276.89, -752.03, -18.43), (-4706.59, -913.06, -18.43), (-4746.2, -927.91, -18.43), (-4851.22, -964.3, -18.43), (-4918.05, -985.15, -18.43), (-4990.51, -1006.15, -18.43), (-5079.99, -1027.19, -18.43), (-5129.07, -1037.0, -18.43), (-5186.64, -1046.47, -18.43), (-5262.14, -1056.66, -18.43), (-5289.08, -1059.43, -18.43), (-5336.38, -1064.15, -18.43), (-5384.09, -1067.46, -18.43), (-5431.15, -1069.43, -18.43), (-5478.47, -1070.43, -18.43), (-5602.44, -1070.1, -18.43), (-5631.18, -1069.77, -18.43), (-5803.22, -1067.86, -18.43)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_264094891")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_264094891", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 264094898 (motorway)
pts = [(-5511.17, -1085.26, -18.43), (-5450.95, -1085.17, -18.43), (-5417.22, -1083.88, -18.43), (-5379.49, -1082.36, -18.43), (-5298.3, -1076.03, -18.43), (-5231.99, -1068.13, -18.43), (-5181.22, -1060.75, -18.43), (-5129.18, -1051.84, -18.43), (-5077.37, -1041.99, -18.43), (-4990.33, -1021.4, -18.43)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_264094898")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_264094898", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 268650118 (secondary)
pts = [(-3147.66, -1333.61, 5.87), (-3140.62, -1313.67, 5.87), (-3122.17, -1263.0, 7.7), (-3103.81, -1219.17, 7.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_268650118")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_268650118", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684299 (motorway)
pts = [(-2275.25, 3.64, -2.7), (-2634.14, -131.48, -3.73), (-2773.31, -183.39, -1.79), (-2794.72, -191.57, -5.36), (-3105.46, -311.35, -5.78), (-3480.51, -452.78, -3.8)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684299")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684299", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684300 (motorway)
pts = [(4115.93, 1560.04, 13.62), (4251.54, 1571.28, 15.06)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684300")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684300", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684301 (motorway)
pts = [(3894.39, 1556.84, 11.33), (3810.83, 1550.18, 8.66), (3575.16, 1530.24, 4.94), (3420.65, 1517.33, 1.15)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 270684305 (motorway)
pts = [(3874.71, 1539.06, 8.2), (3900.05, 1541.01, 11.33), (4084.63, 1557.32, 12.66)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684305")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684305", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684312 (motorway)
pts = [(-2110.21, 65.81, -2.98), (-2275.25, 3.64, -2.7)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684312")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684312", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684313 (motorway)
pts = [(-2360.0, -44.56, -5.19), (-2314.24, -27.36, -6.27)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684313")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684313", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684315 (motorway)
pts = [(4111.41, 1575.29, 11.22), (4065.23, 1571.72, 10.47)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684315")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684315", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684316 (motorway)
pts = [(4249.04, 1587.09, 15.06), (4111.41, 1575.29, 11.22)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684316")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684316", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684326 (motorway)
pts = [(-1719.43, 205.52, -11.12), (-1753.36, 193.78, -9.69), (-1852.85, 159.8, -10.48), (-1891.44, 146.63, -9.92)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684326")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684326", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684327 (motorway)
pts = [(-1891.44, 146.63, -9.92), (-1984.11, 113.03, -9.42), (-2110.21, 65.81, -2.98)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684327")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684327", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684329 (motorway)
pts = [(-2726.33, -182.0, -5.92), (-2563.48, -120.98, -2.29)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684329")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684329", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270684330 (motorway)
pts = [(-2563.48, -120.98, -2.29), (-2360.0, -44.56, -5.19)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270684330")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270684330", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270854050 (motorway)
pts = [(-3723.43, -561.09, -14.23), (-3536.18, -490.2, -12.63)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270854050")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270854050", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270854051 (motorway)
pts = [(-3228.64, -374.19, 2.12), (-3172.6, -353.16, -9.47)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270854051")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270854051", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270854052 (motorway)
pts = [(-3012.01, -292.08, -8.16), (-2839.21, -224.73, -6.57), (-2790.63, -206.34, -5.36), (-2726.33, -182.0, -5.92)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270854052")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270854052", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 270854053 (motorway)
pts = [(-3513.41, -481.57, -14.05), (-3228.64, -374.19, 2.12)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_270854053")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_270854053", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293861512 (motorway_link)
pts = [(-2151.05, 147.28, 1.65), (-2214.93, 120.79, 2.2), (-2226.37, 116.06, 3.57), (-2231.96, 113.79, 5.35), (-2232.57, 113.66, 5.35), (-2247.23, 108.92, 5.35)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293861512")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293861512", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293861515 (motorway_link)
pts = [(-2421.89, -167.29, -0.82), (-2378.92, -215.03, -0.86), (-2377.17, -217.16, -0.86), (-2376.04, -218.66, -0.86), (-2375.91, -218.82, -0.86), (-2364.95, -232.63, -2.17)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293861515")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293861515", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293885983 (secondary)
pts = [(-2233.25, 40.68, 12.28), (-2231.98, 15.48, 3.38), (-2232.47, -6.67, 1.85), (-2234.38, -23.42, 1.85)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293885983")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293885983", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293886665 (secondary)
pts = [(-2284.71, -153.21, -2.27), (-2303.71, -177.0, -2.88), (-2313.81, -187.96, -2.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293886665")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293886665", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293886666 (secondary)
pts = [(-2313.81, -187.96, -2.88), (-2320.82, -194.87, -4.04), (-2329.3, -203.22, -4.43)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293886666")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293886666", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293887498 (secondary)
pts = [(-2253.57, 127.46, 0.38), (-2249.39, 115.2, 1.85), (-2247.23, 108.92, 1.85)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293887498")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293887498", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293949014 (secondary)
pts = [(-2469.32, -297.86, -4.46), (-2438.6, -279.13, -1.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293949014")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293949014", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293949015 (secondary)
pts = [(-2298.33, -288.11, -6.64), (-2279.33, -300.67, -5.42), (-2267.96, -307.18, -3.78), (-2252.79, -315.99, -6.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293949015")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293949015", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293949016 (secondary)
pts = [(-2438.6, -279.13, -1.88), (-2409.52, -261.87, -1.88), (-2379.36, -242.97, -5.67), (-2378.75, -242.52, -5.67), (-2364.95, -232.63, -5.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293949016")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293949016", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293949018 (secondary)
pts = [(-2252.79, -315.99, -6.18), (-2233.63, -325.08, -6.18), (-2219.82, -330.11, -6.33), (-2199.36, -336.02, -7.99), (-2186.93, -338.8, -7.99), (-2169.59, -342.23, -6.39), (-2156.22, -343.68, -6.39), (-2143.12, -344.3, -2.17), (-2132.23, -343.68, -2.17), (-2120.13, -341.73, -2.17), (-2114.52, -340.44, -2.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293949018")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293949018", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 293949593 (motorway_link)
pts = [(-3249.43, -394.36, -4.36), (-3228.64, -374.19, 5.62)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_293949593")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_293949593", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 308444312 (motorway)
pts = [(-2146.17, 35.85, -7.09), (-1997.55, 91.48, -9.42), (-1848.3, 145.24, -10.69), (-1773.89, 170.49, -9.66), (-1592.58, 231.8, -9.54), (-1382.03, 301.12, -9.54)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_308444312")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_308444312", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 326953088 (tertiary)
pts = [(482.27, 570.77, -12.43), (486.06, 565.4, -12.43), (491.68, 562.01, -12.76), (497.24, 561.11, -12.76), (502.77, 562.2, -12.76), (507.57, 565.14, -12.76), (511.07, 569.55, -12.76), (512.81, 574.9, -12.76), (512.39, 581.35, -13.34), (509.45, 587.11, -13.34), (504.48, 591.24, -13.34), (498.27, 593.06, -13.34), (491.86, 592.28, -13.34), (486.2, 588.95, -12.67), (482.35, 583.63, -12.67), (480.96, 577.21, -12.43), (482.27, 570.77, -12.43)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_326953088")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_326953088", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 337823344 (secondary)
pts = [(-2757.15, 3124.02, -22.56), (-2791.14, 3109.46, -22.22), (-2819.53, 3098.59, -22.89), (-2830.52, 3093.26, -22.89)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_337823344")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_337823344", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352565883 (secondary)
pts = [(-2918.93, 2781.73, -19.4), (-2918.26, 2776.43, -19.4), (-2915.92, 2771.64, -18.52), (-2913.57, 2769.0, -18.52), (-2910.71, 2766.91, -18.52), (-2907.47, 2765.49, -18.52), (-2904.0, 2764.8, -18.52), (-2898.08, 2765.34, -18.93), (-2892.76, 2767.97, -18.93), (-2889.64, 2770.99, -18.93), (-2887.43, 2774.72, -16.55), (-2886.28, 2778.91, -16.55), (-2886.27, 2783.25, -16.55), (-2887.39, 2787.45, -16.55), (-2889.58, 2791.19, -16.55), (-2892.09, 2793.78, -16.55), (-2895.11, 2795.75, -16.55), (-2898.48, 2797.02, -16.55), (-2903.32, 2797.51, -19.4), (-2908.09, 2796.56, -19.4), (-2912.37, 2794.26, -19.4), (-2915.78, 2790.81, -19.4), (-2918.04, 2786.5, -19.4), (-2918.93, 2781.73, -19.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352565883")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352565883", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570742 (secondary)
pts = [(-2889.58, 2791.19, -16.55), (-2887.72, 2795.27, -16.55), (-2884.13, 2801.42, -16.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570742")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570742", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570743 (secondary)
pts = [(-2893.38, 2739.63, -16.31), (-2891.82, 2715.99, -16.31)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570743")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570743", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570744 (secondary)
pts = [(-2943.72, 2767.18, -18.01), (-2927.44, 2770.16, -18.01), (-2920.03, 2771.82, -18.52), (-2915.92, 2771.64, -18.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570744")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570744", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570745 (secondary)
pts = [(-2875.12, 2817.62, -21.52), (-2882.34, 2811.95, -21.52), (-2889.42, 2806.04, -21.52), (-2894.59, 2800.62, -16.55), (-2898.48, 2797.02, -16.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570745")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570745", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570746 (secondary)
pts = [(-2893.38, 2739.63, -16.31), (-2891.77, 2748.22, -18.93), (-2891.8, 2755.77, -18.93), (-2892.76, 2767.97, -18.93)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570746")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570746", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570747 (secondary)
pts = [(-2904.0, 2764.8, -18.52), (-2901.68, 2760.15, -18.93), (-2899.65, 2754.25, -18.93), (-2897.18, 2747.19, -18.93), (-2893.38, 2739.63, -16.31)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570747")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570747", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 352570748 (secondary)
pts = [(-2943.72, 2767.18, -18.01), (-2953.69, 2761.45, -18.01), (-2969.94, 2751.56, -20.31)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_352570748")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_352570748", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 355666537 (tertiary)
pts = [(235.1, 1293.97, -12.89), (230.98, 1306.57, -12.89), (230.26, 1315.07, -12.89)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_355666537")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_355666537", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422239815 (tertiary)
pts = [(-3884.76, 3533.17, -25.18), (-3888.43, 3536.61, -25.18), (-3889.01, 3537.17, -25.18), (-3896.66, 3545.13, -25.18), (-4073.3, 3722.03, -25.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422239815")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422239815", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422250275 (secondary)
pts = [(-2995.71, 3075.31, -23.4), (-2986.39, 3073.62, -23.4), (-2965.57, 3070.6, -23.38), (-2943.76, 3068.14, -23.19), (-2905.42, 3068.31, -24.01)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422250275")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422250275", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422479238 (tertiary)
pts = [(76.89, 3087.65, -12.18), (77.93, 3079.5, -12.18), (78.25, 3076.99, -12.18), (77.42, 3068.82, -12.18), (73.91, 3058.98, -12.18), (67.57, 3049.07, -11.35), (59.73, 3038.92, -11.35), (42.44, 3016.58, -12.59), (36.2, 3004.93, -12.59), (33.48, 2998.61, -12.59), (31.52, 2991.12, -12.59), (30.41, 2984.44, -11.3), (30.6, 2977.31, -10.8), (31.8, 2966.57, -10.8), (35.19, 2952.61, -10.68)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422479238")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422479238", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422486644 (tertiary)
pts = [(-870.61, 2931.04, -13.26), (-728.87, 2934.53, -13.78), (-722.2, 2934.64, -13.78), (-711.37, 2934.83, -12.55), (-703.04, 2934.97, -12.55), (-690.38, 2935.42, -12.55), (-667.1, 2937.22, -11.35), (-655.76, 2938.09, -11.19), (-616.83, 2941.04, -11.0), (-594.7, 2943.07, -10.83)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422486644")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422486644", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422488819 (secondary)
pts = [(-2685.25, 3158.38, -21.12), (-2690.57, 3158.55, -21.12), (-2704.55, 3151.12, -20.75), (-2709.6, 3148.47, -20.75), (-2712.44, 3143.8, -20.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422488819")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422488819", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422495325 (tertiary)
pts = [(-204.85, 3064.08, -11.61), (-168.18, 3076.9, -11.79), (-138.88, 3088.02, -11.29), (-131.2, 3089.7, -11.29), (-122.11, 3089.92, -11.29), (-101.5, 3086.96, -11.63), (-33.74, 3075.42, -11.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422495325")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422495325", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422748393 (tertiary)
pts = [(-14.24, 3136.65, -12.66), (-2.98, 3092.8, -12.66), (-1.95, 3089.11, -12.66), (-0.54, 3084.18, -12.66), (0.7, 3078.13, -12.66), (2.29, 3070.42, -12.66)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422748393")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422748393", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422748394 (tertiary)
pts = [(35.19, 2952.61, -10.68), (64.87, 2830.29, -12.66), (66.07, 2825.3, -12.66), (108.62, 2654.2, -11.4), (120.93, 2602.77, -11.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422748394")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422748394", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 422748395 (tertiary)
pts = [(-33.74, 3075.42, -11.38), (-7.42, 3071.11, -12.66), (2.29, 3070.42, -12.66)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_422748395")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_422748395", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425750947 (secondary)
pts = [(91.27, -2862.72, 3.85), (111.89, -2854.42, 3.85), (132.37, -2843.85, 4.79), (137.99, -2840.0, 4.79), (151.3, -2830.87, 10.49), (173.03, -2813.41, 10.49), (194.64, -2798.63, 8.71), (220.54, -2784.52, 7.86), (225.95, -2782.0, 7.86), (239.88, -2775.51, 7.86), (257.61, -2769.78, 9.32), (271.59, -2766.54, 8.69)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425750947")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425750947", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425750948 (tertiary)
pts = [(2916.37, -2144.71, 10.01), (2931.26, -2138.24, 10.01), (3013.19, -2119.49, 9.98), (3076.43, -2105.63, 9.81), (3101.61, -2098.79, 9.76), (3111.72, -2094.84, 9.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425750948")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425750948", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425750949 (secondary)
pts = [(2830.05, 1037.27, -6.26), (2768.96, 968.3, -0.69), (2714.19, 906.02, -5.59), (2684.13, 873.15, -5.12)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 425898933 (tertiary)
pts = [(-1776.16, -1334.11, -11.93), (-1787.16, -1335.09, -11.93), (-1790.92, -1335.41, -11.93)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425898933")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425898933", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425898934 (tertiary)
pts = [(-1790.92, -1335.41, -11.93), (-1798.74, -1336.21, -11.93), (-1816.78, -1338.05, -14.82), (-1821.24, -1338.54, -14.82), (-1827.67, -1339.54, -14.82), (-1830.88, -1340.02, -14.4), (-1839.53, -1341.21, -14.4), (-1845.83, -1342.93, -14.4), (-1851.09, -1345.34, -14.4), (-1854.82, -1347.54, -14.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425898934")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425898934", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425904867 (tertiary)
pts = [(-1664.36, -1325.21, -13.26), (-1677.68, -1325.19, -13.26), (-1696.5, -1326.53, -14.79), (-1699.8, -1326.83, -14.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425904867")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425904867", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425905966 (tertiary)
pts = [(-1349.23, -1386.08, -15.79), (-1388.46, -1383.39, -16.74), (-1429.3, -1380.29, -11.28), (-1450.42, -1378.51, -11.28), (-1470.89, -1375.94, -8.01), (-1509.38, -1366.34, -12.31), (-1549.4, -1352.8, -15.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425905966")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425905966", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 425996877 (tertiary)
pts = [(-1728.35, 3382.21, -21.84), (-1712.86, 3310.58, -20.34), (-1699.46, 3265.22, -20.34), (-1695.47, 3251.29, -20.34), (-1689.45, 3231.43, -18.92), (-1684.76, 3216.51, -18.92), (-1679.74, 3198.29, -18.92)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_425996877")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_425996877", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 426075922 (tertiary)
pts = [(-429.07, 2985.65, -11.29), (-415.36, 2989.62, -10.33), (-405.3, 2993.13, -10.33), (-335.39, 3018.3, -11.69), (-315.13, 3025.32, -11.17), (-301.99, 3029.95, -12.28), (-277.14, 3038.77, -12.28)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_426075922")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_426075922", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 426154654 (tertiary)
pts = [(-844.83, 2676.64, -11.14), (-851.15, 2696.56, -11.55), (-853.34, 2702.19, -11.63), (-855.8, 2708.5, -11.63), (-858.02, 2713.23, -11.29), (-860.88, 2718.84, -11.29), (-954.06, 2867.09, -8.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_426154654")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_426154654", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 427160544 (secondary)
pts = [(3566.19, 1725.55, 1.0), (3518.79, 1657.95, 1.31), (3455.22, 1572.57, 0.72), (3404.23, 1514.47, 1.15), (3366.7, 1476.35, 2.07), (3355.64, 1466.7, 1.28), (3350.91, 1462.56, 1.28), (3328.83, 1444.71, 3.37), (3291.02, 1415.06, 0.01), (3246.18, 1382.57, -1.19), (3151.67, 1318.01, -2.87), (3144.97, 1313.38, -2.87), (3138.37, 1308.81, -2.87), (3082.89, 1269.26, -4.68)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 427162186 (secondary)
pts = [(3571.69, 1733.36, 1.0), (3566.19, 1725.55, 1.0)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 439029096 (tertiary)
pts = [(2197.73, 3053.15, -13.67), (2258.01, 3081.13, -7.83), (2368.35, 3134.35, -14.79), (2372.68, 3136.25, -15.94)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_439029096")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_439029096", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 439029153 (tertiary)
pts = [(92.56, 3091.97, -12.63), (182.25, 3116.56, -11.86), (187.4, 3116.93, -13.14), (193.4, 3117.35, -13.14), (358.21, 3108.25, -12.85), (375.24, 3106.41, -12.85), (395.0, 3102.45, -13.39), (409.99, 3099.02, -13.39), (459.79, 3087.56, -13.22), (522.78, 3073.69, -13.1), (550.79, 3066.7, -13.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_439029153")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_439029153", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 467170331 (tertiary)
pts = [(1106.81, -2595.92, 14.71), (1122.11, -2588.28, 14.71), (1156.01, -2571.35, 14.77), (1192.41, -2553.34, 14.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_467170331")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_467170331", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 467170332 (secondary)
pts = [(1103.47, -2597.4, 14.28), (1106.81, -2595.92, 14.71)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_467170332")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_467170332", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493402630 (tertiary)
pts = [(-1924.13, -1446.86, -14.02), (-1926.8, -1450.71, -13.78), (-1930.21, -1456.0, -13.78), (-1933.72, -1462.63, -13.78), (-1966.0, -1541.14, -14.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493402630")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493402630", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493402631 (tertiary)
pts = [(-1885.05, -1404.05, -14.91), (-1892.05, -1413.02, -14.02), (-1898.33, -1419.73, -14.02), (-1913.55, -1434.69, -14.02), (-1924.13, -1446.86, -14.02)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493402631")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493402631", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493402632 (tertiary)
pts = [(-1920.68, -1454.65, -14.02), (-1915.95, -1447.8, -14.02), (-1908.66, -1438.82, -14.02), (-1893.17, -1421.53, -14.02), (-1888.98, -1413.87, -14.02), (-1885.05, -1404.05, -14.91)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493402632")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493402632", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493402633 (tertiary)
pts = [(-2050.69, -1633.55, -13.37), (-2042.73, -1632.84, -13.37), (-2026.97, -1630.38, -14.15), (-2016.33, -1625.84, -14.15), (-2008.0, -1621.32, -14.15), (-1999.18, -1615.67, -14.72), (-1993.37, -1610.04, -14.72), (-1987.47, -1603.46, -14.72), (-1983.0, -1597.22, -14.72), (-1979.07, -1590.56, -14.57), (-1970.35, -1570.64, -14.57), (-1957.26, -1539.78, -14.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493402633")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493402633", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493458049 (tertiary)
pts = [(-2897.12, -91.58, -2.29), (-2900.69, -69.15, -2.29)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493458049")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493458049", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493458050 (tertiary)
pts = [(-2900.69, -69.15, -2.29), (-2903.1, -48.07, -1.08), (-2905.09, -33.06, -0.81), (-2906.89, -19.83, -0.81), (-2908.42, -6.04, -0.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493458050")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493458050", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493458053 (tertiary)
pts = [(-2908.42, -6.04, -0.81), (-2909.71, 52.72, -1.17), (-2910.04, 67.61, -0.64), (-2910.76, 145.92, 1.17), (-2910.22, 194.98, -0.62), (-2909.9, 224.08, -0.79), (-2908.65, 266.29, -0.9), (-2907.88, 292.02, -2.32), (-2908.13, 296.66, -2.32), (-2909.97, 300.51, -2.32), (-2912.78, 304.33, -4.27)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493458053")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493458053", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493481567 (tertiary)
pts = [(-2150.09, -1636.77, -13.05), (-2133.62, -1636.74, -13.05), (-2117.4, -1636.69, -13.05), (-2075.57, -1634.79, -12.6)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493481567")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493481567", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493481570 (tertiary)
pts = [(-1966.0, -1541.14, -14.57), (-1977.27, -1568.83, -14.57), (-1987.19, -1589.67, -14.72), (-1994.0, -1598.85, -14.72), (-2001.08, -1607.04, -14.72), (-2009.74, -1613.22, -14.15), (-2019.8, -1619.22, -14.15), (-2030.04, -1623.01, -14.15), (-2039.27, -1624.86, -14.15), (-2086.3, -1626.5, -12.6)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493481570")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493481570", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493481572 (tertiary)
pts = [(-3038.64, 301.16, -3.1), (-3053.47, 301.24, -3.1)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493481572")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493481572", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493481574 (tertiary)
pts = [(-2912.78, 304.33, -4.27), (-2916.95, 306.34, -4.27), (-2920.19, 307.42, -4.27), (-2925.08, 307.93, -3.66), (-2932.32, 307.89, -3.66), (-2955.59, 305.55, -3.66), (-2985.53, 303.54, -4.32), (-3038.64, 301.16, -3.1)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493481574")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493481574", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493481585 (tertiary)
pts = [(-4465.99, 159.46, -5.47), (-4449.97, 162.77, -5.47), (-4437.58, 165.31, -5.47)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493481585")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493481585", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493489443 (tertiary)
pts = [(-738.37, -1381.9, -4.99), (-764.0, -1384.66, -4.99), (-777.46, -1385.69, -4.64), (-792.83, -1386.77, -4.64), (-809.07, -1387.68, 2.65), (-826.6, -1387.97, 2.65), (-884.6, -1385.97, 5.32), (-909.5, -1386.68, -4.37), (-966.72, -1389.67, -7.02), (-1048.26, -1395.63, -7.73)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493489443")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493489443", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493489444 (tertiary)
pts = [(-735.71, -1410.52, -4.52), (-735.48, -1433.05, -4.52), (-737.27, -1446.99, -4.99), (-741.05, -1463.45, -4.99), (-750.65, -1506.14, -4.99), (-751.24, -1509.17, -4.99), (-763.2, -1560.04, -4.99), (-766.8, -1578.25, -4.99), (-769.57, -1597.72, -4.99), (-770.56, -1614.79, -4.99), (-770.99, -1622.25, -4.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493489444")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493489444", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 493489447 (tertiary)
pts = [(-1048.26, -1395.63, -7.73), (-1074.69, -1397.3, -8.6), (-1101.99, -1398.42, -10.02), (-1127.09, -1398.42, -8.88), (-1155.82, -1396.83, -12.04), (-1227.08, -1392.62, -13.1)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_493489447")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_493489447", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494484290 (tertiary)
pts = [(154.99, 425.93, -10.63), (181.11, 436.86, -12.05), (194.47, 442.43, -11.51), (393.18, 530.45, -13.0)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494484290")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494484290", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494966485 (tertiary)
pts = [(-616.32, -1377.81, -3.5), (-619.27, -1379.66, -3.5), (-623.58, -1380.82, -3.84), (-628.03, -1380.82, -3.84), (-645.32, -1379.36, -3.84), (-671.35, -1378.44, -3.68), (-698.52, -1378.56, -4.2), (-738.37, -1381.9, -4.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494966485")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966485", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494966486 (secondary)
pts = [(152.08, -1021.01, 10.49), (108.48, -1036.4, 3.85), (75.64, -1045.7, 3.62)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494966486")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966486", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494966487 (secondary)
pts = [(1058.36, -478.42, 21.61), (1006.4, -565.49, 22.79), (952.52, -651.34, 21.88), (921.44, -693.21, 15.86), (889.77, -731.5, 14.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494966487")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966487", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494966488 (secondary)
pts = [(1463.51, 298.74, -4.82), (1420.54, 265.44, 4.55), (1369.62, 214.31, -0.5), (1329.55, 158.93, 6.89), (1309.46, 121.92, 6.41), (1292.5, 87.66, 9.9), (1271.85, 37.3, 6.69)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 494966489 (tertiary)
pts = [(1928.51, -461.07, 15.74), (1918.74, -462.96, 13.92), (1855.99, -489.02, 15.6), (1800.3, -510.29, 18.01), (1786.88, -514.95, 16.21), (1775.31, -516.94, 16.21), (1764.53, -517.17, 16.21), (1680.14, -507.89, 14.34), (1633.88, -503.64, 14.59), (1566.75, -499.92, 14.62), (1508.2, -497.59, 13.83), (1499.88, -497.36, 13.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494966489")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966489", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494966496 (secondary)
pts = [(23.91, -1050.83, 3.07), (13.8, -1049.17, 3.07), (1.43, -1046.32, 2.76), (-11.75, -1041.2, 2.76), (-23.24, -1036.0, 2.76), (-33.32, -1030.46, 3.99), (-42.16, -1025.03, 3.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494966496")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494966496", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494974512 (tertiary)
pts = [(-1343.07, -2118.88, -15.79), (-1341.44, -2120.27, -15.79), (-1339.39, -2120.93, -15.79), (-1337.26, -2120.74, -15.79), (-1335.36, -2119.73, -15.79), (-1334.0, -2118.07, -15.79), (-1333.38, -2115.87, -15.79), (-1333.72, -2113.61, -15.79), (-1334.96, -2111.69, -15.79), (-1336.88, -2110.46, -15.79), (-1339.14, -2110.11, -15.79), (-1341.03, -2110.59, -15.79), (-1342.64, -2111.7, -15.79), (-1343.74, -2113.31, -15.79), (-1344.21, -2115.21, -15.79), (-1343.97, -2117.15, -15.79), (-1343.07, -2118.88, -15.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494974512")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494974512", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 494974513 (tertiary)
pts = [(-1339.39, -2120.93, -15.79), (-1341.26, -2128.61, -15.79), (-1362.68, -2189.41, -16.13), (-1402.77, -2312.25, -16.74), (-1412.8, -2342.81, -16.57), (-1422.08, -2370.58, -16.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_494974513")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_494974513", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 495023510 (secondary)
pts = [(913.57, -1512.23, 16.87), (895.44, -1541.19, 16.87), (877.67, -1567.8, 14.59), (838.85, -1622.74, 13.45), (792.37, -1682.97, 12.84), (763.0, -1721.39, 12.62), (760.96, -1724.07, 12.62), (739.7, -1751.29, 12.57), (713.03, -1785.52, 12.29), (591.02, -1945.44, 11.86), (535.32, -2018.85, 11.63), (517.3, -2044.7, 11.22), (511.01, -2053.4, 11.22)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_495023510")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_495023510", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 495028741 (tertiary)
pts = [(366.66, -2743.46, 10.64), (418.32, -2726.16, 11.22), (461.54, -2711.53, 10.91), (500.68, -2699.32, 11.22), (552.27, -2685.55, 11.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_495028741")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_495028741", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 495599219 (secondary)
pts = [(860.61, -761.36, 13.45), (834.04, -783.27, 13.51), (805.61, -805.56, 12.84)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_495599219")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_495599219", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496990381 (motorway)
pts = [(4065.23, 1571.72, 10.47), (3894.39, 1556.84, 11.33)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496990381")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496990381", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496990385 (motorway_link)
pts = [(4188.89, 1662.27, 15.8), (4196.04, 1673.64, 15.8), (4202.98, 1680.85, 15.8), (4209.4, 1685.35, 19.62), (4218.12, 1689.85, 19.62), (4225.89, 1692.73, 14.41), (4237.71, 1695.44, 16.01), (4259.64, 1697.6, 16.01), (4307.05, 1701.59, 13.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496990385")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496990385", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496992657 (motorway)
pts = [(4084.63, 1557.32, 12.66), (4115.93, 1560.04, 13.62)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496992657")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496992657", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496992659 (motorway_link)
pts = [(4200.27, 1489.67, 17.36), (4210.99, 1477.69, 17.06), (4219.13, 1471.56, 17.21), (4228.72, 1466.92, 16.68), (4239.4, 1462.57, 16.68), (4251.12, 1460.57, 16.68)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496992659")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496992659", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496996164 (secondary)
pts = [(4027.89, 1977.33, 20.39), (3987.73, 1969.95, 12.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496996164")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496996164", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496996166 (secondary)
pts = [(4094.59, 1987.71, 9.7), (4027.89, 1977.33, 20.39)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496996166")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496996166", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496996168 (secondary)
pts = [(4157.35, 1996.68, 10.89), (4094.59, 1987.71, 9.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496996168")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496996168", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496996169 (secondary)
pts = [(4199.62, 2002.36, 9.38), (4157.35, 1996.68, 10.89)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496996169")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496996169", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 496996173 (secondary)
pts = [(4278.57, 2013.35, 10.11), (4199.62, 2002.36, 9.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_496996173")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_496996173", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 524185760 (tertiary)
pts = [(2431.91, 2996.68, -13.13), (2432.61, 2991.61, -13.13), (2432.65, 2985.84, -12.74)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_524185760")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_524185760", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 524185761 (tertiary)
pts = [(1126.67, 3028.11, -13.78), (1137.48, 3027.01, -13.78)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_524185761")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_524185761", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 524185764 (tertiary)
pts = [(2355.61, 3551.23, -14.79), (2348.52, 3540.25, -14.79), (2339.91, 3523.64, -14.79), (2330.61, 3500.17, -13.71), (2323.44, 3478.23, -13.71), (2317.81, 3455.45, -13.71), (2314.33, 3433.41, -13.71), (2310.84, 3397.16, -10.28), (2306.01, 3338.82, -10.28), (2305.76, 3321.06, -10.28), (2306.36, 3312.97, -10.28), (2307.82, 3304.06, -10.28), (2310.26, 3295.3, -10.28), (2313.16, 3287.22, -13.71), (2319.75, 3270.99, -13.71), (2343.03, 3211.16, -14.79), (2372.68, 3136.25, -15.94)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_524185764")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_524185764", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 525177496 (secondary)
pts = [(-2641.28, 3184.53, -22.4), (-2646.02, 3183.31, -22.4), (-2649.56, 3182.29, -22.4), (-2663.47, 3174.17, -22.4), (-2666.0, 3169.27, -22.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_525177496")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_525177496", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 525277174 (secondary)
pts = [(-4850.28, 1473.95, -19.41), (-4868.49, 1461.57, -19.41), (-4907.02, 1431.2, -19.2), (-4934.51, 1408.64, -19.02), (-4942.35, 1402.27, -19.02), (-4980.76, 1371.62, -18.41), (-5058.44, 1308.11, -15.22), (-5098.42, 1276.34, -16.69), (-5101.39, 1273.84, -16.69), (-5127.13, 1252.97, -16.13), (-5149.33, 1234.34, -16.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_525277174")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_525277174", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 525279686 (tertiary)
pts = [(-277.14, 3038.77, -12.28), (-245.79, 3049.71, -11.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_525279686")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_525279686", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 526242470 (tertiary)
pts = [(2372.68, 3136.25, -15.94), (2398.81, 3075.6, -15.09), (2424.48, 3018.12, -14.41), (2429.49, 3005.54, -13.13), (2431.91, 2996.68, -13.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_526242470")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_526242470", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 526365423 (tertiary)
pts = [(-245.79, 3049.71, -11.7), (-204.85, 3064.08, -11.61)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_526365423")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_526365423", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 526422378 (tertiary)
pts = [(-1777.41, 3693.13, -22.59), (-1773.29, 3665.05, -22.59), (-1769.09, 3633.89, -22.28), (-1768.68, 3630.92, -22.28), (-1767.39, 3621.32, -22.28), (-1764.34, 3599.51, -22.28), (-1756.48, 3544.57, -22.28), (-1753.63, 3528.22, -22.28), (-1753.11, 3524.14, -22.28), (-1740.83, 3454.71, -21.84), (-1730.65, 3393.8, -21.84), (-1728.35, 3382.21, -21.84)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_526422378")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_526422378", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 552155775 (tertiary)
pts = [(-1872.76, -2807.11, -14.91), (-1933.76, -2836.94, -13.78), (-1991.43, -2869.58, -14.72), (-2013.52, -2880.57, -14.15), (-2054.81, -2902.23, -13.37), (-2069.88, -2911.33, -12.6), (-2082.3, -2922.45, -12.6), (-2193.36, -3047.29, -10.97), (-2199.81, -3056.77, -10.97), (-2204.71, -3063.99, -10.97), (-2216.99, -3097.22, -11.45), (-2219.23, -3109.62, -11.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_552155775")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_552155775", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 552155776 (tertiary)
pts = [(-1856.92, -2800.78, -6.9), (-1872.76, -2807.11, -7.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_552155776")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_552155776", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582614381 (secondary)
pts = [(-2250.55, 3348.72, -20.52), (-2225.63, 3355.22, -21.87), (-2212.6, 3358.85, -21.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582614381")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582614381", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582614387 (secondary)
pts = [(-2216.78, 3369.52, -21.87), (-2228.49, 3361.98, -21.87), (-2250.55, 3348.72, -20.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582614387")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582614387", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582614398 (secondary)
pts = [(-2192.31, 3410.56, -18.96), (-2196.23, 3402.84, -18.96), (-2199.42, 3395.91, -18.96), (-2201.96, 3389.13, -18.96), (-2206.09, 3382.63, -18.96)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582614398")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582614398", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582614404 (secondary)
pts = [(-2194.07, 3380.2, -18.96), (-2194.11, 3386.12, -18.96), (-2193.0, 3394.26, -18.96), (-2192.31, 3410.56, -18.96)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582614404")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582614404", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630644 (secondary)
pts = [(-2851.99, 3075.32, -23.88), (-2848.33, 3078.52, -23.88), (-2840.91, 3083.46, -22.89), (-2838.75, 3084.92, -22.89), (-2830.52, 3093.26, -22.89)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630644")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630644", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630645 (secondary)
pts = [(-2830.52, 3093.26, -22.89), (-2840.19, 3090.06, -22.89), (-2844.52, 3088.41, -22.89), (-2851.8, 3085.43, -23.88), (-2857.94, 3084.3, -23.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630645")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630645", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630646 (secondary)
pts = [(-2712.44, 3143.8, -20.75), (-2707.53, 3142.94, -20.75), (-2687.16, 3153.27, -21.12), (-2685.25, 3158.38, -21.12)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630646")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630646", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630647 (secondary)
pts = [(-2712.44, 3143.8, -20.75), (-2720.23, 3140.16, -20.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630647")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630647", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630648 (secondary)
pts = [(-2666.0, 3169.27, -22.4), (-2676.35, 3163.41, -21.12), (-2685.25, 3158.38, -21.12)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630648")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630648", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630649 (secondary)
pts = [(-2666.0, 3169.27, -22.4), (-2660.62, 3169.44, -22.4), (-2646.35, 3177.54, -22.4), (-2644.28, 3180.38, -22.4), (-2641.28, 3184.53, -22.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630649")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630649", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630652 (secondary)
pts = [(-2569.65, 3226.86, -23.24), (-2574.12, 3224.27, -23.24), (-2587.39, 3216.52, -23.29)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630652")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630652", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630653 (secondary)
pts = [(-2379.22, 3337.25, -19.99), (-2373.65, 3335.79, -19.99), (-2364.6, 3336.75, -19.99), (-2359.94, 3339.48, -19.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630653")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630653", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630654 (secondary)
pts = [(-2359.94, 3339.48, -19.99), (-2365.19, 3341.47, -19.99), (-2374.34, 3340.65, -19.99), (-2379.22, 3337.25, -19.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630654")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630654", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582630655 (secondary)
pts = [(-2250.55, 3348.72, -20.52), (-2264.26, 3345.32, -20.52), (-2275.76, 3342.58, -21.75), (-2285.15, 3341.05, -21.75), (-2297.26, 3340.15, -21.14), (-2311.92, 3339.61, -21.14), (-2359.94, 3339.48, -19.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582630655")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582630655", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582641856 (secondary)
pts = [(-2867.79, 3063.37, -22.05), (-2866.28, 3058.29, -22.05), (-2865.59, 3051.14, -22.05), (-2862.66, 3035.7, -21.69)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582641856")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582641856", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582641859 (secondary)
pts = [(-2862.66, 3035.7, -21.69), (-2859.18, 3050.1, -21.69), (-2859.09, 3051.23, -23.88), (-2857.95, 3063.97, -23.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582641859")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582641859", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582641861 (secondary)
pts = [(-2874.83, 3076.7, -22.05), (-2884.67, 3074.01, -22.05), (-2896.71, 3068.9, -22.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582641861")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582641861", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 582641863 (secondary)
pts = [(-2905.42, 3068.31, -24.01), (-2896.71, 3068.9, -22.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_582641863")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_582641863", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583073738 (secondary)
pts = [(-2852.32, 2871.96, -22.63), (-2856.62, 2862.28, -23.75), (-2857.77, 2857.32, -23.75), (-2858.65, 2853.55, -23.75), (-2858.91, 2844.37, -23.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583073738")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583073738", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583073739 (secondary)
pts = [(-2858.91, 2844.37, -23.75), (-2853.5, 2852.11, -23.75), (-2852.66, 2856.12, -23.75)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583073739")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583073739", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583073740 (secondary)
pts = [(-2858.91, 2844.37, -23.75), (-2861.45, 2839.02, -23.75), (-2864.63, 2833.1, -21.52), (-2869.04, 2825.65, -21.52), (-2875.12, 2817.62, -21.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583073740")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583073740", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583076855 (secondary)
pts = [(-2891.82, 2715.99, -16.31), (-2890.08, 2681.24, -15.4), (-2888.11, 2644.42, -13.57), (-2886.05, 2607.33, -15.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583076855")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583076855", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583080723 (secondary)
pts = [(-2851.01, 1656.4, -11.98), (-2850.91, 1528.24, -15.57), (-2850.92, 1502.74, -16.85), (-2850.92, 1466.19, -16.28), (-2853.71, 1388.81, -14.84), (-2856.81, 1321.01, -14.94)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583080723")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583080723", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 583152742 (secondary)
pts = [(-2206.09, 3382.63, -18.96), (-2208.92, 3381.59, -18.96), (-2211.46, 3379.96, -18.96), (-2213.6, 3377.84, -21.87), (-2215.25, 3375.32, -21.87), (-2216.32, 3372.51, -21.87), (-2216.78, 3369.52, -21.87), (-2216.6, 3366.58, -21.87), (-2215.82, 3363.75, -21.87), (-2214.46, 3361.13, -21.87), (-2212.6, 3358.85, -21.87), (-2210.34, 3357.03, -18.96), (-2207.75, 3355.69, -18.96), (-2204.95, 3354.92, -18.96), (-2202.04, 3354.75, -18.96), (-2199.17, 3355.17, -18.96), (-2196.43, 3356.16, -18.96), (-2193.96, 3357.69, -18.96), (-2191.52, 3360.1, -18.96), (-2189.72, 3363.03, -18.96), (-2188.69, 3366.29, -18.96), (-2188.48, 3369.72, -18.96), (-2188.83, 3372.14, -18.96), (-2189.59, 3374.46, -18.96), (-2190.75, 3376.62, -18.96), (-2192.26, 3378.55, -18.96), (-2194.07, 3380.2, -18.96), (-2196.23, 3381.53, -18.96), (-2198.57, 3382.46, -18.96), (-2201.06, 3382.98, -18.96), (-2203.59, 3383.03, -18.96), (-2206.09, 3382.63, -18.96)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_583152742")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_583152742", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 584362952 (secondary)
pts = [(-2817.96, 1078.61, -14.85), (-2802.12, 1050.87, -15.83), (-2792.14, 1037.05, -14.69), (-2776.87, 1016.33, -15.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_584362952")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_584362952", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 584362955 (secondary)
pts = [(-2840.13, 1131.0, -14.68), (-2822.36, 1087.74, -14.85), (-2817.96, 1078.61, -14.85)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_584362955")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_584362955", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 584748681 (secondary)
pts = [(-2317.43, 317.41, -5.21), (-2310.44, 293.8, -5.26), (-2277.85, 197.67, 0.25)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_584748681")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_584748681", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 584748682 (secondary)
pts = [(-2776.87, 1016.33, -15.81), (-2772.07, 1009.68, -13.89), (-2736.11, 972.36, -10.74)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_584748682")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_584748682", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 584904482 (secondary)
pts = [(-2268.68, -128.53, 0.1), (-2284.71, -153.21, -2.27)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_584904482")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_584904482", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 585980706 (tertiary)
pts = [(414.11, 810.91, -11.25), (409.12, 824.66, -13.0)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_585980706")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_585980706", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 593561591 (motorway)
pts = [(-1299.35, 344.87, -9.62), (-1382.59, 317.41, -10.71)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_593561591")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_593561591", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 593561592 (motorway)
pts = [(-1259.78, 357.57, -8.96), (-1262.84, 356.56, -8.96), (-1275.65, 352.72, -8.96)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_593561592")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_593561592", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 593974757 (secondary)
pts = [(-2886.05, 2607.33, -15.15), (-2885.7, 2601.12, -15.15), (-2884.41, 2576.71, -14.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_593974757")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_593974757", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 593974759 (secondary)
pts = [(-2856.81, 1321.01, -14.94), (-2857.32, 1282.23, -15.92)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_593974759")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_593974759", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 593974760 (secondary)
pts = [(-2277.85, 197.67, 0.25), (-2266.21, 163.77, -0.83), (-2253.57, 127.46, 0.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_593974760")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_593974760", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 601178668 (secondary)
pts = [(-3021.28, 2721.17, -19.01), (-3043.4, 2707.23, -17.2)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_601178668")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_601178668", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 601178670 (secondary)
pts = [(-3003.19, 2731.29, -15.65), (-3015.34, 2724.86, -15.65), (-3021.28, 2721.17, -19.01)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_601178670")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_601178670", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 601178674 (secondary)
pts = [(-3003.19, 2731.29, -15.65), (-2998.56, 2730.73, -15.65), (-2995.35, 2732.7, -15.65), (-2991.44, 2735.18, -15.65), (-2989.1, 2739.61, -15.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_601178674")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_601178674", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 601178675 (secondary)
pts = [(-2989.1, 2739.61, -15.65), (-2994.35, 2739.79, -15.65), (-2998.04, 2737.71, -15.65), (-3001.2, 2735.87, -15.65), (-3003.19, 2731.29, -15.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_601178675")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_601178675", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 601178676 (secondary)
pts = [(-2969.94, 2751.56, -20.31), (-2979.02, 2745.64, -19.79), (-2989.1, 2739.61, -15.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_601178676")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_601178676", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603535420 (secondary)
pts = [(-3426.44, 2450.48, -10.35), (-3461.81, 2425.05, -14.47)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603535420")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603535420", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603542742 (secondary)
pts = [(-3461.81, 2425.05, -14.47), (-3479.35, 2411.84, -9.25), (-3523.39, 2381.27, -11.7), (-3536.39, 2370.38, -12.95)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603542742")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603542742", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603545293 (secondary)
pts = [(-3610.5, 2279.57, -14.76), (-3601.44, 2294.9, -14.76), (-3584.4, 2320.26, -15.2), (-3569.15, 2338.48, -15.2), (-3551.98, 2356.1, -12.95), (-3536.39, 2370.38, -12.95)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603545293")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603545293", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603546355 (secondary)
pts = [(-4211.27, 1864.88, -20.4), (-4261.43, 1834.77, -20.63), (-4278.81, 1823.9, -20.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603546355")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603546355", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603546356 (secondary)
pts = [(-4278.81, 1823.9, -20.63), (-4304.74, 1808.29, -20.01), (-4592.09, 1632.85, -19.56), (-4604.9, 1625.37, -18.27), (-4642.55, 1602.27, -18.27), (-4694.58, 1570.79, -16.66), (-4760.28, 1530.73, -20.12)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603546356")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603546356", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603551748 (secondary)
pts = [(-3672.6, 3106.21, -21.82), (-3637.17, 3102.15, -20.26), (-3605.96, 3098.42, -19.5), (-3576.46, 3095.11, -18.7), (-3566.49, 3094.35, -18.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603551748")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603551748", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603917940 (tertiary)
pts = [(-4171.52, 3820.01, -17.88), (-4184.84, 3833.42, -17.88)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603917940")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603917940", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603917941 (tertiary)
pts = [(-4107.38, 3756.28, -25.38), (-4171.52, 3820.01, -25.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603917941")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603917941", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 603917942 (tertiary)
pts = [(-4073.3, 3722.03, -25.38), (-4079.35, 3727.8, -25.38), (-4107.38, 3756.28, -25.38)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_603917942")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_603917942", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 625300222 (tertiary)
pts = [(1126.67, 3028.11, -13.78), (1127.96, 3033.9, -13.78), (1134.17, 3057.84, -15.91), (1138.96, 3071.63, -15.91)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_625300222")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_625300222", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 625300223 (tertiary)
pts = [(3111.72, -2094.84, 9.76), (3122.29, -2089.31, 9.8), (3133.65, -2082.11, 9.8), (3148.5, -2071.38, 9.67), (3156.26, -2067.75, 9.67), (3164.98, -2065.74, 9.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_625300223")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_625300223", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626240170 (tertiary)
pts = [(230.26, 1315.07, -12.89), (218.77, 1404.34, -12.44)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626240170")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626240170", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626240171 (tertiary)
pts = [(-992.71, 2922.65, -11.65), (-984.44, 2925.98, -11.65), (-973.72, 2928.16, -10.21), (-941.01, 2928.88, -11.59), (-938.95, 2928.84, -11.59), (-870.61, 2931.04, -13.26)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626240171")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626240171", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626240172 (tertiary)
pts = [(-954.06, 2867.09, -8.88), (-978.99, 2906.98, -11.65), (-984.66, 2914.07, -11.65), (-992.71, 2922.65, -11.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626240172")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626240172", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290619 (tertiary)
pts = [(3161.1, -2013.17, 9.67), (3164.36, -2057.34, 9.67), (3164.98, -2065.74, 9.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290619")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290619", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290620 (tertiary)
pts = [(3164.98, -2065.74, 9.67), (3180.5, -2065.25, 9.19), (3206.85, -2065.55, 8.94), (3238.54, -2066.84, 9.0)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290620")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290620", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290673 (tertiary)
pts = [(1126.65, 764.39, -11.3), (1166.31, 765.52, -11.16), (1195.58, 762.76, -11.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290673")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290673", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290674 (tertiary)
pts = [(1069.19, 757.72, -12.16), (1073.99, 758.44, -12.16), (1098.01, 761.8, -12.16), (1112.98, 763.45, -11.92), (1126.65, 764.39, -11.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290674")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290674", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290675 (tertiary)
pts = [(901.35, 707.45, -12.08), (936.15, 718.96, -11.96), (967.02, 728.3, -11.85)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290675")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290675", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290676 (tertiary)
pts = [(512.39, 581.35, -13.34), (577.82, 601.9, -12.08)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290676")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290676", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 626290677 (tertiary)
pts = [(393.18, 530.45, -13.0), (458.59, 559.36, -12.55), (471.64, 565.46, -12.43), (482.27, 570.77, -12.43)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_626290677")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_626290677", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 638697614 (tertiary)
pts = [(215.73, 2083.39, -9.76), (211.2, 2073.28, -9.76), (206.06, 2058.4, -12.81), (202.95, 2040.72, -12.81), (199.68, 1976.8, -12.37), (196.76, 1898.11, -12.01), (195.29, 1846.77, -9.72), (194.21, 1830.53, -9.72), (192.01, 1815.83, -9.6), (181.97, 1782.7, -11.63), (179.69, 1763.47, -11.63), (177.25, 1736.84, -10.57), (176.11, 1731.69, -10.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_638697614")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_638697614", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999863 (secondary)
pts = [(-1659.78, -294.26, -8.47), (-1676.01, -297.01, -8.47), (-1695.22, -300.67, -8.27), (-1712.39, -304.54, -8.27), (-1726.02, -308.51, -7.27), (-1742.14, -313.44, -7.27)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999863")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999863", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999864 (secondary)
pts = [(-1437.02, -322.71, -6.04), (-1461.78, -314.14, -6.04), (-1489.68, -305.68, -6.06), (-1512.94, -299.83, -6.06), (-1533.79, -295.84, -5.82), (-1556.53, -292.59, -7.31), (-1578.09, -290.6, -7.31), (-1602.98, -290.07, -9.19), (-1632.17, -290.98, -9.19), (-1659.78, -294.26, -8.47)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999864")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999864", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999865 (secondary)
pts = [(-289.71, -669.63, -4.92), (-316.6, -661.74, -4.5), (-350.28, -658.13, -5.2)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999865")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999865", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999866 (secondary)
pts = [(-233.75, -702.14, -2.93), (-247.57, -691.84, -2.93), (-267.8, -678.95, -3.86), (-289.71, -669.63, -4.92)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999866")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999866", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999867 (secondary)
pts = [(-42.16, -1025.03, 3.99), (-56.55, -1012.69, 3.09), (-65.96, -1002.86, 3.09), (-78.6, -986.19, 3.09), (-87.96, -970.01, 1.76), (-110.06, -922.76, 0.26), (-130.04, -878.42, 0.26), (-156.16, -818.32, -0.88), (-183.8, -760.33, -1.51), (-211.95, -721.54, -1.61), (-233.75, -702.14, -2.93)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999867")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999867", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999868 (tertiary)
pts = [(-42.16, -1025.03, 3.99), (-49.49, -1036.66, 3.09), (-61.9, -1054.17, 3.09), (-67.66, -1060.22, 3.09)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999868")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999868", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999869 (secondary)
pts = [(75.64, -1045.7, 3.62), (51.99, -1050.96, 3.31), (37.72, -1051.63, 3.31), (23.91, -1050.83, 3.07)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999869")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999869", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999870 (tertiary)
pts = [(1568.25, 595.52, -9.26), (1595.83, 591.44, -9.51), (1625.18, 590.26, -9.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999870")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999870", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 639999871 (secondary)
pts = [(860.61, -761.36, 13.45), (865.31, -771.1, 13.45), (878.75, -798.94, 14.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_639999871")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_639999871", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235919 (secondary)
pts = [(-3299.7, -1727.37, 6.35), (-3286.22, -1704.12, 6.35), (-3282.82, -1697.02, 6.35)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235919")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235919", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235922 (secondary)
pts = [(-3282.82, -1697.02, 6.35), (-3266.48, -1662.3, 5.21)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235922")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235922", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235925 (secondary)
pts = [(-3266.48, -1662.3, 5.21), (-3257.47, -1640.22, 5.21)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235925")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235925", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235926 (secondary)
pts = [(-3257.47, -1640.22, 5.21), (-3228.33, -1561.24, 7.59), (-3223.12, -1547.11, 7.59), (-3217.53, -1532.55, 7.59), (-3202.76, -1491.32, 6.75), (-3197.39, -1477.34, 6.75), (-3190.08, -1461.88, 6.75), (-3188.6, -1459.65, 5.03), (-3184.53, -1453.5, 5.03), (-3178.1, -1446.02, 5.03)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235926")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235926", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235927 (tertiary)
pts = [(-3096.01, -1454.54, 7.7), (-3115.32, -1448.84, 7.7), (-3138.52, -1441.98, 5.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235927")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235927", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235929 (secondary)
pts = [(-3166.49, -1416.04, 5.03), (-3166.67, -1406.25, 5.03), (-3165.42, -1388.6, 5.03), (-3163.52, -1379.12, 5.03), (-3147.66, -1333.61, 5.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235929")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235929", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 641235930 (secondary)
pts = [(-2932.32, -644.53, 5.36), (-2929.47, -638.17, 5.36), (-2923.12, -623.93, 5.36), (-2914.06, -606.29, -8.07), (-2903.66, -588.57, -7.43)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_641235930")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_641235930", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 664213524 (secondary)
pts = [(1271.85, 37.3, 6.69), (1242.61, -35.15, 5.81), (1120.52, -339.58, 11.87), (1105.88, -375.49, 14.25), (1090.91, -412.15, 14.15), (1074.1, -448.44, 13.69)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_664213524")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_664213524", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 664213525 (secondary)
pts = [(1693.01, 400.67, -5.41), (1562.97, 351.99, -5.11), (1509.2, 327.59, -3.19), (1463.51, 298.74, -4.82)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 682394298 (tertiary)
pts = [(-5054.45, 455.35, -4.55), (-5063.46, 266.89, -8.3), (-5063.65, 249.99, -8.3), (-5063.28, 242.58, -8.3), (-5061.94, 234.53, -4.39), (-5003.69, 57.63, -5.09), (-4999.94, 46.24, -5.08)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_682394298")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_682394298", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 751072128 (tertiary)
pts = [(967.02, 728.3, -11.85), (1042.82, 751.22, -12.14), (1069.19, 757.72, -12.16)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_751072128")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_751072128", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 751072129 (tertiary)
pts = [(577.82, 601.9, -12.08), (816.24, 680.51, -12.42), (874.48, 699.09, -12.09), (901.35, 707.45, -12.08)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_751072129")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_751072129", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 770017431 (tertiary)
pts = [(-594.7, 2943.07, -10.83), (-551.63, 2947.0, -10.54), (-541.06, 2947.92, -9.57), (-532.1, 2949.43, -9.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_770017431")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_770017431", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 770017432 (tertiary)
pts = [(-1084.64, 2937.83, -9.76), (-1064.16, 2941.01, -10.12), (-1050.64, 2941.09, -12.58), (-1039.78, 2939.82, -12.58), (-1018.49, 2933.46, -11.31), (-1008.83, 2930.48, -11.31), (-992.71, 2922.65, -11.65)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_770017432")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_770017432", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472615 (tertiary)
pts = [(2684.13, 873.15, -5.12), (2687.05, 868.72, -5.12), (2762.89, 753.84, -0.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472615")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472615", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472616 (secondary)
pts = [(2684.13, 873.15, -5.12), (2627.11, 819.51, 0.0), (2615.14, 809.2, -4.21), (2603.55, 799.23, -4.21), (2588.81, 788.19, -2.39), (2555.19, 761.71, -1.21), (2533.22, 747.39, -2.55), (2516.85, 736.81, -2.55)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 791472620 (tertiary)
pts = [(2519.94, 1684.88, -13.58), (2516.92, 1547.3, -11.7), (2516.67, 1532.26, -11.2), (2519.05, 1502.89, -9.75), (2524.89, 1462.22, -9.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472620")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472620", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472621 (tertiary)
pts = [(2415.04, 2113.85, -15.19), (2417.8, 2104.64, -15.19), (2426.04, 2085.28, -14.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472621")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472621", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472622 (tertiary)
pts = [(2408.68, 2149.39, -15.56), (2411.63, 2129.56, -15.56), (2415.04, 2113.85, -15.19)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472622")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472622", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472623 (tertiary)
pts = [(2415.04, 2113.85, -15.19), (2410.01, 2112.31, -15.19), (2405.05, 2110.81, -15.19), (2374.71, 2105.71, -15.07)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472623")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472623", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472627 (tertiary)
pts = [(1138.96, 3071.63, -15.91), (1145.22, 3089.6, -15.91), (1146.96, 3095.13, -15.91), (1171.98, 3167.96, -13.81), (1186.36, 3208.62, -14.11)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472627")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472627", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791472628 (tertiary)
pts = [(1208.71, 3678.59, -14.11), (1208.28, 3687.16, -14.11), (1207.72, 3696.62, -14.11), (1196.45, 3883.06, -14.11), (1195.88, 3892.61, -14.11)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791472628")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791472628", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791670856 (secondary)
pts = [(3923.85, 1953.5, 10.1), (3896.06, 1947.13, 7.71)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791670856")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791670856", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791670857 (secondary)
pts = [(3987.73, 1969.95, 12.41), (3923.85, 1953.5, 10.1)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_791670857")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_791670857", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 791670858 (secondary)
pts = [(3896.06, 1947.13, 7.71), (3879.62, 1943.13, 7.22), (3868.21, 1939.85, 7.22), (3838.02, 1929.7, 7.1)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 793542769 (tertiary)
pts = [(3156.66, -1717.2, 9.67), (3159.41, -1812.52, 9.67), (3159.5, -1844.66, 9.67), (3159.46, -1852.58, 9.67), (3159.39, -1895.85, 9.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793542769")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793542769", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793542788 (tertiary)
pts = [(576.51, 3060.86, -13.67), (591.07, 3057.42, -15.5), (611.77, 3052.44, -15.42)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793542788")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793542788", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793542789 (tertiary)
pts = [(550.79, 3066.7, -13.67), (576.51, 3060.86, -13.67)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793542789")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793542789", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793542790 (tertiary)
pts = [(611.77, 3052.44, -15.42), (649.34, 3043.98, -8.06), (690.01, 3035.57, -11.81), (696.13, 3034.37, -11.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793542790")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793542790", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793787569 (tertiary)
pts = [(222.76, 2106.11, -10.21), (218.88, 2093.32, -9.76), (215.73, 2083.39, -9.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793787569")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793787569", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793787581 (tertiary)
pts = [(312.73, 1065.59, -14.22), (282.65, 1142.82, -14.68), (280.07, 1150.52, -14.68)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793787581")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793787581", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793787585 (tertiary)
pts = [(1914.89, 502.73, -4.85), (1907.94, 510.84, -4.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_793787585")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_793787585", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 793787586 (secondary)
pts = [(1910.88, 484.6, -3.28), (1901.3, 481.1, -4.14)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 793787587 (secondary)
pts = [(2516.85, 736.81, -2.55), (2468.52, 708.4, -3.04), (2433.43, 690.66, -1.74), (2421.15, 684.83, -4.05), (2397.19, 673.48, -0.97), (2384.97, 667.94, -3.27), (2371.81, 662.46, -3.27)]
if len(pts) >= 2:
    half_w = 3.25
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

# Segment 797520519 (motorway)
pts = [(-3172.6, -353.16, -9.47), (-3012.01, -292.08, -8.16)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_797520519")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_797520519", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 797520520 (motorway)
pts = [(-3536.18, -490.2, -12.63), (-3513.41, -481.57, -14.05)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_797520520")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_797520520", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 800381933 (secondary)
pts = [(-2744.65, -461.07, -8.62), (-2696.42, -432.61, -5.03), (-2648.19, -404.16, -4.5), (-2469.32, -297.86, -4.46)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_800381933")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_800381933", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822278153 (secondary)
pts = [(-2380.14, 3337.09, -19.99), (-2386.12, 3336.0, -21.91), (-2390.13, 3334.81, -21.91), (-2394.84, 3333.16, -21.91)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822278153")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822278153", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822278154 (secondary)
pts = [(-2379.22, 3337.25, -19.99), (-2380.14, 3337.09, -19.99)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822278154")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822278154", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838239 (tertiary)
pts = [(-444.39, -1226.63, -1.9), (-464.35, -1228.05, -5.79), (-477.88, -1229.47, -5.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838239")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838239", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838247 (tertiary)
pts = [(-1626.16, -1329.58, -16.31), (-1632.88, -1328.27, -16.31), (-1649.65, -1326.25, -14.63), (-1664.36, -1325.21, -13.26)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838247")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838247", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838248 (tertiary)
pts = [(-1699.8, -1326.83, -14.79), (-1776.16, -1334.11, -11.93)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838248")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838248", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838253 (tertiary)
pts = [(-1936.89, -1488.88, -13.78), (-1920.68, -1454.65, -14.02)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838253")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838253", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838254 (tertiary)
pts = [(-1957.26, -1539.78, -14.57), (-1936.89, -1488.88, -13.78)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838254")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838254", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838255 (tertiary)
pts = [(-2086.3, -1626.5, -12.6), (-2107.03, -1627.41, -11.95), (-2133.82, -1627.93, -13.05), (-2150.09, -1628.24, -13.05)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838255")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838255", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 822838256 (tertiary)
pts = [(-2075.57, -1634.79, -12.6), (-2050.69, -1633.55, -13.37)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_822838256")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_822838256", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 824454741 (tertiary)
pts = [(3974.08, -199.91, 10.13), (3971.25, -201.21, 10.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_824454741")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_824454741", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 826358167 (tertiary)
pts = [(3126.48, -303.95, 10.86), (3128.8, -357.4, 13.05), (3129.89, -387.5, 11.89), (3129.72, -401.54, 11.89), (3129.29, -414.43, 12.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_826358167")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_826358167", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 826358168 (tertiary)
pts = [(3122.7, -243.06, 19.59), (3123.41, -248.29, 19.59)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_826358168")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_826358168", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 827266589 (tertiary)
pts = [(2097.46, -2237.92, 14.87), (2102.47, -2236.52, 19.28), (2127.29, -2234.88, 19.28), (2161.91, -2245.95, 17.14), (2242.91, -2279.53, 13.96), (2252.76, -2282.88, 13.96), (2281.9, -2291.63, 14.22), (2295.94, -2294.64, 14.22), (2327.79, -2297.86, 15.85), (2562.98, -2306.1, 13.74), (2600.33, -2303.56, 11.54), (2636.46, -2293.1, 10.88), (2655.06, -2284.01, 10.88), (2675.86, -2273.15, 10.86)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_827266589")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_827266589", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 830912025 (tertiary)
pts = [(-3835.87, 408.47, -4.13), (-3811.8, 412.86, -2.26), (-3782.94, 416.16, -0.44), (-3755.33, 417.72, -1.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_830912025")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_830912025", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 830912035 (tertiary)
pts = [(-5055.0, 628.43, -8.63), (-5053.22, 542.07, -5.92), (-5054.13, 461.85, -4.61), (-5054.45, 455.35, -4.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_830912035")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_830912035", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 844471455 (tertiary)
pts = [(-1227.08, -1392.62, -13.1), (-1242.32, -1392.41, -12.02), (-1313.39, -1388.48, -15.79), (-1330.64, -1387.28, -15.79), (-1349.23, -1386.08, -15.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_844471455")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_844471455", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 844471463 (tertiary)
pts = [(-1549.4, -1352.8, -15.18), (-1596.82, -1337.14, -14.46), (-1615.83, -1331.65, -16.31), (-1626.16, -1329.58, -16.31)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_844471463")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_844471463", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 844497082 (tertiary)
pts = [(-2636.73, -1542.1, -14.04), (-2687.99, -1534.4, -14.92), (-2695.64, -1533.46, -16.21), (-2713.08, -1530.92, -16.21), (-2749.37, -1526.13, -6.99), (-2770.86, -1523.3, -6.99), (-2804.41, -1518.63, 2.99), (-2821.64, -1516.6, 4.26), (-2834.89, -1515.18, 4.26)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_844497082")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_844497082", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 844497083 (tertiary)
pts = [(-2911.9, -1504.39, 2.55), (-2937.16, -1499.19, -2.79), (-2951.73, -1496.07, -2.79), (-2972.28, -1490.32, -5.49), (-3039.79, -1470.84, 6.02), (-3074.01, -1460.98, 6.02), (-3084.07, -1458.08, 6.77), (-3087.31, -1457.12, 6.77), (-3096.01, -1454.54, 7.7)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_844497083")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_844497083", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 846501516 (secondary)
pts = [(-3043.4, 2707.23, -17.2), (-3053.26, 2700.99, -17.2), (-3156.39, 2635.28, -18.3)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_846501516")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_846501516", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 855483014 (secondary)
pts = [(-1965.21, 3790.18, -20.57), (-1987.41, 3758.64, -20.81)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_855483014")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_855483014", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 855483015 (secondary)
pts = [(-1830.32, 3950.23, -20.68), (-1836.95, 3943.76, -20.68), (-1855.1, 3923.83, -20.68), (-1863.58, 3913.56, -20.68), (-1885.97, 3886.47, -20.16), (-1887.11, 3885.09, -20.27), (-1923.37, 3841.77, -20.27), (-1932.79, 3830.86, -19.92), (-1941.52, 3820.19, -19.92), (-1965.21, 3790.18, -20.57)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_855483015")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_855483015", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 859379725 (tertiary)
pts = [(-738.37, -1381.9, -4.99), (-737.66, -1389.57, -4.99), (-735.71, -1410.52, -4.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_859379725")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_859379725", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 859379733 (tertiary)
pts = [(-477.88, -1229.47, -5.79), (-489.48, -1232.49, -5.15), (-494.77, -1234.26, -5.15), (-501.93, -1237.06, -5.15), (-512.95, -1244.04, -4.56), (-526.22, -1254.24, -4.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_859379733")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_859379733", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 859379737 (tertiary)
pts = [(-67.66, -1060.22, 3.09), (-74.16, -1065.87, 3.09), (-81.87, -1070.44, 3.09), (-90.19, -1073.44, 1.76), (-112.85, -1078.65, 0.26), (-116.21, -1079.33, 0.26)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_859379737")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_859379737", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 937374980 (secondary)
pts = [(-3169.72, -1450.49, 5.03), (-3165.61, -1450.9, 5.03), (-3161.53, -1450.34, 5.03), (-3157.69, -1448.83, 5.03), (-3154.5, -1446.62, 5.03), (-3151.88, -1443.77, 5.03), (-3150.42, -1441.52, 5.87), (-3149.27, -1438.8, 5.87), (-3148.67, -1435.82, 5.87), (-3148.52, -1432.85, 5.87), (-3149.08, -1429.02, 5.87), (-3150.47, -1425.4, 5.87), (-3153.08, -1421.66, 5.03), (-3156.57, -1418.73, 5.03), (-3160.7, -1416.81, 5.03), (-3163.8, -1416.11, 5.03), (-3166.49, -1416.04, 5.03), (-3170.93, -1416.77, 5.03), (-3174.01, -1417.97, 5.03), (-3177.74, -1420.58, 5.03), (-3180.67, -1424.07, 5.03), (-3182.6, -1428.21, 5.03), (-3183.36, -1432.27, 5.03), (-3183.15, -1436.39, 5.03), (-3181.99, -1440.35, 5.03), (-3179.92, -1443.91, 5.03), (-3178.1, -1446.02, 5.03), (-3173.61, -1449.14, 5.03), (-3169.72, -1450.49, 5.03)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_937374980")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_937374980", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 937667688 (secondary)
pts = [(-1051.53, -405.0, -11.8), (-1070.67, -404.29, -10.12), (-1079.47, -404.7, -10.12), (-1088.34, -401.68, -10.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_937667688")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_937667688", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 960967402 (tertiary)
pts = [(-3874.13, 3522.02, -25.13), (-3884.76, 3533.17, -25.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_960967402")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_960967402", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 960983917 (secondary)
pts = [(-3003.73, 3077.0, -23.4), (-2995.71, 3075.31, -23.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_960983917")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_960983917", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 962651893 (secondary)
pts = [(-2720.23, 3140.16, -20.75), (-2757.15, 3124.02, -22.56)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_962651893")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_962651893", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1000386072 (tertiary)
pts = [(-1394.94, 2825.99, -12.75), (-1390.05, 2825.34, -12.75), (-1381.94, 2827.07, -12.75), (-1326.97, 2852.23, -11.42), (-1280.79, 2870.76, -11.91), (-1240.55, 2885.65, -11.62), (-1181.91, 2906.89, -11.08), (-1143.93, 2920.76, -11.14), (-1125.37, 2926.51, -11.25), (-1117.77, 2928.75, -9.76), (-1084.64, 2937.83, -9.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1000386072")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1000386072", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1013848140 (secondary)
pts = [(-2550.41, 3238.13, -24.33), (-2569.65, 3226.86, -23.24)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1013848140")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1013848140", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1013848141 (secondary)
pts = [(-2587.39, 3216.52, -23.29), (-2611.57, 3202.43, -23.29), (-2641.28, 3184.53, -22.4)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1013848141")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1013848141", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1018251629 (tertiary)
pts = [(-3138.52, -1441.98, 5.87), (-3149.27, -1438.8, 5.87)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1018251629")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1018251629", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1018251635 (secondary)
pts = [(-3787.02, -2724.49, 0.3), (-3782.68, -2719.73, 0.16), (-3777.2, -2713.71, 0.16)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1018251635")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1018251635", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1022926486 (tertiary)
pts = [(3123.41, -248.29, 12.09), (3124.56, -259.8, 11.04), (3126.48, -303.95, 10.86)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1022926486")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1022926486", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1026490363 (secondary)
pts = [(271.59, -2766.54, 8.69), (325.73, -2754.85, 10.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1026490363")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1026490363", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1026490364 (secondary)
pts = [(324.95, -2744.92, 10.15), (325.73, -2754.85, 10.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1026490364")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1026490364", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1026490365 (tertiary)
pts = [(325.73, -2754.85, 10.15), (366.66, -2743.46, 10.64)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1026490365")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1026490365", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1044808422 (tertiary)
pts = [(3979.5, -2017.0, 4.3), (3991.53, -2011.66, 4.3), (4002.21, -2006.91, 3.89), (4050.2, -1982.27, 3.57), (4093.99, -1959.4, 2.77), (4138.73, -1936.48, 2.05), (4165.19, -1919.25, 1.8), (4178.89, -1909.16, 1.0), (4195.97, -1897.93, 1.0), (4235.42, -1874.21, 0.28), (4290.77, -1842.27, -0.14), (4391.66, -1785.71, -0.87), (4436.49, -1757.37, -0.48)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1044808422")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1044808422", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1051888172 (tertiary)
pts = [(1586.28, -2610.66, 13.73), (1588.74, -2614.61, 13.73), (1607.64, -2645.53, 13.73), (1608.23, -2646.49, 13.73)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1051888172")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1051888172", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1051888173 (tertiary)
pts = [(1608.23, -2646.49, 13.73), (1630.36, -2685.5, 13.9), (1629.64, -2691.39, 13.9), (1627.04, -2695.15, 13.9), (1598.71, -2710.3, 13.73), (1593.53, -2715.04, 13.73), (1592.6, -2722.75, 13.73), (1595.01, -2731.75, 13.73), (1643.04, -2858.26, 14.33), (1747.35, -3093.8, 14.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1051888173")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1051888173", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1056837723 (tertiary)
pts = [(-22.72, 3168.48, -12.66), (-14.24, 3136.65, -12.66)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1056837723")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1056837723", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1074207767 (secondary)
pts = [(-2884.13, 2801.42, -16.55), (-2875.12, 2817.62, -21.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1074207767")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1074207767", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1074207768 (secondary)
pts = [(-2852.66, 2856.12, -23.75), (-2851.72, 2860.1, -23.75), (-2852.32, 2871.96, -22.63)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1074207768")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1074207768", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1074822887 (tertiary)
pts = [(-3776.85, 3423.13, -23.98), (-3810.61, 3456.93, -24.72), (-3864.36, 3511.26, -25.13), (-3874.13, 3522.02, -25.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1074822887")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1074822887", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1103671205 (tertiary)
pts = [(1499.88, -497.36, 13.8), (1264.84, -487.34, 14.76), (1229.31, -485.79, 14.71), (1086.5, -479.45, 14.19)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1103671205")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1103671205", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152365766 (secondary)
pts = [(-2088.15, -322.53, -7.44), (-2093.47, -327.41, -7.44), (-2102.59, -333.19, -2.18), (-2114.52, -340.44, -2.18)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152365766")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152365766", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152365767 (secondary)
pts = [(-2114.52, -340.44, -2.18), (-2104.44, -339.21, -2.18), (-2092.07, -335.73, -7.44), (-2081.59, -335.58, -7.44)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152365767")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152365767", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152365768 (secondary)
pts = [(-2054.64, -333.97, -8.18), (-2046.23, -332.5, -8.18), (-2015.05, -333.0, -6.52)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152365768")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152365768", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152373637 (tertiary)
pts = [(-1109.26, -365.22, -10.76), (-1112.54, -371.89, -10.76), (-1113.64, -379.37, -10.41), (-1114.63, -386.37, -10.41), (-1116.5, -392.88, -10.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152373637")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152373637", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152373638 (tertiary)
pts = [(-1109.26, -365.22, -10.76), (-1108.1, -351.76, -10.76)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152373638")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152373638", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152373639 (secondary)
pts = [(-1090.17, -413.15, -9.09), (-1079.3, -411.19, -8.6), (-1067.76, -409.89, -8.6), (-1051.53, -405.0, -11.8)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152373639")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152373639", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152373642 (secondary)
pts = [(-1153.75, -409.12, -4.73), (-1145.4, -412.71, -4.73), (-1124.58, -413.54, -8.58), (-1119.24, -414.39, -9.09)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152373642")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152373642", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152373643 (secondary)
pts = [(-1153.75, -409.12, -4.73), (-1183.12, -405.92, -6.69), (-1213.71, -401.03, -5.5)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152373643")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152373643", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152376303 (secondary)
pts = [(889.77, -731.5, 14.59), (860.61, -761.36, 13.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152376303")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152376303", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152376442 (secondary)
pts = [(1074.1, -448.44, 13.69), (1058.36, -478.42, 21.61)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152376442")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152376442", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1152376443 (tertiary)
pts = [(1086.5, -479.45, 14.19), (1067.54, -478.75, 14.19), (1058.36, -478.42, 21.61)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1152376443")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1152376443", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1164516073 (tertiary)
pts = [(202.68, 2272.83, -11.95), (208.74, 2234.81, -14.08), (213.23, 2207.53, -13.62), (216.0, 2185.28, -13.0), (222.51, 2125.76, -12.87), (223.03, 2113.45, -10.21), (222.76, 2106.11, -10.21)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1164516073")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1164516073", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1164516081 (secondary)
pts = [(-3452.48, 3092.56, -21.16), (-3413.37, 3094.28, -23.26), (-3384.2, 3096.3, -23.26), (-3360.51, 3098.49, -22.9), (-3331.24, 3101.46, -22.9), (-3292.4, 3105.2, -18.13)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1164516081")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1164516081", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1296978049 (tertiary)
pts = [(-78.03, 3504.7, -11.45), (-67.71, 3431.8, -11.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1296978049")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1296978049", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1296978050 (tertiary)
pts = [(-67.71, 3431.8, -11.45), (-66.15, 3420.19, -11.45), (-58.8, 3365.58, -11.45)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1296978050")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1296978050", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1305800603 (secondary)
pts = [(-2903.66, -588.57, -7.43), (-2892.68, -573.95, -9.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1305800603")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1305800603", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1305800604 (tertiary)
pts = [(-2920.92, -373.34, 1.64), (-2917.53, -330.17, -1.24), (-2915.62, -304.29, -2.09), (-2912.62, -282.73, -5.04)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1305800604")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1305800604", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1412111380 (secondary)
pts = [(-2854.44, 1187.84, -15.02), (-2850.67, 1168.16, -15.02), (-2840.13, 1131.0, -14.68)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1412111380")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1412111380", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1424622086 (secondary)
pts = [(-4760.28, 1530.73, -20.12), (-4775.84, 1521.12, -20.12), (-4817.97, 1495.75, -20.23), (-4832.63, 1486.02, -20.23), (-4850.28, 1473.95, -19.41)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1424622086")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1424622086", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1444942405 (secondary)
pts = [(325.73, -2754.85, 10.15), (326.05, -2757.93, 10.15), (342.0, -2909.01, 10.15), (345.58, -2977.83, 10.15), (344.34, -3050.41, 10.15)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1444942405")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1444942405", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1444942407 (tertiary)
pts = [(-2859.04, -1512.43, 4.9), (-2877.25, -1510.05, 7.62), (-2890.71, -1508.03, 7.62), (-2911.9, -1504.39, 2.55)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1444942407")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1444942407", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1444942408 (tertiary)
pts = [(-2834.89, -1515.18, 4.26), (-2842.62, -1514.23, 4.26), (-2859.04, -1512.43, 4.9)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1444942408")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1444942408", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1498285739 (motorway)
pts = [(3379.64, 1514.16, 1.07), (3197.48, 1498.05, -3.26), (2987.52, 1481.17, -6.64), (2744.92, 1461.17, -12.5), (2629.71, 1448.85, -12.68), (2534.89, 1437.7, -9.62), (2494.79, 1431.9, -10.64), (2449.55, 1425.24, -12.99)]
if len(pts) >= 2:
    half_w = 6.0
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

# Segment 1512053745 (tertiary)
pts = [(2461.56, 3597.54, -12.32), (2416.24, 3587.1, -15.09), (2399.68, 3582.16, -15.09), (2385.72, 3575.38, -15.94), (2371.09, 3565.78, -15.94), (2358.68, 3554.86, -14.79), (2355.61, 3551.23, -14.79)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1512053745")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1512053745", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1512053746 (tertiary)
pts = [(2528.49, 3659.66, -11.03), (2528.96, 3643.05, -11.03), (2528.12, 3635.03, -11.03), (2525.44, 3627.53, -11.03), (2521.26, 3621.86, -11.03), (2515.53, 3617.2, -11.03), (2503.21, 3610.32, -11.03), (2489.63, 3605.02, -11.62), (2474.65, 3600.55, -12.32), (2461.56, 3597.54, -12.32)]
if len(pts) >= 2:
    half_w = 3.25
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1512053746")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1512053746", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1513143689 (motorway)
pts = [(-371.71, 635.49, -8.51), (38.39, 770.61, -13.07), (171.79, 812.55, -15.42), (346.51, 865.02, -14.38), (521.94, 914.21, -13.32), (523.35, 914.61, -13.32), (524.91, 915.07, -13.32)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1513143689")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1513143689", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1513143699 (motorway)
pts = [(-1382.03, 301.12, -9.54), (-1292.78, 330.79, -7.71)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1513143699")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1513143699", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)

# Segment 1513143700 (motorway)
pts = [(-2314.24, -27.36, -6.27), (-2146.17, 35.85, -7.09)]
if len(pts) >= 2:
    half_w = 6.0
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
            
    mesh_data = bpy.data.meshes.new("Mesh_1513143700")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    
    obj = bpy.data.objects.new("Road_1513143700", mesh_data)
    coll.objects.link(obj)
    if mat_road:
        obj.data.materials.append(mat_road)
