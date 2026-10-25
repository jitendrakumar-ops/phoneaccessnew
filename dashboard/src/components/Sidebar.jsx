import React from 'react';
import { NavLink } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { DASHBOARD_ROUTES } from '../config/navigation';

export default function Sidebar({ connected, syncing, fetchDB }) {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-glow" />
        <span>ACCESS</span>
      </div>

      <nav>
        <ul className="nav-menu">
          {DASHBOARD_ROUTES.map(route => {
            const Icon = route.icon;
            return (
              <li key={route.key}>
                <NavLink
                  to={route.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  {route.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              boxShadow: connected ? 'var(--glow-emerald)' : 'var(--glow-rose)',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>
            Server: {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginTop: '12px', padding: '8px 12px', fontSize: '12px' }}
          onClick={fetchDB}
        >
          <RefreshCw size={12} className={syncing ? 'spinner' : ''} />
          Refresh Server
        </button>
      </div>
    </aside>
  );
}
