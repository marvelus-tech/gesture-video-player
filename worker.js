// Web Worker stub for gesture video player
// Currently unused - main thread detection is primary implementation
// Future: Offload hand detection to worker for better performance

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'ping':
      self.postMessage({ type: 'pong', timestamp: Date.now() });
      break;
      
    case 'init':
      // Future: Initialize MediaPipe in worker context
      self.postMessage({ type: 'ready' });
      break;
      
    case 'detect':
      // Future: Run hand detection on video frame
      // payload: { imageData, timestamp }
      self.postMessage({ 
        type: 'result',
        payload: {
          landmarks: [],
          handedness: [],
          timestamp: payload?.timestamp || Date.now()
        }
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Note: Main-thread HandLandmarker VIDEO mode is the primary implementation
// Worker-based detection requires IMAGE mode and manual frame extraction
// Trade-offs:
//   Main thread: Better MediaPipe VIDEO mode, simpler state, direct canvas access
//   Worker: Reduced main thread blocking, but requires frame serialization overhead
