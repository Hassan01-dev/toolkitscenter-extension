import React, { useState } from 'react';

function Base64Panel({ isActive, onBack }) {
  const [mode, setMode] = useState('text'); // 'text' or 'file'
  const [rawText, setRawText] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // File states
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy Data URI');

  const handleEncodeText = () => {
    try {
      // Safe unicode encoding
      const encoded = btoa(
        encodeURIComponent(rawText).replace(/%([0-9A-F]{2})/g, (match, p1) => {
          return String.fromCharCode(parseInt(p1, 16));
        })
      );
      setBase64Text(encoded);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Failed to encode text');
    }
  };

  const handleDecodeText = () => {
    try {
      // Safe unicode decoding
      const decoded = decodeURIComponent(
        atob(base64Text)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      setRawText(decoded);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg('Invalid Base64 string for decoding');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(2)} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyFileBase64 = async () => {
    if (!fileBase64) return;
    try {
      await navigator.clipboard.writeText(fileBase64);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy Data URI'), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
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
        <h2 className="detail-title">Base64 Encoder</h2>
      </header>

      <p className="detail-desc">
        Encode or decode strings, and convert local files to Base64 data URI.
      </p>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '6px',
          marginBottom: '10px'
        }}
      >
        <button
          className={`tab-btn ${mode === 'text' ? 'active' : ''}`}
          onClick={() => setMode('text')}
          style={{ padding: '2px 10px', fontSize: '0.64rem' }}
        >
          Text Mode
        </button>
        <button
          className={`tab-btn ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
          style={{ padding: '2px 10px', fontSize: '0.64rem' }}
        >
          File to DataURI
        </button>
      </div>

      {mode === 'text' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="base64RawInput" className="form-label">
              Plain Text
            </label>
            <textarea
              id="base64RawInput"
              className="form-input"
              style={{ fontSize: '0.68rem', padding: '6px' }}
              rows="3"
              placeholder="Enter plain text here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="secondary-btn compact-btn"
              onClick={handleEncodeText}
              disabled={!rawText}
              style={{ flexGrow: 1, fontSize: '0.68rem' }}
            >
              Encode ⬇️
            </button>
            <button
              className="secondary-btn compact-btn"
              onClick={handleDecodeText}
              disabled={!base64Text}
              style={{ flexGrow: 1, fontSize: '0.68rem' }}
            >
              Decode ⬆️
            </button>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="base64EncodedOutput" className="form-label">
              Base64 Encoded
            </label>
            <textarea
              id="base64EncodedOutput"
              className="form-input"
              style={{ fontSize: '0.68rem', padding: '6px', fontFamily: 'monospace' }}
              rows="3"
              placeholder="Base64 output..."
              value={base64Text}
              onChange={(e) => setBase64Text(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="jwt-decode-error" style={{ fontSize: '0.64rem', padding: '6px' }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group">
            <label className="form-label">Choose File</label>
            <input
              type="file"
              className="form-input"
              onChange={handleFileChange}
              style={{ fontSize: '0.68rem', padding: '4px' }}
            />
          </div>

          {fileName && (
            <div className="cookie-details-card" style={{ padding: '8px', fontSize: '0.68rem' }}>
              <div className="cookie-details-title">File Details</div>
              <div
                className="cookie-details-value"
                style={{ fontSize: '0.72rem', color: '#fff', wordBreak: 'break-all' }}
              >
                {fileName} ({fileSize})
              </div>
            </div>
          )}

          {fileBase64 && (
            <div className="jwt-output-section" style={{ margin: 0 }}>
              <div className="jwt-part-title">Data URI Base64 String</div>
              <pre className="jwt-block" style={{ maxHeight: '90px', fontSize: '0.64rem' }}>
                {fileBase64}
              </pre>
              <button
                className="primary-btn compact-btn"
                onClick={handleCopyFileBase64}
                style={{
                  marginTop: '6px',
                  backgroundColor: copyLabel === 'Copied!' ? '#10b981' : '',
                  borderColor: copyLabel === 'Copied!' ? '#10b981' : ''
                }}
              >
                {copyLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Base64Panel;
