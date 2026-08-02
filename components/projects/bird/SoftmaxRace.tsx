'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { DURATION, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatPercent } from '@/lib/format'
import { withBasePath } from '@/lib/base-path'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import { BIRD_GALLERY, FEATURED_BIRD_ID } from '@/content/data/bird-gallery'
import { BirdGallery } from './BirdGallery'

interface SoftmaxEntry {
  label: string
  probability: number
}

type SoftmaxState =
  | { status: 'loading' }
  | { status: 'ready'; data: SoftmaxEntry[] }
  | { status: 'error' }

type Stage = 0 | 1 | 2 | 3 // 16 candidates, 8, 3, the prediction
const STAGE_SIZE = [16, 8, 3, 1] as const
const STAGE_LABELS = ['16 classes', 'Top 8', 'Top 3', 'Prediction'] as const
const STAGE_VALUES: readonly string[] = ['0', '1', '2', '3']

function formatRowPercent(probability: number): string {
  return probability < 0.0001 ? '<0.01%' : formatPercent(probability, { digits: 2 })
}

/** Log-scaled position within one stage's own min/max, so a 99% winner and a 0.02% also-ran are both legible. */
function logBarWidthPct(probability: number, min: number, max: number): number {
  const safeMin = Math.max(min, 1e-6)
  const safeMax = Math.max(max, safeMin)
  if (safeMax === safeMin) return 100
  const logMin = Math.log10(safeMin)
  const logMax = Math.log10(safeMax)
  const logValue = Math.log10(Math.max(probability, 1e-6))
  return Math.min(100, Math.max(0, ((logValue - logMin) / (logMax - logMin)) * 100))
}

interface NarrowingRowProps {
  entry: SoftmaxEntry
  isWinner: boolean
  widthPct: number
  reduced: boolean
  tall?: boolean
  shareLabel?: string
}

/**
 * One bar row, reused for stage 1 (8 rows) and stage 2 (3 taller rows). Carries the R4.6
 * responsive row: name and value share line one below sm, the track takes a full-width line
 * two, and from sm up the order resets to name, track, value.
 */
function NarrowingRow({ entry, isWinner, widthPct, reduced, tall, shareLabel }: NarrowingRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="order-1 w-[calc(100%-7rem)] truncate text-small text-text-primary sm:w-32"
          title={entry.label}
        >
          {entry.label}
        </span>
        <span className="order-2 w-24 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3">
          {formatRowPercent(entry.probability)}
        </span>
        <div
          className={clsx('relative order-3 w-full sm:order-2 sm:w-auto sm:flex-1', tall ? 'h-6' : 'h-4')}
        >
          <div
            className="h-full min-w-[2px] rounded-[2px]"
            style={{
              width: `${widthPct}%`,
              backgroundColor: isWinner ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: '0.5px solid var(--viz-hairline)',
              transition: reduced ? 'none' : 'width 240ms var(--ease-out)',
            }}
          />
        </div>
      </div>
      {shareLabel && <p className="text-tick text-text-tertiary">{shareLabel}</p>}
    </div>
  )
}

/**
 * The decision figure: gallery-driven, staged narrowing of one real softmax output. The
 * filename stayed SoftmaxRace even though the figure now owns a picker and four stages,
 * because renaming it would have discarded the diff against the R4.6 fixes below (the settle
 * pulse that releases, and the responsive row that does not clip at 375px). Both survive this
 * edit; the gallery and staging are new work on top of them.
 */
export function SoftmaxRace() {
  const [speciesId, setSpeciesId] = useState<string>(FEATURED_BIRD_ID)
  const [stage, setStage] = useState<Stage>(0)
  const [pulsed, setPulsed] = useState(false)
  const [cache, setCache] = useState<Record<string, SoftmaxState>>({})
  const startedRef = useRef<Set<string>>(new Set())

  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered
  const timersRef = useRef<number[]>([])

  const clearStageTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const load = useCallback((id: string) => {
    if (startedRef.current.has(id)) return
    startedRef.current.add(id)
    setCache((prev) => ({ ...prev, [id]: { status: 'loading' } }))

    fetch(withBasePath(`/projects/bird-species-cnn/gallery/${id}/softmax.json`))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} fetching gallery/${id}/softmax.json`)
        return response.json() as Promise<SoftmaxEntry[]>
      })
      .then((data) => setCache((prev) => ({ ...prev, [id]: { status: 'ready', data } })))
      .catch(() => setCache((prev) => ({ ...prev, [id]: { status: 'error' } })))
  }, [])

  useEffect(() => {
    load(speciesId)
  }, [speciesId, load])

  // Autoplay, once per entry and once per species switch: 16 at 0ms, 8 at 450ms, 3 at 900ms,
  // the prediction at 1350ms, then the winner's settle pulse at 1800ms, releasing at 2040ms.
  // Under reduced motion the figure jumps straight to the prediction and runs no timer at all.
  useEffect(() => {
    if (reduced) {
      setStage(3)
      setPulsed(false)
      return
    }
    if (!entered) return

    setStage(0)
    timersRef.current = [
      window.setTimeout(() => setStage(1), 450),
      window.setTimeout(() => setStage(2), 900),
      window.setTimeout(() => setStage(3), 1350),
      window.setTimeout(() => setPulsed(true), DURATION.sequence * 1000),
      window.setTimeout(() => setPulsed(false), DURATION.sequence * 1000 + 240),
    ]
    return clearStageTimers
  }, [entered, reduced, speciesId, clearStageTimers])

  const stageStepper = useRovingRadioGroup(STAGE_VALUES, String(stage), (next) => {
    // A press wins over the entry autoplay. Without this the pending stage timers fire on top of
    // the visitor's own choice half a second later.
    clearStageTimers()
    setPulsed(false)
    setStage(Number(next) as Stage)
  })

  const selectedBird = BIRD_GALLERY.find((bird) => bird.id === speciesId) ?? BIRD_GALLERY[0]
  const asset: SoftmaxState = cache[speciesId] ?? { status: 'loading' }
  const data = asset.status === 'ready' ? asset.data : []

  const stage1 = data.slice(0, STAGE_SIZE[1])
  const stage2 = data.slice(0, STAGE_SIZE[2])
  const stage2Sum = stage2.reduce((sum, entry) => sum + entry.probability, 0)
  const restSum = data.slice(1).reduce((sum, entry) => sum + entry.probability, 0)

  const stageTableRows = data.map((entry, index) => {
    const rank = index + 1
    return {
      rank: String(rank),
      label: entry.label,
      probability: formatPercent(entry.probability, { digits: 4 }),
      stage1: rank <= STAGE_SIZE[1] ? 'yes' : 'no',
      stage2: rank <= STAGE_SIZE[2] ? 'yes' : 'no',
      stage3: rank <= STAGE_SIZE[3] ? 'yes' : 'no',
    }
  })

  const attributionRows = BIRD_GALLERY.map((bird) => ({
    species: bird.common,
    photographer: bird.photographer,
    license: bird.license,
    source: bird.sourceUrl,
  }))

  return (
    <Figure
      eyebrow="SOFTMAX"
      title="Sixteen candidates, then one"
      caption="Pick a bird. The list narrows to eight, then three, then the species the network committed to."
      source="One forward pass per photograph through stock ImageNet VGG16. Every probability shown at every stage is that pass's final softmax output, filtered, not a mid-network guess: the network produces no class scores before its last layer."
      well={{ height: 920, heightSm: 520 }}
      table={
        <div className="flex flex-col gap-6">
          <FigureTable
            caption={`All sixteen candidate classes for ${selectedBird.common}, one real softmax output.`}
            columns={[
              { key: 'rank', label: 'Rank' },
              { key: 'label', label: 'Class' },
              { key: 'probability', label: 'Probability', align: 'right' },
              { key: 'stage1', label: 'In top 8' },
              { key: 'stage2', label: 'In top 3' },
              { key: 'stage3', label: 'Prediction' },
            ]}
            rows={stageTableRows}
          />
          <FigureTable
            caption="Every gallery photograph: photographer, licence and source."
            columns={[
              { key: 'species', label: 'Species' },
              { key: 'photographer', label: 'Photographer' },
              { key: 'license', label: 'Licence' },
              { key: 'source', label: 'Source' },
            ]}
            rows={attributionRows}
          />
        </div>
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-4 sm:flex-row">
        <div className="flex flex-col gap-2 sm:w-[40%] sm:flex-shrink-0">
          <img
            src={withBasePath(`/projects/bird-species-cnn/gallery/${selectedBird.id}/photo-320.webp`)}
            width={320}
            height={320}
            alt={selectedBird.common}
            className="h-[240px] w-[240px] rounded-sm object-cover"
          />
          <div>
            <p className="text-small text-text-primary">{selectedBird.common}</p>
            <p className="text-tick text-text-tertiary">
              {selectedBird.scientific}. {selectedBird.photographer}, {selectedBird.license}, via Wikimedia
              Commons.
            </p>
          </div>
          <BirdGallery value={speciesId} onChange={setSpeciesId} onPrefetch={load} />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div role="radiogroup" aria-label="Narrowing stage" className="flex gap-1.5" {...stageStepper.groupProps}>
            {STAGE_LABELS.map((label, index) => {
              const isCurrent = stage === index
              return (
                <button
                  key={label}
                  type="button"
                  {...stageStepper.getRadioProps(String(index))}
                  className={clsx(
                    'rounded-sm border px-2 py-1 text-tick transition-colors duration-(--dur-fast)',
                    isCurrent
                      ? 'border-text-primary bg-surface-1 text-text-primary'
                      : 'border-border-subtle text-text-tertiary hover:bg-surface-2',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex-1">
            {asset.status === 'loading' && (
              <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
                Loading the softmax output for {selectedBird.common}.
              </p>
            )}
            {asset.status === 'error' && (
              <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
                Could not load the softmax output for {selectedBird.common}.
              </p>
            )}
            {asset.status === 'ready' && (
              <>
                {stage === 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {data.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex items-center justify-between gap-2 rounded-sm border border-border-subtle bg-surface-1 px-2 py-1 text-tick"
                      >
                        <span className="truncate text-text-primary" title={entry.label}>
                          {entry.label}
                        </span>
                        <span className="flex-shrink-0 tabular-nums text-text-tertiary">
                          {formatRowPercent(entry.probability)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {stage === 1 && (
                  <div className="flex flex-col justify-between gap-1.5">
                    {stage1.map((entry, index) => (
                      <NarrowingRow
                        key={entry.label}
                        entry={entry}
                        isWinner={index === 0}
                        widthPct={logBarWidthPct(
                          entry.probability,
                          stage1[stage1.length - 1]?.probability ?? entry.probability,
                          stage1[0]?.probability ?? entry.probability,
                        )}
                        reduced={reduced}
                      />
                    ))}
                  </div>
                )}

                {stage === 2 && (
                  <div className="flex flex-col justify-between gap-3">
                    {stage2.map((entry, index) => (
                      <NarrowingRow
                        key={entry.label}
                        entry={entry}
                        isWinner={index === 0}
                        widthPct={logBarWidthPct(
                          entry.probability,
                          stage2[stage2.length - 1]?.probability ?? entry.probability,
                          stage2[0]?.probability ?? entry.probability,
                        )}
                        reduced={reduced}
                        tall
                        shareLabel={`${formatPercent(entry.probability / stage2Sum, { digits: 1 })} of the top three`}
                      />
                    ))}
                  </div>
                )}

                {stage === 3 && data[0] && (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-2 text-center"
                    style={{
                      transform: `scale(${pulsed ? 1.02 : 1})`,
                      transition: reduced ? 'none' : 'transform 240ms var(--ease-in-out)',
                    }}
                  >
                    <span className="text-h3 text-text-primary">{data[0].label}</span>
                    <span className="text-body tabular-nums text-text-secondary">
                      {formatRowPercent(data[0].probability)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {asset.status === 'ready' && data[0] && (
            <p className="text-small text-text-secondary">
              Rank 1 takes {formatRowPercent(data[0].probability)} of the probability. The other fifteen classes
              share {formatRowPercent(restSum)} between them.
            </p>
          )}
        </div>
      </div>
    </Figure>
  )
}
