/** The first focusable element on every page. Moves focus to <main> for keyboard users. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-1 focus:px-4 focus:py-2 focus:text-body focus:text-text-primary focus:shadow-card"
    >
      Skip to content
    </a>
  )
}
