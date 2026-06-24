import React from 'react';
import { ChevronLeft, ChevronRight, Menu, BarChart3, List, CheckCircle } from 'lucide-react';

export const TrainingDashboard = ({ onNavigate, onShowLogin }) => {
  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"}}>
      
      {/* Global Header is handled by App.jsx, so we don't need one here */}

      {/* Main Responsive Content */}
      <style>{`
        .home-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 24px;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .home-container {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 60px;
            padding: 40px;
          }
        }
      `}</style>
      <div className="flex-1 overflow-y-auto" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 90 Q 30 70 50 90 T 90 90\' stroke=\'%23e5ebf0\' stroke-width=\'2\' fill=\'none\' stroke-dasharray=\'4 4\'/%3E%3Ccircle cx=\'20\' cy=\'85\' r=\'4\' fill=\'%23e5ebf0\'/%3E%3Cpath d=\'M70 80 L85 80 L85 70\' stroke=\'%23e5ebf0\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundPosition: 'bottom right',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '300px'
      }}>
        <div className="home-container">
        
        {/* Left Side: Large Progress Circle */}
        <div className="relative flex-shrink-0" style={{width: 'min(100%, 420px)', aspectRatio: '1/1'}}>
          <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%'}}>
            {/* Outer rings */}
            <circle cx="100" cy="100" r="95" fill="#d9dedf" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#f4f7f9" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="48" fill="none" stroke="#f4f7f9" strokeWidth="1.5" />
            
            {/* Inner White Center */}
            <circle cx="100" cy="100" r="48" fill="white" />
            
            {/* Color Indicators at top */}
            {/* Green */}
            <path d="M 100 5 L 100 28" stroke="#7cb342" strokeWidth="5" strokeLinecap="square" />
            {/* Yellow */}
            <path d="M 100 30 L 100 48" stroke="#fbc02d" strokeWidth="5" strokeLinecap="square" />
            {/* Red */}
            <path d="M 100 50 L 100 70" stroke="#e53935" strokeWidth="3.5" strokeLinecap="square" />
          </svg>
          
          {/* Center Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div style={{fontSize: '48px', fontWeight: '500', color: '#7cb342', lineHeight: '1'}}>0.0%</div>
            <div style={{fontSize: '16px', color: '#546e7a', marginTop: '8px'}}>Fit für Prüfung</div>
            <BarChart3 size={20} color="#546e7a" className="mt-2 opacity-80" />
          </div>
        </div>

        {/* Right Side: Training List */}
        <div className="flex flex-col w-full max-w-sm gap-4 z-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => onNavigate('/')}
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
            <div style={{fontSize: '22px', color: '#546e7a', fontWeight: '400'}}>
              Training
            </div>
          </div>

          {/* List Items */}
          <div className="flex flex-col gap-3">
            {[
              { title: '30 Fragen üben', icon: <div className="font-bold text-[#2b576b] tracking-wider text-sm flex flex-col leading-none"><span>30</span><span className="text-[8px]">IIII</span></div>, path: '/training/fragen' },
              { title: 'Alle Fragen & Themen', icon: <List size={22} className="text-[#2b576b]" />, path: '/training/fragen' },
              { title: 'Schwerpunkte üben', icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: 'Fragen suchen', icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: '0 letzte Fehler', icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
              { title: '0 markierte Fragen', icon: <CheckCircle size={22} className="text-[#7cb342]" />, path: '/training/fragen' },
            ].map((item, idx) => (
              <button 
                key={idx}
                onClick={() => onNavigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
                  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
                }}
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span style={{fontSize: '15px', fontWeight: '400'}}>{item.title}</span>
                </div>
                <ChevronRight size={18} opacity={0.5} />
              </button>
            ))}
          </div>

        </div>
        </div>
      </div>
    </div>
  );
};
