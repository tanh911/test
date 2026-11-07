// 💼 Cấu hình kinh doanh simulator — MỘT NƠI DUY NHẤT để flip production/dev
//
// SIM_PRO_LOCKED:
//   false (dev/testing) → MỞ TẤT CẢ 4 cấp để test tự do, không badge PRO
//   true  (production)  → Cấp 3 (Landstraße) + Cấp 4 (Autobahn) hiển thị ★ PRO,
//                         nút đổi thành "Dùng thử beta", chỗ này gắn paywall gói Pro
//                         (check gói user từ hệ thống premium AdminDashboard)
export const SIM_PRO_LOCKED = false;

// Tên gói hiển thị trên menu (đổi文案 khi bán thật)
export const PRO_PACK_LABEL = 'Gói Pro';
export const PRO_CONTACT_NOTE = 'theo dõi Fanpage để nhận thông báo gói Pro';
