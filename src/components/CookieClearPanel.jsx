import React, { useState, useEffect } from 'react';

function CookieClearPanel({ isActive, onBack, activeTab }) {
  const [domain, setDomain] = useState('-');
  const [cookieCount, setCookieCount] = useState('0 cookies found');
  const [cookiesList, setCookiesList] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadCookieDetails();
    }
  }, [isActive, activeTab]);

  const loadCookieDetails = async () => {
    if (!activeTab || !activeTab.url) return;

    try {
      const url = new URL(activeTab.url);
      setDomain(url.hostname);

      const cookies = await chrome.cookies.getAll({ url: activeTab.url });
      setCookiesList(cookies);
      setCookieCount(`${cookies.length} cookie${cookies.length === 1 ? '' : 's'} found`);
    } catch (err) {
      console.error('Error fetching cookie details:', err);
      setDomain('Unknown');
      setCookieCount('Error loading cookies');
      setCookiesList([]);
    }
  };

  const handleClearCookies = async () => {
    if (!activeTab || !activeTab.url || cookiesList.length === 0) return;
    setIsClearing(true);

    try {
      let deletedCount = 0;

      for (const cookie of cookiesList) {
        const protocol = cookie.secure ? 'https:' : 'http:';
        const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

        await chrome.cookies.remove({
          url: cookieUrl,
          name: cookie.name,
          storeId: cookie.storeId
        });
        deletedCount++;
      }

      setStatusMsg(`Cleared ${deletedCount} cookie${deletedCount === 1 ? '' : 's'} successfully!`);
      await loadCookieDetails();
    } catch (err) {
      console.error('Error clearing cookies:', err);
      setStatusMsg('Failed to clear cookies.');
    } finally {
      setIsClearing(false);
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
        <h2 className="detail-title">Cookie Clear</h2>
      </header>

      <p className="detail-desc">Clear cookies stored for the active website domain.</p>

      <div className="cookie-container">
        <div className="cookie-details-card">
          <div className="cookie-details-title">Domain</div>
          <div className="cookie-details-value">{domain}</div>
          <div className="cookie-details-title" style={{ marginTop: '10px' }}>
            Active Cookies
          </div>
          <div className="cookie-details-value">{cookieCount}</div>
        </div>

        {statusMsg && <div className="cookie-success">{statusMsg}</div>}

        <button
          className="primary-btn delete-btn"
          onClick={handleClearCookies}
          disabled={cookiesList.length === 0 || isClearing}
          style={{ marginTop: '12px' }}
        >
          <span>{isClearing ? 'Clearing Cookies...' : 'Clear All Cookies'}</span>
        </button>
      </div>
    </div>
  );
}

export default CookieClearPanel;
