import React from 'react';
import { Smartphone } from 'lucide-react';

export default function EmptyDeviceState() {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Smartphone size={64} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
      <h3>No Devices Registered Yet</h3>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
        Launch the React Native app on the device to establish connection.
      </p>
    </div>
  );
}
