/**
 * INTEGRITY RULE: read before adding a record.
 *
 * This registry holds PERSONAL projects only. Pizon is Director of Credit Analytics at a
 * bank and cannot publish company-specific detail. There is deliberately NO employer field
 * on ProjectRecord and there never should be. Employer accomplishments belong on
 * /experience/, rendered verbatim from content/profile.ts, with no demonstration attached.
 *
 * Every `href` must be publicly reachable. Never link a private repository.
 */

export type ProjectStatus = 'live' | 'planned'
export type ProjectGlyph = 'grid' | 'kernel' | 'flow'

export interface ProjectFigure {
  label: string
  /** Pre-formatted for display. Never computed at render time. */
  value: string
  /** Where this number came from. Required. */
  source: string
}

export interface ProjectLink {
  label: string
  href: string
  kind: 'repo' | 'dataset' | 'report' | 'reference'
}

export interface ProjectDataset {
  name: string
  scale: string
  provenance: string
  href?: string
}

export interface ProjectSectionBlock {
  /**
   * Stable kebab-case anchor, unique within the record, and the key the route uses in
   * ProjectLayout's sectionVisuals map. Ids are per project rather than a fixed six, because
   * the theory beats differ by project. One convention holds across every record: the last
   * section is `next-time`. There is no mandatory first section. The overview and the result
   * live in the hero and the centrepiece, above `sections` entirely, so a project whose first
   * beat is `pixels` rather than `problem` is correct.
   */
  id: string
  heading: string
  /** One string per paragraph. No markdown, no HTML. */
  body: string[]
  /**
   * True when this section's argument is carried by an embedded visual, in which case the
   * route must supply sectionVisuals[id]. Checked in development, not enforced by the type.
   */
  hasVisual?: boolean
}

/**
 * A sibling project this record supersedes or continues. Rendered by ProjectHero as one link
 * under the tagline. `slug` must resolve in the registry; registry.test.ts asserts it.
 *
 * This exists because ProjectSectionBlock.body is plain text and cannot carry a link, and a
 * page that silently replaces an older analysis without pointing at it is not honest.
 */
export interface ProjectRelation {
  slug: string
  /** Link text, in Pizon's voice. States what the other page is, not that it is "related". */
  label: string
  /** 'earlier': the other page came first. 'later': the other page supersedes this one. */
  direction: 'earlier' | 'later'
}

export interface ProjectRecord {
  slug: string
  status: ProjectStatus
  title: string
  tagline: string
  summary: string
  year: string
  /** One sentence: what the visitor will see MOVING on this page. */
  demonstration: string
  glyph: ProjectGlyph
  stack: string[]
  dataset: ProjectDataset
  /** Max 3. */
  headlineFigures: ProjectFigure[]
  sections: ProjectSectionBlock[]
  links: ProjectLink[]
  /** Rendered in the footer of every figure on the page. */
  dataStatement: string
  related?: ProjectRelation
}
