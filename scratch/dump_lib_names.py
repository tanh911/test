import bpy
print('ALL CURVE OBJECT NAMES:')
for o in bpy.data.objects:
    if o.type == 'CURVE':
        mods = [(m.name, m.type) for m in o.modifiers]
        print(' -', o.name, '| mods:', mods[:3])
print('OBJECTS WITH ROADSCAPE IN NAME:')
for o in bpy.data.objects:
    if 'RDSCP' in o.name.upper() or 'MASTER' in o.name.upper() or 'TEMPLATE' in o.name.upper():
        print(' *', o.name, o.type)
