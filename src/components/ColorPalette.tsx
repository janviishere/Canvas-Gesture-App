import { useState, useEffect } from 'react'

interface ColorPaletteProps {
  currentColor: string
  hoveredColor: string | null
  colors: string[]
}

export default function ColorPalette({
  currentColor,
  hoveredColor,
  colors
}: ColorPaletteProps) {
  const arcRadius = 180
  const centerX = window.innerWidth / 2
  const centerY = 120

  const colorPositions = colors.map((color, index) => {
    const angle = Math.PI + (index / (colors.length - 1)) * Math.PI
    const x = centerX + Math.cos(angle) * arcRadius
    const y = centerY + Math.sin(angle) * (arcRadius * 0.6)
    return { color, x, y }
  })

  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none z-30">
      <svg 
        className="absolute top-0 left-1/2 -translate-x-1/2"
        width={arcRadius * 2.5} 
        height={arcRadius * 1.5}
        viewBox={`0 0 ${arcRadius * 2.5} ${arcRadius * 1.5}`}
      >
        <path
          d={`M ${centerX - arcRadius * 1.2} ${centerY + 20} 
              Q ${centerX} ${centerY - arcRadius} 
              ${centerX + arcRadius * 1.2} ${centerY + 20}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {colorPositions.map((pos, index) => {
        const isHovered = hoveredColor === pos.color
        const isSelected = currentColor === pos.color

        return (
          <div
            key={index}
            className="absolute rounded-full transition-all duration-200 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              width: isHovered ? '60px' : '45px',
              height: isHovered ? '60px' : '45px',
              backgroundColor: pos.color,
              transform: 'translate(-50%, -50%)',
              boxShadow: isHovered 
                ? `0 0 30px ${pos.color}, 0 0 60px ${pos.color}` 
                : isSelected 
                  ? `0 0 20px ${pos.color}` 
                  : '0 4px 6px rgba(0, 0, 0, 0.3)',
              border: isSelected ? '4px solid white' : '2px solid rgba(255,255,255,0.5)',
              zIndex: isHovered ? 40 : 30
            }}
          >
            {isSelected && !isHovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full opacity-80" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}