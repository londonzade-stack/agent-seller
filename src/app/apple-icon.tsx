import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#09090b',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontSize: 110,
            fontWeight: 800,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1,
            letterSpacing: '-0.03em',
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
