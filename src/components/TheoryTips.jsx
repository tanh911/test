import React, { useState } from 'react';
import { Lightbulb, Calculator, HelpCircle, Key, Percent, Image as ImageIcon, Eye, ChevronDown } from 'lucide-react';

const tipCategories = [
  {
    id: 'keywords',
    title: 'Từ khóa loại trừ',
    icon: Key,
    description: 'Nhận biết các từ khóa "bẫy" hoặc "chìa khóa" giúp loại trừ đáp án sai hoặc chọn ngay đáp án đúng.',
    tips: [
      {
        term: 'immer (luôn luôn) / nur (chỉ) / stets / ausnahmslos',
        effect: '🚨 Thường là đáp án SAI',
        explanation: 'Luật giao thông Đức rất linh hoạt tùy tình huống. Các đáp án mang tính tuyệt đối như "luôn luôn phải rẽ", "chỉ được phép..." hầu hết là sai.'
      },
      {
        term: 'plötzlich (đột ngột) / ruckartig / schnellstens',
        effect: '🚨 Thường là đáp án SAI',
        explanation: 'Mọi hành vi lái xe đột ngột (phanh gấp, đánh lái gấp) mà không có lý do bất khả kháng đều gây nguy hiểm và là đáp án sai.'
      },
      {
        term: 'abbremsen (giảm tốc) / verzögern / bremsbereit sein',
        effect: '✅ Thường là đáp án ĐÚNG',
        explanation: 'Hành vi lái xe phòng thủ, chủ động giảm tốc độ hoặc chuẩn bị sẵn sàng chân phanh khi thấy tình huống không rõ ràng luôn là đáp án đúng.'
      },
      {
        term: 'weiterfahren (tiếp tục đi) / darauf vertrauen (tin tưởng vào...)',
        effect: '🚨 Thường là đáp án SAI',
        explanation: 'Nhắm mắt đi tiếp hoặc "tin tưởng người khác sẽ nhường đường cho mình" thay vì quan sát phòng thủ là đáp án sai.'
      },
      {
        term: 'hupen (bấm còi) / Lichthupe (nháy pha)',
        effect: '🚨 Hầu hết là đáp án SAI',
        explanation: 'Bấm còi hoặc nháy pha để xin đường, thúc giục người khác, hoặc thể hiện sự bực tức đều sai. Chỉ đúng khi dùng để báo hiệu nguy hiểm sắp xảy ra hoặc báo hiệu xin vượt ngoài đô thị.'
      },
      {
        term: 'anhalten (dừng lại) / warten (chờ đợi) / Vorfahrt gewähren',
        effect: '✅ Thường là đáp án ĐÚNG',
        explanation: 'Khi gặp tình huống giao lộ khuất tầm nhìn, có trẻ em, người già, động vật hoặc khi quyền ưu tiên không rõ ràng, việc dừng lại chờ đợi luôn đúng.'
      },
      {
        term: 'schätzen (ước lượng) / ablenken (xao nhãng)',
        effect: '🚨 Thường là đáp án SAI',
        explanation: 'Việc tự ý "ước lượng" tốc độ xe khác hoặc các hành vi gây mất tập trung (chỉnh radio, điện thoại) luôn bị đánh dấu sai.'
      },
      {
        term: 'beobachten (quan sát) / aufpassen (chú ý) / absichern (bảo vệ)',
        effect: '✅ Thường là đáp án ĐÚNG',
        explanation: 'Các hành động kiểm tra an toàn, quan sát gương chiếu hậu, nhìn qua vai và thực hiện các biện pháp phòng ngừa rủi ro.'
      }
    ]
  },
  {
    id: 'formulas',
    title: 'Công thức tính toán',
    icon: Calculator,
    description: 'Quy tắc tính nhẩm khoảng cách và quãng đường bắt buộc phải học thuộc cho kỳ thi lý thuyết.',
    tips: [
      {
        term: 'Quãng đường phản ứng (Reaktionsweg)',
        formula: '(Vận tốc / 10) x 3',
        example: 'Đi 50 km/h: (50/10) x 3 = 15 mét. Đi 100 km/h: (100/10) x 3 = 30 mét.'
      },
      {
        term: 'Quãng đường phanh thường (Bremsweg)',
        formula: '(Vận tốc / 10) x (Vận tốc / 10)',
        example: 'Đi 50 km/h: (50/10) x (50/10) = 25 mét. Đi 100 km/h: (100/10) x (100/10) = 100 mét (Tốc độ tăng gấp đôi, quãng đường phanh tăng gấp 4!).'
      },
      {
        term: 'Quãng đường phanh khẩn cấp (Gefahrbremsung)',
        formula: '[(Vận tốc / 10) x (Vận tốc / 10)] / 2',
        example: 'Đi 50 km/h: 25 / 2 = 12.5 mét. Đi 100 km/h: 100 / 2 = 50 mét (bằng một nửa quãng đường phanh thường).'
      },
      {
        term: 'Quãng đường dừng xe (Anhalteweg)',
        formula: 'Quãng đường phản ứng + Quãng đường phanh',
        example: 'Đi 50 km/h phanh thường: 15m + 25m = 40 mét. Đi 50 km/h phanh khẩn cấp: 15m + 12.5m = 27.5 mét.'
      },
      {
        term: 'Khoảng cách an toàn ngoài đô thị / cao tốc (Tối thiểu)',
        formula: 'Tốc độ / 2 (Halber Tacho)',
        example: 'Đi 120 km/h: cần giữ khoảng cách tối thiểu 60 mét với xe phía trước (xác định nhanh bằng các cột mốc Leitpfosten cách nhau 50m trên quốc lộ).'
      },
      {
        term: 'Khoảng cách an toàn trong đô thị (Tối thiểu)',
        formula: '15 mét (hoặc tương đương 3 thân xe con)',
        example: 'Áp dụng khi đi với vận tốc thông thường trong thành phố để kịp phản ứng nếu xe trước phanh đột ngột.'
      },
      {
        term: 'Quy tắc 2 giây (Zwei-Sekunden-Abstand)',
        formula: 'Chọn 1 cột mốc cố định, xe trước đi qua, đếm 21, 22 mới tới xe mình',
        example: 'Đây là phương pháp thực tế để giữ khoảng cách an toàn ở mọi dải tốc độ, đặc biệt hiệu quả trên cao tốc Autobahn.'
      }
    ]
  },
  {
    id: 'numbers',
    title: 'Con số giới hạn',
    icon: Percent,
    description: 'Các giới hạn tốc độ, kích thước, khoảng cách chuẩn xác theo luật giao thông đường bộ Đức (StVO).',
    tips: [
      {
        term: 'Độ sâu rãnh lốp tối thiểu (Mindestprofiltiefe)',
        value: '1.6 mm',
        explanation: 'Áp dụng bắt buộc cho tất cả các loại lốp xe cơ giới. Dưới mức này xe bị coi là mất an toàn và bị phạt nặng.'
      },
      {
        term: 'Tốc độ tối đa trong đô thị (Innerorts)',
        value: '50 km/h',
        explanation: 'Áp dụng cho tất cả các phương tiện trừ khi có biển báo giới hạn khác (ví dụ: Zone 30, hoặc 60 km/h).'
      },
      {
        term: 'Tốc độ tối đa ngoài đô thị (Außerorts) cho xe < 3.5t',
        value: '100 km/h',
        explanation: 'Áp dụng cho xe ô tô con (PKW) trên đường quốc lộ (Landstraße) 1 làn mỗi hướng.'
      },
      {
        term: 'Tầm nhìn < 50m do sương mù / mưa tuyết',
        value: 'Tối đa 50 km/h & được bật đèn sương mù sau (Nebelschlussleuchte)',
        explanation: 'Khi tầm nhìn dưới 50m, bắt buộc giảm tốc độ tối đa xuống 50 km/h. Chỉ được bật đèn sương mù sau trong điều kiện này.'
      },
      {
        term: 'Đỗ xe trước/sau vạch ngã tư / giao lộ',
        value: '5 mét (8 mét nếu có làn xe đạp chạy song song)',
        explanation: 'Cấm dừng đỗ xe gần giao lộ để đảm bảo tầm nhìn rẽ cho các phương tiện khác.'
      },
      {
        term: 'Đỗ xe trước/sau cột biển dừng xe buýt (Haltestellenschild)',
        value: '15 mét',
        explanation: 'Cấm đỗ xe trong phạm vi 15m trước và sau biển báo xe buýt để không cản trở xe buýt ra vào bến.'
      },
      {
        term: 'Đỗ xe trước biển báo đường ray xe lửa (Andreaskreuz)',
        value: '5 mét (Trong đô thị) / 50 mét (Ngoài đô thị)',
        explanation: 'Cấm đỗ xe quá gần đường ray tàu hỏa để tránh cản trở tầm nhìn biển báo nguy hiểm.'
      },
      {
        term: 'Định nghĩa Dừng xe (Halten) vs Đỗ xe (Parken)',
        value: 'Dừng dưới 3 phút & không rời xe = Halten',
        explanation: 'Nếu bạn đỗ quá 3 phút HOẶC bạn tắt máy rời khỏi xe (ngay cả dưới 3 phút) thì đều được tính là Đỗ xe (Parken).'
      },
      {
        term: 'Nồng độ cồn cho người thử việc (Probezeit) hoặc dưới 21 tuổi',
        value: 'Giới hạn tuyệt đối 0.0 ‰ (Không cồn)',
        explanation: 'Người đang trong thời gian thử việc 2 năm đầu hoặc dưới 21 tuổi hoàn toàn không được có nồng độ cồn khi lái xe.'
      },
      {
        term: 'Nồng độ cồn tối đa cho người lái xe bình thường',
        value: 'Dưới 0.5 ‰ (Và 0.0 ‰ nếu xảy ra tai nạn hoặc loạng choạng)',
        explanation: 'Từ 0.5 ‰ trở lên bạn sẽ bị phạt hành chính trực tiếp dù lái xe bình thường. Nếu lái xe không an toàn, mức phạt áp dụng từ 0.3 ‰.'
      }
    ]
  },
  {
    id: 'priorities',
    title: 'Quy tắc ưu tiên',
    icon: Lightbulb,
    description: 'Nguyên lý cơ bản giúp bạn giải quyết nhanh gọn các câu hỏi sa hình phức tạp.',
    tips: [
      {
        term: 'Phải trước Trái sau (Rechts vor Links)',
        rule: '👉 Xe đi từ bên phải của bạn luôn đi trước',
        explanation: 'Chỉ áp dụng tại ngã tư không có biển báo ưu tiên, không có đèn tín hiệu và không có cảnh sát điều khiển. Lưu ý: Xe đi ra từ ngõ cụt vẫn áp dụng luật này, nhưng xe đi ra từ đường đất/đồng ruộng/khu đi bộ/lối ra nhà xe thì KHÔNG được ưu tiên.'
      },
      {
        term: 'Quy tắc rẽ trái (Linksabbieger)',
        rule: '👉 Nhường đường cho xe đi ngược chiều đi thẳng hoặc rẽ phải',
        explanation: 'Khi rẽ trái tại ngã tư, bạn luôn phải nhường đường cho các phương tiện đi thẳng hoặc rẽ phải đi ngược chiều với bạn.'
      },
      {
        term: 'Xe ưu tiên khẩn cấp (Blaulicht + Einsatzhorn)',
        rule: '👉 Nhường đường ngay lập tức cho xe đèn chớp xanh + còi hú',
        explanation: 'Cảnh sát, cứu thương, cứu hỏa có quyền ưu tiên tuyệt đối. Trên cao tốc, khi thấy tắc đường phải lập tức tạo làn cứu nạn (Rettungsgasse).'
      },
      {
        term: 'Bùng binh (Kreisverkehr)',
        rule: '👉 Xe trong bùng binh luôn được ưu tiên',
        explanation: 'Xe chuẩn bị vào bùng binh phải nhường đường cho xe đang chạy bên trong. Chỉ bật xi nhan khi THOÁT bùng binh, cấm xi nhan khi đi VÀO.'
      },
      {
        term: 'Thứ tự hiệu lực chỉ dẫn giao thông',
        rule: '👉 Cảnh sát > Đèn tín hiệu > Biển báo > Quy tắc mặc định',
        explanation: 'Nếu ngã tư có cả cảnh sát điều khiển, đèn giao thông và biển báo, hiệu lệnh của Cảnh sát là cao nhất. Đèn giao thông sẽ làm vô hiệu biển báo ưu tiên.'
      },
      {
        term: 'Lập làn cứu nạn trên cao tốc (Rettungsgasse)',
        rule: '👉 Làn ngoài cùng bên trái dạt trái, các làn khác dạt phải',
        explanation: 'Khi giao thông bắt đầu ùn tắc trên Autobahn hoặc quốc lộ nhiều làn, bắt buộc phải tạo khoảng trống ở giữa làn ngoài cùng bên trái và làn bên cạnh.'
      },
      {
        term: 'Chướng ngại vật trên làn đường (Hindernis)',
        rule: '👉 Bên nào có chướng ngại vật thì bên đó phải nhường',
        explanation: 'Nếu làn đường của bạn có xe đỗ, công trình hoặc vật cản, bạn phải nhường đường cho xe đi ngược chiều trước khi lách qua.'
      }
    ]
  },
  {
    id: 'images',
    title: 'Mẹo hình ảnh & Video',
    icon: ImageIcon,
    description: 'Các dấu hiệu nhận biết nhanh trong các câu hỏi có hình ảnh sa hình hoặc video tình huống.',
    tips: [
      {
        term: 'Đường ray xe điện (Straßenbahn)',
        rule: '👉 Nhìn thấy đường ray = Cảnh giác cao độ',
        explanation: 'Trong mọi câu hỏi hình ảnh có đường ray xe điện, xe điện hầu như luôn có quyền ưu tiên (kể cả khi rẽ hay đi thẳng). Hãy luôn quan sát gương chiếu hậu xem có xe điện không.'
      },
      {
        term: 'Biển mũi tên xanh (Grüner Pfeil)',
        effect: '🚨 Cẩn thận bẫy',
        explanation: 'Gặp biển mũi tên xanh bằng tôn cạnh đèn đỏ: Bắt buộc phải DỪNG HẲN 100% tại vạch trước khi rẽ phải. Nếu đáp án nói "Rẽ phải luôn không cần dừng" -> SAI.'
      },
      {
        term: 'Bóng râm trên mặt đường / Rừng cây',
        rule: '👉 Chú ý động vật hoang dã / Đường trơn',
        explanation: 'Các hình ảnh có rừng cây hai bên đường, hoặc có biển báo hươu nai: Đáp án đúng luôn là "Giảm tốc độ", "Sẵn sàng phanh" do động vật có thể lao ra hoặc mặt đường ẩm ướt.'
      },
      {
        term: 'Quả bóng lăn ra đường (Ball rollt auf die Fahrbahn)',
        rule: '👉 Phanh khẩn cấp ngay lập tức',
        explanation: 'Khi thấy quả bóng lăn ra đường trong hình/video, CHẮC CHẮN sẽ có trẻ em chạy theo sau. Đáp án đúng luôn là "Phanh ngay lập tức" (sofort bremsen).'
      },
      {
        term: 'Màu sắc biển báo chỉ đường',
        rule: '👉 Xanh lam = Cao tốc, Vàng = Quốc lộ, Trắng = Trong phố',
        explanation: 'Dựa vào màu sắc biển chỉ đường trong hình, bạn có thể biết mình đang ở loại đường nào để áp dụng đúng luật tốc độ.'
      },
      {
        term: 'Đuôi xe tải / xe buýt nhấp nháy đèn vàng',
        rule: '👉 Không được vượt hoặc vượt cực chậm',
        explanation: 'Nếu xe buýt đang bật đèn Warnblinkanlage (nháy cả 4 xi nhan) tại bến, bạn chỉ được phép đi vượt qua với tốc độ bước bộ (Schrittgeschwindigkeit - 4-7km/h) cho cả 2 chiều đường.'
      }
    ]
  },
  {
    id: 'elderly',
    title: 'Mẹo học vẹt (Dễ nhớ)',
    icon: Eye,
    description: 'Dành riêng cho người lớn tuổi hoặc không rành tiếng Đức. Cứ thấy chữ Đức này là CHỌN hoặc KHÔNG CHỌN!',
    tips: [
      {
        term: 'Thấy chữ: "Bremsbereit sein" (Chuẩn bị phanh)',
        effect: '✅ LUÔN LUÔN CHỌN',
        explanation: 'Từ này nghĩa là lái xe cẩn thận chuẩn bị phanh. Trong mọi tình huống, đây luôn là đáp án được điểm.'
      },
      {
        term: 'Thấy chữ: "Geschwindigkeit verringern" (Giảm tốc độ)',
        effect: '✅ LUÔN LUÔN CHỌN',
        explanation: 'Giảm tốc độ là cách an toàn nhất trong luật Đức. Cứ thấy cụm từ này là đánh dấu chọn ngay.'
      },
      {
        term: 'Thấy chữ: "Sofort bremsen" (Phanh ngay lập tức)',
        effect: '✅ CHỌN NGAY',
        explanation: 'Thường đi kèm với hình ảnh có quả bóng (Ball) lăn ra đường, hoặc có trẻ em đứng mép đường.'
      },
      {
        term: 'Thấy chữ: "Warten" (Chờ đợi) hoặc "Verzichten" (Nhường)',
        effect: '✅ ĐA SỐ LÀ CHỌN',
        explanation: 'Bất cứ khi nào đáp án bảo bạn phải chờ đợi (warten) hoặc nhường đường (auf Vorfahrt verzichten), đó thường là đáp án đúng.'
      },
      {
        term: 'Thấy chữ: "Hupen" (Bấm còi) hoặc "Lichthupe" (Nháy đèn pha)',
        effect: '🚨 TUYỆT ĐỐI KHÔNG CHỌN',
        explanation: 'Bấm còi hoặc nháy pha để xin đường ở Đức là sai luật. Chỉ được bóp còi khi cực kỳ nguy hiểm ngoài khu dân cư.'
      },
      {
        term: 'Thấy chữ: "Zügig weiterfahren" (Cứ thế phóng nhanh qua)',
        effect: '🚨 TUYỆT ĐỐI KHÔNG CHỌN',
        explanation: 'Lái xe mà không thèm quan sát, phóng nhanh qua ngã tư hoặc chỗ nguy hiểm luôn là đáp án làm bạn mất điểm.'
      },
      {
        term: 'Thấy chữ: "Darauf vertrauen..." (Tin tưởng rằng...)',
        effect: '🚨 KHÔNG BAO GIỜ CHỌN',
        explanation: 'Ví dụ "tin tưởng người kia sẽ nhường mình". Lái xe không được tin tưởng ai cả, phải tự quan sát. Đáp án này luôn sai.'
      },
      {
        term: 'Thấy chữ: "Immer" (Luôn luôn) hoặc "Nur" (Chỉ)',
        effect: '🚨 CHÚ Ý, THƯỜNG LÀ SAI',
        explanation: 'Những câu khẳng định quá chắc nịch như "luôn luôn phải rẽ" hay "chỉ được phép đi thẳng" hầu hết đều là đáp án lừa.'
      }
    ]
  }
];

export const TheoryTips = () => {
  const [activeTab, setActiveTab] = useState('keywords');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeCategory = tipCategories.find(c => c.id === activeTab);
  const IconComponent = activeCategory.icon;

  // Map categories to specific accent colors for premium styling
  const accentColors = {
    keywords: { primary: '#0d9488', bgLight: '#f0fdfa', border: '#ccfbf1', text: '#115e59' },
    formulas: { primary: '#3b82f6', bgLight: '#eff6ff', border: '#dbeafe', text: '#1e40af' },
    numbers: { primary: '#8b5cf6', bgLight: '#f5f3ff', border: '#ede9fe', text: '#5b21b6' },
    priorities: { primary: '#f59e0b', bgLight: '#fffbeb', border: '#fef3c7', text: '#92400e' },
    images: { primary: '#ec4899', bgLight: '#fdf2f8', border: '#fce7f3', text: '#9d174d' },
    elderly: { primary: '#ef4444', bgLight: '#fef2f2', border: '#fee2e2', text: '#991b1b' }
  };

  const colors = accentColors[activeTab] || accentColors.keywords;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Header Info */}
      <div 
        className="p-4 border-b shrink-0 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${colors.bgLight} 0%, #ffffff 100%)`,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1 rounded bg-white shadow-sm" style={{ color: colors.primary }}>
            <IconComponent size={14} />
          </div>
          <span className="text-[10px] font-extrabold tracking-widest uppercase font-mono" style={{ color: colors.primary }}>
            Mẹo ghi nhớ nhanh
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Tổng hợp công thức tính nhẩm, quy tắc ưu tiên và từ khóa bẫy giúp bạn học lý thuyết tiếng Đức Klasse B dễ dàng và chính xác nhất.
        </p>
      </div>

      <div className="flex flex-col p-4 flex-1 overflow-hidden">
        {/* Category Selector Dropdown */}
        <div className="relative mb-3 shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-white rounded-xl border flex items-center justify-between transition-all duration-200 hover:border-slate-400 shadow-sm"
            style={{ borderColor: '#cbd5e1' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded bg-slate-50 flex items-center justify-center border border-slate-100" style={{ color: colors.primary }}>
                <IconComponent size={16} />
              </div>
              <span className="font-bold text-sm text-slate-800">{activeCategory.title}</span>
            </div>
            <ChevronDown size={18} className="text-slate-400 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 max-h-[280px] overflow-y-auto">
                {tipCategories.map((cat) => {
                  const CatIcon = cat.icon;
                  const isActive = activeTab === cat.id;
                  const catColor = accentColors[cat.id];
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveTab(cat.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 transition-colors duration-150 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                      style={isActive ? { backgroundColor: catColor.bgLight } : {}}
                    >
                      <div className="p-1 rounded bg-white shadow-sm flex items-center justify-center border border-slate-100" style={{ color: catColor.primary }}>
                        <CatIcon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-800" style={isActive ? { color: catColor.primary } : {}}>{cat.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">{cat.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected Category Description */}
        <div 
          className="p-3 rounded-lg border mb-3 shrink-0 transition-all duration-300"
          style={{
            background: colors.bgLight,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <p className="text-[13px] md:text-[14px] leading-relaxed font-medium">{activeCategory.description}</p>
        </div>

        {/* Tips Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
          {activeCategory.tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
            >
              {/* Term Label */}
              <div className="font-bold text-[14px] md:text-[15px] text-slate-800 mb-1.5 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colors.primary }}></span>
                <span className="leading-snug">{tip.term}</span>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tip.effect && (
                  <div 
                    className="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                    style={{ 
                      color: tip.effect.includes('SAI') ? '#ef4444' : '#10b981', 
                      backgroundColor: tip.effect.includes('SAI') ? '#fef2f2' : '#ecfdf5'
                    }}
                  >
                    {tip.effect}
                  </div>
                )}

                {tip.formula && (
                  <div className="text-[10px] md:text-[11px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">
                    Công thức: <span className="text-blue-600 font-extrabold">{tip.formula}</span>
                  </div>
                )}

                {tip.value && (
                  <div className="text-[10px] md:text-[11px] font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    Giá trị: <span className="text-violet-700 font-extrabold">{tip.value}</span>
                  </div>
                )}

                {tip.rule && (
                  <div className="text-[10px] md:text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {tip.rule}
                  </div>
                )}
              </div>

              {/* Explanation / Example Box */}
              <div 
                className="text-[13px] md:text-[14px] leading-relaxed font-medium mt-1 text-slate-600"
                style={{
                  borderLeft: `2.5px solid ${colors.primary}`,
                  paddingLeft: '8px',
                  marginLeft: '2px'
                }}
              >
                {tip.explanation || tip.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
