import React, { useState } from 'react';

function HashPanel({ isActive, onBack }) {
  const [inputText, setInputText] = useState('');
  const [md5Val, setMd5Val] = useState('');
  const [sha256Val, setSha256Val] = useState('');
  const [copyLabels, setCopyLabels] = useState({ md5: 'Copy', sha256: 'Copy' });

  // Custom short MD5 implementation
  const calculateMd5 = (str) => {
    var k = [],
      i = 0;
    for (; i < 64;) {
      k[i] = (Math.sin(++i) * 4294967296) | 0;
    }
    var h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476],
      words = (function (str) {
        var words = [],
          i = 0,
          len = str.length * 8;
        for (; i < len; i += 8) {
          words[i >> 5] |= (str.charCodeAt(i / 8) & 255) << (i % 32);
        }
        return words;
      })(str);
    words[str.length >> 2] |= 128 << ((str.length % 4) * 8);
    words[(((str.length + 8) >> 6) << 4) + 14] = str.length * 8;

    var a, b, c, d, f, g, temp;
    for (i = 0; i < words.length; i += 16) {
      a = h[0];
      b = h[1];
      c = h[2];
      d = h[3];
      for (let j = 0; j < 64; j++) {
        if (j < 16) {
          f = (b & c) | (~b & d);
          g = j;
        } else if (j < 32) {
          f = (d & b) | (~d & c);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = b ^ c ^ d;
          g = (3 * j + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * j) % 16;
        }
        temp = d;
        d = c;
        c = b;
        b =
          b +
          (function (x, y) {
            return (x << y) | (x >>> (32 - y));
          })(
            a + f + k[j] + (words[i + g] || 0),
            [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][(j >> 4) * 4 + (j % 4)]
          );
        a = temp;
      }
      h[0] += a;
      h[1] += b;
      h[2] += c;
      h[3] += d;
    }
    for (i = 0, str = ''; i < 4; i++) {
      for (let j = 0; j < 32; j += 8) {
        str += ((h[i] >> j) & 255).toString(16).padStart(2, '0');
      }
    }
    return str;
  };

  // Browser-native SHA-256 using SubtleCrypto
  const calculateSha256 = async (str) => {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleGenerate = async () => {
    const text = inputText;
    if (!text) {
      setMd5Val('');
      setSha256Val('');
      return;
    }

    try {
      setMd5Val(calculateMd5(text));
      setSha256Val(await calculateSha256(text));
    } catch (e) {
      console.error('Hash calculation failed:', e);
    }
  };

  const handleCopy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabels((prev) => ({ ...prev, [key]: 'Copied!' }));
      setTimeout(() => {
        setCopyLabels((prev) => ({ ...prev, [key]: 'Copy' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy hash:', err);
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
            stroke-width="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2 className="detail-title">Hash Generator</h2>
      </header>

      <p className="detail-desc">Compute secure cryptographic digests from input text.</p>

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label htmlFor="hashInputVal" className="form-label">
          Plain Text Input
        </label>
        <textarea
          id="hashInputVal"
          className="form-input"
          placeholder="Type text here..."
          rows="3"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      {(md5Val || sha256Val) && (
        <div
          className="color-preview-section"
          style={{
            padding: '10px',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '6px',
            marginBottom: '8px'
          }}
        >
          <div className="value-item">
            <span className="value-label" style={{ width: '58px' }}>
              MD5
            </span>
            <input type="text" className="value-input" value={md5Val} readOnly />
            <button
              className="copy-val-btn"
              onClick={() => handleCopy(md5Val, 'md5')}
              style={{
                backgroundColor: copyLabels.md5 === 'Copied!' ? '#10b981' : '',
                borderColor: copyLabels.md5 === 'Copied!' ? '#10b981' : ''
              }}
            >
              {copyLabels.md5}
            </button>
          </div>
          <div className="value-item">
            <span className="value-label" style={{ width: '58px' }}>
              SHA-256
            </span>
            <input type="text" className="value-input" value={sha256Val} readOnly />
            <button
              className="copy-val-btn"
              onClick={() => handleCopy(sha256Val, 'sha256')}
              style={{
                backgroundColor: copyLabels.sha256 === 'Copied!' ? '#10b981' : '',
                borderColor: copyLabels.sha256 === 'Copied!' ? '#10b981' : ''
              }}
            >
              {copyLabels.sha256}
            </button>
          </div>
        </div>
      )}

      <button className="primary-btn" onClick={handleGenerate}>
        Generate Hashes
      </button>
    </div>
  );
}

export default HashPanel;
