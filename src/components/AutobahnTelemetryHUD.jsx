import React from 'react';

/**
 * 🛣️ AUTOBAHN TELEMETRY & ROUTE NAVIGATION DEBUG HUD
 * Displays real-time empirical physics & topology metrics:
 *  - Player World Position (X, Z) & Heading (deg)
 *  - Current Road ID & Highway Classification (motorway vs motorway_link vs service)
 *  - Active Lane ID & Lane Index (L1, L2, L3)
 *  - Speed (km/h) & Target Steer
 *  - Junction / Ramp Transition State
 */
export const AutobahnTelemetryHUD = ({ telemetry }) => {
  if (!telemetry) return null;

  const {
    carX = 0,
    carZ = 0,
    headingDeg = 0,
    roadId = 'N/A',
    highwayType = 'N/A',
    laneId = 'N/A',
    laneIndex = 0,
    speedKmH = 0,
    isRamp = false,
    junctionTransition = 'NONE'
  } = telemetry;

  const getHighwayBadgeStyle = (hw) => {
    if (hw === 'motorway' || hw === 'trunk') {
      return { background: '#2563eb', color: '#ffffff' }; // Blue for Autobahn Mainline
    }
    if (hw === 'motorway_link') {
      return { background: '#eab308', color: '#000000' }; // Yellow for Ramps
    }
    if (hw === 'service') {
      return { background: '#10b981', color: '#ffffff' }; // Green for Raststätte
    }
    return { background: '#64748b', color: '#ffffff' };
  };

  const badgeStyle = getHighwayBadgeStyle(highwayType);

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      zIndex: 99,
      background: 'rgba(15, 23, 42, 0.92)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#f8fafc',
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 11,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      pointerEvents: 'none',
      width: 320
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 6,
        marginBottom: 6
      }}>
        <span style={{ fontWeight: '800', color: '#38bdf8', letterSpacing: '0.05em' }}>
          🛣️ AUTOBAHN TELEMETRY HUD
        </span>
        <span style={{
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: '900',
          textTransform: 'uppercase',
          ...badgeStyle
        }}>
          {highwayType}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
        <div>Pos (X, Z):</div>
        <div style={{ color: '#fbbf24', textAlign: 'right' }}>
          {carX.toFixed(1)}, {carZ.toFixed(1)}
        </div>

        <div>Heading:</div>
        <div style={{ color: '#fbbf24', textAlign: 'right' }}>
          {headingDeg.toFixed(1)}°
        </div>

        <div>Road ID:</div>
        <div style={{ color: '#cbd5e1', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={roadId}>
          {roadId.length > 16 ? roadId.substring(0, 14) + '...' : roadId}
        </div>

        <div>Active Lane:</div>
        <div style={{ color: '#4ade80', textAlign: 'right', fontWeight: '700' }}>
          {laneId.includes('lane') ? `Lane ${laneIndex}` : laneId}
        </div>

        <div>Speed / Ramp:</div>
        <div style={{ color: '#f43f5e', textAlign: 'right', fontWeight: '700' }}>
          {Math.round(speedKmH)} km/h {isRamp ? '(RAMP)' : ''}
        </div>

        <div>Transition:</div>
        <div style={{ color: junctionTransition !== 'NONE' ? '#a855f7' : '#94a3b8', textAlign: 'right', fontWeight: '700' }}>
          {junctionTransition}
        </div>
      </div>
    </div>
  );
};
