# Gesture Video Player

**Isolated MediaPipe gesture-controlled video player** – Zero-dependency vanilla ES module with closed Shadow DOM encapsulation. Control video playback with hand gestures using real-time hand tracking.

[![Live Demo](https://img.shields.io/badge/demo-live-00ffff)](https://marvelus-tech.github.io/gesture-video-player/gesture-player.html)

## Features

- 🎯 **Real-time hand tracking** with MediaPipe Hand Landmarker v0.10.18
- 👆 **8+ gesture controls** (play, pause, seek, volume, speed control)
- 🔒 **Complete isolation** via closed Shadow DOM (zero global pollution)
- 🎨 **Dark sci-fi HUD theme** with mirrored webcam overlay
- 🚀 **Zero dependencies** – pure vanilla JavaScript ES module
- 🔐 **Privacy-first** – all processing on-device, no data upload
- 📱 **Responsive** – works on desktop and mobile browsers

## Quick Start

### Method 1: Custom Element (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Gesture Player</title>
</head>
<body>
  <gesture-video-player
    src="demo.mp4"
    style="width: 100%; height: 600px;">
  </gesture-video-player>
  
  <script type="module">
    import './gesture-video-player.js';
  </script>
</body>
</html>
```

### Method 2: iframe Embed

For third-party embedding or strict isolation:

```html
<iframe 
  src="https://marvelus-tech.github.io/gesture-video-player/gesture-player.html?src=YOUR_VIDEO_URL"
  allow="camera;fullscreen;autoplay"
  width="800" 
  height="600"
  style="border: none;">
</iframe>
```

**Query parameters:**
- `src` – Video URL (default: Big Buck Bunny sample)
- `overlay` – Overlay mode (future use)
- `gestures` – Gesture filter (future use)

## Gesture Controls

| Gesture | Icon | Action | Type |
|---------|------|--------|------|
| **Open Palm** | ✋ | Play video | Discrete |
| **Closed Fist** | ✊ | Pause video | Discrete |
| **Victory** | ✌️ | Skip forward 10 seconds | Discrete |
| **Thumb Up** | 👍 | Increase playback speed | Discrete |
| **Thumb Down** | 👎 | Decrease playback speed | Discrete |
| **Pointing Up** | ☝️ | Seek aim mode | Discrete |
| **Right Hand Pinch** | 🤏 | Seek video (X-axis) | Continuous |
| **Left Hand Pinch** | 🤏 | Volume control (Y-axis) | Continuous |

### Gesture Notes

- **Discrete gestures** require ~400ms hold with majority voting (anti-jitter)
- **Continuous gestures** use exponential smoothing for fluid control
- **Pinch detection**: Index finger + thumb closer than 38% of palm size
- **MediaPipe handedness**: Mirrored for user-facing camera (Right = screen-left)

## API Reference

### Attributes

```html
<gesture-video-player
  src="video.mp4"
  poster="thumbnail.jpg"
  gestures="all"
  overlay="hud"
  camera="off"
  max-hands="2"
  seek-sensitivity="1.0"
  model-base="https://custom-cdn.com/model.task"
  theme="dark">
</gesture-video-player>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | URL | `demo.mp4` | Video source URL |
| `poster` | URL | – | Poster image URL |
| `gestures` | String | `"all"` | Gesture filter (future) |
| `overlay` | String | `"hud"` | Overlay mode |
| `camera` | String | `"off"` | Camera state (doesn't auto-enable) |
| `max-hands` | Number | `2` | Maximum hands to detect |
| `seek-sensitivity` | Number | `1.0` | Seek sensitivity multiplier |
| `model-base` | URL | MediaPipe CDN | Custom model URL |
| `theme` | String | `"dark"` | Theme variant (future) |

### Methods

```javascript
const player = document.querySelector('gesture-video-player');

// Enable camera and start gesture detection
await player.enableCamera();

// Disable camera and stop detection
player.disableCamera();

// Clean up all resources
player.destroy();

// Get internal video element
const video = player.getVideoElement();
video.currentTime = 10; // Programmatic control still works
```

### Events

All events use `composed: true` for cross-boundary propagation.

```javascript
player.addEventListener('gep-ready', (e) => {
  console.log('Player initialized:', e.detail.element);
});

player.addEventListener('gep-camera-on', (e) => {
  console.log('Camera activated:', e.detail.stream);
});

player.addEventListener('gep-camera-off', () => {
  console.log('Camera deactivated');
});

player.addEventListener('gep-gesture', (e) => {
  console.log('Gesture:', e.detail.name, e.detail.confidence);
});

player.addEventListener('gep-error', (e) => {
  console.error('Error:', e.detail.code, e.detail.message);
});
```

### Slotted Video Support

Control an external video element by slotting it:

```html
<gesture-video-player>
  <video slot="media" src="my-video.mp4" controls></video>
</gesture-video-player>
```

When a slotted video is present, the player controls **only that element** and ignores the `src` attribute.

## Configuration Constants

All tunable thresholds are exported at the top of `gesture-video-player.js`:

```javascript
import { CONSTANTS } from './gesture-video-player.js';

console.log(CONSTANTS.PINCH_PALM_RATIO); // 0.38
console.log(CONSTANTS.DISCRETE_HOLD_MS); // 400
```

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_DETECT_HZ` | 30 | Hand detection frequency cap (Hz) |
| `PINCH_PALM_RATIO` | 0.38 | Pinch threshold (% of palm size) |
| `EMA_ALPHA` | 0.25 | Exponential smoothing factor |
| `SEEK_DEADZONE` | 0.006 | Minimum X movement for seek |
| `DISCRETE_HOLD_MS` | 400 | Hold duration for discrete gesture |
| `DISCRETE_COOLDOWN_MS` | 700 | Cooldown between discrete gestures |
| `NO_HAND_PINCH_EXIT_MS` | 400 | Exit pinch after no hand |
| `MIN_HANDEDNESS_SCORE` | 0.7 | Min confidence for left/right |
| `MIN_HAND_FRAME_HEIGHT` | 0.08 | Min hand size to detect |
| `MAJORITY_WINDOW` | 5 | Frames for gesture voting |
| `VICTORY_SEEK_SEC` | 10 | Victory gesture skip seconds |
| `KEYBOARD_SEEK_SEC` | 5 | Arrow key skip seconds |
| `HUD_MAX_PX` | 200 | Max HUD canvas dimension |
| `COACH_STORAGE_KEY` | `gep-coach-v1` | LocalStorage key for tutorial |

## Keyboard Shortcuts

When focused inside the player component:

- **Space** – Play/Pause
- **Arrow Left/Right** – Seek ±5 seconds
- **Arrow Up/Down** – Volume ±10%
- **M** – Toggle mute
- **F** – Toggle fullscreen

## Architecture

### Core Principles

1. **Closed Shadow DOM** – Styles and structure isolated from host page
2. **Zero global pollution** – No `document.querySelectorAll('video')`
3. **Main-thread detection** – MediaPipe VIDEO mode for optimal performance
4. **Lazy model loading** – Only load after user clicks "Enable Hand Control"
5. **Privacy gate** – Clear consent flow with privacy explanation

### Detection Pipeline

1. **Camera acquisition** – `getUserMedia()` with user consent
2. **Hand detection** – MediaPipe HandLandmarker at max 30 Hz
3. **Gesture classification** – Heuristic finger state analysis + pinch geometry
4. **Anti-jitter filtering** – Majority voting + exponential smoothing
5. **Action dispatch** – Video control + custom events

### File Structure

```
gesture-video-player/
├── gesture-video-player.js  # Main ES module (custom element)
├── gesture-player.html       # Standalone demo page
├── host-smoke.html           # Isolation test (loud host styles)
├── worker.js                 # Worker stub (future use)
└── README.md                 # This file
```

## CDN Dependencies

**Pinned for stability – no breaking changes:**

- **MediaPipe Tasks Vision** v0.10.18 via jsDelivr
  - `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs`
  - WASM files from `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm/`

- **Hand Landmarker Model**
  - `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`

## Privacy & Security

- ✅ **All processing on-device** – No video frames sent to servers
- ✅ **Explicit consent required** – Camera only after user clicks enable
- ✅ **LocalStorage only for tutorial dismissal** – No tracking
- ✅ **Tracks stopped on destroy** – Clean lifecycle management
- ✅ **No third-party analytics** – Zero tracking scripts

**Camera permissions:** This component requires `camera` permission to enable gesture controls. Video is processed locally via WebAssembly.

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14.1+ | ⚠️ Requires `getUserMedia` flags |
| Mobile Chrome | 90+ | ✅ Full support |
| Mobile Safari | 14.5+ | ⚠️ Limited camera access |

**Requirements:**
- ES6 modules support
- Shadow DOM v1
- WebAssembly
- `getUserMedia()` API

## Development Phases

### ✅ Phase 1: Core Player
- [x] Custom element registration
- [x] Closed Shadow DOM
- [x] Video controls (play, seek, volume, speed)
- [x] Dark sci-fi HUD styling
- [x] Keyboard shortcuts

### ✅ Phase 2: Hand Tracking
- [x] MediaPipe integration (v0.10.18)
- [x] Camera acquisition flow
- [x] Hand landmark detection
- [x] HUD overlay with mirrored webcam

### ✅ Phase 3: Gesture Recognition
- [x] Pinch detection (continuous)
- [x] Discrete gesture classification
- [x] Anti-jitter filtering
- [x] Seek and volume control

### 🚧 Phase 4: Polish (Future)
- [ ] MediaPipe GestureRecognizer integration
- [ ] Web Worker offloading
- [ ] Custom gesture training
- [ ] Accessibility improvements
- [ ] Multi-language support

## Testing

### Run Isolation Test

Open `host-smoke.html` to verify Shadow DOM isolation. The page has **intentionally terrible CSS** that should NOT affect the player:

```bash
# Serve locally
python3 -m http.server 8000
# Open http://localhost:8000/host-smoke.html
```

**Expected results:**
- ✓ Player maintains clean dark theme
- ✓ No lime borders or filters on video
- ✓ Buttons are not orange/purple
- ✓ `document.querySelectorAll('video')` returns 0 elements

### Syntax Validation

```bash
# Check JavaScript syntax
node --check gesture-video-player.js
node --check worker.js

# Or use ESLint
npx eslint gesture-video-player.js
```

## GitHub Pages Setup

Enable GitHub Pages to host the live demo:

1. Go to repository **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` → `/` (root)
4. **Save**

Your demo will be available at:
```
https://marvelus-tech.github.io/gesture-video-player/gesture-player.html
```

## License

MIT License - Free for commercial and personal use.

## Credits

- **MediaPipe** by Google – Hand tracking models
- **Demo Video** – Big Buck Bunny 360p (test-videos.co.uk, Blender Foundation, CC BY 3.0)

## Contributing

PRs welcome! Focus areas:
- Better gesture classification
- Mobile optimization
- Accessibility features
- Multi-language support

---

**Built with ❤️ using vanilla JavaScript and MediaPipe**
