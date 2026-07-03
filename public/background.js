// Background service worker for Toolkitscenter

const captureSessions = {};
let currentCaptureSession = null;
let isCapturing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start_capture' || message.action === 'start_visible_capture') {
    if (isCapturing) {
      sendResponse({ success: false, error: 'A capture session is already running. Please wait.' });
      return false;
    }
    isCapturing = true;

    // Clear previous capture errors
    chrome.storage.local.remove('last_capture_error');

    const capturePromise = message.action === 'start_capture'
      ? startCapture(message.tabId, message.options || {})
      : startVisibleCapture(message.tabId);

    capturePromise
      .then(session => {
        isCapturing = false;
        sendResponse({ success: true });
      })
      .catch(err => {
        console.error('Capture failed:', err);
        isCapturing = false;
        chrome.storage.local.set({ last_capture_error: err.message || String(err) });
        sendResponse({ success: false, error: err.message || String(err) });
      });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'get_captured_data') {
    const sessionId = message.id ? parseInt(message.id, 10) : null;
    
    if (sessionId && captureSessions[sessionId]) {
      sendResponse(captureSessions[sessionId]);
    } else if (currentCaptureSession) {
      sendResponse(currentCaptureSession);
    } else {
      sendResponse(null);
    }
    return false;
  }
});

/**
 * Helper: Send scroll message with retry mechanism
 */
async function sendScrollWithRetry(tabId, message, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      if (response && response.error) {
        throw new Error(response.error);
      }
      return response;
    } catch (err) {
      console.warn(`Scroll message attempt ${attempt} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
}

/**
 * Helper: Capture visible viewport with retry (does not update window focus to keep popup open)
 */
async function captureTabWithRetry(windowId, format, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format });
      if (!dataUrl) {
        throw new Error('Capture returned empty data URL');
      }
      return dataUrl;
    } catch (err) {
      console.warn(`Capture attempt ${attempt} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    }
  }
}

/**
 * Coordinates scrolling and capturing chunks of the active tab.
 */
async function startCapture(tabId, options) {
  const timestamp = Date.now();

  // 1. Get the window ID for the tab
  const tab = await chrome.tabs.get(tabId);
  const windowId = tab.windowId;

  // 2. Inject content script if not already injected
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (err) {
    console.log('Script injection info/error:', err);
  }

  // 3. Send prepare message to content script
  const dimensions = await chrome.tabs.sendMessage(tabId, {
    action: 'prepare',
    options: {
      hideSticky: options.hideSticky !== false // default true
    }
  });

  if (dimensions.error) {
    throw new Error(dimensions.error);
  }

  const { totalHeight, viewportHeight, devicePixelRatio, title } = dimensions;
  const chunks = [];
  
  // Calculate positions to scroll to
  const scrollPositions = [];
  let currentY = 0;
  const maxScrollY = Math.max(0, totalHeight - viewportHeight);

  if (maxScrollY === 0) {
    scrollPositions.push(0);
  } else {
    while (currentY < totalHeight) {
      scrollPositions.push(Math.min(currentY, maxScrollY));
      if (currentY >= maxScrollY) break;
      currentY += viewportHeight;
    }
  }

  try {
    // 4. Scroll and capture loop
    for (let i = 0; i < scrollPositions.length; i++) {
      const y = scrollPositions[i];
      const percent = Math.round((i / scrollPositions.length) * 100);

      // Update progress back to popup (keeps updating inside active popup)
      try {
        await chrome.runtime.sendMessage({
          action: 'capture_progress',
          percent,
          step: 'capturing',
          current: i + 1,
          total: scrollPositions.length
        });
      } catch (e) {
        // Popup might be closed, ignore
      }

      // Scroll the page with retry mechanism
      const scrollResult = await sendScrollWithRetry(tabId, {
        action: 'scroll',
        y: y,
        delay: options.scrollDelay || 250
      });

      // Capture the visible viewport with retry mechanism (does not focus window to keep popup open)
      const dataUrl = await captureTabWithRetry(windowId, 'png');
      
      // Store chunk
      chunks.push({
        y: scrollResult.actualY,
        dataUrl
      });
    }

    // Update progress to stitching state
    try {
      await chrome.runtime.sendMessage({ action: 'capture_progress', percent: 100, step: 'stitching' });
    } catch (e) {
      // Popup might be closed, ignore
    }

    // 5. Store session data BEFORE opening the tab to prevent race condition
    const session = {
      chunks,
      dimensions,
      timestamp,
      timestampVal: timestamp
    };
    
    captureSessions[timestamp] = session;
    currentCaptureSession = session;

    // 6. Open result page with query parameters
    const encodedUrl = encodeURIComponent(dimensions.url || tab.url || '');
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`result.html?id=${timestamp}&url=${encodedUrl}`)
    });

    return session;

  } catch (err) {
    // Log the exact internal failure trace to storage
    await chrome.storage.local.set({ last_capture_error: err.message || String(err) });
    throw err;
  } finally {
    // ALWAYS restore page state!
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'restore' });
    } catch (e) {}
  }
}

/**
 * Captures the visible area of the active tab.
 */
async function startVisibleCapture(tabId) {
  const timestamp = Date.now();

  // 1. Get the window ID for the tab
  const tab = await chrome.tabs.get(tabId);
  const windowId = tab.windowId;

  // 2. Inject content script if not already injected
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (err) {
    console.log('Script injection info/error:', err);
  }

  // 3. Get viewport dimensions from content script
  const dimensions = await chrome.tabs.sendMessage(tabId, {
    action: 'get_visible_dimensions'
  });

  if (dimensions.error) {
    throw new Error(dimensions.error);
  }

  // 4. Capture the visible viewport
  const dataUrl = await captureTabWithRetry(windowId, 'png');

  // 5. Store session data BEFORE opening the tab
  const session = {
    chunks: [{
      y: 0,
      dataUrl
    }],
    dimensions: {
      totalWidth: dimensions.viewportWidth,
      totalHeight: dimensions.viewportHeight,
      viewportWidth: dimensions.viewportWidth,
      viewportHeight: dimensions.viewportHeight,
      devicePixelRatio: dimensions.devicePixelRatio,
      title: dimensions.title,
      url: dimensions.url
    },
    timestamp
  };

  captureSessions[timestamp] = session;
  currentCaptureSession = session;

  // 6. Open result page with query parameters
  const encodedUrl = encodeURIComponent(dimensions.url || tab.url || '');
  await chrome.tabs.create({
    url: chrome.runtime.getURL(`result.html?id=${timestamp}&url=${encodedUrl}`)
  });

  return session;
}
