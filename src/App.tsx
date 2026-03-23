import { useState, useRef, useEffect } from 'react'
import StartScreen from './components/StartScreen'
import DrawingCanvas from './components/DrawingCanvas'
import ColorPalette from './components/ColorPalette'
import ClearButton from './components/ClearButton'
import { Eye, EyeOff, Palette, PenTool } from 'lucide-react'
import { Button } from './components/ui/button'

type AppState = 'start' | 'drawing'

const COLORS = [
  '#FF4757', '#FF9F43', '#FFD93D', '#4ECDC4', 
  '#45B7D1', '#96CEB4', '#FEAADE', '#C77DFE'
]

export default function App() {
  const [appState, setAppState] = useState<AppState>('start')
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [currentColor, setCurrentColor] = useState('#FF4757')
  const [isDrawing, setIsDrawing] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [handDetected, setHandDetected] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [mode, setMode] = useState<'drawing' | 'selecting'>('drawing')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleColorSelect = (color: string) => {
    setCurrentColor(color)
    // Optional: Play a sound or haptic feedback here
  }

  const handleStart = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } 
      })
      setVideoStream(stream)
      setAppState('drawing')
    } catch (err: any) {
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Camera access denied. Please allow camera access.')
      } else {
        alert('Failed to start camera: ' + err.message)
      }
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (appState === 'drawing' && videoStream && video) {
      video.srcObject = videoStream
      video.play().catch(console.error)
    }
    return () => {
      if (video) video.srcObject = null
    }
  }, [appState, videoStream])

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [videoStream])

  // Determine mode based on cursor position
  useEffect(() => {
    const SELECTION_ZONE_Y = window.innerHeight * 0.35
    if (cursorPosition.y < SELECTION_ZONE_Y) {
      setMode('selecting')
    } else {
      setMode('drawing')
    }
  }, [cursorPosition])

  if (appState === 'start') {
    return <StartScreen onStart={handleStart} />
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {showDebug && (
        <canvas 
          ref={debugCanvasRef}
          width={160}
          height={120}
          className="absolute top-20 right-4 border-2 border-green-500 rounded-lg z-50 bg-black"
          style={{ width: 320, height: 240 }}
        />
      )}

      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="absolute inset-0 h-full w-full object-cover transform scale-x-[-1]"
      />
      
      <DrawingCanvas 
        ref={canvasRef}
        currentColor={currentColor}
        isDrawing={isDrawing}
        cursorPosition={cursorPosition}
        videoRef={videoRef}
        debugCanvasRef={debugCanvasRef}
        showDebug={showDebug}
        onDrawingStateChange={setIsDrawing}
        onCursorPositionChange={setCursorPosition}
        onHandDetectedChange={setHandDetected}
        onColorHover={setHoveredColor}
        onColorSelect={handleColorSelect}
        colors={COLORS}
      />
      
      {/* CUSTOM CURSOR */}
      <div 
        className="fixed pointer-events-none z-40 rounded-full border-4 transition-all duration-75 ease-out flex items-center justify-center"
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          width: mode === 'selecting' ? '60px' : (isDrawing ? '20px' : '40px'),
          height: mode === 'selecting' ? '60px' : (isDrawing ? '20px' : '40px'),
          borderColor: mode === 'selecting' ? (hoveredColor || 'white') : currentColor,
          backgroundColor: isDrawing && mode === 'drawing' ? currentColor : 'transparent',
          boxShadow: `0 0 25px ${mode === 'selecting' ? (hoveredColor || 'white') : currentColor}`,
          transform: 'translate(-50%, -50%)',
          opacity: handDetected ? 1 : 0.2
        }}
      >
        {/* Icon inside cursor for mode indication */}
        {mode === 'selecting' && (
          <Palette className="w-6 h-6 text-white" />
        )}
      </div>
      
      {/* Mode Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className={`flex items-center gap-2 px-6 py-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
          mode === 'selecting' 
            ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' 
            : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
        }`}>
          {mode === 'selecting' ? (
            <>
              <Palette className="w-5 h-5" />
              <span className="font-bold tracking-wide">COLOR MODE</span>
            </>
          ) : (
            <>
              <PenTool className="w-5 h-5" />
              <span className="font-bold tracking-wide">DRAW MODE</span>
            </>
          )}
        </div>
      </div>
      
      {/* Status Indicators */}
      <div className="absolute top-16 left-4 flex flex-col gap-2 z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
          <div 
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              handDetected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'
            }`}
          />
          <span className="text-white text-sm font-medium">
            {handDetected ? 'Hand Detected' : 'No Hand'}
          </span>
        </div>
      </div>
      
      <Button
        onClick={() => setShowDebug(!showDebug)}
        variant="outline"
        className="absolute top-4 right-4 z-20 bg-black/60 border-white/20 text-white hover:bg-white/10 hover:text-white"
      >
        {showDebug ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </Button>
      
      <ColorPalette 
        currentColor={currentColor}
        hoveredColor={hoveredColor}
        colors={COLORS}
      />
      
      <ClearButton canvasRef={canvasRef} />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium backdrop-blur-sm bg-black/50 px-6 py-2 rounded-full border border-white/10 text-center z-10 max-w-md">
        <span className="text-pink-400">Top Zone</span>: Pinch to select color • 
        <span className="text-cyan-400"> Bottom Zone</span>: Pinch to draw
      </div>
    </div>
  )
}