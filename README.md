# 🚗 Führerschein AI & 3D Driving Simulator (StVO)

Ứng dụng web học lý thuyết song ngữ Đức - Việt và mô phỏng thực hành lái xe 3D theo luật giao thông đường bộ Đức (**StVO**) cho hạng bằng **Klasse B**.

---

## 🌿 Nhánh Làm Việc Hiện Tại (Git Branches & Tags)

- **Nhánh làm việc chính (Active Branch)**: `feat/city-map-de` — Chuẩn bị và xây dựng bản đồ đô thị Đức khai báo (`city.json`) từ Road Profiles (RASt 06) và các mẫu nút giao chuẩn StVO.
- **Nhánh lưu trữ OSM Berlin**: `archive/osm-berlin` (kèm tag `osm-berlin-final` tại commit `83ebc06`) — Lưu trữ nguyên trạng bản đồ Berlin-Mitte trích xuất từ OpenStreetMap và kết quả thử nghiệm autopilot Giai đoạn 0.
- **Nhánh phát triển trước đó**: `simulator-dev`.

---

## 📂 Cấu Trúc Thư Mục (Repository Structure)

```text
├── api/                        # Serverless API endpoints (Vercel): /api/send-email (Resend)
├── docs/                       # Tài liệu kỹ thuật & kiến trúc
│   ├── MAP_SCHEMA.md           # Đặc tả schema GameMap v1 và các trường dữ liệu
│   └── screenshots/            # Ảnh chụp màn hình kiểm thử (QA / Cockpit / Junctions)
├── legacy/
│   └── osm/                    # [DEPRECATED] Các script nhập, vá và audit dữ liệu OSM cũ
├── public/                     # Tài sản tĩnh (GLB 3D models trong /simv2, Draco decoder, ảnh câu hỏi)
├── scratch/                    # Tệp nháp, script thử nghiệm 1 lần (được loại khỏi Vitest suite)
├── scripts/                    # Công cụ QA tự động (run_autopilot, drone_scan, road_drive_scan...)
│                               # và các file cache dữ liệu đang được bộ test đọc
└── src/
    ├── art/                    # Bảng màu chuẩn (palette.ts)
    ├── components/             # Giao diện React (Lernen, Pruefung, SimDevPage, MiniMap, ModernCockpit)
    ├── data/
    │   └── maps/               # Nguồn dữ liệu bản đồ (examParcours.ts, bigMap.ts, berlin-mitte-clean.json)
    ├── lib/                    # Cấu hình Firebase & Auth
    ├── services/               # Dịch vụ phía client (emailService.js gọi qua /api/send-email)
    ├── simulation/             # RuleEngine chấm điểm lỗi thực hành theo chuẩn Fahrprüfung (StVO)
    └── world/                  # Engine 3D Three.js:
                                # - mapLoader, worldBuilder, chunkBuilder, chunkManager
                                # - roadMesh, sidewalk, roadMarkings, buildings, terrain
                                # - trafficSigns, trafficLights, props
                                # - vehicle, collisions, npc, pedestrianController, autopilot
                                # - Bộ kiểm thử bất biến hình học & hành vi (*.test.ts)
```

---

## 🚀 Hướng Dẫn Chạy & Kiểm Thử (Development & Testing)

### 1. Khởi động máy chủ phát triển (Dev Server)
```bash
npm run dev
```
- Ứng dụng học lý thuyết & thi thử: `http://localhost:3000/`
- Trình mô phỏng lái xe 3D (`/sim-dev`):
  - Sa hình thực hành 6 trạm (mặc định khi lái): `http://localhost:3000/sim-dev?drive=1`
  - Bản đồ đô thị lớn (bay tự do): `http://localhost:3000/sim-dev?map=berlin`
  - Bản đồ lưới kiểm thử streaming 3km×3km: `http://localhost:3000/sim-dev?map=stadt&drive=1`

### 2. Chạy bộ kiểm thử tự động (Vitest Suite)
```bash
# Chạy toàn bộ test suite (mặc định loại trừ scratch/** và legacy/**)
npm test

# Chạy riêng bài kiểm toán hình học mặt đường & vỉa hè (nặng CPU)
npx vitest run src/world/roadAudit.test.ts
```

### 3. Cấu hình Biến Môi Trường (`.env`)
Sao chép `.env.example` thành `.env` và điền thông tin:
- Các biến `VITE_FIREBASE_*`: Cấu hình Firebase Client.
- `RESEND_API_KEY` & `RESEND_FROM_EMAIL`: **Chỉ dùng ở phía Server** (`api/send-email.js`), tuyệt đối không thêm tiền tố `VITE_`.
