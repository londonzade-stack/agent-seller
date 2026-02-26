'use client'

interface ShimmerTextProps {
  text: string
  className?: string
}

export function ShimmerText({ text, className = '' }: ShimmerTextProps) {
  return (
    <span className={`inline-flex ${className}`} aria-label={text}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="shimmer-char"
          style={{
            animationDelay: `${i * 60}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}
