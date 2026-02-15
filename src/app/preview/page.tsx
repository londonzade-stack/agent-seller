'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { StyleAMinimal } from '@/components/dashboard/ui-variants/style-a-minimal'
import { StyleBRichCards } from '@/components/dashboard/ui-variants/style-b-rich-cards'
import { StyleCTerminal } from '@/components/dashboard/ui-variants/style-c-terminal'
import { StyleDGlassmorphism } from '@/components/dashboard/ui-variants/style-d-glassmorphism'
import { StyleECodexGlass } from '@/components/dashboard/ui-variants/style-e-codex-glass'

const STYLES = [
  { key: 'A', label: 'Style A - Minimal', component: StyleAMinimal },
  { key: 'B', label: 'Style B - Rich Cards', component: StyleBRichCards },
  { key: 'C', label: 'Style C - Terminal', component: StyleCTerminal },
  { key: 'D', label: 'Style D - Glassmorphism', component: StyleDGlassmorphism },
  { key: 'E', label: 'Style E - Codex Glass', component: StyleECodexGlass },
] as const

function PreviewContent() {
  const searchParams = useSearchParams()
  const queryStyle = searchParams.get('style')?.toUpperCase() ?? null
  const initialStyle = queryStyle && ['A', 'B', 'C', 'D', 'E'].includes(queryStyle) ? queryStyle : 'A'

  const [activeStyle, setActiveStyle] = useState<string>(initialStyle)

  // Sync with query param when it changes
  useEffect(() => {
    if (queryStyle && ['A', 'B', 'C', 'D', 'E'].includes(queryStyle)) {
      setActiveStyle(queryStyle)
    }
  }, [queryStyle])

  const ActiveComponent =
    STYLES.find((s) => s.key === activeStyle)?.component ?? StyleAMinimal

  return (
    <div className="flex flex-col h-screen">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-2 bg-gray-100 border-b border-gray-300 shrink-0 flex-wrap">
        {STYLES.map((style) => (
          <button
            key={style.key}
            onClick={() => setActiveStyle(style.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeStyle === style.key
                ? 'bg-white text-black shadow-sm border border-gray-300'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Active variant fills remaining viewport */}
      <div className="flex-1 min-h-0">
        <ActiveComponent />
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-zinc-500">Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  )
}
