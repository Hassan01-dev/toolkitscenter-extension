// Content script for Toolkitscenter Screenshot tool

if (!window.hasScreenshotScriptInjected) {
  window.hasScreenshotScriptInjected = true;

  let originalScrollPos = { x: 0, y: 0 };
  let originalOverflows = { html: '', body: '' };
  let hiddenElements = [];

  // Listener for messages from the service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'prepare') {
      preparePage(message.options || {})
        .then(dimensions => sendResponse(dimensions))
        .catch(err => {
          console.error('Error in preparePage:', err);
          sendResponse({ error: err.message });
        });
      return true; // Keep the channel open for async response
    }

    if (message.action === 'scroll') {
      scrollToPosition(message.y, message.delay || 250)
        .then(actualY => sendResponse({ actualY }))
        .catch(err => {
          console.error('Error in scrollToPosition:', err);
          sendResponse({ error: err.message });
        });
      return true;
    }

    if (message.action === 'restore') {
      restorePage()
        .then(() => sendResponse({ success: true }))
        .catch(err => {
          console.error('Error in restorePage:', err);
          sendResponse({ error: err.message });
        });
      return true;
    }

    if (message.action === 'get_visible_dimensions') {
      sendResponse({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        title: document.title || 'Screenshot',
        url: window.location.href
      });
      return false; // synchronous response
    }

    if (message.action === 'pick_color') {
      if (!window.EyeDropper) {
        sendResponse({ error: 'EyeDropper API is not supported in this browser.' });
        return false;
      }
      const eyeDropper = new EyeDropper();
      eyeDropper.open()
        .then(result => sendResponse({ sRGBHex: result.sRGBHex }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // keep channel open for async response
    }
  });

  /**
   * Prepares the page for screenshotting by hiding scrollbars and sticky/fixed headers.
   * Saves original states so they can be restored later.
   */
  async function preparePage(options) {
    // Store original scroll position
    originalScrollPos = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    };

    // Store original overflows
    originalOverflows = {
      html: document.documentElement.style.overflow,
      body: document.body.style.overflow
    };

    // Hide scrollbars
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');

    // Hide fixed and sticky elements
    if (options.hideSticky !== false) {
      hideStickyElements();
    }

    // Scroll to top to begin screenshot process
    window.scrollTo(0, 0);
    
    // Wait a small buffer for page layout to settle after scrollbars are hidden
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return full page dimensions
    const body = document.body;
    const html = document.documentElement;

    const totalHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    const totalWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      html.clientWidth,
      html.scrollWidth,
      html.offsetWidth
    );

    return {
      totalWidth,
      totalHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      title: document.title || 'Screenshot',
      url: window.location.href
    };
  }

  /**
   * Scrolls the page to a specific Y coordinate and waits for layout to settle.
   */
  async function scrollToPosition(y, delay) {
    window.scrollTo(0, y);
    
    // Wait for rendering/animations to settle and lazy loaded images to load
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return window.scrollY || window.pageYOffset;
  }

  /**
   * Restores the page to its original state (scroll position, scrollbars, and sticky elements).
   */
  async function restorePage() {
    // Restore scrollbars
    document.documentElement.style.overflow = originalOverflows.html;
    document.body.style.overflow = originalOverflows.body;

    // Restore fixed and sticky elements
    restoreStickyElements();

    // Restore original scroll position
    window.scrollTo(originalScrollPos.x, originalScrollPos.y);
    
    // Wait a small buffer
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Finds and hides all fixed/sticky elements (optimized selection to prevent repeating nav headers).
   */
  function hideStickyElements() {
    hiddenElements = [];
    const all = document.querySelectorAll('*');
    
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.nodeType !== Node.ELEMENT_NODE) continue;
      
      try {
        const style = window.getComputedStyle(el);
        const pos = style.position;
        if (pos === 'fixed' || pos === 'sticky') {
          // Only hide visible elements to avoid unnecessary DOM thrashing
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            hiddenElements.push({
              element: el,
              originalVisibility: el.style.visibility
            });
            el.style.setProperty('visibility', 'hidden', 'important');
          }
        }
      } catch (e) {
        // Safe guard
      }
    }
  }

  /**
   * Restores all previously hidden fixed/sticky elements.
   */
  function restoreStickyElements() {
    for (const item of hiddenElements) {
      try {
        item.element.style.visibility = item.originalVisibility;
        if (item.element.style.getPropertyValue('visibility') === 'hidden') {
          item.element.style.removeProperty('visibility');
        }
      } catch (e) {
        // Safe guard
      }
    }
    hiddenElements = [];
  }
}
