import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Emailligence — Email AI Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // Load Inter font for crisp rendering
  const [interBold, interMedium] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf').then(
      (res) => res.arrayBuffer()
    ),
    fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI2fMZhrib2Bg-4.ttf').then(
      (res) => res.arrayBuffer()
    ),
  ])

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
          fontFamily: 'Inter',
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
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(63, 63, 70, 0.35) 0%, transparent 70%)',
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
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Brain icon as SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 3,
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase' as const,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 20,
              padding: '7px 18px',
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
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: 6,
              color: 'white',
              display: 'flex',
            }}
          >
            EMAILLIGENCE
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: 8,
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            Email AI Intelligence
          </div>
        </div>

        {/* Bottom-right: Dots / decorative element */}
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
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)', display: 'flex' }} />
          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.4)', display: 'flex' }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.6)', display: 'flex' }} />
        </div>

        {/* Bottom-left: domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 56,
            fontSize: 16,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.4)',
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
      fonts: [
        {
          name: 'Inter',
          data: interBold,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Inter',
          data: interMedium,
          style: 'normal',
          weight: 500,
        },
      ],
    }
  )
}
