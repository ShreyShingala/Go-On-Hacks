// Background service worker to handle downloads

let downloadCounter = 0;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'save-detected-image') {
    downloadCounter++;
    
    // Get current date/time for folder organization
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    
    // Create filename with timestamp
    const filename = `face-detector/${dateStr}/${timeStr}_face_${downloadCounter}.jpg`;
    
    // Download the image
    chrome.downloads.download({
      url: message.dataUrl,
      filename: filename,
      saveAs: false // Auto-save without prompting
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Download error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log(`[Background] Downloaded image ${downloadCounter} as ${filename}`);
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'reset-counter') {
    downloadCounter = 0;
    sendResponse({ success: true });
    return true;
  }
});

console.log('[Background] Face detector background service worker loaded');
