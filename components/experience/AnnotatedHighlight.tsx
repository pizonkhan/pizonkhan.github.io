'use client'

import { splitHighlight, type HighlightAnnotation } from '@/lib/glossary'
import { GlossaryTerm } from './GlossaryTerm'

export interface AnnotatedHighlightProps {
  /** One résumé bullet, exactly as written in content/profile.ts. Never edited here. */
  text: string
  /** The annotations declared for this bullet. Pass an empty array for an unannotated bullet. */
  annotations: readonly HighlightAnnotation[]
}

/**
 * Renders one résumé bullet, splitting it into plain text and inline concept links with no
 * character added, removed or reordered. Returns a fragment so the caller's own `<li>` keeps
 * owning the line box.
 */
export function AnnotatedHighlight({ text, annotations }: AnnotatedHighlightProps) {
  const segments = splitHighlight(text, annotations)

  return (
    <>
      {segments.map((segment, index) =>
        segment.kind === 'term' ? (
          <GlossaryTerm key={index} techniqueId={segment.techniqueId}>
            {segment.text}
          </GlossaryTerm>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}
