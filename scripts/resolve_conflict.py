import os

app_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    c = f.read()

idx1 = c.find("<<<<<<< HEAD")
idx2 = c.find(">>>>>>> wip/road-geometry")
if idx1 != -1 and idx2 != -1:
    end_line = c.find("\n", idx2) + 1
    replacement = "          <Route path=\"/simulation\" element={<SimDevPage />} />\n          <Route path=\"/sim-dev\" element={<SimDevPage />} />\n"
    c = c[:idx1] + replacement + c[end_line:]
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Resolved conflict in App.jsx.")
else:
    print("Could not find conflict markers in App.jsx.")
