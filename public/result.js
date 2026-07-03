// JavaScript logic for Toolkitscenter Screenshot Export page

document.addEventListener('DOMContentLoaded', async () => {
  const sourceTitleEl = document.getElementById('sourceTitle');
  const sourceResolutionEl = document.getElementById('sourceResolution');
  const sourceDprEl = document.getElementById('sourceDpr');
  const mockupUrlEl = document.getElementById('mockupUrl');
  const fileNameInput = document.getElementById('fileNameInput');
  const imageFormatSelect = document.getElementById('imageFormatSelect');
  const qualityGroup = document.getElementById('qualityGroup');
  const imageQualitySlider = document.getElementById('imageQualitySlider');
  const qualityValEl = document.getElementById('qualityVal');
  const pdfLayoutSelect = document.getElementById('pdfLayoutSelect');
  
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const closeTabBtn = document.getElementById('closeTabBtn');
  const viewerLoader = document.getElementById('viewerLoader');
  const screenshotPreview = document.getElementById('screenshotPreview');
  const mockupContent = document.getElementById('mockupContent');

  // Zooming elements
  const zoomControls = document.getElementById('zoomControls');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');

  // Crop elements
  const cropImageBtn = document.getElementById('cropImageBtn');
  const cropCanvas = document.getElementById('cropCanvas');
  const cropActions = document.getElementById('cropActions');
  const confirmCropBtn = document.getElementById('confirmCropBtn');
  const cancelCropBtn = document.getElementById('cancelCropBtn');

  let captureSession = null;
  let canvas = null;

  // Zoom State
  const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
  let zoomIndex = -1; // -1 represents 'fit'

  // Crop State
  let isCropping = false;
  let isDragging = false;
  let isResizing = false;
  let activeHandle = null;
  let cropBox = { x: 0, y: 0, w: 0, h: 0 };
  let dragStartX = 0, dragStartY = 0;
  let boxStartX = 0, boxStartY = 0;
  let boxStartW = 0, boxStartH = 0;
  let offsetX = 0, offsetY = 0;

  // 1. Update Quality slider text
  imageQualitySlider.addEventListener('input', () => {
    qualityValEl.textContent = `${imageQualitySlider.value}%`;
  });

  // Toggle quality slider visibility based on format choice (JPEG only)
  imageFormatSelect.addEventListener('change', () => {
    if (imageFormatSelect.value === 'jpeg') {
      qualityGroup.classList.remove('hidden');
    } else {
      qualityGroup.classList.add('hidden');
    }
  });

  // 2. Load Captured Data from Service Worker
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');

    const data = await chrome.runtime.sendMessage({
      action: 'get_captured_data',
      id: sessionId
    });

    if (!data || !data.chunks || data.chunks.length === 0) {
      showErrorState('No screenshot data found. Please try capturing again.');
      return;
    }
    
    captureSession = data;
    await assembleScreenshot();
  } catch (err) {
    console.error('Failed to get captured data:', err);
    showErrorState(`Failed to load capture: ${err.message}`);
  }

  // 3. Assemble and Stitch chunks on Canvas
  async function assembleScreenshot() {
    const { chunks, dimensions } = captureSession;
    const { totalWidth, totalHeight, devicePixelRatio, title } = dimensions;

    // Fill UI Meta Info
    sourceTitleEl.textContent = title;
    sourceTitleEl.title = title;
    sourceResolutionEl.textContent = `${totalWidth} x ${totalHeight} px`;
    sourceDprEl.textContent = `${devicePixelRatio}x`;
    
    // Mockup URL representation
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    fileNameInput.value = `screenshot_${cleanTitle}_${dateStr}`;
    
    // Parse URL parameter if present to show actual webpage URL in mockup
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get('url');
    if (targetUrl) {
      mockupUrlEl.textContent = targetUrl;
      mockupUrlEl.title = targetUrl;
    } else {
      mockupUrlEl.textContent = `captured://page/${cleanTitle}`;
    }

    // Create Canvas
    canvas = document.createElement('canvas');
    
    // Safety size checks to prevent browser out-of-memory canvas crashes
    let dpr = devicePixelRatio;
    const maxCanvasHeight = 16000; // Threshold safety limit
    if (totalHeight * dpr > maxCanvasHeight) {
      dpr = maxCanvasHeight / totalHeight;
    }
    
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    const ctx = canvas.getContext('2d');

    // Fill background with white by default
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Loop chunks and draw them
      const scaleFactor = dpr / devicePixelRatio;
      for (const chunk of chunks) {
        const img = await loadImage(chunk.dataUrl);
        // Scale and draw coordinates safely
        ctx.drawImage(
          img, 
          0, 0, img.width, img.height,
          0, chunk.y * dpr, canvas.width, img.height * scaleFactor
        );
      }

      // Display Preview
      const previewUrl = canvas.toDataURL('image/png');
      screenshotPreview.src = previewUrl;
      screenshotPreview.classList.remove('hidden');
      viewerLoader.classList.add('hidden');

      // Enable zoom controls & update view
      zoomControls.classList.remove('hidden');
      updateZoom();

      // Enable download and crop buttons
      downloadImageBtn.disabled = false;
      downloadPdfBtn.disabled = false;
      cropImageBtn.disabled = false;

    } catch (err) {
      console.error('Error stitching image chunks:', err);
      showErrorState(`Error assembling page views: ${err.message}`);
    }
  }

  // Helper: Promisified image loader
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Image failed to load'));
      img.src = src;
    });
  }

  // Helper: Display error in viewer instead of preview
  function showErrorState(msg) {
    viewerLoader.innerHTML = `
      <div style="color: #ef4444; font-size: 1.5rem; margin-bottom: 10px;">⚠️</div>
      <p style="color: #fca5a5;">${msg}</p>
    `;
    downloadImageBtn.disabled = true;
    downloadPdfBtn.disabled = true;
    cropImageBtn.disabled = true;
  }

  // 4. Zooming Actions
  function updateZoom() {
    if (!canvas) return;
    const dpr = canvas.width / captureSession.dimensions.totalWidth;
    if (zoomIndex === -1) {
      screenshotPreview.style.width = '100%';
      screenshotPreview.style.maxWidth = '100%';
      screenshotPreview.style.alignSelf = 'center';
      zoomLevelText.textContent = 'Fit';
    } else {
      const scale = zoomLevels[zoomIndex];
      screenshotPreview.style.width = `${(canvas.width / dpr) * scale}px`;
      screenshotPreview.style.maxWidth = 'none';
      screenshotPreview.style.alignSelf = 'flex-start';
      zoomLevelText.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  zoomInBtn.addEventListener('click', () => {
    if (!canvas) return;
    const dpr = canvas.width / captureSession.dimensions.totalWidth;
    if (zoomIndex === -1) {
      const fitScale = mockupContent.clientWidth / (canvas.width / dpr);
      let closestIndex = 3; // default to 1.0
      let minDiff = Infinity;
      for (let i = 0; i < zoomLevels.length; i++) {
        const diff = Math.abs(zoomLevels[i] - fitScale);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      zoomIndex = Math.min(zoomLevels.length - 1, closestIndex + 1);
    } else if (zoomIndex < zoomLevels.length - 1) {
      zoomIndex++;
    }
    updateZoom();
  });

  zoomOutBtn.addEventListener('click', () => {
    if (!canvas) return;
    const dpr = canvas.width / captureSession.dimensions.totalWidth;
    if (zoomIndex === -1) {
      const fitScale = mockupContent.clientWidth / (canvas.width / dpr);
      let closestIndex = 3;
      let minDiff = Infinity;
      for (let i = 0; i < zoomLevels.length; i++) {
        const diff = Math.abs(zoomLevels[i] - fitScale);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      zoomIndex = Math.max(0, closestIndex - 1);
    } else if (zoomIndex > 0) {
      zoomIndex--;
    } else if (zoomIndex === 0) {
      zoomIndex = -1; // Cycle back to Fit
    }
    updateZoom();
  });

  zoomResetBtn.addEventListener('click', () => {
    zoomIndex = -1;
    updateZoom();
  });

  // 5. Cropping Actions
  cropImageBtn.addEventListener('click', () => {
    if (!canvas || isCropping) return;
    enterCropMode();
  });

  function enterCropMode() {
    isCropping = true;
    
    // Fit image to viewport layout during cropping
    zoomIndex = -1;
    updateZoom();
    zoomControls.classList.add('hidden');

    cropCanvas.classList.remove('hidden');
    cropActions.classList.remove('hidden');

    // Make cropCanvas cover screenshotPreview dimensions
    cropCanvas.width = screenshotPreview.clientWidth;
    cropCanvas.height = screenshotPreview.clientHeight;

    // Initialize cropBox size (centered, covering 70% of canvas)
    cropBox.w = Math.max(100, Math.round(cropCanvas.width * 0.7));
    cropBox.h = Math.max(100, Math.round(cropCanvas.height * 0.7));
    cropBox.x = Math.round((cropCanvas.width - cropBox.w) / 2);
    cropBox.y = Math.round((cropCanvas.height - cropBox.h) / 2);

    drawCropBox();
  }

  function exitCropMode() {
    isCropping = false;
    cropCanvas.classList.add('hidden');
    cropActions.classList.add('hidden');
    zoomControls.classList.remove('hidden');
  }

  function drawCropBox() {
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);

    // Dim overlay outside
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

    // Clear inside the crop boundary
    ctx.clearRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Draw active blue border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

    // Draw corner handles
    ctx.fillStyle = '#3b82f6';
    const handles = getHandles();
    for (const key in handles) {
      const h = handles[key];
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function getHandles() {
    return {
      tl: { x: cropBox.x, y: cropBox.y },
      tr: { x: cropBox.x + cropBox.w, y: cropBox.y },
      bl: { x: cropBox.x, y: cropBox.y + cropBox.h },
      br: { x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h }
    };
  }

  function getMousePos(e) {
    const rect = cropCanvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(cropCanvas.width, clientX - rect.left)),
      y: Math.max(0, Math.min(cropCanvas.height, clientY - rect.top))
    };
  }

  function checkActiveHandle(pos) {
    const handles = getHandles();
    for (const key in handles) {
      const h = handles[key];
      const dist = Math.sqrt((pos.x - h.x) ** 2 + (pos.y - h.y) ** 2);
      if (dist < 12) {
        return key;
      }
    }
    return null;
  }

  function isInsideBox(pos) {
    return pos.x >= cropBox.x && pos.x <= cropBox.x + cropBox.w &&
           pos.y >= cropBox.y && pos.y <= cropBox.y + cropBox.h;
  }

  function handleStart(e) {
    if (!isCropping) return;
    const pos = getMousePos(e);
    const handle = checkActiveHandle(pos);
    
    if (handle) {
      isResizing = true;
      activeHandle = handle;
      dragStartX = pos.x;
      dragStartY = pos.y;
      boxStartX = cropBox.x;
      boxStartY = cropBox.y;
      boxStartW = cropBox.w;
      boxStartH = cropBox.h;
      e.preventDefault();
    } else if (isInsideBox(pos)) {
      isDragging = true;
      offsetX = pos.x - cropBox.x;
      offsetY = pos.y - cropBox.y;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isCropping) return;
    const pos = getMousePos(e);
    
    // Set cursors on hover
    if (!isResizing && !isDragging) {
      const handle = checkActiveHandle(pos);
      if (handle === 'tl' || handle === 'br') {
        cropCanvas.style.cursor = 'nwse-resize';
      } else if (handle === 'tr' || handle === 'bl') {
        cropCanvas.style.cursor = 'nesw-resize';
      } else if (isInsideBox(pos)) {
        cropCanvas.style.cursor = 'move';
      } else {
        cropCanvas.style.cursor = 'default';
      }
      return;
    }

    if (isResizing) {
      const dx = pos.x - dragStartX;
      const dy = pos.y - dragStartY;
      
      if (activeHandle === 'br') {
        cropBox.w = Math.max(50, Math.min(cropCanvas.width - boxStartX, boxStartW + dx));
        cropBox.h = Math.max(50, Math.min(cropCanvas.height - boxStartY, boxStartH + dy));
      } else if (activeHandle === 'bl') {
        const newX = Math.max(0, Math.min(boxStartX + boxStartW - 50, boxStartX + dx));
        cropBox.w = boxStartX + boxStartW - newX;
        cropBox.x = newX;
        cropBox.h = Math.max(50, Math.min(cropCanvas.height - boxStartY, boxStartH + dy));
      } else if (activeHandle === 'tr') {
        cropBox.w = Math.max(50, Math.min(cropCanvas.width - boxStartX, boxStartW + dx));
        const newY = Math.max(0, Math.min(boxStartY + boxStartH - 50, boxStartY + dy));
        cropBox.h = boxStartY + boxStartH - newY;
        cropBox.y = newY;
      } else if (activeHandle === 'tl') {
        const newX = Math.max(0, Math.min(boxStartX + boxStartW - 50, boxStartX + dx));
        cropBox.w = boxStartX + boxStartW - newX;
        cropBox.x = newX;
        const newY = Math.max(0, Math.min(boxStartY + boxStartH - 50, boxStartY + dy));
        cropBox.h = boxStartY + boxStartH - newY;
        cropBox.y = newY;
      }
      drawCropBox();
      e.preventDefault();
    } else if (isDragging) {
      cropBox.x = Math.max(0, Math.min(cropCanvas.width - cropBox.w, pos.x - offsetX));
      cropBox.y = Math.max(0, Math.min(cropCanvas.height - cropBox.h, pos.y - offsetY));
      drawCropBox();
      e.preventDefault();
    }
  }

  function handleEnd() {
    isResizing = false;
    isDragging = false;
    activeHandle = null;
  }

  cropCanvas.addEventListener('mousedown', handleStart);
  cropCanvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  cropCanvas.addEventListener('touchstart', handleStart, { passive: false });
  cropCanvas.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);

  confirmCropBtn.addEventListener('click', () => {
    const scaleX = canvas.width / cropCanvas.width;
    const scaleY = canvas.height / cropCanvas.height;

    const actualX = cropBox.x * scaleX;
    const actualY = cropBox.y * scaleY;
    const actualW = cropBox.w * scaleX;
    const actualH = cropBox.h * scaleY;

    // Create a new cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = actualW;
    croppedCanvas.height = actualH;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    croppedCtx.drawImage(canvas, actualX, actualY, actualW, actualH, 0, 0, actualW, actualH);

    // Update canvas references
    canvas = croppedCanvas;
    screenshotPreview.src = canvas.toDataURL('image/png');

    // Update metadata info in UI
    const dpr = canvas.width / captureSession.dimensions.totalWidth;
    sourceResolutionEl.textContent = `${Math.round(actualW / dpr)} x ${Math.round(actualH / dpr)} px`;

    exitCropMode();
  });

  cancelCropBtn.addEventListener('click', () => {
    exitCropMode();
  });

  // 6. Download Image Handler
  downloadImageBtn.addEventListener('click', () => {
    if (!canvas) return;

    const filename = fileNameInput.value.trim() || 'screenshot';
    const format = imageFormatSelect.value;
    const mimeType = `image/${format}`;
    const quality = format === 'jpeg' ? parseInt(imageQualitySlider.value, 10) / 100 : undefined;

    downloadImageBtn.disabled = true;
    const originalText = downloadImageBtn.querySelector('span').textContent;
    downloadImageBtn.querySelector('span').textContent = 'Exporting...';

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to generate image file.');
        restoreButtonState();
        return;
      }
      
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: `${filename}.${format}`,
        saveAs: true
      }, () => {
        restoreButtonState();
      });
    }, mimeType, quality);

    function restoreButtonState() {
      downloadImageBtn.disabled = false;
      downloadImageBtn.querySelector('span').textContent = originalText;
    }
  });

  // 7. Download PDF Handler
  downloadPdfBtn.addEventListener('click', () => {
    if (!canvas || !captureSession) return;

    const filename = fileNameInput.value.trim() || 'screenshot';
    const pdfLayout = pdfLayoutSelect.value;

    downloadPdfBtn.disabled = true;
    const originalText = downloadPdfBtn.querySelector('span').textContent;
    downloadPdfBtn.querySelector('span').textContent = 'Generating PDF...';

    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        if (pdfLayout === 'single') {
          // Single-page PDF that matches canvas aspect ratio perfectly.
          const pdfWidth = canvas.width;
          const pdfHeight = canvas.height;
          const orientation = pdfWidth > pdfHeight ? 'l' : 'p';

          const doc = new jsPDF({
            orientation: orientation,
            unit: 'px',
            format: [pdfWidth, pdfHeight],
            hotfixes: ['px_scaling']
          });

          doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          doc.save(`${filename}.pdf`);
        } else {
          // Multi-page PDF split (similar to GoFullPage)
          const isA4 = pdfLayout === 'a4';
          const pageWidth = isA4 ? 595.28 : 612.0; // dimensions in points (pt)
          const pageHeight = isA4 ? 841.89 : 792.0;

          // Scale the image width to page width
          const scale = pageWidth / canvas.width;
          const scaledImageHeight = canvas.height * scale;

          const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: [pageWidth, pageHeight]
          });

          let remainingHeight = scaledImageHeight;
          let pageIndex = 0;

          while (remainingHeight > 0) {
            if (pageIndex > 0) {
              doc.addPage([pageWidth, pageHeight], 'p');
            }

            const yOffset = -pageIndex * pageHeight;
            // Draw full image scaled, shifted up by page heights for successive slices
            doc.addImage(imgData, 'JPEG', 0, yOffset, pageWidth, scaledImageHeight);

            remainingHeight -= pageHeight;
            pageIndex++;
          }

          doc.save(`${filename}.pdf`);
        }
      } catch (err) {
        console.error('PDF generation failed:', err);
        alert(`Failed to generate PDF: ${err.message}`);
      } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.querySelector('span').textContent = originalText;
      }
    }, 100);
  });

  // 8. Close tab button
  closeTabBtn.addEventListener('click', () => {
    chrome.tabs.getCurrent((tab) => {
      chrome.tabs.remove(tab.id);
    });
  });
});
