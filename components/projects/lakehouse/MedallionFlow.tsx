'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { MEDALLION_STAGES, ORCHESTRATION, SUBSTRATE } from '@/content/data/lakehouse'
import { usePrefersReducedMotion } from '@/lib/motion'
import { StageGlyph } from './StageGlyph'

const CYCLE_MS = 4000
const HOP_MS = CYCLE_MS / MEDALLION_STAGES.length
const PAUSE_MS = 1600

const CARD_STAGGER_MS = 120
const CHIP_BASE_DELAY_MS = 700
const CHIP_STAGGER_MS = 60
const ORCHESTRATION_DELAY_MS = 820

/**
 * A continuously-updating viewport observer, unlike useInViewOnce's one-shot latch: the dot
 * loop needs to re-pause every time the figure leaves the screen, not just the first time.
 * Same shape as PipelineFlow.tsx's helper of the same name, copied rather than imported so this
 * feature directory stays self-contained.
 */
function useLiveInView<T extends Element>(): [(node: T | null) => void, boolean] {
  const [node, setNode] = useState<T | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useCallback((next: T | null) => setNode(next), [])

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [ref, visible]
}

function opacityStyle(revealed: boolean, reduced: boolean, delayMs: number): CSSProperties {
  if (reduced) return { opacity: 1, transition: 'none' }
  return {
    opacity: revealed ? 1 : 0,
    transition: 'opacity var(--dur-base) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

/**
 * The card's opacity and rise animate on first view only, delayed by stage index. Its border
 * colour keeps transitioning on every loop hop after that, on its own duration with no delay,
 * which is why all three properties are listed in one transition rather than reusing
 * opacityStyle: border-color has to keep firing long after the entrance transition is spent.
 */
function cardStyle(revealed: boolean, reduced: boolean, delayMs: number, borderColor: string): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none', borderColor, transition: 'none' }
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'none' : 'translateY(6px)',
    borderColor,
    transition:
      'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
    transitionDelay: `${delayMs}ms, ${delayMs}ms, 0ms`,
  }
}

/**
 * The page's answer to "what moves here": four medallion layers, an accent dot travelling the
 * rail on a loop, real counts under every stage. Pauses whenever the tab is hidden or the
 * figure scrolls off screen, the same rule PipelineFlow.tsx follows.
 */
export function MedallionFlow() {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useLiveInView<HTMLDivElement>()
  const [hasEntered, setHasEntered] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dotPercent, setDotPercent] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const cycleStartRef = useRef<number | null>(null)
  const hiddenRef = useRef(false)

  useEffect(() => {
    if (inView) setHasEntered(true)
  }, [inView])

  useEffect(() => {
    hiddenRef.current = document.hidden
    function onVisibilityChange() {
      hiddenRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (reduced) return
    const running = inView && !hiddenRef.current

    if (!running) {
      cycleStartRef.current = null
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    function tick(now: number) {
      if (hiddenRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      if (cycleStartRef.current === null) cycleStartRef.current = now
      const period = CYCLE_MS + PAUSE_MS
      const elapsed = (now - cycleStartRef.current) % period

      if (elapsed < CYCLE_MS) {
        setDotPercent((elapsed / CYCLE_MS) * 100)
        setActiveIndex(Math.min(MEDALLION_STAGES.length - 1, Math.floor(elapsed / HOP_MS)))
      } else {
        setDotPercent(null)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [reduced, inView])

  const revealed = reduced || hasEntered

  const tableRows = [
    ...MEDALLION_STAGES.map((stage) => ({
      layer: stage.label,
      what: stage.sub,
      figure: stage.figure,
    })),
    ...SUBSTRATE.map((chip) => ({
      layer: 'substrate',
      what: `${chip.name} · ${chip.role}`,
      figure: '',
    })),
    {
      layer: 'orchestration',
      what: `${ORCHESTRATION.name} · ${ORCHESTRATION.role}`,
      figure: '',
    },
  ]

  return (
    <Figure
      eyebrow="THE MEDALLION PATH"
      title="One row, generator to gold"
      caption={
        reduced
          ? 'Generation, bronze, silver, gold: the four layers a row passes through, with the real count at each one.'
          : 'An accent dot follows a row through the four layers. The count under each stage is from the full-scale build.'
      }
      source="Row counts, sizes and versions from the full-scale build. README.md, ARCHITECTURE.md and docs/02-data.md in the project repository."
      disclosureLabel="Show the stages"
      well={{ height: 660, heightSm: 320 }}
      table={
        <FigureTable
          caption="The four medallion layers, what each one does, and its real figure."
          columns={[
            { key: 'layer', label: 'Layer' },
            { key: 'what', label: 'What happens' },
            { key: 'figure', label: 'Real figure', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-4">
        <div
          className="rounded-md border border-border-subtle bg-surface-1 px-3 py-2"
          style={opacityStyle(revealed, reduced, ORCHESTRATION_DELAY_MS)}
        >
          <p className="text-small font-medium text-text-primary">{ORCHESTRATION.name}</p>
          <p className="text-tick text-text-tertiary">{ORCHESTRATION.role}</p>
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1.5 top-0 w-px sm:hidden"
            style={{ backgroundColor: 'var(--border-subtle)' }}
          />
          {!reduced && dotPercent !== null && (
            <>
              <span
                aria-hidden="true"
                className="absolute left-1.5 block h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden"
                style={{ top: `${dotPercent}%`, backgroundColor: 'var(--accent)' }}
              />
              <span
                aria-hidden="true"
                className="absolute top-1/2 hidden h-[5px] w-[5px] -translate-y-1/2 rounded-full sm:block"
                style={{ left: `${dotPercent}%`, backgroundColor: 'var(--accent)' }}
              />
            </>
          )}
          {MEDALLION_STAGES.map((stage, index) => {
            const lit = !reduced && index === activeIndex
            const borderColor = reduced
              ? 'var(--border-strong)'
              : lit
                ? 'var(--accent)'
                : 'var(--border-subtle)'
            return (
              <Fragment key={stage.id}>
                <div
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-md border p-3 text-center transition-colors duration-(--dur-base)"
                  style={cardStyle(revealed, reduced, index * CARD_STAGGER_MS, borderColor)}
                >
                  <StageGlyph
                    kind={stage.id}
                    revealed={revealed}
                    reduced={reduced}
                    delayMs={index * CARD_STAGGER_MS}
                    className="h-6 w-6"
                  />
                  <span className="text-small font-medium">{stage.label}</span>
                  <span className="text-tick text-text-tertiary">{stage.sub}</span>
                  <span className="text-tick tabular-nums text-text-secondary">{stage.figure}</span>
                </div>
                {index < MEDALLION_STAGES.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden w-4 flex-shrink-0 items-center justify-center sm:flex"
                  >
                    <div className="h-px w-full" style={{ backgroundColor: 'var(--border-subtle)' }} />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        <div>
          <div className="h-px w-full bg-border-subtle" />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
            {SUBSTRATE.map((chip, index) => (
              <span
                key={chip.name}
                className="rounded-full border border-border-subtle px-3 py-1 text-tick text-text-secondary"
                style={opacityStyle(revealed, reduced, CHIP_BASE_DELAY_MS + index * CHIP_STAGGER_MS)}
              >
                {`${chip.name} · ${chip.role}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Figure>
  )
}
