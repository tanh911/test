import bpy

coll_name = "OSM_Autobahn_Full_Network"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")

# Highway 4685992 (motorway_link bridge=False)
c_name = "OSM_motorway_link_4685992"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2313.19, -1500.81, 16.45), (-2291.54, -1494.01, 14.67), (-2280.87, -1487.38, 14.67), (-2265.39, -1480.63, 12.92), (-2179.77, -1444.13, 9.66), (-2153.8, -1435.68, 8.91), (-2143.7, -1435.06, 8.91), (-2133.6, -1436.94, 8.91), (-2125.18, -1441.98, 8.01), (-2117.84, -1449.0, 8.01), (-2112.25, -1458.83, 7.51), (-2110.01, -1467.46, 7.51), (-2109.65, -1476.96, 7.51), (-2111.68, -1486.17, 6.91), (-2115.44, -1493.94, 6.91), (-2120.56, -1499.1, 6.91), (-2125.74, -1504.74, 6.91), (-2136.23, -1511.19, 12.92), (-2165.25, -1522.33, 7.55), (-2178.64, -1534.16, 11.62)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 4686300 (motorway_link bridge=False)
c_name = "OSM_motorway_link_4686300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2631.84, -1720.95, 12.31), (-2587.82, -1715.59, 11.09), (-2574.29, -1715.21, 9.34), (-2560.18, -1715.93, 8.72), (-2546.09, -1720.05, 8.72), (-2529.07, -1729.09, 10.78), (-2512.68, -1744.16, 10.78), (-2501.03, -1756.14, 9.47), (-2500.98, -1756.19, 9.47), (-2490.27, -1767.27, 10.28)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 5733983 (motorway_link bridge=False)
c_name = "OSM_motorway_link_5733983"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4130.87, -110.31, 28.46), (4130.76, -102.25, 28.46), (4128.06, -91.01, 30.33), (4127.86, -82.97, 30.33), (4129.48, -74.67, 30.33), (4134.69, -63.09, 30.33), (4142.3, -52.72, 29.38), (4155.95, -43.72, 29.38), (4170.16, -37.69, 29.73), (4182.13, -28.7, 29.66)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088287 (motorway bridge=False)
c_name = "OSM_motorway_8088287"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4286.1, -4.23, 27.98), (4231.56, -8.48, 27.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088288 (motorway bridge=True)
c_name = "OSM_motorway_8088288"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3351.36, -82.64, 19.75), (3310.37, -85.81, 19.67)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088712 (motorway bridge=True)
c_name = "OSM_motorway_8088712"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4307.24, -2.63, 35.48), (4286.1, -4.23, 35.48)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088808 (motorway bridge=False)
c_name = "OSM_motorway_8088808"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3338.6, -100.16, 14.77), (3507.21, -86.01, 16.03), (3805.36, -60.92, 19.29)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088988 (motorway bridge=True)
c_name = "OSM_motorway_8088988"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4287.56, -19.73, 35.48), (4308.69, -18.0, 35.48)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8089228 (motorway bridge=True)
c_name = "OSM_motorway_8089228"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3296.93, -103.38, 20.3), (3338.6, -100.16, 22.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 24738807 (motorway_link bridge=False)
c_name = "OSM_motorway_link_24738807"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-1959.9, -1453.34, 4.68), (-2008.24, -1462.56, 4.1), (-2026.72, -1464.09, 4.26), (-2032.61, -1464.19, 4.26), (-2039.9, -1463.32, 4.26), (-2059.17, -1456.91, 6.15), (-2073.36, -1450.13, 6.28), (-2099.59, -1434.44, 6.28), (-2113.65, -1427.46, 8.01), (-2133.45, -1424.81, 8.91), (-2154.03, -1426.44, 8.91), (-2180.51, -1436.45, 9.66), (-2219.48, -1452.7, 12.75)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414506 (motorway_link bridge=False)
c_name = "OSM_motorway_link_25414506"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4179.63, -12.88, 29.66), (4166.02, -5.72, 29.66), (4152.23, -1.43, 29.23), (4149.37, -0.3, 29.23), (4138.38, 5.48, 30.68), (4128.35, 15.1, 30.68), (4120.94, 27.84, 30.68), (4118.39, 40.39, 31.14), (4119.76, 51.57, 31.14), (4119.49, 62.29, 26.9)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414544 (motorway_link bridge=False)
c_name = "OSM_motorway_link_25414544"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4282.59, 147.67, 28.23), (4275.47, 134.77, 28.23), (4273.58, 128.05, 25.09), (4267.81, 117.9, 25.27), (4262.55, 110.91, 25.27), (4258.8, 106.13, 25.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479770 (motorway bridge=True)
c_name = "OSM_motorway_25479770"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1361.33, -1269.19, 10.89), (-1339.52, -1262.11, 9.64)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479783 (motorway bridge=False)
c_name = "OSM_motorway_25479783"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1162.52, -1187.81, 3.35), (-1328.34, -1242.4, 2.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479784 (motorway bridge=True)
c_name = "OSM_motorway_25479784"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1128.24, -1176.35, 14.13), (-1162.52, -1187.81, 10.85)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479799 (motorway bridge=True)
c_name = "OSM_motorway_25479799"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1171.99, -1206.49, 13.92), (-1134.9, -1194.42, 13.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479800 (motorway bridge=False)
c_name = "OSM_motorway_25479800"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1134.9, -1194.42, 5.77), (-970.18, -1140.34, 4.25), (-838.33, -1095.95, 5.52), (-639.36, -1030.27, 4.42), (-560.74, -1004.27, 3.9), (-440.41, -964.49, 2.59)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25558324 (motorway_link bridge=False)
c_name = "OSM_motorway_link_25558324"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2425.54, -1827.18, 8.93), (-2441.53, -1808.9, 10.24), (-2451.38, -1797.93, 10.24), (-2462.14, -1785.97, 9.74), (-2475.52, -1763.36, 10.28), (-2479.16, -1753.53, 9.47), (-2482.46, -1741.64, 9.47), (-2482.51, -1724.48, 9.79), (-2481.55, -1710.82, 9.79), (-2477.85, -1700.02, 9.79), (-2471.41, -1686.52, 9.05), (-2463.74, -1676.87, 9.05), (-2455.75, -1668.86, 9.05), (-2428.39, -1644.53, 9.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25824302 (motorway_link bridge=False)
c_name = "OSM_motorway_link_25824302"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4046.54, -39.93, 28.22), (4063.83, -48.62, 28.22), (4080.3, -53.77, 28.22), (4094.48, -63.28, 28.59), (4105.8, -76.6, 30.33), (4118.04, -97.01, 28.46), (4122.52, -103.66, 28.46), (4130.87, -110.31, 28.46)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 26464323 (motorway bridge=False)
c_name = "OSM_motorway_26464323"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(2380.41, -174.73, -1.89), (2332.23, -181.82, -2.75), (2255.41, -194.67, -2.56), (2169.98, -210.83, -2.58), (2078.76, -229.27, -2.6), (1989.94, -249.82, -1.69), (1901.16, -271.36, -3.26), (1776.32, -304.25, -3.26), (1740.82, -313.61, -2.63), (1576.82, -359.17, -2.68), (1396.0, -409.17, -1.93), (926.7, -538.71, -2.28), (542.07, -644.95, -3.28), (448.04, -671.1, -2.72), (412.33, -681.03, -2.38)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34083862 (motorway bridge=False)
c_name = "OSM_motorway_34083862"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4308.69, -18.0, 27.98), (4418.85, -8.49, 28.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137267 (primary bridge=False)
c_name = "OSM_primary_34137267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4345.01, -447.36, 19.98), (4330.86, -348.47, 22.13), (4328.34, -323.74, 20.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137268 (primary bridge=False)
c_name = "OSM_primary_34137268"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4249.95, 422.88, 20.9), (4248.85, 431.0, 20.9), (4248.36, 434.95, 19.44), (4246.31, 451.2, 19.44)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137269 (primary bridge=False)
c_name = "OSM_primary_34137269"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4307.38, -138.52, 22.73), (4306.13, -127.72, 22.73)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137270 (primary bridge=False)
c_name = "OSM_primary_34137270"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4286.79, 98.17, 24.59), (4285.75, 109.01, 24.59)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137271 (primary bridge=False)
c_name = "OSM_primary_34137271"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4285.75, 109.01, 24.59), (4284.64, 121.14, 24.59), (4282.59, 147.67, 24.73)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870534 (motorway_link bridge=False)
c_name = "OSM_motorway_link_40870534"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4301.9, -85.18, 31.66), (4294.92, -101.58, 26.22), (4293.74, -105.43, 26.22), (4287.84, -118.82, 26.22), (4281.76, -126.52, 26.23), (4279.59, -129.65, 26.23)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870542 (motorway_link bridge=False)
c_name = "OSM_motorway_link_40870542"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2397.69, -1803.2, 10.17), (-2413.45, -1808.02, 10.17), (-2424.08, -1810.92, 10.24), (-2441.53, -1808.9, 10.24)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82105961 (motorway bridge=False)
c_name = "OSM_motorway_82105961"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1451.13, -1282.57, 0.39), (-1515.17, -1303.76, 0.63), (-1594.0, -1329.4, 1.41), (-1704.57, -1366.42, 0.08), (-1739.58, -1378.19, -0.24), (-1751.75, -1382.29, -0.24), (-1787.92, -1394.45, -0.02)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551561 (primary bridge=False)
c_name = "OSM_primary_82551561"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4301.9, -85.18, 28.16), (4300.28, -63.12, 28.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551562 (primary bridge=False)
c_name = "OSM_primary_82551562"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4306.13, -127.72, 22.73), (4304.7, -116.3, 22.72), (4303.11, -94.99, 22.72)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551563 (primary bridge=False)
c_name = "OSM_primary_82551563"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4282.59, 147.67, 24.73), (4279.23, 189.07, 23.67)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 91388388 (motorway bridge=False)
c_name = "OSM_motorway_91388388"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4666.01, 13.27, 27.95), (4753.55, 27.0, 26.81), (4811.67, 37.92, 26.39), (4878.07, 52.36, 26.29), (4971.58, 77.2, 24.83), (4982.64, 80.13, 24.83), (5003.24, 85.57, 23.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 101496464 (motorway bridge=False)
c_name = "OSM_motorway_101496464"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(176.33, -748.91, -2.76), (13.41, -799.41, -2.42), (-34.17, -814.9, -1.97), (-200.41, -869.01, -1.1), (-444.3, -949.69, 0.19), (-569.15, -991.07, 3.9), (-975.57, -1125.75, 4.25), (-1128.24, -1176.35, 6.63)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 102150740 (motorway bridge=False)
c_name = "OSM_motorway_102150740"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(456.08, -684.91, -2.22), (930.54, -553.46, -2.28), (1112.29, -503.1, -2.22), (1300.5, -451.68, -3.89), (1397.59, -424.61, -1.93), (1578.66, -375.14, -2.28), (1743.82, -329.14, -2.63), (1829.06, -305.23, -3.59), (1905.45, -285.81, -2.29), (1993.07, -264.58, -1.69), (2084.09, -244.58, -2.6), (2167.27, -227.03, -1.74), (2256.84, -210.29, -2.56), (2338.66, -196.47, -2.17), (2469.66, -177.32, 1.48), (2565.9, -166.01, -1.81), (2676.44, -155.26, -0.98), (2811.01, -143.9, -0.39), (2903.08, -136.22, 3.24), (2918.17, -134.97, 3.24), (3129.68, -117.28, 7.84), (3296.93, -103.38, 12.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 108038267 (motorway bridge=False)
c_name = "OSM_motorway_108038267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(412.33, -681.03, -2.38), (294.09, -714.12, -1.82), (176.33, -748.91, -2.76)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645546 (motorway bridge=False)
c_name = "OSM_motorway_123645546"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1339.52, -1262.11, 2.14), (-1171.99, -1206.49, 6.42)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645548 (motorway bridge=True)
c_name = "OSM_motorway_123645548"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1344.21, -1247.26, 9.64), (-1367.9, -1255.1, 8.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513893 (motorway_link bridge=False)
c_name = "OSM_motorway_link_146513893"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4119.49, 62.29, 26.9), (4113.56, 55.45, 31.14), (4109.23, 47.22, 31.14), (4100.65, 27.34, 28.84), (4095.1, 15.66, 28.84), (4085.98, 4.35, 28.84), (4076.78, -5.02, 26.28), (4061.18, -12.28, 26.28), (4042.02, -24.68, 25.82)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513897 (motorway_link bridge=False)
c_name = "OSM_motorway_link_146513897"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4285.75, 109.01, 28.09), (4258.8, 106.13, 25.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 186513187 (motorway_link bridge=False)
c_name = "OSM_motorway_link_186513187"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2305.27, -1533.16, 18.97), (-2302.39, -1516.71, 18.97), (-2297.96, -1503.7, 14.67), (-2291.54, -1494.01, 14.67)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980108 (primary bridge=False)
c_name = "OSM_primary_223980108"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4254.56, 390.58, 21.43), (4252.63, 403.99, 20.9), (4251.27, 413.39, 20.9)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980109 (primary bridge=False)
c_name = "OSM_primary_223980109"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4260.97, 339.7, 22.6), (4254.56, 390.58, 21.43)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980110 (primary bridge=False)
c_name = "OSM_primary_223980110"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4246.31, 451.2, 19.44), (4239.38, 502.76, 21.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980111 (primary bridge=False)
c_name = "OSM_primary_223980111"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4229.62, 584.71, 22.53), (4226.51, 609.53, 21.99), (4202.87, 821.85, 15.66), (4096.18, 1759.72, 5.47), (4074.12, 1957.89, 4.63)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684299 (motorway bridge=False)
c_name = "OSM_motorway_270684299"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2343.65, -1596.33, 8.4), (-2702.49, -1731.46, 7.37), (-2841.64, -1783.36, 9.31), (-2863.04, -1791.54, 5.74), (-3173.73, -1911.32, 5.32), (-3548.73, -2052.75, 7.3)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684300 (motorway bridge=False)
c_name = "OSM_motorway_270684300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4046.54, -39.93, 24.72), (4182.13, -28.7, 26.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684301 (motorway bridge=False)
c_name = "OSM_motorway_270684301"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3825.03, -43.13, 22.43), (3741.49, -49.79, 19.76), (3505.86, -69.73, 16.03), (3351.36, -82.64, 12.25)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684305 (motorway bridge=False)
c_name = "OSM_motorway_270684305"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3805.36, -60.92, 19.29), (3830.69, -58.96, 22.43), (4015.25, -42.66, 23.76)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684308 (motorway bridge=False)
c_name = "OSM_motorway_270684308"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4432.84, 7.81, 26.44), (4393.83, 5.07, 25.94), (4307.24, -2.63, 27.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684310 (motorway bridge=False)
c_name = "OSM_motorway_270684310"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4182.13, -28.7, 26.16), (4232.45, -24.14, 27.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684312 (motorway bridge=False)
c_name = "OSM_motorway_270684312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2178.64, -1534.16, 8.12), (-2343.65, -1596.33, 8.4)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684313 (motorway bridge=False)
c_name = "OSM_motorway_270684313"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2428.39, -1644.53, 5.91), (-2382.64, -1627.33, 4.83)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684315 (motorway bridge=False)
c_name = "OSM_motorway_270684315"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4042.02, -24.68, 22.32), (3995.85, -28.25, 21.57)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684316 (motorway bridge=False)
c_name = "OSM_motorway_270684316"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4179.63, -12.88, 26.16), (4042.02, -24.68, 22.32)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684321 (motorway bridge=False)
c_name = "OSM_motorway_270684321"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4418.85, -8.49, 28.88), (4426.22, -7.7, 28.88), (4610.45, 7.62, 27.82), (4666.01, 13.27, 27.95)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684326 (motorway bridge=False)
c_name = "OSM_motorway_270684326"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1787.92, -1394.45, -0.02), (-1821.84, -1406.2, 1.41), (-1921.32, -1440.17, 0.62), (-1959.9, -1453.34, 1.18)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684327 (motorway bridge=False)
c_name = "OSM_motorway_270684327"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1959.9, -1453.34, 1.18), (-2052.55, -1486.94, 1.68), (-2178.64, -1534.16, 8.12)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684330 (motorway bridge=False)
c_name = "OSM_motorway_270684330"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2631.84, -1720.95, 8.81), (-2428.39, -1644.53, 5.91)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293856340 (motorway_link bridge=False)
c_name = "OSM_motorway_link_293856340"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4268.95, -133.62, 26.8), (4291.98, -138.98, 26.23), (4307.38, -138.52, 26.23)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857346 (primary bridge=False)
c_name = "OSM_primary_293857346"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4294.62, 9.19, 23.18), (4290.39, 58.15, 22.64)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857347 (primary bridge=False)
c_name = "OSM_primary_293857347"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4303.11, -94.99, 22.72), (4301.9, -85.18, 28.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857348 (primary bridge=False)
c_name = "OSM_primary_293857348"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4290.39, 58.15, 22.64), (4288.42, 81.84, 24.3), (4286.79, 98.17, 24.59)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857349 (primary bridge=False)
c_name = "OSM_primary_293857349"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4328.34, -323.74, 20.16), (4313.94, -205.43, 24.99)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857350 (primary bridge=False)
c_name = "OSM_primary_293857350"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4313.94, -205.43, 24.99), (4307.84, -143.2, 22.73), (4307.38, -138.52, 22.73)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857801 (motorway_link bridge=False)
c_name = "OSM_motorway_link_293857801"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4252.48, 102.85, 24.51), (4272.23, 97.25, 25.27), (4286.79, 98.17, 28.09)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861512 (motorway_link bridge=False)
c_name = "OSM_motorway_link_293861512"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2219.48, -1452.7, 12.75), (-2283.34, -1479.18, 13.3), (-2294.78, -1483.92, 14.67), (-2300.37, -1486.18, 16.45), (-2300.98, -1486.32, 16.45), (-2315.64, -1491.05, 16.45)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861515 (motorway_link bridge=False)
c_name = "OSM_motorway_link_293861515"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2490.27, -1767.27, 10.28), (-2447.31, -1815.0, 10.24), (-2445.56, -1817.13, 10.24), (-2444.43, -1818.63, 10.24), (-2444.3, -1818.79, 10.24), (-2433.34, -1832.6, 8.93)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293862838 (primary bridge=False)
c_name = "OSM_primary_293862838"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4239.38, 502.76, 21.98), (4236.05, 531.08, 22.85)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 308444312 (motorway bridge=False)
c_name = "OSM_motorway_308444312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2214.59, -1564.13, 4.01), (-2065.99, -1508.49, 1.68), (-1916.76, -1454.73, 0.41), (-1842.37, -1429.48, 1.44), (-1661.09, -1368.18, 1.56), (-1450.57, -1298.85, 1.56)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990379 (primary bridge=False)
c_name = "OSM_primary_496990379"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4278.0, 202.77, 23.67), (4260.97, 339.7, 22.6)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990380 (primary bridge=False)
c_name = "OSM_primary_496990380"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4279.23, 189.07, 23.67), (4278.0, 202.77, 23.67)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990381 (motorway bridge=False)
c_name = "OSM_motorway_496990381"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3995.85, -28.25, 21.57), (3825.03, -43.13, 22.43)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990382 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496990382"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4258.8, 106.13, 25.27), (4252.48, 102.85, 24.51)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990383 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496990383"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4237.63, 101.61, 24.51), (4252.48, 102.85, 24.51)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990384 (motorway bridge=False)
c_name = "OSM_motorway_496990384"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4231.56, -8.48, 27.16), (4179.63, -12.88, 26.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990385 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496990385"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4119.49, 62.29, 26.9), (4126.63, 73.66, 26.9), (4133.58, 80.88, 26.9), (4140.0, 85.38, 30.72), (4148.72, 89.88, 30.72), (4156.49, 92.76, 25.51), (4168.3, 95.47, 27.11), (4190.23, 97.62, 27.11), (4237.63, 101.61, 24.51)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990998 (primary bridge=False)
c_name = "OSM_primary_496990998"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4300.28, -63.12, 28.16), (4294.62, 9.19, 23.18)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992656 (motorway bridge=False)
c_name = "OSM_motorway_496992656"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4232.45, -24.14, 27.16), (4287.56, -19.73, 27.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992657 (motorway bridge=False)
c_name = "OSM_motorway_496992657"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4015.25, -42.66, 23.76), (4046.54, -39.93, 24.72)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992658 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496992658"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4279.59, -129.65, 26.23), (4268.95, -133.62, 26.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992659 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496992659"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4130.87, -110.31, 28.46), (4141.59, -122.29, 28.16), (4149.73, -128.41, 28.31), (4159.32, -133.06, 27.78), (4169.99, -137.4, 27.78), (4181.71, -139.4, 27.78)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992660 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496992660"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4181.71, -139.4, 27.78), (4192.09, -139.61, 27.78), (4268.95, -133.62, 26.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992661 (motorway_link bridge=False)
c_name = "OSM_motorway_link_496992661"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4306.13, -127.72, 26.23), (4279.59, -129.65, 26.23)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996171 (primary bridge=False)
c_name = "OSM_primary_496996171"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4251.27, 413.39, 20.9), (4249.95, 422.88, 20.9)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996574 (primary bridge=False)
c_name = "OSM_primary_496996574"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4231.72, 566.33, 22.53), (4229.62, 584.71, 22.53)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996575 (primary bridge=False)
c_name = "OSM_primary_496996575"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4236.05, 531.08, 22.85), (4231.72, 566.33, 22.53)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593545707 (motorway bridge=False)
c_name = "OSM_motorway_593545707"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4885.04, 70.22, 25.77), (4813.3, 53.89, 26.39), (4745.24, 41.14, 28.33), (4668.13, 29.67, 27.95), (4610.23, 23.01, 27.82), (4588.61, 21.45, 28.52), (4492.84, 13.77, 27.79), (4432.84, 7.81, 26.44)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561591 (motorway bridge=False)
c_name = "OSM_motorway_593561591"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1367.9, -1255.1, 1.48), (-1451.13, -1282.57, 0.39)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561592 (motorway bridge=False)
c_name = "OSM_motorway_593561592"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1328.34, -1242.4, 2.14), (-1331.4, -1243.41, 2.14), (-1344.21, -1247.26, 2.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1498285739 (motorway bridge=False)
c_name = "OSM_motorway_1498285739"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3310.37, -85.81, 12.17), (3128.23, -101.93, 7.84), (2918.31, -118.81, 4.46), (2675.74, -138.8, -1.41), (2560.56, -151.13, -1.58), (2465.74, -162.27, 1.48), (2425.66, -168.08, 0.46), (2380.41, -174.73, -1.89)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143689 (motorway bridge=False)
c_name = "OSM_motorway_1513143689"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-440.41, -964.49, 2.59), (-30.37, -829.36, -1.97), (103.01, -787.42, -4.32), (277.71, -734.95, -3.28), (453.1, -685.76, -2.22), (454.52, -685.36, -2.22), (456.08, -684.91, -2.22)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143699 (motorway bridge=False)
c_name = "OSM_motorway_1513143699"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1450.57, -1298.85, 1.56), (-1361.33, -1269.19, 3.39)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143700 (motorway bridge=False)
c_name = "OSM_motorway_1513143700"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2382.64, -1627.33, 4.83), (-2214.59, -1564.13, 4.01)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
