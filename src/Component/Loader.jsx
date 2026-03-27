import React from 'react';

const Loader = ({ size = 40, text = "Loading..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      gap: '16px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <style>{`
        @keyframes rotateSpinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer pulsing ring */}
        <div style={{
          position: 'absolute',
          top: -8, left: -8, right: -8, bottom: -8,
          borderRadius: '50%',
          border: '2px solid #0B2F5B',
          opacity: 0.2,
          animation: 'pulseRing 2s ease-in-out infinite'
        }} />
        
        {/* Main rotating spinner */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#0B2F5B',
          borderRightColor: '#1a4a8a',
          animation: 'rotateSpinner 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
        }} />
        
        {/* Inner dot */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.25, height: size * 0.25,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0B2F5B, #1a4a8a)'
        }} />
      </div>

      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.5px'
      }}>
        {text}
      </div>
    </div>
  );
};

export default Loader;
