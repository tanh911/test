import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Send, AlertTriangle, CheckCircle, Trash2, Sparkles, HelpCircle, ArrowRight, Clock } from 'lucide-react';

const questionCategories = [
  {
    id: 'formulas',
    title: '📐 Công thức tính',
    questions: [
      { id: 'reaktionsweg', label: 'Quãng đường phản ứng (Reaktionsweg)', text: 'Giải thích công thức tính Quãng đường phản ứng (Reaktionsweg) và cho ví dụ.' },
      { id: 'bremsweg', label: 'Quãng đường phanh thường (Bremsweg)', text: 'Giải thích công thức tính Quãng đường phanh thông thường (Bremsweg) và cho ví dụ.' },
      { id: 'gefahrbremsung', label: 'Quãng đường phanh khẩn cấp (Gefahrbremsung)', text: 'Giải thích công thức tính Quãng đường phanh khẩn cấp (Gefahrbremsung) và cho ví dụ.' },
      { id: 'anhalteweg', label: 'Quãng đường dừng xe (Anhalteweg)', text: 'Giải thích công thức tính Tổng quãng đường dừng xe (Anhalteweg) và cho ví dụ.' },
      { id: 'safety_distance', label: 'Quy tắc khoảng cách an toàn (Sicherheitsabstand)', text: 'Quy tắc tính khoảng cách an toàn tối thiểu với xe đi trước là gì?' },
      { id: 'speed_fog', label: 'Tốc độ khi tầm nhìn dưới 50m (Sichtweite unter 50m)', text: 'Khi tầm nhìn dưới 50m do sương mù hoặc mưa lớn, tốc độ tối đa và khoảng cách an toàn là bao nhiêu?' }
    ]
  },
  {
    id: 'priority',
    title: '🚦 Quyền ưu tiên (Vorfahrt)',
    questions: [
      { id: 'rechts_vor_links', label: 'Quy tắc Rechts vor Links là gì?', text: 'Giải thích quy tắc Rechts vor Links (Bên phải trước bên trái) áp dụng thế nào ở Đức?' },
      { id: 'kreisverkehr', label: 'Thứ tự đi tại bùng binh (Kreisverkehr)', text: 'Giải thích quy tắc ưu tiên và xi nhan khi đi vào và đi ra khỏi bùng binh (Kreisverkehr) ở Đức?' },
      { id: 'left_turn', label: 'Quy tắc rẽ trái nhường đường', text: 'Khi rẽ trái tại ngã tư, tôi phải nhường đường cho những đối tượng nào?' },
      { id: 'abknickende_vorfahrt', label: 'Đường ưu tiên rẽ cong', text: 'Giải thích cách đi và bật xi nhan tại biển báo đường ưu tiên rẽ cong (abknickende Vorfahrtsstraße).' },
      { id: 'stoppschild', label: 'Quy tắc dừng tại biển STOP (Stoppschild)', text: 'Tôi phải dừng xe ở đâu và nhường đường cho ai khi gặp biển báo STOP?' },
      { id: 'blaulicht', label: 'Nhường đường xe ưu tiên (Einsatzfahrzeuge)', text: 'Tôi phải làm gì khi nghe tiếng còi hú và thấy đèn xanh nhấp nháy của xe cứu hỏa/cứu thương?' }
    ]
  },
  {
    id: 'probezeit',
    title: '🚗 Thời gian thử thách (Probezeit)',
    questions: [
      { id: 'probezeit_rules', label: 'Thời gian thử thách Probezeit', text: 'Thời gian thử thách Probezeit kéo dài bao lâu và có quy định gì về nồng độ cồn?' },
      { id: 'a_b_verstoss', label: 'Vi phạm Nhóm A và Nhóm B', text: 'Sự khác nhau giữa lỗi vi phạm nặng nhóm A (A-Verstoß) và lỗi nhẹ nhóm B (B-Verstoß) là gì?' },
      { id: 'asf_seminar', label: 'Khóa học ASF là gì?', text: 'Khi nào tài xế phải học khóa tập huấn bắt buộc ASF (Aufbauseminar) và hậu quả là gì?' },
      { id: 'speed_violations', label: 'Bị cấm lái xe khi quá tốc độ (Fahrverbot)', text: 'Khi nào tài xế bị cấm lái xe (Fahrverbot) do lỗi chạy quá tốc độ?' }
    ]
  },
  {
    id: 'signs',
    title: '🛑 Biển báo đường bộ',
    questions: [
      { id: 'einbahnstrasse', label: 'Biển báo cấm đi ngược chiều (Einbahnstraße)', text: 'Sự khác nhau giữa biển Einbahnstraße (đường một chiều) và biển cấm vào xe ngược chiều là gì?' },
      { id: 'verkehrsberuhigter_bereich', label: 'Khu vực giao thông êm dịu (Spielstraße)', text: 'Các quy định đặc biệt và quy tắc nhường đường trong khu vực giao thông êm dịu (Verkehrsberuhigter Bereich) là gì?' },
      { id: 'halteverbot_rules', label: 'Phân biệt biển cấm dừng và cấm đỗ', text: 'Sự khác nhau giữa biển cấm dừng đỗ hoàn toàn (Absolutes Halteverbot) và cấm đỗ xe (Eingeschränktes Halteverbot) là gì?' }
    ]
  },
  {
    id: 'technik',
    title: '🔧 Kỹ thuật & Thiết bị',
    questions: [
      { id: 'mindestprofiltiefe', label: 'Độ mòn tối thiểu của lốp xe (Reifenprofil)', text: 'Quy định độ sâu rãnh lốp tối thiểu đối với xe ô tô ở Đức là bao nhiêu?' },
      { id: 'tuev_plakette', label: 'Cách đọc nhãn kiểm định TÜV (HU)', text: 'Làm thế nào để biết xe của mình đến hạn đăng kiểm (TÜV) thông qua nhãn dán trên biển số xe?' },
      { id: 'car_fluids', label: 'Kiểm tra các loại dung dịch trên xe', text: 'Những loại dung dịch/chất lỏng nào trong khoang động cơ cần được tài xế kiểm tra thường xuyên?' }
    ]
  }
];

const mockResponses = {
  reaktionsweg: `**Quãng đường phản ứng (Reaktionsweg):**\n\nLà quãng đường xe chạy được từ lúc tài xế nhận biết chướng ngại vật cho đến khi thực sự đạp chân phanh (trung bình mất 1 giây).\n\n- **Công thức tính nhanh (Faustformel):** \`(Vận tốc / 10) x 3\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`(100 / 10) x 3 = 10 x 3 = 30 mét\`.\n- **Lưu ý:** Quãng đường này sẽ tăng lên nếu tài xế mệt mỏi, mất tập trung, hoặc sử dụng chất kích thích.`,

  bremsweg: `**Quãng đường phanh thông thường (Bremsweg):**\n\nLà quãng đường xe trượt đi từ lúc đạp chân phanh cho đến khi xe dừng lại hoàn toàn dưới điều kiện lực phanh thông thường.\n\n- **Công thức tính nhanh (Faustformel):** \`(Vận tốc / 10) x (Vận tốc / 10)\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`(100 / 10) x (100 / 10) = 10 x 10 = 100 mét\`.\n- **Lưu ý quan trọng:** Nếu vận tốc xe tăng lên gấp đôi (ví dụ từ 50km/h lên 100km/h), quãng đường phanh sẽ **tăng lên gấp 4 lần** (từ 25m lên 100m). Hãy nhớ điều này cho các câu hỏi lý thuyết!`,

  gefahrbremsung: `**Quãng đường phanh khẩn cấp (Gefahrbremsung):**\n\nLà quãng đường phanh khi tài xế đạp lút sàn phanh với lực tối đa để tránh tai nạn xảy ra (phanh gấp). Quãng đường này bằng một nửa so với phanh thông thường.\n\n- **Công thức tính nhanh (Faustformel):** \`[(Vận tốc / 10) x (Vận tốc / 10)] / 2\` (đơn vị: mét)\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h: \`[10 x 10] / 2 = 100 / 2 = 50 mét\`.\n- **Lưu ý:** Trong bài thi, khi câu hỏi hỏi về "phanh khẩn cấp" (Gefahrbremsung), bạn bắt buộc phải chia đôi kết quả của công thức phanh thông thường.`,

  anhalteweg: `**Tổng quãng đường dừng xe (Anhalteweg):**\n\nLà tổng quãng đường từ lúc mắt nhìn thấy chướng ngại vật cho tới khi xe đứng yên hẳn.\n\n- **Công thức:** \`Anhalteweg = Reaktionsweg + Bremsweg\`\n- **Công thức gộp:** \`[(Vận tốc / 10) x 3] + [(Vận tốc / 10) x (Vận tốc / 10)]\`\n- **Ví dụ:** Nếu xe chạy ở tốc độ 100 km/h:\n  - Reaktionsweg: \`10 x 3 = 30 mét\`\n  - Bremsweg: \`10 x 10 = 100 mét\`\n  - Tổng Anhalteweg: \`30 + 100 = 130 mét\`.\n- **Ý nghĩa:** Đây là khoảng cách an toàn tuyệt đối bạn cần khi xe trước phanh đứng lại đột ngột.`,

  safety_distance: `**Quy tắc khoảng cách an toàn (Sicherheitsabstand):**\n\nĐể đảm bảo an toàn phòng trường hợp xe trước phanh gấp, StVO quy định khoảng cách an toàn tối thiểu như sau:\n\n1. **Ngoài đô thị (Außerorts):** Khoảng cách an toàn tối thiểu bằng **nửa giá trị tốc độ** (Halber Tacho).\n   - Công thức: \`Vận tốc / 2\` (đơn vị: mét).\n   - Ví dụ: Đi tốc độ 100 km/h, cần giữ khoảng cách tối thiểu \`50 mét\`. Bạn có thể căn khoảng cách này bằng khoảng cách giữa 2 cột mốc phản quang ở rìa đường quốc lộ (thường cách nhau đúng 50m).\n2. **Trong đô thị (Innerorts):** Khoảng cách bằng quãng đường xe chạy trong **1 giây** (khoảng 15 mét ở tốc độ 50 km/h, tương đương độ dài của 3 thân xe).\n3. **Quy tắc 2 giây (2-Sekunden-Regel):** Chọn một mốc cố định bên đường, sau khi xe trước đi qua, bạn đếm từ 1 đến 2. Nếu xe bạn chưa qua mốc đó thì khoảng cách an toàn đạt yêu cầu.`,

  speed_fog: `**Quy định khi tầm nhìn dưới 50m do sương mù/mưa lớn (StVO § 3):**\n\nKhi tầm nhìn giảm xuống dưới 50 mét do sương mù, tuyết rơi hoặc mưa lớn, bạn bắt buộc phải tuân thủ nghiêm ngặt các giới hạn sau:\n\n1. **Tốc độ tối đa cho phép:** Không được vượt quá **50 km/h** (áp dụng cho mọi loại đường, kể cả đường cao tốc Autobahn).\n2. **Khoảng cách an toàn tối thiểu:** Phải bằng hoặc lớn hơn tốc độ tính bằng mét (tức là tối thiểu **50 mét** với xe đi trước).\n3. **Mẹo đo khoảng cách:** Trên đường quốc lộ hoặc Autobahn ở Đức, các cột mốc phản quang ven đường (Leitpfosten) được đặt cách nhau chính xác **50 mét**. Nếu bạn chỉ nhìn thấy duy nhất một cột mốc phía trước, tầm nhìn của bạn đã dưới 50m và bạn phải lập tức giảm tốc độ xuống dưới 50 km/h.`,

  rechts_vor_links: `**Quy tắc Rechts vor Links (Bên phải trước bên trái - StVO § 8):**\n\n1. **Nguyên tắc cơ bản**: Tại ngã tư hoặc ngã ba không có biển báo ưu tiên, không có cảnh sát điều phối và không có đèn giao thông, phương tiện đi từ bên phải tới luôn có quyền ưu tiên đi trước.\n2. **Đối tượng áp dụng**: Áp dụng cho mọi loại phương tiện giao thông (ô tô, xe máy, xe đạp, xe điện,...).\n3. **Trường hợp ngoại lệ (Không áp dụng Rechts vor Links)**:\n   - Khi xe đi ra từ đường đất (Feldweg hoặc Waldweg).\n   - Khi xe đi ra từ khu vực đỗ xe (Parkplatz) hoặc ngõ đi riêng của các hộ gia đình (Grundstücksausfahrt).\n   - Khi đi ra từ khu vực đi bộ (Fußgängerzone) hoặc đường có vỉa hè hạ thấp (abgesenkter Bordstein).\n4. **Mẹo thi cử**: Trong bài thi thực hành lái xe, nếu bạn quên nhường đường cho một xe đi từ bên phải tới ngã tư (mặc dù đường vắng), giám khảo sẽ **đánh trượt bạn ngay lập tức (sofortiges Nichtbestehen)**.`,

  kreisverkehr: `**Quy tắc đi bùng binh (Kreisverkehr - StVO § 8a):**\n\n1. **Quyền ưu tiên**:\n   - Xe **đang ở trong bùng binh** có quyền ưu tiên trước xe chuẩn bị đi vào bùng binh (trừ khi có biển báo khác ngược lại, nhưng hầu như 99% bùng binh ở Đức đều có biển "Nhường đường" đi kèm biển bùng binh).\n2. **Quy tắc bật đèn xi-nhan**:\n   - **Khi đi vào bùng binh:** **KHÔNG** bật xi-nhan.\n   - **Khi đi trong bùng binh:** **KHÔNG** bật xi-nhan.\n   - **Khi đi ra khỏi bùng binh:** **BẮT BUỘC** phải bật xi-nhan phải để báo cho các xe khác biết họ có thể đi vào.\n3. **Các quy định khác**:\n   - Cấm dừng đỗ xe trên phần đường bùng binh.\n   - Không được đè lên đảo giao thông ở giữa bùng binh (trừ các xe container, xe tải siêu trường siêu trọng bắt buộc phải đè nhẹ do thân xe quá dài).`,

  left_turn: `**Quy tắc rẽ trái nhường đường khi lái xe ở Đức:**\n\nKhi thực hiện rẽ trái tại ngã tư hoặc ngã ba, bạn phải cực kỳ cẩn thận và bắt buộc phải nhường đường cho các đối tượng sau:\n\n1. **Phương tiện đi ngược chiều (Gegenverkehr):** Bao gồm tất cả các xe đi thẳng hoặc rẽ phải từ hướng ngược lại của bạn.\n2. **Người đi bộ (Fußgänger) và người đi xe đạp (Radfahrer):** Những người đang đi thẳng cắt qua phần đường bạn chuẩn bị rẽ vào (họ song song với hướng đi cũ của bạn).\n3. **Xe điện (Straßenbahn):** Xe điện chạy cùng hướng hoặc ngược hướng luôn có quyền ưu tiên rất cao tại Đức, hãy chú ý quan sát gương và điểm mù trước khi rẽ.`,

  abknickende_vorfahrt: `**Đường ưu tiên rẽ cong (Abknickende Vorfahrtsstraße):**\n\nĐây là biển báo ngã tư nguy hiểm, gồm biển đường ưu tiên (hình thoi vàng-trắng) kèm theo một biển phụ vẽ sơ đồ ngã tư với nét vẽ đậm thể hiện hướng đi ưu tiên rẽ cong.\n\n1. **Cách bật xi-nhan**:\n   - Nếu bạn **đi theo hướng nét đậm** (rẽ cong): **BẮT BUỘC** bật xi-nhan (vì bạn đang thay đổi hướng đi).\n   - Nếu bạn **đi thẳng rời khỏi hướng ưu tiên**: **KHÔNG** bật xi-nhan (vì bạn đang đi thẳng).\n2. **Quy tắc nhường đường**:\n   - Xe đi trên nét đậm luôn có quyền ưu tiên hơn xe đi từ nét mảnh.\n   - Nếu cả hai xe cùng đi từ hướng ưu tiên (nét đậm) rời đi, áp dụng quy tắc "Rechts vor Links" (xe bên phải đi trước).\n   - Nếu cả hai xe cùng đi từ nét mảnh (đường phụ) đi vào, cũng áp dụng quy tắc "Rechts vor Links" để nhường nhau.`,

  stoppschild: `**Quy tắc tại biển báo STOP (Halt! Vorfahrt gewähren - Biển báo 206):**\n\nKhi gặp biển báo STOP, bạn bắt buộc phải thực hiện các bước sau:\n\n1. **Bắt buộc dừng hẳn xe:** Xe của bạn phải dừng lại hoàn toàn (bánh xe ngừng quay) ít nhất **3 giây**.\n2. **Vị trí dừng xe**:\n   - Nếu **có vạch dừng (Haltelinie)**: Phải dừng trước vạch dừng.\n   - Nếu **không có vạch dừng**: Phải tiến đến mép đường giao nhau nơi có thể quan sát rõ dòng xe qua lại (Sichtlinie) rồi mới dừng.\n3. **Nhường đường:** Nhường đường cho mọi phương tiện trên trục đường cắt ngang.\n\n*Lưu ý khi thi lái xe: Lỗi không dừng hẳn xe tại biển STOP (chỉ rà phanh đi chậm qua) sẽ bị giám khảo đánh trượt ngay lập tức!*`,

  blaulicht: `**Quy tắc nhường đường cho xe ưu tiên (Einsatzfahrzeuge - StVO § 38):**\n\nKhi nghe thấy còi hú (Einsatzhorn) và thấy đèn nháy màu xanh (Blaulicht) của xe cảnh sát, xe cứu thương, xe cứu hỏa hoặc xe cứu hộ, bạn bắt buộc phải:\n\n1. **Lập tức nhường đường:** Hãy quan sát gương chiếu hậu, giảm tốc độ và né sang phải để nhường làn đường trống.\n2. **Tạo đường cứu hộ (Rettungsgasse) trên Autobahn/Quốc lộ**:\n   - Nếu tắc đường hoặc di chuyển chậm trên đường có từ 2 làn trở lên: Các xe ở làn ngoài cùng bên trái phải né sát sang trái; các xe ở tất cả các làn bên phải phải né sát sang bên phải.\n3. **Vượt đèn đỏ để nhường đường:** Nếu bạn đang dừng đèn đỏ ở ngã tư và xe cứu thương ở ngay sau lưng bạn không thể đi qua, bạn được phép **nhấn ga vượt nhẹ qua vạch dừng đèn đỏ** một cách cẩn thận để nhường đường. Cảnh sát sẽ không phạt bạn lỗi vượt đèn đỏ trong trường hợp này.`,

  probezeit_rules: `**Thời gian thử thách (Probezeit) tại Đức:**\n\n1. **Thời gian**: Kéo dài **2 năm** kể từ ngày bạn nhận được bằng lái chính thức lần đầu tiên (áp dụng cho cả bằng lái xe máy và ô tô).\n2. **Quy định nồng độ cồn**:\n   - Đối với tài xế trong Probezeit hoặc dưới 21 tuổi: Cấm tuyệt đối **0,0 Promille** cồn trong máu (chỉ cần có một chút cồn cũng bị phạt nặng).\n3. **Hệ quả khi vi phạm**:\n   - Nếu phạm lỗi nặng (nhóm A) hoặc 2 lỗi nhẹ (nhóm B): Thời gian thử thách Probezeit sẽ bị kéo dài thêm 2 năm nữa (tổng cộng thành **4 năm**).\n   - Bắt buộc phải tham gia khóa tập huấn lý thuyết & thực hành **Aufbauseminar (ASF)** với chi phí tự túc (khoảng 300 - 500 Euro).`,

  a_b_verstoss: `**Phân loại lỗi vi phạm trong thời gian thử thách (Probezeit):**\n\nCảnh sát Đức chia lỗi vi phạm thành 2 nhóm chính:\n\n1. **Lỗi vi phạm nghiêm trọng nhóm A (A-Verstoß):**\n   - Chạy quá tốc độ quy định từ **21 km/h trở lên**.\n   - Không nhường đường ưu tiên (Vorfahrt missachtet).\n   - Vượt đèn đỏ (Rotlichtverstoß).\n   - Sử dụng điện thoại di động khi đang lái xe (không có thiết bị rảnh tay).\n   - Vượt xe ở nơi cấm vượt hoặc gây tai nạn rồi bỏ chạy.\n2. **Lỗi vi phạm ít nghiêm trọng nhóm B (B-Verstoß):**\n   - Chở hàng quá tải, cồng kềnh gây mất an toàn giao thông.\n   - Lốp xe bị mòn quá giới hạn cho phép (dưới 1.6 mm).\n   - Không mua bảo hiểm bắt buộc cho xe.\n   - Đỗ xe gây cản trở nghiêm trọng cho phương tiện cứu hỏa, cứu thương.\n\n*Lưu ý: Chỉ cần phạm **1 lỗi nhóm A** hoặc **2 lỗi nhóm B** là bạn sẽ bị kéo dài Probezeit thêm 2 năm và phải đi học ASF.*`,

  asf_seminar: `**Khóa học ASF (Aufbauseminar für Fahranfänger):**\n\nLà khóa tập huấn lý thuyết & thực hành bắt buộc dành cho tài xế mới vi phạm luật giao thông trong thời gian thử thách.\n\n1. **Yêu cầu tham gia:** Bạn sẽ nhận được thư yêu cầu từ Sở Giao thông (Fahrerlaubnisbehörde) sau khi phạm 1 lỗi nhóm A hoặc 2 lỗi nhóm B. Họ sẽ cho bạn một thời hạn nhất định (thường là 2 tháng) để nộp chứng chỉ đã hoàn thành khóa ASF.\n2. **Nội dung khóa học:**\n   - Diễn ra tại các trường lái xe (Fahrschule) được cấp phép.\n   - Gồm 4 buổi thảo luận lý thuyết (mỗi buổi 135 phút) và 1 buổi lái thử thực hành có giáo viên đi kèm quan sát hành vi lái xe của bạn (khoảng 30 phút).\n3. **Hậu quả nếu không tham gia:** Nếu quá hạn mà bạn không nộp chứng chỉ ASF, Sở Giao thông sẽ **thu hồi bằng lái ngay lập tức (Entziehung der Fahrerlaubnis)** cho đến khi bạn hoàn thành khóa học.`,

  speed_violations: `**Bị cấm lái xe do lỗi chạy quá tốc độ (Fahrverbot tại Đức):**\n\n1. **Bị cấm lái xe (Fahrverbot) từ 1 đến 3 tháng**:\n   - **Trong đô thị (Innerorts):** Khi chạy quá tốc độ cho phép từ **21 km/h trở lên**.\n   - **Ngoài đô thị (Außerorts):** Khi chạy quá tốc độ cho phép từ **26 km/h trở lên**.\n2. **Quy tắc tái phạm (Wiederholungstäter)**:\n   - Nếu bạn bị phạt chạy quá tốc độ từ **26 km/h trở lên 2 lần trong vòng 1 năm**, bạn sẽ bị cấm lái xe 1 tháng ngay lập tức.\n3. **Đối với tài xế trong Probezeit**:\n   - Chạy quá tốc độ từ **21 km/h trở lên** được coi là lỗi nặng nhóm A (A-Verstoß), sẽ bị phạt tiền, cộng điểm phạt ở Flensburg, kéo dài Probezeit thêm 2 năm và bắt buộc phải tham gia khóa học ASF.`,

  einbahnstrasse: `**Biển Einbahnstraße (Đường một chiều) và Verbot der Einfahrt (Cấm đi ngược chiều):**\n\n1. **Biển Einbahnstraße (Biển mũi tên xanh lam dài có chữ trắng):**\n   - Chỉ hướng bạn được phép lái xe đi vào đường một chiều.\n   - Bạn được phép đỗ xe ở cả **hai bên rìa đường** (nếu không có biển cấm khác và đường đủ rộng), thay vì chỉ được đỗ bên phải như đường hai chiều bình thường.\n2. **Biển Verbot der Einfahrt (Biển tròn màu đỏ, ở giữa có vạch trắng ngang):**\n   - Cấm tất cả các phương tiện đi vào từ hướng này (hướng ngược chiều).\n   - Tuy nhiên, người đi xe đạp vẫn có thể đi vào nếu có biển phụ "Radfahrer frei" (Miễn cấm xe đạp).\n3. **Quy tắc lùi xe (Rückwärtsfahren):**\n   - Cấm lùi xe trên đường một chiều (Einbahnstraße), trừ trường hợp **lùi xe để đỗ xe** vào chỗ trống ven đường (Einparken).`,

  verkehrsberuhigter_bereich: `**Khu vực giao thông êm dịu (Verkehrsberuhigter Bereich - Thường gọi là Spielstraße):**\n\nKhi đi vào khu vực này (biển màu xanh vẽ người đi bộ, trẻ em chơi bóng và ô tô), bạn bắt buộc phải tuân theo các quy tắc nghiêm ngặt sau:\n\n1. **Tốc độ di chuyển:** Chỉ được đi với **tốc độ đi bộ (Schrittgeschwindigkeit)**, thường từ **4 đến 7 km/h** (đi số 1 rà côn/ga nhẹ).\n2. **Quyền ưu tiên trong khu vực:**\n   - Người đi bộ và trẻ em chơi đùa được phép sử dụng toàn bộ lòng đường. Bạn không được cản trở họ và phải dừng lại nhường đường nếu cần.\n   - Thứ tự giao lộ bên trong khu vực vẫn áp dụng quy tắc **Rechts vor Links**.\n3. **Đỗ xe (Parken):** Chỉ được đỗ xe trong các khu vực có vạch kẻ quy định (trừ khi chỉ dừng để lên xuống xe hoặc xếp dỡ đồ đạc).\n4. **Khi đi ra khỏi khu vực (Ausfahren):** Bạn phải nhường đường cho **tất cả mọi xe** trên đường chính đang chạy tới (giống như đi từ ngõ ra, quy tắc Rechts vor Links không áp dụng ở đây).`,

  halteverbot_rules: `**Phân biệt Absolutes Halteverbot (Cấm dừng) và Eingeschränktes Halteverbot (Cấm đỗ):**\n\n1. **Cấm dừng tuyệt đối (Absolutes Halteverbot - Biển tròn đỏ, nền xanh có 2 gạch chéo chéo chéo tạo thành chữ X):**\n   - Bạn **không được phép dừng xe** ở khu vực này dưới bất kỳ lý do gì (trừ khi tắc đường hoặc theo hiệu lệnh của cảnh sát).\n2. **Cấm đỗ xe (Eingeschränktes Halteverbot - Biển tròn đỏ, nền xanh chỉ có 1 gạch chéo):**\n   - Bạn được phép **dừng xe tối đa 3 phút**.\n   - Được phép dừng lâu hơn 3 phút **chỉ khi** bạn đang thực hiện xếp dỡ hàng hóa (Be- und Entladen) hoặc cho hành khách lên xuống xe (Ein- und Aussteigen) với điều kiện bạn phải luôn có mặt gần xe để di chuyển xe đi nơi khác nếu cần thiết.\n3. **Mẹo ghi nhớ mũi tên trên biển**:\n   - Mũi tên hướng **về phía lòng đường** (trái): Bắt đầu khu vực cấm.\n   - Mũi tên hướng **ra xa lòng đường** (phải): Kết thúc khu vực cấm.`,

  mindestprofiltiefe: `**Độ mòn tối thiểu của lốp xe (Mindestprofiltiefe tại Đức - StVZO § 36):**\n\n1. **Quy định pháp luật tối thiểu:** Độ sâu của rãnh lốp (gồm cả lốp mùa hè, lốp mùa đông và lốp bốn mùa) bắt buộc phải đạt tối thiểu là **1.6 mm**.\n2. **Đo độ mòn:** Bạn có thể tự kiểm tra bằng cách nhìn các vạch chỉ thị mòn lốp (TWI - Tread Wear Indicator) nằm trong rãnh lốp. Nếu bề mặt lốp mòn bằng với vạch này tức là lốp đã đạt ngưỡng 1.6mm và phải thay ngay.\n3. **Khuyến nghị an toàn (không bắt buộc nhưng rất quan trọng):**\n   - Lốp mùa hè: Nên thay khi độ sâu rãnh dưới **3 mm**.\n   - Lốp mùa đông hoặc lốp bốn mùa: Nên thay khi độ sâu rãnh dưới **4 mm** (để giữ độ bám tốt trên tuyết và đường trơn trượt).`,

  tuev_plakette: `**Cách đọc nhãn đăng kiểm TÜV (Hauptuntersuchung - HU Plakette):**\n\nNhãn tròn nhiều màu được dán ở biển số phía sau xe thể hiện thời hạn kiểm định an toàn kỹ thuật tiếp theo:\n\n1. **Năm cần đăng kiểm lại:** Được ghi bởi **2 số ở tâm vòng tròn** (ví dụ: số 26 nghĩa là năm 2026).\n2. **Tháng cần đăng kiểm lại:** Là **số nằm ở vị trí 12 giờ (đỉnh trên cùng)** của nhãn dán.\n3. **Màu sắc của nhãn dán:** Thay đổi theo từng năm (ví dụ: xanh lá, cam, hồng, xanh lam...) giúp cảnh sát giao thông có thể đứng từ xa quan sát là biết xe của bạn đã quá hạn đăng kiểm hay chưa.\n4. **Ý nghĩa vạch đen lớn:** Đoạn vạch đen dày bao quanh số 12, 1, 11 giúp xác định nhanh hướng xoay của nhãn để đọc tháng mà không cần tiến quá sát xe.`,

  car_fluids: `**Các loại dung dịch/chất lỏng trong khoang động cơ cần kiểm tra:**\n\nLà tài xế, bạn phải thường xuyên mở nắp capo kiểm tra các bình chứa dung dịch sau để đảm bảo xe vận hành an toàn:\n\n1. **Dầu động cơ (Motoröl):** Kiểm tra mức dầu bằng que thăm dầu (Ölmessstab). Mức dầu phải nằm giữa vạch MIN và MAX.\n2. **Nước làm mát (Kühlwasser):** Bình nhựa trong suốt chứa nước màu hồng hoặc xanh. Tuyệt đối không mở nắp bình khi động cơ đang nóng vì nước sôi áp suất cao sẽ bắn ra gây bỏng nặng.\n3. **Dầu phanh (Bremsflüssigkeit):** Cực kỳ quan trọng. Nếu mức dầu phanh tụt nhanh dưới mức MIN, hệ thống phanh có thể bị rò rỉ và mất tác dụng lực phanh.\n4. **Nước rửa kính (Scheibenwaschwasser):** Bình chứa nước phun lên rửa kính chắn gió trước/sau. Cần đổ thêm nước rửa kính pha dung dịch chống đông (Frostschutzmittel) vào mùa đông để tránh bị đóng băng.`
};

export const Help = ({ user, languageMode = 'both' }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Xin chào ${user?.displayName || 'bạn'}! Tôi là Gia sư lý thuyết bằng lái xe Đức. 🚗\n\nHọc lý thuyết lái xe có chỗ nào chưa hiểu, bạn hãy chọn một câu hỏi gợi ý nhanh bên dưới để tôi hỗ trợ giải thích nhé!`
    }
  ]);
  const [activeCategory, setActiveCategory] = useState(questionCategories[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Bug reporting form state
  const [bugCategory, setBugCategory] = useState('app');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugSubmitting, setBugSubmitting] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const t = (vi, de) => {
    if (languageMode === 'vi') return vi;
    if (languageMode === 'de') return de;
    return `${vi} / ${de}`;
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    let cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '');
    const lines = cleanText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} style={{ color: '#1a4a5e', fontWeight: '800' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={partIdx}>{part.replace(/\*/g, '').replace(/`/g, '')}</span>;
      });
      return (
        <div key={lineIdx} style={{ minHeight: '1.3em', marginBottom: '4px' }}>
          {formattedParts}
        </div>
      );
    });
  };

  const handleSelectQuestion = async (question) => {
    if (isLoading) return;
    const promptText = question.text;
    const questionId = question.id;

    const userMsg = { id: Date.now(), sender: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const apiKey = user?.apiKey || localStorage.getItem('fuhrerschein_api_key') || '';

    if (apiKey) {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, tôi gặp lỗi khi tạo nội dung. Vui lòng thử lại!';
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiText }]);
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'Lỗi kết nối hệ thống. Vui lòng kiểm tra mạng của bạn!' }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const responseText = mockResponses[questionId] || `Cám ơn bạn đã hỏi. Tôi sẽ sớm cập nhật giải đáp chi tiết cho câu hỏi "${promptText}".`;
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: responseText }]);
        setIsLoading(false);
      }, 700);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện không?')) {
      setMessages([
        { id: 1, sender: 'ai', text: `Lịch sử đã được dọn sạch. Bạn muốn hỏi tôi về chủ đề gì tiếp theo?` }
      ]);
    }
  };

  const handleSubmitBug = async (e) => {
    e.preventDefault();
    if (!bugDescription.trim()) return;
    setBugSubmitting(true);
    
    try {
      // Vercel / .env configuration
      const formspreeId = import.meta.env.VITE_FORMSPREE_ID || 'YOUR_FORMSPREE_ID';
      const FORMSPREE_ENDPOINT = `https://formspree.io/f/${formspreeId}`;
      
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          category: bugCategory,
          description: bugDescription,
          userName: user?.displayName || 'Anonymous',
          userEmail: user?.email || 'Not provided',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setBugSubmitted(true);
        setBugDescription('');
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Bug report error:', error);
      import('../utils/customAlert').then(({ customAlert }) => {
        customAlert(languageMode === 'vi' ? 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng kiểm tra lại Formspree ID.' : 'Fehler beim Senden des Berichts.', 'error');
      });
    } finally {
      setBugSubmitting(false);
    }
  };

  const activeCategoryData = questionCategories.find(c => c.id === activeCategory);

  return (
    <div style={{ flex: 1, backgroundColor: '#f4f7f9', overflowY: 'auto', padding: '32px 16px', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* CSS stylesheet embedded inside component for media queries and interactions */}
      <style>{`
        .help-container {
          max-width: 1024px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .help-header-banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #2b576b 0%, #1a4a5e 100%);
          color: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 25px rgba(26, 74, 94, 0.15);
          border: 1px solid rgba(43, 111, 138, 0.2);
        }
        .help-banner-icon {
          position: absolute;
          right: -20px;
          bottom: -30px;
          opacity: 0.08;
          pointer-events: none;
          transform: rotate(-10deg);
        }
        .help-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }
        @media (min-width: 768px) {
          .help-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .help-chat-sidebar {
          position: static;
        }
        @media (min-width: 768px) {
          .help-chat-sidebar {
            position: sticky;
            top: 96px;
            z-index: 10;
          }
        }
        .help-card {
          background: white;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          border: 1px solid #eef2f6;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .help-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .help-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e445a;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 20px;
        }
        .help-contact-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .help-contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .help-contact-item.interactive:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
          transform: translateY(-1px);
        }
        .help-icon-box {
          width: 42px;
          height: 42px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          color: #2b576b;
          flex-shrink: 0;
        }
        .help-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .help-value {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .help-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .help-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .help-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .help-input:focus {
          border-color: #2b576b;
          background: white;
          box-shadow: 0 0 0 3px rgba(43, 111, 138, 0.12);
        }
        .help-submit-btn {
          width: 100%;
          background: #2b576b;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(43, 111, 138, 0.15);
        }
        .help-submit-btn:hover {
          background: #1a4a5e;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(26, 74, 94, 0.25);
        }
        .help-submit-btn:active {
          transform: translateY(0);
        }
        .help-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .chat-message-container {
          height: 300px;
          overflow-y: auto;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .chat-bubble {
          max-width: 85%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .chat-bubble.user {
          align-self: flex-end;
          align-items: flex-end;
        }
        .chat-bubble.ai {
          align-self: flex-start;
          align-items: flex-start;
        }
        .chat-bubble-name {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chat-bubble-name.user {
          color: #94a3b8;
        }
        .chat-bubble-name.ai {
          color: #2b6f8a;
        }
        .chat-bubble-text {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 12px;
          line-height: 1.6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          white-space: pre-wrap;
        }
        .chat-bubble-text.user {
          background: linear-gradient(135deg, #2b6f8a 0%, #1a4a5e 100%);
          color: white;
          border-top-right-radius: 0;
        }
        .chat-bubble-text.ai {
          background: white;
          color: #334155;
          border: 1px solid #eef2f6;
          border-top-left-radius: 0;
        }
        .chat-suggestions-box {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow: hidden;
        }
        .chat-suggestions-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .chat-suggestion-btn {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .chat-suggestion-btn:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: #1a4a5e;
          transform: translateX(2px);
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div className="help-container">

        {/* Title Header Banner Card */}
        <div className="help-header-banner">
          <div className="help-banner-icon">
            <HelpCircle size={220} className="stroke-white" />
          </div>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: '28px', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
              <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>🛠️</div>
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{t('Trợ giúp & Hỗ trợ', 'Hilfe & Support')}</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px', maxWidth: '500px', lineHeight: '1.5' }}>
                {t('Gửi báo lỗi, liên hệ trực tiếp bộ phận kỹ thuật hoặc trao đổi trực tiếp với gia sư lý thuyết bằng lái xe AI.', 'Melden Sie Fehler, kontaktieren Sie den Support oder lernen Sie mit dem KI-Tutor.')}
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="help-grid">

          {/* Left Column: Contact & Bug Report Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Card 1: Contact info */}
            <div className="help-card">
              <h2 className="help-card-title">
                <span style={{ fontSize: '18px' }}>📞</span> {t('Thông tin liên hệ', 'Kontaktinformationen')}
              </h2>

              <div className="help-contact-list">
                <a href="mailto:support@vietduc-fuhrerschein.de" className="help-contact-item interactive">
                  <div className="help-icon-box">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="help-label">{t('Email hỗ trợ', 'E-Mail Support')}</div>
                    <div className="help-value" style={{ color: '#2b576b' }}>supportsplitvie@gmail.com</div>
                  </div>
                </a>



                <div className="help-contact-item">
                  <div className="help-icon-box">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="help-label">{t('Giờ hoạt động', 'Arbeitszeit')}</div>
                    <div className="help-value">24/7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Bug report & Feature Request */}
            <div className="help-card">
              <h2 className="help-card-title">
                {t('Báo lỗi & Phản hồi', 'Fehler melden & Feedback')}
              </h2>

              {bugSubmitted ? (
                <div style={{ backgroundColor: 'rgba(240, 253, 244, 0.7)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#166534' }}>{t('Gửi phản hồi thành công!', 'Erfolgreich gesendet!')}</div>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: '1.6' }}>
                      {t('Cảm ơn đóng góp của bạn. Bộ phận kỹ thuật sẽ kiểm tra và khắc phục lỗi sớm nhất có thể.', 'Vielen Dank für Ihre Rückmeldung. Wir werden das Problem schnellstmöglich beheben.')}
                    </p>
                  </div>
                  <button
                    onClick={() => setBugSubmitted(false)}
                    style={{ backgroundColor: '#2b576b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(43, 111, 138, 0.2)' }}
                  >
                    {t('Gửi báo cáo khác', 'Weiterer Bericht')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitBug} className="help-form">
                  <div className="help-form-group">
                    <label className="help-label">{t('Loại yêu cầu', 'Anfragetyp')}</label>
                    <select
                      value={bugCategory}
                      onChange={(e) => setBugCategory(e.target.value)}
                      className="help-input"
                      style={{ fontWeight: '700' }}
                    >
                      <option value="app">{t('Lỗi hiển thị / Ứng dụng (App Bug)', 'App-Fehler / Bug')}</option>
                      <option value="translation">{t('Lỗi dịch thuật / Nội dung câu hỏi', 'Übersetzungsfehler / Fragen')}</option>
                      <option value="feature">{t('Đề xuất tính năng mới / Góp ý', 'Verbesserungsvorschlag')}</option>
                      <option value="other">{t('Hỗ trợ kỹ thuật khác', 'Sonstige Anfrage')}</option>
                    </select>
                  </div>

                  <div className="help-form-group">
                    <label className="help-label">{t('Nội dung chi tiết', 'Beschreibung')}</label>
                    <textarea
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      rows={4}
                      placeholder={t('Vui lòng mô tả chi tiết vấn đề bạn gặp phải để chúng tôi hỗ trợ tốt nhất...', 'Bitte beschreiben Sie den Fehler oder Ihr Feedback so detailliert wie möglich...')}
                      required
                      className="help-input help-textarea"
                      style={{ lineHeight: '1.6' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bugSubmitting}
                    className="help-submit-btn"
                  >
                    <span>{bugSubmitting ? t('Đang gửi...', 'Wird gesendet...') : t('Gửi phản hồi', 'Feedback absenden')}</span>
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Mini AI Chat Widget */}
          <div className="help-chat-sidebar">
            <div className="help-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* AI Widget Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#fef9c3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e445a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      {t('Bạn đồng hành', 'Lernbegleiter')}
                    </span>
                    <div style={{ display: 'block', width: 'fit-content', marginTop: '2px' }}>
                      <span style={{ fontSize: '8px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.05em' }}>ONLINE</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  style={{ background: 'none', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title="Xóa lịch sử chat"
                >
                  <Trash2 size={13} />
                  <span>{t('Dọn dẹp', 'Leeren')}</span>
                </button>
              </div>

              {/* Mini Chat Message Area */}
              <div className="chat-message-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}
                  >
                    <span className={`chat-bubble-name ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                      {msg.sender === 'user' ? t('Bạn', 'Du') : t('Gia sư AI', 'KI-Tutor')}
                    </span>
                    <div className={`chat-bubble-text ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-bubble ai" style={{ opacity: 0.6 }}>
                    <span className="chat-bubble-name ai">
                      {t('Gia sư AI', 'KI-Tutor')}
                    </span>
                    <div className="chat-bubble-text ai" style={{ fontWeight: '500' }}>
                      {t('Gia sư AI đang viết giải thích...', 'KI antwortet...')}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mini Chat Question Selection Bar */}
              <div className="chat-suggestions-box">
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#1a4a5e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} style={{ color: '#2b6f8a' }} />
                  {t('Chọn nhanh câu hỏi ôn tập lý thuyết:', 'Schnellfragen auswählen:')}
                </span>

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  {questionCategories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#1a4a5e' : '#ffffff',
                          color: isActive ? '#ffffff' : '#475569',
                          border: isActive ? '1px solid #1a4a5e' : '1px solid #e2e8f0',
                          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          flexShrink: 0
                        }}
                      >
                        {cat.title}
                      </button>
                    );
                  })}
                </div>

                {/* Suggestions list */}
                <div className="chat-suggestions-list">
                  {activeCategoryData?.questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      disabled={isLoading}
                      className="chat-suggestion-btn"
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.label}</span>
                      <ArrowRight size={12} style={{ color: '#2b6f8a', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textAlign: 'center' }}>
                🔒 {t('Câu hỏi được chọn lọc hỗ trợ ôn thi lý thuyết tốt nhất', 'Die Fragen wurden zur optimalen Vorbereitung ausgewählt.')}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Help;
