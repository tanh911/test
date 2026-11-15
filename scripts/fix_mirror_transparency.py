with open('src/components/sim/ModernCockpit.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = "background: 'linear-gradient(180deg, #181c23 0%, #0c0e12 100%)',"
target2 = "background: 'linear-gradient(135deg, #181d26 0%, #0d1015 100%)',"
target3 = "background: 'linear-gradient(225deg, #181d26 0%, #0d1015 100%)',"

text = text.replace(target1, "background: 'transparent',")
text = text.replace(target2, "background: 'transparent',")
text = text.replace(target3, "background: 'transparent',")

with open('src/components/sim/ModernCockpit.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Made all mirror frames transparent to reveal 3D reflection!')
