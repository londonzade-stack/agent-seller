'use client'

import { useState, useEffect } from 'react'

// ─── Braille dot encoding ───────────────────────────────────────────
// Each braille char is a 2×4 grid. Dot positions:
//   1 4
//   2 5
//   3 6
//   7 8
// Dot values: d1=1, d2=2, d3=4, d4=8, d5=16, d6=32, d7=64, d8=128
// Char = String.fromCharCode(0x2800 + sum_of_dot_values)

function dots(...ds: number[]): string {
  const map = [1, 2, 4, 8, 16, 32, 64, 128]
  return String.fromCharCode(0x2800 + ds.reduce((s, d) => s + map[d - 1], 0))
}

function fromBits(bits: number): string {
  return String.fromCharCode(0x2800 + bits)
}

// ─── Spinner frame sequences ────────────────────────────────────────

const SPINNERS: { name: string; frames: string[]; speed: number }[] = [
  {
    name: 'Braille',
    speed: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
  {
    name: 'Orbit',
    speed: 100,
    frames: [
      dots(1), dots(4), dots(5), dots(6), dots(8), dots(7), dots(3), dots(2),
    ],
  },
  {
    name: 'Breathe',
    speed: 120,
    frames: [
      fromBits(0),
      dots(2, 5),
      dots(1, 2, 4, 5),
      dots(1, 2, 3, 4, 5, 6),
      dots(1, 2, 3, 4, 5, 6, 7, 8),
      dots(1, 2, 3, 4, 5, 6),
      dots(1, 2, 4, 5),
      dots(2, 5),
      fromBits(0),
    ],
  },
  {
    name: 'Snake',
    speed: 80,
    frames: [
      dots(1), dots(1, 2), dots(1, 2, 3), dots(2, 3, 7),
      dots(3, 7, 8), dots(7, 8, 6), dots(8, 6, 5), dots(6, 5, 4),
      dots(5, 4, 1), dots(4, 1, 2),
    ],
  },
  {
    name: 'Fill Sweep',
    speed: 100,
    frames: [
      fromBits(0),
      dots(1), dots(1, 2), dots(1, 2, 3), dots(1, 2, 3, 7),
      dots(1, 2, 3, 7, 4), dots(1, 2, 3, 7, 4, 5),
      dots(1, 2, 3, 7, 4, 5, 6), dots(1, 2, 3, 4, 5, 6, 7, 8),
      dots(2, 3, 4, 5, 6, 7, 8), dots(3, 4, 5, 6, 7, 8),
      dots(4, 5, 6, 7, 8), dots(5, 6, 7, 8),
      dots(6, 7, 8), dots(7, 8), dots(8),
      fromBits(0),
    ],
  },
  {
    name: 'Pulse',
    speed: 140,
    frames: [
      fromBits(0),
      dots(2, 5),
      dots(1, 3, 4, 6),
      dots(7, 8),
      dots(1, 3, 4, 6),
      dots(2, 5),
      fromBits(0),
    ],
  },
  {
    name: 'Columns',
    speed: 100,
    frames: [
      dots(1, 2, 3, 7),
      dots(1, 2, 3, 4, 5, 6, 7),
      dots(4, 5, 6, 8),
      dots(1, 2, 3, 4, 5, 6, 7, 8),
      dots(1, 2, 3, 7),
      fromBits(0),
    ],
  },
  {
    name: 'Checkerboard',
    speed: 200,
    frames: [
      dots(1, 3, 5, 8),
      dots(2, 4, 6, 7),
    ],
  },
  {
    name: 'Scan',
    speed: 120,
    frames: [
      dots(1, 4),
      dots(2, 5),
      dots(3, 6),
      dots(7, 8),
      dots(3, 6),
      dots(2, 5),
    ],
  },
  {
    name: 'Rain',
    speed: 100,
    frames: [
      dots(1, 4),
      dots(2, 5),
      dots(3, 6),
      dots(7, 8),
      fromBits(0),
      dots(1, 5),
      dots(2, 6),
      dots(3, 8),
      dots(7),
      fromBits(0),
    ],
  },
  {
    name: 'Cascade',
    speed: 90,
    frames: [
      dots(1),
      dots(2, 4),
      dots(3, 5, 1),
      dots(7, 6, 2, 4),
      dots(8, 3, 5),
      dots(7, 6),
      dots(8),
      fromBits(0),
    ],
  },
  {
    name: 'Sparkle',
    speed: 70,
    frames: [
      dots(1, 6),
      dots(3, 4, 8),
      dots(2, 5, 7),
      dots(1, 6, 3),
      dots(4, 7, 2),
      dots(5, 8, 1),
      dots(3, 6, 4),
      dots(7, 2, 8),
    ],
  },
  {
    name: 'Wave Rows',
    speed: 100,
    frames: [
      dots(1, 4),
      dots(1, 2, 4, 5),
      dots(2, 3, 5, 6),
      dots(3, 6, 7, 8),
      dots(7, 8),
      dots(3, 6, 7, 8),
      dots(2, 3, 5, 6),
      dots(1, 2, 4, 5),
    ],
  },
  {
    name: 'Helix',
    speed: 90,
    frames: [
      dots(1, 4),
      dots(2, 4),
      dots(3, 5),
      dots(7, 6),
      dots(8, 6),
      dots(8, 3),
      dots(7, 2),
      dots(1, 5),
      dots(4, 2),
      dots(5, 3),
      dots(6, 7),
      dots(6, 8),
    ],
  },
  {
    name: 'Diagonal Swipe',
    speed: 80,
    frames: [
      fromBits(0),
      dots(1),
      dots(2, 4),
      dots(3, 5, 1),
      dots(7, 6, 2, 4),
      dots(8, 3, 5),
      dots(7, 6),
      dots(8),
      dots(1, 2, 3, 4, 5, 6, 7, 8),
      dots(2, 3, 5, 6, 7, 8),
      dots(3, 6, 7, 8),
      dots(7, 8),
      dots(8),
      fromBits(0),
    ],
  },
]

// ─── Animated spinner component ─────────────────────────────────────

function BrailleSpinner({
  frames,
  speed,
  dark,
}: {
  frames: string[]
  speed: number
  dark: boolean
}) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % frames.length), speed)
    return () => clearInterval(id)
  }, [frames, speed])

  return (
    <span
      className="font-mono select-none inline-block w-[2ch] text-center"
      style={{
        fontSize: '1.5rem',
        color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
      }}
    >
      {frames[idx]}
    </span>
  )
}

// ─── Row component ──────────────────────────────────────────────────

function SpinnerRow({
  name,
  frames,
  speed,
  dark,
}: {
  name: string
  frames: string[]
  speed: number
  dark: boolean
}) {
  return (
    <div
      className="flex items-center gap-5 px-6 py-3 transition-colors"
      style={{
        borderBottom: dark
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <BrailleSpinner frames={frames} speed={speed} dark={dark} />
      <span
        className="text-sm tracking-wide"
        style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}
      >
        Agent
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: dark ? '#fff' : '#1a1a1a' }}
      >
        {name}
      </span>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────

export default function BraillePage() {
  return (
    <div className="min-h-screen flex items-start justify-center gap-8 p-8 pt-12 bg-neutral-900">
      {/* Dark panel */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#111111',
          width: 380,
        }}
      >
        <div className="px-6 py-4 border-b border-white/10">
          <span className="text-xs font-medium tracking-widest text-white/30 uppercase">
            Dark Theme
          </span>
        </div>
        {SPINNERS.map((s) => (
          <SpinnerRow
            key={s.name}
            name={s.name}
            frames={s.frames}
            speed={s.speed}
            dark={true}
          />
        ))}
      </div>

      {/* Light panel */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#ffffff',
          width: 380,
        }}
      >
        <div className="px-6 py-4 border-b border-black/10">
          <span className="text-xs font-medium tracking-widest text-black/30 uppercase">
            Light Theme
          </span>
        </div>
        {SPINNERS.map((s) => (
          <SpinnerRow
            key={s.name}
            name={s.name}
            frames={s.frames}
            speed={s.speed}
            dark={false}
          />
        ))}
      </div>
    </div>
  )
}
