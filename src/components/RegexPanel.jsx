import React, { useState, useEffect } from 'react';

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 3;
const DEBOUNCE_MS = 350;

const MATCH_COLOR = '#10b981';
const NO_MATCH_COLOR = '#ef4444';

function RegexPanel({ isActive, onBack }) {
  const [pattern, setPattern] = useState('');
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [testValues, setTestValues] = useState(Array(DEFAULT_COUNT).fill(''));
  const [matchResults, setMatchResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedPattern = pattern.trim();
      if (!trimmedPattern) {
        setMatchResults(null);
        setErrorMsg('');
        return;
      }

      let regex;
      try {
        regex = new RegExp(trimmedPattern);
      } catch (e) {
        setMatchResults(null);
        setErrorMsg(`Invalid regex: ${e.message}`);
        return;
      }

      setMatchResults(testValues.map((value) => regex.test(value)));
      setErrorMsg('');
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [pattern, testValues]);

  const handleCountChange = (raw) => {
    const parsed = parseInt(raw, 10);
    const nextCount = Number.isNaN(parsed)
      ? MIN_COUNT
      : Math.min(MAX_COUNT, Math.max(MIN_COUNT, parsed));

    setCount(nextCount);
    setTestValues((prev) => {
      if (nextCount === prev.length) return prev;
      if (nextCount < prev.length) return prev.slice(0, nextCount);
      return [...prev, ...Array(nextCount - prev.length).fill('')];
    });
  };

  const handleValueChange = (index, value) => {
    setTestValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleClear = () => {
    setPattern('');
    setCount(DEFAULT_COUNT);
    setTestValues(Array(DEFAULT_COUNT).fill(''));
    setMatchResults(null);
    setErrorMsg('');
  };

  const getInputStyle = (matched) => {
    if (matched === undefined) return { fontSize: '0.68rem' };

    return {
      fontSize: '0.68rem',
      borderColor: matched ? MATCH_COLOR : NO_MATCH_COLOR,
      backgroundColor: matched ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)'
    };
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
        <h2 className="detail-title">Regex Tester</h2>
      </header>

      <p className="detail-desc">
        Test multiple strings against a pattern. Results update as you type or paste.
      </p>

      <div className="form-group" style={{ marginBottom: '8px' }}>
        <label htmlFor="regexPatternInput" className="form-label">
          Regex Pattern
        </label>
        <input
          id="regexPatternInput"
          type="text"
          className="form-input"
          style={{ fontFamily: 'monospace', fontSize: '0.68rem' }}
          placeholder="e.g. ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </div>

      {errorMsg && (
        <div className="jwt-decode-error" style={{ marginBottom: '10px' }}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      <div
        className="setting-item"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}
      >
        <label htmlFor="regexCountInput" className="form-label" style={{ marginBottom: 0 }}>
          Values to test
        </label>
        <input
          type="number"
          id="regexCountInput"
          className="form-input"
          style={{ padding: '4px 8px', width: '80px', fontSize: '0.72rem' }}
          value={count}
          onChange={(e) => handleCountChange(e.target.value)}
          min={MIN_COUNT}
          max={MAX_COUNT}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        {testValues.map((value, index) => {
          const matched = matchResults?.[index];
          const hasResult = matchResults !== null && matched !== undefined;

          return (
            <div key={index} className="form-group" style={{ margin: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}
              >
                <label
                  htmlFor={`regexValue${index}`}
                  className="form-label"
                  style={{ marginBottom: 0 }}
                >
                  Test value {index + 1}
                </label>
                {hasResult && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      color: matched ? MATCH_COLOR : NO_MATCH_COLOR
                    }}
                  >
                    {matched ? 'Match' : 'No match'}
                  </span>
                )}
              </div>
              <input
                id={`regexValue${index}`}
                type="text"
                className="form-input"
                style={getInputStyle(matched)}
                placeholder={`Enter string ${index + 1}...`}
                value={value}
                onChange={(e) => handleValueChange(index, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      <div className="jwt-actions-row">
        <button className="secondary-btn compact-btn" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}

export default RegexPanel;
