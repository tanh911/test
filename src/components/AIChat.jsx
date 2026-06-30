import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

const questionCategories = [
  {
    id: 'formulas',
    title: 'Công thức',
    questions: [
      { id: 'reaktionsweg', label: 'Quãng đường phản ứng (Reaktionsweg)', text: 'Giải thích công thức tính Quãng đường phản ứng (Reaktionsweg) và cho ví dụ.' },
      { id: 'bremsweg', label: 'Quãng đường phanh thường (Bremsweg)', text: 'Giải thích công thức tính Quãng đường phanh thông thường (Bremsweg) và cho ví dụ.' },
      { id: 'gefahrbremsung', label: 'Quãng đường phanh khẩn cấp (Gefahrbremsung)', text: 'Giải thích công thức tính Quãng đường phanh khẩn cấp (Gefahrbremsung) và cho ví dụ.' },
      { id: 'anhalteweg', label: 'Quãng đường dừng xe (Anhalteweg)', text: 'Giải thích công thức tính Tổng quãng đường dừng xe (Anhalteweg) và cho ví dụ.' },
      { id: 'safety_distance', label: 'Quy tắc khoảng cách an toàn (Sicherheitsabstand)', text: 'Quy tắc tính khoảng cách an toàn tối thiểu với xe đi trước là gì?' },
      { id: 'faustformel_ueberholen', label: 'Quãng đường vượt xe (Überholweg)', text: 'Giải thích quy tắc tính quãng đường vượt xe an toàn.' },
      { id: 'anhaengelast', label: 'Tải trọng rơ-moóc (Anhängelast)', text: 'Quy định về tải trọng rơ-moóc được phép kéo theo với bằng B.' }
    ]
  },
  {
    id: 'priority',
    title: 'Ưu tiên',
    questions: [
      { id: 'rechts_vor_links', label: 'Quy tắc Rechts vor Links là gì?', text: 'Giải thích quy tắc Rechts vor Links (Bên phải trước bên trái) áp dụng thế nào ở Đức?' },
      { id: 'kreisverkehr', label: 'Thứ tự đi tại bùng binh (Kreisverkehr)', text: 'Giải thích quy tắc ưu tiên và xi nhan khi đi vào và đi ra khỏi bùng binh (Kreisverkehr) ở Đức?' },
      { id: 'left_turn', label: 'Quy tắc rẽ trái nhường đường', text: 'Khi rẽ trái tại ngã tư, tôi phải nhường đường cho những đối tượng nào?' },
      { id: 'abknickende_vorfahrt', label: 'Đường ưu tiên rẽ cong', text: 'Giải thích cách đi và bật xi nhan tại biển báo đường ưu tiên rẽ cong (abknickende Vorfahrtsstraße).' },
      { id: 'bus_stop', label: 'Xe buýt đang đỗ tại bến', text: 'Cách xử lý khi gặp xe buýt đang đỗ ở trạm và đang bật đèn cảnh báo nguy hiểm (Warnblinkanlage).' },
      { id: 'gruener_pfeil', label: 'Biển mũi tên xanh (Grüner Pfeil)', text: 'Khi gặp biển mũi tên xanh bên cạnh đèn đỏ, tôi phải làm gì?' },
      { id: 'reissverschluss', label: 'Quy tắc khóa kéo (Reißverschluss)', text: 'Giải thích quy tắc khóa kéo (Reißverschlussverfahren) khi đường bị hẹp lại.' }
    ]
  },
  {
    id: 'probezeit',
    title: 'Probezeit',
    questions: [
      { id: 'probezeit_rules', label: 'Thời gian thử thách Probezeit', text: 'Thời gian thử thách Probezeit kéo dài bao lâu và có quy định gì về nồng độ cồn?' },
      { id: 'a_b_verstoss', label: 'Vi phạm Nhóm A và Nhóm B', text: 'Sự khác nhau giữa lỗi vi phạm nặng nhóm A (A-Verstoß) và lỗi nhẹ nhóm B (B-Verstoß) là gì?' },
      { id: 'asf_seminar', label: 'Khóa học ASF là gì?', text: 'Khi nào tài xế phải học khóa tập huấn bắt buộc ASF (Aufbauseminar) và hậu quả là gì?' },
      { id: 'alcohol_drugs', label: 'Quy định Rượu bia & Ma túy', text: 'Quy định về nồng độ cồn và chất kích thích khi tham gia giao thông ở Đức.' },
      { id: 'begleitetes_fahren', label: 'Lái xe từ 17 tuổi (BF17)', text: 'Quy định về việc lái xe có người giám sát từ 17 tuổi (Begleitetes Fahren).' },
      { id: 'handyverbot', label: 'Quy định cấm điện thoại', text: 'Hình phạt cho việc sử dụng điện thoại khi lái xe trong Probezeit là gì?' }
    ]
  },
  {
    id: 'signs',
    title: 'Biển báo',
    questions: [
      { id: 'stop_vs_vorfahrt', label: 'Biển STOP vs Nhường đường', text: 'Sự khác biệt về cách hành xử giữa biển dừng lại (Stop-Schild) và biển nhường đường (Vorfahrt gewähren) là gì?' },
      { id: 'ueberholverbot', label: 'Hiệu lực biển cấm vượt', text: 'Biển cấm vượt (Überholverbot) có hiệu lực đến khi nào và cấm những loại xe nào vượt?' },
      { id: 'tempo_zone', label: 'Khu vực giới hạn tốc độ (Zone)', text: 'Biển giới hạn tốc độ theo khu vực (ví dụ Tempo-30-Zone) khác gì so với biển giới hạn tốc độ thông thường?' },
      { id: 'halteverbot', label: 'Cấm đỗ vs Cấm dừng', text: 'Sự khác biệt giữa biển cấm dừng (Halteverbot) và cấm đỗ (Parkverbot).' },
      { id: 'richtgeschwindigkeit', label: 'Tốc độ khuyến nghị Autobahn', text: 'Biển tốc độ khuyến nghị (Richtgeschwindigkeit) 130 km/h có ý nghĩa gì?' },
      { id: 'spielstrasse', label: 'Khu vực ưu tiên (Spielstraße)', text: 'Quy định về tốc độ và nhường đường trong khu vực ưu tiên người đi bộ (Verkehrsberuhigter Bereich).' }
    ]
  },
  {
    id: 'vocabulary',
    title: 'Từ vựng',
    questions: [
      { id: 'vocab_vorfahrt', label: 'Từ vựng chủ đề Quyền ưu tiên', text: 'Tổng hợp các từ vựng tiếng Đức chuyên ngành quan trọng nhất về chủ đề Quyền ưu tiên (Vorfahrt).' },
      { id: 'vocab_vehicle', label: 'Từ vựng chủ đề Bộ phận xe', text: 'Tổng hợp các từ vựng tiếng Đức về các bộ phận của xe (lốp, phanh, đèn, động cơ,...) phục vụ thi lý thuyết.' },
      { id: 'vocab_behavior', label: 'Từ vựng chủ đề Hành vi lái xe', text: 'Tổng hợp các từ vựng tiếng Đức mô tả hành vi lái xe (vượt, nhường đường, rẽ, phanh gấp,...).' },
      { id: 'vocab_signs', label: 'Từ vựng: Phân loại biển báo', text: 'Các từ vựng tiếng Đức để phân loại biển báo (nguy hiểm, cấm, chỉ dẫn...).' },
      { id: 'vocab_dashboard', label: 'Từ vựng: Bảng điều khiển xe', text: 'Từ vựng các đèn báo lỗi và ký hiệu trên bảng điều khiển.' }
    ]
  },
  {
    id: 'environment',
    title: 'Môi trường',
    questions: [
      { id: 'eco_driving', label: 'Lái xe tiết kiệm nhiên liệu', text: 'Cách lái xe thân thiện với môi trường và tiết kiệm nhiên liệu (Umweltschonendes Fahren).' },
      { id: 'noise_pollution', label: 'Giảm ô nhiễm tiếng ồn', text: 'Những hành vi nào gây ô nhiễm tiếng ồn và bị cấm khi lái xe trong khu dân cư?' },
      { id: 'katalysator', label: 'Bộ lọc khí thải (Katalysator)', text: 'Chức năng của bộ lọc khí thải (Katalysator) và những lưu ý để không làm hỏng nó.' },
      { id: 'carpooling', label: 'Đi chung xe (Fahrgemeinschaften)', text: 'Lợi ích của việc đi chung xe đối với môi trường và giao thông.' }
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

  vocab_behavior: `**Các động từ chỉ hành vi lái xe trong đề thi lý thuyết:**\n\n- **überholen:** Vượt xe khác đi cùng chiều.\n- **vorbeifahren:** Đi vòng qua một xe hoặc chướng ngại vật đang dừng đỗ bên đường.\n- **abbiegen (links abbiegen / rechts abbiegen):** Rẽ (rẽ trái / rẽ phải).\n- **einbiegen:** Rẽ nhập vào một làn đường mới.\n- **einordnen:** Xếp hàng, di chuyển xe vào đúng làn đường quy định trước khi rẽ.\n- **anhalten:** Dừng xe lại (chủ động hoặc dừng do luật giao thông).\n- **parken / halten:** Đỗ xe (trên 3 phút hoặc rời khỏi xe) / Dừng xe tạm thời (dưới 3 phút và không rời xe).\n- **beschleunigen:** Tăng tốc độ.\n- **abbremsen / bremsen:** Giảm tốc độ / phanh xe.\n- **ausweichen:** Tránh sang một bên để né chướng ngại vật hoặc phương tiện khác.\n- **beobachten:** Quan sát tình huống xung quanh.\n- **blinken:** Bật xi-nhan báo rẽ.`,

  bus_stop: `**Gặp xe buýt đang đỗ và bật đèn cảnh báo (Warnblinkanlage):**\n\n1. **Khi xe buýt đang tiến vào bến và bật đèn:** BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT. Phải đi chậm phía sau nó.\n2. **Khi xe buýt đã đỗ hẳn tại bến và bật đèn:**\n   - Bạn chỉ được phép đi vượt qua với tốc độ **tối đa là tốc độ bước bộ (Schrittgeschwindigkeit - khoảng 4-7 km/h)**.\n   - Quy định này áp dụng cho **CẢ 2 CHIỀU đường** (trừ khi có dải phân cách cứng ở giữa).\n   - Bạn phải luôn chuẩn bị sẵn sàng phanh vì hành khách có thể bất ngờ chạy qua đầu xe buýt.`,

  alcohol_drugs: `**Quy định về nồng độ cồn và ma túy (Alkohol & Drogen):**\n\n1. **Thời gian Probezeit hoặc dưới 21 tuổi:** Cấm tuyệt đối 0.0 Promille.\n2. **Tài xế thông thường:**\n   - Dưới 0.3 Promille: Không vi phạm (trừ khi gây tai nạn).\n   - Từ 0.5 Promille trở lên: Vi phạm luật, phạt tiền (thường từ 500 EUR), cấm lái xe từ 1 tháng và bị trừ 2 điểm ở hệ thống đăng ký Flensburg.\n   - Từ 1.1 Promille: Bị quy tội hình sự, tước bằng lái hoàn toàn.\n3. **Ma túy (Cần sa, v.v.):** Cấm lái xe khi đang bị ảnh hưởng bởi ma túy. Phát hiện sẽ bị phạt rất nặng và yêu cầu làm bài kiểm tra tâm lý MPU (Idiotentest).`,

  eco_driving: `**Lái xe tiết kiệm nhiên liệu (Umweltschonendes Fahren):**\n\nĐể tiết kiệm nhiên liệu và giảm khí thải, bạn cần:\n1. **Chuyển số sớm:** Lên số cao ngay khi có thể (ở khoảng 2000 vòng/phút).\n2. **Dự đoán tình huống:** Quan sát xa, thả chân ga sớm khi thấy đèn đỏ từ xa thay vì đạp ga rồi phanh gấp.\n3. **Tắt động cơ:** Khi phải dừng lâu hơn 10-20 giây (ví dụ chờ đèn đỏ lâu, tàu hỏa đi qua, tắc đường), hãy tắt máy.\n4. **Giảm lực cản:** Tháo giá nóc (Dachgepäckträger) khi không dùng.\n5. **Áp suất lốp:** Đảm bảo áp suất lốp chuẩn theo khuyến cáo của nhà sản xuất. Lốp non hơi sẽ hao tốn nhiên liệu.`,

  noise_pollution: `**Giảm ô nhiễm tiếng ồn (Lärmschutz):**\n\nBạn KHÔNG được phép gây ra tiếng ồn không cần thiết, đặc biệt trong khu dân cư:\n1. **Không nẹt pô (Röhren lassen des Motors):** Bấm ga mạnh khi xe đứng yên hoặc dùng hệ thống ống xả quá ồn.\n2. **Không đóng cửa xe quá mạnh:** Thường xuyên đóng rầm cửa xe vào ban đêm.\n3. **Không bóp còi bừa bãi:** Chỉ dùng còi báo hiệu nguy hiểm ngoài đô thị, không dùng để gọi bạn bè hay chào nhau.\n4. **Không lái xe vòng vèo không có lý do (Sinnloses Hin- und Herfahren):** Chạy lượn lờ trong khu dân cư gây phiền toái cho người dân xung quanh.`,

  faustformel_ueberholen: `**Quãng đường vượt xe (Überholweg):**\n\nĐể vượt một xe khác an toàn, quãng đường vượt của bạn phải **lớn hơn đáng kể** so với khoảng cách bạn nhìn thấy.\n- Vận tốc của bạn phải lớn hơn xe bị vượt một khoảng đáng kể (nhưng không được vượt quá giới hạn tốc độ cho phép).\n- Bạn cần tính toán khoảng cách với xe đi ngược chiều. Nếu có xe ngược chiều, quãng đường an toàn cần thiết phải **gấp đôi** quãng đường vượt dự tính.`,

  anhaengelast: `**Tải trọng rơ-moóc (Anhängelast) với bằng Klasse B:**\n\nBằng lái hạng B cho phép bạn lái ô tô tối đa 3.5 tấn. Bạn được phép kéo rơ-moóc trong các trường hợp:\n1. Rơ-moóc nhỏ: Tổng trọng lượng (zGM) của rơ-moóc tối đa **750 kg**.\n2. Rơ-moóc lớn (trên 750 kg): Tổng trọng lượng của cả xe kéo VÀ rơ-moóc cộng lại **không vượt quá 3.500 kg (3.5 tấn)**.`,

  gruener_pfeil: `**Biển mũi tên xanh (Grüner Pfeil) cạnh đèn đỏ:**\n\nĐây là một tấm biển nhỏ bằng kim loại (không phải đèn tín hiệu sáng). Khi đèn giao thông đang ĐỎ:\n1. BẠN ĐƯỢC PHÉP rẽ phải.\n2. **ĐIỀU KIỆN BẮT BUỘC:** Bạn phải **DỪNG HẲN (với 4 bánh xe đứng im)** tại vạch dừng như gặp biển STOP.\n3. Sau khi quan sát không gây nguy hiểm hoặc cản trở người đi bộ, xe đạp và xe đi từ hướng khác, bạn mới được rẽ phải.`,

  reissverschluss: `**Quy tắc khóa kéo (Reißverschlussverfahren):**\n\nKhi một làn đường bị thu hẹp hoặc đóng lại (ví dụ do công trường), các xe ở làn bị đóng không được chuyển làn ngay lập tức.\n1. Bạn phải lái xe đi **tận đến điểm cuối cùng** (điểm bắt đầu hẹp lại).\n2. Xe ở làn bên cạnh bắt buộc phải nhường cho 1 xe của làn bị đóng xen vào trước mình, luân phiên từng xe một như răng của khóa kéo quần áo.\n3. Mục đích: Giúp tận dụng tối đa không gian đường và giảm tắc nghẽn.`,

  begleitetes_fahren: `**Lái xe từ 17 tuổi (Begleitetes Fahren - BF17):**\n\n1. Bạn có thể thi và lấy giấy phép lái xe đặc biệt từ 17 tuổi.\n2. **Bắt buộc:** Luôn phải có người giám sát (Begleitperson) ngồi trong xe khi bạn lái.\n3. Người giám sát phải được đăng ký trước, đủ 30 tuổi, có bằng lái B ít nhất 5 năm và không có quá 1 điểm phạt ở Flensburg.\n4. Người giám sát không được có nồng độ cồn từ 0.5 Promille trở lên.\n5. Ngay khi bạn tròn 18 tuổi, bạn sẽ nhận bằng cứng và được tự lái một mình.`,

  handyverbot: `**Quy định cấm điện thoại khi lái xe (Handyverbot):**\n\n1. Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC cầm thiết bị điện tử (điện thoại, tablet, smartwatch...) trên tay để nghe gọi, nhắn tin hoặc đọc bản đồ khi động cơ đang chạy.\n2. Lỗi này là một lỗi đặc biệt nghiêm trọng (**A-Verstoß**).\n3. Nếu vi phạm trong thời gian Probezeit, bạn sẽ bị phạt tiền nặng, cộng 1 điểm ở Flensburg, **kéo dài Probezeit thêm 2 năm** và bắt buộc phải đi học lại **khóa ASF** (tốn kém khoảng 400 Euro).`,

  halteverbot: `**Phân biệt Cấm dừng (Halteverbot) và Cấm đỗ (Parkverbot):**\n\n1. **Biển Cấm Dừng Tuyệt Đối (Absolutes Haltverbot - Biển tròn viền đỏ chữ X đỏ nền xanh):** CẤM DỪNG XÊ. Bạn không được phép đỗ xe và cũng không được phép dừng lại dù chỉ 1 giây (ngoại trừ phải dừng do tắc đường hoặc đèn đỏ).\n2. **Biển Cấm Đỗ (Eingeschränktes Haltverbot - Biển tròn viền đỏ 1 gạch chéo đỏ nền xanh):** Thường gọi là Cấm Đỗ. Bạn ĐƯỢC PHÉP DỪNG XE tối đa 3 phút (ví dụ để bốc dỡ hàng hóa hoặc đón trả khách), nhưng nếu bạn rời khỏi xe quá tầm mắt, hoặc dừng quá 3 phút, nó sẽ bị coi là ĐỖ XE (Parken) và bạn sẽ bị phạt.`,

  richtgeschwindigkeit: `**Tốc độ khuyến nghị (Richtgeschwindigkeit):**\n\nBiển vuông màu xanh có số 130 màu trắng áp dụng chủ yếu trên đường cao tốc (Autobahn) của Đức.\n1. Đây KHÔNG phải là giới hạn tốc độ tối đa.\n2. Nó khuyến nghị tốc độ an toàn lý tưởng nhất là 130 km/h ngay cả khi thời tiết đẹp và đường vắng.\n3. Mặc dù bạn được phép lái nhanh hơn (nếu không có biển cấm khác), nhưng nếu xảy ra tai nạn khi chạy trên 130 km/h, bạn có thể phải **chịu một phần trách nhiệm đền bù pháp lý** ngay cả khi lỗi ban đầu không thuộc về bạn.`,

  spielstrasse: `**Khu vực ưu tiên người đi bộ (Verkehrsberuhigter Bereich):**\n\nĐây là biển báo hình chữ nhật màu xanh vẽ cảnh người đi bộ, nhà cửa và ô tô đang chơi đùa. (Dân gian thường gọi là Spielstraße).\n1. **Tốc độ:** Bạn chỉ được phép lái xe với tốc độ bước bộ (**Schrittgeschwindigkeit**, khoảng 4 - 7 km/h).\n2. **Ưu tiên:** Người đi bộ và trẻ em có quyền ưu tiên tuyệt đối, được phép sử dụng toàn bộ mặt đường. Trẻ em được phép chơi dưới lòng đường.\n3. **Đỗ xe:** Chỉ được đỗ xe ở những khu vực được kẻ vạch cho phép đỗ.`,

  vocab_signs: `**Từ vựng về Phân loại Biển báo (Verkehrszeichen):**\n\n- **das Gefahrenzeichen:** Biển báo nguy hiểm (hình tam giác viền đỏ).\n- **das Vorschriftzeichen:** Biển báo hiệu lệnh/cấm (hình tròn viền đỏ).\n- **das Richtzeichen:** Biển chỉ dẫn (thường hình vuông/chữ nhật màu xanh).\n- **das Zusatzzeichen:** Biển phụ (biển nhỏ màu trắng ở bên dưới giải thích thêm).\n- **die Geschwindigkeitsbeschränkung:** Giới hạn tốc độ.\n- **das Überholverbot:** Lệnh cấm vượt.`,

  vocab_dashboard: `**Từ vựng về Bảng điều khiển (Armaturenbrett) & Đèn báo:**\n\n- **die Kontrollleuchte:** Đèn cảnh báo trên bảng điều khiển.\n- **der Motoröldruck (Đèn hình can dầu):** Áp suất dầu động cơ (Đỏ: Dừng xe lập tức, tắt máy).\n- **die Kühlmitteltemperatur (Đèn hình nhiệt kế):** Nhiệt độ nước làm mát (Đỏ: Quá nhiệt, cần dừng nghỉ).\n- **die Batterieladung (Đèn hình ắc quy):** Máy phát điện/Ắc quy có vấn đề.\n- **die Motorkontrollleuchte (Đèn hình động cơ màu vàng):** Lỗi hệ thống điều khiển động cơ/khí thải (Cần mang xe ra xưởng kiểm tra sớm).\n- **der Drehzahlmesser:** Đồng hồ đo vòng tua máy.`,

  katalysator: `**Bộ lọc khí thải (Katalysator):**\n\n1. **Chức năng:** Làm giảm lượng chất độc hại trong khí thải trước khi thải ra môi trường.\n2. **Lưu ý bảo vệ:** Katalysator rất dễ bị hỏng nếu có xăng chưa cháy hết lọt vào hệ thống xả.\n3. **Hành động cấm:** Không nên khởi động xe bằng cách đẩy (Anschieben) xe kéo (Anschleppen) liên tục nhiều lần. Tránh để xe chạy cạn kiệt bình xăng hoàn toàn vì xe giật cục có thể làm xăng lọt vào hỏng bộ lọc.`,

  carpooling: `**Đi chung xe (Fahrgemeinschaften):**\n\n1. **Lợi ích môi trường:** Đi chung xe giúp giảm số lượng xe cá nhân tham gia giao thông, từ đó giảm kẹt xe, giảm ô nhiễm tiếng ồn và khí thải (CO2).\n2. **Tiết kiệm:** Giúp chia sẻ chi phí nhiên liệu, phí gửi xe.\n3. Nhấn mạnh trong bài thi lý thuyết: Mọi câu hỏi có đáp án liên quan đến việc "Lập nhóm đi chung xe" hoặc "Sử dụng phương tiện công cộng" đều là những đáp án ĐÚNG.`
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
      text: `Chào ${user?.displayName || 'bạn'}! Mình là Trợ lý học lý thuyết bằng lái xe Đức.\nChọn câu hỏi bên dưới để bắt đầu nhé!`
    }
  ]);
  const [activeCategory, setActiveCategory] = useState(questionCategories[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    const apiKey = user?.apiKey || localStorage.getItem('fuhrerschein_api_key') || '';

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
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden px-4">

      {/* Header section with Clear history option */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="font-extrabold text-[12px] uppercase tracking-wider">Hộp gợi ý & Hỏi đáp</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold"
          title="Xóa lịch sử chat"
        >
          <span>Dọn lịch sử</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 bg-white border border-gray-200 my-2 rounded-xl shadow-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className={`text-[9px] font-sans font-extrabold tracking-wider uppercase ${msg.sender === 'user' ? 'text-right text-gray-400' : 'text-left text-slate-600'
                }`}>
                {msg.sender === 'user' ? 'BẠN' : 'TRỢ LÝ HỌC TẬP'}
              </span>
              <div
                className="p-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-2xs border whitespace-pre-wrap"
                style={msg.sender === 'user'
                  ? { background: '#2b576b', borderColor: '#2b576b', color: '#ffffff' }
                  : { background: '#f8fafc', borderColor: '#f1f5f9', color: '#0f172a' }
                }
              >
                {renderFormattedText(msg.text)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className="text-[9px] font-sans font-extrabold tracking-wider uppercase text-slate-600">
                TRỢ LÝ HỌC TẬP
              </span>
              <div
                className="rounded-2xl p-3 text-xs font-bold border"
                style={{ background: '#f8fafc', borderColor: '#f1f5f9', color: '#64748b' }}
              >
                Trợ lý học tập đang viết giải thích...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controlled Selection Panel */}
      <div
        className="flex flex-col bg-white border border-gray-200 rounded-xl p-3 mb-2 shadow-xs shrink-0"
        style={{ height: '240px', position: 'relative' }}
      >
        {/* Custom Category Dropdown */}
        <div className="mb-3 shrink-0 w-full" style={{ position: 'relative', zIndex: 50 }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-slate-200 text-[#2b576b] py-2.5 px-3.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider focus:outline-none transition-all shadow-xs"
          >
            <span>Chủ đề: {activeCategoryData?.title}</span>
            <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 border border-slate-200 rounded-xl shadow-xl flex flex-col py-1"
              style={{ backgroundColor: '#ffffff', zIndex: 9999, maxHeight: '200px', overflowY: 'auto' }}
            >
              {questionCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setIsDropdownOpen(false);
                  }}
                  style={activeCategory === cat.id ? { backgroundColor: '#2b576b', color: '#ffffff' } : {}}
                  className={`px-3.5 py-2 text-left text-[11px] font-extrabold uppercase tracking-wider transition-colors ${
                    activeCategory !== cat.id 
                      ? 'text-slate-600 hover:bg-slate-50' 
                      : ''
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List of questions in active category */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
          {activeCategoryData?.questions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(q)}
              disabled={isLoading}
              className="w-full text-left p-2.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-55 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
            >
              <span className="leading-relaxed pr-2">{q.label}</span>
              <span className="text-[#2b576b] opacity-60 text-lg leading-none">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controlled Warning Info bar */}
      <div className="text-[9px] font-bold text-gray-400 text-center pb-2 bg-slate-50 shrink-0">
        Chỉ hỗ trợ các câu hỏi chọn lọc.
      </div>

    </div>
  );
};

export default AIChat;

