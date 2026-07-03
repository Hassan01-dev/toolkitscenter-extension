import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

function QrCodePanel({ isActive, onBack, activeTab }) {
  const [inputText, setInputText] = useState('');
  const canvasRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Set the current tab URL as initial input when active
  useEffect(() => {
    if (isActive && activeTab && activeTab.url) {
      setInputText(activeTab.url);
    }
  }, [isActive, activeTab]);

  // Redraw QR code whenever input changes
  useEffect(() => {
    if (!inputText.trim()) {
      // Clear canvas if input is empty
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    QRCode.toCanvas(
      canvasRef.current,
      inputText,
      {
        width: 130,
        margin: 1,
        color: {
          dark: '#0f172a', // Slate-900 matching the logo/slate theme
          light: '#f8fafc' // Slate-50 background
        }
      },
      (err) => {
        if (err) {
          console.error('QR Code render error:', err);
          setErrorMsg('Failed to generate QR code');
        } else {
          setErrorMsg('');
        }
      }
    );
  }, [inputText]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('QR download failed:', e);
    }
  };

  return (
    <div className={`detail-panel ${isActive ? 'active' : ''}`}>
      <header className="detail-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2 className="detail-title">QR Code Generator</h2>
      </header>

      <p className="detail-desc">Generate a QR code from text or link. Downloads as PNG.</p>

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label htmlFor="qrInputText" className="form-label">
          Data Text or URL
        </label>
        <input
          type="text"
          id="qrInputText"
          className="form-input"
          style={{ padding: '6px 8px' }}
          placeholder="Type or paste link..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          margin: '8px 0 12px'
        }}
      >
        <div
          style={{
            background: '#f8fafc',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '146px',
            height: '146px',
            border: '1px solid var(--border-color)'
          }}
        >
          <canvas ref={canvasRef} style={{ width: '130px', height: '130px' }}></canvas>
        </div>

        {errorMsg && <div className="jwt-decode-error">{errorMsg}</div>}

        <button
          className="secondary-btn compact-btn"
          onClick={handleDownload}
          disabled={!inputText.trim()}
          style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '12px', height: '12px' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  );
}

export default QrCodePanel;
