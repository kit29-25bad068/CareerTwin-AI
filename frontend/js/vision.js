/**
 * CareerTwin AI - Vision & Eye Contact Intelligence Engine
 * Real-time face detection, pupil centroid localization, eyeball movement prediction, and framing analysis
 */

class VisionTracker {
  constructor() {
    this.videoElement = null;
    this.canvasElement = null; // Internal analysis canvas (offscreen)
    this.overlayCanvasElement = null; // Viewfinder visual reticle overlay
    this.hudElement = null;
    this.isTracking = false;

    // Per-question tracking counters
    this.totalFrames = 0;
    this.faceDetectedFrames = 0;
    this.eyeContactFrames = 0;
    this.lookingAwayCount = 0;

    // Gaze direction breakdown
    this.directionCounts = {
      center: 0,
      down: 0,
      left: 0,
      right: 0,
      up: 0,
      offCenter: 0,
    };

    // Gaze state tracking
    this.consecutiveLookingAway = 0;
    this.wasLookingAway = false;
    this.intervalId = null;
    this.nativeDetector = null;

    // Rolling frame history for blink filtering and temporal smoothing
    this.recentGazeStates = [];
  }

  async init(videoElement, canvasElement = null, overlayCanvasElement = null, hudElement = null) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement || document.getElementById('vision-tracker-canvas');
    this.overlayCanvasElement = overlayCanvasElement || document.getElementById('camera-tracking-overlay');
    this.hudElement = hudElement || document.getElementById('camera-gaze-hud');

    // Attempt to use native Chromium FaceDetector API if available
    if ('FaceDetector' in window) {
      try {
        this.nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {
        this.nativeDetector = null;
      }
    }
  }

  startTracking() {
    if (!this.videoElement) return;
    this.isTracking = true;
    this.resetQuestionCounters();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // High-responsiveness sampling every 200ms (5 FPS)
    this.intervalId = setInterval(() => {
      this.analyzeFrame();
    }, 200);
  }

  resetQuestionCounters() {
    this.totalFrames = 0;
    this.faceDetectedFrames = 0;
    this.eyeContactFrames = 0;
    this.lookingAwayCount = 0;
    this.consecutiveLookingAway = 0;
    this.wasLookingAway = false;
    this.recentGazeStates = [];
    this.directionCounts = {
      center: 0,
      down: 0,
      left: 0,
      right: 0,
      up: 0,
      offCenter: 0,
    };
  }

  async analyzeFrame() {
    if (!this.videoElement || this.videoElement.paused || this.videoElement.ended || !this.isTracking) return;
    if (this.videoElement.readyState < 2 || !this.videoElement.videoWidth) return;

    this.totalFrames++;

    const sampleWidth = 320;
    const sampleHeight = 240;

    let canvas = this.canvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      this.canvasElement = canvas;
    }
    if (canvas.width !== sampleWidth || canvas.height !== sampleHeight) {
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(this.videoElement, 0, 0, sampleWidth, sampleHeight);

    let isFaceDetected = false;
    let isDirectEyeContact = true;
    let gazeDirection = 'center';
    let gazeStatusDescription = 'Direct Eye Contact';
    let faceBox = null;
    let eyeRegions = [];
    let detectedPupils = [];

    // -----------------------------------------------------------------
    // 1. Primary: Native FaceDetector API (Chromium / Edge if enabled)
    // -----------------------------------------------------------------
    if (this.nativeDetector) {
      try {
        const faces = await this.nativeDetector.detect(canvas);
        if (faces && faces.length > 0) {
          isFaceDetected = true;
          const face = faces[0];
          const box = face.boundingBox;
          faceBox = {
            x: box.x,
            y: box.y,
            w: box.width,
            h: box.height,
            cx: (box.x + box.width / 2) / sampleWidth,
            cy: (box.y + box.height / 2) / sampleHeight,
          };

          // Native eye landmarks check
          if (face.landmarks && face.landmarks.length >= 2) {
            const eyes = face.landmarks.filter((l) => l.type === 'eye');
            if (eyes.length >= 2) {
              const eyeMidX = (eyes[0].location.x + eyes[1].location.x) / 2;
              const eyeMidY = (eyes[0].location.y + eyes[1].location.y) / 2;
              const faceMidX = box.x + box.width / 2;
              const faceMidY = box.y + box.height * 0.4;

              const devX = (eyeMidX - faceMidX) / box.width;
              const devY = (eyeMidY - faceMidY) / box.height;

              if (Math.abs(devX) > 0.08) {
                isDirectEyeContact = false;
                gazeDirection = devX < 0 ? 'left' : 'right';
                gazeStatusDescription = devX < 0 ? 'Gaze Shifted: Looking Left' : 'Gaze Shifted: Looking Right';
              } else if (devY > 0.08) {
                isDirectEyeContact = false;
                gazeDirection = 'down';
                gazeStatusDescription = 'Gaze Shifted: Looking Down (Notes / Desk)';
              } else if (devY < -0.08) {
                isDirectEyeContact = false;
                gazeDirection = 'up';
                gazeStatusDescription = 'Gaze Shifted: Looking Up';
              }
            }
          }
        }
      } catch (detErr) {
        // Fall through to optical analyzer
      }
    }

    // -----------------------------------------------------------------
    // 2. Optical Spatial Gradient & Eyeball / Pupil Centroid Analyzer
    // -----------------------------------------------------------------
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;

    if (!isFaceDetected) {
      // Adaptive Dual-Color Space Skin Segmentation (YCbCr + Normalized RGB)
      let skinPixelCount = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = sampleWidth;
      let maxX = 0;
      let minY = sampleHeight;
      let maxY = 0;

      for (let y = 0; y < sampleHeight; y += 2) {
        for (let x = 0; x < sampleWidth; x += 2) {
          const idx = (y * sampleWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr skin transformation
          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
          const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

          // Universal multi-ethnic skin chromaticity rule
          const isYCbCrSkin = Cr >= 133 && Cr <= 178 && Cb >= 77 && Cb <= 130 && Y >= 30;
          const isRgbSkin = r > 50 && g > 30 && b > 20 && r > g && r > b && (r - g) >= 8;

          if (isYCbCrSkin || isRgbSkin) {
            skinPixelCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check if cluster meets minimum face threshold (~3.5% of sampled pixels)
      const totalSampled = (sampleWidth * sampleHeight) / 4;
      if (skinPixelCount > totalSampled * 0.035 && maxX > minX && maxY > minY) {
        isFaceDetected = true;
        const faceW = maxX - minX;
        const faceH = maxY - minY;
        const cx = sumX / skinPixelCount / sampleWidth;
        const cy = sumY / skinPixelCount / sampleHeight;

        faceBox = {
          x: minX,
          y: minY,
          w: faceW,
          h: faceH,
          cx,
          cy,
        };
      } else {
        isFaceDetected = false;
        isDirectEyeContact = false;
        gazeDirection = 'none';
        gazeStatusDescription = 'Face Not Detected in Camera';
      }
    }

    // -----------------------------------------------------------------
    // 3. Eyeball / Pupil Movement Prediction Logic
    // -----------------------------------------------------------------
    if (isFaceDetected && faceBox) {
      // Check head centering
      const isHorizontallyCentered = faceBox.cx >= 0.28 && faceBox.cx <= 0.72;
      const isVerticallyCentered = faceBox.cy >= 0.20 && faceBox.cy <= 0.80;

      if (!isHorizontallyCentered) {
        isDirectEyeContact = false;
        gazeDirection = faceBox.cx < 0.28 ? 'left' : 'right';
        gazeStatusDescription = faceBox.cx < 0.28 ? 'Face Shifted Left (Looking Off-Screen)' : 'Face Shifted Right (Looking Off-Screen)';
      } else if (!isVerticallyCentered) {
        isDirectEyeContact = false;
        gazeDirection = faceBox.cy > 0.80 ? 'down' : 'up';
        gazeStatusDescription = faceBox.cy > 0.80 ? 'Gaze Shifted: Looking Down (Notes / Desk)' : 'Gaze Shifted: Looking Up';
      } else {
        // Human facial anthropometry: Eye sockets localization
        // Left Eye (subject's right) & Right Eye (subject's left)
        const eyeSocketY = Math.max(0, Math.floor(faceBox.y + faceBox.h * 0.26));
        const eyeSocketH = Math.max(12, Math.floor(faceBox.h * 0.22));

        const leftEyeX = Math.max(0, Math.floor(faceBox.x + faceBox.w * 0.16));
        const leftEyeW = Math.max(16, Math.floor(faceBox.w * 0.30));

        const rightEyeX = Math.max(0, Math.floor(faceBox.x + faceBox.w * 0.54));
        const rightEyeW = Math.max(16, Math.floor(faceBox.w * 0.30));

        eyeRegions = [
          { x: leftEyeX, y: eyeSocketY, w: leftEyeW, h: eyeSocketH, label: 'L' },
          { x: rightEyeX, y: eyeSocketY, w: rightEyeW, h: eyeSocketH, label: 'R' },
        ];

        // Analyze pupil & iris centroids in each eye socket
        detectedPupils = eyeRegions.map((eye) => {
          let minB = 255;
          let sumB = 0;
          let count = 0;

          // Pass 1: Find min brightness & average brightness in the eye socket
          for (let y = eye.y; y < Math.min(sampleHeight, eye.y + eye.h); y++) {
            for (let x = eye.x; x < Math.min(sampleWidth, eye.x + eye.w); x++) {
              const idx = (y * sampleWidth + x) * 4;
              const b = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
              if (b < minB) minB = b;
              sumB += b;
              count++;
            }
          }

          const avgB = count > 0 ? sumB / count : 128;
          // Dynamic adaptive dark pupil threshold
          const darkThreshold = minB + (avgB - minB) * 0.36;

          // Pass 2: Calculate darkness-weighted pupil centroid
          let weightedSumX = 0;
          let weightedSumY = 0;
          let totalWeight = 0;

          for (let y = eye.y; y < Math.min(sampleHeight, eye.y + eye.h); y++) {
            for (let x = eye.x; x < Math.min(sampleWidth, eye.x + eye.w); x++) {
              const idx = (y * sampleWidth + x) * 4;
              const b = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
              if (b < darkThreshold) {
                const weight = darkThreshold - b;
                weightedSumX += x * weight;
                weightedSumY += y * weight;
                totalWeight += weight;
              }
            }
          }

          if (totalWeight > 0) {
            const pupilX = weightedSumX / totalWeight;
            const pupilY = weightedSumY / totalWeight;
            const normX = (pupilX - eye.x) / eye.w; // 0.0 = left corner, 1.0 = right corner
            const normY = (pupilY - eye.y) / eye.h; // 0.0 = upper eyelid, 1.0 = lower eyelid

            return {
              pupilX,
              pupilY,
              normX,
              normY,
              valid: true,
            };
          }

          return { pupilX: eye.x + eye.w / 2, pupilY: eye.y + eye.h / 2, normX: 0.5, normY: 0.5, valid: false };
        });

        // Eyeball Movement Prediction evaluation across valid eyes
        const validPupils = detectedPupils.filter((p) => p.valid);
        if (validPupils.length > 0) {
          const avgNormX = validPupils.reduce((acc, p) => acc + p.normX, 0) / validPupils.length;
          const avgNormY = validPupils.reduce((acc, p) => acc + p.normY, 0) / validPupils.length;

          // Eyeball deviation thresholds
          const isLookingLeft = avgNormX < 0.37;
          const isLookingRight = avgNormX > 0.63;
          const isLookingDown = avgNormY > 0.67;
          const isLookingUp = avgNormY < 0.33;

          if (isLookingDown) {
            isDirectEyeContact = false;
            gazeDirection = 'down';
            gazeStatusDescription = 'Gaze Shifted: Looking Down (Notes / Desk)';
          } else if (isLookingLeft) {
            isDirectEyeContact = false;
            gazeDirection = 'left';
            gazeStatusDescription = 'Gaze Shifted: Looking Left';
          } else if (isLookingRight) {
            isDirectEyeContact = false;
            gazeDirection = 'right';
            gazeStatusDescription = 'Gaze Shifted: Looking Right';
          } else if (isLookingUp) {
            isDirectEyeContact = false;
            gazeDirection = 'up';
            gazeStatusDescription = 'Gaze Shifted: Looking Up';
          } else {
            isDirectEyeContact = true;
            gazeDirection = 'center';
            gazeStatusDescription = 'Direct Eye Contact';
          }
        }
      }
    }

    // -----------------------------------------------------------------
    // 4. Temporal Smoothing, Blink Filtering & Incident Detection
    // -----------------------------------------------------------------
    if (isFaceDetected) {
      this.faceDetectedFrames++;
      this.directionCounts[gazeDirection] = (this.directionCounts[gazeDirection] || 0) + 1;
    }

    // Rolling 4-frame window: prevents natural blinks (<300ms) from counting as gaze shifts
    this.recentGazeStates.push(isDirectEyeContact);
    if (this.recentGazeStates.length > 4) this.recentGazeStates.shift();

    const directCount = this.recentGazeStates.filter(Boolean).length;
    const isStableDirect = directCount >= 2;

    if (isStableDirect && isFaceDetected) {
      this.eyeContactFrames++;
      this.consecutiveLookingAway = 0;
      this.wasLookingAway = false;
    } else {
      this.consecutiveLookingAway++;
      // Require 2 consecutive frames (~400ms) of sustained gaze shift to log an incident
      if (this.consecutiveLookingAway === 2 && !this.wasLookingAway) {
        this.lookingAwayCount++;
        this.wasLookingAway = true;
      }
    }

    // -----------------------------------------------------------------
    // 5. Render Visual Tracking Overlay & Live HUD
    // -----------------------------------------------------------------
    this.renderTrackingOverlay(faceBox, eyeRegions, detectedPupils, isDirectEyeContact, gazeDirection);
    this.updateHUD(isFaceDetected, isDirectEyeContact, gazeDirection, gazeStatusDescription);
  }

  renderTrackingOverlay(faceBox, eyeRegions, detectedPupils, isDirectEyeContact, gazeDirection) {
    const canvas = this.overlayCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth || 320;
      canvas.height = canvas.clientHeight || 240;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!faceBox || !this.isTracking) return;

    const scaleX = canvas.width / 320;
    const scaleY = canvas.height / 240;

    const faceColor = isDirectEyeContact ? 'rgba(16, 185, 129, 0.65)' : 'rgba(245, 158, 11, 0.75)';
    const eyeColor = isDirectEyeContact ? '#10b981' : '#f59e0b';

    // 1. Draw subtle face frame brackets
    const fx = faceBox.x * scaleX;
    const fy = faceBox.y * scaleY;
    const fw = faceBox.w * scaleX;
    const fh = faceBox.h * scaleY;
    const bLen = Math.min(fw, fh) * 0.18;

    ctx.strokeStyle = faceColor;
    ctx.lineWidth = 1.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(fx, fy + bLen); ctx.lineTo(fx, fy); ctx.lineTo(fx + bLen, fy);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(fx + fw - bLen, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + bLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh - bLen); ctx.lineTo(fx, fy + fh); ctx.lineTo(fx + bLen, fy + fh);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(fx + fw - bLen, fy + fh); ctx.lineTo(fx + fw, fy + fh); ctx.lineTo(fx + fw, fy + fh - bLen);
    ctx.stroke();

    // Note: Eyeball dots and eye bounding boxes are intentionally not rendered 
    // on the camera feed to keep the live viewfinder clean and natural. 
    // Gaze tracking calculations continue to operate in the background.
  }

  updateHUD(isFaceDetected, isDirectEyeContact, direction, description) {
    const hudContainer = this.hudElement || document.getElementById('camera-gaze-hud');
    const statusText = document.getElementById('gaze-status-indicator');
    const pctText = document.getElementById('gaze-percentage-indicator');
    const shiftsText = document.getElementById('gaze-shifts-indicator');

    if (!hudContainer || !statusText) return;

    hudContainer.style.display = 'flex';

    const safeTotal = Math.max(this.totalFrames, 1);
    const currentEyePct = Math.round((this.eyeContactFrames / safeTotal) * 100);

    if (pctText) {
      pctText.textContent = `${Math.min(currentEyePct, 100)}% Contact`;
    }

    if (shiftsText) {
      shiftsText.textContent = `${this.lookingAwayCount} Gaze Shift${this.lookingAwayCount === 1 ? '' : 's'}`;
    }

    if (!isFaceDetected) {
      statusText.innerHTML = '🔴 <span style="color:#ef4444; font-weight:600;">Face Not Centered</span>';
      hudContainer.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      hudContainer.style.background = 'rgba(239, 68, 68, 0.12)';
    } else if (isDirectEyeContact) {
      statusText.innerHTML = '🟢 🎯 <span style="color:#10b981; font-weight:600;">Direct Eye Contact</span>';
      hudContainer.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      hudContainer.style.background = 'rgba(16, 185, 129, 0.12)';
    } else {
      let icon = '🟡 ⚠️';
      if (direction === 'down') icon = '🟡 ⬇️';
      else if (direction === 'left') icon = '🟡 ⬅️';
      else if (direction === 'right') icon = '🟡 ➡️';
      else if (direction === 'up') icon = '🟡 ⬆️';

      statusText.innerHTML = `${icon} <span style="color:#f59e0b; font-weight:600;">${description}</span>`;
      hudContainer.style.borderColor = 'rgba(245, 158, 11, 0.5)';
      hudContainer.style.background = 'rgba(245, 158, 11, 0.12)';
    }
  }

  sampleQuestionMetrics() {
    const safeTotal = Math.max(this.totalFrames, 1);
    const facePct = Math.round((this.faceDetectedFrames / safeTotal) * 100);
    const eyePct = Math.round((this.eyeContactFrames / safeTotal) * 100);

    const metrics = {
      faceDetectedPercentage: Math.min(facePct, 100),
      eyeContactPercentage: Math.min(eyePct, 100),
      lookingAwayCount: this.lookingAwayCount,
      framingQuality:
        facePct >= 85 && eyePct >= 75
          ? 'Exceptional Eye Contact & Framing'
          : eyePct >= 50
          ? 'Good Presence with Occasional Gaze Shifts'
          : 'Frequent Looking Away / Off-Center Gaze',
      directionBreakdown: { ...this.directionCounts },
    };

    // Reset counters for the next question
    this.resetQuestionCounters();

    return metrics;
  }

  stopTracking() {
    this.isTracking = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clear overlay canvas
    if (this.overlayCanvasElement) {
      const ctx = this.overlayCanvasElement.getContext('2d');
      ctx.clearRect(0, 0, this.overlayCanvasElement.width, this.overlayCanvasElement.height);
    }

    return this.sampleQuestionMetrics();
  }
}

window.VisionTracker = VisionTracker;
