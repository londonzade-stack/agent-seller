'use client'

import { useState, useEffect } from 'react'

// ─── Agent Avatar ──────────────────────────────────────────────────────
// Braille Snake spinner used as the AI agent icon throughout the app.

// Braille dot encoding: 2×4 grid, dots 1-8
// Dot values: d1=1, d2=2, d3=4, d4=8, d5=16, d6=32, d7=64, d8=128
function dots(...ds: number[]): string {
  const map = [1, 2, 4, 8, 16, 32, 64, 128]
  return String.fromCharCode(0x2800 + ds.reduce((s, d) => s + map[d - 1], 0))
}

const SNAKE_FRAMES = [
  dots(1), dots(1, 2), dots(1, 2, 3), dots(2, 3, 7),
  dots(3, 7, 8), dots(7, 8, 6), dots(8, 6, 5), dots(6, 5, 4),
  dots(5, 4, 1), dots(4, 1, 2),
]

const SNAKE_SPEED = 80

function BrailleSnake({
  fontSize,
  color,
}: {
  fontSize: string
  color: string
}) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SNAKE_FRAMES.length), SNAKE_SPEED)
    return () => clearInterval(id)
  }, [])

  return (
    <span
      className="font-mono select-none inline-flex items-center justify-center"
      style={{ fontSize, color, lineHeight: 1 }}
    >
      {SNAKE_FRAMES[idx]}
    </span>
  )
}

interface AgentAvatarProps {
  /** sm = 32px chat bubble avatar, lg = 80px welcome screen */
  size?: 'sm' | 'lg'
  /** Optional color variant — default is amber/yellow, 'blue' for Pro outreach */
  variant?: 'default' | 'blue'
}

export function AgentAvatar({ size = 'sm', variant = 'default' }: AgentAvatarProps) {
  const darkColor = variant === 'blue' ? '#60A5FA' : 'rgba(255,255,255,0.7)'
  const lightColor = variant === 'blue' ? '#3B82F6' : 'rgba(0,0,0,0.55)'

  if (size === 'lg') {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center relative">
        <div className="dark:hidden">
          <BrailleSnake fontSize="3rem" color={lightColor} />
        </div>
        <div className="hidden dark:block">
          <BrailleSnake fontSize="3rem" color={darkColor} />
        </div>
      </div>
    )
  }

  // sm — message avatar (32×32)
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center relative">
      <div className="dark:hidden">
        <BrailleSnake fontSize="1.25rem" color={lightColor} />
      </div>
      <div className="hidden dark:block">
        <BrailleSnake fontSize="1.25rem" color={darkColor} />
      </div>
    </div>
  )
}

// Backward-compatible alias
export const BlitzAvatar = AgentAvatar
