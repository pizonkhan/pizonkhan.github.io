import Link from 'next/link'
import { profile } from '@/content/profile'
import { Wordmark } from '@/components/site/Wordmark'

/** Wordmark and contact links, rendered on every page. */
export function SiteFooter() {
  return (
    <footer data-section="site-footer" className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-(--width-content) flex-wrap items-center justify-between gap-6 px-6 py-10 sm:px-8">
        <Wordmark height={28} />
        <div className="flex flex-wrap gap-6 text-small text-text-secondary">
          <a href={`mailto:${profile.email}`} className="hover:text-text-primary">
            {profile.email}
          </a>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary"
          >
            GitHub
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary"
          >
            LinkedIn
          </a>
          <Link href="/projects/site-analytics/" className="hover:text-text-primary">
            How this site counts visits
          </Link>
        </div>
      </div>
    </footer>
  )
}
