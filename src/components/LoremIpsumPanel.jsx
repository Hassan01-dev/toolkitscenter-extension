import React, { useState } from 'react';

const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'ut',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'ut',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'dolor',
  'in',
  'reprehenderit',
  'in',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'dolore',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'in',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum'
];

function LoremIpsumPanel({ isActive, onBack }) {
  const [count, setCount] = useState(5);
  const [type, setType] = useState('paragraphs'); // 'words', 'sentences', 'paragraphs'
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy');

  const getRandomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];

  const generateSentence = () => {
    const len = Math.floor(Math.random() * 8) + 6; // 6 to 13 words
    const words = [];
    for (let i = 0; i < len; i++) {
      words.push(getRandomWord());
    }
    const sentence = words.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  };

  const generateParagraph = () => {
    const len = Math.floor(Math.random() * 3) + 3; // 3 to 5 sentences
    const sentences = [];
    for (let i = 0; i < len; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(' ');
  };

  const handleGenerate = () => {
    let result = '';

    if (type === 'words') {
      const words = [];
      if (startWithLorem && count > 1) {
        words.push('Lorem', 'ipsum');
      }
      while (words.length < count) {
        words.push(getRandomWord());
      }
      result = words.slice(0, count).join(' ');
    } else if (type === 'sentences') {
      const sentences = [];
      if (startWithLorem && count > 0) {
        sentences.push('Lorem ipsum dolor sit amet.');
      }
      while (sentences.length < count) {
        sentences.push(generateSentence());
      }
      result = sentences.join(' ');
    } else {
      const paragraphs = [];
      if (startWithLorem && count > 0) {
        paragraphs.push(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        );
      }
      while (paragraphs.length < count) {
        paragraphs.push(generateParagraph());
      }
      result = paragraphs.join('\n\n');
    }

    setOutput(result);
  };

  const handleCopy = async () => {
    if (!output) return;
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
        <h2 className="detail-title">Placeholder Generator</h2>
      </header>

      <p className="detail-desc">
        Generate Lorem Ipsum placeholder text in paragraphs, sentences, or words.
      </p>

      <div className="form-group" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flexGrow: 1 }}>
            <label htmlFor="loremCount" className="form-label">
              Count
            </label>
            <input
              type="number"
              id="loremCount"
              className="form-input"
              style={{ padding: '6px', width: '100%' }}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10)))}
              min="1"
              max="100"
            />
          </div>
          <div style={{ width: '140px' }}>
            <label htmlFor="loremType" className="form-label">
              Unit Type
            </label>
            <select
              id="loremType"
              className="form-select"
              style={{ padding: '6px 8px', fontSize: '0.72rem', width: '100%' }}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
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
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
          />
          Start with &quot;Lorem ipsum...&quot;
        </label>
      </div>

      {output && (
        <div className="jwt-output-section" style={{ marginBottom: '12px' }}>
          <pre
            className="jwt-block"
            style={{ maxHeight: '130px', fontSize: '0.68rem', whiteSpace: 'pre-wrap' }}
          >
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

export default LoremIpsumPanel;
