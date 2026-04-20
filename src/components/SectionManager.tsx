import { useEffect, useRef, useCallback } from 'react'
import { SITE_CONTENT } from '../config/content'
import { SceneCanvas } from './canvas/SceneCanvas'
import { HeroSection } from './HeroSection'
import styles from '../styles/SectionManager.module.css'

const FULL: number[][] = [
  [0.00, 0.00],
  [0.33, 0.00, 0.67, 0.00, 1.00, 0.00],
  [1.00, 0.17, 1.00, 0.33, 1.00, 0.50],
  [1.00, 0.67, 1.00, 0.83, 1.00, 1.00],
  [0.67, 1.00, 0.33, 1.00, 0.00, 1.00],
  [0.00, 0.83, 0.00, 0.67, 0.00, 0.50],
  [0.00, 0.33, 0.00, 0.17, 0.00, 0.00],
]

const BLOB: number[][] = [
  [0.36, 0.29],
  [0.44, 0.19, 0.62, 0.21, 0.67, 0.30],
  [0.72, 0.39, 0.73, 0.49, 0.69, 0.58],
  [0.65, 0.67, 0.70, 0.78, 0.58, 0.80],
  [0.46, 0.82, 0.33, 0.79, 0.27, 0.70],
  [0.21, 0.61, 0.23, 0.47, 0.27, 0.38],
  [0.31, 0.28, 0.28, 0.29, 0.36, 0.29],
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function buildBlobPath(t: number): string {
  const c = FULL.map((fc, i) => fc.map((v, j) => lerp(v, BLOB[i][j], t)))
  const [m, ...segs] = c
  return (
    `M ${m[0]} ${m[1]} ` +
    segs.map(([cx1, cy1, cx2, cy2, x, y]) =>
      `C ${cx1} ${cy1} ${cx2} ${cy2} ${x} ${y}`,
    ).join(' ') +
    ' Z'
  )
}

const CARDS = SITE_CONTENT.selectionCards

interface Props {
  mouseNx: number
  mouseNy: number
}

export function SectionManager({ mouseNx, mouseNy }: Props) {
  const scrollRef     = useRef<HTMLDivElement>(null)
  const pathRef       = useRef<SVGPathElement>(null)
  const textRef       = useRef<HTMLDivElement>(null)
  const glassRef      = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const heroH = el.clientHeight
    const relScroll = el.scrollTop - heroH  // 0 = start of selectionWrapper

    // ── Phase 1: blob morphs (relScroll 0 → heroH*2) ──────────
    const blobRaw = Math.max(0, Math.min(1, relScroll / (heroH * 2)))
    const blobT = easeInOut(blobRaw)
    if (pathRef.current) {
      pathRef.current.setAttribute('d', buildBlobPath(blobT))
    }

    // ── Phase 2: glass/cards rise (relScroll heroH*2 → heroH*2.6) ──
    const glassRaw = Math.max(0, Math.min(1, (relScroll - heroH * 2) / (heroH * 0.6)))
    const glassT = easeInOut(glassRaw)
    if (glassRef.current) {
      glassRef.current.style.transform = `translateY(${lerp(100, 0, glassT)}%)`
      glassRef.current.style.opacity = String(glassT)
    }
    if (canvasWrapRef.current) {
      canvasWrapRef.current.style.transform = `translateY(${lerp(0, 10, glassT)}%)`
    }

    // ── Poem text: appears during blob phase, hides as glass rises ──
    if (textRef.current) {
      const textIn  = Math.min(1, Math.max(0, (blobT - 0.45) / 0.35))
      const textOut = 1 - glassT
      const opacity = textIn * textOut
      textRef.current.style.opacity = String(opacity)
      textRef.current.style.transform = `translateY(${lerp(12, 0, textIn)}px)`
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className={styles.wrapper}>
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <clipPath id="blob-clip" clipPathUnits="objectBoundingBox">
            <path ref={pathRef} d={buildBlobPath(0)} />
          </clipPath>
        </defs>
      </svg>

      <div ref={scrollRef} className={styles.scrollOuter}>
        {/* ── Phase 0: Hero ── */}
        <HeroSection mouseNx={mouseNx} mouseNy={mouseNy} />

        {/* ── Phase 1-2: Blob → Cards (600svh total) ── */}
        <div className={styles.selectionWrapper}>
          <div className={styles.stickyFrame}>
            {/* 3D canvas with blob clip */}
            <div ref={canvasWrapRef} className={styles.canvasArea} style={{ clipPath: 'url(#blob-clip)' }}>
              <SceneCanvas mouseNx={mouseNx} mouseNy={mouseNy} />
            </div>

            {/* Poem text overlay (phase 1) */}
            <div
              ref={textRef}
              className={styles.textOverlay}
              style={{ opacity: 0, transform: 'translateY(12px)' }}
            >
              {SITE_CONTENT.sections.map((s) => (
                <div key={s.id} className={styles.poemBlock}>
                  <h1 className={styles.poemHeading}>{s.heading}</h1>
                  {s.body && <p className={styles.poemBody}>{s.body}</p>}
                </div>
              ))}
            </div>

            {/* Glass panel with card grid (phase 2) */}
            <div ref={glassRef} className={styles.glassPanel}>
              <div className={styles.cardGrid}>
                {CARDS.map((card) => (
                  <a
                    key={card.id}
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.selectionCard}
                  >
                    <span className={styles.cardCategory}>{card.category}</span>
                    <span className={styles.cardLabel}>{card.label}</span>
                    <span className={styles.cardDivider} />
                    <span className={styles.cardSub}>{card.sub}</span>
                    <span className={styles.cardView}>VIEW &nbsp;→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* scrollSpacer = selectionWrapper height minus stickyFrame */}
          <div className={styles.scrollSpacer} />
        </div>
      </div>
    </div>
  )
}
