spath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\components\SimDevPage.tsx"
with open(spath, "r", encoding="utf-8") as f:
    sc = f.read()

# 1. Update instruction text
old_inst = "W/S = Ga/Phanh · A/D = Lái · Shift = Boost · Q/E = Xi-nhan"
new_inst = "W = Ga (tiến/lùi theo số) · S = Phanh · 1/2/3/4 = Số P/R/N/D · A/D = Lái · Shift = Boost · Q/E = Xi-nhan"
if old_inst in sc:
    sc = sc.replace(old_inst, new_inst)
    print("Updated instruction text.")

# 2. Update gear buttons
old_gears = """              {/* Thanh chọn số P R N D */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                {['P', 'R', 'N', 'D'].map((g) => (
                  <span key={g} style={{
                    fontSize: 12, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                    background: rule?.gear === g ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: rule?.gear === g ? '#0f172a' : '#64748b',
                    boxShadow: rule?.gear === g ? '0 0 8px #38bdf8' : 'none'
                  }}>{g}</span>
                ))}
              </div>"""

new_gears = """              {/* Thanh chọn số P R N D */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 4, pointerEvents: 'auto' }}>
                {(['P', 'R', 'N', 'D'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={(e) => {
                      e.stopPropagation();
                      sceneHandle?.setGear?.(g);
                    }}
                    style={{
                      fontSize: 12, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                      background: rule?.gear === g ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                      color: rule?.gear === g ? '#0f172a' : '#94a3b8',
                      boxShadow: rule?.gear === g ? '0 0 10px #38bdf8' : 'none',
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    title={`Phím số ${g === 'P' ? '1' : g === 'R' ? '2' : g === 'N' ? '3' : '4'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>"""

if old_gears in sc:
    sc = sc.replace(old_gears, new_gears)
    print("Updated gear buttons in SimDevPage.tsx.")
else:
    print("Could not find old_gears.")

with open(spath, "w", encoding="utf-8") as f:
    f.write(sc)
print("Saved SimDevPage.tsx.")
