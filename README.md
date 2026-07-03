# Toolkitscenter — Browser Extension

A hub of essential browser tools (screenshot capture, color picker, JWT/Base64/hash
utilities, password & UUID generators, QR codes, and more). Companion to
[toolkitscenter.com](https://toolkitscenter.com/).

Manifest V3 · React + Vite.

## Prerequisites

- Node.js 18+
- `npm install`

## Develop

The popup UI runs in Vite's dev server with hot-reload:

```bash
npm run dev
```

Open the printed `localhost` URL to iterate on the popup (`src/`) in the browser.

> Note: `chrome.*` extension APIs (screenshots, downloads, cookies) only exist when
> loaded as a real extension — see below. Use the dev server for UI/layout work, and
> the loaded build to test extension behavior.

## Test as a real extension

```bash
npm run build          # outputs to dist/
```

Then load it in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select the `dist/` folder
4. Pin the extension and click its icon to open the popup

After code changes, re-run `npm run build` and hit the **reload** icon on the
extension card. Static files in `public/` (`background.js`, `content.js`, `manifest.json`,
`result.*`, `icons/`) are copied to `dist/` verbatim by Vite.

## Lint & format

```bash
npm run lint
npm run format
```

## Package for the Chrome Web Store

```bash
npm run build
cd dist && zip -r ../toolkitscenter-extension.zip . && cd ..
```

Upload `toolkitscenter-extension.zip` in the Chrome Web Store Developer Dashboard.
Bump `version` in both `public/manifest.json` and `package.json` before each release.

## Layout

```
public/          static assets copied to dist as-is
  manifest.json  extension manifest (MV3)
  background.js  service worker
  content.js     content script
  result.*       screenshot export page
  icons/         extension icons (16/32/48/128)
src/             React popup UI (built by Vite)
popup.html       popup entry
dist/            build output — load this in Chrome (gitignored)
```
