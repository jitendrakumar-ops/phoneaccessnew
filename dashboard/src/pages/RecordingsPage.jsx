import React from 'react';
import { Pause, Play } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function RecordingsPage() {
  const { filteredRecordings, handlePlayAudio, playingAudioUrl, sendCommand, socketServerUrl } = useDashboard();

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Audio Records</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Remote voice recordings and calls audio files.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-danger" onClick={() => sendCommand('START_RECORDING')}>
            Record Mic
          </button>
          <button className="btn btn-outline" onClick={() => sendCommand('STOP_RECORDING')}>
            Stop Record & Sync
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Captured Timestamp</th>
              <th>Audio Player</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecordings.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                  No ambient voice logs captured yet
                </td>
              </tr>
            ) : (
              filteredRecordings.map((rec, index) => (
                <tr key={index}>
                  <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {rec.filename}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        color: 'var(--accent-rose)',
                      }}
                    >
                      Recording
                    </span>
                  </td>
                  <td>{new Date(rec.timestamp).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', display: 'flex', gap: '8px', minWidth: '110px' }}
                      onClick={() => handlePlayAudio(rec.fileUrl)}
                    >
                      {playingAudioUrl === `${socketServerUrl}${rec.fileUrl}` ? (
                        <>
                          <Pause size={14} /> Pause
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Play
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
