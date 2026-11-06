import bpy
import mathutils

coll_name = "A2_Rhynern_Interchange_3D"
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

# Segment 8088288 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "Rhynern_motorway_8088288"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3420.65, 1517.33, 8.65), (3379.64, 1514.16, 8.57)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 8088808 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "Rhynern_motorway_8088808"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3407.88, 1499.81, 3.67), (3576.52, 1513.96, 4.94), (3874.71, 1539.06, 8.2)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 8089228 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "Rhynern_motorway_8089228"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3366.21, 1496.59, 9.21), (3407.88, 1499.81, 11.17)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 23196719 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_23196719"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3838.02, 1929.7, 7.1), (3791.31, 1911.3, 5.45), (3761.81, 1897.69, 4.0), (3733.93, 1882.89, 3.85), (3703.72, 1863.94, 3.22), (3672.93, 1841.79, 3.91), (3633.35, 1806.4, 3.28), (3611.28, 1782.89, 2.71), (3571.69, 1733.36, 1.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 26464323 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "Rhynern_motorway_26464323"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2449.55, 1425.24, -12.99), (2401.35, 1418.15, -13.85), (2324.52, 1405.3, -13.66), (2239.08, 1389.14, -13.68), (2147.84, 1370.7, -13.7), (2059.01, 1350.15, -12.79), (1970.22, 1328.62, -14.36), (1845.35, 1295.72, -14.36), (1809.85, 1286.36, -13.72), (1645.83, 1240.81, -13.78), (1464.98, 1190.8, -13.03), (995.61, 1061.26, -13.38), (610.92, 955.02, -14.37), (516.87, 928.87, -13.82), (481.16, 918.95, -13.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 102150740 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "Rhynern_motorway_102150740"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(524.91, 915.07, -13.32), (999.45, 1046.51, -13.38), (1181.22, 1096.87, -13.32), (1369.47, 1148.29, -14.99), (1466.57, 1175.37, -13.03), (1647.66, 1224.83, -13.38), (1812.85, 1270.83, -13.72), (1898.11, 1294.74, -14.69), (1974.51, 1314.17, -13.39), (2062.14, 1335.4, -12.79), (2153.18, 1355.39, -13.7), (2236.37, 1372.94, -12.84), (2325.95, 1389.69, -13.66), (2407.78, 1403.5, -13.27), (2538.81, 1422.65, -9.62), (2635.06, 1433.96, -12.91), (2745.62, 1444.71, -12.08), (2880.21, 1456.07, -11.49), (2972.29, 1463.75, -7.85), (2987.38, 1465.01, -7.85), (3198.93, 1482.69, -3.26), (3366.21, 1496.59, 1.71)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 130987118 (Type: secondary, Lanes: 1, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_130987118"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(1910.88, 484.6, -3.28), (1913.52, 479.84, -3.28), (1917.51, 476.11, -3.28), (1922.46, 473.82, -3.28), (1927.89, 473.19, -3.28), (1933.23, 474.27, -2.53), (1937.98, 476.96, -2.53), (1941.65, 480.99, -2.53), (1943.9, 485.97, -2.53), (1944.47, 491.39, -4.31), (1943.34, 496.73, -4.31), (1940.43, 501.65, -4.31), (1936.08, 505.36, -4.31), (1930.75, 507.47, -4.31), (1925.03, 507.7, -4.85), (1919.55, 506.07, -4.85), (1914.89, 502.73, -4.85), (1911.26, 497.35, -4.85), (1909.85, 491.02, -4.85), (1910.88, 484.6, -3.28)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 130987119 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_130987119"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(1901.3, 481.1, -4.14), (1838.29, 456.78, 0.24), (1725.58, 413.25, -5.86), (1693.01, 400.67, -5.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 137056721 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_137056721"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2371.81, 662.46, -3.27), (2332.99, 646.93, -3.65), (2312.16, 638.6, -0.41), (2235.33, 608.88, -1.63), (2180.32, 587.95, -2.65), (2115.2, 563.05, -4.31), (1951.57, 499.96, -4.31), (1943.34, 496.73, -4.31)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 137056722 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_137056722"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3082.89, 1269.26, -4.68), (3047.87, 1241.64, -5.61), (3006.08, 1208.69, -5.13), (2967.29, 1174.97, -4.93), (2921.2, 1132.09, -3.51), (2852.97, 1062.66, -4.92), (2830.05, 1037.27, -6.26)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 270684301 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "Rhynern_motorway_270684301"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3894.39, 1556.84, 11.33), (3810.83, 1550.18, 8.66), (3575.16, 1530.24, 4.94), (3420.65, 1517.33, 1.15)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 425750949 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_425750949"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2830.05, 1037.27, -6.26), (2768.96, 968.3, -0.69), (2714.19, 906.02, -5.59), (2684.13, 873.15, -5.12)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 427160544 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_427160544"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3566.19, 1725.55, 1.0), (3518.79, 1657.95, 1.31), (3455.22, 1572.57, 0.72), (3404.23, 1514.47, 1.15), (3366.7, 1476.35, 2.07), (3355.64, 1466.7, 1.28), (3350.91, 1462.56, 1.28), (3328.83, 1444.71, 3.37), (3291.02, 1415.06, 0.01), (3246.18, 1382.57, -1.19), (3151.67, 1318.01, -2.87), (3144.97, 1313.38, -2.87), (3138.37, 1308.81, -2.87), (3082.89, 1269.26, -4.68)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 427162186 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_427162186"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3571.69, 1733.36, 1.0), (3566.19, 1725.55, 1.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 494966488 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_494966488"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(1463.51, 298.74, -4.82), (1420.54, 265.44, 4.55), (1369.62, 214.31, -0.5), (1329.55, 158.93, 6.89), (1309.46, 121.92, 6.41), (1292.5, 87.66, 9.9), (1271.85, 37.3, 6.69)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 664213525 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_664213525"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(1693.01, 400.67, -5.41), (1562.97, 351.99, -5.11), (1509.2, 327.59, -3.19), (1463.51, 298.74, -4.82)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 791472616 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_791472616"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2684.13, 873.15, -5.12), (2627.11, 819.51, 0.0), (2615.14, 809.2, -4.21), (2603.55, 799.23, -4.21), (2588.81, 788.19, -2.39), (2555.19, 761.71, -1.21), (2533.22, 747.39, -2.55), (2516.85, 736.81, -2.55)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 791670858 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_791670858"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3896.06, 1947.13, 7.71), (3879.62, 1943.13, 7.22), (3868.21, 1939.85, 7.22), (3838.02, 1929.7, 7.1)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 793787586 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_793787586"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(1910.88, 484.6, -3.28), (1901.3, 481.1, -4.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 793787587 (Type: secondary, Lanes: 2, Width: 6.5m, Bridge: False)
c_name = "Rhynern_secondary_793787587"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 3.25 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2516.85, 736.81, -2.55), (2468.52, 708.4, -3.04), (2433.43, 690.66, -1.74), (2421.15, 684.83, -4.05), (2397.19, 673.48, -0.97), (2384.97, 667.94, -3.27), (2371.81, 662.46, -3.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Segment 1498285739 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "Rhynern_motorway_1498285739"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt road ribbon
cd.extrude = 6.0 # Flat road width
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3379.64, 1514.16, 1.07), (3197.48, 1498.05, -3.26), (2987.52, 1481.17, -6.64), (2744.92, 1461.17, -12.5), (2629.71, 1448.85, -12.68), (2534.89, 1437.7, -9.62), (2494.79, 1431.9, -10.64), (2449.55, 1425.24, -12.99)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
