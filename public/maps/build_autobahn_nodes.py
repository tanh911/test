import bpy

coll_name = "OSM_Autobahn_Full_Network"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")

# Highway 4685992 (motorway_link  )
c_name = "OSM_motorway_link_4685992"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2313.19, -1500.81), (-2291.54, -1494.01), (-2280.87, -1487.38), (-2265.39, -1480.63), (-2179.77, -1444.13), (-2153.8, -1435.68), (-2143.7, -1435.06), (-2133.6, -1436.94), (-2125.18, -1441.98), (-2117.84, -1449.0), (-2112.25, -1458.83), (-2110.01, -1467.46), (-2109.65, -1476.96), (-2111.68, -1486.17), (-2115.44, -1493.94), (-2120.56, -1499.1), (-2125.74, -1504.74), (-2136.23, -1511.19), (-2165.25, -1522.33), (-2178.64, -1534.16)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 4686300 (motorway_link  )
c_name = "OSM_motorway_link_4686300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2631.84, -1720.95), (-2587.82, -1715.59), (-2574.29, -1715.21), (-2560.18, -1715.93), (-2546.09, -1720.05), (-2529.07, -1729.09), (-2512.68, -1744.16), (-2501.03, -1756.14), (-2500.98, -1756.19), (-2490.27, -1767.27)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 5733983 (motorway_link  )
c_name = "OSM_motorway_link_5733983"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4130.87, -110.31), (4130.76, -102.25), (4128.06, -91.01), (4127.86, -82.97), (4129.48, -74.67), (4134.69, -63.09), (4142.3, -52.72), (4155.95, -43.72), (4170.16, -37.69), (4182.13, -28.7)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088287 (motorway A 2 )
c_name = "OSM_motorway_8088287"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4286.1, -4.23), (4231.56, -8.48)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088288 (motorway A 2 )
c_name = "OSM_motorway_8088288"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3351.36, -82.64), (3310.37, -85.81)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088712 (motorway A 2 )
c_name = "OSM_motorway_8088712"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4307.24, -2.63), (4286.1, -4.23)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088808 (motorway A 2 )
c_name = "OSM_motorway_8088808"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3338.6, -100.16), (3507.21, -86.01), (3805.36, -60.92)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088988 (motorway A 2 )
c_name = "OSM_motorway_8088988"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4287.56, -19.73), (4308.69, -18.0)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8089228 (motorway A 2 )
c_name = "OSM_motorway_8089228"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3296.93, -103.38), (3338.6, -100.16)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 24738807 (motorway_link  )
c_name = "OSM_motorway_link_24738807"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-1959.9, -1453.34), (-2008.24, -1462.56), (-2026.72, -1464.09), (-2032.61, -1464.19), (-2039.9, -1463.32), (-2059.17, -1456.91), (-2073.36, -1450.13), (-2099.59, -1434.44), (-2113.65, -1427.46), (-2133.45, -1424.81), (-2154.03, -1426.44), (-2180.51, -1436.45), (-2219.48, -1452.7)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414506 (motorway_link  )
c_name = "OSM_motorway_link_25414506"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4179.63, -12.88), (4166.02, -5.72), (4152.23, -1.43), (4149.37, -0.3), (4138.38, 5.48), (4128.35, 15.1), (4120.94, 27.84), (4118.39, 40.39), (4119.76, 51.57), (4119.49, 62.29)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414544 (motorway_link  )
c_name = "OSM_motorway_link_25414544"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4282.59, 147.67), (4275.47, 134.77), (4273.58, 128.05), (4267.81, 117.9), (4262.55, 110.91), (4258.8, 106.13)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479770 (motorway A 2 )
c_name = "OSM_motorway_25479770"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1361.33, -1269.19), (-1339.52, -1262.11)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479783 (motorway A 2 )
c_name = "OSM_motorway_25479783"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1162.52, -1187.81), (-1328.34, -1242.4)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479784 (motorway A 2 )
c_name = "OSM_motorway_25479784"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1128.24, -1176.35), (-1162.52, -1187.81)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479799 (motorway A 2 )
c_name = "OSM_motorway_25479799"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1171.99, -1206.49), (-1134.9, -1194.42)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479800 (motorway A 2 )
c_name = "OSM_motorway_25479800"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1134.9, -1194.42), (-970.18, -1140.34), (-838.33, -1095.95), (-639.36, -1030.27), (-560.74, -1004.27), (-440.41, -964.49)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25558324 (motorway_link  )
c_name = "OSM_motorway_link_25558324"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2425.54, -1827.18), (-2441.53, -1808.9), (-2451.38, -1797.93), (-2462.14, -1785.97), (-2475.52, -1763.36), (-2479.16, -1753.53), (-2482.46, -1741.64), (-2482.51, -1724.48), (-2481.55, -1710.82), (-2477.85, -1700.02), (-2471.41, -1686.52), (-2463.74, -1676.87), (-2455.75, -1668.86), (-2428.39, -1644.53)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25824302 (motorway_link  )
c_name = "OSM_motorway_link_25824302"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4046.54, -39.93), (4063.83, -48.62), (4080.3, -53.77), (4094.48, -63.28), (4105.8, -76.6), (4118.04, -97.01), (4122.52, -103.66), (4130.87, -110.31)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 26464323 (motorway A 2 )
c_name = "OSM_motorway_26464323"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(2380.41, -174.73), (2332.23, -181.82), (2255.41, -194.67), (2169.98, -210.83), (2078.76, -229.27), (1989.94, -249.82), (1901.16, -271.36), (1776.32, -304.25), (1740.82, -313.61), (1576.82, -359.17), (1396.0, -409.17), (926.7, -538.71), (542.07, -644.95), (448.04, -671.1), (412.33, -681.03)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34083862 (motorway A 2 )
c_name = "OSM_motorway_34083862"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4308.69, -18.0), (4418.85, -8.49)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137267 (primary B 63 Werler Straße)
c_name = "OSM_primary_34137267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4345.01, -447.36), (4330.86, -348.47), (4328.34, -323.74)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137268 (primary B 63 Werler Straße)
c_name = "OSM_primary_34137268"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4249.95, 422.88), (4248.85, 431.0), (4248.36, 434.95), (4246.31, 451.2)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137269 (primary B 63 Werler Straße)
c_name = "OSM_primary_34137269"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4307.38, -138.52), (4306.13, -127.72)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137270 (primary B 63 Werler Straße)
c_name = "OSM_primary_34137270"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4286.79, 98.17), (4285.75, 109.01)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137271 (primary B 63 Werler Straße)
c_name = "OSM_primary_34137271"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4285.75, 109.01), (4284.64, 121.14), (4282.59, 147.67)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870534 (motorway_link  )
c_name = "OSM_motorway_link_40870534"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4301.9, -85.18), (4294.92, -101.58), (4293.74, -105.43), (4287.84, -118.82), (4281.76, -126.52), (4279.59, -129.65)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870542 (motorway_link  )
c_name = "OSM_motorway_link_40870542"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2397.69, -1803.2), (-2413.45, -1808.02), (-2424.08, -1810.92), (-2441.53, -1808.9)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82105961 (motorway A 2 )
c_name = "OSM_motorway_82105961"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1451.13, -1282.57), (-1515.17, -1303.76), (-1594.0, -1329.4), (-1704.57, -1366.42), (-1739.58, -1378.19), (-1751.75, -1382.29), (-1787.92, -1394.45)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551561 (primary B 63 Werler Straße)
c_name = "OSM_primary_82551561"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4301.9, -85.18), (4300.28, -63.12)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551562 (primary B 63 Werler Straße)
c_name = "OSM_primary_82551562"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4306.13, -127.72), (4304.7, -116.3), (4303.11, -94.99)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551563 (primary B 63 Werler Straße)
c_name = "OSM_primary_82551563"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4282.59, 147.67), (4279.23, 189.07)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 91388388 (motorway A 2 )
c_name = "OSM_motorway_91388388"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4666.01, 13.27), (4753.55, 27.0), (4811.67, 37.92), (4878.07, 52.36), (4971.58, 77.2), (4982.64, 80.13), (5003.24, 85.57)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 101496464 (motorway A 2 )
c_name = "OSM_motorway_101496464"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(176.33, -748.91), (13.41, -799.41), (-34.17, -814.9), (-200.41, -869.01), (-444.3, -949.69), (-569.15, -991.07), (-975.57, -1125.75), (-1128.24, -1176.35)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 102150740 (motorway A 2 )
c_name = "OSM_motorway_102150740"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(456.08, -684.91), (930.54, -553.46), (1112.29, -503.1), (1300.5, -451.68), (1397.59, -424.61), (1578.66, -375.14), (1743.82, -329.14), (1829.06, -305.23), (1905.45, -285.81), (1993.07, -264.58), (2084.09, -244.58), (2167.27, -227.03), (2256.84, -210.29), (2338.66, -196.47), (2469.66, -177.32), (2565.9, -166.01), (2676.44, -155.26), (2811.01, -143.9), (2903.08, -136.22), (2918.17, -134.97), (3129.68, -117.28), (3296.93, -103.38)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 108038267 (motorway A 2 )
c_name = "OSM_motorway_108038267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(412.33, -681.03), (294.09, -714.12), (176.33, -748.91)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645546 (motorway A 2 )
c_name = "OSM_motorway_123645546"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1339.52, -1262.11), (-1171.99, -1206.49)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645548 (motorway A 2 )
c_name = "OSM_motorway_123645548"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1344.21, -1247.26), (-1367.9, -1255.1)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513893 (motorway_link  )
c_name = "OSM_motorway_link_146513893"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4119.49, 62.29), (4113.56, 55.45), (4109.23, 47.22), (4100.65, 27.34), (4095.1, 15.66), (4085.98, 4.35), (4076.78, -5.02), (4061.18, -12.28), (4042.02, -24.68)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513897 (motorway_link  )
c_name = "OSM_motorway_link_146513897"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4285.75, 109.01), (4258.8, 106.13)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 186513187 (motorway_link  )
c_name = "OSM_motorway_link_186513187"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2305.27, -1533.16), (-2302.39, -1516.71), (-2297.96, -1503.7), (-2291.54, -1494.01)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980108 (primary B 63 Werler Straße)
c_name = "OSM_primary_223980108"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4254.56, 390.58), (4252.63, 403.99), (4251.27, 413.39)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980109 (primary B 63 Werler Straße)
c_name = "OSM_primary_223980109"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4260.97, 339.7), (4254.56, 390.58)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980110 (primary B 63 Werler Straße)
c_name = "OSM_primary_223980110"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4246.31, 451.2), (4239.38, 502.76)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980111 (primary B 63 Werler Straße)
c_name = "OSM_primary_223980111"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4229.62, 584.71), (4226.51, 609.53), (4202.87, 821.85), (4096.18, 1759.72), (4074.12, 1957.89)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684299 (motorway A 2 )
c_name = "OSM_motorway_270684299"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2343.65, -1596.33), (-2702.49, -1731.46), (-2841.64, -1783.36), (-2863.04, -1791.54), (-3173.73, -1911.32), (-3548.73, -2052.75)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684300 (motorway A 2 )
c_name = "OSM_motorway_270684300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4046.54, -39.93), (4182.13, -28.7)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684301 (motorway A 2 )
c_name = "OSM_motorway_270684301"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3825.03, -43.13), (3741.49, -49.79), (3505.86, -69.73), (3351.36, -82.64)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684305 (motorway A 2 )
c_name = "OSM_motorway_270684305"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3805.36, -60.92), (3830.69, -58.96), (4015.25, -42.66)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684308 (motorway A 2 )
c_name = "OSM_motorway_270684308"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4432.84, 7.81), (4393.83, 5.07), (4307.24, -2.63)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684310 (motorway A 2 )
c_name = "OSM_motorway_270684310"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4182.13, -28.7), (4232.45, -24.14)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684312 (motorway A 2 )
c_name = "OSM_motorway_270684312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2178.64, -1534.16), (-2343.65, -1596.33)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684313 (motorway A 2 )
c_name = "OSM_motorway_270684313"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2428.39, -1644.53), (-2382.64, -1627.33)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684315 (motorway A 2 )
c_name = "OSM_motorway_270684315"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4042.02, -24.68), (3995.85, -28.25)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684316 (motorway A 2 )
c_name = "OSM_motorway_270684316"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4179.63, -12.88), (4042.02, -24.68)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684321 (motorway A 2 )
c_name = "OSM_motorway_270684321"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4418.85, -8.49), (4426.22, -7.7), (4610.45, 7.62), (4666.01, 13.27)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684326 (motorway A 2 )
c_name = "OSM_motorway_270684326"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1787.92, -1394.45), (-1821.84, -1406.2), (-1921.32, -1440.17), (-1959.9, -1453.34)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684327 (motorway A 2 )
c_name = "OSM_motorway_270684327"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1959.9, -1453.34), (-2052.55, -1486.94), (-2178.64, -1534.16)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684330 (motorway A 2 )
c_name = "OSM_motorway_270684330"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2631.84, -1720.95), (-2428.39, -1644.53)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293856340 (motorway_link  )
c_name = "OSM_motorway_link_293856340"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4268.95, -133.62), (4291.98, -138.98), (4307.38, -138.52)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857346 (primary B 63 Werler Straße)
c_name = "OSM_primary_293857346"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4294.62, 9.19), (4290.39, 58.15)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857347 (primary B 63 Werler Straße)
c_name = "OSM_primary_293857347"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4303.11, -94.99), (4301.9, -85.18)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857348 (primary B 63 Werler Straße)
c_name = "OSM_primary_293857348"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4290.39, 58.15), (4288.42, 81.84), (4286.79, 98.17)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857349 (primary B 63 Werler Straße)
c_name = "OSM_primary_293857349"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4328.34, -323.74), (4313.94, -205.43)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857350 (primary B 63 Werler Straße)
c_name = "OSM_primary_293857350"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4313.94, -205.43), (4307.84, -143.2), (4307.38, -138.52)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857801 (motorway_link  )
c_name = "OSM_motorway_link_293857801"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4252.48, 102.85), (4272.23, 97.25), (4286.79, 98.17)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861512 (motorway_link  )
c_name = "OSM_motorway_link_293861512"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2219.48, -1452.7), (-2283.34, -1479.18), (-2294.78, -1483.92), (-2300.37, -1486.18), (-2300.98, -1486.32), (-2315.64, -1491.05)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861515 (motorway_link  )
c_name = "OSM_motorway_link_293861515"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(-2490.27, -1767.27), (-2447.31, -1815.0), (-2445.56, -1817.13), (-2444.43, -1818.63), (-2444.3, -1818.79), (-2433.34, -1832.6)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293862838 (primary B 63 Werler Straße)
c_name = "OSM_primary_293862838"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4239.38, 502.76), (4236.05, 531.08)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 308444312 (motorway A 2 )
c_name = "OSM_motorway_308444312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2214.59, -1564.13), (-2065.99, -1508.49), (-1916.76, -1454.73), (-1842.37, -1429.48), (-1661.09, -1368.18), (-1450.57, -1298.85)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990379 (primary B 63 Werler Straße)
c_name = "OSM_primary_496990379"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4278.0, 202.77), (4260.97, 339.7)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990380 (primary B 63 Werler Straße)
c_name = "OSM_primary_496990380"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4279.23, 189.07), (4278.0, 202.77)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990381 (motorway A 2 )
c_name = "OSM_motorway_496990381"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3995.85, -28.25), (3825.03, -43.13)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990382 (motorway_link  )
c_name = "OSM_motorway_link_496990382"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4258.8, 106.13), (4252.48, 102.85)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990383 (motorway_link  )
c_name = "OSM_motorway_link_496990383"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4237.63, 101.61), (4252.48, 102.85)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990384 (motorway A 2 )
c_name = "OSM_motorway_496990384"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4231.56, -8.48), (4179.63, -12.88)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990385 (motorway_link  )
c_name = "OSM_motorway_link_496990385"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4119.49, 62.29), (4126.63, 73.66), (4133.58, 80.88), (4140.0, 85.38), (4148.72, 89.88), (4156.49, 92.76), (4168.3, 95.47), (4190.23, 97.62), (4237.63, 101.61)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990998 (primary B 63 Werler Straße)
c_name = "OSM_primary_496990998"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4300.28, -63.12), (4294.62, 9.19)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992656 (motorway A 2 )
c_name = "OSM_motorway_496992656"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4232.45, -24.14), (4287.56, -19.73)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992657 (motorway A 2 )
c_name = "OSM_motorway_496992657"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4015.25, -42.66), (4046.54, -39.93)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992658 (motorway_link  )
c_name = "OSM_motorway_link_496992658"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4279.59, -129.65), (4268.95, -133.62)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992659 (motorway_link  )
c_name = "OSM_motorway_link_496992659"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4130.87, -110.31), (4141.59, -122.29), (4149.73, -128.41), (4159.32, -133.06), (4169.99, -137.4), (4181.71, -139.4)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992660 (motorway_link  )
c_name = "OSM_motorway_link_496992660"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4181.71, -139.4), (4192.09, -139.61), (4268.95, -133.62)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992661 (motorway_link  )
c_name = "OSM_motorway_link_496992661"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4306.13, -127.72), (4279.59, -129.65)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 4.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996171 (primary B 63 Werler Straße)
c_name = "OSM_primary_496996171"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4251.27, 413.39), (4249.95, 422.88)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996574 (primary B 63 Werler Straße)
c_name = "OSM_primary_496996574"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4231.72, 566.33), (4229.62, 584.71)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996575 (primary B 63 Werler Straße)
c_name = "OSM_primary_496996575"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.0
sp = cd.splines.new('POLY')
pts = [(4236.05, 531.08), (4231.72, 566.33)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593545707 (motorway A 2 )
c_name = "OSM_motorway_593545707"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(4885.04, 70.22), (4813.3, 53.89), (4745.24, 41.14), (4668.13, 29.67), (4610.23, 23.01), (4588.61, 21.45), (4492.84, 13.77), (4432.84, 7.81)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561591 (motorway A 2 )
c_name = "OSM_motorway_593561591"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1367.9, -1255.1), (-1451.13, -1282.57)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561592 (motorway A 2 )
c_name = "OSM_motorway_593561592"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1328.34, -1242.4), (-1331.4, -1243.41), (-1344.21, -1247.26)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1498285739 (motorway A 2 )
c_name = "OSM_motorway_1498285739"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(3310.37, -85.81), (3128.23, -101.93), (2918.31, -118.81), (2675.74, -138.8), (2560.56, -151.13), (2465.74, -162.27), (2425.66, -168.08), (2380.41, -174.73)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143689 (motorway A 2 )
c_name = "OSM_motorway_1513143689"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-440.41, -964.49), (-30.37, -829.36), (103.01, -787.42), (277.71, -734.95), (453.1, -685.76), (454.52, -685.36), (456.08, -684.91)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143699 (motorway A 2 )
c_name = "OSM_motorway_1513143699"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-1450.57, -1298.85), (-1361.33, -1269.19)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143700 (motorway A 2 )
c_name = "OSM_motorway_1513143700"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 3.5
sp = cd.splines.new('POLY')
pts = [(-2382.64, -1627.33), (-2214.59, -1564.13)]
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, 0.0, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
