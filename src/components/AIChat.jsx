import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';

export const AIChat = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Xin chào ${user.displayName || 'bạn'}! Tôi là Gia sư AI chuyên về lý thuyết lái xe Đức. 🚗\n\nBạn có thể hỏi tôi bất cứ điều gì về luật giao thông đường bộ Đức (StVO), giải nghĩa các biển báo khó, công thức tính toán khoảng cách an toàn (Bremsweg, Anhalteweg) hay dịch nghĩa các từ vựng tiếng Đức chuyên ngành.\n\n*Nếu bạn có Gemini API Key cá nhân, hãy nhập trong mục Cài đặt để có trải nghiệm hỏi đáp thời gian thực không giới hạn!*`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: 'Quy tắc Rechts vor Links', text: 'Giải thích quy tắc Rechts vor Links áp dụng thế nào ở Đức?' },
    { label: 'Công thức Bremsweg', text: 'Hãy giải thích công thức tính quãng đường phanh (Bremsweg, Reaktionsweg, Anhalteweg)' },
    { label: 'Probezeit là gì?', text: 'Thời gian thử thách Probezeit kéo dài bao lâu và có quy định gì đặc biệt?' },
    { label: 'Từ vựng Vorfahrt', text: 'Tổng hợp từ vựng tiếng Đức quan trọng nhất về chủ đề Quyền ưu tiên (Vorfahrt)' }
  ];

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const promptText = textToSend || input;
    if (!promptText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: promptText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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
          text: 'Lỗi kết nối API. Vui lòng kiểm tra lại cấu hình API Key trong cài đặt!' 
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mock Responses
      setTimeout(() => {
        let responseText = '';
        const lowered = promptText.toLowerCase();

        if (lowered.includes('rechts vor links')) {
          responseText = `**Quy tắc Rechts vor Links (Bên phải trước bên trái - StVO § 8):**\n\n1. **Nguyên tắc cơ bản**: Tại ngã tư hoặc ngã ba không có biển báo ưu tiên và không có đèn giao thông, phương tiện đi từ bên phải tới luôn có quyền ưu tiên đi trước.\n2. **Ngoại lệ**: Quy tắc này không áp dụng khi xe đi ra từ khu vực đỗ xe, đường đất, hoặc ngõ đi riêng của các hộ gia dịch (Grundstücksausfahrt). Lúc đó, xe đi ra luôn phải nhường đường.\n3. **Mẹo thi cử**: Trong bài thi thực hành, lỗi không nhường đường cho xe từ bên phải tới là lỗi trượt trực tiếp (sofortiges Nichtbestehen).`;
        } else if (lowered.includes('bremsweg') || lowered.includes('quãng đường phanh') || lowered.includes('công thức')) {
          responseText = `**Các công thức tính quãng đường (Faustformeln):**\n\n1. **Quãng đường phản ứng (Reaktionsweg)**: Quãng đường xe chạy từ khi nhận biết chướng ngại vật đến khi đạp phanh (khoảng 1 giây).\n   - Công thức: \`(Tốc độ / 10) x 3\`\n   - Ví dụ (ở 100 km/h): \`10 x 3 = 30 mét\`\n\n2. **Quãng đường phanh thông thường (Bremsweg)**: Từ khi đạp phanh đến khi xe dừng hẳn.\n   - Công thức: \`(Tốc độ / 10) x (Tốc độ / 10)\`\n   - Ví dụ (ở 100 km/h): \`10 x 10 = 100 mét\`\n\n3. **Quãng đường phanh khẩn cấp (Gefahrbremsung)**:\n   - Công thức: \`[(Tốc độ / 10) x (Tốc độ / 10)] / 2\` (Giảm một nửa so với phanh thường do phanh gấp lực tối đa).\n\n4. **Tổng quãng đường dừng xe (Anhalteweg)**:\n   - Công thức: \`Reaktionsweg + Bremsweg\``;
        } else if (lowered.includes('probezeit') || lowered.includes('thử thách')) {
          responseText = `**Thời gian thử thách (Probezeit) tại Đức:**\n\n1. **Thời gian**: Kéo dài **2 năm** kể từ ngày nhận bằng lái chính thức lần đầu tiên.\n2. **Vi phạm nồng độ cồn**: Cấm tuyệt đối **0,0 Promille** cho tài xế dưới 21 tuổi và toàn bộ tài xế trong Probezeit.\n3. **Phân loại vi phạm**:\n   - **Lỗi nặng nhóm A (A-Verstoß)**: Chạy quá tốc độ >20km/h, vượt đèn đỏ, không nhường đường ưu tiên, sử dụng điện thoại khi lái xe...\n   - **Lỗi nhẹ nhóm B (B-Verstoß)**: Lốp mòn quá mức quy định, chở đồ cồng kềnh mất an toàn...\n4. **Hậu quả**: Nếu phạm 1 lỗi nhóm A hoặc 2 lỗi nhóm B:\n   - Thời gian thử thách tăng từ **2 năm lên thành 4 năm**.\n   - Phải tham gia khóa tập huấn bắt buộc **Aufbauseminar (ASF)** với chi phí tự túc (300-500 Euro).`;
        } else if (lowered.includes('từ vựng') || lowered.includes('chủ đề')) {
          responseText = `**Tổng hợp từ vựng quan trọng về Quyền ưu tiên (Vorfahrt):**\n\n- **die Vorfahrt**: Quyền ưu tiên đi trước\n- **Vorfahrt gewähren**: Nhường đường\n- **die Kreuzung**: Ngã tư, giao lộ\n- **die Einmündung**: Ngả rẽ nhập làn\n- **die Vorfahrtsstraße**: Đường ưu tiên\n- **Rechts vor Links**: Bên phải trước bên trái\n- **anhalten**: Dừng lại\n- **die Haltlinie**: Vạch dừng hẳn\n- **die Sichtlinie**: Vạch tầm nhìn\n- **abknickende Vorfahrtsstraße**: Đường ưu tiên rẽ cong (có sơ đồ phụ đi kèm)\n- **der Querverkehr**: Phương tiện đi cắt ngang\n- **der Gegenverkehr**: Phương tiện đi ngược chiều`;
        } else {
          responseText = `Cảm ơn câu hỏi của bạn. Để nhận được giải đáp chính xác và chi tiết cho câu hỏi "${promptText}", bạn vui lòng thêm **Gemini API Key** trong phần Cài đặt nhé!\n\nGemini API Key có thể đăng ký hoàn toàn miễn phí từ trang chủ Google AI Studio.`;
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: responseText }]);
        setIsLoading(false);
      }, 700);
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

  return (
    <div className="flex flex-col h-[76vh] bg-[#F3F4F6] overflow-hidden px-4">
      
      {/* Quick Prompts Carousel */}
      <div className="flex gap-2 overflow-x-auto py-2.5 no-scrollbar shrink-0">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.text)}
            className="px-3.5 py-2 bg-white hover:bg-green-50 text-[#15803D] font-extrabold text-[10px] uppercase tracking-wider rounded-lg border-2 border-gray-200 whitespace-nowrap transition-colors shadow-xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white border-2 border-gray-200 my-2 no-scrollbar rounded-xl shadow-sm">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className={`text-[9px] font-sans font-extrabold tracking-wider uppercase ${
                msg.sender === 'user' ? 'text-right text-gray-500' : 'text-left text-[#15803D]'
              }`}>
                {msg.sender === 'user' ? 'BẠN' : 'GIA SƯ AI'}
              </span>
              <div className={`p-3.5 rounded-2xl text-[14px] font-bold leading-relaxed border-2 ${
                msg.sender === 'user' 
                  ? 'bg-gray-100 border-gray-200 text-gray-900' 
                  : 'bg-green-50 border-green-100 text-gray-900'
              } whitespace-pre-wrap`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-col max-w-[85%] space-y-1">
              <span className="text-[9px] font-sans font-extrabold tracking-wider uppercase text-[#15803D]">
                GIA SƯ AI
              </span>
              <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-3.5 text-xs font-bold text-green-700">
                Gia sư AI đang viết giải thích...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls & Clear history */}
      <div className="flex gap-2 py-3 bg-[#F3F4F6] border-t-2 border-gray-200 shrink-0 items-center">
        <button
          onClick={handleClear}
          className="p-3.5 bg-white border-2 border-gray-200 hover:border-red-500 hover:text-red-500 text-gray-500 rounded-xl transition-colors"
          title="Xóa lịch sử chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex-1 flex gap-2">
          <input 
            type="text" 
            placeholder="Hỏi về biển báo, luật, từ vựng..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 focus:border-[#15803D] focus:outline-none text-sm text-gray-900 font-bold rounded-xl"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 bg-[#15803D] hover:bg-[#166534] text-white font-extrabold text-xs uppercase tracking-widest disabled:opacity-40 transition-colors flex items-center justify-center gap-1 rounded-xl shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
export default AIChat;
