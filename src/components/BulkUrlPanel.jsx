import React, { useState } from 'react';

function BulkUrlPanel({ isActive, onBack }) {
  const [urlsText, setUrlsText] = useState('');
  const [openCount, setOpenCount] = useState(0);

  const handleOpenUrls = () => {
    const raw = urlsText.trim();
    if (!raw) return;

    // Split by whitespace (spaces, tabs, newlines) or commas
    const list = raw.split(/[\s,]+/).filter((item) => item.trim().length > 0);

    let opened = 0;
    list.forEach((url) => {
      let targetUrl = url.trim();
      // Simple domain heuristic: if it doesn't start with a protocol, prepend https://
      if (!/^(https?|ftp|file):\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      try {
        chrome.tabs.create({ url: targetUrl, active: false });
        opened++;
      } catch (e) {
        console.error('Failed to open tab for:', targetUrl, e);
      }
    });

    setOpenCount(opened);
    setTimeout(() => setOpenCount(0), 3000);
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
        <h2 className="detail-title">Bulk URL Opener</h2>
      </header>

      <p className="detail-desc">
        Open a list of URLs in separate background tabs. Separate by space, comma, or new lines.
      </p>

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label htmlFor="bulkUrlsInput" className="form-label">
          URLs List
        </label>
        <textarea
          id="bulkUrlsInput"
          className="form-input"
          placeholder="google.com&#10;github.com/trending&#10;https://news.ycombinator.com"
          rows="6"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
        />
      </div>

      {openCount > 0 && (
        <div className="cookie-success" style={{ marginBottom: '12px' }}>
          Opened {openCount} tab{openCount === 1 ? '' : 's'} in the background!
        </div>
      )}

      <button className="primary-btn" onClick={handleOpenUrls} disabled={!urlsText.trim()}>
        <span>Open All Tabs</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '14px', height: '14px' }}
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>
  );
}

export default BulkUrlPanel;
