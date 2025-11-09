# LeReplacer - Chrome Extension

A Chrome extension that automatically detects and replaces images containing faces with LeBron James images, includes hand tracking camera controls, and features a caption generator for social media posts.

## Features

### Image Replacement
- **Face Detection**: Uses Chrome's native Shape Detection API (Face Detection) for ultra-fast face detection
- **Smart Replacement**: Only replaces images containing faces with LeBron James images
- **Dynamic Detection**: Uses MutationObserver to catch images added during infinite scroll
- **Fade to LeBron**: Optional fade animation when faces are detected
- **Toggle On/Off**: Simple popup UI to enable/disable the extension

### Camera & Hand Tracking
- **Hand Detection**: Real-time hand tracking using Handtrack.js
- **Stroke Detection**: Detects hand stroking motion (up/down movements)
- **Progress Meter**: Visual progress bar that fills as you complete strokes
- **Safe/Unsafe Modes**: Toggle between showing love hearts (safe) or milk splash (unsafe) when stroke limit is reached
- **Full-Screen Overlay**: Overlay appears on all browser pages when limit is reached

### Caption Generator (67/goon mode)
- **Generate Captions**: Creates absurdist captions using Gemini API
- **Auto-Post to Twitter/X**: Automatically posts generated captions
- **Personalization**: Add your display name and Twitter/X handle
- **Background Tracking**: Collects page data (titles, URLs, images, clicks, scroll depth) to fuel caption generation

### UI Features
- **Light/Dark Mode**: Toggle between light and dark themes
- **Modern Design**: Clean white theme with purple (#552084) and yellow (#FDBA21) accents
- **3D Buttons**: Interactive 3D-styled buttons and toggles

## Installation

### Option 1: Install from Zip File (For Sharing)

If you received this extension as a `.zip` file, follow these steps:

1. **Download the zip file** (e.g., `my-extension.zip`)

2. **Extract the zip file**:
   - **Windows**: Right-click the zip file → "Extract All..." → Choose a location
   - **Mac**: Double-click the zip file (it will extract automatically)
   - **Linux**: Right-click → "Extract Here" or use `unzip my-extension.zip`

3. **Open Chrome/Edge** and navigate to:
   ```
   chrome://extensions/
   ```
   Or in Edge:
   ```
   edge://extensions/
   ```

4. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner of the extensions page

5. **Load the Extension**:
   - Click the **"Load unpacked"** button
   - Navigate to the **extracted folder** (the folder that contains `manifest.json`)
   - Select the folder and click "Select Folder" (or "Open" on Mac)

6. **Verify Installation**:
   - The extension should appear in your extensions list
   - The extension icon should appear in your browser toolbar
   - If you see any errors, check the console for details

### Option 2: Install from Source Folder

If you have the source code folder:

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `image-replacer-extension` folder
5. The extension icon should appear in your toolbar

### Troubleshooting Installation

**"Manifest file is missing or unreadable"**:
- Make sure you selected the folder that contains `manifest.json`, not a parent folder
- Verify the zip file was extracted completely

**"This extension may have been corrupted"**:
- Re-download the zip file
- Make sure all files were extracted properly
- Check that `manifest.json` exists in the folder

**Extension doesn't appear**:
- Check the extensions page for error messages
- Click "Details" on the extension card to see error logs
- Make sure Developer Mode is enabled

## Sharing the Extension

To share this extension with others before publishing to Chrome Web Store:

1. **Create a zip file** of the extension folder:
   - **Windows**: Right-click the `image-replacer-extension` folder → "Send to" → "Compressed (zipped) folder"
   - **Mac**: Right-click the folder → "Compress image-replacer-extension"
   - **Linux**: `zip -r my-extension.zip image-replacer-extension/`

2. **Important**: Make sure the zip contains the folder with all files including:
   - `manifest.json`
   - All `.js`, `.html`, `.css` files
   - All image files (`.png`, `.jpg`, etc.)
   - All subdirectories (like `lebrons/`, `assets/`)

3. **Share the zip file** via:
   - Email attachment
   - Cloud storage (Google Drive, Dropbox, etc.)
   - File sharing services
   - Direct download link

4. **Tell users to follow the "Install from Zip File" instructions above**

## Usage

### Image Replacement
1. Click the extension icon to open the popup
2. Toggle the extension on/off
3. Visit any webpage with images containing faces
4. Images with faces will be automatically replaced with LeBron James images
5. Enable "Fade to LeBron" for smooth transitions

### Camera & Hand Tracking
1. Click "Open Camera" in the popup
2. Allow camera permissions
3. Show your hands to the camera
4. Perform up/down stroking motions
5. Watch the progress bar fill up
6. When limit is reached, overlay appears on camera and all browser pages

### Caption Generator
1. Fill in your creator name and Twitter/X handle in the popup
2. Click "Generate" to create a caption
3. Click "Generate & Tweet" to create and post automatically
4. Use "Copy" to copy the caption to clipboard
5. Use "Tweet now" to post a custom caption immediately

## Server Setup (For Caption Generator)

The caption generator requires a local server to function:

1. Navigate to the server directory:
   ```bash
   cd local-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file containing:
   ```
   GEMINI_API_KEY=your_key_here
   TWITTER_CLIENT_ID=your_app_client_id
   TWITTER_CLIENT_SECRET=your_app_client_secret
   TWITTER_CALLBACK_URL=https://localhost:3000/callback
   ```

4. Start the server:
   ```bash
   npm start
   ```
   Server runs on port 5051 with a `/health` endpoint.

5. Authorize Twitter:
   - Open `http://localhost:5051/auth/start` in a browser
   - Authorize the bot account
   - Wait for the success message
   - Tokens are stored in `local-server/tokenStore.json` (gitignored)

### Autoposting Captions
- Click **Generate & Tweet** in the popup (or call `/generate` with `postToTwitter: true`)
- The server will refresh tokens if needed, then post the caption to Twitter/X
- Responses include `tweeted`, `tweetId`, `tweetText`, and `tweetError` for status checking

## Browser Support

This extension works in **all modern Chrome/Edge browsers** with two modes:

### 🚀 Fast Mode (Face Detection API)
- Requires Chrome 70+ or Edge 79+ with **Shape Detection API** enabled
- Hardware-accelerated face detection (~5-20ms per image)
- Enable at: `chrome://flags/#enable-experimental-web-platform-features`

### 🔄 Fallback Mode (Heuristic Detection)
- **Works immediately** without any setup!
- Uses smart heuristics to detect likely photos:
  - Checks image size (>50,000 pixels)
  - Checks aspect ratio (0.5-2.0 for portrait/landscape)
  - Filters out banners, icons, and graphics
- Slightly less accurate but still very effective

**The extension automatically uses the best available method!**

## How It Works

### Detection Flow
1. Extension scans all `<img>` elements on the page
2. Filters out:
   - Already processed images (marked with `replaced` class)
   - Images marked as not containing faces (`noperson` class)
   - Tiny images (< 5000 pixels area)
   - Off-screen images (outside viewport)
3. For each candidate image:
   - Creates an ImageBitmap from the image
   - Runs Chrome's native `FaceDetector.detect()`
   - If face detected → replaces with LeBron image, marks as `replaced`
   - If no face → marks as `noperson`
   - Skips in future scans

### Performance Optimizations
- **Detection Cache**: Results cached by image URL
- **Viewport-Only**: Only processes visible images
- **Size Filter**: Skips images < 5000px² (likely icons/logos)
- **Debounced Scanning**: 80ms debounce on mutation events
- **Native API**: 10-100x faster than JavaScript ML libraries
- **Smart Filtering**: Pre-filters images before expensive detection

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main logic: face detection, image replacement, overlay system
- `popup.html` / `popup.js` / `popup.css` - Popup UI with theme toggle
- `camera.html` / `camera.js` / `camera.css` - Camera interface with hand tracking
- `background.js` - Background service worker for caption generation
- `assets/` - Contains logo, milk, and love images
- `lebrons/` - Contains LeBron James replacement images

## Console Logs

Watch the DevTools Console for:
- `[Image Replacer] ✓ Face Detection API initialized` - Fast mode active
- `[Image Replacer] Face Detection API not available. Using fallback mode.` - Fallback mode active
- `[Image Replacer] Face detected in image (N face(s)): <url>` - Face found (fast mode)
- `[Image Replacer] Likely photo detected (fallback mode): <url>` - Photo detected (fallback)
- `[Image Replacer] Replaced image: <url> -> <placeholder>` - Image replaced
- `🔄 STROKE DETECTED!` - Hand stroke detected in camera

## Troubleshooting

### Using fallback mode (want faster detection?)
- **Message**: `Face Detection API not available. Using fallback mode.`
- **To enable fast mode**:
  1. Go to `chrome://flags/#enable-experimental-web-platform-features`
  2. Set to **Enabled**
  3. Restart Chrome
  4. Reload the extension
  5. Check console: `'FaceDetector' in window` should return `true`

### Images not being replaced
- Open DevTools Console and check for logs
- Ensure images are visible in viewport (scroll to them)
- Fallback mode requires images >50,000px² (not tiny icons)
- Fast mode works on any size image with a face

### Camera not working
- Make sure camera permissions are granted
- Check browser console for errors
- Verify Handtrack.js model loads successfully
- Ensure video element is ready before detection starts

### Caption generator not working
- Make sure the local server is running on port 5051
- Check that `.env` file is configured correctly
- Verify Twitter authorization was completed
- Check server logs for API errors

### Performance issues
- Increase `MIN_PIXEL_AREA` constant to skip more small images (currently 5000px²)
- Increase `FULL_SCAN_DEBOUNCE_MS` for slower but less frequent scans (currently 80ms)
- Fast mode is 10x faster - enable Face Detection API for best performance

## License

MIT
