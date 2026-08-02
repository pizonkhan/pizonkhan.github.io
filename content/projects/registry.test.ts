import { describe, expect, it } from 'vitest'
import { projects, getProject } from './index'
import type { ProjectRecord } from './types'
import { SNAPSHOT, CITYWIDE_2025 } from '@/content/data/nyc-2025-sales'
import { WINNER } from '@/content/data/nyc-2025-models'
import { formatCount, formatUSD } from '@/lib/format'

const ALLOWED_LINK_HOSTS = [
  'https://github.com/pizonkhan/',
  'https://www.kaggle.com/',
  'https://data.cityofnewyork.us/',
]

describe('content/projects registry', () => {
  it('holds exactly the three records this site ships, in registry order', () => {
    expect(projects.map((p) => p.slug)).toEqual([
      'nyc-home-sales-2025',
      'nyc-housing-prices',
      'bird-species-cnn',
    ])
  })

  it('getProject resolves a known slug and returns undefined for an unknown one', () => {
    expect(getProject('nyc-housing-prices')?.title).toBe(
      'What a New York home is worth, and why',
    )
    expect(getProject('does-not-exist')).toBeUndefined()
  })

  it('all three records are live', () => {
    const live = projects.filter((p) => p.status === 'live')
    const planned = projects.filter((p) => p.status === 'planned')
    expect(live).toHaveLength(3)
    expect(planned).toHaveLength(0)
    expect(live.map((p) => p.slug)).toEqual([
      'nyc-home-sales-2025',
      'nyc-housing-prices',
      'bird-species-cnn',
    ])
  })

  it.each(projects)('$slug has no employer, company or client field', (record) => {
    const keys = Object.keys(record)
    expect(keys).not.toContain('employer')
    expect(keys).not.toContain('company')
    expect(keys).not.toContain('client')
  })

  it.each(projects)('$slug: every ProjectLink.href points at an allowed public host', (record) => {
    for (const link of record.links) {
      const allowed = ALLOWED_LINK_HOSTS.some((host) => link.href.startsWith(host))
      expect(allowed, `${record.slug} link "${link.label}" -> ${link.href}`).toBe(true)
    }
  })

  it.each(projects)('$slug: the last section is next-time, and every section id is unique', (record) => {
    const ids = record.sections.map((s) => s.id)
    expect(ids[ids.length - 1]).toBe('next-time')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(projects)('$slug: every section has non-empty prose', (record) => {
    for (const section of record.sections) {
      expect(section.body.length).toBeGreaterThan(0)
      for (const paragraph of section.body) {
        expect(paragraph.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it.each(projects)('$slug: headlineFigures has at most 3 entries, each sourced', (record) => {
    expect(record.headlineFigures.length).toBeLessThanOrEqual(3)
    for (const figure of record.headlineFigures) {
      expect(figure.source.trim().length).toBeGreaterThan(0)
    }
  })

  it.each(projects)('$slug: no rendered string contains an em dash', (record) => {
    const strings = collectStrings(record)
    for (const value of strings) {
      expect(value).not.toContain('—')
    }
  })

  it.each(projects.filter((p) => p.related))(
    '$slug: related.slug resolves to a live record',
    (record) => {
      const target = getProject(record.related!.slug)
      expect(target, `${record.slug} -> related.slug "${record.related!.slug}"`).toBeDefined()
      expect(target?.status).toBe('live')
    },
  )

  it('the two NYC records point at each other with opposite directions', () => {
    const sales2025 = getProject('nyc-home-sales-2025')
    const housing2019 = getProject('nyc-housing-prices')
    expect(sales2025?.related?.slug).toBe('nyc-housing-prices')
    expect(sales2025?.related?.direction).toBe('earlier')
    expect(housing2019?.related?.slug).toBe('nyc-home-sales-2025')
    expect(housing2019?.related?.direction).toBe('later')
  })

  it('nyc-home-sales-2025 headline figures are read straight from the generated modules', () => {
    const record = getProject('nyc-home-sales-2025')
    expect(record).toBeDefined()
    const bySales = record!.headlineFigures.find((f) => f.label === 'Recorded sales, 2025')
    const byMedian = record!.headlineFigures.find((f) => f.label === 'Citywide median sale price')
    const byWinner = record!.headlineFigures.find((f) => f.label === 'Test MAE, winning model')
    expect(bySales?.value).toBe(formatCount(SNAPSHOT.points))
    expect(byMedian?.value).toBe(formatUSD(CITYWIDE_2025.median))
    expect(byWinner?.value).toBe(formatUSD(WINNER.mae))
  })
})

function collectStrings(record: ProjectRecord): string[] {
  const out: string[] = [
    record.title,
    record.tagline,
    record.summary,
    record.demonstration,
    record.dataStatement,
  ]
  for (const section of record.sections) {
    out.push(section.heading, ...section.body)
  }
  for (const figure of record.headlineFigures) {
    out.push(figure.label, figure.value, figure.source)
  }
  for (const link of record.links) {
    out.push(link.label)
  }
  out.push(record.dataset.name, record.dataset.provenance)
  return out
}
