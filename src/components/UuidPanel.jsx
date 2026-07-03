import React, { useState } from 'react';

function UuidPanel({ isActive, onBack }) {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [hyphen, setHyphen] = useState(true);
  const [output, setOutput] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy All');

  const generateUUIDv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleGenerate = () => {
    const list = [];
    const loopCount = Math.max(1, count);
    for (let i = 0; i < loopCount; i++) {
      let uuid = generateUUIDv4();
      if (!hyphen) uuid = uuid.replace(/-/g, '');
      if (upper) uuid = uuid.toUpperCase();
      list.push(uuid);
    }
    setOutput(list.join('\n'));
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy All'), 1500);
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
        <h2 className="detail-title">UUID Generator (V4)</h2>
      </header>

      <p className="detail-desc">Generate bulk Version-4 RFC4122 UUID tokens.</p>

      <div
        className="setting-item"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}
      >
        <label htmlFor="uuidCountInput" className="form-label" style={{ marginBottom: 0 }}>
          Count to generate
        </label>
        <input
          type="number"
          id="uuidCountInput"
          className="form-input"
          style={{ padding: '4px 8px', width: '80px', fontSize: '0.72rem' }}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10))}
          min="1"
          max="100"
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
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
          Uppercase
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
          <input type="checkbox" checked={hyphen} onChange={(e) => setHyphen(e.target.checked)} />{' '}
          Include Hyphens
        </label>
      </div>

      {output && (
        <div className="jwt-output-section" style={{ marginBottom: '12px' }}>
          <pre className="jwt-block" style={{ maxHeight: '120px', fontSize: '0.68rem' }}>
            {output}
          </pre>
        </div>
      )}

      <div className="jwt-actions-row">
        <button className="primary-btn compact-btn" onClick={handleGenerate}>
          Generate
        </button>
        <button
          className="secondary-btn compact-btn"
          onClick={handleCopy}
          disabled={!output}
          style={{
            backgroundColor: copyLabel === 'Copied!' ? '#10b981' : '',
            borderColor: copyLabel === 'Copied!' ? '#10b981' : ''
          }}
        >
          {copyLabel}
        </button>
      </div>
    </div>
  );
}

export default UuidPanel;
