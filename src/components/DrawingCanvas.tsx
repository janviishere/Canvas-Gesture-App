import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { detectHandGestureWithML, initializeHandLandmarker, GestureSmoother } from '../utils/gestureDetector'

interface DrawingCanvasProps {
  currentColor: string
  isDrawing: boolean
  cursorPosition: { x: number; y: number }
  videoRef: React.RefObject<HTMLVideoElement>
  debugCanvasRef: React.RefObject<HTMLCanvasElement>
  showDebug: boolean
  onDrawingStateChange: (isDrawing: boolean) => void
  onCursorPositionChange: (position: { x: number; y: number }) => void
  onHandDetectedChange: (detected: boolean) => void
  onColorHover: (color: string | null) => void
  onColorSelect: (color: string) => void
  colors: string[]
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({
    currentColor,
    isDrawing,
    cursorPosition,
    videoRef,
    debugCanvasRef,
    showDebug,
    onDrawingStateChange,
    onCursorPositionChange,
    onHandDetectedChange,
    onColorHover,
    onColorSelect,
    colors
  }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const lastPositionRef = useRef<{ x: number; y: number } | null>(null)
    const animationFrameRef = useRef<number>()
    const gestureSmootherRef = useRef(new GestureSmoother())
    const isSelectingRef = useRef(false)

    // Core states
    const [isModelReady, setIsModelReady] = useState(false)
    const [diagnosticStatus, setDiagnosticStatus] = useState("Status: Initializing React Mount...")

    useImperativeHandle(ref, () => internalCanvasRef.current!)

    // Initialize Model
    useEffect(() => {
      let isMounted = true;
      setDiagnosticStatus("Status: Fetching MediaPipe WASM... (This may take up to 20 seconds, please wait!)")

      initializeHandLandmarker().then(model => {
        if (!isMounted) return;
        if (model) {
          setIsModelReady(true);
          setDiagnosticStatus("Status: ML Model OK! Waiting for Camera video frame...");
        } else {
          setDiagnosticStatus("ERROR: Model null. Failed to initialize. Check your console log (F12) for CORS or Network issues.");
        }
      }).catch(err => {
        if (isMounted) setDiagnosticStatus("CRITICAL ERROR: " + (err?.message || "Unknown Initialization Error"));
      });
      return () => { isMounted = false };
    }, [])

    useEffect(() => {
      const canvas = internalCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx

      const resizeCanvas = () => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx && canvas.width > 0) tempCtx.drawImage(canvas, 0, 0)

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        ctx.strokeStyle = currentColor
        ctx.shadowColor = currentColor
        ctx.shadowBlur = 20
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (tempCtx && tempCanvas.width > 0) ctx.drawImage(tempCanvas, 0, 0)
      }

      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)
      return () => window.removeEventListener('resize', resizeCanvas)
    }, [currentColor])

    useEffect(() => {
      if (!ctxRef.current) return
      const ctx = ctxRef.current
      ctx.strokeStyle = currentColor
      ctx.shadowColor = currentColor
    }, [currentColor])

    useEffect(() => {
      const video = videoRef.current
      const debugCanvas = debugCanvasRef.current

      if (!video) {
        if (isModelReady) setDiagnosticStatus("Status: Camera stream blocked or video element missing.")
        return
      }
      if (!isModelReady) return

      const debugCtx = debugCanvas?.getContext('2d')

      const arcRadius = 180
      const centerX = window.innerWidth / 2
      const centerY = 120
      const colorPositions = colors.map((color, index) => {
        const angle = Math.PI + (index / (colors.length - 1)) * Math.PI
        const x = centerX + Math.cos(angle) * arcRadius
        const y = centerY + Math.sin(angle) * (arcRadius * 0.6)
        return { color, x, y }
      })

      let lastVideoTime = -1;
      let frameCounter = 0;

      const detectGesture = () => {
        if (video.readyState < 2 || video.videoWidth === 0) {
          setDiagnosticStatus(`Status: Waiting for Video Size (ReadyState: ${video.readyState}, w: ${video.videoWidth})`)
          animationFrameRef.current = requestAnimationFrame(detectGesture)
          return
        }

        if (video.currentTime === lastVideoTime) {
          // Waiting for an updated frame from webcam
          animationFrameRef.current = requestAnimationFrame(detectGesture)
          return
        }

        lastVideoTime = video.currentTime
        const nowInMs = performance.now()
        let result: any = { isPinching: false, position: null, confidence: 0, handDetected: false, landmarks: undefined }

        try {
          // Track detection success
          result = detectHandGestureWithML(video, nowInMs)
          frameCounter++
          if (frameCounter % 60 === 0) {
            setDiagnosticStatus(`Status: Tracking Active. FPS OK. Hand Detected: ${result.handDetected}`)
          }
        } catch (e: any) {
          console.error("Poll Error:", e)
          setDiagnosticStatus("ERROR internally: " + e.message)
        }

        if (showDebug && debugCanvas && debugCtx) {
          debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height)

          if (result.landmarks && result.handDetected && Array.isArray(result.landmarks)) {
            const points = result.landmarks.map((lm: any) => ({
              x: (1 - lm.x) * debugCanvas.width,
              y: lm.y * debugCanvas.height
            }))

            const HAND_CONNECTIONS = [
              [0, 1], [1, 2], [2, 3], [3, 4],
              [0, 5], [5, 6], [6, 7], [7, 8],
              [5, 9], [9, 10], [10, 11], [11, 12],
              [9, 13], [13, 14], [14, 15], [15, 16],
              [13, 17], [17, 18], [18, 19], [19, 20],
              [0, 17]
            ]

            // Glowing infra-green rays effect
            debugCtx.strokeStyle = result.isPinching ? '#ff0055' : '#00ffaa'
            debugCtx.lineWidth = 3
            debugCtx.lineCap = 'round'
            debugCtx.lineJoin = 'round'
            debugCtx.shadowColor = result.isPinching ? '#ff0055' : '#00ffaa'
            debugCtx.shadowBlur = 10

            debugCtx.beginPath()
            for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
              if (points[startIdx] && points[endIdx]) {
                debugCtx.moveTo(points[startIdx].x, points[startIdx].y)
                debugCtx.lineTo(points[endIdx].x, points[endIdx].y)
              }
            }
            debugCtx.stroke()

            // Reset shadow
            debugCtx.shadowBlur = 0
          }
        }

        onHandDetectedChange(result.handDetected)

        // Ensure proper typed usage with no destructure bugs
        if (result.position && result.handDetected && typeof result.position.x === 'number') {
          gestureSmootherRef.current.addPosition(result.position)
          gestureSmootherRef.current.addPinchState(result.isPinching)
        } else {
          gestureSmootherRef.current.reset()
          onDrawingStateChange(false)
          onColorHover(null)
          isSelectingRef.current = false
        }

        const smoothedPosition = gestureSmootherRef.current.getSmoothedPosition()
        const smoothedPinch = gestureSmootherRef.current.getSmoothedPinchState()

        if (smoothedPosition) {
          const screenX = (1 - smoothedPosition.x) * window.innerWidth
          const screenY = smoothedPosition.y * window.innerHeight

          onCursorPositionChange({ x: screenX, y: screenY })

          const SELECTION_ZONE_Y = window.innerHeight * 0.35
          const isSelectionZone = screenY < SELECTION_ZONE_Y

          if (isSelectionZone) {
            let hoveredColor: string | null = null
            const hoverThreshold = 60

            for (const pos of colorPositions) {
              const dx = screenX - pos.x
              const dy = screenY - pos.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance < hoverThreshold) {
                hoveredColor = pos.color
                break
              }
            }

            onColorHover(hoveredColor)
            if (smoothedPinch && hoveredColor) {
              onColorSelect(hoveredColor)
              isSelectingRef.current = true
            } else {
              isSelectingRef.current = false
            }
            onDrawingStateChange(false)
          } else {
            onColorHover(null)
            isSelectingRef.current = false
            onDrawingStateChange(smoothedPinch)
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectGesture)
      }

      setDiagnosticStatus("Status: Engaging camera feed into model...")
      animationFrameRef.current = requestAnimationFrame(detectGesture)

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      }
    }, [videoRef, debugCanvasRef, showDebug, onDrawingStateChange, onCursorPositionChange, onHandDetectedChange, onColorHover, onColorSelect, colors, isModelReady])

    useEffect(() => {
      const canvas = internalCanvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return

      if (isDrawing && !isSelectingRef.current && cursorPosition.x > 0 && cursorPosition.y > 0) {
        if (lastPositionRef.current) {
          ctx.beginPath()
          ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y)
          ctx.lineTo(cursorPosition.x, cursorPosition.y)
          ctx.stroke()
        }
        lastPositionRef.current = { ...cursorPosition }
      } else {
        lastPositionRef.current = null
      }
    }, [isDrawing, cursorPosition])

    return (
      <>
        {/* DIAGNOSTIC OVERLAY */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 text-base font-bold bg-black/80 px-4 py-2 text-white border-2 border-yellow-500 rounded shadow-[0_0_15px_rgba(234,179,8,0.5)] whitespace-nowrap">
          {diagnosticStatus}
        </div>

        <canvas
          ref={internalCanvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      </>
    )
  }
)

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas