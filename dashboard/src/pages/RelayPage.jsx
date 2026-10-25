import React from 'react';
import { Send } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function RelayPage() {
  const {
    detectedToken,
    handleRelaySend,
    relayBody,
    relayChannel,
    relayContext,
    relayRecipient,
    relayStatus,
    relayStatusKind,
    setDetectedToken,
    setRelayBody,
    setRelayChannel,
    setRelayRecipient,
  } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div className="glass-panel" style={{ display: 'grid', gap: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Compose Remote Message</h3>
        {relayContext ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px',
              display: 'grid',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Source: {relayContext.sourceType.toUpperCase()} | From: {relayContext.sender || 'Unknown'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>{relayContext.messageText}</div>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>
            SMS ya WhatsApp message par click karke yahan token auto-fill hoga.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Channel</label>
            <select
              className="form-input"
              value={relayChannel}
              onChange={event => setRelayChannel(event.target.value)}
            >
              <option value="sms">SMS</option>
              <option value="rcs">RCS (Google Messages)</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Detected Token</label>
            <input
              className="form-input"
              value={detectedToken}
              onChange={event => setDetectedToken(event.target.value)}
              placeholder="Auto token"
            />
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Recipient Number</label>
            <input
              className="form-input"
              value={relayRecipient}
              onChange={event => setRelayRecipient(event.target.value)}
              placeholder="e.g. 919876543210"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Message</label>
          <textarea
            className="form-input"
            rows={5}
            value={relayBody}
            onChange={event => setRelayBody(event.target.value)}
            placeholder="Type message to send"
            style={{ resize: 'vertical', minHeight: '120px' }}
          />
        </div>

        {relayChannel === 'sms' ? (
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
            SMS will be sent via carrier from the selected phone. This is now the default and most reliable remote-send path.
          </div>
        ) : relayChannel === 'rcs' ? (
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', borderLeft: '3px solid var(--accent-emerald)' }}>
            RCS opens Google Messages and accessibility tries to auto-fill + tap send. Keep accessibility permission enabled on target phone.
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleRelaySend}>
            <Send size={14} /> Send From Selected Phone
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              if (detectedToken) {
                setRelayBody(current => `${current}${current ? ' ' : ''}${detectedToken}`);
              }
            }}
          >
            Insert Token
          </button>
        </div>

        {relayStatus ? (
          <div
            style={{
              color: relayStatusKind === 'error'
                ? 'var(--accent-rose)'
                : relayStatusKind === 'success'
                  ? 'var(--accent-emerald)'
                  : 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            {relayStatus}
          </div>
        ) : null}
      </div>
    </div>
  );
}
