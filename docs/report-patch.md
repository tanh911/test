# Báo cáo vá giao lộ & kiểm định hình ảnh — viet-de-fuhrerschein (G1)

Mục tiêu G1: **không còn tam giác xanh (khe cỏ) nhìn thấy quanh ngã giao khi nhìn từ trên cao và zoom sát**. Ba vấn đề xử lý trong vòng này: (1) vạch kẻ xanh dương lẻ ra ngoài dải đường, (2) nền asphalt_worn che khe còn sót, (3) kiểm tra răng cưa mép vỉa hè.

> Lưu ý: chỉ commit whitelist — `roadMesh.ts`, `worldBuilder.ts`, `docs/report-patch.md`. KHÔNG stage `package.json/lock` hay `public/simv2/ped_*.glb`. Commit message bắt đầu "WIP:".

## Tóm tắt

| # | Nhiệm vụ | File / hàm | Kết quả (số liệu thật) |
|---|---|---|---|
| 1 | Vạch kẻ dùng độ rộng chính road | `src/world/worldBuilder.ts` — `buildWorld` | `maxHalf` → `roadHalfWidth(road)`; quad white trong ribbon: trước 19677/23270 (84,5% bad), sau 1909/22699 (8,4% bad) |
| 2 | Nền che khe dưới ngã giao | `src/world/roadMesh.ts` — `junctionBackgroundQuads` | Vòng tròn 32 đoạn, `road_worn`, y = −0,02, bán kính **1,15 × K_max** (giảm từ 1,6× để không lòi ra vỉa hè) |
| 3 | Draw call trước/sau nền | `buildWorld` + `ChunkBuilder` | before = **518**, after = **518** (không tăng; cùng material `road_worn`, gộp geometry cell) |
| 4 | buildMs `buildWorld(muenchen)` | vitest `performance.now()` | Trước nền: **299,48 ms** (74956 quads); sau nền: **318,92 ms** (79020 quads); cells = 150 |
| 5 | Test răng cưa mép vỉa hè / mép ribbon | `src/world/testJunctionBoundary.ts` — `collectSawtoothIssues` | 288 road kiểm, **0 vi phạm**, maxGap = 0,00 m |
| 6 | Kiểm định kiểu | `npx tsc --noEmit` | **14 lỗi, toàn pre-existing** trong HEAD (ruleEngine TS2729; demoAssets/npc/vehicle TS2339; renderer.test.ts TS18047; sidewalk.ts TS2322; testJunctionBoundary TS2304; debug-seam TS2307), **không có lỗi mới do vòng này** |
| 7 | Cổng dev server | `vite.config.js` | **3000** (không phải 5173) |

## (1) Vạch kẻ xanh dương mảnh chạy qua bãi cỏ — nguyên nhân và sửa

**Nguyên nhân:** Trong `src/world/worldBuilder.ts` (mục "Vạch kẻ"), mỗi road tính `maxHalf` = độ rộng nửa lớn nhất của các road gặp nhau ở ngã giao đầu road, rồi truyền vào `roadMarkingQuads(..., maxHalf)` làm `half`. Hàm `edgeLines` dựng vạch mép tại `±(half − 0,2)`. Vậy một đường nhỏ (nửa rộng 3 m) nối vào đường lớn (6 m) → `maxHalf=6` → vạch mép dựng ở `±5,8 m` từ centerline **road nhỏ**, nằm VÔAI dải ribbon ±3 m → vạch xanh dương chạy trên bãi cỏ / vỉa hè. Khớp với ảnh debug: các đường xanh dương mảnh lệch ra ngoài dải đỏ (mặt đường).

**Sửa:** Truyền `roadHalfWidth(road)` của chính road đó thay vì `maxHalf`. Vạch mép giờ dựng ở `±(half_own − 0,2)`, nằm trong dải ribbon ±half_own của chính road.

**Số liệu:** trên München, quad `white` nằm trong ribbon (±(half+MARK_W/2+0,2)):
- Trước (`maxHalf`): 19677/23270 bad ≈ **84,5%**
- Sau (`roadHalfWidth(road)`): 1909/22699 bad ≈ **8,4%**

Các bad còn lại (≈1909) cluster tại các điểm góc intersection (ví dụ (200.4,-190.3), (-110.3,301.3)) — cần chụp ảnh để xác nhận còn đường xanh trên cỏ không, hay chỉ là vạch dừng/zebra ở góc ngã giao (có thể chấp nhận).

## (2) Nền asphalt_worn che khe còn sót

`junctionBackgroundQuads(nodeX, nodeZ, connectedRoads)` trong `src/world/roadMesh.ts`:
- `K_max` = max `roadHalfWidth` của các road kết nối tại nút.
- Bán kính `r = 1,15 × K_max` (giảm từ 1,6× để không lòi ra vỉa hè ở góc giữa các nhánh).
- `y = −0,02` (duoi mặt đường, không z-fight).
- 32 đoạn tạo vòng tròn fan quanh nút, material `road_worn` (`asphaltWorn`).

Được gọi trong `buildWorld` sau junction patch của mỗi nút intersection. Mọi khe còn sót trong bo dem bán kính `r` hiện nền tối (asphalt_worn) thay vì cỏ.

**Draw call:** `ChunkBuilder.buildCell` gộp cùng 1 material trong cùng 1 cell thành 1 geometry = 1 draw call. Nền dùng cùng `road_worn` với junction patch → draw call **không tăng** (before=518, after=518). Quad `road_worn` tăng ≈ 127 nút × 32 đoạn = 4064 quad (74956 → 79020 quads).

**buildMs:** `performance.now()` quanh `buildWorld(muenchen)` trong vitest (không cần dev server): trước 299,48 ms, sau 318,92 ms (+≈20 ms).

## (3) Test răng cưa mép vỉa hè / mép ribbon

`collectSawtoothIssues` kiểm tra mép TRONG mỗi piece.về mép ribbon cùng road: **288 road kiểm, 0 vi phạm, maxGap = 0,00 m** — mép vỉa hè khít mép ribbon trên mọi road, không lệch quá 0,05 m.

## Cách kiểm thử trên trình duyệt

Dev server chạy tại **http://localhost:3000/** (vite.config.js, port 3000). Mở trang, bấm **G** để bật debug màu (`road_worn` = xanh lá, `white` = xanh dương), rồi chụp 5 ảnh:
1. Tổng thể từ trên cao.
2. Cụm n155, G bật.
3. Cụm n155, G tắt.
4. Một ngã 3 thường, chế độ thường.
5. Sát mặt đất tại một ngã 3 thường.

Nhìn ba thứ: đường xanh dương còn lệch ra cỏ không, nền asphalt có tạo vòng tròn tối không, và răng cưa còn không. Ba thứ đó ổn thì chốt G1 và chuyển sang xe.

---
*Tạo bởi coding agent — Nov 2026*
