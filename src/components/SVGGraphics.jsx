import React from 'react';

export const SVGGraphics = ({ type, className = "w-full h-40 max-w-xs mx-auto my-4 rounded-lg overflow-hidden shadow-md" }) => {
  switch (type) {
    case 'svg-vorfahrt-rechts-links':
      return (
        <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ backgroundColor: '#1E293B' }}>
          {/* Background Grass */}
          <rect width="200" height="200" fill="#155E75" opacity="0.15" />
          <rect x="0" y="0" width="70" height="70" fill="#065F46" />
          <rect x="130" y="0" width="70" height="70" fill="#065F46" />
          <rect x="0" y="130" width="70" height="70" fill="#065F46" />
          <rect x="130" y="130" width="70" height="70" fill="#065F46" />

          {/* Sidewalk border lines */}
          <rect x="68" y="0" width="2" height="200" fill="#94A3B8" />
          <rect x="130" y="0" width="2" height="200" fill="#94A3B8" />
          <rect x="0" y="68" width="200" height="2" fill="#94A3B8" />
          <rect x="0" y="130" width="200" height="2" fill="#94A3B8" />

          {/* Roads (Asphalt) */}
          <rect x="70" y="0" width="60" height="200" fill="#334155" />
          <rect x="0" y="70" width="200" height="60" fill="#334155" />

          {/* Center Lines */}
          <line x1="100" y1="0" x2="100" y2="200" stroke="#FFFFFF" strokeDasharray="6 6" strokeWidth="2.5" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="#FFFFFF" strokeDasharray="6 6" strokeWidth="2.5" />

          {/* Tram Tracks (Coming from the Right) */}
          <g opacity="0.9">
            <line x1="130" y1="92" x2="200" y2="92" stroke="#64748B" strokeWidth="1.5" />
            <line x1="130" y1="96" x2="200" y2="96" stroke="#64748B" strokeWidth="1.5" />
            {/* Track sleepers */}
            <line x1="140" y1="91" x2="140" y2="97" stroke="#475569" strokeWidth="1" />
            <line x1="160" y1="91" x2="160" y2="97" stroke="#475569" strokeWidth="1" />
            <line x1="180" y1="91" x2="180" y2="97" stroke="#475569" strokeWidth="1" />
          </g>

          {/* Yellow Tram (coming from Right/East) */}
          <g transform="translate(145, 90)">
            <rect width="45" height="10" rx="2" fill="#EAB308" stroke="#CA8A04" strokeWidth="1" />
            {/* Windows */}
            <rect x="4" y="2" width="6" height="6" rx="1" fill="#38BDF8" />
            <rect x="14" y="2" width="6" height="6" rx="1" fill="#38BDF8" />
            <rect x="24" y="2" width="6" height="6" rx="1" fill="#38BDF8" />
            <rect x="34" y="2" width="6" height="6" rx="1" fill="#38BDF8" />
            {/* Front headlamp */}
            <circle cx="2" cy="5" r="1.2" fill="#FFFFFF" />
            {/* Pantograph */}
            <path d="M 22 -1 L 26 -4 L 20 -4" stroke="#64748B" strokeWidth="1" fill="none" />
            <text x="22" y="-1" fill="#000" fontSize="7" fontWeight="bold" textAnchor="middle" transform="rotate(90 22 5)"></text>
          </g>
          <text x="167" y="85" fill="#EAB308" fontSize="8" fontWeight="black" textAnchor="middle">TRAM (Right)</text>

          {/* Blue Car (coming from Left/West) */}
          <g transform="translate(20, 105)">
            <rect width="36" height="18" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
            {/* Windshield */}
            <rect x="24" y="2" width="6" height="14" rx="1" fill="#E0F2FE" />
            <rect x="8" y="2" width="12" height="14" rx="1" fill="#E0F2FE" />
            {/* Wheels */}
            <rect x="5" y="-1.5" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="23" y="-1.5" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="5" y="17" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="23" y="17" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            {/* Headlights */}
            <circle cx="35.5" cy="4" r="1.5" fill="#FEF08A" />
            <circle cx="35.5" cy="14" r="1.5" fill="#FEF08A" />
          </g>
          <text x="38" y="137" fill="#38BDF8" fontSize="10" fontWeight="black" textAnchor="middle">CAR A</text>

          {/* Red Car (coming from Bottom/South - Right of Blue Car) */}
          <g transform="translate(75, 145) rotate(-90 18 9)">
            <rect width="36" height="18" rx="4" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            {/* Windshield */}
            <rect x="24" y="2" width="6" height="14" rx="1" fill="#E0F2FE" />
            <rect x="8" y="2" width="12" height="14" rx="1" fill="#E0F2FE" />
            {/* Wheels */}
            <rect x="5" y="-1.5" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="23" y="-1.5" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="5" y="17" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            <rect x="23" y="17" width="8" height="2.5" fill="#0f172a" rx="0.5" />
            {/* Headlights */}
            <circle cx="35.5" cy="4" r="1.5" fill="#FEF08A" />
            <circle cx="35.5" cy="14" r="1.5" fill="#FEF08A" />
          </g>
          <text x="115" y="165" fill="#EF4444" fontSize="10" fontWeight="black" textAnchor="middle">CAR B</text>

          {/* Direction Trajectories */}
          <path d="M 56 114 L 140 114" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="3 3" fill="none" markerEnd="url(#arrow-blue)" />
          {/* Red car turns left */}
          <path d="M 84 150 L 84 114 A 10 10 0 0 1 74 104 L 20 104" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="3 3" fill="none" markerEnd="url(#arrow-red)" />
          
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#EF4444" />
            </marker>
          </defs>
        </svg>
      );

    case 'svg-sign-stop':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Realistic Sky Gradient Background */}
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#skyGrad)" />
          
          {/* Cloud elements */}
          <circle cx="20" cy="30" r="10" fill="#FFFFFF" opacity="0.6" />
          <circle cx="28" cy="32" r="8" fill="#FFFFFF" opacity="0.6" />
          <circle cx="85" cy="25" r="12" fill="#FFFFFF" opacity="0.7" />
          <circle cx="75" cy="28" r="8" fill="#FFFFFF" opacity="0.7" />

          {/* Grass at bottom */}
          <rect x="0" y="80" width="100" height="20" fill="#15803D" />

          {/* Metal Signpost (with 3D shadow) */}
          <rect x="48" y="35" width="4" height="50" fill="#64748B" />
          <rect x="52" y="35" width="2" height="50" fill="#475569" />

          {/* Octagon stop sign board */}
          <g transform="translate(0, -10)">
            {/* Outer Sign Rim Shadow */}
            <polygon points="30,12 70,12 88,30 88,70 70,88 30,88 12,70 12,30" fill="#991B1B" />
            
            {/* White Border */}
            <polygon points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" fill="#FFFFFF" />
            
            {/* Inner Red Fill */}
            <polygon points="31.5,13.5 68.5,13.5 86.5,31.5 86.5,68.5 68.5,86.5 31.5,86.5 13.5,68.5 13.5,31.5" fill="#DC2626" />
            
            {/* STOP text with slight shadow effect */}
            <text x="51" y="59" fill="#7F1D1D" fontFamily="sans-serif" fontSize="21" fontWeight="900" textAnchor="middle" letterSpacing="0.5">STOP</text>
            <text x="50" y="58" fill="#FFFFFF" fontFamily="sans-serif" fontSize="21" fontWeight="900" textAnchor="middle" letterSpacing="0.5">STOP</text>
          </g>
        </svg>
      );

    case 'svg-autobahn':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sky Gradient */}
          <defs>
            <linearGradient id="skyAutobahn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="grassAutobahn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15803D" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#skyAutobahn)" />

          {/* Grass Landscape */}
          <polygon points="0,50 100,50 100,100 0,100" fill="url(#grassAutobahn)" />

          {/* Grey Highway Road Perspective */}
          <polygon points="15,100 45,50 55,50 85,100" fill="#475569" />
          <polygon points="18,100 46,50 54,50 82,100" fill="#334155" />

          {/* Lane marking lines */}
          <polygon points="49.5,50 50.5,50 52,100 48,100" fill="#FFFFFF" opacity="0.6" strokeDasharray="3 3" />
          <polygon points="18,100 19,100 46,50 46.5,50" fill="#FFFFFF" />
          <polygon points="82,100 81,100 54,50 53.5,50" fill="#FFFFFF" />

          {/* Green Overhead Highway Sign Portal (German style) */}
          <g>
            {/* Supporting Steel Legs */}
            <line x1="8" y1="100" x2="8" y2="28" stroke="#94A3B8" strokeWidth="2.5" />
            <line x1="92" y1="100" x2="92" y2="28" stroke="#94A3B8" strokeWidth="2.5" />
            <line x1="5" y1="28" x2="95" y2="28" stroke="#94A3B8" strokeWidth="1.5" />

            {/* Blue Autobahn Sign Board */}
            <rect x="15" y="10" width="70" height="30" rx="3" fill="#005A9C" stroke="#FFFFFF" strokeWidth="1.5" />
            
            {/* Symbol Autobahn Inside Sign */}
            {/* Two highways under a bridge symbol */}
            <g transform="translate(20, 16) scale(0.18)">
              <rect width="50" height="50" fill="none" />
              <path d="M 10 45 L 20 15 M 40 45 L 30 15" stroke="#FFFFFF" strokeWidth="5" />
              <line x1="25" y1="45" x2="25" y2="15" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 4" />
              <path d="M 5 22 L 45 22 M 5 15 L 45 15" stroke="#FFFFFF" strokeWidth="4" />
            </g>

            {/* Text details */}
            <text x="56" y="24" fill="#FFFFFF" fontFamily="sans-serif" fontSize="6.5" fontWeight="900">Autobahn</text>
            <text x="56" y="32" fill="#EAB308" fontFamily="sans-serif" fontSize="6" fontWeight="bold">130 km/h</text>
          </g>
        </svg>
      );

    case 'svg-probezeit':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="warningGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#warningGrad)" stroke="#E2E8F0" strokeWidth="1.5" />
          
          {/* Warning sign background */}
          <circle cx="50" cy="50" r="43" fill="#FFF5F5" stroke="#FEE2E2" strokeWidth="1" />

          {/* Red warning triangle */}
          <polygon points="50,12 10,82 90,82" fill="#FFFFFF" stroke="#DC2626" strokeWidth="8" strokeLinejoin="round" />
          
          {/* Detailed crossed-out Alcohol Beer glass/bottle representation */}
          <g transform="translate(38, 38) scale(0.6)">
            {/* Beer mug outline */}
            <path d="M 10 15 L 10 40 A 5 5 0 0 0 15 45 L 25 45 A 5 5 0 0 0 30 40 L 30 15 Z" fill="#FCD34D" stroke="#000" strokeWidth="2.5" />
            <path d="M 30 20 L 37 20 A 3 3 0 0 1 40 23 L 40 32 A 3 3 0 0 1 37 35 L 30 35" fill="none" stroke="#000" strokeWidth="2.5" />
            {/* Foam head */}
            <ellipse cx="20" cy="13" rx="12" ry="5" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
          </g>

          {/* Red Banning Circle-Slash */}
          <circle cx="50" cy="52" r="18" stroke="#DC2626" strokeWidth="4.5" fill="none" />
          <line x1="37" y1="39" x2="63" y2="65" stroke="#DC2626" strokeWidth="4.5" />

          {/* Text banner */}
          <rect x="25" y="78" width="50" height="12" rx="3" fill="#DC2626" />
          <text x="50" y="87" fill="#FFFFFF" fontFamily="sans-serif" fontSize="9" fontWeight="950" textAnchor="middle" letterSpacing="0.5">0,0 Promille</text>
        </svg>
      );

    case 'svg-sign-yield':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyYield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#skyYield)" />
          
          {/* Cloud */}
          <ellipse cx="78" cy="22" rx="14" ry="7" fill="#FFFFFF" opacity="0.8" />
          
          {/* Country junction representation */}
          <polygon points="0,85 100,85 100,100 0,100" fill="#15803D" />
          <polygon points="20,100 45,65 55,65 80,100" fill="#64748B" />

          {/* Signpost */}
          <rect x="48" y="30" width="4" height="60" fill="#64748B" />
          <rect x="52" y="30" width="1.5" height="60" fill="#475569" />

          {/* Triangle pointing down (Vorfahrt gewähren) */}
          <g transform="translate(0, -5)">
            <polygon points="50,49 11,11 89,11" fill="#991B1B" />
            <polygon points="50,45 15,13 85,13" fill="#FFFFFF" />
            <polygon points="50,37 25,18 75,18" fill="#DC2626" />
            <polygon points="50,33 28,20 72,20" fill="#FFFFFF" />
          </g>
        </svg>
      );

    case 'svg-sign-priority-road':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyPriority" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#skyPriority)" />

          {/* Landscape background */}
          <polygon points="0,80 100,80 100,100 0,100" fill="#166534" />
          <polygon points="0,75 50,68 100,75 100,80 0,80" fill="#15803D" />

          {/* Road */}
          <polygon points="10,100 42,78 48,78 30,100" fill="#475569" />

          {/* Metal pole */}
          <rect x="48" y="32" width="4.5" height="52" fill="#94A3B8" />
          <rect x="51.5" y="32" width="1" height="52" fill="#475569" />

          {/* Priority sign body (yellow diamond rotated) */}
          <g transform="translate(50, 32) scale(0.85)">
            {/* Shadow border */}
            <rect x="-18" y="-18" width="36" height="36" rx="2" transform="rotate(45)" fill="#000" opacity="0.3" />
            {/* Outer white diamond */}
            <rect x="-17" y="-17" width="34" height="34" rx="2" transform="rotate(45)" fill="#FFFFFF" stroke="#000000" strokeWidth="1.8" />
            {/* Inner yellow diamond */}
            <rect x="-11" y="-11" width="22" height="22" rx="1.2" transform="rotate(45)" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.8" />
          </g>
        </svg>
      );

    case 'svg-sign-umweltzone':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#cityGrad)" />
          
          {/* Silhouettes of city buildings in background */}
          <rect x="5" y="45" width="20" height="40" fill="#94A3B8" opacity="0.4" />
          <rect x="18" y="30" width="25" height="55" fill="#94A3B8" opacity="0.3" />
          <rect x="70" y="40" width="22" height="45" fill="#94A3B8" opacity="0.4" />

          {/* Sidewalk */}
          <rect x="0" y="80" width="100" height="20" fill="#64748B" />

          {/* Post */}
          <rect x="48" y="25" width="4.5" height="60" fill="#94A3B8" stroke="#475569" strokeWidth="0.5" />

          {/* Umweltzone Sign Frame */}
          <g transform="translate(0, -6)">
            {/* Outer Rectangular Border */}
            <rect x="25" y="10" width="50" height="52" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2.2" />
            
            {/* "Umwelt" and "zone" text */}
            <text x="50" y="21" fill="#000000" fontFamily="sans-serif" fontSize="7.5" fontWeight="950" textAnchor="middle" letterSpacing="0.2">UMWELT</text>
            
            {/* Red Circle */}
            <circle cx="50" cy="36" r="11" stroke="#DC2626" strokeWidth="2.5" fill="#FFFFFF" />
            <text x="50" y="38.5" fill="#DC2626" fontFamily="sans-serif" fontSize="7.5" fontWeight="900" textAnchor="middle">GIS</text>

            {/* Plakette indicator */}
            <circle cx="50" cy="53" r="5" fill="#16A34A" />
            <text x="50" y="55.5" fill="#FFFFFF" fontFamily="sans-serif" fontSize="6.5" fontWeight="950" textAnchor="middle">4</text>
          </g>
        </svg>
      );

    case 'svg-sign-kreisverkehr':
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyKreis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="12" fill="url(#skyKreis)" />

          {/* Grass Landscape */}
          <polygon points="0,75 100,75 100,100 0,100" fill="#15803D" />

          {/* Pole */}
          <rect x="48" y="30" width="4.5" height="55" fill="#94A3B8" stroke="#475569" strokeWidth="0.5" />

          {/* Blue circle sign (Kreisverkehr) */}
          <g transform="translate(50, 32) scale(0.9)">
            {/* Outer Blue Circle */}
            <circle cx="0" cy="0" r="23" fill="#005A9C" stroke="#FFFFFF" strokeWidth="2" />
            
            {/* White Circular Arrows */}
            <g transform="rotate(20)">
              {/* Arrow 1 */}
              <path d="M 0 -16 A 16 16 0 0 1 14 8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Arrow 2 */}
              <path d="M 14 8 A 16 16 0 0 1 -14 8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Arrow 3 */}
              <path d="M -14 8 A 16 16 0 0 1 0 -16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
              
              {/* Arrowheads */}
              <path d="M 2 -20 L -1 -16 L 3 -13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 18 5 L 14 8 L 14 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M -16 3 L -14 8 L -19 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </g>
        </svg>
      );

    default:
      return null;
  }
};
