import React from 'react';

export default function Topbar({ activeRoute, db, selectedDeviceId, setSelectedDeviceId }) {
  return (
    <div className="topbar-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 className="section-title">{activeRoute.title}</h1>
        <p className="section-desc">{activeRoute.description}</p>
      </div>

      <div className="device-selector-row" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Target Device:</span>
        <select
          value={selectedDeviceId}
          onChange={event => setSelectedDeviceId(event.target.value)}
          className="form-input device-selector-input"
          style={{ paddingRight: '36px', appearance: 'none', background: 'rgba(255, 255, 255, 0.05)' }}
        >
          {Object.keys(db.devices).length === 0 ? (
            <option value="">No devices registered</option>
          ) : (
            Object.keys(db.devices).map(id => (
              <option key={id} value={id}>
                {db.devices[id].deviceName} ({id})
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
