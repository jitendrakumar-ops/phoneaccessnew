import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
      <input
        type="text"
        placeholder="Search logs by keyword or contact details..."
        className="form-input"
        style={{ flex: 1, border: 'none', background: 'transparent' }}
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
      />
    </div>
  );
}
