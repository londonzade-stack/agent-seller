import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Emailligence - AI Email Agent'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(63, 63, 70, 0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top-left: Logo icon + badge */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
              <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
              <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
              <path d="M6 18a4 4 0 0 1-1.967-.516" />
              <path d="M19.967 17.484A4 4 0 0 1 18 18" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 3,
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase' as const,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: '6px 16px',
              display: 'flex',
            }}
          >
            Email Intelligence
          </div>
        </div>

        {/* Center: Big wordmark */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: 8,
              color: 'white',
              fontFamily: 'system-ui, sans-serif',
              display: 'flex',
            }}
          >
            EMAILLIGENCE
          </div>

          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              color: 'rgba(255, 255, 255, 0.35)',
              textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            Email AI Intelligence
          </div>
        </div>

        {/* Bottom-right: Dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', display: 'flex' }} />
          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', display: 'flex' }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.5)', display: 'flex' }} />
        </div>

        {/* Bottom-left: domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 56,
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: 1,
            display: 'flex',
          }}
        >
          emailligence.ai
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
