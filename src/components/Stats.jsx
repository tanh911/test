import React, { useState } from 'react';
import { questions } from '../data/questions';
import { SVGGraphics } from './SVGGraphics';
import {
  BookOpen, Calendar, CheckCircle2, Trophy, Trash2, Star, X, BarChart3
} from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategoryLabel } from '../utils/categoryHelpers';
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
    <div className="flex items-center justify-center flex-1 w-full bg-gray-100 p-0 md:p-6">
      <div 
        className="flex flex-col w-full h-full md:max-h-[90vh] bg-[#f8f9fa] text-gray-900 font-sans overflow-y-auto md:rounded-3xl md:shadow-lg md:border border-gray-200 relative pb-6 no-scrollbar"
        style={{ maxWidth: '600px' }}
      >

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#f8f9fa]/95 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all border border-gray-200"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-bold text-gray-800 tracking-wide">Thống kê</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="px-5 py-6 space-y-8">
          
          {/* 3 Semi-Circle Gauges */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-4">
            <div className="flex justify-between items-center gap-2">
              {renderGauge(fitPercent, animatedFit, '#7cb342', 'Tỷ lệ đỗ')}
              {renderGauge(answeredPercent, animatedAnswered, '#fbc02d', 'Đã học')}
              {renderGauge(wrongPercent, animatedWrong, '#e53935', 'Hay sai')}
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Main Metric - Fit for exam */}
            <div 
              className="col-span-2 p-5 border flex items-center justify-between"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                height: '90px'
              }}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} strokeWidth={2.5} />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-end gap-1 flex-nowrap whitespace-nowrap">
                    <span className="font-black tracking-tighter text-emerald-500" style={{ fontSize: 'calc(30px * var(--text-scale, 1))', lineHeight: '1' }}>{fitPercent.toFixed(0)}</span>
                    <span className="font-bold text-emerald-500" style={{ fontSize: 'calc(18px * var(--text-scale, 1))', lineHeight: '1', paddingBottom: '3px' }}>%</span>
                  </div>
                  <div 
                    className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wide"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Tỷ lệ đỗ kỳ thi
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Answered */}
            <div 
              className="p-4 border flex items-center gap-3"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                height: '80px'
              }}
            >
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <div className="overflow-hidden">
                <div className="text-2xl font-black text-gray-800 tracking-tight leading-none">{answeredCount}</div>
                <div 
                  className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Câu đã học
                </div>
              </div>
            </div>

            {/* Wrong Answers */}
            <div 
              className="p-4 border flex items-center gap-3"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                height: '80px'
              }}
            >
              <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <X size={20} strokeWidth={3} />
              </div>
              <div className="overflow-hidden">
                <div className="text-2xl font-black text-gray-800 tracking-tight leading-none">{wrongCount}</div>
                <div 
                  className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Hay làm sai
                </div>
              </div>
            </div>

            {/* Exam Run Status */}
            <div 
              className="col-span-2 p-5 border flex items-center justify-between"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                height: '90px'
              }}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Trophy size={26} strokeWidth={2.5} />
                </div>
                <div className="overflow-hidden">
                  <div 
                    className="text-[15px] font-extrabold text-gray-800"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Kỳ thi gần nhất
                  </div>
                  <div 
                    className="text-xs font-bold text-gray-500 mt-0.5"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {examsRun.length > 0 ? `Đã thi ${examsRun.length} lần` : 'Chưa thi thử'}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {lastExam ? (
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${lastExam.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {lastExam.passed ? 'ĐÃ ĐỖ' : 'TRƯỢT'}
                  </span>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-black uppercase tracking-wider">---</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Rings Legend / Explanation */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
              Ý nghĩa vòng tròn tiến độ
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 mt-0.5 rounded-full shrink-0" style={{ backgroundColor: '#7cb342', boxShadow: '0 2px 4px rgba(124, 179, 66, 0.3)' }} />
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Vòng ngoài (Xanh lá) - Tỷ lệ đỗ</div>
                  <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">Phản ánh tỷ lệ câu hỏi bạn đã trả lời ĐÚNG. Vòng xanh càng khép kín, bạn càng sẵn sàng cho kỳ thi sát hạch.</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 mt-0.5 rounded-full shrink-0" style={{ backgroundColor: '#fbc02d', boxShadow: '0 2px 4px rgba(251, 192, 45, 0.3)' }} />
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Vòng giữa (Vàng) - Câu đã học</div>
                  <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">Thể hiện phần trăm câu hỏi bạn đã mở ra học ít nhất một lần so với toàn bộ ngân hàng câu hỏi.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 mt-0.5 rounded-full shrink-0" style={{ backgroundColor: '#e53935', boxShadow: '0 2px 4px rgba(229, 57, 53, 0.3)' }} />
                <div>
                  <div className="text-[13px] font-bold text-gray-800">Vòng trong (Đỏ) - Hay làm sai</div>
                  <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">Biểu thị tỷ lệ các câu bạn vừa làm sai gần đây. Bạn nên ưu tiên ôn tập nhóm câu này để thu hẹp vòng đỏ.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookmarked Questions */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-1.5 px-1 uppercase tracking-wide">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Câu hỏi đã lưu ({savedQuestionsDetails.length})
            </h3>

            {savedQuestionsDetails.length === 0 ? (
              <div className="bg-white border border-gray-200 p-6 rounded-2xl text-center text-[13px] text-gray-500 shadow-sm">
                Bạn chưa lưu câu hỏi nào.
              </div>
            ) : (
              <div className="space-y-2">
                {savedQuestionsDetails.map(q => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedSavedQ(q)}
                    className="bg-white border border-gray-100 hover:border-gray-300 p-4 rounded-2xl transition-all cursor-pointer flex justify-between items-center gap-3 shadow-sm"
                  >
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                          {getCategoryLabel(q.category, 'both')}
                        </span>
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                          {q.points} ĐIỂM
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-gray-800 line-clamp-1 mt-1">{q.textDe}</p>
                      <p className="text-[12px] text-gray-500 line-clamp-1">{q.textVi}</p>
                    </div>
                    <button
                      onClick={(e) => handleRemoveBookmark(q.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam History Log */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-gray-700 flex items-center gap-1.5 px-1 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Lịch sử thi thử ({examsRun.length})
            </h3>

            {examsRun.length === 0 ? (
              <div className="bg-white border border-gray-200 p-6 rounded-2xl text-center text-[13px] text-gray-500 shadow-sm">
                Bạn chưa thực hiện bài thi thử nào.
              </div>
            ) : (
              <div className="space-y-2">
                {examsRun.map((e, idx) => (
                  <div
                    key={e.id || idx}
                    className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-[13px] font-bold text-gray-800">Đề thi thử ngày {e.date}</p>
                      <p className="text-[12px] text-gray-500">Bị phạt <span className="font-semibold text-gray-700">{e.fehlerpunkte}</span> điểm (10 câu)</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${e.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {e.passed ? 'ĐỖ' : 'TRƯỢT'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  {getCategoryLabel(selectedSavedQ.category, 'both')} • {selectedSavedQ.points} Điểm phạt
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
    </div>
  );
};
export default Stats;
