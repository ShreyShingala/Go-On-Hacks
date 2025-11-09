const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stopButton = document.getElementById('stop');
const errorDiv = document.getElementById('error');
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const strokeCountDisplay = document.getElementById('strokeCount');
let stream = null;
let model = null;
let isDetecting = false;
let handPositionHistory = [];
const HISTORY_LENGTH = 30; // Increased for better detection

const STROKE_DETECTION_THRESHOLD = 80; 
const MIN_STROKE_DISTANCE = 100;
const NOISE_THRESHOLD = 5;
const MAX_STROKES = 10;
let lastStrokeDirection = null;
let strokeCount = 0;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        mirror: true,
      },
      audio: false
    });
    
    video.srcObject = stream;
    // Set canvas size to match video when metadata loads
    video.addEventListener('loadedmetadata', () => {
      canvas.width = 1280;
      canvas.height = 720;
      statusDiv.textContent = 'Camera started. Loading hand detection model...';
      initHandDetection();
    });

    errorDiv.textContent = '';
    console.log('Camera started successfully');
  } catch (err) {
    console.error('Error accessing camera:', err);
    errorDiv.textContent = `Error: ${err.message || 'Could not access camera'}`;
  }
}

function stopCamera() {
  // Stop the detection loop
  isDetecting = false;
  
  // Stop camera stream
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    console.log('Camera stopped');
  }
  
  handPositionHistory = [];
  strokeCount = 0;
  updateProgressBar();
  hideOverlay('milk');
  hideOverlay('love');
}

async function initHandDetection() {
  try {
    statusDiv.textContent = 'Loading Handtrack.js model...';
    console.log('Loading Handtrack.js model...');
    
    // Load Handtrack.js model
    const modelParams = {
      flipHorizontal: true,
      maxNumBoxes: 4,
      scoreThreshold: 0.4,
      iouThreshold: 0.3,
    };
    
    model = await handTrack.load(modelParams);
    
    statusDiv.textContent = 'Hand detection model loaded! Move your hands to see detection.';
    console.log('Handtrack.js model loaded:', model);
    
    // Wait for video to be ready
    if (video.readyState >= 2) {
      detectHands();
    } else {
      video.addEventListener('loadeddata', () => {
        detectHands();
      }, { once: true });
    }

  } catch (err) {
    console.error('Error initializing hand detection:', err);
    errorDiv.textContent = `Hand detection error: ${err.message}`;
    statusDiv.textContent = 'Camera active but hand detection failed.';
  }
}

function detectHands() {
  if (isDetecting) return;
  if (!model || !stream) {
    console.error('Model or stream not ready');
    return;
  }
  
  isDetecting = true;
  console.log('Starting hand detection...');
  
  // Start detection loop
  function runDetection() {
    if (!isDetecting || !model || !stream) {
      return;
    }

    if (!validateVideo()) {
      console.warn('Skipping detection - video not ready');
      if (isDetecting) {
        requestAnimationFrame(runDetection);
      }
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Detect hands in the current video frame
    model.detect(canvas).then(predictions => {

    // Log each prediction to see its structure
      if (predictions && predictions.length > 0) {
        predictions
        .filter(pred => pred.label === 'open' || pred.label === 'closed')
        .forEach((pred, idx) => {
          // console.log(`Prediction ${idx}:`, {
          //   label: pred.label,
          //   score: pred.score,
          //   bbox: pred.bbox
          // });
          
          const [x, y, width, height] = pred.bbox;
          const centerX = Math.round(x + width / 2);
          const centerY = Math.round(y + height / 2);
          handPositionHistory.push([centerX, centerY]);

          // Keep history length constant
          if (handPositionHistory.length > HISTORY_LENGTH) {
            handPositionHistory.shift();
          }

          if (handPositionHistory.length >= 10) {
            detectStrokingMotion();
          }
        });
      }
      
      // Continue detection loop
      if (isDetecting) {
        requestAnimationFrame(runDetection);
      }

    }).catch(err => {
      console.error('Detection error:', err);
      if (isDetecting) {
        requestAnimationFrame(runDetection);
      }
    });
  }
  
  // Start detection
  runDetection();
}

stopButton.addEventListener('click', () => {
  stopCamera();
  window.close();
});

// Start camera when page loads
window.addEventListener('DOMContentLoaded', () => {
  // Initialize progress bar
  updateProgressBar();
  startCamera();
});

// Clean up when page is closed
window.addEventListener('beforeunload', () => {
  stopCamera();
});

// Check if the input video is valid
function validateVideo() {
  const checks = {
    videoExists: !!video,
    hasSrcObject: !!(video && video.srcObject),
    isPlaying: !!(video && !video.paused && !video.ended),
    hasDimensions: !!(video && video.videoWidth > 0 && video.videoHeight > 0),
    readyState: video ? video.readyState : 0,
    streamActive: !!(stream && stream.active),
    streamTracks: stream ? stream.getVideoTracks().length : 0
  };
  
  const videoInfo = {
    readyState: video?.readyState, // 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
    paused: video?.paused,
    ended: video?.ended,
    videoWidth: video?.videoWidth,
    videoHeight: video?.videoHeight,
    srcObject: video?.srcObject ? 'present' : 'null',
    currentTime: video?.currentTime,
    duration: video?.duration
  };
  
  // Check if video is valid for detection
  const isValid = checks.videoExists && 
                   checks.hasSrcObject && 
                   checks.hasDimensions && 
                   checks.readyState >= 2 && 
                   checks.streamActive;
  
  if (!isValid) {
    console.warn('⚠️ Video is NOT valid for detection:', {
      missing: Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
    });
  }
  
  return isValid;
}

function detectStrokingMotion() {
  if (handPositionHistory.length < 10) return;
  
  // Get recent positions (last 10 frames for better smoothing)
  const recent = handPositionHistory.slice(-10);
  const ys = recent.map(pos => pos[1]);
  
  // Calculate total vertical distance traveled (not just min-max)
  let totalDistance = 0;
  for (let i = 1; i < recent.length; i++) {
    const distance = Math.abs(recent[i][1] - recent[i-1][1]);
    // Only count significant movements (filter noise)
    if (distance > NOISE_THRESHOLD) {
      totalDistance += distance;
    }
  }
  
  // Find the range of movement
  const highestY = Math.max(...ys);
  const lowestY = Math.min(...ys);
  const yRange = highestY - lowestY;
  
  // Require both: significant range AND sufficient total distance
  if (yRange < STROKE_DETECTION_THRESHOLD || totalDistance < MIN_STROKE_DISTANCE) {
    return; // Not a big enough stroke
  }
  
  // Determine direction based on where the hand started vs ended
  const startY = recent[0][1];
  const endY = recent[recent.length - 1][1];
  const yDiff = startY - endY; // Positive = moved up, Negative = moved down
  
  let currentDirection = null;
  if (Math.abs(yDiff) > STROKE_DETECTION_THRESHOLD / 2) {
    currentDirection = yDiff > 0 ? 'up' : 'down';
  }
  
  // Only count stroke if direction changed AND it was a significant movement
  if (currentDirection && lastStrokeDirection && currentDirection !== lastStrokeDirection) {
    // Additional check: make sure we're not just jittering
    // The hand should have moved a significant distance in the new direction
    const recentMovement = Math.abs(endY - startY);
    if (recentMovement > STROKE_DETECTION_THRESHOLD / 2) {
      strokeCount++;
      console.log(`🔄 STROKE DETECTED! Count: ${strokeCount} | Range: ${Math.round(yRange)}px | Distance: ${Math.round(totalDistance)}px`);
      updateProgressBar();
      
      // Check if bar is full
      if (strokeCount >= MAX_STROKES) {
        notifyBarFull();
      }
      
      // Reset direction tracking after stroke to prevent double-counting
      lastStrokeDirection = null;
    }
  } else if (currentDirection) {
    // Update direction only if movement is significant
    lastStrokeDirection = currentDirection;
  }
}

// Update progress bar based on stroke count
function updateProgressBar() {
  if (!progressFill || !strokeCountDisplay) return;
  
  const percentage = Math.min((strokeCount / MAX_STROKES) * 100, 100);
  progressFill.style.width = `${percentage}%`;
  strokeCountDisplay.textContent = `${strokeCount} / ${MAX_STROKES}`;
  
  // Change color as it fills
  if (percentage >= 100) {
    progressFill.style.backgroundColor = '#4CAF50';
  } else if (percentage >= 70) {
    progressFill.style.backgroundColor = '#FFC107';
  } else {
    progressFill.style.backgroundColor = '#2196F3';
  }
}

// Notify user when bar is full
async function notifyBarFull() {
  // Get current mode from storage
  const data = await chrome.storage.sync.get('cameraMode');
  const currentMode = data.cameraMode || 'unsafe'; // Default to unsafe
  
  // Focus the camera window
  focusCameraWindow();
  
  // Show appropriate overlay based on mode
  if (currentMode === 'safe') {
    showOverlay('love');
  } else {
    showOverlay('milk');
  }
  
  // Signal all browser pages to show the correct overlay
  signalOverlayToAllPages(currentMode);
  
  // Reset counter immediately so user can stroke again
  strokeCount = 0;
  updateProgressBar();
  
  // Hide overlays after 15 seconds
  setTimeout(() => {
    hideMilkOverlay();
    hideLoveOverlay();
  }, 15000);
}

function hideOverlay(mode) {
  const overlay = document.getElementById(`${mode}Overlay`);
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
}

function showOverlay(mode) {
  const overlay = document.getElementById(`${mode}Overlay`);
  if (overlay) {
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
  }
}

// Focus the camera window
function focusCameraWindow() {
  // Try to focus using window.focus() first
  if (window) {
    window.focus();
  }
  
  // Also use chrome.windows API if available
  if (typeof chrome !== 'undefined' && chrome.windows) {
    chrome.windows.getCurrent((win) => {
      if (win) {
        chrome.windows.update(win.id, { focused: true });
      }
    });
  }
}

// Signal all browser pages to show overlay (milk or love based on mode)
function signalOverlayToAllPages(mode) {
  // Use chrome.storage to signal all content scripts
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ 
      showOverlay: true,
      overlayType: mode, // 'safe' or 'unsafe'
      overlayTimestamp: Date.now() 
    }, () => {
      // Broadcast to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'showOverlay',
            overlayType: mode,
            timestamp: Date.now()
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        });
      });
    });
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
      chrome.storage.local.set({ showOverlay: false }, () => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'hideOverlay'
            }).catch(() => {});
          });
        });
      });
    }, 15000);
  }
}