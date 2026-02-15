'use client'

import { useState } from 'react'

// ─── Pixel art renderer ──────────────────────────────────────────────────────
// Each character is a grid of characters. Each character maps to a color.

function PixelGrid({
  grid,
  palette,
  pixelSize = 6,
}: {
  grid: string[]
  palette: Record<string, string>
  pixelSize?: number
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

// ─── 1. BOLT — Chunky Pixel Robot ────────────────────────────────────────────
const boltGrid = [
  '........YYY........',
  '.......YYYYY.......',
  '......YYYYYYY......',
  '....aaaaaaaaaaaa...',
  '...aaaBBBBBBBaaa...',
  '...aaBBBBBBBBBaa...',
  '...aaBWWBBBWWBaa...',
  '...aaBWKBBBWKBaa...',
  '...aaBBBBBBBBBaa...',
  '...aaBBBMMMBBBaa...',
  '...aaBBBBBBBBBaa...',
  '...aaaaaaaaaaaaa....',
  '..BaBBBBBBBBBBBaB..',
  '..BaBBBYYYBBBBBaB..',
  '..BaBBBBYBBBBBBaB..',
  '..BaBBBYYYBBBBBaB..',
  '..BaBBBBBBBBBBBaB..',
  '..BaBBBBBBBBBBBaB..',
  '...aaBBBBBBBBBaa....',
  '...aaBBBaBBBBaa.....',
  '...aaBBBaBBBBaa.....',
  '..aaaBBBaaaBBBaaa...',
]
const boltPalette: Record<string, string> = {
  B: '#3B82F6', a: '#1E40AF', Y: '#FBBF24', W: '#FFFFFF',
  K: '#0F172A', M: '#0F172A', '.': '',
}

// ─── 2. PIXEL — Pixel Cat on Mailbox ─────────────────────────────────────────
const pixelCatGrid = [
  '...OO...........OO...',
  '..OOO...........OOO..',
  '..OiOaaaaaaaaaaaOiO..',
  '..OOOOOOOOOOOOOOOOO..',
  '..OOWWOOOOOOOOWWOOO..',
  '..OOWKOOOOOOOOWKOoo..',
  '..OOOOOOOrOOOOOOOoo..',
  '..OOOOOOOOOOOOOOOoo..',
  '...OOOOOOOOOOOOOOO...',
  '...OOOssOOOOOssOOO...',
  '..OOOOOOOOOOOOOOOOo..',
  '..OOOOOOOOOOOOOOOOo..',
  '..OOOOOOOOOOOOOOOOo..',
  '...OOOOOOOOOOOOOOOO...',
  '....OOOO....OOOOt.....',
  '....OOOO....OOOOtt....',
  '....aaaa....aaaatttt...',
]
const pixelCatPalette: Record<string, string> = {
  O: '#FF8C42', a: '#CC6B20', i: '#FFB88C', s: '#E07030',
  W: '#FFFFFF', K: '#1a1a1a', r: '#FF6B6B', o: '#E07030',
  t: '#FF8C42', '.': '',
}

// ─── 3. NAVI — Pixel Owl with Compass ────────────────────────────────────────
const naviGrid = [
  '..DD...........DD...',
  '.DDD...........DDD..',
  '.DDDDaaaaaaaaDDDDa..',
  '..aDDDDDDDDDDDDDa...',
  '..aDDDDDDDDDDDDDa...',
  '..aDDWWWDDDWWWDDa...',
  '..aDWKKKDDDKKKWDa...',
  '..aDDWWWDDDWWWDDa...',
  '..aDDDDDYYYDDDDDa...',
  '..aDDDDDDDDDDDDDa...',
  '..EaDDDDDDDDDDDaE...',
  '..EaDDDDDDDDDDDaE...',
  '..EaDDDWWWWWDDDaE...',
  '...aDDWWRRWWDDDa....',
  '...aDDWWccWWDDDa....',
  '...aDDDWWWWDDDDa....',
  '....aDDDDDDDDDa.....',
  '.....aYYYaYYYa......',
  '....aYYYYaYYYYa.....',
]
const naviPalette: Record<string, string> = {
  D: '#D4A843', a: '#8B6914', W: '#FFFFFF', K: '#1a1a1a',
  Y: '#E8A020', R: '#E53E3E', c: '#CBD5E0', E: '#6B5030',
  '.': '',
}

// ─── 4. ZIPPY — Pixel Paper Fox ──────────────────────────────────────────────
const zippyGrid = [
  '..FF.............FF..',
  '.FOOF...........FOOF.',
  '.FOOOF.........FOOOF.',
  '..FOOOFaaaaaFOOOF...',
  '...FOOOOOOOOOOOF....',
  '...FOOWWOOOOWWOF....',
  '...FOOWKOOOOWKoF....',
  '...FOOOOOOrOOOOF....',
  '...FOOOOOOOOOOOOF...',
  '....FOOOOOOOOOOF....',
  '...FOOOOOOOOOOOOF...',
  '..FOOOOOOOOOOOOOFsss',
  '..FOOOOOOOOOOOOOFss.',
  '...FOOOOOOOOOOOOOF...',
  '...FOOOOOOOOOOOOOF...',
  '....FOOF....FOOF.....',
  '....FFFF....FFFF.....',
]
const zippyPalette: Record<string, string> = {
  O: '#FF6B35', F: '#CC5528', a: '#CC5528', W: '#FFFFFF',
  K: '#1a1a1a', r: '#992200', o: '#1a1a1a', s: '#FBBF24',
  '.': '',
}

// ─── 5. ECHO — Pixel Ghost ──────────────────────────────────────────────────
const echoGrid = [
  '......aaaaaa.......',
  '....aaWWWWWWaa.....',
  '...aWWWWWWWWWWa....',
  '..aWWWWWWWWWWWWa...',
  '..aWWKKKWWWKKKWa...',
  '..aWWKwKWWWKwKWa...',
  '..aWWKKKWWWKKKWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWpWpWpWWWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWaWWaWWaWWaWa...',
  '...a..a..a..a..a...',
]
const echoPalette: Record<string, string> = {
  W: '#F5F0FF', a: '#D8D0E8', K: '#1a1a1a', w: '#FFFFFF',
  p: '#7C3AED', '.': '',
}

// ─── 6. CHIP — Pixel Circuit Hamster ────────────────────────────────────────
const chipGrid = [
  '..PPP.........PPP..',
  '.PiiPa.......aPiiP.',
  '.PiiPa.......aPiiP.',
  '..aBBBaaaaaaBBBa...',
  '..aBBBBBBBBBBBBa...',
  '..aBBTTBBBBBTTBa...',
  '..aBBLLBBBBBLLBa...',
  '..aBBBBBBBBBBBBa...',
  '..aBBBBBBrBBBBBa...',
  '...aBBBBBBBBBBa....',
  '..aaBBBBBBBBBBaa...',
  '.aaBBBBBBBBBBBBaa..',
  '.aaBBGGlGGlBBBBaa..',
  '.aaBBBGGGGGBBBBaa..',
  '.aaBBBBGGGBBBBBaa..',
  '..aaBBBBBBBBBBaa...',
  '...aaBBBa.aBBBa....',
  '....aaaa...aaaa.....',
]
const chipPalette: Record<string, string> = {
  B: '#C4956A', a: '#8B6914', P: '#FFB8B8', i: '#FF9090',
  T: '#E8C9A0', L: '#E8C9A0', W: '#FFFFFF',
  K: '#1a1a1a', r: '#FF8C8C', G: '#22C55E', l: '#16A34A',
  '.': '',
}

// ─── 7. SCOUT — Pixel Dog with Goggles ──────────────────────────────────────
const scoutGrid = [
  '.EEE...........EEE.',
  '.EEEE.........EEEE.',
  '.EEEEa.......aEEEE.',
  '..aDBBBaaaaaBBBDa..',
  '..aDDGGGGGGGGGDDa..',
  '..aDDGGGgGgGGGDDa..',
  '..aDDGGGGGGGGGDDa..',
  '..aDDDDDDKDDDDDDa..',
  '..aDDDDmmmDDDDDDa..',
  '...aDDDDDDDDDDDa....',
  '..aaRRRDDDDDDDDaa...',
  '.aaDDDDDDDDDDDDDaa..',
  '.aaDDDDDDDDDDDDDaa..',
  '..aaDDDDDDDDDDDaa...',
  '...aaDDDa.aDDDaa....',
  '....aaaa...aaaa.....',
]
const scoutPalette: Record<string, string> = {
  D: '#A0784C', a: '#6B5030', E: '#D4B896', G: '#2D3748',
  g: '#4A6A8A', K: '#1a1a1a', m: '#FF8C8C', R: '#E53E3E',
  '.': '',
}

// ─── 8. DASH — Pixel Rocket Penguin ─────────────────────────────────────────
const dashGrid = [
  '.......YYY.........',
  '......YYYYY........',
  '.....aaNNNaa.......',
  '....aNNNNNNNa......',
  '....aNNWWWNNa......',
  '....aNWWKWWNa......',
  '....aNWKWKWNa......',
  '....aNWWWWWNa......',
  '....aNNYYYNNa......',
  '...NaNNNNNNNaN.GGG.',
  '..NNaNNWWWNNaNNGaG.',
  '..NNaWWWWWWWaNNGaG.',
  '..NNaWWWWWWWaNNGaG.',
  '...NaWWWWWWWaN.GGG.',
  '....aWWWWWWWa......',
  '....aNNWWWNNa......',
  '.....aYYaYYa.......',
  '....YYYYaYYYY......',
  '..........YYYY.....',
  '...........YFY.....',
]
const dashPalette: Record<string, string> = {
  N: '#1a1a1a', a: '#2D3748', W: '#FFFFFF', K: '#1a1a1a',
  Y: '#F97316', G: '#718096', F: '#FBBF24', '.': '',
}

// ─── 9. GLYPH — Pixel Stone Golem ──────────────────────────────────────────
const glyphGrid = [
  '.....aaSSSSSaa.....',
  '....aSSSSSSSSa.....',
  '...aSSSSSSSSSSSa...',
  '...aSSCCSSSSCCSa...',
  '...aSSCCSSSSCCSa...',
  '...aSSSSSCSCSSSa...',
  '...aSSSSSSSSSSSa...',
  '....aSSSSSSSSSSa...',
  '...aaSSSSSSSSSSSaa..',
  '..aaSSSSSSSSSSSSSSaa',
  '..aaSSSCSSSCSSSSSaa.',
  '..aaSSSCCCCSSSSSaa..',
  '..aaSSSSCSCSSSSaa...',
  '...aaSSSSSSSSSSaa...',
  '....aaSSSSSSSaa.....',
  '.....aaSSSSSaa......',
  '....aSSa..aSSa......',
  '...aaSSSa.aaSSSa....',
]
const glyphPalette: Record<string, string> = {
  S: '#D1D5DB', a: '#9CA3AF', C: '#22D3EE', '.': '',
}

// ─── 10. PRISM — Pixel Crystal Fox ──────────────────────────────────────────
const prismGrid = [
  '..PP...............PP.',
  '.PLP...............PLP',
  '.PLLP.............PLLP',
  '..PLLPaaaaaaaaaPLLP...',
  '...PLLLLLLLLLLLLP.....',
  '...PLLWWLLLLLWWLP.....',
  '...PLLWKLLLLLWKLPa....',
  '...PLLLLLLvLLLLLP.....',
  '...PLLLLLLLLLLLLPa....',
  '....PLLLLLLLLLLPa.....',
  '...PPLLLLLLLLLLLPPa...',
  '..PLLLLLLLLLLLLLLLPa..',
  '..PLLLLLLLLLLLLLLLPa..',
  '...PLLLLLLLLLLLLLPa...',
  '...PLLLLLLLLLLLLPa....',
  '....PLLPa...aPLLPa....',
  '....PPPa.....aPPPa....',
]
const prismPalette: Record<string, string> = {
  L: '#A78BFA', P: '#7C3AED', a: '#5B21B6', W: '#FFFFFF',
  K: '#1a1a1a', v: '#F472B6', '.': '',
}

// ─── 11. EMBER — Pixel Fire Spirit ──────────────────────────────────────────
const emberGrid = [
  '......RRRR........',
  '.....RYYYYR.......',
  '....RYYYYYYR......',
  '...RYYYYYYYYY.....',
  '...RYYWWYYWWY.....',
  '...RYYWKYWWKY.....',
  '...RYYYYYYYYYR....',
  '...RYYYRRRYYY.....',
  '....RYYYYYYY......',
  '...RRYYYYYYYYRR...',
  '..RRRYYYYYYYRRR...',
  '..RRRYYYYYYYYRR...',
  '..RRRYYYYYYYRRR...',
  '...RRYYYYYYYRRR...',
  '....RRYYYYYRR.....',
  '.....RRYYRR.......',
  '......RRR.........',
]
const emberPalette: Record<string, string> = {
  Y: '#FBBF24', R: '#EF4444', W: '#FFFFFF', K: '#1a1a1a',
  '.': '',
}

// ─── 12. CAMO — Pixel Chameleon ─────────────────────────────────────────────
const camoGrid = [
  '..........GGGGG.....',
  '.........GGGGGGG....',
  '........GGGGGGGG....',
  '.aaGGGGGGGGGGGGa...',
  '.aGGGGGGGGGGGGGa...',
  '.aGGWWGGGGGWWGGa...',
  '.aGGWKGGGGGWKGGa...',
  '.aGGGGGGGGGGGGGa...',
  '.aGGGGGGGGGGGGGa...',
  '..aGGGGGGGGGGGa....',
  '..aGGGGGGGGGGGGa...',
  '..aGGGlGGlGGGGGa...',
  '..aGGGGGGGGGGGGa...',
  '..aGGGGGGGGGGGGa...',
  '...aGGGa..aGGGa....',
  '...aaGGa..aGGaa....',
  '....aaa....aaa......',
]
const camoPalette: Record<string, string> = {
  G: '#4ADE80', a: '#166534', l: '#15803D', W: '#FFFFFF',
  K: '#1a1a1a', '.': '',
}

// ─── 13. TUSK — Pixel Walrus ────────────────────────────────────────────────
const tuskGrid = [
  '......aaaaaaa......',
  '....aaBBBBBBBaa....',
  '...aBBBBBBBBBBBa...',
  '..aBBBBBBBBBBBBBa..',
  '..aBBWWBBBBBWWBBa..',
  '..aBBWKBBBBBWKBBa..',
  '..aBBBBBBBBBBBBBa..',
  '..aBBBBBnBnBBBBBa..',
  '..aBBBWBBBBBWBBBa..',
  '..aBBBWBBBBBWBBBa..',
  '...aBBWBBBBBWBBa...',
  '...aBBBBBBBBBBBa...',
  '..aaBBBBBBBBBBBaa..',
  '.aaBBBBBBBBBBBBBaa.',
  '..aaBBBBBBBBBBBaa..',
  '...aaBBBa.aBBBaa...',
  '....aaaa...aaaa....',
]
const tuskPalette: Record<string, string> = {
  B: '#94A3B8', a: '#64748B', W: '#FFFFFF', K: '#1a1a1a',
  n: '#CBD5E1', '.': '',
}

// ─── 14. FLICK — Pixel Hummingbird ──────────────────────────────────────────
const flickGrid = [
  '.......aaa.........',
  '......aTTTa........',
  '.....aTTTTTa.......',
  '....aTTTTTTTa......',
  '....aTWWTTWWa......',
  '....aTWKTTWKa......',
  '....aTTTTTTTaYYYY..',
  '....aTTTTTTTaYYYYY.',
  '...GaTTTTTTTaYYYY..',
  '..GGaTTTTTTTa......',
  '.GGGaTTTTTTTa......',
  '..GGaTTGGGTTa......',
  '...GaTTTTTTTa......',
  '....aTTTTTTa.......',
  '.....aTTaTTa.......',
  '.....aaaaaaa.......',
]
const flickPalette: Record<string, string> = {
  T: '#06B6D4', a: '#0891B2', G: '#10B981', W: '#FFFFFF',
  K: '#1a1a1a', Y: '#FBBF24', '.': '',
}

// ─── 15. ONYX — Pixel Panther ───────────────────────────────────────────────
const onyxGrid = [
  '..NN...........NN..',
  '.NNN...........NNN.',
  '.NNNNaaaaaaaaaNNNN.',
  '..aNNNNNNNNNNNNNa..',
  '..aNNYYNNNNNYYNNa..',
  '..aNNYKNNNNNYKNNa..',
  '..aNNNNNNrNNNNNNa..',
  '..aNNNNNNNNNNNNNa..',
  '...aNNNNNNNNNNNa...',
  '..aaNNNNNNNNNNNaa..',
  '.aaNNNNNNNNNNNNNaa.',
  '.aaNNNNNNNNNNNNNaa.',
  '.aaNNNNNNNNNNNNNaa.',
  '..aaNNNNNNNNNNNaa..',
  '...aNNNa...aNNNa...',
  '...aaaa.....aaaa..tt',
  '.................ttt',
  '..................tt',
]
const onyxPalette: Record<string, string> = {
  N: '#27272A', a: '#18181B', Y: '#FBBF24', K: '#1a1a1a',
  r: '#F472B6', t: '#27272A', '.': '',
}

// ─── 16. CORAL — Pixel Seahorse ─────────────────────────────────────────────
const coralGrid = [
  '.....aaaCCCaa......',
  '....aCCCCCCCCa.....',
  '...aCCCCCCCCCCa....',
  '...aCCWWCCCWWCa....',
  '...aCCWKCCCWKCa....',
  '...aCCCCCCCCCCa....',
  '...aCCCCmCCCCCa....',
  '....aCCCCCCCCa.....',
  '....aCCCCCCCa......',
  '...aaCCCCCCa.......',
  '..aaCCCCCCa........',
  '..aaCCCCCa.........',
  '...aaCCCCa.........',
  '....aaCCCCa........',
  '.....aaCCCCa.......',
  '......aaCCa........',
  '.......aaaa........',
]
const coralPalette: Record<string, string> = {
  C: '#FB7185', a: '#E11D48', W: '#FFFFFF', K: '#1a1a1a',
  m: '#FCA5A5', '.': '',
}

// ─── 17. DUNE — Pixel Cactus ────────────────────────────────────────────────
const duneGrid = [
  '......aGGGa........',
  '.....aGGGGGa.......',
  '.....aGGGGGa.......',
  '.....aGWGWGa.......',
  '.....aGKGKGa.......',
  '.....aGGGGGa.......',
  '.....aGGmGGa.......',
  '..GGGaGGGGGa.......',
  '.GGGGaGGGGGaGGG...',
  '.GGGGaGGGGGaGGGG..',
  '..GGGaGGGGGaGGGG..',
  '..aaaaGGGGGaaaa....',
  '.....aGGGGGa.......',
  '.....aGGGGGa.......',
  '.....aGGGGGa.......',
  '....aaGGGGGaa......',
  '...aYYYYYYYYYa.....',
  '..aaYYYYYYYYYaa....',
]
const dunePalette: Record<string, string> = {
  G: '#4ADE80', a: '#166534', W: '#FFFFFF', K: '#1a1a1a',
  m: '#FB7185', Y: '#D4A843', '.': '',
}

// ─── 18. FLUX — Pixel Jellyfish ─────────────────────────────────────────────
const fluxGrid = [
  '.....aaaaaaa.......',
  '....aJJJJJJJa......',
  '...aJJJJJJJJJa.....',
  '..aJJJJJJJJJJJa....',
  '..aJJWWJJJWWJJa....',
  '..aJJWKJJJWKJJa....',
  '..aJJJJJJJJJJJa....',
  '..aJJJJJJJJJJJa....',
  '...aJJJJJJJJJa.....',
  '....aJJJJJJJa......',
  '...aJaJaJaJaJa.....',
  '..aJ.aJ.aJ.aJa....',
  '.aJ..aJ..aJ..aJ...',
  '..J..aJ..aJ..aJ...',
  '.....a....a...a....',
]
const fluxPalette: Record<string, string> = {
  J: '#C084FC', a: '#9333EA', W: '#FFFFFF', K: '#1a1a1a',
  '.': '',
}

// ─── 19. RUNE — Pixel Wizard ────────────────────────────────────────────────
const runeGrid = [
  '......aPPPPa.......',
  '.....aPPPPPPa......',
  '....aPPPPPPPPa.....',
  '...aPPPPPPPPPPa....',
  '..aPPPPPPYPPPPPa...',
  '...aaBBBBBBBaa.....',
  '...aBBBBBBBBBa.....',
  '...aBBWWBBWWBa.....',
  '...aBBWKBBWKBa.....',
  '...aBBBBBBBBBa.....',
  '...aBBBBmBBBBa.....',
  '..RaBBBBBBBBBaR....',
  '..RRaBBBBBBBaRR....',
  '...RaBPPPPPBaR.....',
  '....aBBBBBBBa......',
  '....aBBBaBBBa......',
  '....aaaa.aaaa......',
]
const runePalette: Record<string, string> = {
  P: '#6366F1', a: '#3730A3', B: '#818CF8', W: '#FFFFFF',
  K: '#1a1a1a', Y: '#FBBF24', m: '#1a1a1a', R: '#6366F1',
  '.': '',
}

// ─── 20. LINK — Pixel Chain Dog ─────────────────────────────────────────────
const linkGrid = [
  '.EEE...........EEE.',
  '.EEEE.........EEEE.',
  '..aLLLaaaaaLLLLa...',
  '..aLLLLLLLLLLLLa...',
  '..aLLWWLLLLWWLLa...',
  '..aLLWKLLLLWKLLa...',
  '..aLLLLLLKLLLLLa...',
  '..aLLLLmmmLLLLLa...',
  '...aLLLLLLLLLLa....',
  '..aaLLLLLLLLLLaa...',
  '.aaLLCCLCCLLLLLaa..',
  '.aaLLCCLCCLLLLLaa..',
  '..aaLLLLLLLLLLaa...',
  '...aaLLLa.aLLLaa...',
  '....aaaa...aaaa....',
]
const linkPalette: Record<string, string> = {
  L: '#60A5FA', a: '#1D4ED8', E: '#93C5FD', W: '#FFFFFF',
  K: '#1a1a1a', m: '#FF8C8C', C: '#FBBF24', '.': '',
}

// ─── 21. VOLT — Pixel Electric Eel ──────────────────────────────────────────
const voltGrid = [
  '..aaEEEEEa............',
  '.aEEEEEEEEa...........',
  'aEEWWEEWWEEa..........',
  'aEEWKEEWKEEEa.........',
  'aEEEEEEEEEEEEa........',
  '.aEEEEYEEEEEEEa.......',
  '..aEEEEEEEEEEEEa......',
  '...aEEEEEEEEEEEEa.....',
  '....aEEYEEEEEEEEEa....',
  '.....aEEEEEEEEEEEEa...',
  '......aEEEEEYEEEEEEa..',
  '.......aEEEEEEEEEEEEa.',
  '........aEEEEEEEEEEa..',
  '.........aaEEYEEEaa....',
  '...........aaaaaa......',
]
const voltPalette: Record<string, string> = {
  E: '#3B82F6', a: '#1E40AF', W: '#FFFFFF', K: '#1a1a1a',
  Y: '#FBBF24', '.': '',
}

// ─── 22. SAGE — Pixel Tortoise ──────────────────────────────────────────────
const sageGrid = [
  '........aaaaaaa.......',
  '.......aSSSSSSSa......',
  '......aSSGGGGSSa......',
  '.....aSSGGGGGGSSa.....',
  '....aSSGGGGGGGGSSa....',
  '....aSSGGGGGGGGSSa....',
  '.....aSSSSSSSSSSSa.....',
  '..aaaBBSSSSSSSSBBaaa..',
  '.aBBBBBSSSSSSSBBBBBa..',
  '.aBBWWBBSSSSSSBBWWBa..',
  '.aBBWKBBBBBBBBBBWKBa..',
  '.aBBBBBBBBBBBBBBBBBa..',
  '..aBBBBBBBrBBBBBBBa...',
  '...aaBBBBBBBBBBBaa....',
  '...aBBa.......aBBa....',
  '..aaaa.........aaaa...',
]
const sagePalette: Record<string, string> = {
  S: '#65A30D', G: '#4D7C0F', a: '#365314', B: '#A3A389',
  W: '#FFFFFF', K: '#1a1a1a', r: '#1a1a1a', '.': '',
}

// ─── 23. MIKO — Pixel Kitsune ───────────────────────────────────────────────
const mikoGrid = [
  '..WW...........WW..',
  '.WWW...........WWW.',
  '.WWRRaaaaaaaaRRWW..',
  '..aRRRRRRRRRRRRa...',
  '..aRRWWRRRRWWRRa...',
  '..aRRWKRRRRWKRRa...',
  '..aRRRRRRKRRRRRa...',
  '..aRRRRRRRRRRRRa...',
  '...aRRRRRRRRRRa....',
  '..aaRRRRRRRRRRaa...',
  '.aaRRRRRRRRRRRRaa..',
  '.aaRRRRRRRRRRRRaa..',
  '..aaRRRRRRRRRRaa...',
  '...aaRRRa.aRRRa..tt',
  '....aaaa...aaaa.ttt.',
  '................tttt',
  '.................ttt',
]
const mikoPalette: Record<string, string> = {
  R: '#EF4444', a: '#991B1B', W: '#FFFFFF', K: '#1a1a1a',
  t: '#EF4444', '.': '',
}

// ─── 24. BYTE — Pixel Floppy Disk ──────────────────────────────────────────
const byteGrid = [
  '..aaaaaaaaaaaaaaa...',
  '..aBBBBBBBBBBBBBa...',
  '..aBBDDDDDDDDBBBa...',
  '..aBBDDDDDDDDBBBa...',
  '..aBBDDDDDDDDBBBa...',
  '..aBBDDDDDDDDBBBa...',
  '..aBBBBBBBBBBBBBa...',
  '..aBBBBBBBBBBBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aBBWWWWWWWWBBBa...',
  '..aaaaaaaaaaaaaaa...',
  '......WWWKWW........',
  '.......KWWK.........',
]
const bytePalette: Record<string, string> = {
  B: '#3B82F6', a: '#1E40AF', D: '#1E3A5F', W: '#FFFFFF',
  K: '#1a1a1a', '.': '',
}

// ─── 25. NOVA — Pixel Star ──────────────────────────────────────────────────
const novaGrid = [
  '........YY.........',
  '........YY.........',
  '.......YYYY........',
  '......YYYYYY.......',
  '.YYYYYYYYYYYYYY....',
  '..YYYYYYYYYYYYYY...',
  '...YYWWYYWWYYYY....',
  '....YWKYYYKYYY.....',
  '....YYYYYYYYYY.....',
  '....YYYYmYYYYY.....',
  '...YYYYYYYYYYYY....',
  '..YYYYYYYYYYYYYY...',
  '.YYYY..YYYY..YYYY..',
  '..YY....YY....YY...',
  '........YY.........',
  '.......YYYY........',
]
const novaPalette: Record<string, string> = {
  Y: '#FBBF24', W: '#FFFFFF', K: '#1a1a1a', m: '#F97316',
  '.': '',
}

// ─── 26. IRIS — Pixel Butterfly ─────────────────────────────────────────────
const irisGrid = [
  '..PPP.......PPP....',
  '.PPPPP.....PPPPP...',
  'PPiiPPP...PPPiiPP..',
  'PPiPPPP...PPPPiPP..',
  'PPPPPPP...PPPPPPP..',
  '.PPPPP.aaa.PPPPP...',
  '..PPP.aaBaa.PPP....',
  '......aBBBa........',
  '.....aBBWWBa.......',
  '.....aBBWKBa.......',
  '.....aBBBBBa.......',
  '......aBBBa........',
  '......aBBBa........',
  '.......aaa.........',
]
const irisPalette: Record<string, string> = {
  P: '#E879F9', i: '#F0ABFC', a: '#1a1a1a', B: '#374151',
  W: '#FFFFFF', K: '#1a1a1a', '.': '',
}

// ─── 27. GRIM — Pixel Skull Bot ─────────────────────────────────────────────
const grimGrid = [
  '.....aaaaaaaa......',
  '....aWWWWWWWWa.....',
  '...aWWWWWWWWWWa....',
  '..aWWWWWWWWWWWWa...',
  '..aWWKKKWWKKKWWa...',
  '..aWWKRKWWKRKWWa...',
  '..aWWKKKWWKKKWWa...',
  '..aWWWWWWWWWWWWa...',
  '..aWWWWKWKWWWWWa...',
  '..aWWWKWKWKWWWWa...',
  '...aWWWWWWWWWWa....',
  '..aaDDDDDDDDDDaa...',
  '.aaDDDDDDDDDDDDaa..',
  '.aaDDDDDDDDDDDDaa..',
  '..aaDDDDDDDDDDaa...',
  '...aaDDDa.aDDDaa...',
  '....aaaa...aaaa....',
]
const grimPalette: Record<string, string> = {
  W: '#E4E4E7', a: '#71717A', K: '#18181B', R: '#EF4444',
  D: '#3F3F46', '.': '',
}

// ─── 28. PUFF — Pixel Cloud ─────────────────────────────────────────────────
const puffGrid = [
  '.........aaa.........',
  '........aWWWa........',
  '.....aaaWWWWWaaa.....',
  '....aWWWWWWWWWWWa....',
  '...aWWWWWWWWWWWWWa...',
  '..aWWWWWWWWWWWWWWWa..',
  '..aWWWKKWWWWWKKWWWa..',
  '..aWWWKKWWWWWKKWWWa..',
  '..aWWWWWWWWWWWWWWWa..',
  '..aWWWWWWWmWWWWWWWa..',
  '..aWWWWWpppppWWWWWa..',
  '...aWWWWWWWWWWWWWa...',
  '....aWWWWWWWWWWWa....',
  '.....aaaaaaaaaaaaa....',
]
const puffPalette: Record<string, string> = {
  W: '#E0F2FE', a: '#7DD3FC', K: '#1a1a1a', m: '#F472B6',
  p: '#F9A8D4', '.': '',
}

// ─── 29. THORN — Pixel Hedgehog ────────────────────────────────────────────
const thornGrid = [
  '...aaaDaDaDaaa.....',
  '..aDaDaDaDaDaDa....',
  '..aDaBBBBBBBaDa....',
  '.aDaBBBBBBBBBaDa...',
  '.aDaBBWWBBWWBaDa...',
  '.aDaBBWKBBWKBaDa...',
  '.aDaBBBBBBBBBaDa...',
  '.aDaBBBBrBBBBaDa...',
  '..aDaBBmmmBBaDa....',
  '...aaBBBBBBBaa.....',
  '..aaBBBBBBBBBaa....',
  '..aaBBBBBBBBBaa....',
  '...aaBBBBBBBaa.....',
  '....aaBBBBBaa......',
  '....aBBa.aBBa......',
  '....aaaa..aaaa.....',
]
const thornPalette: Record<string, string> = {
  B: '#C4956A', a: '#8B6914', D: '#6B5030', W: '#FFFFFF',
  K: '#1a1a1a', r: '#FF6B6B', m: '#1a1a1a', '.': '',
}

// ─── 30. ZERO — Pixel Astronaut ─────────────────────────────────────────────
const zeroGrid = [
  '......aaaaaa.......',
  '....aaGGGGGGaa.....',
  '...aGGGGGGGGGGa....',
  '..aGGBBBBBBBBGGa...',
  '..aGBBWWBBBWWBGa...',
  '..aGBBWKBBBWKBGa...',
  '..aGBBBBBBBBBBGa...',
  '..aGBBBBBBBBBBGa...',
  '..aGGBBBBBBBBGGa...',
  '...aGGGGGGGGGGa....',
  '..aaWWWWWWWWWWaa...',
  '.aaWWWWWWWWWWWWaa..',
  '.aaWWWWRRWWWWWWaa..',
  '.aaWWWWWWWWWWWWaa..',
  '..aaWWWWWWWWWWaa...',
  '...aaWWWa.aWWaa....',
  '....aaaa...aaaa....',
]
const zeroPalette: Record<string, string> = {
  G: '#A1A1AA', a: '#52525B', B: '#38BDF8', W: '#FFFFFF',
  K: '#1a1a1a', R: '#EF4444', '.': '',
}

// ─── Character data ──────────────────────────────────────────────────────────

const CHARACTERS = [
  {
    name: 'BOLT',
    tagline: 'The Electric Enforcer',
    description: 'A boxy robot with a lightning-bolt antenna. Bolt powers through tasks at light speed and never runs out of juice.',
    color: '#3B82F6',
    grid: boltGrid,
    palette: boltPalette,
  },
  {
    name: 'PIXEL',
    tagline: 'The Retro Rascal',
    description: 'An 8-bit cat who delivers messages old school — one pixel at a time. Perches on mailboxes watching the inbox.',
    color: '#FF8C42',
    grid: pixelCatGrid,
    palette: pixelCatPalette,
  },
  {
    name: 'NAVI',
    tagline: 'The Wise Wayfinder',
    description: 'A round owl with a compass rose on their chest. Navi always knows which direction to take your outreach.',
    color: '#D4A843',
    grid: naviGrid,
    palette: naviPalette,
  },
  {
    name: 'ZIPPY',
    tagline: 'The Origami Outlaw',
    description: 'A fox made of folded paper planes. Zippy folds your emails into perfect pitches and sends them flying.',
    color: '#FF6B35',
    grid: zippyGrid,
    palette: zippyPalette,
  },
  {
    name: 'ECHO',
    tagline: 'The Spectral Speaker',
    description: 'A friendly ghost with a sound wave mouth. Echo amplifies your message so it resonates with every prospect.',
    color: '#7C3AED',
    grid: echoGrid,
    palette: echoPalette,
  },
  {
    name: 'CHIP',
    tagline: 'The Circuit Critter',
    description: 'A hamster with circuit board patterns across their belly. Chip processes leads faster than any chip on the market.',
    color: '#22C55E',
    grid: chipGrid,
    palette: chipPalette,
  },
  {
    name: 'SCOUT',
    tagline: 'The Lookout Hound',
    description: 'A loyal dog with oversized goggles strapped to their head. Scout sniffs out the best leads from miles away.',
    color: '#A0784C',
    grid: scoutGrid,
    palette: scoutPalette,
  },
  {
    name: 'DASH',
    tagline: 'The Rocket Bird',
    description: 'A penguin with a jetpack and aviator goggles. Dash blasts through your inbox at supersonic speeds.',
    color: '#F97316',
    grid: dashGrid,
    palette: dashPalette,
  },
  {
    name: 'GLYPH',
    tagline: 'The Ancient Automaton',
    description: 'A small stone golem covered in glowing cyan runes. Glyph channels ancient wisdom into modern cold emails.',
    color: '#22D3EE',
    grid: glyphGrid,
    palette: glyphPalette,
  },
  {
    name: 'PRISM',
    tagline: 'The Crystal Shifter',
    description: 'A low-poly geometric fox that refracts light into rainbows. Prism transforms dull outreach into something brilliant.',
    color: '#A78BFA',
    grid: prismGrid,
    palette: prismPalette,
  },
  {
    name: 'EMBER',
    tagline: 'The Flame Spirit',
    description: 'A living fireball with bright eyes. Ember lights a fire under every cold email and melts through objections.',
    color: '#EF4444',
    grid: emberGrid,
    palette: emberPalette,
  },
  {
    name: 'CAMO',
    tagline: 'The Stealth Lizard',
    description: 'A chameleon who adapts their pitch to any audience. Camo blends in anywhere and never misses their target.',
    color: '#4ADE80',
    grid: camoGrid,
    palette: camoPalette,
  },
  {
    name: 'TUSK',
    tagline: 'The Arctic Tank',
    description: 'A sturdy walrus with twin tusks. Tusk breaks through the ice with every cold open and never gets frostbitten.',
    color: '#94A3B8',
    grid: tuskGrid,
    palette: tuskPalette,
  },
  {
    name: 'FLICK',
    tagline: 'The Speed Wing',
    description: 'A tiny hummingbird who sends a thousand pitches per minute. Flick is fast, flashy, and never stays still.',
    color: '#06B6D4',
    grid: flickGrid,
    palette: flickPalette,
  },
  {
    name: 'ONYX',
    tagline: 'The Shadow Cat',
    description: 'A sleek panther who stalks leads from the shadows. Onyx strikes at the perfect moment with surgical precision.',
    color: '#52525B',
    grid: onyxGrid,
    palette: onyxPalette,
  },
  {
    name: 'CORAL',
    tagline: 'The Tide Dancer',
    description: 'A graceful seahorse who rides the waves of engagement. Coral turns every conversation into a beautiful flow.',
    color: '#FB7185',
    grid: coralGrid,
    palette: coralPalette,
  },
  {
    name: 'DUNE',
    tagline: 'The Desert Guardian',
    description: 'A cheerful cactus who thrives in the driest pipelines. Dune stores every lead and never wilts under pressure.',
    color: '#4ADE80',
    grid: duneGrid,
    palette: dunePalette,
  },
  {
    name: 'FLUX',
    tagline: 'The Deep Drifter',
    description: 'A glowing jellyfish who floats through data oceans. Flux wraps tentacles around insights and never lets go.',
    color: '#C084FC',
    grid: fluxGrid,
    palette: fluxPalette,
  },
  {
    name: 'RUNE',
    tagline: 'The Arcane Caster',
    description: 'A wizard who conjures perfect emails from ancient spells. Rune has a scroll for every occasion and a hat for style.',
    color: '#6366F1',
    grid: runeGrid,
    palette: runePalette,
  },
  {
    name: 'LINK',
    tagline: 'The Chain Pup',
    description: 'A golden retriever who connects people like links in a chain. Link never drops a lead and always fetches results.',
    color: '#60A5FA',
    grid: linkGrid,
    palette: linkPalette,
  },
  {
    name: 'VOLT',
    tagline: 'The Surge Serpent',
    description: 'An electric eel who surges through your inbox. Volt zaps stale leads back to life with pure energy.',
    color: '#3B82F6',
    grid: voltGrid,
    palette: voltPalette,
  },
  {
    name: 'SAGE',
    tagline: 'The Steady Elder',
    description: 'An ancient tortoise with a shell garden. Sage is slow and methodical, but every email lands perfectly on time.',
    color: '#65A30D',
    grid: sageGrid,
    palette: sagePalette,
  },
  {
    name: 'MIKO',
    tagline: 'The Nine-Tail Fox',
    description: 'A mystical kitsune with red fur and white tips. Miko enchants prospects with charm and closes with grace.',
    color: '#EF4444',
    grid: mikoGrid,
    palette: mikoPalette,
  },
  {
    name: 'BYTE',
    tagline: 'The Data Keeper',
    description: 'A living floppy disk with a face. Byte stores every contact and never forgets a follow-up. Retro but reliable.',
    color: '#3B82F6',
    grid: byteGrid,
    palette: bytePalette,
  },
  {
    name: 'NOVA',
    tagline: 'The Supernova',
    description: 'A radiant star who shines brightest in outreach. Nova explodes onto the scene and lights up every inbox.',
    color: '#FBBF24',
    grid: novaGrid,
    palette: novaPalette,
  },
  {
    name: 'IRIS',
    tagline: 'The Flutter Agent',
    description: 'A pixel butterfly with iridescent wings. Iris transforms boring messages into something beautiful with gentle precision.',
    color: '#E879F9',
    grid: irisGrid,
    palette: irisPalette,
  },
  {
    name: 'GRIM',
    tagline: 'The Skull Enforcer',
    description: 'A skull-faced bot who handles the toughest outreach. Grim is intimidating but effective — no lead escapes.',
    color: '#71717A',
    grid: grimGrid,
    palette: grimPalette,
  },
  {
    name: 'PUFF',
    tagline: 'The Cloud Buddy',
    description: 'A fluffy cloud with a sweet smile. Puff floats through conversations softly, making every prospect feel at ease.',
    color: '#7DD3FC',
    grid: puffGrid,
    palette: puffPalette,
  },
  {
    name: 'THORN',
    tagline: 'The Spiny Scout',
    description: 'A hedgehog with sharp spines who defends your pipeline. Thorn is prickly but loyal, and always protects your leads.',
    color: '#C4956A',
    grid: thornGrid,
    palette: thornPalette,
  },
  {
    name: 'ZERO',
    tagline: 'The Space Walker',
    description: 'An astronaut exploring the void of cold outreach. Zero boldly goes where no email has gone before.',
    color: '#38BDF8',
    grid: zeroGrid,
    palette: zeroPalette,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MascotsPage() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-white font-mono tracking-widest">
            MASCOT GALLERY
          </h1>
          <p className="mt-1 text-zinc-500 font-mono text-sm">
            30 pixel art characters — click to preview
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CHARACTERS.map((char, i) => (
            <button
              key={char.name}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`group relative flex flex-col items-center p-5 rounded-xl border transition-all duration-200 ${
                selected === i
                  ? 'bg-zinc-900 border-zinc-600 shadow-lg shadow-black/50 scale-[1.03]'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div className="w-full aspect-square flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                <div className="transform scale-[1.3]">
                  <PixelGrid grid={char.grid} palette={char.palette} pixelSize={4} />
                </div>
              </div>
              <div
                className="mt-4 text-base font-bold tracking-widest font-mono"
                style={{ color: char.color }}
              >
                {char.name}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-wide text-center">
                {char.tagline}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected !== null && (
          <div className="mt-8 p-6 sm:p-8 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/30">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="shrink-0 bg-zinc-900 rounded-lg p-8 border border-zinc-800 flex items-center justify-center" style={{ imageRendering: 'pixelated' }}>
                <div className="transform scale-[2.5]">
                  <PixelGrid
                    grid={CHARACTERS[selected].grid}
                    palette={CHARACTERS[selected].palette}
                    pixelSize={4}
                  />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2
                  className="text-4xl font-bold tracking-widest font-mono"
                  style={{ color: CHARACTERS[selected].color }}
                >
                  {CHARACTERS[selected].name}
                </h2>
                <p className="text-sm font-mono text-zinc-500 mt-1 tracking-wide">
                  {CHARACTERS[selected].tagline}
                </p>
                <p className="mt-4 text-zinc-300 leading-relaxed">
                  {CHARACTERS[selected].description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                    PIXEL ART
                  </span>
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                    SVG
                  </span>
                  <span
                    className="px-3 py-1 rounded-md text-xs font-mono font-medium border"
                    style={{
                      backgroundColor: CHARACTERS[selected].color + '20',
                      borderColor: CHARACTERS[selected].color + '40',
                      color: CHARACTERS[selected].color,
                    }}
                  >
                    {CHARACTERS[selected].name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
