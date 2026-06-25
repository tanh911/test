import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Sparkles, HelpCircle } from 'lucide-react';

const questionCategories = [
  {
    id: 'formulas',
    title: '📐 Công thức tính toán',
    questions: [
      { id: 'reaktionsweg', label: 'Quãng đường phản ứng (Reaktionsweg)', text: 'Giải thích công thức tính Quãng đường phản ứng (Reaktionsweg) và cho ví dụ.' },
      { id: 'bremsweg', label: 'Quãng đường phanh thường (Bremsweg)', text: 'Giải thích công thức tính Quãng đường phanh thông thường (Bremsweg) và cho ví dụ.' },
      { id: 'gefahrbremsung', label: 'Quãng đường phanh khẩn cấp (Gefahrbremsung)', text: 'Giải thích công thức tính Quãng đường phanh khẩn cấp (Gefahrbremsung) và cho ví dụ.' },
      { id: 'anhalteweg', label: 'Quãng đường dừng xe (Anhalteweg)', text: 'Giải thích công thức tính Tổng quãng đường dừng xe (Anhalteweg) và cho ví dụ.' },
      { id: 'safety_distance', label: 'Quy tắc khoảng cách an toàn (Sicherheitsabstand)', text: 'Quy tắc tính khoảng cách an toàn tối thiểu với xe đi trước là gì?' }
    ]
  },
  {
    id: 'priority',
    title: '🚦 Quy tắc ưu tiên (Vorfahrt)',
    questions: [
      { id: 'rechts_vor_links', label: 'Quy tắc Rechts vor Links là gì?', text: 'Giải thích quy tắc Rechts vor Links (Bên phải trước bên trái) áp dụng thế nào ở Đức?' },
      { id: 'kreisverkehr', label: 'Thứ tự đi tại bùng binh (Kreisverkehr)', text: 'Giải thích quy tắc ưu tiên và xi nhan khi đi vào và đi ra khỏi bùng binh (Kreisverkehr) ở Đức?' },
      { id: 'left_turn', label: 'Quy tắc rẽ trái nhường đường', text: 'Khi rẽ trái tại ngã tư, tôi phải nhường đường cho những đối tượng nào?' },
      { id: 'abknickende_vorfahrt', label: 'Đường ưu tiên rẽ cong', text: 'Giải thích cách đi và bật xi nhan tại biển báo đường ưu tiên rẽ cong (abknickende Vorfahrtsstraße).' }
    ]
  },
  {
    id: 'probezeit',
    title: '🚗 Thử thách (Probezeit)',
    questions: [
      { id: 'probezeit_rules', label: 'Thời gian thử thách Probezeit', text: 'Thời gian thử thách Probezeit kéo dài bao lâu và có quy định gì về nồng độ cồn?' },
      { id: 'a_b_verstoss', label: 'Vi phạm Nhóm A và Nhóm B', text: 'Sự khác nhau giữa lỗi vi phạm nặng nhóm A (A-Verstoß) và lỗi nhẹ nhóm B (B-Verstoß) là gì?' },
      { id: 'asf_seminar', label: 'Khóa học ASF là gì?', text: 'Khi nào tài xế phải học khóa tập huấn bắt buộc ASF (Aufbauseminar) và hậu quả là gì?' }
    ]
  },
  {
    id: 'signs',
    title: '🛑 Biển báo khó nhớ',
    questions: [
      { id: 'stop_vs_vorfahrt', label: 'Biển STOP vs Nhường đường', text: 'Sự khác biệt về cách hành xử giữa biển dừng lại (Stop-Schild) và biển nhường đường (Vorfahrt gewähren) là gì?' },
      { id: 'ueberholverbot', label: 'Hiệu lực biển cấm vượt', text: 'Biển cấm vượt (Überholverbot) có hiệu lực đến khi nào và cấm những loại xe nào vượt?' },
      { id: 'tempo_zone', label: 'Khu vực giới hạn tốc độ (Zone)', text: 'Biển giới hạn tốc độ theo khu vực (ví dụ Tempo-30-Zone) khác gì so với biển giới hạn tốc độ thông thường?' }
    ]
  },
  {
    id: 'vocabulary',
    title: '📚 Từ vựng quan trọng',
    questions: [
      { id: 'vocab_vorfahrt', label: 'Từ vựng chủ đề Quyền ưu tiên', text: 'Tổng hợp các từ vựng tiếng Đức chuyên ngành quan trọng nhất về chủ đề Quyền ưu tiên (Vorfahrt).' },
      { id: 'vocab_vehicle', label: 'Từ vựng chủ đề Bộ phận xe', text: 'Tổng hợp các từ vựng tiếng Đức về các bộ phận của xe (lốp, phanh, đèn, động cơ,...) phục vụ thi lý thuyết.' },
      { id: 'vocab_behavior', label: 'Từ vựng chủ đề Hành vi lái xe', text: 'Tổng hợp các từ vựng tiếng Đức mô tả hành vi lái xe (vượt, nhường đường, rẽ, phanh gấp,...).' }
    ]
  }
];

const mockResponses = {
  reaktionsweg: `**Quãng đường phản ứng (Reaktionsweg):**\n\nLà quãng đường xe chạy được từ lúc tài xế nhận biết chướng ngại vật cho đến khi thực sự đạp chân phanh (trung bình mất 1 giây).\n\n- **Công thức tính nhanh (Faustformel):** \`(Vận tốc / 10) x 3\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`(100 / 10) x 3 = 10 x 3 = 30 mét\`.\n- **Lưu ý:** Quãng đường này sẽ tăng lên nếu tài xế mệt mỏi, mất tập trung, hoặc sử dụng chất kích thích.`,
  
  bremsweg: `**Quãng đường phanh thông thường (Bremsweg):**\n\nLà quãng đường xe trượt đi từ lúc đạp chân phanh cho đến khi xe dừng lại hoàn toàn dưới điều kiện lực phanh thông thường.\n\n- **Công thức tính nhanh (Faustformel):** \`(Vận tốc / 10) x (Vận tốc / 10)\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`(100 / 10) x (100 / 10) = 10 x 10 = 100 mét\`.\n- **Lưu ý quan trọng:** Nếu vận tốc xe tăng lên gấp đôi (ví dụ từ 50km/h lên 100km/h), quãng đường phanh sẽ **tăng lên gấp 4 lần** (từ 25m lên 100m). Hãy nhớ điều này cho các câu hỏi lý thuyết!`,
  
  gefahrbremsung: `**Quãng đường phanh khẩn cấp (Gefahrbremsung):**\n\nLà quãng đường phanh khi tài xế đạp lút sàn phanh với lực tối đa để tránh tai nạn xảy ra (phanh gấp). Quãng đường này bằng một nửa so với phanh thông thường.\n\n- **Công thức tính nhanh (Faustformel):** \`[(Vận tốc / 10) x (Vận tốc / 10)] / 2\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`[10 x 10] / 2 = 100 / 2 = 50 mét\`.\n- **Lưu ý:** Trong bài thi, khi câu hỏi hỏi về "phanh khẩn cấp" (Gefahrbremsung), bạn bắt buộc phải chia đôi kết quả của công thức phanh thông thường.`,
  
  anhalteweg: `**Tổng quãng đường dừng xe (Anhalteweg):**\n\nLà tổng quãng đường từ lúc mắt nhìn thấy chướng ngại vật cho tới khi xe đứng yên hẳn.\n\n- **Công thức:** \`Anhalteweg = Reaktionsweg + Bremsweg\`\n- **Công thức gộp:** \`[(Vận tốc / 10) x 3] + [(Vận tốc / 10) x (Vận tốc / 10)]\`\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h:\n  - Reaktionsweg: \`10 x 3 = 30 mét\`\n  - Bremsweg: \`10 x 10 = 100 mét\`\n  - Tổng Anhalteweg: \`30 + 100 = 130 mét\`.`,
  
  safety_distance: `**Quy tắc khoảng cách an toàn (Sicherheitsabstand):**\n\nĐể đảm bảo an toàn phòng trường hợp xe trước phanh gấp, StVO quy định khoảng cách an toàn tối thiểu như sau:\n\n1. **Ngoài đô thị (Außerorts):** Khoảng cách an toàn tối thiểu bằng **nửa giá trị tốc độ** (Halber Tacho).\n   - Công thức: \`Vận tốc / 2\` (đơn vị: mét).\n   - Ví dụ: Đi tốc độ 100 km/h, cần giữ khoảng cách tối thiểu \`50 mét\`. Bạn có thể căn khoảng cách này bằng khoảng cách giữa 2 cột mốc phản quang ở rìa đường quốc lộ (thường cách nhau đúng 50m).\n2. **Trong đô thị (Innerorts):** Khoảng cách bằng quãng đường xe chạy trong **1 giây** (khoảng 15 mét ở tốc độ 50 km/h, tương đương độ dài của 3 thân xe).\n3. **Quy tắc 2 giây (2-Sekunden-Regel):** Chọn một mốc cố định bên đường, sau khi xe trước đi qua, bạn đếm từ 1 đến 2. Nếu xe bạn chưa qua mốc đó thì khoảng cách an toàn đạt yêu cầu.`,
  
  rechts_vor_links: `**Quy tắc Rechts vor Links (Bên phải trước bên trái - StVO § 8):**\n\n1. **Nguyên tắc cơ bản**: Tại ngã tư hoặc ngã ba không có biển báo ưu tiên, không có cảnh sát điều phối và không có đèn giao thông, phương tiện đi từ bên phải tới luôn có quyền ưu tiên đi trước.\n2. **Đối tượng áp dụng**: Áp dụng cho mọi loại phương tiện giao thông (ô tô, xe máy, xe đạp, xe điện,...).\n3. **Trường hợp ngoại lệ (Không áp dụng Rechts vor Links)**:\n   - Khi xe đi ra từ đường đất (Feldweg hoặc Waldweg).\n   - Khi xe đi ra từ khu vực đỗ xe (Parkplatz) hoặc ngõ đi riêng của các hộ gia đình (Grundstücksausfahrt).\n   - Khi đi ra từ khu vực đi bộ (Fußgängerzone) hoặc đường có vỉa hè hạ thấp (abgesenkter Bordstein).\n4. **Mẹo thi cử**: Trong bài thi thực hành lái xe, nếu bạn quên nhường đường cho một xe đi từ bên phải tới ngã tư (mặc dù đường vắng), giám khảo sẽ **đánh trượt bạn ngay lập tức (sofortiges Nichtbestehen)**.`,
  
  kreisverkehr: `**Quy tắc đi bùng binh (Kreisverkehr - StVO § 8a):**\n\n1. **Quyền ưu tiên**:\n   - Xe **đang ở trong bùng binh** có quyền ưu tiên trước xe chuẩn bị đi vào bùng binh (trừ khi có biển báo khác ngược lại, nhưng hầu như 99% bùng binh ở Đức đều có biển "Nhường đường" đi kèm biển bùng binh).\n2. **Quy tắc bật đèn xi-nhan**:\n   - **Khi đi vào bùng binh:** **KHÔNG** bật xi-nhan.\n   - **Khi đi trong bùng binh:** **KHÔNG** bật xi-nhan.\n   - **Khi đi ra khỏi bùng binh:** **BẮT BUỘC** phải bật xi-nhan phải để báo cho các xe khác biết họ có thể đi vào.\n3. **Các quy định khác**:\n   - Cấm dừng đỗ xe trên phần đường bùng binh.\n   - Không được đè lên đảo giao thông ở giữa bùng binh (trừ các xe container, xe tải siêu trường siêu trọng bắt buộc phải đè nhẹ do thân xe quá dài).`,
  
  left_turn: `**Quy tắc rẽ trái nhường đường khi lái xe ở Đức:**\n\nKhi thực hiện rẽ trái tại ngã tư hoặc ngã ba, bạn phải cực kỳ cẩn thận và bắt buộc phải nhường đường cho các đối tượng sau:\n\n1. **Phương tiện đi ngược chiều (Gegenverkehr):** Bao gồm tất cả các xe đi thẳng hoặc rẽ phải từ hướng ngược lại của bạn.\n2. **Người đi bộ (Fußgänger) và người đi xe đạp (Radfahrer):** Những người đang đi thẳng cắt qua phần đường bạn chuẩn bị rẽ vào (họ song song với hướng đi cũ của bạn).\n3. **Xe điện (Straßenbahn):** Xe điện chạy cùng hướng hoặc ngược hướng luôn có quyền ưu tiên rất cao tại Đức, hãy chú ý quan sát gương và điểm mù trước khi rẽ.`,
  
  abknickende_vorfahrt: `**Đường ưu tiên rẽ cong (Abknickende Vorfahrtsstraße):**\n\nĐây là biển báo ngã tư nguy hiểm, gồm biển đường ưu tiên (hình thoi vàng-trắng) kèm theo một biển phụ vẽ sơ đồ ngã tư với nét vẽ đậm thể hiện hướng đi ưu tiên rẽ cong.\n\n1. **Cách bật xi-nhan**:\n   - Nếu bạn **đi theo hướng nét đậm** (rẽ cong): **BẮT BUỘC** bật xi-nhan (vì bạn đang thay đổi hướng đi).\n   - Nếu bạn **đi thẳng rời khỏi hướng ưu tiên**: **KHÔNG** bật xi-nhan (vì bạn đang đi thẳng).\n2. **Quy tắc nhường đường**:\n   - Xe đi trên nét đậm luôn có quyền ưu tiên hơn xe đi từ nét mảnh.\n   - Nếu cả hai xe cùng đi từ hướng ưu tiên (nét đậm) rời đi, áp dụng quy tắc "Rechts vor Links" (xe bên phải đi trước).\n   - Nếu cả hai xe cùng đi từ nét mảnh (đường phụ) đi vào, cũng áp dụng quy tắc "Rechts vor Links" để nhường nhau.`,
  
  probezeit_rules: `**Thời gian thử thách (Probezeit) tại Đức:**\n\n1. **Thời gian**: Kéo dài **2 năm** kể từ ngày bạn nhận được bằng lái chính thức lần đầu tiên (áp dụng cho cả bằng lái xe máy và ô tô).\n2. **Quy định nồng độ cồn**:\n   - Đối với tài xế trong Probezeit hoặc dưới 21 tuổi: Cấm tuyệt đối **0,0 Promille** cồn trong máu (chỉ cần có một chút cồn cũng bị phạt nặng).\n3. **Hệ quả khi vi phạm**:\n   - Nếu phạm lỗi nặng (nhóm A) hoặc 2 lỗi nhẹ (nhóm B): Thời gian thử thách Probezeit sẽ bị kéo dài thêm 2 năm nữa (tổng cộng thành **4 năm**).\n   - Bắt buộc phải tham gia khóa tập huấn lý thuyết & thực hành **Aufbauseminar (ASF)** với chi phí tự túc (khoảng 300 - 500 Euro).`,
  
  a_b_verstoss: `**Phân loại lỗi vi phạm trong thời gian thử thách (Probezeit):**\n\nCảnh sát Đức chia lỗi vi phạm thành 2 nhóm chính:\n\n1. **Lỗi vi phạm nghiêm trọng nhóm A (A-Verstoß):**\n   - Chạy quá tốc độ quy định từ **21 km/h trở lên**.\n   - Không nhường đường ưu tiên (Vorfahrt missachtet).\n   - Vượt đèn đỏ (Rotlichtverstoß).\n   - Sử dụng điện thoại di động khi đang lái xe (không có thiết bị rảnh tay).\n   - Vượt xe ở nơi cấm vượt hoặc gây tai nạn rồi bỏ chạy.\n2. **Lỗi vi phạm ít nghiêm trọng nhóm B (B-Verstoß):**\n   - Chở hàng quá tải, cồng kềnh gây mất an toàn giao thông.\n   - Lốp xe bị mòn quá giới hạn cho phép (dưới 1.6 mm).\n   - Không mua bảo hiểm bắt buộc cho xe.\n   - Đỗ xe gây cản trước nghiêm trọng cho phương tiện cứu hỏa, cứu thương.\n\n*Lưu ý: Chỉ cần phạm **1 lỗi nhóm A** hoặc **2 lỗi nhóm B** là bạn sẽ bị kéo dài Probezeit thêm 2 năm và phải đi học ASF.*`,
  
  asf_seminar: `**Khóa học ASF (Aufbauseminar für Fahranfänger):**\n\nLà khóa tập huấn bắt buộc dành cho tài xế mới vi phạm luật giao thông trong thời gian thử thách.\n\n1. **Yêu cầu tham gia:** Bạn sẽ nhận được thư yêu cầu từ Sở Giao thông (Fahrerlaubnisbehörde) sau khi phạm 1 lỗi nhóm A hoặc 2 lỗi nhóm B. Họ sẽ cho bạn một thời hạn nhất định (thường là 2 tháng) để nộp chứng chỉ đã hoàn thành khóa ASF.\n2. **Nội dung khóa học:**\n   - Diễn ra tại các trường lái xe (Fahrschule) được cấp phép.\n   - Gồm 4 buổi thảo luận lý thuyết (mỗi buổi 135 phút) và 1 buổi lái thử thực hành có giáo viên đi kèm quan sát hành vi lái xe của bạn (khoảng 30 phút).\n3. **Hậu quả nếu không tham gia:** Nếu quá hạn mà bạn không nộp chứng chỉ ASF, Sở Giao thông sẽ **thu hồi bằng lái ngay lập tức (Entziehung der Fahrerlaubnis)** cho đến khi bạn hoàn thành khóa học.`,
  
  stop_vs_vorfahrt: `**Sự khác biệt giữa Biển STOP và Biển Vorfahrt gewähren (Nhường đường):**\n\nCả hai biển báo đều yêu cầu bạn phải nhường đường cho các phương tiện trên đường cắt ngang, nhưng có cách xử lý khác nhau tại vạch dừng:\n\n1. **Biển STOP (Biển đỏ bát giác - StVO § 41):**\n   - **Bắt buộc dừng hẳn xe:** Bốn bánh xe phải dừng lại hoàn toàn tại vạch dừng (Haltlinie) hoặc tại vạch tầm nhìn (Sichtlinie) nếu không có vạch dừng.\n   - **Thời gian dừng:** Dừng tối thiểu **3 giây** trước khi tiếp tục di chuyển (ngay cả khi đường hoàn toàn vắng không có xe nào).\n   - *Lỗi không dừng hẳn tại biển STOP sẽ bị phạt tiền và trừ điểm ở Flensburg, và là lỗi trượt trực tiếp khi thi thực hành.*\n2. **Biển Vorfahrt gewähren (Hình tam giác lộn ngược):**\n   - **Không bắt buộc dừng hẳn:** Bạn chỉ cần đi chậm lại để quan sát. Nếu đường cắt ngang hoàn toàn trống, bạn được phép tiếp tục đi tiếp mà không cần dừng xe lại.`,
  
  ueberholverbot: `**Hiệu lực của biển báo cấm vượt (Überholverbot - Biển 276):**\n\n1. **Ý nghĩa:** Biển báo cấm tất cả các phương tiện cơ giới (ô tô, xe máy, xe tải) vượt các phương tiện cơ giới nhiều bánh khác đi cùng chiều.\n2. **Ngoại lệ:** Bạn vẫn được phép vượt xe đơn giản một bánh (như xe đạp, xe máy điện không có thùng bên cạnh) nếu đảm bảo khoảng cách an toàn bên sườn khi vượt (tối thiểu 1.5m trong phố, 2.0m ngoài phố).\n3. **Hiệu lực kết thúc khi:**\n   - Gặp biển báo kết thúc lệnh cấm vượt (biển vòng tròn màu xám gạch chéo).\n   - Gặp biển kết thúc mọi lệnh hạn chế (biển vòng tròn xám gạch chéo trống không).\n   - Đi qua ngã tư tiếp theo (Lưu ý: tại Đức, biển cấm vượt KHÔNG tự động hết hiệu lực khi qua ngã tư mà phải có biển báo kết thúc rõ ràng).`,
  
  tempo_zone: `**Biển Tempo-30-Zone (Khu vực giới hạn tốc độ 30 km/h):**\n\nĐây là biển báo hình vuông màu trắng có vẽ vòng tròn đỏ ghi số 30 bên trong và chữ "ZONE" phía dưới.\n\n1. **Phạm vi hiệu lực:**\n   - Áp dụng trên **tất cả các con đường** nằm trong khu vực đó cho tới khi bạn nhìn thấy biển báo kết thúc zone (Ende der Zone).\n   - Khác với biển giới hạn tốc độ tròn thông thường (vốn chỉ có hiệu lực trên chính đoạn đường cắm biển đó).\n2. **Quy tắc ưu tiên đặc trưng:**\n   - Trong hầu hết các Tempo-30-Zone, quy tắc ưu tiên mặc định tại các ngã tư luôn là **Rechts vor Links** (bên phải đi trước).\n   - Bạn phải đi chậm, quan sát kỹ các ngõ bên phải vì họ sẽ bất ngờ đi ra và có quyền ưu tiên.`,
  
  vocab_vorfahrt: `**Các thuật ngữ tiếng Đức cốt lõi về Quyền ưu tiên (Vorfahrt):**\n\n- **die Vorfahrt:** Quyền ưu tiên đi trước.\n- **Vorfahrt gewähren:** Nhường quyền ưu tiên cho xe khác.\n- **Rechts vor Links:** Quy tắc bên phải trước bên trái (mặc định tại ngã tư không biển báo).\n- **die Kreuzung / die Einmündung:** Ngã tư / Ngã ba giao lộ.\n- **die Vorfahrtsstraße:** Đường ưu tiên (được thể hiện bằng biển hình thoi vàng).\n- **der Vorfahrtberechtigte:** Người đang có quyền ưu tiên đi trước.\n- **die abknickende Vorfahrtsstraße:** Đường ưu tiên rẽ cong.\n- **gewähren:** Nhường, cho phép.\n- **verzichten:** Từ bỏ (ví dụ: từ bỏ quyền ưu tiên để nhường đường cho xe khác vì lý do an toàn).`,
  
  vocab_vehicle: `**Các từ vựng tiếng Đức quan trọng về Bộ phận & Thiết bị xe:**\n\n- **die Bremse / das Bremspedal:** Phanh / Bàn đạp chân phanh.\n- **die Handbremse / Feststellbremse:** Phanh tay.\n- **die Lenkung / das Lenkrad:** Hệ thống lái / Vô lăng.\n- **der Reifen / die Bereifung:** Lốp xe.\n- **die Profiltiefe:** Độ sâu rãnh lốp xe (tối thiểu quy định là 1.6 mm).\n- **die Scheinwerfer:** Đèn pha phía trước.\n- **das Abblendlicht:** Đèn chiếu gần (đèn cốt).\n- **das Fernlicht:** Đèn chiếu xa (đèn pha).\n- **der Blinker:** Đèn xi-nhan báo rẽ.\n- **der Rückspiegel / Außenspiegel:** Gương chiếu hậu trong xe / gương chiếu hậu ngoài xe.\n- **die Scheibenwaschanlage:** Hệ thống gạt nước & rửa kính chắn gió.\n- **der Warnblinker:** Đèn cảnh báo nguy hiểm (nhấp nháy cả 4 đèn xi-nhan cùng lúc).`,
  
  vocab_behavior: `**Các động từ chỉ hành vi lái xe trong đề thi lý thuyết:**\n\n- **überholen:** Vượt xe khác đi cùng chiều.\n- **vorbeifahren:** Đi vòng qua một xe hoặc chướng ngại vật đang dừng đỗ bên đường.\n- **abbiegen (links abbiegen / rechts abbiegen):** Rẽ (rẽ trái / rẽ phải).\n- **einbiegen:** Rẽ nhập vào một làn đường mới.\n- **einordnen:** Xếp hàng, di chuyển xe vào đúng làn đường quy định trước khi rẽ.\n- **anhalten:** Dừng xe lại (chủ động hoặc dừng do luật giao thông).\n- **parken / halten:** Đỗ xe (trên 3 phút hoặc rời khỏi xe) / Dừng xe tạm thời (dưới 3 phút và không rời xe).\n- **beschleunigen:** Tăng tốc độ.\n- **abbremsen / bremsen:** Giảm tốc độ / phanh xe.\n- **ausweichen:** Tránh sang một bên để né chướng ngại vật hoặc phương tiện khác.\n- **beobachten:** Quan sát tình huống xung quanh.\n- **blinken:** Bật xi-nhan báo rẽ.`
};

export const AIChat = ({ user }) => {
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Remove all emojis / icons
    let cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                        .replace(/[\u{2600}-\u{26FF}]/gu, '')
                        .replace(/[\u{2700}-\u{27BF}]/gu, '');
    
    const lines = cleanText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={partIdx}>{part.replace(/\*/g, '').replace(/`/g, '')}</span>;
      });
      
      return (
        <div key={lineIdx} style={{ minHeight: '1.2em' }}>
          {formattedParts}
        </div>
      );
    });
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Xin chào ${user.displayName || 'bạn'}! Tôi là Gia sư AI chuyên về lý thuyết lái xe Đức. 🚗\n\nĐể hỗ trợ bạn học tập có tập trung và hiệu quả nhất, hệ thống đã chuẩn bị sẵn các bộ câu hỏi thường gặp bên dưới.\n\nHãy chọn một câu hỏi để bắt đầu nhận giải đáp chi tiết từ tôi!`
    }
  ]);
  const [activeCategory, setActiveCategory] = useState(questionCategories[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSelectQuestion = async (question) => {
    if (isLoading) return;

    const promptText = question.text;
    const questionId = question.id;

    const userMsg = { id: Date.now(), sender: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const apiKey = user.apiKey || localStorage.getItem('fuhrerschein_api_key') || '';

    if (apiKey) {
      // Live Gemini call
      try {
        const historyPrompt = messages.map(m => 
          `${m.sender === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${m.text}`
        ).join('\n');

        const prompt = `
Bạn là Trợ lý AI chuyên biệt về giảng dạy lý thuyết bằng lái xe Đức (Führerschein Klasse B) cho người Việt Nam.
Hãy giải đáp thắc mắc sau của học viên một cách chính xác, chi tiết, dẫn nguồn luật giao thông Đức (StVO) nếu có. 
Sử dụng song ngữ Đức - Việt khi giải nghĩa các thuật ngữ kỹ thuật.

Lịch sử trò chuyện:
${historyPrompt}

Câu hỏi hiện tại: "${promptText}"

Trả lời bằng tiếng Việt một cách dễ hiểu, có chia đoạn rõ ràng.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, tôi gặp lỗi khi tạo nội dung. Vui lòng thử lại!';
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiText }]);
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'ai', 
          text: 'Lỗi kết nối hệ thống. Vui lòng kiểm tra kết nối mạng của bạn!' 
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Direct Mock Responses from predefined dictionary
      setTimeout(() => {
        const responseText = mockResponses[questionId] || `Cám ơn bạn đã hỏi. Tôi sẽ sớm cập nhật giải đáp chi tiết cho câu hỏi "${promptText}".`;
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: responseText }]);
        setIsLoading(false);
      }, 600);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện không?')) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Lịch sử đã được dọn sạch. Bạn muốn hỏi tôi về chủ đề gì tiếp theo?`
        }
      ]);
    }
  };

  const activeCategoryData = questionCategories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col h-[76vh] bg-slate-50 overflow-hidden px-4">
      
      {/* Header section with Clear history option */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 text-[#1a4a5e]">
          <Sparkles className="w-5 h-5 fill-yellow-400 stroke-yellow-500" />
          <span className="font-extrabold text-[12px] uppercase tracking-wider">Hộp gợi ý & Hỏi đáp</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold"
          title="Xóa lịch sử chat"
        >
          <Trash2 className="w-4 h-4" />
          <span>Dọn lịch sử</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white border border-gray-200 my-2 no-scrollbar rounded-xl shadow-xs">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className={`text-[9px] font-sans font-extrabold tracking-wider uppercase ${
                msg.sender === 'user' ? 'text-right text-gray-400' : 'text-left text-[#2b6f8a]'
              }`}>
                {msg.sender === 'user' ? 'BẠN' : 'GIA SƯ AI'}
              </span>
              <div className={`p-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-2xs border ${
                msg.sender === 'user' 
                  ? 'bg-[#2b6f8a] border-[#2b6f8a] text-white' 
                  : 'bg-slate-50 border-gray-100 text-gray-900'
              } whitespace-pre-wrap`}>
                {renderFormattedText(msg.text)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className="text-[9px] font-sans font-extrabold tracking-wider uppercase text-[#2b6f8a]">
                GIA SƯ AI
              </span>
              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-3 text-xs font-bold text-gray-500">
                Gia sư AI đang viết giải thích...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controlled Selection Panel */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-3 mb-2 shadow-xs shrink-0 max-h-[40%] overflow-hidden">
        <span className="text-[10px] font-extrabold text-[#1a4a5e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#2b6f8a]" />
          Chọn câu hỏi muốn giải đáp:
        </span>

        {/* Category switcher tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar shrink-0 border-b border-gray-100 mb-2.5">
          {questionCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#1a4a5e] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* List of questions in active category */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
          {activeCategoryData?.questions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(q)}
              disabled={isLoading}
              className="w-full text-left p-2 bg-slate-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg text-[11px] font-bold text-gray-700 hover:text-[#1a4a5e] transition-all disabled:opacity-55 flex items-center justify-between"
            >
              <span>{q.label}</span>
              <span className="text-[10px] text-[#2b6f8a] shrink-0 font-extrabold ml-2 bg-blue-100/50 px-1.5 py-0.5 rounded">Hỏi ➜</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controlled Warning Info bar */}
      <div className="text-[9px] font-bold text-gray-400 text-center pb-2 bg-slate-50 shrink-0">
        🔒 Chế độ hỏi đáp có kiểm soát để hỗ trợ ôn thi lý thuyết tốt nhất.
      </div>

    </div>
  );
};

export default AIChat;

