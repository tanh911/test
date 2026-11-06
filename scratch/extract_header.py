# -*- coding: utf-8 -*-
"""Refactor A3 (riêng): trích SimHeaderBar."""
import io
import re

P = 'src/components/DrivingSimulation.jsx'
src = io.open(P, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in src else '\n'

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

start_marker = '      {/* 🌟 1. UNIFIED SLIM HEADER'
end_marker = '      {isDriving && ('
s_idx = src.index(start_marker)
e_idx = src.index(end_marker, s_idx)
assert src.count(start_marker) == 1
block = src[s_idx:e_idx].rstrip()
lines = [ln[6:] if ln.startswith('      ') else ln for ln in block.split(nl)]
body = nl.join(lines)
props = []
for k in sorted(known):
    if re.search(r'(?<![\w$.])' + re.escape(k) + r'(?![\w$])', body):
        props.append(k)
comp = ('// tách từ DrivingSimulation.jsx (refactor phase A3)' + nl) + nl + \
    'export const SimHeaderBar = ({ ' + ', '.join(props) + ' }) => (' + nl + body + nl + ');' + nl
io.open('src/components/sim/SimHeaderBar.jsx', 'w', encoding='utf-8', newline='').write(comp)
src2 = src[:s_idx] + '      <SimHeaderBar ' + ' '.join(pr + '={' + pr + '}' for pr in props) + ' />' + nl + src[e_idx:]
io.open(P, 'w', encoding='utf-8', newline='').write(src2)
print('SimHeaderBar props:', props)
print('done | lines:', src2.count(NL))
