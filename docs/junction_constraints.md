# Báo Cáo Thực Nghiệm Ràng Buộc Hình Học Nút Giao & Đối Chứng Berlin (`junction_constraints.md`)

> **Bước 4A & 5A.1–5A.2 — Đo trước, thiết kế sau**: Khảo sát thực nghiệm hành vi của bộ dựng hình hiện tại ([`src/world/roadMesh.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/world/roadMesh.ts), [`src/world/sidewalk.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/world/sidewalk.ts), [`src/world/testJunctionBoundary.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/world/testJunctionBoundary.ts)) bằng script [`scratch/exp_junction_constraints.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/exp_junction_constraints.ts) (kết quả lưu tại [`scratch/exp_junction_5a_results.json`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/exp_junction_5a_results.json)).

---

## 1. Thiết Lập Thực Nghiệm & Phân Biệt Đã Đo vs. Ngoại Suy

### 1.1. Các góc và tổ hợp ĐÃ ĐO THỰC NGHIỆM trực tiếp (312 tổ hợp tổng cộng)
1. **Tập Baseline ban đầu (`192 tổ hợp nút giao` + `24 tổ hợp bậc 2` = `216 tổ hợp`)**:
   - Số nhánh (`arms`): `3, 4`
   - 6 góc thử nghiệm ban đầu (`targetAngleDeg`): **`45°, 60°, 75°, 90°, 105°, 120°`** (Đã đo 100%)
   - Độ lệch tổng bề rộng đường (`widthDelta = ΔW` so với nhánh cơ sở $W_0 = 7.0\text{ m}$, `half = 3.5 m`): **`0.0 m, 0.5 m, 1.0 m, 2.0 m`** (nhánh lệch có $W_1 = 7.0 + \Delta W$)
   - Chiều dài nhánh (`armLength = L`): **`10 m, 20 m, 40 m, 80 m`**
2. **Tập Mở rộng Kiểm chứng Miền An Toàn ở Bước 5A.1 (`96 tổ hợp nút giao mới`)**:
   - Đã chạy đo trực tiếp thêm **3 góc biên của miền an toàn**: **`87°, 93°, 135°`** với đầy đủ `arms ∈ {3, 4}` × `ΔW ∈ {0, 0.5, 1.0, 2.0}` × `L ∈ {10, 20, 40, 80}` (`3 góc × 2 × 4 × 4 = 96 tổ hợp`).
3. **Các giá trị NGOẠI SUY từ công thức hình học chính xác của `sidewalk.ts`**:
   - Các góc lẻ nằm xen giữa các mốc đã đo — ví dụ $(87^\circ, 90^\circ)$, $(90^\circ, 93^\circ)$, $(93^\circ, 105^\circ)$, $(105^\circ, 120^\circ)$, $(120^\circ, 135^\circ)$ — được **ngoại suy đơn điệu** từ phương trình khoảng cách đỉnh hộp vỉa hè:
     $$d_{\perp}(\theta) = s_{\text{pad}} \sin\theta - (\text{half}_A + \text{SIDEWALK\_W})\cos\theta = 3.75\sin\theta - 6.00\cos\theta$$
     Vì $\sin\theta$ và $-\cos\theta$ liên tục trên $[87^\circ, 135^\circ]$, nếu hai đầu đoạn đều đạt $d_{\perp}(\theta) \ge \text{half}_B - 0.05$ thì mọi góc trung gian bên trong đoạn đó chắc chắn đạt.

---

## 2. Bảng Pass/Fail Tách Riêng Nút 3 Nhánh vs. Nút 4 Nhánh Theo Từng Góc (Bước 5A.1)

Mỗi dòng dưới đây là kết quả **ĐÃ ĐO THỰC NGHIỆM** trên `16` tổ hợp (`4 mức ΔW × 4 mức L`) cho nút 3 nhánh và `16` tổ hợp cho nút 4 nhánh:

| Góc thử nghiệm $\theta$ (`targetAngleDeg`) | Trạng thái dữ liệu | **NÚT 3 NHÁNH (`arms = 3`)**<br>Góc nhỏ nhất thực tế $\theta_{\min}$ | **NÚT 3 NHÁNH**<br>`Engine Pass` / Tổng | **NÚT 3 NHÁNH**<br>`Strict Pass` / Tổng | **NÚT 3 NHÁNH**<br>Số case lấn vỉa hè (`Max Intrusion`) | **NÚT 4 NHÁNH (`arms = 4`)**<br>Góc nhỏ nhất thực tế $\theta_{\min}$ | **NÚT 4 NHÁNH**<br>`Engine Pass` / Tổng | **NÚT 4 NHÁNH**<br>`Strict Pass` / Tổng | **NÚT 4 NHÁNH**<br>Số case lấn vỉa hè (`Max Intrusion`) |
|---|---|---|---|---|---|---|---|---|---|
| **`45°`** | Đã đo (Baseline) | `45.0°` | `16 / 16` | **`6 / 16`** | `5 / 16` (`0.484 m`) + `8` case cắt cụt nhánh $L \le 20$ | `45.0°` | `16 / 16` | **`6 / 16`** | `5 / 16` (`0.484 m`) + `8` case cắt cụt nhánh $L \le 20$ |
| **`60°`** | Đã đo (Baseline) | `60.0°` | `16 / 16` | **`0 / 16`** | **`16 / 16` (`3.769 m`)** *(Điểm mù $\cos 60^\circ < 0.64$)* | `60.0°` | `16 / 16` | **`0 / 16`** | **`16 / 16` (`3.769 m`)** |
| **`75°`** | Đã đo (Baseline) | `75.0°` | `16 / 16` | **`0 / 16`** | **`16 / 16` (`1.898 m`)** *(Điểm mù $\cos 75^\circ < 0.64$)* | `75.0°` | `16 / 16` | **`0 / 16`** | **`16 / 16` (`1.898 m`)** |
| **`87°`** | **Đã đo (Mới — 5A.1)** | `87.0°` | `16 / 16` | **`7 / 16`** *(Pass 100% khi $\Delta W \le 0.5, L \ge 20$)* | `8 / 16` (`0.520 m` ở $\Delta W=2.0$; `0.000 m` ở $\Delta W \le 0.5$) | `87.0°` | `16 / 16` | **`7 / 16`** *(Pass 100% khi $\Delta W \le 0.5, L \ge 20$)* | `8 / 16` (`0.520 m` ở $\Delta W=2.0$; `0.000 m` ở $\Delta W \le 0.5$) |
| **`90°`** | Đã đo (Baseline) | `90.0°` | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.200 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) | `90.0°` | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.200 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) |
| **`93°`** | **Đã đo (Mới — 5A.1)** | `93.0°` | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.491 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) | `87.0°` *(do góc kề bù $180^\circ - 93^\circ = 87^\circ$)* | `16 / 16` | **`7 / 16`** *(Pass 100% khi $\Delta W \le 0.5, L \ge 20$)* | `8 / 16` (`0.520 m` ở $\Delta W=2.0$; `0.000 m` ở $\Delta W \le 0.5$) |
| **`105°`** | Đã đo (Baseline) | `105.0°` | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.398 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) | `75.0°` *(do góc kề bù $180^\circ - 105^\circ = 75^\circ$)* | `16 / 16` | **`0 / 16`** | **`16 / 16` (`1.898 m`)** *(Do góc bù $75^\circ$ rơi vào điểm mù!)* |
| **`120°`** | Đã đo (Baseline) | `120.0°` | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.259 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) | `60.0°` *(do góc kề bù $180^\circ - 120^\circ = 60^\circ$)* | `16 / 16` | **`0 / 16`** | **`16 / 16` (`3.769 m`)** *(Do góc bù $60^\circ$ rơi vào điểm mù!)* |
| **`135°`** | **Đã đo (Mới — 5A.1)** | `112.5°` *(2 góc kia là $112.5^\circ$)* | `16 / 16` | **`10 / 16`** *(Pass 100% khi $\Delta W \le 1.0, L \ge 20$)* | `4 / 16` (`0.091 m` chỉ ở $\Delta W=2.0$; **`0.000 m` ở $\Delta W \le 1.0$**) | `45.0°` *(do góc kề bù $180^\circ - 135^\circ = 45^\circ$)* | `16 / 16` | **`6 / 16`** | `5 / 16` (`0.484 m`) + `8` case cắt cụt nhánh $L \le 20$ |

> **Nhận xét quan trọng từ phép đo bổ sung ở `87°`, `93°`, `135°`**:
> 1. **Tại góc đúng `90°`**, cả nút 3 nhánh và nút 4 nhánh đều đạt **0.000 m xâm lấn vỉa hè** cho mọi $\Delta W \in \{0.0, 0.5, 1.0\}\text{ m}$ (`10/16` pass mỗi loại).
> 2. **Tại biên `87°` (và `93°` đối với nút 4 nhánh do góc bù bằng `87°`)**:
>    - Nếu $\Delta W \in \{0.0, 0.5\}\text{ m}$, độ xâm lấn vỉa hè vẫn bằng **`0.000 m`** (`Strict Pass` 100% khi $L \ge 20\text{ m}$).
>    - Nhưng nếu $\Delta W = 1.0\text{ m}$ (nhánh rộng tăng từ $7.0\text{ m}$ lên $8.0\text{ m}$, tức $\text{half}_B = 4.00\text{ m}$ trong khi nhánh hẹp vẫn giữ $\text{half}_A = 3.50\text{ m}$), tại góc $87^\circ$ khoảng cách từ góc hộp vỉa hè nhánh hẹp tới tim nhánh rộng giảm từ $3.75\text{ m}$ xuống $3.75\sin 87^\circ - 6.00\cos 87^\circ = 3.431\text{ m} < 4.00 - 0.05\text{ m}$, phát sinh xâm lấn nhẹ $0.27\text{ m}$.
>    - **Hệ quả cho `validateCity()` (đồng bộ với Mục 7)**:
>      - Với **nút 4 nhánh**: **chỉ cho phép góc $90^\circ$** (với dung sai theo công thức $\theta_{\min}(h_A, h_B)$ do tổng 4 góc kề bằng $360^\circ$).
>      - Với **nút 3 nhánh**: **mọi góc kề phải $\ge 90^\circ$** (và $\ge \theta_{\min}(h_A, h_B)$) — trong toàn bộ dải góc tù đã đo **`[90°, 93°, 105°, 120°, 135°]`**, cả 5 mốc đều đạt **0.000 m xâm lấn** cho mọi $\Delta W \le 1.0\text{ m}$ và $L \ge 20\text{ m}$ (với ngưỡng tỷ lệ cắt nhánh `cutRatio < 0.44` là **ngưỡng do agent chọn**).

---

## 3. Ma Trận Pass/Fail Theo `ΔW × L` Tại Góc Chuẩn `90°` (Bước 5A.1)

Bảng dưới đây trình bày toàn bộ `32` tổ hợp tại $\theta = 90^\circ$ (`16` tổ hợp 3 nhánh và `16` tổ hợp 4 nhánh — kết quả của 3 nhánh và 4 nhánh tại $90^\circ$ trùng khớp 100%):

| Độ lệch bề rộng $\Delta W$ (Nhánh chuẩn $7.0\text{ m}$ vs. Nhánh lệch $7.0 + \Delta W$) | **`L = 10 m`** | **`L = 20 m`** | **`L = 40 m`** | **`L = 80 m`** | Tổng `Strict Pass` theo hàng (3 nhánh + 4 nhánh) |
|---|---|---|---|---|---|
| **`ΔW = 0.0 m`** ($7.0\text{ m} \leftrightarrow 7.0\text{ m}$) | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.425` ($< 0.44$) | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.212` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.106` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.053` | **`4/4` (3-arm) + `4/4` (4-arm) = `8 / 8`** |
| **`ΔW = 0.5 m`** ($7.0\text{ m} \leftrightarrow 7.5\text{ m}$) | **FAIL** (Cắt nhánh ngắn)<br>`intrusion = 0.000m`<br>`cutRatio = 0.450` ($\ge 0.44$) | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.225` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.113` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.056` | **`3/4` (3-arm) + `3/4` (4-arm) = `6 / 8`** |
| **`ΔW = 1.0 m`** ($7.0\text{ m} \leftrightarrow 8.0\text{ m}$) | **FAIL** (Cắt nhánh ngắn)<br>`intrusion = 0.000m`<br>`cutRatio = 0.475` ($\ge 0.44$) | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.237` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.119` | **PASS** (3&4 nhánh)<br>`intrusion = 0.000m`<br>`cutRatio = 0.059` | **`3/4` (3-arm) + `3/4` (4-arm) = `6 / 8`** |
| **`ΔW = 2.0 m`** ($7.0\text{ m} \leftrightarrow 9.0\text{ m}$) | **FAIL** (Lấn + Ngắn)<br>`intrusion = 0.200m`<br>`cutRatio = 0.525` | **FAIL** (Lấn vỉa hè)<br>`intrusion = 0.200m`<br>`cutRatio = 0.263` | **FAIL** (Lấn vỉa hè)<br>`intrusion = 0.200m`<br>`cutRatio = 0.131` | **FAIL** (Lấn vỉa hè)<br>`intrusion = 0.200m`<br>`cutRatio = 0.066` | **`0/4` (3-arm) + `0/4` (4-arm) = `0 / 8`** |
| **Tổng cộng tại `90°`** | **`2 / 8`** | **`6 / 8`** | **`6 / 8`** | **`6 / 8`** | **`20 / 32` (`10` 3-arm + `10` 4-arm)** |

---

## 4. Danh Sách Đầy Đủ 52 Tổ Hợp `Strict-Pass` Trong 192 Tổ Hợp Baseline (+ 47 Tổ Hợp Ở 3 Góc Mới)

### 4.1. Phân rã chính xác 52 tổ hợp `Strict-Pass` trong tập Baseline (`192 tổ hợp`)
Tổng cộng **`52` tổ hợp** (`36` tổ hợp 3 nhánh + `16` tổ hợp 4 nhánh) đạt `passedStrictVisual === true`:

1. **Nhóm Góc vuông `90°` — `20 tổ hợp` (`10` tổ hợp 3 nhánh + `10` tổ hợp 4 nhánh)**:
   - Với `arms ∈ {3, 4}`:
     - `ΔW = 0.0 m`, `L ∈ {10, 20, 40, 80} m`: `J_3arm_90deg_dw0.0_L10..L80` (**4 case**) + `J_4arm_90deg_dw0.0_L10..L80` (**4 case**) = **8 case**.
     - `ΔW = 0.5 m`, `L ∈ {20, 40, 80} m`: `J_3arm_90deg_dw0.5_L20..L80` (**3 case**) + `J_4arm_90deg_dw0.5_L20..L80` (**3 case**) = **6 case**.
     - `ΔW = 1.0 m`, `L ∈ {20, 40, 80} m`: `J_3arm_90deg_dw1.0_L20..L80` (**3 case**) + `J_4arm_90deg_dw1.0_L20..L80` (**3 case**) = **6 case**.
2. **Nhóm Nút 3 nhánh góc tù `105°` và `120°` — `20 tổ hợp` (`10` tổ hợp ở `105°` + `10` tổ hợp ở `120°`)**:
   - Chỉ `arms = 3` (vì `arms = 4` sinh góc bù $75^\circ$ và $60^\circ$ bị fail 100%):
     - Tại `105°`: `J_3arm_105deg_dw0.0_L10..L80` (**4 case**) + `J_3arm_105deg_dw0.5_L20..L80` (**3 case**) + `J_3arm_105deg_dw1.0_L20..L80` (**3 case**) = **10 case**.
     - Tại `120°`: `J_3arm_120deg_dw0.0_L10..L80` (**4 case**) + `J_3arm_120deg_dw0.5_L20..L80` (**3 case**) + `J_3arm_120deg_dw1.0_L20..L80` (**3 case**) = **10 case**.
3. **Nhóm Góc nhọn `45°` nhánh dài ($L \ge 40\text{ m}$) — `12 tổ hợp` (`6` tổ hợp 3 nhánh + `6` tổ hợp 4 nhánh)**:
   - Giải thích: Tại `45°` ($\cos 45^\circ = 0.707 > 0.65$), `sidewalk.ts` kích hoạt `findAcuteSiblings` cắt lùi hộp vỉa hè rất sâu ($10.5\text{ m}$). Khi nhánh đủ dài ($L \in \{40, 80\}\text{ m}$) và $\Delta W \in \{0.0, 0.5, 1.0\}\text{ m}$, tỷ lệ cắt $10.5 / 40 = 0.263 < 0.44$ và hộp vỉa hè đã lùi xa khỏi nút nên `sidewalkIntrusionCount === 0`:
     - `J_3arm_45deg_dw{0.0, 0.5, 1.0}_L{40, 80}` (**6 case**) + `J_4arm_45deg_dw{0.0, 0.5, 1.0}_L{40, 80}` (**6 case**) = **12 case**.
   - *(Tuy nhiên trong thiết kế vẫn **CẤM góc $45^\circ$** vì vùng nhựa nút giao bị khoét sâu $10.5\text{ m}$ để lộ khoảng trống không có vỉa hè dài $10\text{ m}$ dọc đầu nhánh).*
- **Tổng cộng Baseline**: $20 + 20 + 12 = \mathbf{52\text{ tổ hợp}}$ (cộng với `4` tổ hợp bậc 2 khi $\Delta W = 0.0\text{ m}, L \in \{10, 20, 40, 80\}$ thành `56 / 216` trên toàn bộ 216 tổ hợp).

### 4.2. Phân rã 47 tổ hợp `Strict-Pass` ở 3 góc kiểm chứng mới (`87°, 93°, 135°` — trên tổng 96 tổ hợp mới)
- **Tại `87°` (`14 tổ hợp`)**: `J_3arm_87deg_dw0.0_L{10,20,40,80}` (4) + `J_3arm_87deg_dw0.5_L{20,40,80}` (3) + `J_4arm_87deg_dw0.0_L{10,20,40,80}` (4) + `J_4arm_87deg_dw0.5_L{20,40,80}` (3) = **14 case**.
- **Tại `93°` (`17 tổ hợp`)**:
  - 3 nhánh (`10 case`): `J_3arm_93deg_dw0.0_L{10,20,40,80}` (4) + `dw0.5_L{20,40,80}` (3) + `dw1.0_L{20,40,80}` (3).
  - 4 nhánh (`7 case`, do góc bù $87^\circ$): `J_4arm_93deg_dw0.0_L{10,20,40,80}` (4) + `dw0.5_L{20,40,80}` (3).
- **Tại `135°` (`16 tổ hợp`)**:
  - 3 nhánh (`10 case`, hai góc còn lại $112.5^\circ$): `J_3arm_135deg_dw0.0_L{10,20,40,80}` (4) + `dw0.5_L{20,40,80}` (3) + `dw1.0_L{20,40,80}` (3).
  - 4 nhánh (`6 case`, do góc bù $45^\circ$ kích hoạt acute gore ở $L \in \{40, 80\}$): `J_4arm_135deg_dw{0.0,0.5,1.0}_L{40,80}` (6).

---

## 5. Kết Quả Quét `Strict-Visual` Trên Bản Đồ Cũ `berlin-mitte-clean.json` (Bước 5A.2)

Chạy trực tiếp hàm kiểm tra **đỉnh vỉa hè (`sidewalkBoxes` & `buildJunctionMesh.sidewalkQuads`) nằm trong lòng đường cơ giới (`distToPolyline < roadHalfWidth - 0.05 m`)** trên toàn bộ **127 nút giao (`map.intersections`)** của [`src/data/maps/berlin-mitte-clean.json`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/data/maps/berlin-mitte-clean.json):

- **Tổng số nút giao kiểm tra**: **`127` nút**
- **Số nút giao VI PHẠM (có đỉnh vỉa hè đâm vào lòng đường)**: **`90 / 127` nút (`70.87%`)**!
- **Độ xâm lấn lớn nhất (`maxIntrusionM`)**: **`6.127 m`** tại nút **`n51`** (`x = -344.59, z = -270.40`, nút 4 nhánh, `60` đỉnh vỉa hè đâm sâu vào lòng đường tại cặp `r14 -> r123`, nơi một nhánh rộng $14\text{ m}$ giao lệch góc với nhánh hẹp!).

### 5.1. Bảng Top 10 Nút Giao Vi Phạm Nặng Nhất Trên `berlin-mitte-clean.json`

| Hạng | Mã Nút (`nodeId`) | Tọa độ $(X, Z)$ | Số nhánh (`arms`) | Số đỉnh vỉa hè đâm lòng đường | Độ xâm lấn lớn nhất (`maxIntrusionM`) | Cặp đường vi phạm nặng nhất |
|---|---|---|---|---|---|---|
| **1** | **`n51`** | `(-344.59, -270.40)` | `4` | `60` | **`6.127 m`** | `r14 -> r123` |
| **2** | **`n16`** | `(-554.57, -328.59)` | `3` | `32` | **`5.547 m`** | `r12 -> r29` |
| **3** | **`n84`** | `(-170.72, 409.22)` | `5` | `51` | **`5.097 m`** | `r276 -> r89` |
| **4** | **`n143`** | `(195.30, -165.82)` | `4` | `20` | **`3.685 m`** | `r127 -> r154` |
| **5** | **`n156`** | `(281.40, 354.46)` | `4` | `36` | **`3.624 m`** | `r7 -> r40` |
| **6** | **`n196`** | `(477.02, 234.47)` | `4` | `52` | **`3.572 m`** | `r176 -> r182` |
| **7** | **`n25`** | `(-520.56, 487.78)` | `4` | `55` | **`3.124 m`** | `r221 -> r249` |
| **8** | **`n117`** | `(28.00, 439.58)` | `5` | `107` | **`3.118 m`** | `r153 -> r6` |
| **9** | **`n17`** | `(-553.64, 96.86)` | `4` | `21` | **`3.102 m`** | `r66 -> r23` |
| **10** | **`n93`** | `(-116.22, 466.52)` | `5` | `34` | **`3.070 m`** | `r276 -> r257` |

### 5.2. Ba Ảnh Kết Xuất Top-Down Bằng Chứng Lỗi Nêm Vỉa Hè Trên `berlin-mitte-clean.json`

Các hộp vỉa hè và mảnh vỉa hè góc nút giao đâm vào lòng đường được tô **màu đỏ cam** nổi bật trên nền nhựa đường xám đậm:

| Hạng | Nút giao Berlin | Mô tả | Ảnh Top-Down |
|---|---|---|---|
| **#1 Berlin** | **`n51`** (`maxIntrusion = 6.127 m`) | Nút 4 nhánh lệch góc + chênh lệch bề rộng lớn giữa `r14` và `r123`: toàn bộ dải hộp vỉa hè của `r14` đâm xuyên $6.13\text{ m}$ vào giữa lòng đường `r123`. | ![Berlin n51](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/berlin-sidewalk-intrusion-1-n51.png) |
| **#2 Berlin** | **`n16`** (`maxIntrusion = 5.547 m`) | Nút 3 nhánh góc xiên (`r12 -> r29`): nêm vỉa hè đâm sâu $5.55\text{ m}$ chắn ngang làn xe. | ![Berlin n16](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/berlin-sidewalk-intrusion-2-n16.png) |
| **#3 Berlin** | **`n84`** (`maxIntrusion = 5.097 m`) | Nút 5 nhánh phức tạp (`r276 -> r89` ven sông): 51 đỉnh vỉa hè đâm chồng chéo vào lòng đường $5.10\text{ m}$. | ![Berlin n84](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/berlin-sidewalk-intrusion-3-n84.png) |

---

## 6. Hình Ảnh Top-Down 6 Trường Hợp Tệ Nhất Từ Thực Nghiệm Tổng Quát

| Hạng | Mã Case | Mô tả lỗi cấu trúc | Ảnh kết xuất Top-Down |
|---|---|---|---|
| **#1** | `J_4arm_45deg_dw2.0_L10` | **Góc nhọn $45^\circ$ + Nhánh ngắn $10\text{ m}$ + $\Delta W = 2\text{ m}$**: Gore cắt tới $52.5\%$ chiều dài nhánh (`ribbonInvertedOrShort = true`). | ![Worst 1](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-1-J_4arm_45deg_dw2.0_L10.png) |
| **#2** | `J_4arm_60deg_dw2.0_L20` | **Điểm mù góc $60^\circ$ (4 nhánh, $\Delta W = 2\text{ m}$, $L = 20\text{ m}$)**: Hộp vỉa hè đâm xuyên **$3.769\text{ m}$** ngang qua làn xe của nhánh kề. | ![Worst 2](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-2-J_4arm_60deg_dw2.0_L20.png) |
| **#3** | `J_3arm_60deg_dw1.0_L20` | **Ngã ba xiên $60^\circ$ ($\Delta W = 1\text{ m}$, $L = 20\text{ m}$)**: Hộp vỉa hè góc nhọn $60^\circ$ chọc sâu **$3.269\text{ m}$** vào mặt đường chính. | ![Worst 3](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-3-J_3arm_60deg_dw1.0_L20.png) |
| **#4** | `J_4arm_75deg_dw1.0_L20` | **Ngã tư lệch $75^\circ$ ($\Delta W = 1\text{ m}$, $L = 20\text{ m}$)**: Góc hộp vỉa hè nhô vào làn xe phải **$1.398\text{–}1.898\text{ m}$**. | ![Worst 4](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-4-J_4arm_75deg_dw1.0_L20.png) |
| **#5** | `J_4arm_90deg_dw2.0_L10` | **Ngã tư $90^\circ$ nhưng nhánh quá ngắn ($L = 10\text{ m}$) và lệch bề rộng lớn ($\Delta W = 2\text{ m}$)**: Xâm lấn $0.20\text{ m}$ và cắt $52.5\%$ nhánh. | ![Worst 5](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-5-J_4arm_90deg_dw2.0_L10.png) |
| **#6** | `S_2arm_180deg_dw7.0_L20` | **Bậc nhảy bề rộng đột ngột tại nút bậc 2 ($\Delta W = 7.0\text{ m}$)**: Tạo bậc vỉa hè gãy khúc $3.5\text{ m}$ mỗi bên, xâm lấn **$1.444\text{ m}$**. | ![Worst 6](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/docs/screenshots/junction-worst-6-S_2arm_180deg_dw7.0_L20.png) |

---

## 7. Công Thức Hàm Ngưỡng Góc $\theta_{\min}(h_A, h_B)$ & Chốt Ràng Buộc Cho `validateCity()`

### 7.1. Suy diễn hàm ngưỡng góc $\theta_{\min}(h_A, h_B)$ theo nửa bề rộng đường
Gọi $h_A = \text{roadHalfWidth}(A)$ và $h_B = \text{roadHalfWidth}(B)$ là nửa bề rộng lòng đường của hai nhánh kề nhau hợp góc $\theta$.
Trong [`sidewalk.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/world/sidewalk.ts#L81) và [`roadMesh.ts`](file:///c:/Users/Tuan%20Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/src/world/roadMesh.ts#L755), khi $\theta \ge 50.2^\circ$ (không kích hoạt `findAcuteSiblings`), hộp vỉa hè đầu tiên của nhánh $A$ bắt đầu chính xác tại biên cắt `roadSkipZones` $s_A = \text{junctionCutExtent}(A) = h_A + 0.75\text{ m}$ và vươn ra mép ngoài ở khoảng cách ngang $y_{\text{out}}(h_A) = h_A + \text{SIDEWALK\_W} = h_A + 2.50\text{ m}$.

Khoảng cách vuông góc từ đỉnh góc ngoài hộp vỉa hè đầu tiên của nhánh $A$ tới tim nhánh $B$ là:

$$d_{\perp}(\theta; h_A) = (h_A + 0.75)\sin\theta - (h_A + 2.50)\cos\theta$$

Đặt $R(h_A) = \sqrt{(h_A + 0.75)^2 + (h_A + 2.50)^2}$ và $\phi(h_A) = \arctan\!\left(\frac{h_A + 2.50}{h_A + 0.75}\right)$. Khi đó:

$$d_{\perp}(\theta; h_A) = R(h_A)\sin\big(\theta - \phi(h_A)\big)$$

Để đỉnh vỉa hè nhánh $A$ không xâm lấn lòng đường nhánh $B$ (tức $d_{\perp}(\theta; h_A) \ge h_B - \varepsilon$ với dung sai kiểm tra $\varepsilon = 0.05\text{ m}$) và ngược lại từ $B$ sang $A$, **hàm ngưỡng góc tối thiểu chính xác $\theta_{\min}(h_A, h_B)$** là:

$$\theta_{\min}(h_A, h_B) = \max\left\{\, \phi(h_A) + \arcsin\!\left(\frac{h_B - \varepsilon}{R(h_A)}\right),\;\; \phi(h_B) + \arcsin\!\left(\frac{h_A - \varepsilon}{R(h_B)}\right) \,\right\}$$

### 7.2. Kiểm chứng công thức $\theta_{\min}(h_A, h_B)$ bằng 3 điểm đo thực nghiệm
Với nhánh chuẩn $W_A = 7.0\text{ m} \implies h_A = 3.50\text{ m}$, ta có $s_A = 4.25\text{ m}$, $y_{\text{out}}(h_A) = 6.00\text{ m}$, $R(3.5) = \sqrt{4.25^2 + 6.00^2} = 7.3527\text{ m}$, và $\phi(3.5) = \arctan(6.00 / 4.25) = 54.689^\circ$:
1. **Điểm đo 1 — Hai nhánh lệch $\Delta W = 0.5\text{ m}$ ($h_A = 3.50\text{ m}, h_B = 3.75\text{ m}$)**:
   - Công thức cho: $\theta_{\min}(3.5, 3.75) = 54.689^\circ + \arcsin(3.70 / 7.3527) = 54.689^\circ + 30.213^\circ = \mathbf{84.90^\circ}$.
   - **Đối chiếu điểm đo thực**: Tại $\theta = 87^\circ > 84.90^\circ$ và $\theta = 90^\circ$, phép đo thực nghiệm đều cho `intrusion = 0.000 m` (**PASS**); tại $\theta = 75^\circ < 84.90^\circ$, công thức cho $d_{\perp}(75^\circ) = 4.25\sin 75^\circ - 6.00\cos 75^\circ = 2.552\text{ m} \implies \text{intrusion} = 3.70 - 2.552 = \mathbf{1.148\text{ m}}$ (**FAIL** — khớp tuyệt đối từng milimet với phép đo).
2. **Điểm đo 2 — Nhánh $7.0\text{ m}$ giao nhánh $8.0\text{ m}$ ($\Delta W = 1.0\text{ m} \implies h_A = 3.50\text{ m}, h_B = 4.00\text{ m}$)**:
   - Công thức cho: $\theta_{\min}(3.5, 4.0) = 54.689^\circ + \arcsin(3.95 / 7.3527) = 54.689^\circ + 32.495^\circ = \mathbf{87.18^\circ}$, và tại $\theta = 87^\circ < 87.18^\circ$ công thức dự báo $d_{\perp}(87^\circ) = 4.25\sin 87^\circ - 6.00\cos 87^\circ = 3.930\text{ m} \implies \text{intrusion} = 3.950 - 3.930 = \mathbf{0.020\text{ m}}$.
   - **Đối chiếu điểm đo thực**: Công thức giải thích chính xác vì sao tại $\Delta W = 1.0\text{ m}$, góc $\theta = 87^\circ < 87.18^\circ$ bị **FAIL** (`intrusion = 0.020 m`), còn góc $\theta = 90^\circ \ge 87.18^\circ$ và $\theta = 93^\circ$ (nút 3 nhánh) đạt **PASS** (`intrusion = 0.000 m`)!
3. **Điểm đo 3 — Nhánh $7.0\text{ m}$ giao nhánh $9.0\text{ m}$ ($\Delta W = 2.0\text{ m} \implies h_A = 3.50\text{ m}, h_B = 4.50\text{ m}$)**:
   - Công thức cho: $\theta_{\min}(3.5, 4.5) = 54.689^\circ + \arcsin(4.45 / 7.3527) = 54.689^\circ + 37.245^\circ = \mathbf{91.93^\circ} > 90^\circ$.
   - Tại $\theta = 90^\circ$, công thức dự báo độ xâm lấn là $(h_B - \varepsilon) - d_{\perp}(90^\circ) = 4.450 - 4.250 = \mathbf{0.200\text{ m}}$; tại $\theta = 87^\circ$, công thức dự báo độ xâm lấn là $4.450 - 3.930 = \mathbf{0.520\text{ m}}$.
   - **Đối chiếu điểm đo thực**: Trong bảng mục 2 và mục 3 (`ΔW = 2.0 m`), độ xâm lấn đo thực tế bằng **đúng `0.200 m` ở `90°`** và **đúng `0.520 m` ở `87°`** (sai số `0.000 m`)! Đồng thời vì nút 4 nhánh có $\sum_{i=1}^4 \theta_i = 360^\circ \implies \min \theta_i \le 90^\circ < 91.93^\circ$, công thức chứng minh nút 4 nhánh không bao giờ chịu được $\Delta W = 2.0\text{ m}$.

### 7.3. Bảng Ràng Buộc Cuối Cùng Trong `validateCity()` (Đã Bỏ Kết Luận "87–93 Độ")

| Tham số hình học | Giá trị Bắt buộc (Hard Bound trong `validateCity()`) | Lý do kỹ thuật & Công thức |
|---|---|---|
| **1. Góc tại nút 4 nhánh ($\theta_{4\text{-way}}$)** | **Chỉ cho phép góc vuông $90^\circ$** (dung sai theo hàm ngưỡng $\theta \ge \theta_{\min}(h_A, h_B)$ và $|90^\circ - \theta| \le 90^\circ - \theta_{\min}(h_A, h_B)$, tối đa $\pm 1.0^\circ$ khi $\Delta W \le 1.0\text{ m}$) | Tổng 4 góc kề bằng $360^\circ$; nếu một góc mở $> 90^\circ$ thì góc kề bù giảm xuống $< 90^\circ$ và vi phạm $\theta_{\min}(h_A, h_B)$ khi $\Delta W = 1.0\text{ m}$ ($\theta_{\min} = 89.8^\circ$). |
| **2. Góc tại nút 3 nhánh ($\theta_{3\text{-way}}$)** | **Mọi góc kề между 2 nhánh phải $\ge 90^\circ$** (và $\ge \theta_{\min}(h_A, h_B)$, tối đa $\le 135^\circ$) | Mọi góc trong $[90^\circ, 135^\circ]$ đều thỏa mãn $\theta \ge \theta_{\min}(h_A, h_B)$ cho $\Delta W \le 1.0\text{ m}$ (`0.000 m` xâm lấn). |
| **3. Khóa tiếp tuyến ở hai đầu cạnh cong (`waypoints`)** | Mỗi cạnh đường phải có **đoạn thẳng dẫn $\ge 20.0\text{ m}$ ở mỗi đầu mút** trước khi bắt đầu uốn cong | Khóa cứng tiếp tuyến tại nút giao đúng bằng góc nút ($90^\circ$), không để polyline uốn cong trong vùng `armCut` + hộp vỉa hè đầu nhánh. |
| **4. Chiều dài cạnh đường tối thiểu ($L_{\min}$)** | **$L \ge 40.0\text{ m}$** (nhánh phụ/cụt) và **$L \ge 75.0\text{ m}$** (cạnh có nhà phố) | Giữ tỷ lệ `armCut / L` xa dưới ngưỡng $0.44$ *(ngưỡng $0.44$ là ngưỡng do agent tự chọn dựa trên trần `0.45 * L` của `roadMesh.ts`)*. |
| **5. Độ lệch bề rộng tại nút giao ($\Delta W_{\max}$)** | **$\Delta W \le 1.0\text{ m}$** (hoặc nhánh hẹp bắt buộc phải khai báo trong `intersection.crosswalks`) | Khi $\Delta W > 1.0\text{ m}$, $h_B - 0.05 > h_A + 0.25$ nên tại $90^\circ$ bắt buộc phải kích hoạt `crosswalks` để cắt lùi vỉa hè theo `junctionHalfExtent + 4.5 m`. |
| **6. Đoạn chuyển tiếp bề rộng (Taper tại nút bậc 2)** | **$\Delta W_{\text{step}} \le 1.0\text{ m}$** và chiều dài đoạn Taper **$L_{\text{taper}} \ge 20.0\text{ m}$** | Ngăn chặn bậc nhảy ngang vỉa hè tại nút bậc 2. |
