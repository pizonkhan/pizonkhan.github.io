/**
 * Runs inline, in <head>, before first paint. Deliberately does not import lib/theme.ts: an
 * import would be a round trip that reintroduces the flash of the wrong theme this component
 * exists to prevent, so the storage key is duplicated here on purpose. Keep the key in sync
 * with lib/theme.ts if it ever changes.
 */
const THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('pizonkhan-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
}
