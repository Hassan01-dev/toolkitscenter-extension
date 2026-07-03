import React, { useState } from 'react';

function ColorPickerPanel({ isActive, onBack, activeTab, triggerError }) {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [copyStatus, setCopyStatus] = useState({ hex: 'Copy', rgb: 'Copy', hsl: 'Copy' });
  const [isPicking, setIsPicking] = useState(false);

  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const updateColor = (hex) => {
    setSelectedColor(hex);
  };

  const handlePickColor = async () => {
    if (!activeTab) return;
    setIsPicking(true);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      });

      const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'pick_color' });

      if (response && response.sRGBHex) {
        updateColor(response.sRGBHex);
      } else if (response && response.error) {
        triggerError(`EyeDropper error: ${response.error}`);
      }
    } catch (err) {
      console.error('Color pick failed:', err);
      triggerError('Failed to initialize EyeDropper. Try reloading the active page.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleCopyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((prev) => ({ ...prev, [key]: 'Copied!' }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [key]: 'Copy' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const rgb = hexToRgb(selectedColor) || { r: 59, g: 130, b: 246 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const hexVal = selectedColor.toLowerCase();
  const rgbVal = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslVal = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const paletteColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#6b7280',
    '#ffffff',
    '#0f172a'
  ];

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
        <h2 className="detail-title">Color Picker</h2>
      </header>

      <p className="detail-desc">Inspect and copy colors from web page or palette.</p>

      <div className="color-picker-container">
        <button
          className="primary-btn pick-btn"
          onClick={handlePickColor}
          disabled={isPicking}
          style={{ marginBottom: '12px' }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '14px', height: '14px', marginRight: '4px' }}
          >
            <path d="m2 22 1-1c.7-.7 1.8-.7 2.5 0l2 2"></path>
            <path d="M12.5 5.5 19 12"></path>
            <path d="m22 2-3 3-3.5-3.5L19 1"></path>
            <path d="m19 5-8.5 8.5c-.7.7-1.5 1.2-2.5 1.5L5 16l1-3c.3-1 .8-1.8 1.5-2.5L16 2z"></path>
          </svg>
          <span>{isPicking ? 'Click on webpage color...' : 'Pick Color from Page'}</span>
        </button>

        <div className="color-selectors">
          <div className="palette-swatches">
            {paletteColors.map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                onClick={() => updateColor(color)}
                title={color}
              />
            ))}
          </div>

          <div className="custom-color-input-wrapper">
            <input
              type="color"
              id="customColorInput"
              value={selectedColor}
              onChange={(e) => updateColor(e.target.value)}
            />
            <span className="custom-color-label">Custom Color Input</span>
          </div>
        </div>

        <div className="color-preview-section">
          <div className="color-preview-box" style={{ backgroundColor: selectedColor }}></div>
          <div className="color-values-list">
            <div className="value-item">
              <span className="value-label">HEX</span>
              <input type="text" className="value-input" value={hexVal} readOnly />
              <button
                className="copy-val-btn"
                onClick={() => handleCopyText(hexVal, 'hex')}
                style={{
                  backgroundColor: copyStatus.hex === 'Copied!' ? '#10b981' : '',
                  borderColor: copyStatus.hex === 'Copied!' ? '#10b981' : ''
                }}
              >
                {copyStatus.hex}
              </button>
            </div>
            <div className="value-item">
              <span className="value-label">RGB</span>
              <input type="text" className="value-input" value={rgbVal} readOnly />
              <button
                className="copy-val-btn"
                onClick={() => handleCopyText(rgbVal, 'rgb')}
                style={{
                  backgroundColor: copyStatus.rgb === 'Copied!' ? '#10b981' : '',
                  borderColor: copyStatus.rgb === 'Copied!' ? '#10b981' : ''
                }}
              >
                {copyStatus.rgb}
              </button>
            </div>
            <div className="value-item">
              <span className="value-label">HSL</span>
              <input type="text" className="value-input" value={hslVal} readOnly />
              <button
                className="copy-val-btn"
                onClick={() => handleCopyText(hslVal, 'hsl')}
                style={{
                  backgroundColor: copyStatus.hsl === 'Copied!' ? '#10b981' : '',
                  borderColor: copyStatus.hsl === 'Copied!' ? '#10b981' : ''
                }}
              >
                {copyStatus.hsl}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorPickerPanel;
