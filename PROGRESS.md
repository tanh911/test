# PROGRESS — G1 giao lộ (München OSM)

## Trạng thái: ĐÃ CHỐT G1 (ngày 09/11/2026)

Nhận G1 với 4 lỗi nhỏ đã biết, ghi dưới mục "lỗi đã biết". Ba lỗi sau không ảnh hưởng đến lái xe, chỉ sửa lỗi 1 (rẻ).

### Lỗi đã biết (4 lỗi)

| # | Lỗi | Vị trí ví dụ (toạ độ x,z) | Nguyên nhân | Hành động |
|---|-----|---------------------------|-------------|-----------|
| 1 | Mảnh vỉa hè lơ lửng trên cỏ (hình thoi/tam giác xám nhỏ rời rạc) | (600,630), (710,440), (1140,720), (30,650) | Pad góc của nhánh nhọn bị suy biến | **Đã sửa**: bỏ pad khi góc giữa 2 nhánh < 35° hoặc cạnh bao lồi < 1,5 m (sidewalk.ts, commit 3d50113) |
| 2 | Nêm xám ở ngã giao nhánh nhọn (mảng nhựa nhô ra) | (590–700, 330–420) | Patch junction dư ở góc nhọn | Không sửa (không ảnh hưởng lái xe) |
| 3 | Vĩa hè gối chồng ở cụm ngã giao đã gộp | (480–650, 410–540) | Nhiều road vẽ vỉa hè tại cùng node | Không sửa (không ảnh hưởng lái xe) |
| 4 | Mặt đường "bậc" ở khớp nối node bậc 2 | Dưới-trái ảnh 2 (khớp nối 2 road độ rộng khác nhau) | Importer để lại road cùng node nhưng thuộc tính khác nhau (34 chỗ) | Không sửa vòng này; nên làm ở importer: giảm bề rộng về mức nhỏ hơn khi 2 road nối nhau |

### Số liệu F3 (từ ảnh chụp)

- Draw call: 98–120 (mục tiêu ≤ 300) ✓
- Tam giác: ~15.000 (mục tiêu ≤ 500.000) ✓
- Quad: 60.182
- FPS: chưa đo thực tế

### Tài liệu tham khảo

- `docs/report-patch.md`: báo cáo chi tiết seam, buildMs, draw call trước/sau nền asphalt_worn
- Commit G1: `3d50113` (sidewalk.ts), `fef85ae` (roadMesh.ts), `1851bba` (worldBuilder.ts), `d4ed012` (roadMarkings.ts), `ba88e64` (nen ban dau)
- Nhánh: `wip/road-geometry`

### Tiếp theo (G5 — xe người chơi)

vehicle controller, camera cabin, input, xi-nhan, nhìn gương, nhìn qua vai.
