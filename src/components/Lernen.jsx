import React, { useState, useEffect, useRef } from 'react';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import {
  Info, X, Check, Star, Sparkles, Send, Volume2, ChevronLeft, ChevronRight, SkipBack, SkipForward, FastForward, Rewind
} from 'lucide-react';

export const Lernen = ({ user, onUpdateUser, onTriggerLogin, onNavigate, languageMode = 'both' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Hàm trích xuất ID gốc
  const getBaseId = (qId) => {
    if (typeof qId === 'string' && qId.includes('_')) {
      return parseInt(qId.split('_')[0], 10);
    }
    return parseInt(qId, 10);
  };

  // Tạo danh sách 30 câu hỏi cân bằng tỉ lệ chủ đề khi mở trang học tập
  const [filteredQuestions] = useState(() => {
    const getQuestionTheme = (q) => {
      if ([2, 3, 9, 10].includes(q.id)) return 1; // Verkehrsvorschriften
      if ([11, 12].includes(q.id)) return 2;      // Gefahrenlehre
      if ([7, 14].includes(q.id)) return 3;       // Verhalten im Straßenverkehr
      if ([1, 4, 5, 6, 8].includes(q.id)) return 4; // Vorfahrt & Giao lộ
      if ([13].includes(q.id)) return 5;          // Technik & Umwelt
      if ([15].includes(q.id)) return 6;          // Zusatzstoff
      return 1;
    };

    // Phân nhóm câu hỏi
    const pools = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    questions.forEach(q => {
      const theme = getQuestionTheme(q);
      pools[theme].push(q);
    });

    // Chỉ số lượng mục tiêu cho từng nhóm (tổng = 30 câu)
    const targets = {
      1: 12, // ~40% (Verkehrsvorschriften)
      2: 6,  // ~20% (Gefahrenlehre)
      3: 5,  // ~17% (Verhalten im Straßenverkehr)
      4: 3,  // ~10% (Vorfahrt & Giao lộ)
      5: 3,  // ~10% (Technik & Umwelt)
      6: 1   // ~3% (Zusatzstoff)
    };

    let selected = [];
    Object.keys(targets).forEach(themeId => {
      const pool = pools[themeId];
      const targetCount = targets[themeId];
      if (pool && pool.length > 0) {
        // Trộn ngẫu nhiên câu hỏi gốc của nhóm đó
        const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
        for (let i = 0; i < targetCount; i++) {
          const baseQuestion = shuffledPool[i % shuffledPool.length];
          selected.push({
            ...baseQuestion,
            id: `${baseQuestion.id}_${themeId}_${i}` // ID duy nhất để phân biệt tiến trình
          });
        }
      }
    });

    // Trộn ngẫu nhiên danh sách cuối cùng
    return selected.sort(() => 0.5 - Math.random());
  });

  const currentQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  useEffect(() => {
    setSelectedOptions([]);
    setIsSubmitted(false);
    setIsCorrect(false);
    setIsAiOpen(false);
  }, [currentIndex]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiOpen]);

  const handleOptionClick = (optionId) => {
    if (isSubmitted) return;
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) return prev.filter(id => id !== optionId);
      return [...prev, optionId];
    });
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;
    const correctAnswers = currentQuestion.options.filter(opt => opt.isCorrect).map(opt => opt.id);
    const correctMatch = selectedOptions.length === correctAnswers.length && selectedOptions.every(val => correctAnswers.includes(val));
    setIsCorrect(correctMatch);
    setIsSubmitted(true);
  };

  const currentBaseId = getBaseId(currentQuestion.id);
  const isBookmarked = user.savedQuestions.includes(currentBaseId);
  const handleBookmarkToggle = () => {
    let savedQuestions = [...user.savedQuestions];
    if (isBookmarked) {
      savedQuestions = savedQuestions.filter(id => id !== currentBaseId);
    } else {
      savedQuestions.push(currentBaseId);
    }
    onUpdateUser({ ...user, savedQuestions });
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // AI chat logic
  const handleOpenAi = () => {
    if (user.isGuest) {
      if (onTriggerLogin) onTriggerLogin();
      return;
    }
    setIsAiOpen(true);
    if (aiMessages.length === 0 || aiMessages[0].questionId !== currentQuestion.id) {
      setAiMessages([{ sender: 'ai', text: currentQuestion.aiExplanation, questionId: currentQuestion.id }]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMsg = { sender: 'user', text: userInput };
    setAiMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsAiLoading(true);

    const apiKey = user.apiKey || localStorage.getItem('fuhrerschein_api_key') || '';
    if (apiKey) {
      try {
        const prompt = `Câu hỏi: ${currentQuestion.textDe}\nHỏi: ${userInput}\nTrả lời ngắn gọn bằng tiếng Việt.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lỗi API.';
        setAiMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
      } catch (err) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: 'Lỗi mạng.' }]);
      } finally { setIsAiLoading(false); }
    } else {
      setTimeout(() => {
        setAiMessages(prev => [...prev, { sender: 'ai', text: 'Vui lòng nhập API Key để chat!' }]);
        setIsAiLoading(false);
      }, 500);
    }
  };

  // Colors based on the screenshot
  const theme = {
    topBar: '#388b56',
    bg: '#dfeecf',
    textDark: '#0a4c2f',
    btnRed: '#e50000',
    btnYellow: '#ffca28',
    btnGreen: '#00995e',
    checkboxBorder: '#000000',
  };

  const t = {
    punkte: languageMode === 'de' ? 'Punkte' : (languageMode === 'vi' ? 'Điểm' : 'Punkte / Điểm'),
    abbrechen: languageMode === 'de' ? 'Abbrechen' : (languageMode === 'vi' ? 'Hủy bỏ' : 'Abbrechen / Hủy'),
    aufloesung: languageMode === 'de' ? 'Auflösung' : (languageMode === 'vi' ? 'Đáp án' : 'Auflösung / Đáp án'),
    fragen: languageMode === 'de' ? 'Fragen' : (languageMode === 'vi' ? 'Câu hỏi' : 'Fragen / Câu hỏi'),
    aiExplanation: languageMode === 'de' ? 'Erklärung' : (languageMode === 'vi' ? 'Giải thích tại sao' : 'Giải thích / Erklärung'),
    askMore: languageMode === 'de' ? 'Mehr dazu fragen...' : (languageMode === 'vi' ? 'Hỏi thêm về câu này...' : 'Hỏi thêm / Fragen...'),
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: theme.bg, fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Top Header */}
      <div className="flex items-center justify-between px-3 text-white z-10 flex-shrink-0" style={{ backgroundColor: theme.topBar, height: '48px' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center">
            <span className="font-serif font-bold text-xs">i</span>
          </div>
          <span className="font-bold text-sm tracking-wide">1.1.02-{121 + currentIndex}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">{t.punkte}: {currentQuestion.points}</span>
          <button onClick={() => onNavigate('/training')} className="hover:opacity-80">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="w-full px-4 py-4 flex flex-col flex-1">

          {/* Question Text */}
          <div className="mb-6 text-left w-full">
            {(languageMode === 'de' || languageMode === 'both') && (
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: theme.textDark }}>
                {currentQuestion.textDe}
              </h2>
            )}
            {(languageMode === 'vi' || languageMode === 'both') && (
              <p style={{ fontSize: '15px', fontWeight: 700, color: theme.textDark, opacity: 0.85, marginTop: (languageMode === 'both') ? '4px' : '0px' }}>
                {currentQuestion.textVi}
              </p>
            )}
          </div>

          {/* Content Area: Image + Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start', width: '100%' }}>

            {/* Left: Image / Media */}
            <div style={{ width: '48%', flexShrink: 0 }}>
              {currentQuestion.image ? (
                <img src={currentQuestion.image} alt="Question" style={{ width: '100%', height: 'auto', border: '1px solid black' }} />
              ) : currentQuestion.imageType ? (
                <div style={{ width: '100%', aspectRatio: '1.6', border: '1px solid black', position: 'relative', overflow: 'hidden' }}>
                  <SVGGraphics type={currentQuestion.imageType} className="w-full h-full" />
                </div>
              ) : (
                /* Khung trong suốt để cố định layout UI */
                <div style={{ width: '100%', aspectRatio: '1.6', border: '1px solid transparent', backgroundColor: 'transparent' }} />
              )}
            </div>

            {/* Right: Checkboxes */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {currentQuestion.options.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const hasMistake = isSubmitted && (
                  (option.isCorrect && !isSelected) ||
                  (!option.isCorrect && isSelected)
                );

                // Hộp chính (Primary checkbox)
                let boxBg = isSelected ? "black" : "white";
                let tickColor = "white";
                let showTick = isSelected;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: '20px',
                      cursor: isSubmitted ? 'default' : 'pointer'
                    }}
                  >
                    {/* Hộp checkbox và thanh đỏ chỉ thị sai */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                      {/* Vạch đỏ chỉ thị lỗi sai */}
                      {hasMistake ? (
                        <div style={{
                          width: '4px',
                          height: '42px',
                          backgroundColor: '#e50000',
                          marginRight: '8px',
                          borderRadius: '2px'
                        }} />
                      ) : (
                        <div style={{ width: '4px', marginRight: '8px' }} />
                      )}

                      {/* Checkbox chính & ô xanh lá chỉ thị đáp án đúng phía dưới */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            border: '1px solid ' + theme.checkboxBorder,
                            backgroundColor: boxBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {showTick && (
                            <Check size={32} strokeWidth={3} color={tickColor} />
                          )}
                        </div>

                        {/* Ô nhỏ màu xanh lá chỉ thị đây là đáp án đúng (sau khi nộp bài) */}
                        {isSubmitted && option.isCorrect && (
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: '#00995e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '2px'
                            }}
                          >
                            <Check size={14} strokeWidth={4.5} color="white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nội dung chữ của phương án */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '4px' }}>
                      {(languageMode === 'de' || languageMode === 'both') && (
                        <span style={{ fontSize: '18px', fontWeight: 700, color: theme.textDark, lineHeight: '1.3' }}>
                          {option.textDe}
                        </span>
                      )}
                      {(languageMode === 'vi' || languageMode === 'both') && option.textVi && (
                        <span style={{ fontSize: '15px', fontWeight: 650, color: '#4b5563', fontStyle: 'italic', marginTop: (languageMode === 'both') ? '6px' : '0px' }}>
                          {option.textVi}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spacing for bottom */}
          <div className="mt-auto pt-10" />

          {/* Action Buttons (Right aligned above bottom bar) */}
          <div className="flex justify-end gap-2 mb-2 pr-2">
            <button
              onClick={() => onNavigate('/training')}
              className="px-4 h-[31px] text-[14px] flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.btnRed }}
            >
              {t.abbrechen}
            </button>

            <button
              onClick={handleBookmarkToggle}
              className="w-10 h-[31px] flex items-center justify-center hover:opacity-90"
              style={{ backgroundColor: theme.btnYellow }}
            >
              <Star size={18} fill={isBookmarked ? "black" : "transparent"} color="black" strokeWidth={isBookmarked ? 1 : 2} />
            </button>

            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                className="px-4 h-[31px] text-[14px] flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.btnGreen }}
              >
                Auflösung
              </button>
            ) : (
              <button
                onClick={handleOpenAi}
                className="px-4 py-1.5 font-bold text-white shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 rounded-sm"
                style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)' }}
              >
                {t.aiExplanation}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', width: '100%' }}>
        {/* Tab Label */}
        <div style={{ alignSelf: 'flex-start', padding: '6px 24px', fontSize: '15px', fontWeight: 'bold', color: 'white', backgroundColor: theme.topBar, borderTopLeftRadius: '4px', borderTopRightRadius: '4px', marginLeft: '12px' }}>
          30 {t.fragen}
        </div>

        {/* Bar Content */}
        <div className="flex flex-row items-center justify-between" style={{ backgroundColor: theme.topBar, padding: '10px 12px' }}>

          {/* Left Controls */}
          <div className="flex flex-row items-center gap-[6px]">
            <button
              onClick={() => setCurrentIndex(0)}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12">
                <rect x="0" y="1" width="2" height="10" fill="black" />
                <path d="M12 1 L4 6 L12 11 Z" fill="black" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 10))}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="18" height="14" viewBox="0 0 16 12">
                <path d="M8 1 L0 6 L8 11 Z M16 1 L8 6 L16 11 Z" fill="black" />
              </svg>
            </button>
            <button
              onClick={handlePrev}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="12" height="14" viewBox="0 0 10 12">
                <path d="M10 1 L1 6 L10 11 Z" fill="black" />
              </svg>
            </button>
          </div>

          {/* Numbers (desktop) */}
          <div className="flex flex-row items-center gap-[6px] flex-1 justify-center px-4 overflow-hidden">
            {Array.from({ length: Math.min(10, filteredQuestions.length) }).map((_, i) => {
              // Just show a window of 10 pages around the current index
              let pageNum = i + 1;
              if (currentIndex > 5) pageNum = currentIndex - 4 + i;
              if (pageNum > filteredQuestions.length) return null;

              const questionAtPage = filteredQuestions[pageNum - 1];
              const pageBaseId = questionAtPage ? getBaseId(questionAtPage.id) : null;
              const isPageBookmarked = pageBaseId && user.savedQuestions.includes(pageBaseId);
              const hasVideo = pageBaseId ? [3, 5, 6, 8].includes(pageBaseId) : false;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentIndex(pageNum - 1)}
                  className="flex items-center justify-center font-bold relative hover:bg-gray-100"
                  style={{
                    width: '54px',
                    height: '38px',
                    minWidth: '54px',
                    backgroundColor: currentIndex === pageNum - 1 ? '#ffffff' : '#ffffff',
                    color: 'black',
                    border: currentIndex === pageNum - 1 ? '3px solid black' : '1px solid black',
                    fontSize: '16px',
                  }}
                >
                  {/* Bookmark Indicator (top-right triangle) */}
                  {isPageBookmarked && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 8px 8px 0',
                      borderColor: 'transparent black transparent transparent'
                    }} />
                  )}

                  {/* Video Indicator (top-left play triangle) */}
                  {hasVideo && (
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: '3px',
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '4px 0 4px 6px',
                      borderColor: 'transparent transparent transparent black'
                    }} />
                  )}

                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex flex-row items-center gap-[6px]">
            <button
              onClick={handleNext}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="12" height="14" viewBox="0 0 10 12">
                <path d="M0 1 L9 6 L0 11 Z" fill="black" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(filteredQuestions.length - 1, currentIndex + 10))}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="18" height="14" viewBox="0 0 16 12">
                <path d="M0 1 L8 6 L0 11 Z M8 1 L16 6 L8 11 Z" fill="black" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(filteredQuestions.length - 1)}
              className="bg-white flex items-center justify-center hover:bg-gray-100"
              style={{ border: '1px solid black', width: '54px', height: '38px', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12">
                <path d="M0 1 L8 6 L0 11 Z" fill="black" />
                <rect x="10" y="1" width="2" height="10" fill="black" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Drawer Overlay */}
      {isAiOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '600px', height: '75vh', maxHeight: '600px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6', background: 'linear-gradient(135deg, #1a4a5e, #2b6f8a)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                <Sparkles size={20} color="#fde047" />
                <h3 style={{ fontWeight: 'bold', margin: 0 }}>Bạn Đồng Hành (Gemini)</h3>
              </div>
              <button onClick={() => setIsAiOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiMessages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px',
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.sender === 'user' ? '0px' : '16px',
                    borderBottomLeftRadius: msg.sender === 'ai' ? '0px' : '16px',
                    backgroundColor: msg.sender === 'user' ? '#2b6f8a' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#1f2937',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    border: msg.sender === 'ai' ? '1px solid #f3f4f6' : 'none'
                  }}>
                    {msg.sender === 'ai' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Sparkles size={14} color="#a855f7" />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Bạn Đồng Hành</span>
                      </div>
                    )}
                    <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', padding: '12px', borderRadius: '16px', borderBottomLeftRadius: '0px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#c084fc', borderRadius: '50%', animation: 'bounce 1s infinite' }}></span>
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#c084fc', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: '0.2s' }}></span>
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#c084fc', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '8px' }}>
              <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Hỏi thêm về câu này..." disabled={isAiLoading} style={{ flex: 1, padding: '8px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '9999px', fontSize: '14px', outline: 'none' }} />
              <button type="submit" disabled={isAiLoading || !userInput.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2b6f8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: (isAiLoading || !userInput.trim()) ? 'default' : 'pointer', opacity: (isAiLoading || !userInput.trim()) ? 0.5 : 1 }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
