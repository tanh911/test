spath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\simScene.ts"
with open(spath, "r", encoding="utf-8") as f:
    sc = f.read()

target = "fps\n    }),"
replacement = """fps
    }),
    setGear: (g: 'P' | 'R' | 'N' | 'D') => {
      vehicle?.setGear(g);
    },"""

if target in sc:
    sc = sc.replace(target, replacement, 1)
    with open(spath, "w", encoding="utf-8") as f:
        f.write(sc)
    print("Added setGear to simScene.ts.")
else:
    print("Could not find target.")
