const PLACEHOLDER_URL = "https://cdn.bap-software.net/2024/02/22165839/testdebug2.jpg";
const FULL_SCAN_DEBOUNCE_MS = 80;
const REPLACED_CLASS = "replaced";
const METRICS_MAX_IMAGES = 3;
const CLICK_FLUSH_DEBOUNCE_MS = 750;
const SCROLL_REPORT_THROTTLE_MS = 1500;
const EVENT_LIMIT = 50;
const KNOWN_FIGURES = [
  { name: "Donald Trump", pattern: /\b(donald\s+trump|trump)\b/i },
  { name: "Joe Biden", pattern: /\b(joe\s+biden|biden)\b/i },
  { name: "Barack Obama", pattern: /\b(barack\s+obama|obama)\b/i },
  { name: "Kamala Harris", pattern: /\b(kamala\s+harris|kamala)\b/i },
  { name: "Elon Musk", pattern: /\b(elon\s+musk|elon)\b/i }
];
const GOAT_IMAGE = "goat.png";

const LEBRONS = ["lebrons/lebron1.png", "lebrons/lebron2.png", "lebrons/lebron3.png", "lebrons/lebron4.png"];

const SUNSHINE_BG = "sunshine.jpg";
const LEBRON = "lebrons/lebrontogo.jpg";
const FADE_TRANSITION_MS = 2000; // 2 seconds fade transition
const INCREASE_OVERALL_SIZE = 1.5;
const NO_PERSON_FLAG = "no-person-detected";
let observer = null;
let faceDetector = null;
const detectionCache = new Map();
let fadeImagesToLeBron = false; // Default to disabled
let isScanning = false;
let extensionEnabled = true; // Track if extension is enabled
let fullScanTimer = null;
let clickFlushTimer = null;
let scrollReportTimer = null;
let contextBroadcastTimer = null;

const seenImageSources = new Set();
const metricsState = {
  initialized: false,
  listenersBound: false,
  topImages: [],
  imageMeta: [],
  maxScrollDepth: 0
};

let clickBuffer = [];

function isImagePage() {
  const path = window.location.pathname.toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(path);
}

function applyLeBronTheme() {
  // Inject LeBron-themed color scheme for ALL websites
  const style = document.createElement('style');
  style.id = 'lebron-theme';
  style.textContent = `
    /* LeBron James Color Theme - Brown, Orange, Gold - UNIVERSAL */
    
    /* Body background tint */
    body {
      background-color: #FFF8DC !important;
    }
    
    /* All input fields and textareas */
    input[type="text"], input[type="search"], input[type="email"], 
    input[type="password"], input[type="url"], textarea, 
    input[type="number"], input[type="tel"] {
      background-color: rgba(139, 90, 43, 0.08) !important;
      border-color: #D4A574 !important;
      color: #4A3528 !important;
    }
    
    /* Input focus states */
    input[type="text"]:focus, input[type="search"]:focus, 
    input[type="email"]:focus, input[type="password"]:focus, 
    input[type="url"]:focus, textarea:focus,
    input[type="number"]:focus, input[type="tel"]:focus {
      background-color: rgba(212, 165, 116, 0.15) !important;
      border-color: #FFA500 !important;
      box-shadow: 0 0 6px rgba(255, 165, 0, 0.4) !important;
      outline-color: #FF8C00 !important;
    }
    
    /* All Buttons - Lighter brown for easier viewing */
    button, input[type="submit"], input[type="button"], 
    input[type="reset"], .button, [role="button"] {
      background-color: #A0826D !important;
      color: #FFF8DC !important;
      border: 1px solid #D4A574 !important;
    }
    
    button:hover, input[type="submit"]:hover, 
    input[type="button"]:hover, input[type="reset"]:hover,
    .button:hover, [role="button"]:hover {
      background-color: #8B7355 !important;
      box-shadow: 0 2px 8px rgba(139, 90, 43, 0.4) !important;
    }
    
    /* Google-specific: Sign in button and app bar */
    .gb_E, .gb_Sd, #gb_70, #gb_71, .gb_D, #tU52Vb, .WE0UJf, #slim_appbar {
      background-color: rgba(160, 130, 109, 0.9) !important;
      color: #FFF8DC !important;
    }
    
    .gb_E:hover, .gb_Sd:hover {
      background-color: rgba(139, 115, 85, 0.95) !important;
    }
    
    /* Google Search Bar - Complete brown coverage */
    .RNNXgb, .SDkEP, .a4bIc, .gLFyf, .YacQv {
      background-color: rgba(139, 90, 43, 0.12) !important;
      border-color: #D4A574 !important;
    }
    
    /* Search bar container */
    .A8SBwf, .RNNXgb, .emcav {
      background-color: rgba(139, 90, 43, 0.12) !important;
    }
    
    /* Google Search Results - Light brown background instead of white */
    .g, .Ww4FFb, .MjjYud, .hlcw0c, .ULSxyf, .related-question-pair, 
    .kp-wholepage, .xpdopen, .ifM9O, .V3FYCf, .cUnQKe {
      background-color: rgba(210, 180, 140, 0.25) !important;
      border-color: #D4A574 !important;
    }
    
    /* Individual search result cards */
    .tF2Cxc, .kvH3mc, .Z26q7c {
      background-color: rgba(222, 184, 135, 0.3) !important;
      padding: 12px !important;
      border-radius: 8px !important;
      margin-bottom: 8px !important;
    }
    
    /* All Links */
    a {
      color: #FF8C00 !important;
    }
    
    a:visited {
      color: #CD853F !important;
    }
    
    a:hover {
      color: #FFA500 !important;
      text-decoration-color: #FFA500 !important;
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #8B4513 !important;
    }
    
    /* Select dropdowns */
    select {
      background-color: rgba(139, 90, 43, 0.1) !important;
      border-color: #D4A574 !important;
      color: #4A3528 !important;
    }
    
    select:focus {
      border-color: #FFA500 !important;
      box-shadow: 0 0 4px rgba(255, 165, 0, 0.4) !important;
    }
    
    /* Navigation bars */
    nav, header, .nav, .navbar, .header {
      background-color: rgba(139, 90, 43, 0.15) !important;
      border-color: #D4A574 !important;
    }
    
    /* Cards and panels */
    .card, .panel, .box, article, section {
      background-color: rgba(255, 248, 220, 0.7) !important;
      border-color: #D4A574 !important;
    }
    
    /* Tables */
    table {
      border-color: #D4A574 !important;
    }
    
    th {
      background-color: #A0826D !important;
      color: #FFF8DC !important;
      border-color: #D4A574 !important;
    }
    
    td {
      border-color: #D4A574 !important;
      background-color: rgba(255, 248, 220, 0.5) !important;
    }
    
    tr:hover td {
      background-color: rgba(212, 165, 116, 0.3) !important;
    }
    
    /* Scrollbars (Webkit browsers) */
    ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    
    ::-webkit-scrollbar-track {
      background: #FFF8DC !important;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #A0826D !important;
      border-radius: 6px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #8B7355 !important;
    }
    
    /* Code blocks */
    code, pre {
      background-color: rgba(139, 90, 43, 0.1) !important;
      border-color: #D4A574 !important;
      color: #5C4033 !important;
    }
    
    /* Modals and dialogs */
    .modal, .dialog, [role="dialog"] {
      background-color: rgba(255, 248, 220, 0.98) !important;
      border-color: #D4A574 !important;
    }
    
    /* Alerts and notifications */
    .alert, .notification, .message {
      background-color: rgba(255, 140, 0, 0.2) !important;
      border-color: #FF8C00 !important;
      color: #5C4033 !important;
    }
    
    /* Badges */
    .badge, .tag, .label {
      background-color: #A0826D !important;
      color: #FFF8DC !important;
    }
    
    /* Progress bars */
    progress, .progress-bar {
      background-color: #D4A574 !important;
    }
    
    progress::-webkit-progress-bar {
      background-color: rgba(212, 165, 116, 0.3) !important;
    }
    
    progress::-webkit-progress-value {
      background-color: #FF8C00 !important;
    }
    
    /* Tooltips */
    .tooltip, [data-tooltip] {
      background-color: #A0826D !important;
      color: #FFF8DC !important;
      border-color: #D4A574 !important;
    }
    
    /* Footer */
    footer {
      background-color: rgba(92, 64, 51, 0.3) !important;
      color: #8B4513 !important;
    }
    
    /* Sidebar */
    aside, .sidebar {
      background-color: rgba(255, 248, 220, 0.6) !important;
      border-color: #D4A574 !important;
    }
    
    /* Form labels */
    label {
      color: #5C4033 !important;
    }
    
    /* Checkboxes and radio buttons */
    input[type="checkbox"], input[type="radio"] {
      accent-color: #FF8C00 !important;
    }
    
    /* Placeholder text */
    ::placeholder {
      color: #A0826D !important;
      opacity: 0.8 !important;
    }
    
    /* Selection highlight */
    ::selection {
      background-color: #FF8C00 !important;
      color: white !important;
    }
    
    ::-moz-selection {
      background-color: #FF8C00 !important;
      color: white !important;
    }
  `;
  
  // Remove old style if exists
  const oldStyle = document.getElementById('lebron-theme');
  if (oldStyle) oldStyle.remove();
  
  // Add new style
  document.head.appendChild(style);
  
  console.log('[Image Replacer] Applied LeBron color theme to webpage');
}

function isGooglePage() {
  const hostname = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  // Check for regular Google pages
  const isGoogleDomain = hostname === 'www.google.com' || hostname === 'google.com';
  
  // Check for Chrome new tab page
  const isNewTab = url.startsWith('chrome://newtab') || 
                   url.startsWith('chrome-search://local-ntp') ||
                   hostname === 'newtab';
  
  return isGoogleDomain || isNewTab;
}

function applyGoogleBackground() {
  if (!isGooglePage()) return;
  
  const sunshineUrl = chrome.runtime.getURL(SUNSHINE_BG);
  
  // Apply to body
  document.body.style.backgroundImage = `url('${sunshineUrl}')`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundAttachment = 'fixed';
  
  console.log('[Image Replacer] Applied sunshine background to Google page');
}

async function initFaceDetector() {
  try {
    if (faceDetector) return faceDetector;

    // Check if Face Detection API is available
    if (!('FaceDetector' in window)) {
      console.warn('[Image Replacer] Face Detection API not available. Using fallback mode.');
      console.warn('[Image Replacer] To enable: chrome://flags/#enable-experimental-web-platform-features');
      return null;
    }

    faceDetector = new FaceDetector({ maxDetectedFaces: 5, fastMode: true });
    console.log('[Image Replacer] ✓ Face Detection API initialized');
    return faceDetector;
  } catch (err) {
    console.error('[Image Replacer] Error initializing Face Detector:', err);
    return null;
  }
}

function isLikelyPhoto(img) {
  try {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    
    if (w === 0 || h === 0) return false;
    
    const aspectRatio = w / h;
    const area = w * h;
    
    const isPhotoSize = area > 50000;
    const isPhotoAspect = aspectRatio >= 0.5 && aspectRatio <= 2.0;
    
    return isPhotoSize && isPhotoAspect;
  } catch (err) {
    return false;
  }
}

async function imageContainsFace(img) {
  try {
    const detector = await initFaceDetector();
    
    if (detector) {
      const bitmap = await createImageBitmap(img);
      const faces = await detector.detect(bitmap);
      
      if (faces.length > 0) {
        console.log(`[Image Replacer] Face detected in image (${faces.length} face(s)):`, img.src);
        return faces;
      }
      
      return null;
    }
    
    const isPhoto = isLikelyPhoto(img);
    if (isPhoto) {
      console.log('[Image Replacer] Likely photo detected (fallback mode):', img.src);
      return [];
    }
    return null;
    
  } catch (err) {
    console.error('[Image Replacer] Error during face detection:', err);
    return isLikelyPhoto(img) ? [] : null;
  }
}

async function drawFacesOnImage(img, faces) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    if (faces && faces.length > 0) {
      const overlayImg = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;

        const randomLebron = LEBRONS[Math.floor(Math.random() * LEBRONS.length)];
        console.log('randomLebron:', randomLebron);
        
        img.src = chrome.runtime.getURL(randomLebron);
      });
      
      faces.forEach(face => {
        const box = face.boundingBox;
        
        const scale = INCREASE_OVERALL_SIZE || 1.5;
        const newW = box.width * scale;
        const newH = box.height * scale + 20;
        const newX = box.x - (newW - box.width) / 2;
        const newY = box.y - (newH - box.height) / 2;
        ctx.drawImage(overlayImg, newX, newY, newW, newH);
      });
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (err) {
    console.error('[Image Replacer] Error drawing faces:', err);
    return null;
  }
}

async function imageContainsFaceCached(img) {
  try {
    const src = img.currentSrc || img.src || '';
    if (!src) return { hasFace: false, faces: null, dataUrl: null };

    if (detectionCache.has(src)) {
      return detectionCache.get(src);
    }

    const faces = await imageContainsFace(img);
    const hasFace = faces !== null;
    
    let dataUrl = null;
    if (hasFace) {
      dataUrl = await drawFacesOnImage(img, faces);
    }
    
    const result = { hasFace, faces, dataUrl };
    detectionCache.set(src, result);
    return result;
  } catch (err) {
    console.error('[Image Replacer] Error in cached face detection:', err);
    return { hasFace: false, faces: null, dataUrl: null };
  }
}

function normalizeSource(src) {
  if (!src) return "";
  const trimmed = String(src).trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed, window.location.href).href;
  } catch (err) {
    return trimmed;
  }
}

function sendToBackground(type, payload) {
  if (!chrome?.runtime?.sendMessage) return;
  try {
    chrome.runtime.sendMessage({ type, payload }, () => {
    });
  } catch (error) {
    console.warn("[Image Replacer] Failed to send message:", error);
  }
}

function extractNearestText(el) {
  if (!el) return "";
  const figure = el.closest("figure");
  if (figure) {
    const caption = figure.querySelector("figcaption");
    if (caption?.innerText) {
      return caption.innerText.replace(/\s+/g, " ").trim();
    }
  }

  const parent = el.closest("article, section, div, span, a") || el.parentElement;
  if (parent?.innerText) {
    const text = parent.innerText.replace(/\s+/g, " ").trim();
    return text.slice(0, 160);
  }

  return "";
}

function extractImageMetadata(img) {
  if (!img) return null;

  const src = normalizeSource(img.currentSrc || img.src || "");
  if (!src) return null;

  const altCandidates = [
    img.getAttribute("alt"),
    img.getAttribute("aria-label"),
    img.getAttribute("title")
  ];

  const alt = altCandidates.find((candidate) => typeof candidate === "string" && candidate.trim()) || "";
  const context = extractNearestText(img);

  return {
    src,
    alt: alt.replace(/\s+/g, " ").trim().slice(0, 140),
    context: context.slice(0, 160)
  };
}

function collectInitialImages(limit = METRICS_MAX_IMAGES) {
  const sources = [];
  const meta = [];

  Array.from(document.images || []).some((img) => {
    const entry = extractImageMetadata(img);
    if (!entry) return false;

    const existingIndex = sources.indexOf(entry.src);
    if (existingIndex === -1) {
      sources.push(entry.src);
      meta.push(entry);
    } else {
      const current = meta[existingIndex];
      meta[existingIndex] = {
        src: entry.src,
        alt: entry.alt || current.alt,
        context: entry.context || current.context
      };
    }

    return sources.length >= limit;
  });

  return { sources, meta };
}

function detectNamesFromText(texts = []) {
  const found = new Set();
  const combined = texts
    .filter((text) => typeof text === "string")
    .map((text) => text.toLowerCase());

  KNOWN_FIGURES.forEach(({ name, pattern }) => {
    if (combined.some((text) => pattern.test(text))) {
      found.add(name);
    }
  });

  return Array.from(found);
}

function gatherPageContext() {
  const metaDescription =
    document.querySelector('meta[name="description"]')?.content?.replace(/\s+/g, " ").trim() || "";

  const headings = Array.from(document.querySelectorAll("h1, h2"))
    .map((el) => el.innerText.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5);

  const paragraphs = Array.from(document.querySelectorAll("main p, article p, p"))
    .map((el) => el.innerText.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);

  const excerpt = paragraphs.join(" ").slice(0, 320);
  const imageTexts = metricsState.imageMeta.map((entry) => `${entry.alt} ${entry.context}`.trim());

  const detectedNames = detectNamesFromText([
    document.title || "",
    metaDescription,
    headings.join(" "),
    excerpt,
    ...imageTexts
  ]);

  return {
    pageContext: {
      description: metaDescription.slice(0, 280),
      headings,
      excerpt
    },
    detectedNames
  };
}

function broadcastPageContext() {
  const payload = gatherPageContext();
  sendToBackground("track-page-context", {
    ...payload,
    imageMeta: metricsState.imageMeta.slice(0, 5)
  });
}

function scheduleContextBroadcast() {
  if (contextBroadcastTimer) clearTimeout(contextBroadcastTimer);
  contextBroadcastTimer = setTimeout(() => {
    contextBroadcastTimer = null;
    broadcastPageContext();
  }, 200);
}

function upsertImageMeta(entry) {
  if (!entry || !entry.src) return;
  const index = metricsState.imageMeta.findIndex((item) => item.src === entry.src);
  if (index >= 0) {
    metricsState.imageMeta[index] = {
      ...metricsState.imageMeta[index],
      ...entry
    };
  } else {
    metricsState.imageMeta.push(entry);
    if (metricsState.imageMeta.length > 5) {
      metricsState.imageMeta = metricsState.imageMeta.slice(0, 5);
    }
  }

  scheduleContextBroadcast();
}

function captureInitialPageView() {
  if (metricsState.initialized) return;

  const { sources, meta } = collectInitialImages(METRICS_MAX_IMAGES);
  metricsState.topImages = [...sources];
  metricsState.imageMeta = [...meta];
  sources.forEach((src) => seenImageSources.add(src));

  metricsState.maxScrollDepth = Math.round(computeScrollDepth());

  sendToBackground("track-page-view", {
    title: document.title || "",
    url: window.location.href,
    topImages: sources,
    imageMeta: metricsState.imageMeta
  });

  // Report initial scroll depth
  sendToBackground("track-scroll-depth", {
    maxScrollDepth: metricsState.maxScrollDepth
  });

  broadcastPageContext();

  metricsState.initialized = true;
}

function scheduleScrollReport() {
  if (scrollReportTimer) return;
  scrollReportTimer = setTimeout(() => {
    scrollReportTimer = null;
    sendToBackground("track-scroll-depth", {
      maxScrollDepth: metricsState.maxScrollDepth
    });
  }, SCROLL_REPORT_THROTTLE_MS);
}

function recordTopImage(src, metaOverride = null) {
  const normalized = normalizeSource(src);
  if (!normalized) return;

  if (!seenImageSources.has(normalized) && metricsState.topImages.length < METRICS_MAX_IMAGES) {
    seenImageSources.add(normalized);
    metricsState.topImages.push(normalized);
  }

  const entry = metaOverride && metaOverride.src === normalized ? metaOverride : { src: normalized };
  upsertImageMeta(entry);

  const payload = {};
  if (metricsState.topImages.length) {
    payload.topImages = [...metricsState.topImages];
  }
  if (metricsState.imageMeta.length) {
    payload.imageMeta = metricsState.imageMeta.slice(0, 5);
  }
  sendToBackground("track-image-sources", payload);
}

function bufferClickText(text) {
  if (!text) return;
  clickBuffer.push(text);
  if (clickBuffer.length > EVENT_LIMIT) {
    clickBuffer = clickBuffer.slice(-EVENT_LIMIT);
  }

  if (clickFlushTimer) {
    clearTimeout(clickFlushTimer);
  }

  clickFlushTimer = setTimeout(() => {
    flushClicks();
  }, CLICK_FLUSH_DEBOUNCE_MS);
}

function flushClicks() {
  if (!clickBuffer.length) return;
  sendToBackground("track-clicks", { clicks: [...clickBuffer] });
  clickBuffer = [];
  if (clickFlushTimer) {
    clearTimeout(clickFlushTimer);
    clickFlushTimer = null;
  }
}

function extractClickText(event) {
  if (!event) return "";
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  const candidates = path.length ? path : [event.target];

  for (const node of candidates) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node;

    const labelCandidates = [
      el.innerText,
      el.getAttribute?.("aria-label"),
      el.getAttribute?.("alt"),
      el.getAttribute?.("title"),
      el.value
    ];

    for (const candidate of labelCandidates) {
      if (typeof candidate !== "string") continue;
      const cleaned = candidate.replace(/\s+/g, " ").trim();
      if (cleaned) {
        return cleaned.slice(0, 120);
      }
    }
  }

  if (event.target && event.target.nodeType === Node.TEXT_NODE) {
    const text = String(event.target.textContent || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 120);
  }

  return "";
}

function handleClick(event) {
  const text = extractClickText(event);
  if (text) {
    bufferClickText(text);
  }
}

function computeScrollDepth() {
  const doc = document.documentElement || document.body;
  if (!doc) return 0;

  const scrollTop = window.scrollY ?? doc.scrollTop ?? document.body.scrollTop ?? 0;
  const viewportHeight = window.innerHeight || doc.clientHeight || 0;
  const scrollHeight = doc.scrollHeight || document.body.scrollHeight || 0;

  if (!scrollHeight) return 0;
  if (scrollHeight <= viewportHeight) return 100;

  const depth = ((scrollTop + viewportHeight) / scrollHeight) * 100;
  return Math.max(0, Math.min(100, depth));
}

function handleScroll() {
  const depth = Math.round(computeScrollDepth());
  if (depth > metricsState.maxScrollDepth) {
    metricsState.maxScrollDepth = depth;
    scheduleScrollReport();
  }
}

function initMetricsTracking() {
  if (metricsState.listenersBound) return;

  captureInitialPageView();

  document.addEventListener("click", handleClick, true);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("beforeunload", flushClicks);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushClicks();
    }
  });

  metricsState.listenersBound = true;
}

function replaceImageElement(img, dataUrl) {
  try {
    if (!img || !dataUrl) return;

    const alreadyMarked = img.classList && img.classList.contains(REPLACED_CLASS);
    if (alreadyMarked) return;

    const currentSrc = img.currentSrc || img.src || "";
    const meta = extractImageMetadata(img);
    if (currentSrc) {
      img.dataset.originalSrc = currentSrc;
      recordTopImage(currentSrc, meta);
    }

    if (img.srcset) img.dataset.originalSrcset = img.srcset;
    if (img.dataset && img.dataset.src) img.dataset.originalDataSrc = img.dataset.src;

    try {
      img.src = dataUrl;
    } catch (e) {
      // ignore per-image assignment errors
    }

    if (img.srcset) {
      try {
        img.srcset = dataUrl;
      } catch (e) {
        // ignore
      }
    }

    if (img.dataset && img.dataset.src) {
      img.dataset.src = dataUrl;
    }

    try {
      img.classList.add(REPLACED_CLASS);
    } catch (e) {
      // ignore
    }
    img.dataset.replaced = "true";

    console.log(`[Image Replacer] Replaced image with face annotations: ${currentSrc || "(empty src)"}`);
  } catch (err) {
    console.error("[Image Replacer] Error replacing image element:", err);
  }
}

function restoreImageElement(img) {
  try {
    if (!img) return;

    const wasReplaced = img.dataset && img.dataset.replaced === "true";
    if (!wasReplaced && !(img.classList && img.classList.contains(REPLACED_CLASS))) return;

    if (img.dataset.originalSrc !== undefined) img.src = img.dataset.originalSrc;
    if (img.dataset.originalSrcset !== undefined) img.srcset = img.dataset.originalSrcset;
    if (img.dataset.originalDataSrc !== undefined) img.dataset.src = img.dataset.originalDataSrc;

    try {
      img.classList.remove(REPLACED_CLASS);
    } catch (e) {
      // ignore
    }
    delete img.dataset.replaced;
    delete img.dataset.originalSrc;
    delete img.dataset.originalSrcset;
    delete img.dataset.originalDataSrc;

    // also remove noperson markers if present
    try { img.classList.remove(NO_PERSON_FLAG); } catch (e) { }
    delete img.dataset[NO_PERSON_FLAG];

    console.log("[Image Replacer] Restored image to original src.");
  } catch (err) {
    console.error("[Image Replacer] Error restoring image element:", err);
  }
}

async function scanAndReplace() {
  if (isScanning) {
    console.log("[Image Replacer] Scan already in progress, skipping...");
    return;
  }
  
  isScanning = true;
  
  try {
    const images = Array.from(document.images || []);
    if (!images.length) {
      console.log("[Image Replacer] No images found on this page.");
      isScanning = false;
      return;
    }

    console.log(`[Image Replacer] Scanning ${images.length} images for faces...`);
    
    // Process each image independently without waiting - fire and forget
    images.forEach((img) => {
      processImageIndividually(img);
    });
    
    console.log('[Image Replacer] Face detection started for all images (processing individually)');
  } catch (err) {
    console.error('[Image Replacer] Error in scanAndReplace:', err);
  } finally {
    isScanning = false;
  }
}

function scheduleFullScan() {
  if (fullScanTimer) clearTimeout(fullScanTimer);
  fullScanTimer = setTimeout(async () => {
    fullScanTimer = null;
    try {
      console.log('[Image Replacer] Running scheduled scan...');
      await scanAndReplace();
    } catch (e) {
      console.error("[Image Replacer] Error during full scan:", e);
    }
  }, FULL_SCAN_DEBOUNCE_MS);
}

function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    // If fade mode is enabled, fade new images instead of face detection
    if (fadeImagesToLeBron) {
      let newImages = [];
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.tagName === "IMG") {
              newImages.push(node);
            } else {
              const imgs = node.querySelectorAll ? node.querySelectorAll("img") : [];
              if (imgs.length) newImages.push(...Array.from(imgs));
            }
          });
        }
        if (mutation.type === "attributes" && mutation.target && mutation.target.tagName === "IMG") {
          newImages.push(mutation.target);
        }
      }
      
      if (newImages.length > 0) {
        console.log(`[Image Replacer] Fading ${newImages.length} new images to LeBron...`);
        newImages.forEach((img, index) => {
          fadeImageToLeBron(img, index * 50);
        });
      }
      return;
    }

    // Face detection mode
    let sawRelevant = false;
    const newImages = [];

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.tagName === "IMG") {
            newImages.push(node);
            sawRelevant = true;
            return;
          }

          const imgs = node.querySelectorAll ? node.querySelectorAll("img") : [];
          if (imgs.length) {
            newImages.push(...Array.from(imgs));
            sawRelevant = true;
          }
        });
      }

      if (mutation.type === "attributes" && mutation.target && mutation.target.tagName === "IMG") {
        newImages.push(mutation.target);
        sawRelevant = true;
      }
    }

    if (sawRelevant && newImages.length > 0) {
      console.log(`[Image Replacer] Detected ${newImages.length} new images, processing individually...`);
      
      // Process each new image individually and asynchronously
      newImages.forEach((img) => {
        processImageIndividually(img);
      });
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "data-src", "srcset"]
  });

  // Only run initial scan if not in fade mode
  if (!fadeImagesToLeBron) {
    scanAndReplace();
  }
}

// Process a single image asynchronously
async function processImageIndividually(img) {
  try {
    const alreadyProcessed = img.classList && img.classList.contains(REPLACED_CLASS);
    const markedNoFace = img.classList && img.classList.contains(NO_PERSON_FLAG);
    
    if (alreadyProcessed || markedNoFace) return;
    
    if (!img.complete || !img.naturalWidth) {
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1000);
      });
    }
    
    const result = await imageContainsFaceCached(img);
    
    if (result.hasFace && result.dataUrl) {
      replaceImageElement(img, result.dataUrl);
      console.log('[Image Replacer] ✅ LeBron applied to new image:', img.src.substring(0, 50));
      
      // if (downloadsEnabled) {
      //   try {
      //     chrome.runtime.sendMessage({
      //       type: 'save-detected-image',
      //       dataUrl: result.dataUrl,
      //       originalSrc: img.currentSrc || img.src
      //     }, (response) => {
      //       if (response && response.success) {
      //         console.log('[Image Replacer] Saved detected face image to downloads');
      //       }
      //     });
      //   } catch (e) {
      //     console.error('[Image Replacer] Error saving image:', e);
      //   }
      // }
    } else {
      try {
        img.classList.add(NO_PERSON_FLAG);
        img.dataset[NO_PERSON_FLAG] = 'true';
      } catch (e) {
        // ignore
      }
    }
  } catch (imgError) {
    console.error('[Image Replacer] Error processing individual image:', imgError);
  }
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

  const images = Array.from(document.images || []);
  images.forEach(restoreImageElement);
  
  // Clear detection cache
  detectionCache.clear();
}

function handleState(enabled) {
  extensionEnabled = enabled;
  if (enabled) {
    console.log("[Image Replacer] Enabling face detection and observer.");
    if (!observer || !fadeImagesToLeBron) {
      startObserving();
    }
  } else {
    console.log("[Image Replacer] Disabling face detection.");
    // Only stop observer if fade mode is also off
    if (!fadeImagesToLeBron) {
      stopObservingAndRestore();
    }
  }
}

initMetricsTracking();

initMetricsTracking();

// Load initial settings
chrome.storage.sync.get({ enabled: true, fadeImagesToLeBron: false }, (result) => {
  extensionEnabled = Boolean(result.enabled);
  fadeImagesToLeBron = Boolean(result.fadeImagesToLeBron);
  
  console.log(`[Image Replacer] Initial state - Extension: ${extensionEnabled ? 'enabled' : 'disabled'}, Fade: ${fadeImagesToLeBron ? 'enabled' : 'disabled'}`);
  
  // Start observer if either face detection OR fade is enabled
  if (extensionEnabled || fadeImagesToLeBron) {
    startObserving();
  }
  
  // If fade mode is enabled, immediately fade all images
  if (fadeImagesToLeBron) {
    fadeAllImagesToLeBronPermanent();
  }
});

// Apply Google background immediately if on Google page
// applyGoogleBackground();

// Apply LeBron theme to ALL pages
// applyLeBronTheme();

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "toggle-image-replacement") {
    extensionEnabled = message.enabled;
    handleState(message.enabled);
    sendResponse({ status: "ok" });
    return true;
  }
  
  if (message?.type === "toggle-fade-images") {
    const previousFade = fadeImagesToLeBron;
    fadeImagesToLeBron = message.enabled;
    console.log(`[Image Replacer] Fade to LeBron toggled to: ${fadeImagesToLeBron ? 'enabled' : 'disabled'}`);
    
    if (fadeImagesToLeBron) {
      // When enabling fade, start observer if not already running
      if (!observer) {
        startObserving();
      } else {
        // Restart observer to ensure it's in fade mode
        observer.disconnect();
        observer = null;
        startObserving();
      }
      
      // Immediately start fading all images
      console.log('[Image Replacer] Starting fade for all images...');
      fadeAllImagesToLeBronPermanent();
    } else if (!fadeImagesToLeBron && previousFade) {
      // When disabling fade, only stop observer if face detection is also off
      if (!extensionEnabled && observer) {
        observer.disconnect();
        observer = null;
      } else if (extensionEnabled) {
        // Restart observer in face detection mode
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        startObserving();
      }
    }
    
    sendResponse({ status: "ok" });
    return true;
  }
});

// Function to permanently fade all images to LeBron image (irreversible)
// Conservative detector for images that effectively make up the full page.
// Returns true for direct-image pages, the only image on the page, or
// images that cover a large fraction of the viewport. This is intentionally
// conservative to avoid replacing the whole tab with a LeBron image.
function isFullPageImage(img) {
  try {
    if (!img || !(img instanceof HTMLImageElement)) return false;

    // If page URL looks like an image file (visiting the image directly), treat as full-page
    if (isImagePage()) return true;

    // If this is the only image in the document, don't replace it
    const allImages = document.images || [];
    if (allImages.length === 1) return true;

    const rect = img.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    if (rect.width <= 0 || rect.height <= 0 || vw <= 0 || vh <= 0) return false;

    const viewportArea = vw * vh;
    const imgArea = rect.width * rect.height;

    // If the image covers more than 60% of the viewport area, consider it full-page
    if (imgArea / viewportArea > 0.6) return true;

    // If image spans most of viewport in both dimensions, also consider it full-page
    if (rect.width >= vw * 0.9 && rect.height >= vh * 0.8) return true;

    return false;
  } catch (err) {
    console.warn('[Image Replacer] isFullPageImage error:', err);
    return false;
  }
}

function fadeAllImagesToLeBronPermanent() {
  const lebronUrl = chrome.runtime.getURL(LEBRON);
  const images = Array.from(document.images || []);

  // If this page is a direct image URL (e.g. visiting an image file), skip
  // fading entirely to avoid turning the whole tab into LeBron.
  if (isImagePage()) {
    console.log('[Image Replacer] Skipping fadeAllImagesToLeBronPermanent on direct image page');
    return;
  }

  console.log(`[Image Replacer] Permanently fading ${images.length} images to LeBron (skipping full-page images)`);

  images.forEach((img, index) => {
    try {
      if (isFullPageImage(img)) {
        console.log('[Image Replacer] Skipping full-page image during fade:', img.src || img.currentSrc || '(no src)');
        return;
      }
    } catch (e) {
      // if detector fails, be conservative and skip changing this image
      console.warn('[Image Replacer] isFullPageImage check failed, skipping image:', e);
      return;
    }

    fadeImageToLeBron(img, index * 50);
  });
}

// Helper function to fade a single image to LeBron
function fadeImageToLeBron(img, delay = 0) {
  const lebronUrl = chrome.runtime.getURL(LEBRON);
  
  setTimeout(() => {
    // Safety: do not replace a full-page image (this would make the tab a single LeBron image)
    try {
      if (isFullPageImage(img)) {
        console.log('[Image Replacer] Skipping fade for full-page image:', img.src || img.currentSrc || '(no src)');
        return;
      }
    } catch (e) {
      console.warn('[Image Replacer] isFullPageImage threw, skipping fade for image:', e);
      return;
    }
    // Set up CSS transition
    img.style.transition = `opacity ${FADE_TRANSITION_MS}ms ease-in-out`;
    
    // Fade out
    img.style.opacity = '0';
    
    // After fade out completes, swap image and fade back in
    setTimeout(() => {
      img.src = lebronUrl;
      if (img.srcset) img.srcset = '';
      if (img.dataset && img.dataset.src) img.dataset.src = lebronUrl;
      
      // Wait a brief moment for the image to load, then fade in
      setTimeout(() => {
        img.style.opacity = '1';
      }, 100);
    }, FADE_TRANSITION_MS);
  }, delay);
}

// Listen for storage changes (in case settings change from another tab)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.fadeImagesToLeBron) {
    const previousFade = fadeImagesToLeBron;
    fadeImagesToLeBron = Boolean(changes.fadeImagesToLeBron.newValue);
    console.log(`[Image Replacer] Fade to LeBron updated from storage: ${fadeImagesToLeBron ? 'enabled' : 'disabled'}`);
    
    if (fadeImagesToLeBron) {
      // Start observer if not running
      if (!observer) {
        startObserving();
      } else {
        // Restart observer in fade mode
        observer.disconnect();
        observer = null;
        startObserving();
      }
      
      console.log('[Image Replacer] Starting fade from storage change...');
      fadeAllImagesToLeBronPermanent();
    } else if (!fadeImagesToLeBron && previousFade) {
      // When disabling fade, only stop observer if face detection is also off
      if (!extensionEnabled && observer) {
        observer.disconnect();
        observer = null;
      } else if (extensionEnabled) {
        // Restart in face detection mode
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        startObserving();
      }
    }
  }
  
  if (namespace === 'sync' && changes.enabled) {
    const previousEnabled = extensionEnabled;
    extensionEnabled = Boolean(changes.enabled.newValue);
    console.log(`[Image Replacer] Extension enabled state updated: ${extensionEnabled ? 'enabled' : 'disabled'}`);
    
    // Handle observer state based on both settings
    if (extensionEnabled && !previousEnabled) {
      // Face detection turned on - start observer if not already running for fade
      if (!observer && !fadeImagesToLeBron) {
        startObserving();
      }
    } else if (!extensionEnabled && previousEnabled) {
      // Face detection turned off - only stop if fade is also off
      if (!fadeImagesToLeBron && observer) {
        stopObservingAndRestore();
      }
    }
  }
});

let milkOverlay = null;
let loveOverlay = null;
let milkOverlayVisible = false;
let loveOverlayVisible = false;
let milkHideTimeout = null;
let loveHideTimeout = null;

// Create milk overlay element
function createOverlay(mode) {
  // If mode is 'milk' or 'love' we create a full-page overlay (covering the
  // viewport). For other modes we create the small badge. This keeps milk/love
  // as dramatic full-tab overlays while avoiding any full-page overlay for
  // other uses.
  if (mode === 'milk' && milkOverlay) return milkOverlay;
  if (mode === 'love' && loveOverlay) return loveOverlay;

  if (!document.body) {
    console.error('[Content Script] document.body not available for overlay creation');
    return null;
  }

  const overlay = document.createElement('img');
  overlay.id = `extension-${mode}-overlay`;
  overlay.src = chrome.runtime.getURL(`assets/${mode}.png`);
  overlay.alt = mode;

  const isFullPage = mode === 'milk' || mode === 'love';

  if (isFullPage) {
    // Full-viewport overlay (covers the entire tab)
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      object-fit: cover !important;
      z-index: 999999999 !important;
      pointer-events: none !important;
      opacity: 0;
      transition: opacity 0.3s ease !important;
      display: block !important;
    `;
  } else {
    // Small floating badge in the top-right corner
    overlay.style.cssText = `
      position: fixed !important;
      top: 12px !important;
      right: 12px !important;
      width: 160px !important;
      height: auto !important;
      object-fit: contain !important;
      z-index: 99999999 !important;
      pointer-events: none !important;
      opacity: 0;
      transition: opacity 0.3s ease !important;
      display: block !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.35) !important;
    `;
  }

  try {
    document.body.appendChild(overlay);
    console.log('[Content Script] Created overlay element:', mode, overlay, 'fullPage=', isFullPage);
  } catch (err) {
    console.error('[Content Script] Failed to append overlay to body:', err);
    return null;
  }

  if (mode === 'milk') {
    milkOverlay = overlay;
  } else if (mode === 'love') {
    loveOverlay = overlay;
  }

  return overlay;
}

// Show milk overlay
function showMilkOverlay() {
  // Clear any existing timeout
  if (milkHideTimeout) {
    clearTimeout(milkHideTimeout);
    milkHideTimeout = null;
  }
  // Hide love overlay if visible
  hideLoveOverlay();
  
  // Ensure overlay exists, create if needed
  if (!milkOverlay) {
    milkOverlay = createOverlay('milk');
  }
  
  // If still null, try to find existing overlay in DOM
  if (!milkOverlay) {
    milkOverlay = document.getElementById('extension-milk-overlay');
  }
  
  // If still null, try creating again after a short delay
  if (!milkOverlay && document.body) {
    console.warn('[Content Script] Retrying milk overlay creation...');
    setTimeout(() => {
      milkOverlay = createOverlay('milk');
      if (milkOverlay) {
        milkOverlay.style.display = 'block';
        milkOverlay.style.opacity = '1';
        milkOverlayVisible = true;
      }
    }, 100);
    return;
  }
  
  if (milkOverlay) {
    // Ensure overlay is visible
    milkOverlay.style.display = 'block';
    milkOverlay.style.opacity = '1';
    milkOverlayVisible = true;
    console.log('[Content Script] Milk overlay shown, element:', milkOverlay);
  } else {
    console.error('[Content Script] Failed to create/show milk overlay - document.body:', !!document.body);
  }
}

// Show love overlay
function showLoveOverlay() {
  // Clear any existing timeout
  if (loveHideTimeout) {
    clearTimeout(loveHideTimeout);
    loveHideTimeout = null;
  }
  // Hide milk overlay if visible
  hideMilkOverlay();
  
  // Ensure overlay exists, create if needed
  if (!loveOverlay) {
    loveOverlay = createOverlay('love');
  }
  
  // If still null, try to find existing overlay in DOM
  if (!loveOverlay) {
    loveOverlay = document.getElementById('extension-love-overlay');
  }
  
  // If still null, try creating again after a short delay
  if (!loveOverlay && document.body) {
    console.warn('[Content Script] Retrying love overlay creation...');
    setTimeout(() => {
      loveOverlay = createOverlay('love');
      if (loveOverlay) {
        loveOverlay.style.display = 'block';
        loveOverlay.style.opacity = '1';
        loveOverlayVisible = true;
      }
    }, 100);
    return;
  }
  
  if (loveOverlay) {
    // Ensure overlay is visible
    loveOverlay.style.display = 'block';
    loveOverlay.style.opacity = '1';
    loveOverlayVisible = true;
    console.log('[Content Script] Love overlay shown, element:', loveOverlay);
  } else {
    console.error('[Content Script] Failed to create/show love overlay - document.body:', !!document.body);
  }
}

// Hide milk overlay
function hideMilkOverlay() {
  if (milkHideTimeout) {
    clearTimeout(milkHideTimeout);
    milkHideTimeout = null;
  }
  if (milkOverlay) {
    milkOverlay.style.opacity = '0';
    milkOverlayVisible = false;
    setTimeout(() => {
      if (milkOverlay && !milkOverlayVisible) {
        milkOverlay.style.display = 'none';
      }
    }, 300);
  }
}

// Hide love overlay
function hideLoveOverlay() {
  if (loveHideTimeout) {
    clearTimeout(loveHideTimeout);
    loveHideTimeout = null;
  }
  if (loveOverlay) {
    loveOverlay.style.opacity = '0';
    loveOverlayVisible = false;
    setTimeout(() => {
      if (loveOverlay && !loveOverlayVisible) {
        loveOverlay.style.display = 'none';
      }
    }, 300);
  }
}

// Handle showing overlay based on type
function handleShowOverlay(overlayType) {
  console.log('[Content Script] handleShowOverlay called with type:', overlayType);
  if (overlayType === 'safe') {
    console.log('[Content Script] Showing love overlay');
    showLoveOverlay();
    if (loveHideTimeout) {
      clearTimeout(loveHideTimeout);
    }
    loveHideTimeout = setTimeout(() => {
      hideLoveOverlay();
      loveHideTimeout = null;
    }, 15000);
  } else { // 'unsafe' or default
    console.log('[Content Script] Showing milk overlay');
    showMilkOverlay();
    if (milkHideTimeout) {
      clearTimeout(milkHideTimeout);
    }
    milkHideTimeout = setTimeout(() => {
      hideMilkOverlay();
      milkHideTimeout = null;
    }, 15000);
  }
}

// Listen for messages from camera window
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'showOverlay') {
    const overlayType = message.overlayType || 'unsafe';
    console.log('[Content Script] Received showOverlay message:', overlayType, 'sender:', sender);
    
    // Ensure overlays exist before showing
    if (!milkOverlay || !loveOverlay) {
      console.log('[Content Script] Overlays not initialized, initializing now...');
      initializeOverlays();
    }
    
    handleShowOverlay(overlayType);
    sendResponse({ success: true });
    return true; // Indicate we will send a response asynchronously
  } else if (message && message.action === 'hideOverlay') {
    hideMilkOverlay();
    hideLoveOverlay();
    sendResponse({ success: true });
    return true;
  } else if (message && message.action === 'showMilk') {
    // Legacy support
    if (!milkOverlay) {
      initializeOverlays();
    }
    handleShowOverlay('unsafe');
    sendResponse({ success: true });
    return true;
  } else if (message && message.action === 'hideMilk') {
    hideMilkOverlay();
    sendResponse({ success: true });
    return true;
  }
  // Return false to indicate we didn't handle this message
  return false;
});

// Also listen to chrome.storage for cross-tab synchronization
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.showOverlay) {
    if (changes.showOverlay.newValue === true) {
      // Ensure overlays exist
      if (!milkOverlay || !loveOverlay) {
        console.log('[Content Script] Overlays not initialized in storage listener, initializing now...');
        initializeOverlays();
      }
      
      // Get overlayType from storage since it might not be in changes object
      chrome.storage.local.get(['overlayType'], (result) => {
        const overlayType = result.overlayType || changes.overlayType?.newValue || 'unsafe';
        console.log('[Content Script] Showing overlay from storage:', overlayType);
        handleShowOverlay(overlayType);
      });
    } else {
      hideMilkOverlay();
      hideLoveOverlay();
    }
  }
});

// Check storage on page load in case we missed the message
chrome.storage.local.get(['showOverlay', 'overlayType', 'overlayTimestamp'], (result) => {
  if (result.showOverlay && result.overlayTimestamp && result.overlayType) {
    const timeSince = Date.now() - result.overlayTimestamp;
    if (timeSince < 15000) {
      handleShowOverlay(result.overlayType);
      // Adjust timeout for remaining time
      if (result.overlayType === 'safe') {
        loveHideTimeout = setTimeout(() => {
          hideLoveOverlay();
          loveHideTimeout = null;
        }, 15000 - timeSince);
      } else {
        milkHideTimeout = setTimeout(() => {
          hideMilkOverlay();
          milkHideTimeout = null;
        }, 15000 - timeSince);
      }
    }
  }
});

// Ensure overlays are created when DOM is ready
function initializeOverlays() {
  if (document.body) {
    console.log('[Content Script] Initializing overlays...');
    milkOverlay = createOverlay('milk');
    loveOverlay = createOverlay('love');
    console.log('[Content Script] Overlays initialized - milk:', !!milkOverlay, 'love:', !!loveOverlay);
  } else {
    console.log('[Content Script] Waiting for DOMContentLoaded to initialize overlays...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Content Script] DOMContentLoaded fired, initializing overlays...');
      milkOverlay = createOverlay('milk');
      loveOverlay = createOverlay('love');
      console.log('[Content Script] Overlays initialized - milk:', !!milkOverlay, 'love:', !!loveOverlay);
    });
  }
}

// Initialize overlays immediately
initializeOverlays();

// Also try again after a short delay in case body wasn't ready
setTimeout(() => {
  if (!milkOverlay || !loveOverlay) {
    console.log('[Content Script] Retrying overlay initialization after delay...');
    initializeOverlays();
  }
}, 500);



