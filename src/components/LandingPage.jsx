import React from 'react';
import { BookOpen, Award, MessageSquare, BarChart3, Settings, LogIn, ChevronRight, HelpCircle, Menu } from 'lucide-react';

export const LandingPage = ({ onNavigate, onShowLogin }) => {
  return (
    <div className="flex flex-col min-h-full bg-[#f4f7f9]" style={{fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"}}>
      
      {/* Dark Teal Header Bar */}
      <div style={{
        background: '#2b576b',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          {/* Traffic Light Icon */}
          <div style={{
            width: '36px', height: '36px', 
            background: 'white', 
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
          }}>
            🚦
          </div>
          <div>
            <div style={{color: 'white', fontSize: '20px', fontWeight: '400', letterSpacing: '0.01em'}}>
              Führerschein <span style={{fontWeight: '300'}}>Web App</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onShowLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Menu / Đăng nhập"
        >
          <Menu size={24} />
        </button>
      </div>

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

        {/* Right Side: Content & Grid */}
        <div className="flex flex-col w-full max-w-sm gap-6 z-10">
          
          {/* Info Text */}
          <div className="text-center">
            <div style={{fontSize: '20px', color: '#7cb342', fontWeight: '400', marginBottom: '8px'}}>Klasse B</div>
            <div style={{fontSize: '15px', color: '#2b576b', fontWeight: '500'}}>Prüfung ab 01.04.2025</div>
          </div>

          {/* 2x2 Navigation Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {/* Training */}
            <button onClick={() => onNavigate('/training')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <BookOpen size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>Training</span>
            </button>

            {/* Prüfung */}
            <button onClick={() => onNavigate('/pruefung')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <Award size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>Prüfung</span>
            </button>

            {/* Statistik */}
            <button onClick={() => onNavigate('/statistik')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <BarChart3 size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>Statistik</span>
            </button>

            {/* Hilfe & Kontakt */}
            <button onClick={() => onNavigate('/chat')} style={{
                background: '#2b576b', border: 'none', borderRadius: '4px', padding: '24px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
              <HelpCircle size={28} strokeWidth={1.5} />
              <span style={{fontSize: '14px', fontWeight: '400'}}>Hilfe & Kontakt</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button onClick={() => onNavigate('/settings')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <Settings size={20} strokeWidth={1.5} />
                <span style={{fontSize: '14px', fontWeight: '400'}}>Einstellungen</span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>
            
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: 'none', borderRadius: '4px', padding: '16px 20px',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2b576b'
            }}>
              <div className="flex items-center gap-4">
                <div style={{width: '20px', height: '20px', background: '#7cb342', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span style={{fontSize: '14px', fontWeight: '400'}}>Freischalten</span>
              </div>
              <ChevronRight size={18} opacity={0.5} />
            </button>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
};
