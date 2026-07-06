import React, { useState } from 'react';

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function QuickActionButton({ title, desc, icon, disabled, onRun }) {
  const [status, setStatus] = useState('idle'); // idle | running | success | error
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    if (disabled || status === 'running') return;
    setStatus('running');
    setMessage('');

    try {
      const result = await onRun();
      setStatus('success');
      setMessage(result || 'Done');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 2400);
    }
  };

  return (
    <section
      className={`quick-action-card quick-action-${status} ${disabled ? 'disabled-tool' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <span className="quick-action-badge">1-CLICK</span>
      <div className="quick-action-icon">
        {status === 'running' && <span className="quick-action-spinner" />}
        {status === 'success' && <CheckIcon />}
        {status === 'error' && <XIcon />}
        {status === 'idle' && icon}
      </div>
      <div className="quick-action-meta">
        <h2 className="quick-action-title">{title}</h2>
        <p className="quick-action-desc">
          {status === 'idle' || status === 'running' ? desc : message}
        </p>
      </div>
    </section>
  );
}

export default QuickActionButton;
