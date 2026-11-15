# 🗺️ Đặc tả Schema Bản đồ Mô phỏng (`GameMap` Schema v1)

Tài liệu này mô tả toàn bộ schema dữ liệu bản đồ mà tầng Renderer 3D, Vật lý xe, Traffic AI (`NPCController`, `PedestrianController`), `Autopilot`, `RuleEngine`, và `MiniMap` tiêu thụ.

Định nghĩa TypeScript chính nằm tại [`src/world/mapLoader.ts`](../src/world/mapLoader.ts).

---

## 1. Bảng tổng hợp các thực thể và trường dữ liệu

| Thực thể | Trường | Kiểu dữ liệu | Đã khai báo trong `mapLoader.ts`? | Bắt buộc / Tùy chọn | Mô tả & Ràng buộc hợp lệ |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`GameMap`** | `version` | `number` | ✅ Có (`L92`) | Bắt buộc | Phải bằng `1` (`loadGameMap` kiểm tra `version === 1`). |
| | `nodes` | `MapNode[]` | ✅ Có (`L93`) | Bắt buộc | Danh sách nút đồ thị đường. |
| | `roads` | `MapRoad[]` | ✅ Có (`L94`) | Bắt buộc | Danh sách đoạn đường nối giữa 2 `MapNode`. |
| | `intersections` | `MapIntersection[]` | ✅ Có (`L95`) | Bắt buộc | Quy tắc giao thông tại các nút giao. |
| | `signs` | `MapSign[]` | ✅ Có (`L96`) | Bắt buộc | Biển báo StVO đặt dọc đường. |
| | `buildings` | `MapBuilding[]` | ✅ Có (`L97`) | Bắt buộc | Nhà mặt tiền neo theo `roadId` + khoảng cách `s`. |
| | `props` | `MapProp[]` | ✅ Có (`L98`) | Bắt buộc | Vật thể ven đường (đèn đường, cây, cột mốc...). |
| | `spawns` | `MapSpawns` | ✅ Có (`L99`) | Bắt buộc | Điểm xuất phát của xe người chơi. |
| | `waters` | `MapWater[]` | ✅ Có (`L100`) | Tùy chọn | Sông / kênh đào. |
| | `parks` | `MapPark[]` | ✅ Có (`L101`) | Tùy chọn | Đa giác nền cỏ công viên. |
| | `rails` | `MapRail[]` | ✅ Có (`L102`) | Tùy chọn | Tuyến đường sắt / cầu cạn S-Bahn. |
| | `railClusters` | `Array<{railId: string; clusterId: string}>` | ❌ **Chưa** (đọc ở `worldBuilder.ts#L45`) | Tùy chọn | Nhóm các đường ray song song dùng chung kết cấu cầu cạn. |
| **`MapNode`** | `id` | `string` | ✅ Có (`L7`) | Bắt buộc | Định danh duy nhất của nút (vd: `'n1'`). |
| | `x`, `z` | `number` | ✅ Có (`L8-L9`) | Bắt buộc | Tọa độ thế giới tính bằng mét (`1 unit = 1 m`, `+Z` = Nam/tiến, `+X` = Đông). |
| | `type` | `'intersection' \| 'dead_end' \| 'end'` | ✅ Có (`L10`) | Bắt buộc | Loại nút (`'intersection'` phải có bậc $\ge 3$ theo `map-clean.test.ts`). |
| **`MapRoad`** | `id` | `string` | ✅ Có (`L16`) | Bắt buộc | Định danh duy nhất của đường (vd: `'r1'`). |
| | `from`, `to` | `string` | ✅ Có (`L17-L18`) | Bắt buộc | `node.id` điểm đầu và điểm cuối. |
| | `points` | `Array<[number, number]>` | ✅ Có (`L19`) | Bắt buộc | Polyline `[x, z]` từ `from` đến `to` ($\ge 2$ điểm, tổng chiều dài $\ge 4\text{ m}$). |
| | `lanesForward` | `number` | ✅ Có (`L20`) | Bắt buộc | Số làn chiều `from → to` (`0` nếu đường một chiều hướng ngược). |
| | `lanesBackward` | `number` | ✅ Có (`L21`) | Bắt buộc | Số làn chiều `to → from` (`0` nếu đường một chiều hướng xuôi). |
| | `laneWidth` | `number` | ✅ Có (`L22`) | Bắt buộc | Bề rộng 1 làn (m), chuẩn `[2.8 .. 3.75]` (đường 1 làn oneway $\ge 3.4\text{ m}$). |
| | `sidewalk` | `{ left: boolean; right: boolean }` | ✅ Có (`L23`) | Bắt buộc | Có vỉa hè bên trái / phải hay không. |
| | `bikeLane` | `{ left: boolean; right: boolean }` | ✅ Có (`L24`) | Bắt buộc | Có làn xe đạp hay không. |
| | `parking` | `{ left: ParkingType; right: ParkingType }` | ✅ Có (`L25`) | Bắt buộc | `ParkingType = 'parallel' \| 'none'`. |
| | `speedLimit` | `number` | ✅ Có (`L26`) | Bắt buộc | Giới hạn tốc độ km/h (`5, 10, 20, 30, 40, 50, 60, 70, 80, 100, 120, 130`). |
| | `priority` | `'main' \| 'give_way' \| 'stop' \| 'equal'` | ✅ Có (`L27`) | Bắt buộc | Độ ưu tiên của đường khi tiếp cận nút giao. |
| | `surface` | `'asphalt' \| 'asphalt_worn' \| 'cobble'` | ✅ Có (`L28`) | Bắt buộc | Chất liệu mặt đường. |
| | `bridge` | `boolean` | ✅ Có (`L30`) | Tùy chọn | `true` nếu là cầu qua sông (chặn cắt lỗ nước, dựng thành cầu đá). |
| | `name` | `string` | ❌ **Chưa** (đọc ở `simScene.ts#L604`) | Tùy chọn | Tên phố hiển thị trên HUD/Cockpit và gắn biển tên đường 3D. |
| | `nameConfidence`| `'low'` | ❌ **Chưa** | Tùy chọn | Cờ di sản từ script match tên OSM (không cần trong generator mới). |
| **`MapIntersection`**| `nodeId` | `string` | ✅ Có (`L34`) | Bắt buộc | Trỏ tới `MapNode.id`. |
| | `rule` | `'right_before_left' \| 'priority_road' \| 'yield' \| 'stop' \| 'traffic_light' \| 'roundabout'` | ✅ Có (`L35`) | Bắt buộc | Quy tắc StVO tại nút giao. |
| | `trafficLight` | `{ cycle: string; greenSeconds: number; yellowSeconds: number; redSeconds: number } \| null` | ✅ Có (`L36-L41`) | Bắt buộc | Chu kỳ đèn tín hiệu (khác `null` khi `rule === 'traffic_light'`). |
| | `crosswalks` | `string[]` | ✅ Có (`L42`) | Bắt buộc | Danh sách `roadId` có vạch đi bộ (Zebrastreifen) tại nhánh nối vào nút này. |
| **`MapSign`** | `type` | `string` | ✅ Có (`L46`) | Bắt buộc | Mã StVO trong `SIGN_DEFS`: `'205'`, `'206'`, `'301'`, `'306'`, `'102'`, `'274'`, `'274.1'`, `'220'`, `'267'`, `'283'`, `'286'`, `'314'`, `'350'`, `'101'`, `'138'`, `'215'`. |
| | `roadId` | `string` | ✅ Có (`L47`) | Bắt buộc | Đường gắn biển. |
| | `s` | `number` | ✅ Có (`L48`) | Bắt buộc | Vị trí dọc đường từ `from` (`1.5 <= s <= roadLength - 1.5`). |
| | `side` | `'left' \| 'right'` | ✅ Có (`L49`) | Bắt buộc | Bên đặt biển theo hướng `from → to`. |
| | `value` | `number` | ✅ Có (`L50`) | Tùy chọn | Giá trị số trên biển (bắt buộc cho `'274'`, vd: `30`, `50`). |
| | `flip` | `boolean` | ✅ Có (`L52`) | Tùy chọn | `true` = mặt biển quay về hướng `to` (dành cho xe đi chiều `to → from`). |
| | `src` | `string` | ❌ **Chưa** | Tùy chọn | Metadata nguồn biển (`'oneway-fix-220'`, `'wfs-kept-oneway-exception'`). |
| **`MapBuilding`** | `roadId` | `string` | ✅ Có (`L54`) | Bắt buộc | Đường mà mặt tiền nhà hướng ra. |
| | `side` | `'left' \| 'right'` | ✅ Có (`L55`) | Bắt buộc | Bên trái hoặc phải của đường. |
| | `s`, `length` | `number` | ✅ Có (`L56-L57`) | Bắt buộc | Điểm bắt đầu và chiều dài mặt tiền dọc theo đường (m). |
| | `floors` | `number` | ✅ Có (`L58`) | Bắt buộc | Số tầng (`floors * 3.4m`). |
| | `style` | `'altbau' \| 'backstein' \| 'neubau'` | ✅ Có (`L59`) | Bắt buộc | Kiểu kiến trúc mặt tiền. |
| | `seed` | `number` | ✅ Có (`L60`) | Bắt buộc | Hạt giống chọn màu tường/mái. |
| | `depthOff`, `depth`, `plain` | `number`, `number`, `boolean` | ❌ **Chưa** (khai báo ở `BuildingSpec` trong `buildings.ts#L48-L55`) | Tùy chọn | Độ lùi mặt tiền, bề sâu nhà (mặc định 12m), và cờ tắt vẽ cửa sổ (cho nhà hậu cảnh). |
| **`MapProp`** | `type` | `'street_lamp' \| 'tree' \| 'bollard' \| 'trash_bin' \| 'bench' \| 'litfasssaeule' \| 'parkscheinautomat'` | ⚠️ Thiếu `'parkscheinautomat'` ở `mapLoader.ts#L64` (đang có trong `examParcours.ts#L319`) | Bắt buộc | Loại prop ven đường. |
| | `roadId`, `s`, `side` | `string`, `number`, `'left' \| 'right'` | ✅ Có (`L65-L67`) | Bắt buộc | Vị trí đặt prop dọc theo đường. |
| **`MapSpawns`** | `player` | `{ roadId: string; s: number; lane: number }` | ✅ Có (`L71`) | Bắt buộc | Điểm spawn xe người chơi (`lane = 0` là làn ngoài cùng bên phải chiều xuôi). |
| **`MapWater`** | `id`, `name`, `width`, `points` | `string`, `string`, `number`, `Array<[number, number]>` | ✅ Có (`L74-L79`) | Tùy chọn | Polyline tâm sông và bề rộng mặt nước (m). |
| **`MapPark`** | `id`, `name`, `points` | `string`, `string`, `Array<[number, number]>` | ✅ Có (`L81-L85`) | Tùy chọn | Đa giác khép kín ($\ge 3$ đỉnh) của công viên. |
| **`MapRail`** | `id`, `name`, `railway`, `layer`, `bridge`, `elev`, `points` | `string`, `string`, `string`, `number`, `boolean`, `number`, `Array<[number, number]>` | ✅ Có (`L87-L89`) | Tùy chọn | Tuyến đường sắt (`elev > 0` hoặc `bridge === true` vẽ cầu cạn vòm gạch, `elev === 0` vẽ ray mặt đất). |

---

## 2. Các trường chưa khai báo trong `src/world/mapLoader.ts` cần đồng bộ khi viết Generator mới

1. `MapRoad.name?: string` (đang đọc tại `src/world/simScene.ts` và `src/world/trafficSigns.ts`).
2. `MapBuilding.depthOff?: number`, `MapBuilding.depth?: number`, `MapBuilding.plain?: boolean` (đang khai báo riêng trong `BuildingSpec` tại `src/world/buildings.ts`).
3. `MapProp.type`: bổ sung `'parkscheinautomat'` vào union type (đang dùng tại `src/data/maps/examParcours.ts#L319`).
4. `GameMap.railClusters?: Array<{ railId: string; clusterId: string }>` (đang đọc tại `src/world/worldBuilder.ts#L45`).
