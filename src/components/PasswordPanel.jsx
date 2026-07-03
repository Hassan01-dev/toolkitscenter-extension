import React, { useState } from 'react';

function PasswordPanel({ isActive, onBack }) {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [num, setNum] = useState(true);
  const [sym, setSym] = useState(true);
  const [output, setOutput] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy');

  const handleGenerate = () => {
    let charsVal = '';
    if (upper) charsVal += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) charsVal += 'abcdefghijklmnopqrstuvwxyz';
    if (num) charsVal += '0123456789';
    if (sym) charsVal += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charsVal) {
      setOutput('Please select options!');
      return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charsVal.charAt(Math.floor(Math.random() * charsVal.length));
    }
    setOutput(password);
  };

  const handleCopy = async () => {
    if (!output || output === 'Please select options!') return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 1500);
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
        <h2 className="detail-title">Password Generator</h2>
      </header>

      <p className="detail-desc">Generate highly secure randomized password strings.</p>

      <div
        className="setting-item"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}
      >
        <label htmlFor="passwordLengthSlider" className="form-label" style={{ marginBottom: 0 }}>
          Length: <span>{length}</span>
        </label>
        <input
          type="range"
          id="passwordLengthSlider"
          className="form-slider"
          min="6"
          max="32"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10))}
          style={{ width: '140px' }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 16px',
          marginBottom: '12px'
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />{' '}
          Uppercase (A-Z)
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} />{' '}
          Lowercase (a-z)
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <input type="checkbox" checked={num} onChange={(e) => setNum(e.target.checked)} /> Numbers
          (0-9)
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          <input type="checkbox" checked={sym} onChange={(e) => setSym(e.target.checked)} /> Symbols
          (!@#$)
        </label>
      </div>

      <div
        className="value-item"
        style={{
          marginBottom: '12px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          padding: '8px',
          borderRadius: '6px'
        }}
      >
        <input
          type="text"
          className="value-input"
          style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}
          value={output}
          readOnly
        />
        <button
          className="copy-val-btn"
          onClick={handleCopy}
          disabled={!output || output === 'Please select options!'}
          style={{
            padding: '4px 10px',
            backgroundColor: copyLabel === 'Copied!' ? '#10b981' : '',
            borderColor: copyLabel === 'Copied!' ? '#10b981' : ''
          }}
        >
          {copyLabel}
        </button>
      </div>

      <button className="primary-btn" onClick={handleGenerate}>
        Generate Password
      </button>
    </div>
  );
}

export default PasswordPanel;
