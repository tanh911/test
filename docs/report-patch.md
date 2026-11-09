# Báo cáo vá giao lộ & kiểm định hình ảnh — viet-de-fuhrerschein (P3 + nền asphalt_worn)

Mục tiêu G1: **không còn tam giác xanh (khe cỏ) nhìn thấy quanh ngã giao khi nhìn từ trên cao và zoom sát**. Thay vì chạy theo độ khít tuyệt đối của các lớp phủ (road / road_worn / sidewalk), đặt một **nền asphalt_worn (`road_worn`, y = −0,02) dưới mỗi nút `intersection`, bán kính 1,6 × K_max**. Mọi khe còn sót trong bo dem này hiện nền tối (asphalt_worn) thay vì cỏ — đủ cho game lái xe, giải phóng thời gian cho phần quan trọng hơn: xe, NPC, rule engine.

> Lưu ý: chỉ commit whitelist — `roadMesh.ts`, `worldBuilder.ts`, `docs/report-patch.md` (và `sidewalk.ts` nếu giữ own-half từ vòng trước). KHÔNG stage `package.json/lock` hay `public/simv2/ped_*.glb`. Commit message bắt đầu "WIP:".

## Tóm tắt

| # | Nhiệm vụ | File / hàm | Kết quả (số liệu thật) |
|---|---|---|---|
| 1 | Nền che khe dưới ngã giao | `src/world/roadMesh.ts` — `junctionBackgroundQuads` | Vòng tròn 32 đoạn, `road_worn`, y = −0,02, bán kính 1,6 × K_max, dưới mọi nút intersection |
| 2 | Gọi nền khi xây dựng thế giới | `src/world/worldBuilder.ts` — `buildWorld` | Gọi `junctionBackgroundQuads` cho mỗi nút intersection, cùng material `road_worn` |
| 3 | Draw call trước / sau nền | `buildWorld` + `ChunkBuilder` | **Không tăng** (cùng material `road_worn`, gộp vào geometry cell chứa intersection); quad `road_worn` +4064 (≈ 127 nút × 32 đoạn) |
| 4 | buildMs `buildWorld(muenchen)` | vitest `performance.now()` | Trước nền: **299,48 ms** (74956 quads); sau nền: **318,92 ms** (79020 quads); cells = 150 |
| 5 | Test răng cưa mép vỉa hè / mép ribbon | `src/world/testJunctionBoundary.ts` — `collectSawtoothIssues` | 288 road kiểm, **0 vi phạm**, maxGap = 0,00 m — không lệch quá 0,05 m |
| 6 | Kiểm định kiểu | `npx tsc --noEmit` | 12 lỗi, toàn pre-existing (ruleEngine TS2729; demoAssets/npc/vehicle TS2339; testJunctionBoundary TS2304; debug-seam TS2307), **không có TS error mới** |
| 7 | Cổng dev server | `vite.config.js` | **3000** (không phải 5173) |

## Câu hỏi: đường xanh DƯƠNG mảnh chạy qua bãi cỏ thuộc road nào, vạch nào?

Là vạch **`white`** (`lineWhite`, material lane marking). Trong `src/world/worldBuilder.ts` (mục "Vạch kẻ", dòng ~73-74), mỗi road gọi `roadMarkingQuads(map, road, roadSkipZones(road, map), maxHalf)` rồi `pushQuads(cb, quads, 'white')` — vạch kẻ chạy dọc theo **ribbon của từng road**. Khi bật debug phím **G**, `src/world/simScene.ts` (dòng ~293) tô material `white` thành `0x0000ff` (xanh dương), nên trong ảnh debug các vạch này hiện là những đường xanh dương mảnh. Chúng chạy qua bãi cỏ ở các đoạn ribbon kết thúc ở skip zone (miệng ngã giao) nhưng vạch còn dépasse ra ngoài mặt đường, hoặc ở vùng không có mặt đường che.

## Cách làm nền che khe

`junctionBackgroundQuads(nodeX, nodeZ, connectedRoads)`:
- `K_max` = max `roadHalfWidth` của các road kết nối tại nút.
- Bán kính `r = 1.6 × K_max`.
- `y = −0.02` (duoi mặt đường, không z-fight với mặt đường y = 0).
- 32 đoạn tạo vòng tròn fan quanh nút, material `road_worn` (`asphaltWorn`).

Được gọi trong `buildWorld` sau junction patch của mỗi nút intersection. Mọi khe còn sót trong bo dem bán kính `r` hiện nền tối thay vì cỏ.

## Draw call trước / sau

`ChunkBuilder.buildCell` gộp **cùng 1 material trong cùng 1 cell thành 1 geometry → 1 draw call**. Nền dùng cùng `road_worn` với junction patch (đã là `road_worn`), nên cell chứa intersection đã có draw call `road_worn`; thêm nền chỉ tăng **quad** trong geometry đó, **không tăng draw call**.

Số quad `road_worn` tăng `≈ 127 nút × 32 đoạn = 4064 quad` (München: 74956 → 79020 quads). Draw call giữ nguyên (cells = 150, material distinct không tăng).

## Giải thích commit message "own-half sidewalk" (vòng trước, đã reset)

`own-half sidewalk` là thay đổi `sidewalkCornerPads` trong `src/world/sidewalk.ts`: thay vì dùng `half = max(halfA, halfB)` (pad chung theo nhánh rộng nhất), đổi sang **per-road own-half** (`c1 = node + nA·halfA + nB·halfB`, mỗi road dùng half của riêng nó) để pad góc khít mép đường của mỗi road riêng, giảm khe ở góc ngã giao. Đây là thay đổi vỉa hè **không được yêu cầu trong vòng này**, nên commit mới này **không chứa** thay đổi sidewalk — chỉ commit `roadMesh.ts`, `worldBuilder.ts`, `docs/report-patch.md`.

## Cách kiểm thử trên trình duyệt

Dev server chạy tại **http://localhost:3000/** (vite.config.js, port 3000). Mở trang, bấm **G** để bật debug màu (`road_worn` = xanh lá, `white` = xanh dương), rồi chụp 4 ảnh:
1. Tổng thể từ trên cao.
2. Cụm n155, G bật.
3. Cụm n155, G tắt.
4. Một ngã 3 thường, chế độ thường.

Nếu không còn tam giác xanh quanh ngã giao → G1 đủ để chuyển sang xe, NPC, rule engine.

---
*Tạo bởi coding agent — Nov 2026*
