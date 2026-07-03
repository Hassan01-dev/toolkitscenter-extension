import React, { useState } from 'react';

function JwtPanel({ isActive, onBack }) {
  const [tokenText, setTokenText] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [errorMsg, setErrorMsg] = useState(false);

  const handleDecode = () => {
    const token = tokenText.trim();
    if (!token) {
      setDecoded(null);
      setErrorMsg(false);
      return;
    }

    const parsed = parseJwt(token);
    if (parsed) {
      setDecoded(parsed);
      setErrorMsg(false);
    } else {
      setDecoded(null);
      setErrorMsg(true);
    }
  };

  const handleClear = () => {
    setTokenText('');
    setDecoded(null);
    setErrorMsg(false);
  };

  const parseJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const headerDecoded = base64UrlDecode(parts[0]);
      const payloadDecoded = base64UrlDecode(parts[1]);

      return {
        header: JSON.parse(headerDecoded),
        payload: JSON.parse(payloadDecoded)
      };
    } catch (e) {
      return null;
    }
  };

  const base64UrlDecode = (str) => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(decoded, (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (e) {
      return decoded;
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
        <h2 className="detail-title">JWT Decoder</h2>
      </header>

      <p className="detail-desc">Decode headers and payload of JSON Web Tokens.</p>

      <div className="jwt-container">
        <div className="form-group">
          <label htmlFor="jwtInput" className="form-label">
            JWT Token
          </label>
          <textarea
            id="jwtInput"
            className="form-input"
            placeholder="Paste your encoded JWT token here..."
            rows="4"
            value={tokenText}
            onChange={(e) => setTokenText(e.target.value)}
          />
        </div>

        {decoded && (
          <div className="jwt-output-section">
            <div className="jwt-part-title">Header (Algorithm & Type)</div>
            <pre className="jwt-block">{JSON.stringify(decoded.header, null, 2)}</pre>

            <div className="jwt-part-title">Payload (Data Claims)</div>
            <pre className="jwt-block">{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
        )}

        {errorMsg && (
          <div className="jwt-decode-error">
            <span>⚠️ Invalid JWT Token format</span>
          </div>
        )}

        <div className="jwt-actions-row">
          <button className="primary-btn compact-btn" onClick={handleDecode}>
            Decode Token
          </button>
          <button className="secondary-btn compact-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default JwtPanel;
