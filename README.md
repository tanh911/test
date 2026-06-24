# 🚗 Führerschein AI - Học Lý Thuyết Lái Xe Đức Song Ngữ Đức - Việt

**Führerschein AI** là ứng dụng web di động (Mobile-First Web App) được thiết kế đặc biệt giúp cộng đồng người Việt tại Đức ôn tập và tự tin thi đỗ bằng lái xe ô tô hạng B (**Klasse B**). Ứng dụng kết hợp giao diện song ngữ Đức - Việt thông minh cùng với **Trí Tuệ Nhân Tạo (AI)** đóng vai trò như một gia sư cá nhân hỗ trợ dịch nghĩa từ vựng, phân tích tình huống giao thông và giải thích chi tiết luật đường bộ Đức (StVO).

---

## 🌟 Tính Năng Nổi Bật (Hauptmerkmale)

### 1. 📖 Chế Độ Học Tập Song Ngữ (Bilinguales Lernen)
- **Văn bản song ngữ**: Tất cả câu hỏi lý thuyết chuẩn (bao gồm câu hỏi chữ, biển báo và hình vẽ tình huống) đều hiển thị song ngữ Đức - Việt. Bạn có thể bật/tắt dịch nghĩa chỉ với 1 chạm.
- **Xử lý đáp án phức tạp**: Mô phỏng chính xác luật thi của Đức, cho phép chọn **nhiều đáp án đúng** trong một câu hỏi.
- **Tra cứu từ vựng tại chỗ (Bilinguales Glossar)**: Mỗi câu hỏi đều đính kèm danh sách từ vựng kỹ thuật cốt lõi (ví dụ: *die Vorfahrt* -> quyền ưu tiên, *anhalten* -> dừng lại) giúp bạn tích lũy từ vựng tiếng Đức chuyên ngành nhanh chóng.
- **Phát âm tiếng Đức (Text-to-Speech)**: Nhấn biểu tượng loa để nghe giọng đọc chuẩn của câu hỏi bằng tiếng Đức.

### 2. 🤖 Gia Sư AI Thông Minh (AI Lernassistent)
- **Phân tích chi tiết**: Nút **Hỏi AI Trợ Lý** phân tích lỗi sai, giải thích lý do vì sao lựa chọn này đúng/sai và chỉ ra các điều luật đường bộ Đức cụ thể (StVO).
- **Hỏi đáp tự do**: Ô chat cho phép bạn nhắn tin hỏi thêm bất kỳ câu hỏi phụ nào khác (ví dụ: *"Tại sao câu này không được vượt xe đạp?"*, *"Luật này áp dụng ngoài đô thị như thế nào?"*).
- **Chế độ hoạt động kép**:
  - **Trực tuyến (Real-time AI)**: Nhập **Gemini API Key** trong phần Cài đặt để trò chuyện trực tiếp với mô hình **Gemini 2.5 Flash** tiên tiến nhất.
  - **Ngoại tuyến (Offline Simulator)**: Nếu không có API Key, ứng dụng sử dụng hệ thống phản hồi tự động chất lượng cao dựa trên cơ sở dữ liệu câu hỏi để đảm bảo bạn vẫn được giải thích cặn kẽ.

### 3. ⏱️ Mô Phỏng Thi Thử Như Thật (Prüfungssimulation)
- **Đề thi chuẩn ngẫu nhiên**: Tạo đề thi gồm 10 câu hỏi ngẫu nhiên được lựa chọn từ ngân hàng đề thi chính thức.
- **Đếm ngược thời gian**: 30 phút đếm ngược tạo áp lực phòng thi thực tế.
- **Tính điểm phạt (Fehlerpunkte)**:
  - Tính điểm phạt chuẩn (từ 2 đến 5 điểm phạt cho mỗi câu làm sai).
  - Đỗ khi tổng số điểm phạt **≤ 10**.
  - **Lỗi trượt lập tức**: Trượt ngay nếu làm sai **hai câu 5 điểm phạt** (dù tổng điểm phạt bằng 10).
- **Bảng phân tích lỗi sai**: Xem lại chi tiết từng câu trong bài làm, so sánh đáp án bạn chọn và đáp án đúng, kèm giải thích tiếng Việt.

### 4. 📊 Đăng Nhập & Lưu Trữ Tiến Độ (Fortschritt & Historie)
- **Đăng ký / Đăng nhập**: Dữ liệu lưu trữ cục bộ bảo mật qua `localStorage`, cho phép nhiều tài khoản học chung trên một thiết bị.
- **Thống kê học tập**: Theo dõi số câu đã làm, tỷ lệ trả lời đúng và lịch sử các lần thi thử để đánh giá mức độ sẵn sàng đi thi thật.
- **Lưu câu hỏi yêu thích (Bookmarks)**: Lưu trữ các câu hỏi khó để ôn tập lại riêng bất kỳ lúc nào.

### 5. 📱 Thiết Kế Tối Ưu Cho Di Động (Mobile-First Design)
- Ứng dụng được tối ưu hóa 100% cho màn hình cảm ứng di động.
- Trên màn hình máy tính (Desktop), ứng dụng tự động hiển thị trong một **khung giả lập điện thoại thông minh cực kỳ cao cấp** (notch camera, bo góc mịn màng và hiệu ứng bóng đổ) giúp bạn dễ dàng trải nghiệm.

---

## 🛠️ Công Nghệ Sử Dụng (Technologie-Stack)

1. **React 19 & Vite**: Framework phát triển nhanh, mượt mà và tối ưu hiệu năng.
2. **Vanilla CSS**: Hệ thống CSS tùy biến cao cấp, hỗ trợ hoàn hảo Glassmorphism, Dark Mode và hiệu ứng chuyển cảnh mượt mà.
3. **Lucide React**: Bộ icon phong cách tối giản hiện đại.
4. **Google Gemini API**: Tích hợp gọi trực tiếp Gemini 2.5 Flash phục vụ Q&A.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Installation & Ausführung)

Làm theo các bước sau để khởi chạy ứng dụng trên máy tính của bạn:

### Bước 1: Di chuyển vào thư mục dự án
Mở terminal và di chuyển vào thư mục ứng dụng:
```bash
cd "C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein"
```

### Bước 2: Khởi động máy chủ phát triển (Development Server)
Dự án đã được cài đặt đầy đủ các thư viện phụ thuộc. Chỉ cần chạy lệnh sau để khởi động:
```bash
npm run dev
```

### Bước 3: Truy cập ứng dụng
Sau khi khởi chạy thành công, terminal sẽ hiển thị địa chỉ cục bộ. Mở trình duyệt và truy cập:
👉 **[http://localhost:5173/](http://localhost:5173/)**

Để biên dịch bản production (Build production bundle):
```bash
npm run build
```

---

## 🔑 Hướng dẫn lấy Gemini API Key miễn phí

Để kích hoạt tính năng trò chuyện AI trực tuyến chất lượng cao nhất:
1. Truy cập **[Google AI Studio](https://aistudio.google.com/)**.
2. Đăng nhập bằng tài khoản Google.
3. Click chọn **Get API Key** ở cột bên trái.
4. Sao chép đoạn mã API Key (bắt đầu bằng `AIzaSy...`).
5. Vào tab **Cài đặt** trên ứng dụng **Führerschein AI**, dán mã vào ô tương ứng rồi nhấn **Lưu cấu hình**.

---

Chúc bạn ôn tập tốt và sớm sở hữu bằng lái xe Đức! **Viel Erfolg!** 🚗💨
