'use client'

import { useEffect, useState } from 'react'

/**
 * The one place theme state is read at runtime. `ThemeScript` deliberately does not import
 * this: it needs to run inline, before paint, and an import would be a round trip that
 * reintroduces the flash of the wrong theme this module exists to avoid.
 */

export type ThemeName = 'light' | 'dark'

const STORAGE_KEY = 'pizonkhan-theme'

/** localStorage first, then the OS media query. Client only; never called during render. */
export function resolveInitialTheme(): ThemeName {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Sets document.documentElement.dataset.theme and persists to localStorage. */
export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(STORAGE_KEY, theme)
}

/**
 * The theme currently on <html>. Returns 'light' on the server and during the first client
 * render, then corrects in an effect, so a static export cannot mismatch on hydration.
 * Subscribes with a MutationObserver on documentElement's data-theme attribute, so a canvas
 * repaints when the toggle fires without either component importing the other.
 */
export function useThemeName(): ThemeName {
  const [theme, setTheme] = useState<ThemeName>('light')

  useEffect(() => {
    const read = (): ThemeName => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
    setTheme(read())

    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return theme
}
