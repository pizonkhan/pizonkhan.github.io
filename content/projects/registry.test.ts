import { describe, expect, it } from 'vitest'
import { projects, getProject } from './index'
import type { ProjectRecord } from './types'

const ALLOWED_LINK_HOSTS = ['https://github.com/pizonkhan/', 'https://www.kaggle.com/']

describe('content/projects registry', () => {
  it('holds exactly the two wave-1 records, in a stable order', () => {
    expect(projects.map((p) => p.slug)).toEqual(['nyc-housing-prices', 'bird-species-cnn'])
  })

  it('getProject resolves a known slug and returns undefined for an unknown one', () => {
    expect(getProject('nyc-housing-prices')?.title).toBe(
      'What a New York home is worth, and why',
    )
    expect(getProject('does-not-exist')).toBeUndefined()
  })

  it('has both records live now that wave 2 has shipped its route', () => {
    const live = projects.filter((p) => p.status === 'live')
    const planned = projects.filter((p) => p.status === 'planned')
    expect(live).toHaveLength(2)
    expect(planned).toHaveLength(0)
    expect(live.map((p) => p.slug)).toEqual(['nyc-housing-prices', 'bird-species-cnn'])
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
