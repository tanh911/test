import React, { useState } from 'react';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import {
  BookOpen, Calendar, CheckCircle2, Trophy, Trash2, Star, X
} from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const Stats = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [selectedSavedQ, setSelectedSavedQ] = useState(null);

  // Stats calculation
  const totalQuestions = questions.length;
  const progressEntries = Object.values(user.progress || {});
  const answeredCount = progressEntries.filter(p => p.answered).length;
  const correctCount = progressEntries.filter(p => p.isCorrect).length;

  const successRate = answeredCount > 0
    ? Math.round((correctCount / answeredCount) * 100)
    : 0;

  const examsRun = user.examHistory || [];
  const lastExam = examsRun[0];

  // Bookmarked questions details
  const savedQuestionsDetails = questions.filter(q => user.savedQuestions.includes(q.id));

  // Remove bookmark
  const handleRemoveBookmark = (id, e) => {
    e.stopPropagation(); // Avoid opening dialog
    const updated = user.savedQuestions.filter(qid => qid !== id);
    onUpdateUser({
      ...user,
      savedQuestions: updated
    });
    if (selectedSavedQ && selectedSavedQ.id === id) {
      setSelectedSavedQ(null);
    }
  };

  // 3 vòng tròn thống kê
  const answeredPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const wrongCount = progressEntries.filter(p => !p.isCorrect).length;
  const wrongPercent = totalQuestions > 0 ? (wrongCount / totalQuestions) * 100 : 0;

  // Fit for exam can be based on success rate and answered percentage
  const fitPercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  const [animatedFit, setAnimatedFit] = useState(0);
  const [animatedAnswered, setAnimatedAnswered] = useState(0);
  const [animatedWrong, setAnimatedWrong] = useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedFit(fitPercent);
      setAnimatedAnswered(answeredPercent);
      setAnimatedWrong(wrongPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [fitPercent, answeredPercent, wrongPercent]);

  const renderGauge = (percent, animatedPercent, color, label, iconText) => {
    const radius = 40;
    const arcLength = Math.PI * radius; // 125.66
    const strokeDashoffset = arcLength - (animatedPercent / 100) * arcLength;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-16 flex items-end justify-center overflow-hidden">
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
            {/* Background track */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />

            {/* Progress track */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: animatedPercent > 0 ? 1 : 0
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute bottom-1 font-bold" style={{ color: color, fontSize: 'calc(18px * var(--text-scale, 1))' }}>
            {percent.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }}></div>
          <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-[#F3F4F6] text-gray-900 font-sans overflow-y-auto px-4 py-4 pb-20 space-y-6 no-scrollbar">
      <button
        onClick={() => navigate('/home')}
        style={{
          width: '32px', height: '32px',
          background: '#2b576b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      {/* 3 Rings Statistics */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
        <h2 className="text-xl font-medium text-[#1e445a] mb-6">Übersicht</h2>

        <div className="flex flex-row items-center justify-between w-full max-w-sm px-2 gap-4">
          {renderGauge(fitPercent, animatedFit, '#7cb342', 'Fit für die Prüfung')}
          {renderGauge(answeredPercent, animatedAnswered, '#fbc02d', 'Mind. 1x geübt')}
          {renderGauge(wrongPercent, animatedWrong, '#e53935', 'Zuletzt falsch')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col justify-between space-y-2 shadow-sm">
          <BookOpen className="w-4.5 h-4.5 text-[#1e445a]" />
          <div>
            <span className="block text-xl font-extrabold font-mono text-gray-900">{answeredCount} / {totalQuestions}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-sans font-bold">CÂU HOÀN THÀNH</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col justify-between space-y-2 shadow-sm">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#1e445a]" />
          <div>
            <span className="block text-xl font-extrabold font-mono text-[#7cb342]">{successRate}%</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-sans font-bold">TỶ LỆ ĐÚNG</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col justify-between space-y-2 shadow-sm">
          <Calendar className="w-4.5 h-4.5 text-[#1e445a]" />
          <div>
            <span className="block text-xl font-extrabold font-mono text-gray-900">{examsRun.length}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-sans font-bold">SỐ LẦN THI THỬ</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col justify-between space-y-2 shadow-sm">
          <Trophy className="w-4.5 h-4.5 text-[#1e445a]" />
          <div>
            <span className={`block text-base font-extrabold font-sans uppercase ${lastExam ? (lastExam.passed ? 'text-[#7cb342]' : 'text-[#e53935]') : 'text-gray-900'
              }`}>
              {lastExam ? (lastExam.passed ? 'ĐÃ ĐỖ' : 'TRƯỢT') : 'CHƯA THI'}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-sans font-bold">ĐỀ THI GẦN NHẤT</span>
          </div>
        </div>
      </div>

      {/* Bookmarked Questions */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803D] flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-[#15803D] text-[#15803D]" />
          Câu hỏi đã lưu ({savedQuestionsDetails.length})
        </h3>

        {savedQuestionsDetails.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 p-6 rounded-xl text-center text-xs text-gray-500 font-bold shadow-sm">
            Bạn chưa lưu câu hỏi nào. Nhấn biểu tượng ngôi sao ⭐ khi học tập để lưu.
          </div>
        ) : (
          <div className="space-y-2">
            {savedQuestionsDetails.map(q => (
              <div
                key={q.id}
                onClick={() => setSelectedSavedQ(q)}
                className="bg-white border-2 border-gray-200 hover:border-[#15803D] p-3.5 rounded-xl text-left transition-colors cursor-pointer flex justify-between items-center gap-4 shadow-sm"
              >
                <div className="space-y-1.5 overflow-hidden">
                  <span className="font-mono text-[9px] uppercase tracking-wider border-2 border-[#15803D]/30 bg-green-50 text-[#15803D] px-1.5 py-0.5 rounded-md font-bold">
                    {q.category} ({q.points}đ)
                  </span>
                  <p className="text-[14px] font-extrabold text-gray-900 truncate mt-1.5">{q.textDe}</p>
                  <p className="text-[12px] font-bold text-gray-650 truncate">{q.textVi}</p>
                </div>
                <button
                  onClick={(e) => handleRemoveBookmark(q.id, e)}
                  className="p-2 border border-gray-200 hover:border-red-600 hover:text-red-600 text-gray-500 rounded-lg transition-colors shrink-0 bg-gray-50 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam History Log */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803D] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#15803D]" />
          Lịch sử thi thử ({examsRun.length})
        </h3>

        {examsRun.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 p-6 rounded-xl text-center text-xs text-gray-500 font-bold shadow-sm">
            Bạn chưa thực hiện bài thi thử nào.
          </div>
        ) : (
          <div className="space-y-2">
            {examsRun.map((e, idx) => (
              <div
                key={e.id || idx}
                className="bg-white border-2 border-gray-200 p-3.5 rounded-xl flex justify-between items-center text-left shadow-sm"
              >
                <div className="space-y-1.5">
                  <p className="text-[13px] font-extrabold text-gray-900">Đề thi thử ngày {e.date}</p>
                  <p className="text-[11px] text-gray-600 font-bold">Bị phạt {e.fehlerpunkte} điểm (10 câu)</p>
                </div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 border-2 rounded-lg ${e.passed ? 'bg-green-50 border-green-600 text-green-700' : 'bg-red-50 border-red-605 text-red-650'
                  }`}>
                  {e.passed ? 'ĐỖ' : 'TRƯỢT'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Question Detail Overlay (Dialog) */}
      {selectedSavedQ && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[400px] max-h-[80vh] overflow-y-auto rounded-2xl border-2 border-gray-300 p-5 shadow-2xl space-y-4 relative no-scrollbar">

            <button
              onClick={() => setSelectedSavedQ(null)}
              className="absolute right-4 top-4 p-1.5 border-2 border-gray-200 hover:border-[#15803D] text-gray-700 rounded-lg transition-colors bg-gray-50 hover:bg-green-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pr-6">
              <span className="font-mono text-[9px] uppercase tracking-wider border-2 border-[#15803D]/30 bg-green-50 text-[#15803D] px-2 py-0.5 rounded-md font-bold">
                {selectedSavedQ.category} • {selectedSavedQ.points} Điểm phạt
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[18px] font-extrabold text-gray-900 leading-snug">{selectedSavedQ.textDe}</h3>
              <p className="text-[15px] font-bold text-gray-800 border-l-4 border-[#15803D] pl-3 leading-relaxed italic bg-gray-50 py-1">{selectedSavedQ.textVi}</p>
            </div>

            {/* Media Rendering */}
            {selectedSavedQ.video && (
              <div className="flex justify-center border-2 border-gray-200 bg-black p-1 rounded-xl overflow-hidden shadow-sm">
                <video
                  src={selectedSavedQ.video}
                  controls
                  className="w-full h-auto max-h-[180px]"
                  poster={selectedSavedQ.image || undefined}
                />
              </div>
            )}

            {selectedSavedQ.image && !selectedSavedQ.video && (
              <div className="flex justify-center border-2 border-gray-200 bg-black p-1 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={selectedSavedQ.image}
                  alt="Question Visual"
                  className="w-full h-auto max-h-[180px] object-contain"
                />
              </div>
            )}

            {selectedSavedQ.imageType && !selectedSavedQ.image && !selectedSavedQ.video && (
              <div className="flex justify-center bg-[#E8F5E9] p-3 rounded-xl border border-[#C8E6C9]">
                <SVGGraphics type={selectedSavedQ.imageType} className="w-full max-w-[180px] h-auto aspect-square" />
              </div>
            )}

            {/* Options display */}
            <div className="space-y-2.5 pt-1">
              {selectedSavedQ.options.map(opt => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-lg border-2 text-sm flex gap-2.5 items-start ${opt.isCorrect
                    ? 'border-green-600 bg-green-50 text-green-950 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-650'
                    }`}
                >
                  <span className="font-mono font-extrabold shrink-0 text-gray-900">{opt.id}.</span>
                  <div className="leading-snug">
                    <p className="text-[14px] font-extrabold">{opt.textDe}</p>
                    <p className="text-[12px] font-bold opacity-90 mt-0.5">{opt.textVi}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="p-3.5 bg-green-50 border-2 border-green-600 text-green-900 rounded-lg text-sm font-bold leading-relaxed shadow-3xs">
              <p className="font-extrabold text-green-700 uppercase text-xs tracking-wider mb-1">Giải thích:</p>
              <p>{selectedSavedQ.explanationVi}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default Stats;
