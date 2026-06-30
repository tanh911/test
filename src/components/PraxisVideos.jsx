import React, { useState } from 'react';
import { PlayCircle, ExternalLink } from 'lucide-react';

const praxisCategories = [
  {
    id: 'grundfahraufgaben',
    title: 'Bài tập cơ bản',
    videos: [
      { id: 'v_gf1', label: 'Phanh khẩn cấp (Gefahrbremsung)', url: 'https://www.youtube.com/embed/xqFItvT9cmw' },
      { id: 'v_gf2', label: 'Khởi hành ngang dốc (Anfahren am Berg)', url: 'https://www.youtube.com/embed/DUF9Ot339gQ' },
      { id: 'v_gf3', label: 'Quay đầu xe (Wenden)', url: 'https://www.youtube.com/embed/CgUjV5rAFo8' }
    ]
  },
  {
    id: 'parking',
    title: 'Đỗ xe',
    videos: [
      { id: 'v1', label: 'Ghép ngang (Längseinparken)', url: 'https://www.youtube.com/embed/xySkh2Q8QXM' },
      { id: 'v2', label: 'Ghép dọc lùi (Rückwärts einparken)', url: 'https://www.youtube.com/embed/ZYzQWehjytk' },
      { id: 'v3', label: 'Đỗ xe tiến (Vorwärts einparken)', url: 'https://www.youtube.com/embed/D-mN1hl5O44' }
    ]
  },
  {
    id: 'junctions',
    title: 'Ngã tư & Vòng xuyến',
    videos: [
      { id: 'v4', label: 'Nhìn điểm mù (Schulterblick)', url: 'https://www.youtube.com/embed/7OEX-Ds7wyE' },
      { id: 'v5', label: 'Vào & ra bùng binh (Kreisverkehr)', url: 'https://www.youtube.com/embed/_AyjvKv8Xx8' },
      { id: 'v6', label: 'Rẽ trái nhường đường', url: 'https://www.youtube.com/embed/3t_PJqyoNsk' }
    ]
  },
  {
    id: 'stadtverkehr',
    title: 'Lái xe trong phố',
    videos: [
      { id: 'v_sv1', label: 'Nhường đường người đi bộ (Zebrastreifen)', url: 'https://www.youtube.com/embed/PKz8RWD1XCA' },
      { id: 'v_sv2', label: 'Đối phó với xe đạp (Radfahrer)', url: 'https://www.youtube.com/embed/hqr4SVDjO64' },
      { id: 'v_sv3', label: 'Đi chung đường với xe điện (Straßenbahn)', url: 'https://www.youtube.com/embed/IPCob5EDdqc' }
    ]
  },
  {
    id: 'landstrasse',
    title: 'Đường quốc lộ',
    videos: [
      { id: 'v_ls1', label: 'Vượt xe an toàn (Überholen)', url: 'https://www.youtube.com/embed/KUhCCTYV2Gg' },
      { id: 'v_ls2', label: 'Lái xe qua đường cong (Kurvenfahren)', url: 'https://www.youtube.com/embed/ynzCCM3rp10' },
      { id: 'v_ls3', label: 'Nhận biết biển báo trên quốc lộ', url: 'https://www.youtube.com/embed/ynzCCM3rp10' }
    ]
  },
  {
    id: 'highway',
    title: 'Autobahn',
    videos: [
      { id: 'v7', label: 'Nhập làn Autobahn (Auffahrt)', url: 'https://www.youtube.com/embed/OqW-s1sH5zw' },
      { id: 'v8', label: 'Chuyển làn tốc độ cao (Spurwechsel)', url: 'https://www.youtube.com/embed/sKy4Mu6L6yo' },
      { id: 'v9', label: 'Rời Autobahn an toàn (Abfahrt)', url: 'https://www.youtube.com/embed/OqW-s1sH5zw' }
    ]
  },
  {
    id: 'technik',
    title: 'Hỏi đáp kỹ thuật xe',
    videos: [
      { id: 'v_tk1', label: 'Kiểm tra lốp xe (Reifen prüfen)', url: 'https://www.youtube.com/embed/gslAFCbyZdo' },
      { id: 'v_tk2', label: 'Kiểm tra hệ thống đèn (Lichtanlage)', url: 'https://www.youtube.com/embed/iBN1_3PYtPY' },
      { id: 'v_tk3', label: 'Mở nắp capo (Motorraum prüfen)', url: 'https://www.youtube.com/embed/gslAFCbyZdo' }
    ]
  },
  {
    id: 'pruefung_tipps',
    title: 'Mẹo thi thực hành',
    videos: [
      { id: 'v_pt1', label: 'Những lỗi trượt trực tiếp (Durchfallgründe)', url: 'https://www.youtube.com/embed/Zq1hMQM2Vxs' },
      { id: 'v_pt2', label: 'Khắc phục tâm lý thi (Prüfungsangst)', url: 'https://www.youtube.com/embed/qP-ecNh02e4' },
      { id: 'v_pt3', label: 'Các khẩu lệnh của giám khảo', url: 'https://www.youtube.com/embed/FfHAwVPQY90' }
    ]
  }
];

export const PraxisVideos = () => {
  const [activeCategory, setActiveCategory] = useState(praxisCategories[0].id);
  const [activeVideo, setActiveVideo] = useState(praxisCategories[0].videos[0]);

  const activeCategoryData = praxisCategories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Video Player (16:9) */}
      <div className="w-full bg-black shrink-0 relative" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={activeVideo.url.replace('youtube.com', 'youtube-nocookie.com') + "?rel=0&modestbranding=1"}
          title={activeVideo.label}
          frameBorder="0"
          allow="fullscreen; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>

      <div className="flex flex-col p-4 flex-1 overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[13px] font-bold text-slate-800 leading-snug">{activeVideo.label}</h3>
          <a
            href={activeVideo.url.replace('/embed/', '/watch?v=')}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-red-100"
            title="Mở bằng ứng dụng YouTube nếu video bị lỗi"
          >
            <ExternalLink size={14} />
            <span>YouTube</span>
          </a>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0 border-b border-gray-200 pb-3 mb-3">
          {praxisCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const firstVideo = praxisCategories.find(c => c.id === cat.id).videos[0];
                setActiveVideo(firstVideo);
              }}
              className="px-2 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all text-center leading-tight flex items-center justify-center"
              style={activeCategory === cat.id
                ? { background: '#2b576b', color: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                : { background: '#f1f5f9', color: '#475569' }
              }
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scroll pr-1">
          {activeCategoryData?.videos.map((vid) => (
            <button
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="w-full text-left p-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2.5 shadow-xs"
              style={activeVideo.id === vid.id
                ? { background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }
                : { background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' }
              }
            >
              <PlayCircle size={18} color={activeVideo.id === vid.id ? "#0284c7" : "#94a3b8"} />
              <span>{vid.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
