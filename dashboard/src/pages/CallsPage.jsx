import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function CallsPage() {
  const { filteredCallLogs, sendCommand } = useDashboard();

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Call Logs History</h3>
        <button className="btn btn-outline" onClick={() => sendCommand('FETCH_CALL_LOGS')}>
          <RefreshCw size={14} /> Request Call History
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Call Type</th>
              <th>Duration (Secs)</th>
              <th>Date Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredCallLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                  No call logs found matching query
                </td>
              </tr>
            ) : (
              filteredCallLogs.map((log, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600' }}>{log.name || 'Unknown Contact'}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{log.phoneNumber}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: log.type === 'INCOMING'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : log.type === 'OUTGOING'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                        color: log.type === 'INCOMING'
                          ? 'var(--accent-emerald)'
                          : log.type === 'OUTGOING'
                            ? 'var(--accent-cyan)'
                            : 'var(--accent-rose)',
                      }}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td>{log.duration}s</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {log.dateTime || new Date(Number(log.timestamp)).toLocaleString()}
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
