/**
 * The site's known routes, kept in sync by hand with app/ in the site repository. A path
 * that is not on this list is stored as /unknown rather than dropped, so an event from a
 * route this list has fallen behind never disappears, it just loses its own row in
 * top pages until this list is updated.
 */
export const KNOWN_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/experience/',
  '/business/',
  '/projects/',
  '/projects/nyc-home-sales-2025/',
  '/projects/nyc-housing-prices/',
  '/projects/bird-species-cnn/',
  '/projects/site-analytics/',
])
