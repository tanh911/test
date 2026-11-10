# -*- coding: utf-8 -*-
"""Refactor A3 v2: trích block JSX dùng MARKER SAU BLOCK làm ranh giới kết thúc.
Chạy 1 lần rồi xóa."""
import io
import re

P = 'src/components/DrivingSimulation.jsx'
src = io.open(P, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in src else '\n'

# ── Thu thập identifier cục bộ của component ──
known = set()
for m in re.finditer(r'const \[([a-zA-Z_$][\w$]*), (set[A-Z][\w$]*)\] = useState', src):
    known.add(m.group(1))
    known.add(m.group(2))
for m in re.finditer(r'const (handle[A-Za-z]\w*|toggle[A-Za-z]\w*|show[A-Za-z]\w*|set[A-Z][\w$]*) =', src):
    known.add(m.group(1))
for m in re.finditer(r'const \{([^}]*)\} = (?:refs|useSeatConfig)', src):
    for w in re.finditer(r'[A-Za-z_$][\w$]*', m.group(1)):
        known.add(w.group(0))
known |= {'refs', 'navigate', 'languageMode', 'DRIVING_TIPS', 'customMapData',
          'showAdjuster', 'seatConfig', 'loadingState'}


def unique(src, marker, after=0):
    assert src.count(marker, after) == 1, ('marker not unique or missing: ' + marker[:60])
    return src.index(marker, after)


def extract(src, cond_start, end_marker, comp_name, comp_imports='', keep_end=False, nl=None):
    cond_idx = unique(src, cond_start)
    if keep_end:
        # end_marker là marker SAU block; block = [cond_idx, marker_idx) — KHÔNG giữ marker
        marker_idx = unique(src, end_marker, cond_idx)
        block = src[cond_idx:marker_idx]
    block = block.rstrip() if keep_end else block
    assert block.endswith(')}'), (comp_name, repr(block[-30:]))
    b = block.strip()
    assert b.startswith('{') and b.rstrip().endswith(')}')
    inner = b[1:-1]  # bỏ { và } — inner kết thúc bằng )
    assert inner.rstrip().endswith(')')
    lines = [ln[6:] if ln.startswith('      ') else ln for ln in inner.split(nl)]
    body = nl.join(lines)
    props = []
    for k in sorted(known):
        if re.search(r'(?<![\w$.])' + re.escape(k) + r'(?![\w$])', body):
            props.append(k)
    comp = ('// tách từ DrivingSimulation.jsx (refactor phase A3)' + nl) + comp_imports + nl + nl + \
        'export const ' + comp_name + ' = ({ ' + ', '.join(props) + ' }) => (' + nl + body + nl + ');' + nl
    io.open('src/components/sim/' + comp_name + '.jsx', 'w', encoding='utf-8', newline='').write(comp)
    jsx_tag = '      <' + comp_name + ' ' + ' '.join(pr + '={' + pr + '}' for pr in props) + ' />'
    return src[:cond_idx] + jsx_tag + nl + src[marker_idx:] if keep_end else src, props


# ── 1. Loading screen: kết thúc trước "Menu Khởi Hành" ──
m_after = '      {/* Menu Khởi Hành'
src2, pr = extract(src, '      {loadingState.isLoading && (', m_after, 'SimLoadingScreen', keep_end=True, nl=NL)
print('SimLoadingScreen props:', pr)

# ── 2. Start menu: kết thúc trước collision card ──
m_after2 = '      {collision && ('
src2, pr = extract(src2, '      {!loadingState.isLoading && !showGuideModal && !isDriving && !finished && (',
                   m_after2, 'StartMenu', keep_end=True, nl=NL)
print('StartMenu props:', pr)

# ── 3. Options menu: kết thúc trước FlyToModal tag ──
m_after3 = '      <FlyToModal showFlyModal={showFlyModal}'
src2, pr = extract(src2, '      {showOptionsMenu && (', m_after3, 'SimOptionsMenu', keep_end=True, nl=NL)
print('SimOptionsMenu props:', pr)

# ── 4. Header bar: không có {cond &&} wrapper — block từ comment đến trước {isDriving && ( ──
start_marker = '      {/* 🌟 1. UNIFIED SLIM HEADER'
end_marker = '      {isDriving && ('
s_idx = unique(src2, start_marker)
e_idx = unique(src2, end_marker, s_idx)
block = src2[s_idx:e_idx].rstrip()
lines = [ln[6:] if ln.startswith('      ') else ln for ln in block.split(nl)]
body = nl.join(lines)
props = []
for k in sorted(known):
    if re.search(r'(?<![\w$.])' + re.escape(k) + r'(?![\w$])', body):
        props.append(k)
comp = ('// tách từ DrivingSimulation.jsx (refactor phase A3)' + nl) + nl +     'export const SimHeaderBar = ({ ' + ', '.join(props) + ' }) => (' + nl + body + nl + ');' + nl
io.open('src/components/sim/SimHeaderBar.jsx', 'w', encoding='utf-8', newline='').write(comp)
src2 = src2[:s_idx] + '      <SimHeaderBar ' + ' '.join(pr + '={' + pr + '}' for pr in props) + ' />' + nl + src2[e_idx:]
print('SimHeaderBar props:', props)

io.open(P, 'w', encoding='utf-8', newline='').write(src2)
print('done | lines:', src2.count(NL))
