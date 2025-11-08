
const PLACEHOLDER_URL = "https://cdn.bap-software.net/2024/02/22165839/testdebug2.jpg";

let observer = null;
let fullScanTimer = null;
const FULL_SCAN_DEBOUNCE_MS = 80; // small debounce to batch rapid mutations
const REPLACED_CLASS = 'replaced';

function replaceImageElement(img) {
  try {
    if (!img) return;

    // If it's already marked with the class AND already points to placeholder, skip
    const alreadyMarked = img.classList && img.classList.contains(REPLACED_CLASS);
    const isPlaceholder = (img.src === PLACEHOLDER_URL) || (img.currentSrc === PLACEHOLDER_URL);
    if (alreadyMarked && isPlaceholder) return;

    // Save originals so we can restore later
    const currentSrc = img.currentSrc || img.src || "";
    if (currentSrc) img.dataset.originalSrc = currentSrc;

    if (img.srcset) img.dataset.originalSrcset = img.srcset;
    // common lazy attributes
    if (img.dataset && img.dataset.src) img.dataset.originalDataSrc = img.dataset.src;


  // Replace sources
  try { img.src = PLACEHOLDER_URL; } catch (e) { }
  if (img.srcset) try { img.srcset = PLACEHOLDER_URL; } catch (e) { }
  if (img.dataset && img.dataset.src) img.dataset.src = PLACEHOLDER_URL;

  // Mark as replaced both with class and dataset flag (done after assignment so we can re-check later)
  try { img.classList.add(REPLACED_CLASS); } catch (e) { }
  img.dataset.replaced = 'true';

    console.log(`[Image Replacer] Replaced image: ${currentSrc || "(empty src)"} -> ${PLACEHOLDER_URL}`);
  } catch (err) {
    console.error("[Image Replacer] Error replacing image element:", err);
  }
}

function restoreImageElement(img) {
  try {
    if (!img) return;

    // Only restore those we previously changed
    const wasReplaced = img.dataset && img.dataset.replaced === 'true';
    if (!wasReplaced && !(img.classList && img.classList.contains(REPLACED_CLASS))) return;

    if (img.dataset.originalSrc !== undefined) img.src = img.dataset.originalSrc;
    if (img.dataset.originalSrcset !== undefined) img.srcset = img.dataset.originalSrcset;
    if (img.dataset.originalDataSrc !== undefined) img.dataset.src = img.dataset.originalDataSrc;

    // Clean up markers
    try { img.classList.remove(REPLACED_CLASS); } catch (e) { }
    delete img.dataset.replaced;
    delete img.dataset.originalSrc;
    delete img.dataset.originalSrcset;
    delete img.dataset.originalDataSrc;

    console.log("[Image Replacer] Restored image to original src.");
  } catch (err) {
    console.error("[Image Replacer] Error restoring image element:", err);
  }
}

function scanAndReplace() {
  const images = Array.from(document.images || []);
  if (!images.length) {
    console.log("[Image Replacer] No images found on this page.");
    return;
  }

  images.forEach((img) => {
    // ensure every image points to the placeholder and has the marker; if not, replace it
    const marked = img.classList && img.classList.contains(REPLACED_CLASS);
    const isPlaceholder = (img.src === PLACEHOLDER_URL) || (img.currentSrc === PLACEHOLDER_URL);
    if (!marked || !isPlaceholder) replaceImageElement(img);
  });

  // Also replace <source> elements inside <picture>
  const sources = Array.from(document.querySelectorAll('source'));
  sources.forEach((s) => {
    try {
      const marked = s.dataset && s.dataset.replaced === 'true';
      const isPlaceholder = s.srcset === PLACEHOLDER_URL;
      if (!marked || !isPlaceholder) {
        // save original
        if (s.srcset) s.dataset.originalSrcset = s.srcset;
        s.srcset = PLACEHOLDER_URL;
        s.dataset.replaced = 'true';
        if (s.classList) s.classList.add(REPLACED_CLASS);
        console.log('[Image Replacer] Replaced <source> srcset ->', PLACEHOLDER_URL);
      }
    } catch (e) {
      // ignore per-source errors
    }
  });

  // Replace inline background-images on elements (only inline styles to avoid touching external CSS)
  const styled = Array.from(document.querySelectorAll('[style]'));
  styled.forEach((el) => {
    try {
      const style = el.style && el.style.backgroundImage;
      if (!style || style === 'none') return;
      const marked = el.dataset && el.dataset.replaced === 'true';
      const isPlaceholder = style.includes(PLACEHOLDER_URL);
      if (!marked || !isPlaceholder) {
        // save original
        el.dataset.originalBackgroundImage = style;
        el.style.backgroundImage = `url("${PLACEHOLDER_URL}")`;
        el.dataset.replaced = 'true';
        if (el.classList) el.classList.add(REPLACED_CLASS);
        console.log('[Image Replacer] Replaced inline background-image on element ->', PLACEHOLDER_URL);
      }
    } catch (e) {
      // ignore
    }
  });
}

function scheduleFullScan() {
  if (fullScanTimer) clearTimeout(fullScanTimer);
  fullScanTimer = setTimeout(() => {
    fullScanTimer = null;
    try {
      scanAndReplace();
    } catch (e) {
      console.error('[Image Replacer] Error during full scan:', e);
    }
  }, FULL_SCAN_DEBOUNCE_MS);
}

function startObserving() {
  if (observer) return; // already observing

  // Observe added nodes and attribute changes so images added during scroll/infinite-load are replaced
  observer = new MutationObserver((mutations) => {
    let sawRelevant = false;

    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // If an <img> was added directly
          if (node.tagName === 'IMG') {
            replaceImageElement(node);
            sawRelevant = true;
            return;
          }

          // If a subtree was added, find images inside it
          const imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
          if (imgs.length) {
            imgs.forEach(replaceImageElement);
            sawRelevant = true;
          }
        });
      }

      // Attribute changes for lazy-loaded images that swap data-src -> src or update srcset
      if (m.type === 'attributes' && m.target && m.target.tagName === 'IMG') {
        // we'll schedule a full scan (covers attribute-based lazy loads)
        sawRelevant = true;
      }
    }

    if (sawRelevant) scheduleFullScan();
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-src', 'srcset']
  });

  // Initial pass
  scanAndReplace();
}

function stopObservingAndRestore() {
  if (observer) {
    try {
      observer.disconnect();
    } catch (e) {
      // ignore
    }
    observer = null;
  }

  if (fullScanTimer) {
    clearTimeout(fullScanTimer);
    fullScanTimer = null;
  }

  // Restore any replaced images
  const images = Array.from(document.images || []);
  images.forEach(restoreImageElement);
}

function handleState(enabled) {
  if (enabled) {
    console.log('[Image Replacer] Enabling image replacement and observer.');
    startObserving();
  } else {
    console.log('[Image Replacer] Disabling image replacement and restoring originals.');
    stopObservingAndRestore();
  }
}

chrome.storage.sync.get({ enabled: true }, (result) => {
  handleState(Boolean(result.enabled));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "toggle-image-replacement") {
    handleState(message.enabled);
    sendResponse({ status: "ok" });
  }
});

