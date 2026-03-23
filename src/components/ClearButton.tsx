import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from './ui/button'

interface ClearButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export default function ClearButton({ canvasRef }: ClearButtonProps) {
  const handleClear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') {
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvasRef])

  return (
    <Button
      onClick={handleClear}
      className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Clear canvas"
    >
      <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
    </Button>
  )
}