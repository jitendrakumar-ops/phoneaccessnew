import React from 'react';
import { Send } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function ControlsPage() {
  const { actionGroups, micStatus, openQuickSmsComposer, selectedDeviceId, sendCommand } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div className="glass-panel" style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Remote SMS Control</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Selected phone se direct carrier SMS bhejo. Device online hona chahiye.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openQuickSmsComposer}>
            <Send size={14} /> Open SMS Composer
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '10px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
          Dashboard ab default direct SMS route use karta hai. Agar device offline hai to command dispatch nahi hogi.
        </div>
      </div>

      <div className="controls-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {actionGroups.map(group => (
          <div key={group.title} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{group.title}</h3>
                {group.title === 'Audio Control' && micStatus[selectedDeviceId] === 'recording' && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(244,63,94,0.15)',
                      border: '1px solid rgba(244,63,94,0.5)',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--accent-rose)',
                      animation: 'pulse-rose 1.5s infinite',
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-rose)', display: 'inline-block' }} />
                    REC LIVE
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>{group.subtitle}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.actions.map(actionItem => (
                <button
                  key={`${group.title}-${actionItem.action}`}
                  className={actionItem.className}
                  onClick={() => sendCommand(actionItem.action)}
                >
                  {actionItem.action === 'START_RECORDING'
                    ? (micStatus[selectedDeviceId] === 'recording' ? 'Recording...' : actionItem.label)
                    : actionItem.action === 'STOP_RECORDING'
                      ? (micStatus[selectedDeviceId] === 'recording' ? actionItem.label : 'Stop Recording')
                      : actionItem.label}
                </button>
              ))}
            </div>

            {group.note ? (
              <p style={{ color: 'var(--color-text-darker)', fontSize: '12px', marginTop: '4px' }}>
                {group.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
