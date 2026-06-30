import React, { useState } from 'react';
import { Lightbulb, Calculator, HelpCircle, Key, Percent } from 'lucide-react';

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
  }
];

export const TheoryTips = () => {
  const [activeTab, setActiveTab] = useState('keywords');

  const activeCategory = tipCategories.find(c => c.id === activeTab);
  const IconComponent = activeCategory.icon;

  // Map categories to specific accent colors for premium styling
  const accentColors = {
    keywords: { primary: '#0d9488', bgLight: '#f0fdfa', border: '#ccfbf1', text: '#115e59' },
    formulas: { primary: '#3b82f6', bgLight: '#eff6ff', border: '#dbeafe', text: '#1e40af' },
    numbers: { primary: '#8b5cf6', bgLight: '#f5f3ff', border: '#ede9fe', text: '#5b21b6' },
    priorities: { primary: '#f59e0b', bgLight: '#fffbeb', border: '#fef3c7', text: '#92400e' }
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
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 shrink-0 border-b border-slate-100 pb-3 mb-3">
          {tipCategories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeTab === cat.id;
            const catColor = accentColors[cat.id];
            
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="px-2 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 text-center flex items-center justify-center gap-1.5 border"
                style={isActive
                  ? { 
                      background: `linear-gradient(135deg, ${catColor.primary} 0%, ${catColor.text} 100%)`, 
                      color: '#ffffff', 
                      borderColor: 'transparent',
                      transform: 'translateY(-1px)', 
                      boxShadow: `0 3px 8px -2px ${catColor.primary}40` 
                    }
                  : { 
                      background: '#ffffff', 
                      color: '#64748b', 
                      borderColor: '#e2e8f0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }
                }
              >
                <CatIcon size={12} style={{ opacity: isActive ? 1 : 0.7 }} />
                {cat.title}
              </button>
            );
          })}
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
          <p className="text-[11px] leading-relaxed font-medium">{activeCategory.description}</p>
        </div>

        {/* Tips Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
          {activeCategory.tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
            >
              {/* Term Label */}
              <div className="font-bold text-[12px] text-slate-800 mb-1.5 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colors.primary }}></span>
                <span className="leading-snug">{tip.term}</span>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tip.effect && (
                  <div 
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                    style={{ 
                      color: tip.effect.includes('SAI') ? '#ef4444' : '#10b981', 
                      backgroundColor: tip.effect.includes('SAI') ? '#fef2f2' : '#ecfdf5'
                    }}
                  >
                    {tip.effect}
                  </div>
                )}

                {tip.formula && (
                  <div className="text-[9px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">
                    Công thức: <span className="text-blue-600 font-extrabold">{tip.formula}</span>
                  </div>
                )}

                {tip.value && (
                  <div className="text-[9px] font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                    Giá trị: <span className="text-violet-700 font-extrabold">{tip.value}</span>
                  </div>
                )}

                {tip.rule && (
                  <div className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {tip.rule}
                  </div>
                )}
              </div>

              {/* Explanation / Example Box */}
              <div 
                className="text-[11px] leading-relaxed font-medium mt-1 text-slate-600"
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
