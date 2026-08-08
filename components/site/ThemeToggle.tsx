'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { applyTheme, resolveInitialTheme, type ThemeName } from '@/lib/theme'

/** Client toggle between light and dark. Writes localStorage and the data-theme attribute. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeName>('light')

  useEffect(() => {
    setTheme(resolveInitialTheme())
  }, [])

  function toggle() {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle text-text-secondary transition-colors duration-(--dur-fast) hover:bg-surface-1',
        className,
      )}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.7 3.3l-1.06 1.06M4.36 11.64 3.3 12.7M12.7 12.7l-1.06-1.06M4.36 4.36 3.3 3.3"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            d="M14 9.3A6 6 0 1 1 6.7 2 4.7 4.7 0 0 0 14 9.3Z"
          />
        </svg>
      )}
    </button>
  )
}
