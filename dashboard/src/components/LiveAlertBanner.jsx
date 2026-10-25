import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function LiveAlertBanner({ liveAlert }) {
  if (!liveAlert) {
    return null;
  }

  return (
    <div
      className="live-alert-banner"
      style={{
        position: 'absolute',
        top: '24px',
        right: '40px',
        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        color: '#000',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'pulse-emerald 2s infinite',
        fontWeight: '600',
      }}
    >
      <ShieldAlert size={24} />
      <div>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.8 }}>Live Event Triggered</div>
        <div style={{ fontSize: '15px', fontWeight: '800' }}>
          {liveAlert.callType} Call Alert: {liveAlert.state}
        </div>
        <div style={{ fontSize: '13px' }}>Number: {liveAlert.incomingNumber || 'Private'}</div>
      </div>
    </div>
  );
}
