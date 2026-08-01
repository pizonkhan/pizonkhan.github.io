import { site } from '@/content/site'
import { profile } from '@/content/profile'
import { Wordmark } from '@/components/site/Wordmark'

/** Wordmark, contact links, and the integrity statement rendered on every page. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-(--width-content) flex-col gap-6 px-6 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
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
          </div>
        </div>
        <p className="max-w-(--measure-prose) text-tick text-text-tertiary">
          {site.integrityStatement}
        </p>
      </div>
    </footer>
  )
}
