with open('src/components/SimDevPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add import
if 'ModernCockpit' not in text:
    text = text.replace("import { MiniMap } from './MiniMap';", "import { MiniMap } from './MiniMap';\nimport { ModernCockpit } from './sim/ModernCockpit';")

# Find and replace the HUD section
start_marker = "          {/* Mini-map: góc dưới-trái (Prompt 10) */}"
end_marker = "          {/* Kết quả thi */}"

idx1 = text.find(start_marker)
idx2 = text.find(end_marker)

if idx1 != -1 and idx2 != -1:
    replacement = '''          {/* 🚗 MODERN COCKPIT OVERLAY (Buồng lái xe thể thao + Khung kính lái + Vô-lăng) */}
          {(!rule?.camMode || rule.camMode === 'cabin') && (
            <ModernCockpit
              speedKmh={rule?.speedKmh ?? 0}
              rpm={rule?.rpm ?? 850}
              gear={rule?.gear ?? 'D'}
              speedLimit={rule?.speedLimit ?? 50}
              signal={rule?.signal}
              steerAngle={rule?.steerAngle ?? 0}
              camMode={rule?.camMode ?? 'cabin'}
              onSelectGear={(g) => sceneHandle?.setGear?.(g)}
              onToggleCam={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' }));
              }}
              onToggleMirror={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
              }}
            />
          )}

          {/* Mini-map: góc dưới-trái */}
          {sceneHandle && (
            <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 35 }}>
              <MiniMap handle={sceneHandle} />
            </div>
          )}

          {/* HUD phụ khi ở camera ngoài (outside/shoulder) */}
          {rule?.camMode && rule.camMode !== 'cabin' && (
            <div style={{
              position: 'absolute', bottom: 24, right: 24,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.96) 100%)',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.35)', borderRadius: 16,
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 18,
              boxShadow: '0 12px 32px rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
              pointerEvents: 'none', zIndex: 35
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#f8fafc',
                border: `4px solid ${rule && (rule.speedKmh ?? 0) > (rule.speedLimit ?? 50) + 3 ? '#ef4444' : '#dc2626'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ color: '#0f172a', fontWeight: 900, fontSize: 17 }}>
                  {rule?.speedLimit ?? 50}
                </span>
              </div>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
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
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                  {rule?.speedKmh ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>km/h</div>
              </div>
            </div>
          )}
'''
    new_text = text[:idx1] + replacement + text[idx2:]
    with open('src/components/SimDevPage.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('SimDevPage.tsx updated successfully!')
else:
    print('Markers not found', idx1, idx2)
