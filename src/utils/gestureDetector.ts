import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let handLandmarker: HandLandmarker | null = null;
let isInitializing = false;

export async function initializeHandLandmarker(): Promise<HandLandmarker | null> {
  if (handLandmarker) return handLandmarker;
  if (isInitializing) return null; // Prevent multiple simultaneous initializations
  
  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    return handLandmarker;
  } catch (error: any) {
    console.error("Failed to initialize MediaPipe:", error);
    throw new Error(error?.message || String(error))
  } finally {
    isInitializing = false;
  }
}

export interface GestureResult {
  isPinching: boolean
  position: { x: number; y: number } | null
  confidence: number
  handDetected: boolean
  landmarks?: { x: number, y: number, z: number }[]
}

export function detectHandGestureWithML(
  video: HTMLVideoElement,
  timestamp: number
): GestureResult {
  if (!handLandmarker) {
    return { isPinching: false, position: null, confidence: 0, handDetected: false };
  }

  let results;
  try {
    results = handLandmarker.detectForVideo(video, timestamp);
  } catch (err) {
    // If MediaPipe skips a frame or timestamp duplicates, swallow the frame gap safely.
    return { isPinching: false, position: null, confidence: 0, handDetected: false };
  }
  
  if (results.landmarks && results.landmarks.length > 0) {
    const hand = results.landmarks[0];
    const indexTip = hand[8];
    const thumbTip = hand[4];

    // Calculate distance between thumb and index tip in 3D
    const dx = indexTip.x - thumbTip.x;
    const dy = indexTip.y - thumbTip.y;
    const dz = indexTip.z - thumbTip.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const isPinching = distance < 0.08; // Threshold for pinch

    // Position is midway between thumb and index tip
    const x = (indexTip.x + thumbTip.x) / 2;
    const y = (indexTip.y + thumbTip.y) / 2;

    return {
      isPinching,
      position: { x, y }, // Normalized coordinates [0, 1]
      confidence: 1, // MediaPipe handles its own confidence internally
      handDetected: true,
      landmarks: hand
    };
  }

  return { isPinching: false, position: null, confidence: 0, handDetected: false };
}

export class GestureSmoother {
  private positionHistory: { x: number; y: number }[] = []
  private pinchHistory: boolean[] = []
  private readonly maxHistory = 4 // Snappy smoothing
  private readonly pinchThreshold = 0.5 // 50% of frames must be pinching to be true

  addPosition(position: { x: number; y: number }) {
    this.positionHistory.push(position)
    if (this.positionHistory.length > this.maxHistory) {
      this.positionHistory.shift()
    }
  }

  addPinchState(isPinching: boolean) {
    this.pinchHistory.push(isPinching)
    if (this.pinchHistory.length > this.maxHistory) {
      this.pinchHistory.shift()
    }
  }

  getSmoothedPosition(): { x: number; y: number } | null {
    if (this.positionHistory.length === 0) return null
    
    let sumX = 0
    let sumY = 0
    const count = this.positionHistory.length

    for (let i = 0; i < count; i++) {
      sumX += this.positionHistory[i].x
      sumY += this.positionHistory[i].y
    }
    
    return {
      x: sumX / count,
      y: sumY / count
    }
  }

  getSmoothedPinchState(): boolean {
    if (this.pinchHistory.length === 0) return false
    
    const pinchCount = this.pinchHistory.filter(p => p).length
    return pinchCount / this.pinchHistory.length >= this.pinchThreshold
  }

  reset() {
    this.positionHistory = []
    this.pinchHistory = []
  }
}