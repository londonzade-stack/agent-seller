'use client'

interface ShimmerTextProps {
  text: string
  className?: string
}

export function ShimmerText({ text, className = '' }: ShimmerTextProps) {
  return (
    <span className={`shimmer-text ${className}`} aria-label={text}>
      {text}
    </span>
  )
}
