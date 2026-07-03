import React, { useState, useEffect } from 'react';
import ScreenshotPanel from './components/ScreenshotPanel.jsx';
import ColorPickerPanel from './components/ColorPickerPanel.jsx';
import JwtPanel from './components/JwtPanel.jsx';
import PasswordPanel from './components/PasswordPanel.jsx';
import UuidPanel from './components/UuidPanel.jsx';
import CookieClearPanel from './components/CookieClearPanel.jsx';
import HashPanel from './components/HashPanel.jsx';
import BulkUrlPanel from './components/BulkUrlPanel.jsx';
import QrCodePanel from './components/QrCodePanel.jsx';
import Base64Panel from './components/Base64Panel.jsx';
import LoremIpsumPanel from './components/LoremIpsumPanel.jsx';

function App() {
  const [activePanel, setActivePanel] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState(null);
  const [tabError, setTabError] = useState(null);
  const [captureProgress, setCaptureProgress] = useState(null);
  const [lastError, setLastError] = useState(null);

  // Analyze active tab on load
  useEffect(() => {
    const analyzeTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setActiveTab(tab);

        if (!tab || !tab.url) {
          setTabError('No active tab detected.');
          return;
        }

        const url = tab.url;
        if (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('devtools://') ||
          url.startsWith('view-source:') ||
          url.includes('chromewebstore.google.com') ||
          url.includes('chrome.google.com/webstore')
        ) {
          setTabError('System/Web Store pages block script capturing and cookie queries.');
        }
      } catch (err) {
        console.error('Error analyzing active tab:', err);
        setTabError('Failed to analyze active tab details.');
      }
    };

    analyzeTab();

    // Check for last capture error from local storage
    chrome.storage.local.get('last_capture_error', (data) => {
      if (data.last_capture_error) {
        setLastError(`Last capture failed: ${data.last_capture_error}`);
        chrome.storage.local.remove('last_capture_error');
      }
    });

    // Listen to capture progress notifications
    const progressListener = (message) => {
      if (message.action === 'capture_progress') {
        setCaptureProgress({
          percent: message.percent,
          step: message.step
        });
      }
    };
    chrome.runtime.onMessage.addListener(progressListener);

    return () => {
      chrome.runtime.onMessage.removeListener(progressListener);
    };
  }, []);

  // Reset scroll offsets when navigating to/from any detail panel
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }
    const panels = document.querySelectorAll('.detail-panel');
    panels.forEach((p) => {
      p.scrollTop = 0;
    });
  }, [activePanel]);

  const triggerError = (msg) => {
    setLastError(msg);
    setTimeout(() => setLastError(null), 6000);
  };

  const isScreenshotDisabled = tabError !== null;

  const tools = [
    {
      id: 'screenshot',
      title: 'Screen Capture',
      desc: 'Save page as PNG or PDF',
      cat: 'media',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      ),
      disabled: isScreenshotDisabled
    },
    {
      id: 'color',
      title: 'Color Picker',
      desc: 'Grab hex/rgb values from web',
      cat: 'media',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 22 1-1c.7-.7 1.8-.7 2.5 0l2 2"></path>
          <path d="M12.5 5.5 19 12"></path>
          <path d="m22 2-3 3-3.5-3.5L19 1"></path>
          <path d="m19 5-8.5 8.5c-.7.7-1.5 1.2-2.5 1.5L5 16l1-3c.3-1 .8-1.8 1.5-2.5L16 2z"></path>
        </svg>
      )
    },
    {
      id: 'jwt',
      title: 'JWT Decoder',
      desc: 'Inspect JSON Web Tokens',
      cat: 'utils',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
      )
    },
    {
      id: 'password',
      title: 'Pass Generator',
      desc: 'Generate secure passwords',
      cat: 'generators',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <circle cx="12" cy="16" r="2"></circle>
          <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
        </svg>
      )
    },
    {
      id: 'uuid',
      title: 'UUID Gen (V4)',
      desc: 'Create bulk version 4 UUIDs',
      cat: 'generators',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M3 16V8a5 5 0 0 1 10 0v8a5 5 0 0 1-10 0z"></path>
          <path d="M11 16V8a5 5 0 0 1 10 0v8a5 5 0 0 1-10 0z"></path>
        </svg>
      )
    },

    {
      id: 'cookie',
      title: 'Cookie Clear',
      desc: 'Clean cookies for the current tab',
      cat: 'utils',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"></path>
          <circle cx="8.5" cy="8.5" r="1"></circle>
          <circle cx="11.5" cy="11.5" r="1"></circle>
          <circle cx="15.5" cy="8.5" r="1"></circle>
          <circle cx="14.5" cy="14.5" r="1"></circle>
        </svg>
      ),
      disabled: isScreenshotDisabled
    },
    {
      id: 'hash',
      title: 'Hash Generator',
      desc: 'Generate MD5, SHA-256 digests',
      cat: 'utils',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    {
      id: 'bulkurl',
      title: 'Bulk URL Opener',
      desc: 'Open multi-links in background tabs',
      cat: 'utils',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      )
    },
    {
      id: 'qrcode',
      title: 'QR Code Gen',
      desc: 'Create QR codes from links/text',
      cat: 'media',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="9" height="9"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      id: 'base64',
      title: 'Base64 Encoder',
      desc: 'Encode/decode text or files to Base64',
      cat: 'utils',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
      )
    },
    {
      id: 'lorem',
      title: 'Placeholder Gen',
      desc: 'Generate Lorem Ipsum dummy text',
      cat: 'generators',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="app-container">
      {/* Header */}
      {activePanel === null && (
        <header className="app-header">
          <div className="logo-group">
            <img className="logo-icon" src="/icons/icon-48.png" alt="Toolkitscenter" />
            <h1 className="logo-text">
              Toolkits<span>center</span>
            </h1>
          </div>
          <p className="app-subtitle">Devtools Utility Pack</p>
        </header>
      )}

      {/* Error/Notice Banner */}
      {activePanel === null && (lastError || tabError) && (
        <div className="message-banner">
          <span className="banner-icon">⚠️</span>
          <span className="banner-text">{lastError || tabError}</span>
        </div>
      )}

      {/* Category Tabs Filter */}
      {activePanel === null && (
        <nav className="category-tabs">
          {['all', 'media', 'generators', 'utils'].map((cat) => (
            <button
              key={cat}
              className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </nav>
      )}

      {/* Dashboard Grid */}
      {activePanel === null && (
        <main className="dashboard-grid">
          {tools
            .filter((t) => activeCategory === 'all' || t.cat === activeCategory)
            .map((tool) => (
              <section
                key={tool.id}
                className={`tool-card ${tool.disabled ? 'disabled-tool' : ''}`}
                onClick={() => !tool.disabled && setActivePanel(tool.id)}
              >
                <div className="tool-header">
                  <div className="tool-icon">{tool.icon}</div>
                  <div className="tool-meta">
                    <h2 className="tool-title">{tool.title}</h2>
                    <p className="tool-desc">{tool.desc}</p>
                  </div>
                </div>
              </section>
            ))}
        </main>
      )}

      {/* Footer */}
      {activePanel === null && (
        <footer className="app-footer">
          For more tools visit{' '}
          <a href="https://toolkitscenter.com/" target="_blank" rel="noopener noreferrer">
            toolkitscenter.com
          </a>
        </footer>
      )}

      {/* Slide-in Panels */}
      <ScreenshotPanel
        isActive={activePanel === 'screenshot'}
        onBack={() => setActivePanel(null)}
        activeTab={activeTab}
        triggerError={triggerError}
        setCaptureProgress={setCaptureProgress}
      />

      <ColorPickerPanel
        isActive={activePanel === 'color'}
        onBack={() => setActivePanel(null)}
        activeTab={activeTab}
        triggerError={triggerError}
      />

      <JwtPanel isActive={activePanel === 'jwt'} onBack={() => setActivePanel(null)} />

      <PasswordPanel isActive={activePanel === 'password'} onBack={() => setActivePanel(null)} />

      <UuidPanel isActive={activePanel === 'uuid'} onBack={() => setActivePanel(null)} />

      <CookieClearPanel
        isActive={activePanel === 'cookie'}
        onBack={() => setActivePanel(null)}
        activeTab={activeTab}
      />

      <HashPanel isActive={activePanel === 'hash'} onBack={() => setActivePanel(null)} />

      <BulkUrlPanel isActive={activePanel === 'bulkurl'} onBack={() => setActivePanel(null)} />

      <QrCodePanel
        isActive={activePanel === 'qrcode'}
        onBack={() => setActivePanel(null)}
        activeTab={activeTab}
      />

      <Base64Panel isActive={activePanel === 'base64'} onBack={() => setActivePanel(null)} />
      <LoremIpsumPanel isActive={activePanel === 'lorem'} onBack={() => setActivePanel(null)} />

      {/* Circular Loading Capture Overlay */}
      {captureProgress && (
        <div className="progress-overlay">
          <div className="progress-card">
            <h3 className="progress-title">
              {captureProgress.step === 'stitching' ? 'Processing Image' : 'Capturing Page'}
            </h3>
            <div className="progress-spinner-container">
              <div className="progress-spinner"></div>
              <span className="progress-percent">{captureProgress.percent}%</span>
            </div>
            <p className="progress-details">
              {captureProgress.step === 'stitching'
                ? 'Stitching views & loading canvas...'
                : `Capturing webpage... ${captureProgress.percent}%`}
            </p>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${captureProgress.percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
