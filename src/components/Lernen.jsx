import React, { useState, useEffect, useRef } from 'react';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import {
  Info, X, Check, Star, Sparkles, Volume2, ChevronLeft, ChevronRight, SkipBack, SkipForward, FastForward, Rewind
} from 'lucide-react';

export const Lernen = ({ user, onUpdateUser, onTriggerLogin, onNavigate, languageMode = 'both' }) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedSession = sessionStorage.getItem('fuhrerschein_learning_session_v2');
    if (savedSession) {
      try { return JSON.parse(savedSession).currentIndex || 0; } catch (e) { }
    }
    return 0;
  });

  const [sessionResults, setSessionResults] = useState(() => {
    const savedSession = sessionStorage.getItem('fuhrerschein_learning_session_v2');
    if (savedSession) {
      try { return JSON.parse(savedSession).results || {}; } catch (e) { }
    }
    return {};
  });

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [videoPlayCount, setVideoPlayCount] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);

  // Hàm trích xuất ID gốc
  const getBaseId = (qId) => {
    if (typeof qId === 'string' && qId.includes('_')) {
      return qId.split('_')[0];
    }
    return qId;
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    // Remove all emojis / icons
    let cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '');

    const lines = cleanText.split('\n');
    return lines.map((line, lineIdx) => {
      // Split each line by bold markers **
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

  // Tạo danh sách 30 câu hỏi cân bằng tỉ lệ chủ đề khi mở trang học tập
  const [filteredQuestions] = useState(() => {
    const savedSession = sessionStorage.getItem('fuhrerschein_learning_session_v2');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.questions && parsed.questions.length > 0) {
          return parsed.questions;
        }
      } catch (e) { }
    }

    // Chọn ngẫu nhiên 30 câu từ toàn bộ kho (1851 câu)
    const shuffledPool = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, 30).map((q, i) => ({
      ...q,
      id: `${q.id}_rnd_${i}` // ID duy nhất để phân biệt tiến trình
    }));

    return selected;
  });

  // Save session whenever it changes
  useEffect(() => {
    sessionStorage.setItem('fuhrerschein_learning_session_v2', JSON.stringify({
      questions: filteredQuestions,
      currentIndex: currentIndex,
      results: sessionResults
    }));
  }, [currentIndex, filteredQuestions, sessionResults]);

  const currentQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  useEffect(() => {
    setSelectedOptions([]);
    setIsSubmitted(false);
    setIsCorrect(false);
    setIsAiOpen(false);

    const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];
    if (currentQ && currentQ.video) {
      setShowQuestion(false);
      setVideoPlayCount(0);
      setHasPlayedOnce(false);
    } else {
      setShowQuestion(true);
    }
  }, [currentIndex, filteredQuestions]);

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

    setSessionResults(prev => ({
      ...prev,
      [currentIndex]: correctMatch
    }));

    const updatedProgress = { ...(user.progress || {}) };
    updatedProgress[currentBaseId] = {
      answered: true,
      isCorrect: correctMatch,
      timestamp: new Date().toISOString()
    };
    onUpdateUser({ ...user, progress: updatedProgress });
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
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished all questions
      sessionStorage.removeItem('fuhrerschein_learning_session_v2');
      if (languageMode === 'de') {
        alert('Glückwunsch! Du hast alle Fragen dieser Übung abgeschlossen.');
      } else {
        alert('Chúc mừng! Bạn đã hoàn thành toàn bộ 30 câu hỏi trong bài tập này.');
      }
      onNavigate('/training');
    }
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

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || typeof textToSend !== 'string') return;
    const userMsg = { sender: 'user', text: textToSend };
    setAiMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);

    const apiKey = user.apiKey || localStorage.getItem('fuhrerschein_api_key') || '';
    if (apiKey) {
      try {
        const systemPrompt = `Bạn là Trợ lý giảng dạy lý thuyết bằng lái xe Đức (Führerschein Klasse B).
Câu hỏi hiện tại học viên đang học:
- Tiếng Đức: "${currentQuestion.textDe}"
- Tiếng Việt: "${currentQuestion.textVi}"
- Giải thích ban đầu: "${currentQuestion.aiExplanation}"

Yêu cầu giải đáp: "${textToSend}"
Hãy trả lời chính xác, ngắn gọn bằng tiếng Việt, tập trung phân tích cho câu hỏi này.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, tôi gặp lỗi khi xử lý câu hỏi này. Vui lòng thử lại!';
        setAiMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
      } catch (err) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: 'Lỗi mạng hoặc kết nối API. Vui lòng thử lại.' }]);
      } finally { setIsAiLoading(false); }
    } else {
      // Mock offline responses based on clicked button
      setTimeout(() => {
        let responseText = '';
        const isMemorize = textToSend.includes('Mẹo ghi nhớ') || textToSend.includes('Merkhilfe');
        const isVocab = textToSend.includes('từ vựng') || textToSend.includes('Vokabeln');
        const isWrong = textToSend.includes('phương án khác') || textToSend.includes('Falsche Optionen') || textToSend.includes('đáp án sai');

        if (isMemorize) {
          if (languageMode === 'de') {
            responseText = `**Merkhilfe für diese Frage:**\n\n1. **Wichtiges Vokabel**: Merk dir den Begriff \`${currentQuestion.vocabulary?.[0]?.de || ''}\` bedeutet \`${currentQuestion.vocabulary?.[0]?.vi || ''}\`.\n2. **Hinweis**: ${currentQuestion.explanationDe || 'Achte auf das Bild und die Frage.'}`;
          } else if (languageMode === 'vi') {
            responseText = `**Mẹo ghi nhớ câu hỏi này:**\n\n1. **Từ khóa quan trọng**: Hãy nhớ cụm từ \`${currentQuestion.vocabulary?.[0]?.de || ''}\` có nghĩa là \`${currentQuestion.vocabulary?.[0]?.vi || ''}\`.\n2. **Điểm cần lưu ý**: ${currentQuestion.explanationVi || 'Chú ý đọc kỹ câu hỏi và xem hình ảnh đi kèm để tránh bẫy.'}`;
          } else {
            responseText = `**Mẹo ghi nhớ câu hỏi này / Merkhilfe:**\n\n1. **Từ khóa quan trọng / Vokabel**: \`${currentQuestion.vocabulary?.[0]?.de || ''}\` ➔ \`${currentQuestion.vocabulary?.[0]?.vi || ''}\`.\n2. **Điểm cần lưu ý / Hinweis**:\n- VN: ${currentQuestion.explanationVi || 'Chú ý đọc kỹ câu hỏi.'}\n- DE: ${currentQuestion.explanationDe || 'Achte auf die Frage.'}`;
          }
        } else if (isVocab) {
          const vocabListDe = currentQuestion.vocabulary && currentQuestion.vocabulary.length > 0
            ? currentQuestion.vocabulary.map(v => `- **${v.de}**: ${v.vi}`).join('\n')
            : 'Keine Vokabelliste für diese Frage gefunden.';
          const vocabListVi = currentQuestion.vocabulary && currentQuestion.vocabulary.length > 0
            ? currentQuestion.vocabulary.map(v => `- **${v.de}**: ${v.vi}`).join('\n')
            : 'Không tìm thấy danh sách từ vựng cụ thể cho câu hỏi này.';

          if (languageMode === 'de') {
            responseText = `**Wichtige deutsche Vokabeln in dieser Frage:**\n\n${vocabListDe}`;
          } else if (languageMode === 'vi') {
            responseText = `**Từ vựng tiếng Đức quan trọng trong câu này:**\n\n${vocabListVi}`;
          } else {
            responseText = `**Từ vựng tiếng Đức quan trọng / Wichtige Vokabeln:**\n\n${vocabListVi}`;
          }
        } else if (isWrong) {
          const wrongOptions = currentQuestion.options.filter(o => !o.isCorrect);
          const wrongListDe = wrongOptions.map(o => `- **Option ${o.id}** ("${o.textDe}"): Ist falsch laut StVO.`).join('\n');
          const wrongListVi = wrongOptions.map(o => `- **Phương án ${o.id}** ("${o.textVi || o.textDe}"): Là phương án sai vì không đúng quy định StVO.`).join('\n');

          if (languageMode === 'de') {
            responseText = `**Analyse, warum die anderen Optionen falsch sind:**\n\n${wrongListDe}`;
          } else if (languageMode === 'vi') {
            responseText = `**Phân tích tại sao các phương án khác lại sai:**\n\n${wrongListVi}`;
          } else {
            responseText = `**Phân tích đáp án sai / Fehlerhafte Optionen:**\n\n${wrongListVi}`;
          }
        } else {
          responseText = languageMode === 'de' ? 'Bitte wähle eine andere Schnellfrage.' : 'Vui lòng thử chọn một câu hỏi nhanh khác.';
        }
        setAiMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
        setIsAiLoading(false);
      }, 600);
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
    abbrechen: languageMode === 'de' ? 'Abbrechen' : (languageMode === 'vi' ? 'Hủy' : 'Abbrechen / Hủy'),
    nextQuestion: languageMode === 'de' ? 'Nächste Frage' : (languageMode === 'vi' ? 'Câu tiếp theo' : 'Nächste Frage / Tiếp theo'),
    aufloesung: languageMode === 'de' ? 'Auflösung' : (languageMode === 'vi' ? 'Đáp án' : 'Auflösung / Đáp án'),
    fragen: languageMode === 'de' ? 'Fragen' : (languageMode === 'vi' ? 'Câu hỏi' : 'Fragen / Câu hỏi'),
    aiExplanation: languageMode === 'de' ? 'Erklärung' : (languageMode === 'vi' ? 'Giải thích tại sao' : 'Giải thích / Erklärung'),
    askMore: languageMode === 'de' ? 'Mehr dazu fragen...' : (languageMode === 'vi' ? 'Hỏi thêm về câu này...' : 'Hỏi thêm / Fragen...'),
    companion: languageMode === 'de' ? 'Bạn Đồng Hành' : (languageMode === 'vi' ? 'Bạn Đồng Hành' : 'Bạn Đồng Hành'),
    quickQuestionsTitle: languageMode === 'de' ? 'Schnelle Frage zu dieser Aufgabe wählen:' : (languageMode === 'vi' ? 'Chọn câu hỏi nhanh về câu này:' : 'Chọn câu hỏi nhanh / Schnellfragen:'),
    qMemorize: languageMode === 'de' ? 'Merkhilfe für diese Frage' : (languageMode === 'vi' ? 'Mẹo ghi nhớ câu này' : 'Mẹo ghi nhớ / Merkhilfe'),
    qVocab: languageMode === 'de' ? 'Vokabeln erklären' : (languageMode === 'vi' ? 'Giải thích từ vựng' : 'Giải thích từ vựng / Vokabeln'),
    qWrongOptions: languageMode === 'de' ? 'Falsche Optionen analysieren' : (languageMode === 'vi' ? 'Phân tích đáp án sai' : 'Phân tích đáp án sai / Falsche Optionen')
  };

  return (
    <div className="flex flex-col w-full overflow-hidden relative" style={{ height: 'calc(100vh - 76px)', backgroundColor: theme.bg, fontFamily: 'Arial, Helvetica, sans-serif' }}>

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
          <button onClick={() => setShowExitConfirm(true)} className="hover:opacity-80">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="w-full px-4 py-4 flex flex-col flex-1" style={{ maxWidth: '1400px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>

          {/* Question Text */}
          {showQuestion && (
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
          )}

          {/* Content Area - desktop: side-by-side filling available height */}
          <div className="w-full flex flex-col md:flex-row md:gap-6 md:items-stretch flex-1">

            {/* Left: Image / Media – always rendered to keep layout stable */}
            <div className="lernen-media-col group" onClick={() => (currentQuestion.video || currentQuestion.image || currentQuestion.imageType) && setIsFullscreenMode(true)}>
              {currentQuestion.video ? (
                <div className="relative w-full border border-black bg-black rounded-sm overflow-hidden shadow-sm">
                  <video
                    ref={videoRef}
                    src={currentQuestion.video}
                    controls={isSubmitted}
                    onPlay={(e) => {
                      if (!hasPlayedOnce) setHasPlayedOnce(true);
                      if (videoPlayCount >= 5 && !isSubmitted) {
                        e.preventDefault();
                        if (videoRef.current) videoRef.current.pause();
                        alert(languageMode === 'de' ? 'Maximale Anzahl an Wiederholungen (5) erreicht.' : 'Đã đạt giới hạn 5 lần xem video.');
                      } else {
                        if (window.innerWidth < 768) setIsFullscreenMode(true);
                      }
                    }}
                    onEnded={() => {
                      if (!showQuestion) {
                        setVideoPlayCount(prev => prev + 1);
                      }
                      setIsFullscreenMode(false);
                    }}
                    className="lernen-media-video"
                  />
                  {!isSubmitted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black bg-opacity-60 text-white rounded-full p-2 group-hover:scale-110 transition-transform shadow-md">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  )}
                  <div className="hidden md:block absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-1.5 rounded text-xs pointer-events-none">🔍 Phóng to</div>
                </div>
              ) : currentQuestion.image ? (
                <div className="relative w-full border border-black bg-slate-50 rounded-sm overflow-hidden shadow-sm">
                  <img src={currentQuestion.image} alt="Question" className="lernen-media-img" />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-1.5 rounded text-[10px] md:text-xs pointer-events-none">🔍 Phóng to</div>
                </div>
              ) : currentQuestion.imageType ? (
                <div className="lernen-media-svg relative border border-black overflow-hidden bg-white rounded-sm shadow-sm">
                  <SVGGraphics type={currentQuestion.imageType} className="w-full h-full" />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-1.5 rounded text-[10px] md:text-xs pointer-events-none">🔍 Phóng to</div>
                </div>
              ) : (
                /* No media – transparent placeholder to keep layout */
                <div style={{ flex: 1, border: '1px solid transparent', background: 'transparent' }} />
              )}
            </div>

            {/* Right: Checkboxes / Buttons */}
            {showQuestion ? (
              <div className="flex-1 flex flex-col gap-4 md:gap-[18px] w-full">
                {currentQuestion.options.map(option => {
                  const isSelected = selectedOptions.includes(option.id);
                  const hasMistake = isSubmitted && (
                    (option.isCorrect && !isSelected) ||
                    (!option.isCorrect && isSelected)
                  );
                  const isCorrectOption = isSubmitted && option.isCorrect;

                  let boxBg = isSelected ? "black" : "white";
                  let tickColor = "white";
                  let showTick = isSelected;

                  const barColor = hasMistake ? '#e50000' : isCorrectOption ? '#00995e' : null;

                  return (
                    <div
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        gap: '20px',
                        cursor: isSubmitted ? 'default' : 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flexShrink: 0 }}>
                        {barColor ? (
                          <div style={{
                            width: '4px',
                            backgroundColor: barColor,
                            marginRight: '8px',
                            borderRadius: '2px',
                            alignSelf: 'stretch'
                          }} />
                        ) : (
                          <div style={{ width: '4px', marginRight: '8px' }} />
                        )}

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

                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '4px' }}>
                        {(languageMode === 'de' || languageMode === 'both') && (
                          <span style={{ fontSize: '16px', fontWeight: 700, color: theme.textDark, lineHeight: '1.3' }}>
                            {option.textDe}
                          </span>
                        )}
                        {(languageMode === 'vi' || languageMode === 'both') && option.textVi && (
                          <span style={{ fontSize: '14px', fontWeight: 650, color: '#4b5563', fontStyle: 'italic', marginTop: (languageMode === 'both') ? '4px' : '0px' }}>
                            {option.textVi}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 pt-2 w-full">
                <button
                  onClick={() => {
                    if (videoPlayCount < 5) {
                      if (videoRef.current) videoRef.current.play();
                    }
                  }}
                  disabled={videoPlayCount >= 5}
                  className={`transition-all ${videoPlayCount >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ width: '100%', backgroundColor: videoPlayCount >= 5 ? '#6b7280' : '#0000a0', color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '10px', borderRadius: '4px', border: '1px solid #000' }}
                >
                  {languageMode === 'de' ? 'Video starten' : languageMode === 'vi' ? 'Bắt đầu video' : 'Video starten / Bắt đầu video'}
                </button>

                {hasPlayedOnce && (
                  <button
                    onClick={() => {
                      setShowQuestion(true);
                      if (videoRef.current) videoRef.current.pause();
                    }}
                    className="hover:opacity-90"
                    style={{ width: '100%', backgroundColor: '#0000a0', color: 'white', fontWeight: 'bold', fontSize: '18px', padding: '10px', borderRadius: '4px', border: '1px solid #000' }}
                  >
                    {languageMode === 'de' ? 'Zur Aufgabenstellung' : languageMode === 'vi' ? 'Vào câu hỏi' : 'Zur Aufgabenstellung / Vào câu hỏi'}
                  </button>
                )}

                <div style={{ marginTop: '20px', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', color: '#0a4c2f' }}>
                  {!hasPlayedOnce && videoPlayCount === 0 ? (
                    languageMode === 'de' ? (
                      <span>Sie können das Video insgesamt <strong>5</strong> Mal ansehen.</span>
                    ) : languageMode === 'vi' ? (
                      <span>Bạn có thể xem video tối đa <strong>5</strong> lần.</span>
                    ) : (
                      <span>Sie können das Video insgesamt <strong>5</strong> Mal ansehen.<br /><span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 'normal' }}>(Bạn có thể xem video tối đa 5 lần)</span></span>
                    )
                  ) : (
                    languageMode === 'de' ? (
                      <span>Sie können sich den Film noch <strong style={{ color: '#e50000' }}>{5 - videoPlayCount}</strong> mal ansehen.</span>
                    ) : languageMode === 'vi' ? (
                      <span>Bạn có thể xem video này thêm <strong style={{ color: '#e50000' }}>{5 - videoPlayCount}</strong> lần nữa.</span>
                    ) : (
                      <span>Sie können sich den Film noch <strong style={{ color: '#e50000' }}>{5 - videoPlayCount}</strong> mal ansehen.<br /><span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 'normal' }}>(Bạn có thể xem video này thêm {5 - videoPlayCount} lần)</span></span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons (Right aligned above bottom bar) */}
          <div className="flex flex-wrap justify-end gap-2 md:gap-3 mb-3 pr-2 mt-auto">
            {!isSubmitted ? (
              <button
                onClick={() => setShowExitConfirm(true)}
                className="flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.btnRed, height: '44px', borderRadius: '8px', fontSize: '15px', minWidth: '160px', padding: '0 20px' }}
              >
                {t.abbrechen}
              </button>
            ) : (
              <button
                onClick={handleOpenAi}
                className="font-bold text-white shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', height: '44px', borderRadius: '8px', fontSize: '15px', minWidth: '160px', padding: '0 20px' }}
              >
                {t.aiExplanation}
              </button>
            )}

            <button
              onClick={handleBookmarkToggle}
              className="flex items-center justify-center hover:opacity-90"
              style={{ backgroundColor: theme.btnYellow, width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0 }}
            >
              <Star size={20} fill={isBookmarked ? "black" : "transparent"} color="black" strokeWidth={isBookmarked ? 1 : 2} />
            </button>

            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.btnGreen, height: '44px', borderRadius: '8px', fontSize: '15px', minWidth: '160px', padding: '0 20px' }}
              >
                {t.aufloesung}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center justify-center font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#2b576b', height: '44px', borderRadius: '8px', fontSize: '15px', minWidth: '160px', padding: '0 20px' }}
              >
                {t.nextQuestion}
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
              const hasVideo = questionAtPage ? !!questionAtPage.video : false;

              const hasResult = sessionResults[pageNum - 1] !== undefined;
              const isPageCorrect = sessionResults[pageNum - 1];

              let bgColor = '#ffffff';
              let textColor = 'black';
              if (hasResult) {
                bgColor = isPageCorrect ? '#00995e' : '#e50000';
                textColor = 'white';
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentIndex(pageNum - 1)}
                  className="flex items-center justify-center font-bold relative hover:opacity-90"
                  style={{
                    width: '54px',
                    height: '38px',
                    minWidth: '54px',
                    backgroundColor: bgColor,
                    color: textColor,
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

      {/* Exit Confirm Modal */}
      {showExitConfirm && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              {languageMode === 'de' ? 'Training beenden?' : (languageMode === 'vi' ? 'Thoát khỏi bài học?' : 'Thoát bài học? / Training beenden?')}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: '24px' }}>
              {languageMode === 'de'
                ? 'Dein Fortschritt in dieser Sitzung geht verloren.'
                : (languageMode === 'vi'
                  ? 'Tiến trình bài học hiện tại sẽ không được lưu.'
                  : 'Tiến trình sẽ không được lưu. / Fortschritt geht verloren.')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#374151' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {languageMode === 'de' ? 'Weiter lernen' : (languageMode === 'vi' ? 'Học tiếp' : 'Học tiếp / Weiter')}
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('fuhrerschein_learning_session_v2');
                  setShowExitConfirm(false);
                  onNavigate('/training');
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: theme.btnRed, fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {languageMode === 'de' ? 'Beenden' : (languageMode === 'vi' ? 'Thoát' : 'Thoát / Beenden')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Modal */}
      {isFullscreenMode && (currentQuestion.image || currentQuestion.video || currentQuestion.imageType) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setIsFullscreenMode(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '50%', border: 'none', zIndex: 110, cursor: 'pointer' }}
          >
            <X size={28} strokeWidth={3} />
          </button>

          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentQuestion.video ? (
              <video
                src={currentQuestion.video}
                controls
                autoPlay
                onEnded={() => {
                  if (!showQuestion) {
                    setVideoPlayCount(prev => prev + 1);
                  }
                  setIsFullscreenMode(false);
                }}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : currentQuestion.image ? (
              <img src={currentQuestion.image} alt="Fullscreen Question" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : currentQuestion.imageType ? (
              <div style={{ width: '100vw', height: '100vw', maxHeight: '100vh', aspectRatio: '1.6', position: 'relative' }}>
                <SVGGraphics type={currentQuestion.imageType} className="w-full h-full" />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Chat Drawer Overlay */}
      {isAiOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '600px', height: '75vh', maxHeight: '600px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6', background: 'linear-gradient(135deg, #1a4a5e, #2b6f8a)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                <h3 style={{ fontWeight: 'bold', margin: 0 }}>{t.companion}</h3>
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
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Bạn Đồng Hành</span>
                      </div>
                    )}
                    <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderFormattedText(msg.text)}
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

            <div style={{ padding: '12px 16px 16px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a4a5e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.quickQuestionsTitle}
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleSendMessage(t.qMemorize)}
                  className="flex-1 min-w-[120px] p-2.5 bg-slate-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-[#1a4a5e] rounded-xl text-xs font-bold text-left transition-all disabled:opacity-50"
                >
                  {t.qMemorize}
                </button>
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleSendMessage(t.qVocab)}
                  className="flex-1 min-w-[120px] p-2.5 bg-slate-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-[#1a4a5e] rounded-xl text-xs font-bold text-left transition-all disabled:opacity-50"
                >
                  {t.qVocab}
                </button>
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleSendMessage(t.qWrongOptions)}
                  className="flex-1 min-w-[120px] p-2.5 bg-slate-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-[#1a4a5e] rounded-xl text-xs font-bold text-left transition-all disabled:opacity-50"
                >
                  {t.qWrongOptions}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
