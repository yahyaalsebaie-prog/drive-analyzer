// src/components/SettingsModal.jsx
import React, { useState } from 'react';

export default function SettingsModal({ onSave, onClose, current }) {
  const [apiKey, setApiKey] = useState(current?.apiKey || '');
  const [clientId, setClientId] = useState(current?.clientId || '');

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #dde1f0',
    borderRadius: 8, fontSize: 13, boxSizing: 'border-box',
    fontFamily: 'monospace', outline: 'none',
  };
  const labelStyle = { fontSize: 12, color: '#6b7280', marginBottom: 5, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, width: 480,
        maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, color: '#111827' }}>Google API Credentials</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          Get these from{' '}
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
            style={{ color: '#1a73e8' }}>console.cloud.google.com</a>
          {' '}→ APIs & Services → Credentials
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>API Key</label>
          <input style={inputStyle} value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="AIzaSy..." />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>OAuth 2.0 Client ID</label>
          <input style={inputStyle} value={clientId} onChange={e => setClientId(e.target.value)}
            placeholder="xxxxxxxx.apps.googleusercontent.com" />
        </div>

        <div style={{
          background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#1e40af', lineHeight: 1.6,
        }}>
          <strong>Required setup in Google Cloud Console:</strong><br />
          1. Enable <strong>Drive API</strong> + <strong>Sheets API</strong><br />
          2. Create OAuth 2.0 Client ID → <strong>Web application</strong><br />
          3. Add your Vercel URL to <strong>Authorized JavaScript origins</strong><br />
          4. Create an API Key (restrict to Drive + Sheets APIs)
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button
            onClick={() => onSave({ apiKey, clientId })}
            disabled={!apiKey || !clientId}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: (!apiKey || !clientId) ? '#93c5fd' : '#1a73e8',
              color: '#fff', cursor: (!apiKey || !clientId) ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>Save & Connect</button>
        </div>
      </div>
    </div>
  );
}
