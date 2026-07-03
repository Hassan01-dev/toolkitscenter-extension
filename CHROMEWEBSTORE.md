# Chrome Web Store Listing — Toolkit Hub

> Last Updated: 2026-06-28

## Store Listing

**Extension Name**
Toolkit Hub

**Short Description**
A hub of essential browser tools. Includes Screen Capture (Full Page/Visible), JWT Decoder, and active domain Cookie Clear.

**Detailed Description**
Toolkit Hub is a collection of essential tools designed to streamline your browser tasks. It runs 100% locally on your computer with a clean, muted Slate developer interface.

Featured Tools:

1. **Screen Capture**:
   - **Full Page Capture**: Auto-scrolls the active tab and captures the entire page. Hides lazy-load scrolling visually behind a progress cover for a clean experience.
   - **Visible Area Capture**: Instantly captures the currently visible portion of the page.
   - **Image Cropper**: Interactively crop your screenshot directly in the browser export tab.
   - **Export Layouts**: Download captures as PNG, JPEG, single-page PDF, or split multi-page PDF documents (A4/Letter page formats) similar to GoFullPage.
   - **Sticky Elements Support**: Optional setting to hide sticky headers during scrolling captures.
2. **JWT Decoder**:
   - Paste any encoded JSON Web Token to decode its headers and payload claims instantly in the popup.
3. **Cookie Clear**:
   - Displays domain cookie details and lets you clear all cookies set on the active website with a single click.

Privacy & Permissions:
We value your privacy. Toolkit Hub runs all capturing, decoding, and file generation logic locally inside your browser. No data, token content, or browsing history is ever transmitted off your device.

**Category**
Developer Tools

**Single Purpose**
Provides essential developer tools (screen capture, JWT decoding, cookie clearing) in a single browser popup.

**Primary Language**
English

## Graphics & Assets

| Asset                          | Dimensions          | Status         | Filename          |
| ------------------------------ | ------------------- | -------------- | ----------------- |
| Store Icon [REQUIRED]          | 128×128 PNG         | ⬜ Not created | (Omitted for dev) |
| Screenshot 1 [REQUIRED]        | 1280×800 or 640×400 | ⬜ Not created |                   |
| Screenshot 2 [RECOMMENDED]     | 1280×800 or 640×400 | ⬜ Not created |                   |
| Small Promo Tile [RECOMMENDED] | 440×280             | ⬜ Not created |                   |

## Permissions Justification

Toolkit Hub only requests the permissions strictly necessary to execute its tools locally.

| Permission | Type             | Justification                                                                                                                             |
| ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| activeTab  | permissions      | Grants temporary, secure access to the active webpage when the user clicks the extension action icon to capture screens or clean cookies. |
| scripting  | permissions      | Needed to inject the scrolling script (content.js) into the active tab to coordinate page captures.                                       |
| downloads  | permissions      | Needed to save the final stitched image or PDF file to the user's local Downloads folder.                                                 |
| storage    | permissions      | Used to pass settings between the popup and background worker.                                                                            |
| cookies    | permissions      | Needed to inspect and clear cookies set for the active webpage domain.                                                                    |
| tabs       | permissions      | Used to safely query current active tab details and URL format restrictions.                                                              |
| <all_urls> | host_permissions | Allows the scripting and cookie cleaning actions to work on any domain the user decides to run tools on.                                  |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All operations occur entirely locally on the user's machine. No data is stored or transmitted.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
(Not required since no data is collected, but recommended to link to a static privacy policy page on GitHub if published publicly).

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

## Developer Info

**Publisher Name**
Toolkit Hub Team

**Contact Email**
developer@example.com

**Homepage URL**
https://github.com/example/toolkithub

## Version History

| Version | Date       | Changes                                                                                                                                                                                                 | Status |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.2.0   | 2026-06-29 | Rebuilt the extension popup in React + Vite. Upgraded to a 16-tool modular Developer Toolkit. Separated files into modular React components, global stylesheet, and static assets in the public folder. | Draft  |
| 1.1.0   | 2026-06-28 | Added Visible Area Capture, detail slide-in panels, zooming preview, and multi-page PDF split (A4/Letter).                                                                                              | Draft  |
| 1.0.0   | 2026-06-27 | Initial release with Full Page Screenshot tool (PNG/JPEG/PDF) and dark hub UI.                                                                                                                          | Draft  |

## Review Notes

### Known Issues / Limitations

- Cannot capture pages restricted by the browser (such as chrome:// pages or the Chrome Web Store) due to browser security restrictions.
- Incredibly long pages are dynamically downscaled in quality to fit within browser canvas sizing thresholds (16000px height limit) to prevent browser tab crashes.
