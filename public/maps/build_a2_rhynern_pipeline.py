import bpy
import mathutils

coll_name = "A2_Autobahn_Rhynern_Geofabrik_3D"
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

# A2 Segment 4685992 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_4685992"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 4686300 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_4686300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 5733983 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_5733983"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 8088287 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_8088287"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 8088288 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_8088288"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 8088712 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_8088712"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 8088808 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_8088808"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 8088988 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_8088988"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 8089228 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_8089228"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 9938420 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_9938420"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3358.07, 6135.89, -8.57), (3340.45, 6132.77, -8.22), (3328.57, 6133.47, -8.22), (3316.3, 6136.41, -8.22)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 9939887 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_9939887"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3772.32, 4854.27, 16.84), (3769.4, 4864.36, 16.84), (3767.73, 4869.57, 16.98), (3763.83, 4881.77, 16.98), (3756.85, 4903.78, 16.98), (3752.41, 4917.88, 16.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 24738807 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_24738807"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 25414506 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_25414506"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 25414544 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_25414544"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 25479770 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_25479770"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 25479783 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_25479783"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 25479784 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_25479784"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 25479799 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_25479799"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 25479800 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_25479800"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 25558324 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_25558324"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 25824302 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_25824302"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 26096280 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_26096280"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3619.78, 5591.29, -8.84), (3593.74, 5601.93, -9.23), (3578.87, 5607.87, -9.23), (3576.28, 5608.9, -9.3), (3559.36, 5616.51, -9.3)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 26464323 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_26464323"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 26829426 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_26829426"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3513.41, -481.57, -10.55), (-3479.94, -483.46, -10.64)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 27474400 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_27474400"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5756.92, 2021.98, 14.78), (5790.1, 2025.05, 14.06), (5817.0, 2035.25, 14.66), (5849.48, 2051.46, 14.96)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 28760271 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_28760271"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5142.41, -2439.22, -6.69), (5137.61, -2415.98, -6.69), (5136.57, -2410.79, -6.69), (5135.67, -2406.29, -6.69)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 30270711 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_30270711"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5142.41, -2439.22, -6.69), (5160.78, -2527.08, -5.33), (5171.81, -2585.44, -5.33), (5188.06, -2661.4, -1.69), (5206.82, -2759.0, -0.62), (5219.84, -2825.02, -0.62), (5225.08, -2850.12, -0.62), (5228.98, -2867.31, -0.62), (5234.9, -2897.3, -0.62), (5239.76, -2921.55, -0.62), (5239.98, -2922.66, -0.62), (5247.13, -2956.9, -5.76), (5249.42, -2967.04, -5.76), (5256.21, -2999.47, -5.76), (5266.02, -3046.59, -6.79), (5272.7, -3070.07, -6.79), (5275.31, -3079.58, -6.79)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 31960465 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_31960465"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4959.01, -1522.97, -5.05), (4950.12, -1478.72, -5.02)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 32530960 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_32530960"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6698.24, 2576.91, 3.91), (6672.08, 2572.78, 5.04), (6655.1, 2567.2, 5.04), (6613.31, 2550.92, 7.65), (6526.55, 2502.79, 11.54)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 34083862 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_34083862"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34137267 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_34137267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34137268 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_34137268"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34137269 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_34137269"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34137270 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_34137270"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34137271 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_34137271"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 34138923 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: True)
c_name = "A2_primary_34138923"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3736.32, 5507.51, 23.48), (3726.95, 5518.71, 23.48), (3715.95, 5530.03, 23.48)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 34138924 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_34138924"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3792.21, 5256.69, 16.84), (3792.88, 5317.08, 16.84), (3793.35, 5347.69, 16.84), (3792.74, 5365.32, 16.84), (3791.11, 5378.53, 16.84), (3787.97, 5396.91, 16.84), (3784.42, 5411.03, 16.84), (3779.73, 5427.39, 16.84), (3773.91, 5443.35, 16.84), (3764.56, 5464.18, 16.98), (3757.6, 5476.49, 16.98), (3750.21, 5488.24, 16.98), (3736.32, 5507.51, 15.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 34138925 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: True)
c_name = "A2_primary_34138925"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3792.21, 5225.87, 24.34), (3792.21, 5256.69, 24.34)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 40870534 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_40870534"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 40870542 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_40870542"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 45991342 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_45991342"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3751.82, 5023.2, 16.98), (3756.05, 5037.52, 16.98), (3770.49, 5075.37, 16.84), (3777.24, 5090.83, 16.84), (3784.37, 5109.68, 16.84), (3787.48, 5123.8, 16.84), (3789.64, 5135.62, 16.84), (3790.93, 5148.02, 16.84), (3791.53, 5158.41, 16.84), (3792.21, 5225.87, 16.84)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 45991356 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_45991356"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3465.82, 5802.66, -8.81), (3462.58, 5812.96, -8.81), (3461.35, 5816.65, -8.68), (3454.74, 5836.4, -8.68), (3437.86, 5886.88, -8.68), (3432.53, 5903.71, -8.68), (3399.38, 6008.81, -8.57), (3398.54, 6011.4, -8.57), (3397.38, 6015.31, -8.57)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 59463476 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_59463476"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3559.36, 5616.51, -9.3), (3547.39, 5622.43, -9.3), (3543.99, 5624.77, -9.3), (3538.09, 5628.84, -9.23), (3530.58, 5635.71, -9.23), (3523.53, 5642.29, -9.23), (3518.71, 5648.73, -9.27), (3514.4, 5655.74, -9.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 82105961 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_82105961"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 82551561 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_82551561"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 82551562 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_82551562"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 82551563 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_82551563"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 91388388 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_91388388"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 101496464 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_101496464"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 101496470 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_101496470"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(8539.64, 3684.07, -9.77), (8412.43, 3605.62, -9.77), (7943.43, 3316.41, -9.77), (7880.22, 3278.08, -9.77), (7817.66, 3238.31, -9.77), (7783.87, 3218.29, -9.77), (7416.98, 2992.08, -8.9), (7349.74, 2950.99, -7.89), (7281.56, 2911.4, -7.05), (7122.8, 2819.58, -4.36), (7018.53, 2759.36, -2.51), (6882.62, 2681.7, -0.15)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 102150740 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_102150740"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 108038267 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_108038267"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 123645546 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_123645546"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 123645548 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: True)
c_name = "A2_motorway_123645548"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 137208512 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_137208512"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3502.59, 5689.72, -9.27), (3499.25, 5700.15, -9.27), (3490.93, 5725.62, -9.27), (3470.02, 5790.19, -8.81), (3468.94, 5793.53, -8.81), (3465.82, 5802.66, -8.81)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 140222983 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_140222983"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4119.98, 3762.28, -6.47), (4115.17, 3784.69, -6.47), (4111.87, 3796.08, -6.85)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 140222989 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_140222989"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4129.2, 3685.8, -6.47), (4128.8, 3692.9, -6.47), (4127.83, 3705.28, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 146513893 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_146513893"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 146513897 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_146513897"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 186513187 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_186513187"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 205606351 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_205606351"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4111.87, 3796.08, -6.85), (4107.95, 3809.62, -6.85), (4081.64, 3892.46, -7.09)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 205606353 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_205606353"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4127.83, 3705.28, -6.47), (4123.9, 3737.49, -6.47), (4119.98, 3762.28, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 205606357 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_205606357"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4130.11, 3679.19, -6.47), (4129.2, 3685.8, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 205622061 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_205622061"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4142.24, 3568.71, -6.47), (4132.34, 3661.63, -6.47), (4130.11, 3679.19, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 214169370 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_214169370"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4081.64, 3892.46, -7.09), (4062.21, 3952.91, -7.09), (4050.05, 3992.9, -8.74), (4047.38, 4000.83, -8.74), (4043.67, 4012.95, -8.74), (4038.56, 4028.63, -8.74), (3989.6, 4180.12, 1.54), (3983.94, 4198.21, 1.54), (3973.25, 4231.78, 14.03), (3967.57, 4247.99, 14.03), (3963.99, 4259.42, 14.03)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 214169373 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_214169373"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4143.51, 3557.86, -6.47), (4142.24, 3568.71, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 219793816 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: True)
c_name = "A2_primary_219793816"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5064.57, -2055.71, 1.5), (5057.78, -2019.58, 1.5)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 219793818 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_219793818"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5052.14, -1991.97, -6.0), (5029.99, -1880.41, -6.47), (5018.32, -1820.31, -6.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 220996988 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_220996988"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4636.65, 101.16, 10.81), (4634.55, 111.71, 10.81), (4599.63, 288.29, 8.04), (4598.43, 294.07, 8.04), (4588.59, 341.45, 11.19), (4571.35, 420.79, 8.62), (4569.59, 428.91, 7.67), (4547.46, 527.09, 7.11), (4523.39, 633.91, 7.54)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 223980108 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_223980108"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 223980109 (Type: primary, Lanes: 5, Width: 12.0m, Bridge: False)
c_name = "A2_primary_223980109"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 223980110 (Type: primary, Lanes: 5, Width: 12.0m, Bridge: False)
c_name = "A2_primary_223980110"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 223980111 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_223980111"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 264094888 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_264094888"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-4990.33, -1021.4, -18.43), (-4918.02, -1001.0, -18.43), (-4853.77, -981.0, -18.43), (-4794.99, -960.84, -18.43), (-4736.18, -940.02, -18.43), (-4701.8, -927.23, -18.43), (-4583.91, -883.37, -18.43), (-4372.49, -803.74, -18.43), (-4271.49, -766.49, -18.43), (-4075.98, -692.47, -17.14), (-3723.43, -561.09, -14.23)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 264094891 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_264094891"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3480.51, -452.78, -3.8), (-3729.84, -546.38, -12.15), (-4046.82, -665.25, -15.09), (-4276.89, -752.03, -18.43), (-4706.59, -913.06, -18.43), (-4746.2, -927.91, -18.43), (-4851.22, -964.3, -18.43), (-4918.05, -985.15, -18.43), (-4990.51, -1006.15, -18.43), (-5079.99, -1027.19, -18.43), (-5129.07, -1037.0, -18.43), (-5186.64, -1046.47, -18.43), (-5262.14, -1056.66, -18.43), (-5289.08, -1059.43, -18.43), (-5336.38, -1064.15, -18.43), (-5384.09, -1067.46, -18.43), (-5431.15, -1069.43, -18.43), (-5478.47, -1070.43, -18.43), (-5602.44, -1070.1, -18.43), (-5631.18, -1069.77, -18.43), (-5803.22, -1067.86, -18.43)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684295 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684295"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5671.7, 1989.85, 11.56), (5484.28, 1884.1, 17.74), (5421.42, 1849.06, 18.8), (5359.66, 1816.93, 17.43), (5297.58, 1788.35, 17.5), (5251.02, 1767.89, 14.3), (5223.34, 1755.87, 16.72), (5137.55, 1723.44, 10.99), (5041.55, 1693.07, 17.26), (4998.0, 1681.0, 13.07), (4954.56, 1670.19, 14.67)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684297 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684297"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6409.64, 2394.39, 9.02), (6454.55, 2419.72, 7.2)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684299 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684299"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684300 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684300"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684301 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684301"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684305 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684305"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684308 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684308"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684310 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684310"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684312 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684313 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684313"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684315 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684315"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684316 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684316"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684317 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684317"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5853.58, 2094.37, 18.98), (5817.66, 2074.04, 20.19)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684318 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684318"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5500.59, 1873.78, 8.88), (5707.28, 1993.42, 10.66)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684319 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684319"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6698.24, 2576.91, 0.41), (6661.21, 2556.72, 1.43), (6027.04, 2193.2, 11.61), (5853.58, 2094.37, 18.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684321 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684321"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684322 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684322"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5756.92, 2021.98, 11.28), (6038.02, 2181.35, 11.65), (6365.33, 2369.2, 9.46), (6409.64, 2394.39, 9.02)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684326 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684326"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684327 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684327"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270684329 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684329"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-2726.33, -182.0, -5.92), (-2563.48, -120.98, -2.29)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270684330 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270684330"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 270854050 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270854050"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3723.43, -561.09, -14.23), (-3536.18, -490.2, -12.63)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270854051 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270854051"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3228.64, -374.19, 2.12), (-3172.6, -353.16, -9.47)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270854052 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270854052"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3012.01, -292.08, -8.16), (-2839.21, -224.73, -6.57), (-2790.63, -206.34, -5.36), (-2726.33, -182.0, -5.92)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 270854053 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_270854053"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3513.41, -481.57, -14.05), (-3228.64, -374.19, 2.12)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293841586 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293841586"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5918.64, 2170.93, 27.48), (5905.79, 2150.71, 18.39), (5892.32, 2135.45, 29.91), (5876.11, 2120.37, 22.48), (5853.58, 2094.37, 22.48)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293841593 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_293841593"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6882.62, 2681.7, -0.15), (6744.32, 2602.98, -0.72)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293841598 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293841598"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6526.55, 2502.79, 11.54), (6470.75, 2472.19, 13.85)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293843562 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293843562"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6333.78, 2320.87, 13.96), (6348.25, 2335.94, 14.1), (6366.71, 2349.27, 12.96), (6391.17, 2370.61, 12.96), (6409.64, 2394.39, 12.52)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293843563 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_293843563"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6606.46, 2506.16, 3.09), (6706.57, 2563.65, -0.32), (6839.27, 2638.87, -0.17), (6841.53, 2639.96, -0.17), (6885.02, 2665.34, 0.56), (7057.27, 2763.97, -2.51), (7202.73, 2846.55, -5.04), (7317.87, 2914.97, -7.05), (7541.44, 3052.75, -9.77), (7869.07, 3252.27, -9.77), (7950.33, 3301.8, -9.77), (8274.29, 3498.59, -9.77), (8365.76, 3555.51, -9.77), (8422.38, 3590.74, -9.77), (8555.87, 3673.8, -9.77), (8687.92, 3763.3, -9.77), (8795.18, 3843.42, -9.77), (8874.56, 3907.25, -9.77), (8940.89, 3969.98, -9.77), (8975.35, 4003.18, -9.77)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 293856340 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293856340"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 293857346 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293857346"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293857347 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293857347"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293857348 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293857348"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293857349 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293857349"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293857350 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293857350"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293857801 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293857801"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 293861512 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293861512"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 293861515 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293861515"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 293862838 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_293862838"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 293949593 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_293949593"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3249.43, -394.36, -4.36), (-3228.64, -374.19, 5.62)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 308444312 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_308444312"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 334057225 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_334057225"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4950.12, -1478.72, -5.02), (4940.84, -1435.32, -5.02), (4929.73, -1376.71, -5.02), (4896.37, -1206.64, -4.42), (4870.97, -1079.8, -4.42), (4862.29, -1036.44, -4.42)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 334057229 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_334057229"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4862.29, -1036.44, -4.42), (4807.73, -760.54, -4.11), (4765.55, -547.24, 1.42), (4763.7, -537.4, 1.42), (4761.07, -525.19, 2.56), (4759.81, -518.35, 2.56), (4691.83, -172.61, 3.96)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 334057230 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_334057230"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5135.67, -2406.29, -6.69), (5134.27, -2399.1, -6.69), (5123.94, -2347.37, -6.15), (5070.21, -2087.45, -6.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 354645828 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_354645828"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3246.0, 6171.2, -7.51), (3210.41, 6191.4, -7.41), (3174.47, 6211.94, -7.48), (3132.92, 6235.6, -7.5), (3132.16, 6235.93, -7.5), (3055.33, 6279.17, -7.58), (2987.73, 6317.71, -7.91), (2976.86, 6323.74, -7.91), (2921.52, 6355.36, -8.19), (2901.42, 6366.46, -8.46), (2865.48, 6382.87, -8.22), (2833.3, 6395.97, -8.66), (2794.03, 6407.45, -8.75), (2757.0, 6418.06, -8.47), (2715.83, 6431.83, -8.47), (2673.67, 6450.79, -9.07), (2657.55, 6457.95, -9.07), (2605.87, 6485.0, -9.68), (2601.46, 6487.04, -9.68), (2594.85, 6490.1, -9.95), (2563.27, 6506.5, -9.95)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 354645830 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_354645830"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3316.3, 6136.41, -8.22), (3293.92, 6145.17, -7.84), (3270.61, 6157.26, -7.71), (3246.0, 6171.2, -7.51)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 354645833 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_354645833"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2455.34, 6568.23, -12.32), (2447.66, 6574.78, -12.32), (2441.39, 6579.99, -13.33), (2425.95, 6595.63, -15.09), (2423.71, 6598.08, -15.09), (2412.86, 6609.97, -15.09), (2410.68, 6612.36, -15.09), (2408.87, 6614.35, -15.09), (2407.89, 6615.42, -15.09)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 354645834 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_354645834"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(2563.27, 6506.5, -9.95), (2519.88, 6528.55, -11.03), (2513.03, 6532.33, -11.03), (2485.67, 6547.67, -11.62), (2477.07, 6552.65, -12.32), (2455.34, 6568.23, -12.32)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 354645843 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_354645843"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3397.38, 6015.31, -8.57), (3364.35, 6116.95, -8.57), (3358.07, 6135.89, -8.57)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 356332161 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_356332161"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3940.98, 4330.61, 14.03), (3934.47, 4350.89, 18.67), (3932.73, 4356.31, 18.67), (3915.2, 4410.87, 18.61)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 356332162 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_356332162"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3963.99, 4259.42, 14.03), (3962.38, 4264.42, 14.03), (3948.84, 4306.31, 14.03), (3946.96, 4312.11, 14.03), (3940.98, 4330.61, 14.03)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 356332164 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_356332164"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3826.99, 4684.39, 16.65), (3823.91, 4694.09, 17.45), (3815.55, 4720.87, 17.45), (3810.07, 4735.16, 17.45), (3806.3, 4744.73, 16.84)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 419046677 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_419046677"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4516.69, 666.35, 8.02), (4513.73, 680.82, 9.08), (4508.82, 703.88, 9.08), (4500.35, 736.47, 8.94), (4496.91, 752.32, 8.94)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 427046729 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_427046729"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5275.31, -3079.58, -6.79), (5285.23, -3108.21, -6.79), (5295.96, -3139.16, -6.79), (5326.42, -3214.12, -6.63), (5352.35, -3277.67, -6.63), (5374.17, -3329.56, -6.02), (5388.24, -3367.51, -6.06), (5398.15, -3392.1, -6.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 427165801 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_427165801"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4644.83, 59.4, 9.37), (4636.65, 101.16, 10.81)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 496990379 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_496990379"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496990380 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_496990380"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496990381 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_496990381"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496990382 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_496990382"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496990383 (Type: motorway_link, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_link_496990383"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496990384 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_496990384"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496990385 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_496990385"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496990998 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_496990998"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496992656 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_496992656"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496992657 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_496992657"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496992658 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_496992658"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496992659 (Type: motorway_link, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_496992659"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496992660 (Type: motorway_link, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_link_496992660"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496992661 (Type: motorway_link, Lanes: 1, Width: 5.5m, Bridge: False)
c_name = "A2_motorway_link_496992661"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496996171 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_496996171"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 496996574 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_496996574"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
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

# A2 Segment 496996575 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_496996575"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 497088519 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_497088519"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3915.2, 4410.87, 18.61), (3907.8, 4433.83, 18.61), (3826.99, 4684.39, 16.65)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 497088520 (Type: primary, Lanes: 5, Width: 12.0m, Bridge: False)
c_name = "A2_primary_497088520"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3806.3, 4744.73, 16.84), (3791.41, 4790.74, 16.84), (3778.67, 4830.96, 16.84), (3777.55, 4834.74, 16.84), (3774.41, 4846.97, 16.84)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 497092749 (Type: primary, Lanes: 5, Width: 12.0m, Bridge: False)
c_name = "A2_primary_497092749"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3774.41, 4846.97, 16.84), (3772.32, 4854.27, 16.84)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 585272549 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_585272549"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5072.78, 1685.54, 12.06), (5144.73, 1710.45, 10.99), (5232.65, 1743.33, 10.8), (5306.59, 1775.08, 9.87), (5399.09, 1818.36, 13.22), (5436.74, 1838.49, 11.03), (5500.59, 1873.78, 8.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 593545707 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_593545707"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 593561591 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_593561591"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 593561592 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_593561592"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 621168813 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_621168813"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3514.4, 5655.74, -9.27), (3511.17, 5663.66, -9.27), (3502.59, 5689.72, -9.27)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621168816 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_621168816"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3697.04, 5547.14, 14.32), (3677.8, 5561.19, 4.05), (3658.12, 5572.87, 4.05), (3637.5, 5583.27, -4.01), (3619.78, 5591.29, -8.84)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621168819 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621168819"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3746.06, 4981.88, 15.98), (3746.53, 4992.88, 15.98), (3747.73, 5002.57, 15.98), (3749.74, 5014.54, 16.98), (3751.82, 5023.2, 16.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621168823 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621168823"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3752.41, 4917.88, 16.98), (3750.1, 4926.11, 16.98), (3747.26, 4941.54, 15.98), (3745.95, 4955.88, 15.98), (3745.6, 4969.95, 15.98), (3746.06, 4981.88, 15.98)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216617 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216617"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5018.32, -1820.31, -6.47), (5007.56, -1766.73, -5.6)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216620 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_621216620"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5007.56, -1766.73, -5.6), (4988.73, -1671.3, -5.6)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216621 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216621"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4988.73, -1671.3, -5.6), (4980.44, -1629.49, -5.6), (4975.6, -1605.26, -5.05), (4968.41, -1569.26, -5.05), (4959.01, -1522.97, -5.05)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216622 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216622"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4522.08, 641.42, 7.54), (4516.69, 666.35, 8.02)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216623 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_621216623"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4523.39, 633.91, 7.54), (4522.08, 641.42, 7.54)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216626 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216626"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4496.91, 752.32, 8.94), (4486.61, 792.4, 10.34), (4477.12, 834.65, 10.52)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216628 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_621216628"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4477.12, 834.65, 10.52), (4444.67, 975.69, 11.11), (4436.61, 1014.47, 13.27), (4428.72, 1058.05, 16.18)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216629 (Type: primary, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216629"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4428.72, 1058.05, 16.18), (4425.0, 1079.52, 12.45)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216631 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216631"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4425.0, 1079.52, 12.45), (4419.22, 1117.86, 11.76)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 621216638 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_621216638"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4419.22, 1117.86, 11.76), (4414.45, 1152.62, 8.88)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 626036802 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_626036802"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4691.83, -172.61, 3.96), (4659.2, -16.29, 6.38)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797520519 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797520519"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3172.6, -353.16, -9.47), (-3012.01, -292.08, -8.16)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797520520 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797520520"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(-3536.18, -490.2, -12.63), (-3513.41, -481.57, -14.05)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797523692 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797523692"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6744.32, 2602.98, -0.72), (6698.24, 2576.91, 0.41)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797523693 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797523693"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(6454.55, 2419.72, 7.2), (6606.46, 2506.16, 3.09)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797523694 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797523694"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5817.66, 2074.04, 20.19), (5671.7, 1989.85, 11.56)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 797523695 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_797523695"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5707.28, 1993.42, 10.66), (5756.92, 2021.98, 11.28)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 820292571 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_820292571"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(3715.95, 5530.03, 15.98), (3708.44, 5537.19, 14.32), (3697.04, 5547.14, 14.32)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 980591348 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_980591348"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5065.42, -2060.63, -6.0), (5064.57, -2055.71, -6.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 980591349 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_980591349"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5070.21, -2087.45, -6.0), (5065.42, -2060.63, -6.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 980598379 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_980598379"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(4659.2, -16.29, 6.38), (4644.83, 59.4, 9.37)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 1051888206 (Type: primary, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_primary_1051888206"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5398.15, -3392.1, -6.06), (5405.77, -3411.02, -6.06), (5412.22, -3426.22, -6.06)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 1077778750 (Type: primary, Lanes: 2, Width: 5.5m, Bridge: False)
c_name = "A2_primary_1077778750"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 2.75 # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = [(5057.78, -2019.58, -6.0), (5052.14, -1991.97, -6.0)]
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)

# A2 Segment 1498285739 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_1498285739"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 1513143689 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_1513143689"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 1513143699 (Type: motorway, Lanes: 3, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_1513143699"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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

# A2 Segment 1513143700 (Type: motorway, Lanes: 4, Width: 12.0m, Bridge: False)
c_name = "A2_motorway_1513143700"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = 6.0 # Exact 3D road width in meters!
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
