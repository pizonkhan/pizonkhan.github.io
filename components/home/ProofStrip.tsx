'use client'

import { Metric } from '@/components/ui/Metric'
import { AnimatedNumber } from '@/components/viz/AnimatedNumber'
import { Container } from '@/components/ui/Container'

/**
 * Three résumé figures. Every value is a literal substring of a highlight in
 * content/profile.ts, nothing computed or rounded here. No shared Section wrapper: '/' is
 * the one route with a 105 KB first-load budget, and Section's scroll-reveal costs
 * framer-motion, which this route cannot afford (see Hero.tsx).
 */
const PROOF = [
  {
    value: 15,
    format: (v: number) => `${Math.round(v)}+`,
    label: 'Snowflake pipelines feeding the credit data mart',
  },
  {
    value: 1.5,
    format: (v: number) => `$${v.toFixed(1)}M`,
    label: 'Saved annually replacing licensed risk models',
  },
  {
    value: 100,
    format: (v: number) => `~${Math.round(v)}`,
    label: 'Users across 10+ enterprise teams',
  },
] as const

/** Three résumé figures, count up on first view. The label never animates. */
export function ProofStrip() {
  return (
    <div className="py-(--space-section)">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {PROOF.map((item) => (
            <Metric
              key={item.label}
              value={<AnimatedNumber value={item.value} format={item.format} />}
              label={item.label}
            />
          ))}
        </div>
      </Container>
    </div>
  )
}
