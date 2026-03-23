import { Play, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

interface StartScreenProps {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="w-10 h-10 text-cyan-400" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Canvas Pro
          </h1>
          <Sparkles className="w-10 h-10 text-pink-400" />
        </div>

        <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
          Draw in the air using hand gestures
        </p>

        <div className="flex flex-col gap-3 text-gray-400 mb-12 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">1</div>
            <span>Allow camera access</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">2</div>
            <span>Pinch fingers together to draw</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">3</div>
            <span>Hover over colors to switch</span>
          </div>
        </div>

        <Button
          onClick={onStart}
          className="group relative px-8 py-6 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
        >
          <Play className="w-6 h-6 mr-2 group-hover:translate-x-1 transition-transform" />
          Start Drawing
        </Button>

        <p className="mt-6 text-sm text-gray-500">
          All processing happens locally • No data leaves your device
        </p>
      </div>
    </div>
  )
}