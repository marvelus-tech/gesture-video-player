// Gesture Video Player - Complete vanilla ES module
// MediaPipe hand tracking with gesture controls for video playback

// ============================================================================
// CONSTANTS - All tunable thresholds and configuration
// ============================================================================
export const CONSTANTS = {
  MAX_DETECT_HZ: 30,                    // Maximum hand detection frequency (Hz)
  PINCH_PALM_RATIO: 0.38,               // Pinch threshold as ratio of palm size
  EMA_ALPHA: 0.25,                      // Exponential moving average smoothing factor
  SEEK_DEADZONE: 0.006,                 // Minimum X movement to register seek (normalized)
  DISCRETE_HOLD_MS: 400,                // Hold duration to trigger discrete gesture (ms)
  DISCRETE_COOLDOWN_MS: 700,            // Cooldown between discrete gestures (ms)
  NO_HAND_PINCH_EXIT_MS: 400,           // Exit pinch mode after no hand detected (ms)
  MIN_HANDEDNESS_SCORE: 0.7,            // Minimum confidence for left/right hand
  MIN_HAND_FRAME_HEIGHT: 0.08,          // Minimum hand height ratio to detect
  MAJORITY_WINDOW: 5,                   // Frames for gesture majority voting
  VICTORY_SEEK_SEC: 10,                 // Seconds to skip with Victory gesture
  KEYBOARD_SEEK_SEC: 5,                 // Seconds to skip with arrow keys
  HUD_MAX_PX: 200,                      // Maximum HUD canvas dimension (px)
  COACH_STORAGE_KEY: 'gep-coach-v1',    // LocalStorage key for coach dismissal
  MEDIAPIPE_CDN_BASE: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  MODEL_BASE_URL: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  SAMPLE_VIDEO_URL: 'demo.mp4'
};

// ============================================================================
// Shadow DOM Styles - Dark sci-fi HUD theme
// ============================================================================
const STYLES = `
:host {
  display: block;
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
  line-height: 1.5;
}

#gep-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #000;
  overflow: hidden;
}

.stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 80%, transparent 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  transition: opacity 0.3s;
}

.controls.hide {
  opacity: 0;
  pointer-events: none;
}

.btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.4);
}

.btn:active {
  transform: scale(0.95);
}

.btn-icon {
  padding: 6px 8px;
  min-width: 32px;
}

.time-display {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
}

.seek-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  min-width: 80px;
}

.seek-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #00ffff;
  border-radius: 3px;
  transition: width 0.1s;
  box-shadow: 0 0 8px rgba(0,255,255,0.5);
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #fff;
  border-radius: 2px;
}

.hud {
  position: absolute;
  top: 12px;
  right: 12px;
  width: ${CONSTANTS.HUD_MAX_PX}px;
  height: ${CONSTANTS.HUD_MAX_PX}px;
  max-width: calc(40vw);
  max-height: calc(40vh);
  border: 2px solid rgba(0,255,255,0.6);
  border-radius: 8px;
  background: rgba(0,20,40,0.85);
  overflow: hidden;
  z-index: 20;
  display: none;
  box-shadow: 0 0 20px rgba(0,255,255,0.4);
}

.hud.active {
  display: block;
}

.hud canvas {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.hud-label {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: #00ffff;
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 3px;
  text-align: center;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coach {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 600px;
  width: calc(100% - 40px);
  background: rgba(0,20,40,0.95);
  border: 2px solid rgba(0,255,255,0.6);
  border-radius: 12px;
  padding: 24px;
  z-index: 30;
  box-shadow: 0 0 40px rgba(0,255,255,0.3);
}

.coach-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.coach-title {
  font-size: 20px;
  font-weight: 600;
  color: #00ffff;
}

.coach-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  line-height: 1;
}

.coach-close:hover {
  color: #fff;
}

.coach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.coach-card {
  background: rgba(0,255,255,0.08);
  border: 1px solid rgba(0,255,255,0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.coach-emoji {
  font-size: 32px;
  margin-bottom: 6px;
}

.coach-gesture {
  font-size: 12px;
  font-weight: 600;
  color: #00ffff;
  margin-bottom: 3px;
}

.coach-action {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

.coach-footer {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  text-align: center;
}

.enable-gate {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 60px;
  background: rgba(0,20,40,0.95);
  backdrop-filter: blur(8px);
  border-top: 2px solid rgba(0,255,255,0.4);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 40;
  padding: 12px 20px;
  text-align: left;
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
}

.enable-gate.hidden {
  opacity: 0;
  transform: translateY(100%);
  pointer-events: none;
}

.enable-gate-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  color: #00ffff;
}

.enable-gate-text {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  line-height: 1.4;
  margin: 0;
}

.enable-gate-btn {
  background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
  border: none;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.enable-gate-btn:hover {
  transform: scale(1.05);
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
  text-align: center;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: #ff4444;
  margin-bottom: 8px;
}

.error-message {
  color: rgba(255,255,255,0.8);
  max-width: 400px;
}

.spinner {
  border: 3px solid rgba(0,255,255,0.2);
  border-top-color: #00ffff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hidden {
  display: none !important;
}
`;

// ============================================================================
// GestureVideoPlayer Custom Element
// ============================================================================
class GestureVideoPlayer extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'closed' });
    
    // Core state
    this._video = null;
    this._slottedVideo = null;
    this._handLandmarker = null;
    this._cameraActive = false;
    this._mediaStream = null;
    this._webcamVideo = null;
    this._rafId = null;
    this._lastDetectTime = 0;
    this._hudCanvas = null;
    this._hudCtx = null;
    
    // Gesture state
    this._gestureBuffer = [];
    this._lastDiscreteTime = 0;
    this._discreteHoldStart = null;
    this._discreteHoldGesture = null;
    this._leftPinching = false;
    this._rightPinching = false;
    this._seekSmooth = null;
    this._volumeSmooth = null;
    this._lastHandTime = Date.now();
    this._noPinchExitTimer = null;
    
    this._root = null;
  }

  static get observedAttributes() {
    return ['src', 'poster', 'gestures', 'overlay', 'camera', 'max-hands', 'seek-sensitivity', 'model-base', 'theme'];
  }

  connectedCallback() {
    this._render();
    this._setupEventListeners();
    
    // Check for slotted video
    const slot = this._shadow.querySelector('slot[name="media"]');
    if (slot) {
      const assigned = slot.assignedElements();
      if (assigned.length > 0 && assigned[0].tagName === 'VIDEO') {
        this._slottedVideo = assigned[0];
        this._video = this._slottedVideo;
      }
    }
    
    // Create internal video if no slot
    if (!this._slottedVideo) {
      this._video = this._shadow.querySelector('video');
      const src = this.getAttribute('src') || CONSTANTS.SAMPLE_VIDEO_URL;
      this._video.src = src;
      if (this.getAttribute('poster')) {
        this._video.poster = this.getAttribute('poster');
      }
    }
    
    // Attach video listeners now that this._video is set
    this._attachVideoListeners();
    
    this._updateUI();
    
    // Dispatch ready event
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('gep-ready', { 
        composed: true,
        detail: { element: this }
      }));
    }, 0);
  }

  disconnectedCallback() {
    this.destroy();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'src' && this._video && !this._slottedVideo) {
      this._video.src = newValue || CONSTANTS.SAMPLE_VIDEO_URL;
    } else if (name === 'poster' && this._video && !this._slottedVideo) {
      this._video.poster = newValue || '';
    } else if (name === 'camera' && this._root) {
      // Auto-enable camera if attribute present
      if (newValue !== null && !this._cameraActive) {
        const gate = this._shadow.querySelector('.enable-gate');
        if (gate && !gate.classList.contains('hidden')) {
          // Still showing gate, don't auto-enable
        }
      }
    }
  }

  _render() {
    const style = document.createElement('style');
    style.textContent = STYLES;
    
    const root = document.createElement('div');
    root.id = 'gep-root';
    
    root.innerHTML = `
      <div class="stage">
        <slot name="media">
          <video playsinline crossorigin="anonymous"></video>
        </slot>
        
        <div class="controls">
          <button class="btn btn-icon" data-action="play-pause">▶</button>
          <span class="time-display"><span class="time-current">0:00</span> / <span class="time-duration">0:00</span></span>
          <div class="seek-bar" data-action="seek">
            <div class="seek-progress"></div>
          </div>
          <button class="btn" data-action="speed">1x</button>
          <div class="volume-slider" data-action="volume">
            <div class="volume-fill"></div>
          </div>
          <button class="btn btn-icon" data-action="mute">🔊</button>
          <button class="btn btn-icon" data-action="fullscreen">⛶</button>
          <button class="btn" data-action="gestures">Gestures</button>
        </div>
        
        <div class="hud">
          <canvas width="200" height="200"></canvas>
          <div class="hud-label">No hand</div>
        </div>
        
        <div class="coach hidden">
          <div class="coach-header">
            <div class="coach-title">Gesture Controls</div>
            <button class="coach-close">&times;</button>
          </div>
          <div class="coach-grid">
            <div class="coach-card">
              <div class="coach-emoji">✋</div>
              <div class="coach-gesture">Open Palm</div>
              <div class="coach-action">Play</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">✊</div>
              <div class="coach-gesture">Closed Fist</div>
              <div class="coach-action">Pause</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">✌️</div>
              <div class="coach-gesture">Victory</div>
              <div class="coach-action">Skip +10s</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">👍</div>
              <div class="coach-gesture">Thumb Up</div>
              <div class="coach-action">Speed Up</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">👎</div>
              <div class="coach-gesture">Thumb Down</div>
              <div class="coach-action">Speed Down</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">☝️</div>
              <div class="coach-gesture">Pointing Up</div>
              <div class="coach-action">Seek Mode</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">🤏</div>
              <div class="coach-gesture">Right Pinch</div>
              <div class="coach-action">Seek (X-axis)</div>
            </div>
            <div class="coach-card">
              <div class="coach-emoji">🤏</div>
              <div class="coach-gesture">Left Pinch</div>
              <div class="coach-action">Volume (Y-axis)</div>
            </div>
          </div>
          <div class="coach-footer">
            Pinch: Index + Thumb together
          </div>
        </div>
        
        <div class="enable-gate">
          <div>
            <div class="enable-gate-title">✋ Hand Control Available</div>
            <div class="enable-gate-text">
              Control playback with gestures. Camera stays local—no data uploaded.
            </div>
          </div>
          <button class="enable-gate-btn">Enable</button>
        </div>
      </div>
    `;
    
    this._shadow.appendChild(style);
    this._shadow.appendChild(root);
    this._root = root;
  }

  _attachVideoListeners() {
    if (!this._video || !this._root) return;
    
    const root = this._root;
    
    // Time update
    const updateTime = () => {
      if (!this._video) return;
      const current = this._formatTime(this._video.currentTime);
      const duration = this._formatTime(this._video.duration || 0);
      const progress = (this._video.currentTime / this._video.duration) * 100 || 0;
      
      const timeCurrentEl = root.querySelector('.time-current');
      const timeDurationEl = root.querySelector('.time-duration');
      const seekProgress = root.querySelector('.seek-progress');
      
      if (timeCurrentEl) timeCurrentEl.textContent = current;
      if (timeDurationEl) timeDurationEl.textContent = duration;
      if (seekProgress) seekProgress.style.width = `${progress}%`;
    };
    
    this._video.addEventListener('timeupdate', updateTime);
    this._video.addEventListener('durationchange', updateTime);
    this._video.addEventListener('loadedmetadata', updateTime);
    
    // Play/pause button toggle
    this._video.addEventListener('play', () => {
      const btn = root.querySelector('[data-action="play-pause"]');
      if (btn) btn.textContent = '⏸';
      
      // Hide enable gate after first successful play if gestures not active
      if (!this._cameraActive) {
        const gate = root.querySelector('.enable-gate');
        if (gate && !gate.classList.contains('hidden')) {
          setTimeout(() => gate.classList.add('hidden'), 500);
        }
      }
    });
    
    this._video.addEventListener('pause', () => {
      const btn = root.querySelector('[data-action="play-pause"]');
      if (btn) btn.textContent = '▶';
    });
    
    // Volume
    this._video.addEventListener('volumechange', () => {
      if (!this._video) return;
      const fill = root.querySelector('.volume-fill');
      const muteBtn = root.querySelector('[data-action="mute"]');
      if (fill) fill.style.width = `${this._video.volume * 100}%`;
      if (muteBtn) muteBtn.textContent = this._video.muted ? '🔇' : '🔊';
    });
  }

  _setupEventListeners() {
    const root = this._root;
    
    // Control button listeners
    root.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.dataset.action;
      
      switch (action) {
        case 'play-pause':
          this._togglePlayPause();
          break;
        case 'mute':
          this._toggleMute();
          break;
        case 'fullscreen':
          this._toggleFullscreen();
          break;
        case 'gestures':
          this._toggleCoach();
          break;
        case 'speed':
          this._cycleSpeed();
          break;
      }
    });
    
    // Seek bar
    const seekBar = root.querySelector('.seek-bar');
    if (seekBar) {
      seekBar.addEventListener('click', (e) => {
        if (!this._video) return;
        const rect = seekBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this._video.currentTime = percent * this._video.duration;
      });
    }
    
    // Volume slider
    const volumeSlider = root.querySelector('.volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('click', (e) => {
        if (!this._video) return;
        const rect = volumeSlider.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this._video.volume = percent;
        this._video.muted = false;
      });
    }
    
    // Enable gate
    const enableBtn = root.querySelector('.enable-gate-btn');
    if (enableBtn) {
      enableBtn.addEventListener('click', () => {
        this.enableCamera();
      });
    }
    
    // Coach close
    const coachClose = root.querySelector('.coach-close');
    if (coachClose) {
      coachClose.addEventListener('click', () => {
        this._toggleCoach();
      });
    }
    
    // Keyboard shortcuts (only when focused inside component)
    this._shadow.addEventListener('keydown', (e) => {
      if (!this._video) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this._togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this._video.currentTime = Math.max(0, this._video.currentTime - CONSTANTS.KEYBOARD_SEEK_SEC);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this._video.currentTime = Math.min(this._video.duration, this._video.currentTime + CONSTANTS.KEYBOARD_SEEK_SEC);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._video.volume = Math.min(1, this._video.volume + 0.1);
          this._video.muted = false;
          break;
        case 'ArrowDown':
          e.preventDefault();
          this._video.volume = Math.max(0, this._video.volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          this._toggleMute();
          break;
        case 'f':
          e.preventDefault();
          this._toggleFullscreen();
          break;
      }
    });
    
    // Pause detection engine when tab hidden or offscreen
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this._rafId) {
        this._pauseDetection();
      } else if (!document.hidden && this._cameraActive) {
        this._resumeDetection();
      }
    });
    
    // Stop tracks on pagehide
    window.addEventListener('pagehide', () => {
      this.destroy();
    });
  }

  _formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _togglePlayPause() {
    if (!this._video) return;
    if (this._video.paused) {
      this._video.play();
    } else {
      this._video.pause();
    }
  }

  _toggleMute() {
    if (!this._video) return;
    this._video.muted = !this._video.muted;
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  _cycleSpeed() {
    if (!this._video) return;
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const current = this._video.playbackRate;
    const currentIndex = speeds.indexOf(current);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this._video.playbackRate = speeds[nextIndex];
    
    const btn = this._root.querySelector('[data-action="speed"]');
    if (btn) btn.textContent = `${speeds[nextIndex]}x`;
  }

  _toggleCoach() {
    const coach = this._root.querySelector('.coach');
    if (!coach) return;
    
    if (coach.classList.contains('hidden')) {
      coach.classList.remove('hidden');
      
      // Also show enable gate if gestures not active
      if (!this._cameraActive) {
        const gate = this._root.querySelector('.enable-gate');
        if (gate) gate.classList.remove('hidden');
      }
    } else {
      coach.classList.add('hidden');
      // Store dismissal
      try {
        localStorage.setItem(CONSTANTS.COACH_STORAGE_KEY, Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  _updateUI() {
    // Update speed button
    const speedBtn = this._root?.querySelector('[data-action="speed"]');
    if (speedBtn && this._video) {
      speedBtn.textContent = `${this._video.playbackRate}x`;
    }
  }

  async enableCamera() {
    if (this._cameraActive) return;
    
    try {
      // Show loading
      const gate = this._shadow.querySelector('.enable-gate');
      if (gate) {
        gate.innerHTML = `
          <div class="spinner"></div>
          <div class="enable-gate-text">Loading hand tracking model...</div>
        `;
      }
      
      // Initialize MediaPipe
      await this._initMediaPipe();
      
      // Get camera access
      this._mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      // Create webcam video element (hidden)
      this._webcamVideo = document.createElement('video');
      this._webcamVideo.autoplay = true;
      this._webcamVideo.playsInline = true;
      this._webcamVideo.srcObject = this._mediaStream;
      await this._webcamVideo.play();
      
      // Setup HUD canvas
      const hud = this._shadow.querySelector('.hud');
      this._hudCanvas = hud.querySelector('canvas');
      this._hudCtx = this._hudCanvas.getContext('2d');
      hud.classList.add('active');
      
      // Hide gate
      if (gate) gate.classList.add('hidden');
      
      this._cameraActive = true;
      this._startDetection();
      
      this.dispatchEvent(new CustomEvent('gep-camera-on', { 
        composed: true,
        detail: { stream: this._mediaStream }
      }));
      
    } catch (err) {
      console.error('Camera enable failed:', err);
      this._showError('CAMERA_ERROR', err.message || 'Failed to access camera');
      this.dispatchEvent(new CustomEvent('gep-error', { 
        composed: true,
        detail: { code: 'CAMERA_ERROR', message: err.message }
      }));
    }
  }

  async _initMediaPipe() {
    try {
      const { HandLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'
      );
      
      const vision = await FilesetResolver.forVisionTasks(CONSTANTS.MEDIAPIPE_CDN_BASE);
      
      const modelBase = this.getAttribute('model-base') || CONSTANTS.MODEL_BASE_URL;
      
      this._handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelBase,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: parseInt(this.getAttribute('max-hands') || '2'),
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
    } catch (err) {
      console.error('MediaPipe init failed:', err);
      throw new Error('Failed to load hand tracking model');
    }
  }

  _startDetection() {
    const detect = () => {
      if (!this._cameraActive || !this._webcamVideo) {
        this._rafId = null;
        return;
      }
      
      const now = performance.now();
      const elapsed = now - this._lastDetectTime;
      
      if (elapsed >= (1000 / CONSTANTS.MAX_DETECT_HZ)) {
        this._detectHands();
        this._lastDetectTime = now;
      }
      
      this._rafId = requestAnimationFrame(detect);
    };
    
    detect();
  }

  _pauseDetection() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _resumeDetection() {
    if (!this._rafId && this._cameraActive) {
      this._startDetection();
    }
  }

  _detectHands() {
    if (!this._handLandmarker || !this._webcamVideo) return;
    
    try {
      const results = this._handLandmarker.detectForVideo(
        this._webcamVideo,
        performance.now()
      );
      
      this._processResults(results);
      this._renderHUD(results);
      
    } catch (err) {
      console.error('Detection error:', err);
    }
  }

  _processResults(results) {
    const now = Date.now();
    
    if (!results.landmarks || results.landmarks.length === 0) {
      // No hands detected
      const timeSinceHand = now - this._lastHandTime;
      if (timeSinceHand > CONSTANTS.NO_HAND_PINCH_EXIT_MS) {
        this._leftPinching = false;
        this._rightPinching = false;
      }
      return;
    }
    
    this._lastHandTime = now;
    
    // Process each hand
    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i];
      const handedness = results.handednesses?.[i]?.[0];
      
      if (!handedness || handedness.score < CONSTANTS.MIN_HANDEDNESS_SCORE) continue;
      
      // Check hand size (filter out distant/tiny hands)
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const palmSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);
      
      const handHeight = Math.max(...landmarks.map(l => l.y)) - Math.min(...landmarks.map(l => l.y));
      if (handHeight < CONSTANTS.MIN_HAND_FRAME_HEIGHT) continue;
      
      // Detect pinch
      const thumb = landmarks[4];
      const index = landmarks[8];
      const pinchDist = Math.hypot(index.x - thumb.x, index.y - thumb.y);
      const isPinching = pinchDist < (CONSTANTS.PINCH_PALM_RATIO * palmSize);
      
      // CRITICAL: MediaPipe handedness is mirrored for user-facing camera
      // Their "Right" is screen-left (user's actual right), "Left" is screen-right
      const isMediaPipeRight = handedness.categoryName === 'Right';
      const isMediaPipeLeft = handedness.categoryName === 'Left';
      
      if (isMediaPipeRight && isPinching) {
        // MediaPipe Right hand → seek control
        this._rightPinching = true;
        this._handleSeekPinch(index.x);
      } else if (isMediaPipeRight) {
        this._rightPinching = false;
      }
      
      if (isMediaPipeLeft && isPinching) {
        // MediaPipe Left hand → volume control
        this._leftPinching = true;
        this._handleVolumePinch(1 - index.y); // Invert Y for natural up=louder
      } else if (isMediaPipeLeft) {
        this._leftPinching = false;
      }
      
      // Detect discrete gestures (simplified for demo)
      // In production, use GestureRecognizer or custom classifier
      this._detectDiscreteGestures(landmarks, handedness);
    }
  }

  _handleSeekPinch(x) {
    if (!this._video || !this._video.duration) return;
    
    if (this._seekSmooth === null) {
      this._seekSmooth = x;
    }
    
    // Apply EMA smoothing
    this._seekSmooth = CONSTANTS.EMA_ALPHA * x + (1 - CONSTANTS.EMA_ALPHA) * this._seekSmooth;
    
    const delta = x - this._seekSmooth;
    if (Math.abs(delta) < CONSTANTS.SEEK_DEADZONE) return;
    
    // Map X position to video time
    const targetTime = this._seekSmooth * this._video.duration;
    this._video.currentTime = Math.max(0, Math.min(this._video.duration, targetTime));
  }

  _handleVolumePinch(y) {
    if (!this._video) return;
    
    if (this._volumeSmooth === null) {
      this._volumeSmooth = y;
    }
    
    this._volumeSmooth = CONSTANTS.EMA_ALPHA * y + (1 - CONSTANTS.EMA_ALPHA) * this._volumeSmooth;
    
    this._video.volume = Math.max(0, Math.min(1, this._volumeSmooth));
    this._video.muted = false;
  }

  _detectDiscreteGestures(landmarks, handedness) {
    // Simple heuristic gesture detection
    // Production should use MediaPipe GestureRecognizer
    
    const fingers = this._getFingerStates(landmarks);
    let gesture = null;
    
    // Open palm (all fingers extended)
    if (fingers.every(f => f)) {
      gesture = 'Open_Palm';
    }
    // Closed fist (all fingers closed)
    else if (fingers.every(f => !f)) {
      gesture = 'Closed_Fist';
    }
    // Victory (index and middle up)
    else if (fingers[1] && fingers[2] && !fingers[3] && !fingers[4]) {
      gesture = 'Victory';
    }
    // Thumb up
    else if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
      gesture = 'Thumb_Up';
    }
    // Pointing up (index only)
    else if (!fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
      gesture = 'Pointing_Up';
    }
    
    if (gesture) {
      this._bufferGesture(gesture);
    }
  }

  _getFingerStates(landmarks) {
    // Simple finger extension detection
    // Returns [thumb, index, middle, ring, pinky]
    
    const tips = [4, 8, 12, 16, 20];
    const pips = [3, 6, 10, 14, 18];
    
    return tips.map((tip, i) => {
      const tipY = landmarks[tip].y;
      const pipY = landmarks[pips[i]].y;
      
      // Thumb uses X instead of Y
      if (i === 0) {
        return Math.abs(landmarks[tip].x - landmarks[pips[i]].x) > 0.05;
      }
      
      return tipY < pipY - 0.02; // Extended if tip above PIP
    });
  }

  _bufferGesture(gesture) {
    const now = Date.now();
    
    // Add to buffer
    this._gestureBuffer.push({ gesture, time: now });
    
    // Keep only recent frames
    this._gestureBuffer = this._gestureBuffer.filter(
      g => now - g.time < CONSTANTS.DISCRETE_HOLD_MS
    );
    
    // Majority voting
    if (this._gestureBuffer.length >= CONSTANTS.MAJORITY_WINDOW) {
      const counts = {};
      this._gestureBuffer.forEach(g => {
        counts[g.gesture] = (counts[g.gesture] || 0) + 1;
      });
      
      const majority = Object.keys(counts).reduce((a, b) => 
        counts[a] > counts[b] ? a : b
      );
      
      if (counts[majority] >= CONSTANTS.MAJORITY_WINDOW) {
        this._handleDiscreteGesture(majority);
      }
    }
  }

  _handleDiscreteGesture(gesture) {
    const now = Date.now();
    
    // Check cooldown
    if (now - this._lastDiscreteTime < CONSTANTS.DISCRETE_COOLDOWN_MS) return;
    
    if (!this._video) return;
    
    switch (gesture) {
      case 'Open_Palm':
        this._video.play();
        break;
      case 'Closed_Fist':
        this._video.pause();
        break;
      case 'Victory':
        this._video.currentTime = Math.min(
          this._video.duration,
          this._video.currentTime + CONSTANTS.VICTORY_SEEK_SEC
        );
        break;
      case 'Thumb_Up':
        this._cycleSpeed();
        break;
      case 'Pointing_Up':
        // Seek aim mode (placeholder)
        break;
    }
    
    this._lastDiscreteTime = now;
    this._gestureBuffer = [];
    
    this.dispatchEvent(new CustomEvent('gep-gesture', { 
      composed: true,
      detail: { 
        name: gesture,
        confidence: 0.9,
        hands: 1
      }
    }));
  }

  _renderHUD(results) {
    if (!this._hudCanvas || !this._hudCtx || !this._webcamVideo) return;
    
    const ctx = this._hudCtx;
    const canvas = this._hudCanvas;
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw webcam feed
    ctx.save();
    ctx.drawImage(this._webcamVideo, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Draw landmarks
    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const handedness = results.handednesses?.[i]?.[0];
        
        // Draw connections
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        const connections = [
          [0,1],[1,2],[2,3],[3,4],  // Thumb
          [0,5],[5,6],[6,7],[7,8],  // Index
          [0,9],[9,10],[10,11],[11,12],  // Middle
          [0,13],[13,14],[14,15],[15,16],  // Ring
          [0,17],[17,18],[18,19],[19,20],  // Pinky
          [5,9],[9,13],[13,17]  // Palm
        ];
        
        connections.forEach(([a, b]) => {
          const pointA = landmarks[a];
          const pointB = landmarks[b];
          ctx.beginPath();
          ctx.moveTo(pointA.x * canvas.width, pointA.y * canvas.height);
          ctx.lineTo(pointB.x * canvas.width, pointB.y * canvas.height);
          ctx.stroke();
        });
        
        // Draw points
        ctx.fillStyle = '#00ffff';
        landmarks.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        // Update label
        const label = this._shadow.querySelector('.hud-label');
        if (label) {
          const side = handedness?.categoryName || 'Unknown';
          const state = (side === 'Right' && this._rightPinching) || (side === 'Left' && this._leftPinching) 
            ? 'Pinching' 
            : 'Detected';
          label.textContent = `${side} hand ${state}`;
        }
      }
    } else {
      const label = this._shadow.querySelector('.hud-label');
      if (label) label.textContent = 'No hand';
    }
  }

  _showError(code, message) {
    const gate = this._shadow.querySelector('.enable-gate');
    if (!gate) return;
    
    gate.classList.remove('hidden');
    gate.innerHTML = `
      <div class="error-title">Error: ${code}</div>
      <div class="error-message">${message}</div>
    `;
  }

  disableCamera() {
    if (!this._cameraActive) return;
    
    this._cameraActive = false;
    
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(track => track.stop());
      this._mediaStream = null;
    }
    
    if (this._webcamVideo) {
      this._webcamVideo.srcObject = null;
      this._webcamVideo = null;
    }
    
    const hud = this._shadow.querySelector('.hud');
    if (hud) hud.classList.remove('active');
    
    this.dispatchEvent(new CustomEvent('gep-camera-off', { composed: true }));
  }

  destroy() {
    this.disableCamera();
    
    if (this._handLandmarker) {
      this._handLandmarker.close();
      this._handLandmarker = null;
    }
    
    this._video = null;
    this._slottedVideo = null;
  }

  getVideoElement() {
    return this._video;
  }
}

// Register custom element
customElements.define('gesture-video-player', GestureVideoPlayer);

export default GestureVideoPlayer;
