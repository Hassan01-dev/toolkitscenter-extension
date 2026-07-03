import React, { useState } from 'react';

function ScreenshotPanel({ isActive, onBack, activeTab, triggerError, setCaptureProgress }) {
  const [mode, setMode] = useState('full');
  const [delay, setDelay] = useState(250);

  const handleCapture = async () => {
    if (!activeTab) return;
    setCaptureProgress({ percent: 0, step: 'preparing' });

    if (mode === 'full') {
      chrome.runtime.sendMessage(
        {
          action: 'start_capture',
          tabId: activeTab.id,
          options: { hideSticky: true, scrollDelay: delay }
        },
        (response) => {
          setCaptureProgress(null);
          if (chrome.runtime.lastError) {
            triggerError(`Runtime error: ${chrome.runtime.lastError.message}`);
            return;
          }
          if (response && !response.success) {
            triggerError(response.error || 'Failed to capture full page.');
          }
        }
      );
    } else {
      chrome.runtime.sendMessage(
        {
          action: 'start_visible_capture',
          tabId: activeTab.id
        },
        (response) => {
          setCaptureProgress(null);
          if (chrome.runtime.lastError) {
            triggerError(`Runtime error: ${chrome.runtime.lastError.message}`);
            return;
          }
          if (response && !response.success) {
            triggerError(response.error || 'Failed to capture visible viewport.');
          }
        }
      );
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
        <h2 className="detail-title">Screen Capture</h2>
      </header>

      <p className="detail-desc">Capture full scrollable pages or visible screen areas.</p>

      <div className="form-group">
        <div
          className="setting-item"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <label htmlFor="captureModeSelect" className="form-label" style={{ marginBottom: 0 }}>
            Capture Mode
          </label>
          <select
            id="captureModeSelect"
            className="form-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          >
            <option value="full">Full Page (Auto-Scroll)</option>
            <option value="visible">Visible Viewport</option>
          </select>
        </div>

        {mode === 'full' && (
          <div
            className="setting-item"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <label htmlFor="scrollDelay" className="form-label" style={{ marginBottom: 0 }}>
              Scroll delay (ms)
            </label>
            <select
              id="scrollDelay"
              className="form-select"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value, 10))}
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            >
              <option value={150}>150ms (Fast)</option>
              <option value={250}>250ms (Normal)</option>
              <option value={500}>500ms (Slow pages)</option>
              <option value={800}>800ms (Heavy pages)</option>
            </select>
          </div>
        )}
      </div>

      <button className="primary-btn" onClick={handleCapture} style={{ marginTop: 'auto' }}>
        <span>Capture Screen</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '14px', height: '14px' }}
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  );
}

export default ScreenshotPanel;
