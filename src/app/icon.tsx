import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#09090b',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          E
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
