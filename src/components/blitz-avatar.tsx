'use client'

// ─── Agent Avatar ──────────────────────────────────────────────────────
// Pixel art avatar used as the AI agent icon throughout the app.

const AGENT_GRID = [
  '........YYY........',
  '.......YYYYY.......',
  '......YYYYYYY......',
  '......YWWYYWWY.....',
  '......YWKYYWKY.....',
  '......YYYYYYY......',
  '.......YYYYY.......',
  '......YYYYYYY......',
  '.....YYYYYYYYY.....',
  '....YY.YYYYY.YY....',
  '...YY..YYYYY..YY...',
  '..YY...YYYYY...YY..',
  '.......YYYYY.......',
  '......YY.YY.Y......',
  '.....YYGGYYGGY.....',
  '......GGG.GGG......',
]

const AGENT_PALETTE: Record<string, string> = {
  Y: '#FBBF24',
  W: '#FFFFFF',
  K: '#1a1a1a',
  G: '#F59E0B',
  '.': '',
}

const AGENT_BLUE_PALETTE: Record<string, string> = {
  Y: '#60A5FA',
  W: '#FFFFFF',
  K: '#1a1a1a',
  G: '#3B82F6',
  '.': '',
}

function PixelGrid({
  grid,
  palette,
  pixelSize,
}: {
  grid: string[]
  palette: Record<string, string>
  pixelSize: number
}) {
  const rows = grid.length
  const cols = Math.max(...grid.map((r) => r.length))
  return (
    <svg
      viewBox={`0 0 ${cols * pixelSize} ${rows * pixelSize}`}
      width={cols * pixelSize}
      height={rows * pixelSize}
      shapeRendering="crispEdges"
    >
      {grid.map((row, y) =>
        row.split('').map((char, x) => {
          const fill = palette[char]
          if (!fill) return null
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}

interface AgentAvatarProps {
  /** sm = 32px chat bubble avatar, lg = 80px welcome screen */
  size?: 'sm' | 'lg'
  /** Optional color variant — default is amber/yellow, 'blue' for Pro outreach */
  variant?: 'default' | 'blue'
}

export function AgentAvatar({ size = 'sm', variant = 'default' }: AgentAvatarProps) {
  const palette = variant === 'blue' ? AGENT_BLUE_PALETTE : AGENT_PALETTE

  if (size === 'lg') {
    return (
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="scale-[1.1]">
          <PixelGrid grid={AGENT_GRID} palette={palette} pixelSize={4} />
        </div>
      </div>
    )
  }

  // sm — message avatar (32×32)
  return (
    <div
      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden"
      style={{ imageRendering: 'pixelated' }}
    >
      <div className="scale-[0.55] sm:scale-[0.6]">
        <PixelGrid grid={AGENT_GRID} palette={palette} pixelSize={4} />
      </div>
    </div>
  )
}

// Backward-compatible alias
export const BlitzAvatar = AgentAvatar
