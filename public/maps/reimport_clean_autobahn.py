import bpy

coll_name = "OSM_Autobahn_Hamm_3D"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")

# Highway 4685992 (motorway_link)
c_name = "Autobahn_motorway_link_4685992"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2244.78, 99.16, 5.35), (-2223.13, 105.96, 3.57), (-2212.46, 112.59, 3.57), (-2196.97, 119.35, 1.82), (-2111.34, 155.84, -1.43), (-2085.37, 164.29, -2.19), (-2075.27, 164.91, -2.19), (-2065.17, 163.03, -2.19), (-2056.74, 157.99, -3.09), (-2049.41, 150.98, -3.09), (-2043.81, 141.14, -3.59), (-2041.57, 132.52, -3.59), (-2041.22, 123.01, -3.59), (-2043.25, 113.8, -4.19), (-2047.01, 106.03, -4.19), (-2052.13, 100.87, -4.19), (-2057.3, 95.23, -4.19), (-2067.79, 88.78, 1.82), (-2096.82, 77.65, -3.54), (-2110.21, 65.81, 0.52)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 4686300 (motorway_link)
c_name = "Autobahn_motorway_link_4686300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2563.48, -120.98, 1.21), (-2519.45, -115.61, -0.0), (-2505.92, -115.24, -1.76), (-2491.81, -115.96, -2.37), (-2477.72, -120.08, -2.37), (-2460.7, -129.12, -0.32), (-2444.3, -144.19, -0.32), (-2432.65, -156.17, -1.63), (-2432.61, -156.21, -1.63), (-2421.89, -167.29, -0.82)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 5733983 (motorway_link)
c_name = "Autobahn_motorway_link_5733983"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4200.27, 1489.67, 17.36), (4200.16, 1497.73, 17.36), (4197.46, 1508.96, 19.23), (4197.26, 1517.01, 19.23), (4198.89, 1525.3, 19.23), (4204.1, 1536.88, 19.23), (4211.7, 1547.25, 18.28), (4225.36, 1556.25, 18.28), (4239.56, 1562.29, 18.63), (4251.54, 1571.28, 18.56)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088287 (motorway)
c_name = "Autobahn_motorway_8088287"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4355.53, 1595.74, 16.88), (4300.97, 1591.49, 16.07)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088288 (motorway)
c_name = "Autobahn_motorway_8088288"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 8088712 (motorway)
c_name = "Autobahn_motorway_8088712"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4376.67, 1597.34, 24.38), (4355.53, 1595.74, 24.38)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8088808 (motorway)
c_name = "Autobahn_motorway_8088808"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 8088988 (motorway)
c_name = "Autobahn_motorway_8088988"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4356.99, 1580.25, 24.38), (4378.12, 1581.97, 24.38)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 8089228 (motorway)
c_name = "Autobahn_motorway_8089228"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 24738807 (motorway_link)
c_name = "Autobahn_motorway_link_24738807"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1891.44, 146.63, -6.42), (-1939.79, 137.42, -7.0), (-1958.27, 135.88, -6.83), (-1964.16, 135.78, -6.83), (-1971.45, 136.65, -6.83), (-1990.72, 143.06, -4.95), (-2004.91, 149.84, -4.82), (-2031.15, 165.54, -4.82), (-2045.21, 172.51, -3.09), (-2065.02, 175.16, -2.19), (-2085.6, 173.54, -2.19), (-2112.08, 163.52, -1.43), (-2151.05, 147.28, 1.65)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414506 (motorway_link)
c_name = "Autobahn_motorway_link_25414506"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4249.04, 1587.09, 18.56), (4235.42, 1594.25, 18.56), (4221.63, 1598.54, 18.13), (4218.77, 1599.67, 18.13), (4207.78, 1605.45, 19.58), (4197.75, 1615.08, 19.58), (4190.34, 1627.81, 19.58), (4187.79, 1640.36, 20.05), (4189.16, 1651.54, 20.05), (4188.89, 1662.27, 15.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25414544 (motorway_link)
c_name = "Autobahn_motorway_link_25414544"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4352.02, 1747.64, 17.13), (4344.9, 1734.74, 17.13), (4343.01, 1728.03, 14.0), (4337.23, 1717.87, 14.17), (4331.97, 1710.88, 14.17), (4328.22, 1706.1, 14.17)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479770 (motorway)
c_name = "Autobahn_motorway_25479770"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1292.78, 330.79, -0.21), (-1270.96, 337.87, -1.46)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479783 (motorway)
c_name = "Autobahn_motorway_25479783"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1093.94, 412.16, -7.75), (-1259.78, 357.57, -8.96)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479784 (motorway)
c_name = "Autobahn_motorway_25479784"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1059.65, 423.62, 3.03), (-1093.94, 412.16, -0.25)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479799 (motorway)
c_name = "Autobahn_motorway_25479799"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1103.41, 393.48, 2.82), (-1066.31, 405.55, 2.17)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25479800 (motorway)
c_name = "Autobahn_motorway_25479800"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1066.31, 405.55, -5.33), (-901.56, 459.63, -6.85), (-769.69, 504.02, -5.58), (-570.7, 569.7, -6.68), (-492.06, 595.7, -7.2), (-371.71, 635.49, -8.51)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25558324 (motorway_link)
c_name = "Autobahn_motorway_link_25558324"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2357.16, -227.21, -2.17), (-2373.14, -208.93, -0.86), (-2383.0, -197.96, -0.86), (-2393.76, -186.0, -1.36), (-2407.14, -163.39, -0.82), (-2410.78, -153.56, -1.63), (-2414.08, -141.66, -1.63), (-2414.13, -124.5, -1.31), (-2413.17, -110.85, -1.31), (-2409.47, -100.04, -1.31), (-2403.03, -86.55, -2.05), (-2395.36, -76.89, -2.05), (-2387.37, -68.89, -2.05), (-2360.0, -44.56, -1.69)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 25824302 (motorway_link)
c_name = "Autobahn_motorway_link_25824302"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4115.93, 1560.04, 17.12), (4133.22, 1551.35, 17.12), (4149.69, 1546.2, 17.12), (4163.88, 1536.69, 17.49), (4175.2, 1523.38, 19.23), (4187.44, 1502.96, 17.36), (4191.92, 1496.31, 17.36), (4200.27, 1489.67, 17.36)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 26464323 (motorway)
c_name = "Autobahn_motorway_26464323"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 34083862 (motorway)
c_name = "Autobahn_motorway_34083862"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4378.12, 1581.97, 16.88), (4488.29, 1591.48, 17.78)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137267 (primary)
c_name = "Autobahn_primary_34137267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4414.45, 1152.62, 8.88), (4400.29, 1251.51, 11.03), (4397.77, 1276.24, 9.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137268 (primary)
c_name = "Autobahn_primary_34137268"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4319.37, 2022.86, 9.8), (4318.27, 2030.97, 9.8), (4317.78, 2034.93, 8.34), (4315.73, 2051.18, 8.34)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137269 (primary)
c_name = "Autobahn_primary_34137269"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4376.81, 1461.45, 11.64), (4375.56, 1472.25, 11.64)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137270 (primary)
c_name = "Autobahn_primary_34137270"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4356.22, 1698.14, 13.5), (4355.17, 1708.98, 13.5)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 34137271 (primary)
c_name = "Autobahn_primary_34137271"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4355.17, 1708.98, 13.5), (4354.07, 1721.11, 13.5), (4352.02, 1747.64, 13.63)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870534 (motorway_link)
c_name = "Autobahn_motorway_link_40870534"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4371.33, 1514.8, 20.56), (4364.35, 1498.39, 15.12), (4363.16, 1494.55, 15.12), (4357.27, 1481.15, 15.12), (4351.18, 1473.45, 15.14), (4349.02, 1470.32, 15.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 40870542 (motorway_link)
c_name = "Autobahn_motorway_link_40870542"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2329.3, -203.22, -0.93), (-2345.06, -208.05, -0.93), (-2355.69, -210.95, -0.86), (-2373.14, -208.93, -0.86)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82105961 (motorway)
c_name = "Autobahn_motorway_82105961"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1382.59, 317.41, -10.71), (-1446.64, 296.21, -10.47), (-1525.48, 270.57, -9.69), (-1636.07, 233.55, -11.02), (-1671.09, 221.78, -11.34), (-1683.26, 217.68, -11.34), (-1719.43, 205.52, -11.12)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551561 (primary)
c_name = "Autobahn_primary_82551561"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4371.33, 1514.8, 17.06), (4369.7, 1536.86, 17.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551562 (primary)
c_name = "Autobahn_primary_82551562"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4375.56, 1472.25, 11.64), (4374.13, 1483.68, 11.62), (4372.53, 1504.98, 11.62)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 82551563 (primary)
c_name = "Autobahn_primary_82551563"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4352.02, 1747.64, 13.63), (4348.65, 1789.04, 12.58)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 91388388 (motorway)
c_name = "Autobahn_motorway_91388388"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4735.49, 1613.24, 16.85), (4823.05, 1626.97, 15.71), (4881.17, 1637.89, 15.29), (4947.58, 1652.33, 15.19), (5041.11, 1677.17, 13.73), (5052.17, 1680.1, 13.73), (5072.78, 1685.54, 12.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 101496464 (motorway)
c_name = "Autobahn_motorway_101496464"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(245.12, 851.06, -13.86), (82.17, 800.56, -13.52), (34.59, 785.07, -13.07), (-131.68, 730.97, -12.2), (-375.61, 650.28, -10.91), (-500.47, 608.9, -7.2), (-906.95, 474.22, -6.85), (-1059.65, 423.62, -4.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 102150740 (motorway)
c_name = "Autobahn_motorway_102150740"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 108038267 (motorway)
c_name = "Autobahn_motorway_108038267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(481.16, 918.95, -13.47), (362.9, 885.85, -12.92), (245.12, 851.06, -13.86)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645546 (motorway)
c_name = "Autobahn_motorway_123645546"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1270.96, 337.87, -8.96), (-1103.41, 393.48, -4.68)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 123645548 (motorway)
c_name = "Autobahn_motorway_123645548"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1275.65, 352.72, -1.46), (-1299.35, 344.87, -2.12)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513893 (motorway_link)
c_name = "Autobahn_motorway_link_146513893"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4188.89, 1662.27, 15.8), (4182.96, 1655.42, 20.05), (4178.63, 1647.2, 20.05), (4170.05, 1627.31, 17.74), (4164.5, 1615.63, 17.74), (4155.37, 1604.32, 17.74), (4146.17, 1594.95, 15.18), (4130.57, 1587.69, 15.18), (4111.41, 1575.29, 14.72)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 146513897 (motorway_link)
c_name = "Autobahn_motorway_link_146513897"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4355.17, 1708.98, 17.0), (4328.22, 1706.1, 14.17)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 186513187 (motorway_link)
c_name = "Autobahn_motorway_link_186513187"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2236.86, 66.81, 7.87), (-2233.99, 83.26, 7.87), (-2229.55, 96.27, 3.57), (-2223.13, 105.96, 3.57)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980108 (primary)
c_name = "Autobahn_primary_223980108"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4323.98, 1990.55, 10.33), (4322.05, 2003.96, 9.8), (4320.69, 2013.37, 9.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980109 (primary)
c_name = "Autobahn_primary_223980109"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4330.39, 1939.67, 11.5), (4323.98, 1990.55, 10.33)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980110 (primary)
c_name = "Autobahn_primary_223980110"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4315.73, 2051.18, 8.34), (4308.8, 2102.73, 10.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 223980111 (primary)
c_name = "Autobahn_primary_223980111"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4299.04, 2184.69, 11.43), (4295.93, 2209.5, 10.89), (4272.28, 2421.82, 4.56), (4165.58, 3359.69, -5.63), (4143.51, 3557.86, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684299 (motorway)
c_name = "Autobahn_motorway_270684299"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2275.25, 3.64, -2.7), (-2634.14, -131.48, -3.73), (-2773.31, -183.39, -1.79), (-2794.72, -191.57, -5.36), (-3105.46, -311.35, -5.78), (-3480.51, -452.78, -3.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684300 (motorway)
c_name = "Autobahn_motorway_270684300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4115.93, 1560.04, 13.62), (4251.54, 1571.28, 15.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684301 (motorway)
c_name = "Autobahn_motorway_270684301"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 270684305 (motorway)
c_name = "Autobahn_motorway_270684305"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(3874.71, 1539.06, 8.2), (3900.05, 1541.01, 11.33), (4084.63, 1557.32, 12.66)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684308 (motorway)
c_name = "Autobahn_motorway_270684308"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4502.29, 1607.79, 15.34), (4463.28, 1605.04, 14.84), (4376.67, 1597.34, 16.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684310 (motorway)
c_name = "Autobahn_motorway_270684310"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4251.54, 1571.28, 15.06), (4301.87, 1575.83, 16.07)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684312 (motorway)
c_name = "Autobahn_motorway_270684312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2110.21, 65.81, -2.98), (-2275.25, 3.64, -2.7)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684313 (motorway)
c_name = "Autobahn_motorway_270684313"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2360.0, -44.56, -5.19), (-2314.24, -27.36, -6.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684315 (motorway)
c_name = "Autobahn_motorway_270684315"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4111.41, 1575.29, 11.22), (4065.23, 1571.72, 10.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684316 (motorway)
c_name = "Autobahn_motorway_270684316"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4249.04, 1587.09, 15.06), (4111.41, 1575.29, 11.22)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684321 (motorway)
c_name = "Autobahn_motorway_270684321"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4488.29, 1591.48, 17.78), (4495.67, 1592.27, 17.78), (4679.92, 1607.6, 16.72), (4735.49, 1613.24, 16.85)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684326 (motorway)
c_name = "Autobahn_motorway_270684326"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1719.43, 205.52, -11.12), (-1753.36, 193.78, -9.69), (-1852.85, 159.8, -10.48), (-1891.44, 146.63, -9.92)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684327 (motorway)
c_name = "Autobahn_motorway_270684327"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1891.44, 146.63, -9.92), (-1984.11, 113.03, -9.42), (-2110.21, 65.81, -2.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 270684330 (motorway)
c_name = "Autobahn_motorway_270684330"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2563.48, -120.98, -2.29), (-2360.0, -44.56, -5.19)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293856340 (motorway_link)
c_name = "Autobahn_motorway_link_293856340"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4338.37, 1466.35, 15.7), (4361.41, 1460.99, 15.14), (4376.81, 1461.45, 15.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857346 (primary)
c_name = "Autobahn_primary_293857346"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4364.05, 1609.16, 12.08), (4359.82, 1658.12, 11.54)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857347 (primary)
c_name = "Autobahn_primary_293857347"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4372.53, 1504.98, 11.62), (4371.33, 1514.8, 17.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857348 (primary)
c_name = "Autobahn_primary_293857348"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4359.82, 1658.12, 11.54), (4357.84, 1681.82, 13.2), (4356.22, 1698.14, 13.5)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857349 (primary)
c_name = "Autobahn_primary_293857349"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4397.77, 1276.24, 9.06), (4383.37, 1394.54, 13.89)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857350 (primary)
c_name = "Autobahn_primary_293857350"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4383.37, 1394.54, 13.89), (4377.27, 1456.77, 11.64), (4376.81, 1461.45, 11.64)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293857801 (motorway_link)
c_name = "Autobahn_motorway_link_293857801"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4321.9, 1702.82, 13.41), (4341.65, 1697.22, 14.17), (4356.22, 1698.14, 17.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861512 (motorway_link)
c_name = "Autobahn_motorway_link_293861512"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2151.05, 147.28, 1.65), (-2214.93, 120.79, 2.2), (-2226.37, 116.06, 3.57), (-2231.96, 113.79, 5.35), (-2232.57, 113.66, 5.35), (-2247.23, 108.92, 5.35)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293861515 (motorway_link)
c_name = "Autobahn_motorway_link_293861515"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2421.89, -167.29, -0.82), (-2378.92, -215.03, -0.86), (-2377.17, -217.16, -0.86), (-2376.04, -218.66, -0.86), (-2375.91, -218.82, -0.86), (-2364.95, -232.63, -2.17)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 293862838 (primary)
c_name = "Autobahn_primary_293862838"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4308.8, 2102.73, 10.88), (4305.47, 2131.05, 11.75)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 308444312 (motorway)
c_name = "Autobahn_motorway_308444312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2146.17, 35.85, -7.09), (-1997.55, 91.48, -9.42), (-1848.3, 145.24, -10.69), (-1773.89, 170.49, -9.66), (-1592.58, 231.8, -9.54), (-1382.03, 301.12, -9.54)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990379 (primary)
c_name = "Autobahn_primary_496990379"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4347.42, 1802.75, 12.58), (4330.39, 1939.67, 11.5)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990380 (primary)
c_name = "Autobahn_primary_496990380"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4348.65, 1789.04, 12.58), (4347.42, 1802.75, 12.58)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990381 (motorway)
c_name = "Autobahn_motorway_496990381"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4065.23, 1571.72, 10.47), (3894.39, 1556.84, 11.33)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990382 (motorway_link)
c_name = "Autobahn_motorway_link_496990382"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4328.22, 1706.1, 14.17), (4321.9, 1702.82, 13.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990383 (motorway_link)
c_name = "Autobahn_motorway_link_496990383"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4307.05, 1701.59, 13.41), (4321.9, 1702.82, 13.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990384 (motorway)
c_name = "Autobahn_motorway_496990384"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4300.97, 1591.49, 16.07), (4249.04, 1587.09, 15.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990385 (motorway_link)
c_name = "Autobahn_motorway_link_496990385"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4188.89, 1662.27, 15.8), (4196.04, 1673.64, 15.8), (4202.98, 1680.85, 15.8), (4209.4, 1685.35, 19.62), (4218.12, 1689.85, 19.62), (4225.89, 1692.73, 14.41), (4237.71, 1695.44, 16.01), (4259.64, 1697.6, 16.01), (4307.05, 1701.59, 13.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496990998 (primary)
c_name = "Autobahn_primary_496990998"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4369.7, 1536.86, 17.06), (4364.05, 1609.16, 12.08)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992656 (motorway)
c_name = "Autobahn_motorway_496992656"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4301.87, 1575.83, 16.07), (4356.99, 1580.25, 16.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992657 (motorway)
c_name = "Autobahn_motorway_496992657"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4084.63, 1557.32, 12.66), (4115.93, 1560.04, 13.62)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992658 (motorway_link)
c_name = "Autobahn_motorway_link_496992658"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4349.02, 1470.32, 15.14), (4338.37, 1466.35, 15.7)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992659 (motorway_link)
c_name = "Autobahn_motorway_link_496992659"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4200.27, 1489.67, 17.36), (4210.99, 1477.69, 17.06), (4219.13, 1471.56, 17.21), (4228.72, 1466.92, 16.68), (4239.4, 1462.57, 16.68), (4251.12, 1460.57, 16.68)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992660 (motorway_link)
c_name = "Autobahn_motorway_link_496992660"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4251.12, 1460.57, 16.68), (4261.5, 1460.36, 16.68), (4338.37, 1466.35, 15.7)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496992661 (motorway_link)
c_name = "Autobahn_motorway_link_496992661"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4375.56, 1472.25, 15.14), (4349.02, 1470.32, 15.14)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996171 (primary)
c_name = "Autobahn_primary_496996171"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4320.69, 2013.37, 9.8), (4319.37, 2022.86, 9.8)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996574 (primary)
c_name = "Autobahn_primary_496996574"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4301.14, 2166.3, 11.43), (4299.04, 2184.69, 11.43)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 496996575 (primary)
c_name = "Autobahn_primary_496996575"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 2.5
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4305.47, 2131.05, 11.75), (4301.14, 2166.3, 11.43)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593545707 (motorway)
c_name = "Autobahn_motorway_593545707"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(4954.56, 1670.19, 14.67), (4882.81, 1653.86, 15.29), (4814.74, 1641.12, 17.23), (4737.62, 1629.65, 16.85), (4679.7, 1622.98, 16.72), (4658.08, 1621.42, 17.42), (4562.3, 1613.74, 16.69), (4502.29, 1607.79, 15.34)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561591 (motorway)
c_name = "Autobahn_motorway_593561591"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1299.35, 344.87, -9.62), (-1382.59, 317.41, -10.71)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 593561592 (motorway)
c_name = "Autobahn_motorway_593561592"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1259.78, 357.57, -8.96), (-1262.84, 356.56, -8.96), (-1275.65, 352.72, -8.96)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1498285739 (motorway)
c_name = "Autobahn_motorway_1498285739"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
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

# Highway 1513143689 (motorway)
c_name = "Autobahn_motorway_1513143689"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-371.71, 635.49, -8.51), (38.39, 770.61, -13.07), (171.79, 812.55, -15.42), (346.51, 865.02, -14.38), (521.94, 914.21, -13.32), (523.35, 914.61, -13.32), (524.91, 915.07, -13.32)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143699 (motorway)
c_name = "Autobahn_motorway_1513143699"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-1382.03, 301.12, -9.54), (-1292.78, 330.79, -7.71)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# Highway 1513143700 (motorway)
c_name = "Autobahn_motorway_1513143700"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 4.0
cd.extrude = 0.5
cd.fill_mode = 'FULL'
sp = cd.splines.new('POLY')
pts = [(-2314.24, -27.36, -6.27), (-2146.17, 35.85, -7.09)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
