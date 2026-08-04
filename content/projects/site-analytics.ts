import type { ProjectRecord } from './types'

export const siteAnalytics: ProjectRecord = {
  slug: 'site-analytics',
  status: 'live',
  title: 'The analytics pipeline running under this site',
  tagline:
    'Page views, clicks and time on page, collected by a worker I wrote, stored in a '
    + 'database I run, and read live by the dashboard below. No cookie, no third-party '
    + 'script, no stored identifier.',
  summary:
    'This site collects its own analytics. A worker I wrote takes three kinds of event '
    + 'from the browser, validates them, and writes them to a SQLite database I run on '
    + 'Cloudflare D1. A nightly job aggregates each closed day in SQL, so the dashboard '
    + 'never scans the raw table to answer a question. The page below reads that database '
    + 'live when you open it, so the numbers are whatever the traffic has actually been. '
    + 'There is no cookie, no stored identifier and no third-party script, which is why '
    + 'there is no consent banner either.',
  year: '2026',
  demonstration:
    'The dashboard below reads this site’s own traffic at the moment you open it. Pick '
    + 'a window and the daily chart, the ranked pages, the clicked links and the time-on-page '
    + 'distribution all redraw from one request. The diagram under it traces a single event '
    + 'from the browser beacon to the row this page just read, with the real counts attached '
    + 'to each stage.',
  glyph: 'flow',
  stack: ['TypeScript', 'Cloudflare Workers', 'D1', 'SQLite', 'Vitest', 'SVG'],
  dataset: {
    name: 'This site’s own visitor events',
    scale: 'three event types, one landing table, seven serving tables, rolled up nightly',
    provenance:
      'Collected by the worker in workers/site-analytics from visitors to '
      + 'pizonkhan.github.io. No IP address is stored. No cookie is set. Counts are after a '
      + 'user-agent filter for obvious bots.',
    href: 'https://developers.cloudflare.com/d1/platform/pricing/',
  },
  headlineFigures: [
    {
      label: 'Event types collected',
      value: '3',
      source: 'Page view, click, visible time. workers/site-analytics/migrations/0001_create_event.sql.',
    },
    {
      label: 'Cookies and stored identifiers',
      value: '0',
      source:
        'The visit id is a random value in a JavaScript variable for the life of one document. '
        + 'No cookie, no localStorage, no sessionStorage.',
    },
    {
      label: 'Free-tier write ceiling',
      value: '100,000 rows/day',
      source:
        'Cloudflare D1 free plan, published limit. Each event costs three row writes here: '
        + 'the table, the primary key index and one covering index.',
    },
  ],
  sections: [
    {
      id: 'why-build-it',
      heading: 'Why I built the pipeline instead of pasting a script',
      body: [
        'A hosted analytics tag, Plausible or Fathom or Google Analytics, is one script '
          + 'tag, and I would have had a working dashboard by lunch. It would also have '
          + 'demonstrated nothing about how I actually work. This site’s whole thesis is '
          + 'that a project page proves the engineering, not just the result, so the honest '
          + 'version of an analytics page is the pipeline that produces the numbers, not the '
          + 'numbers on their own.',
        'What follows is the shape of real pipeline work at a smaller scale: an event '
          + 'lands, it gets validated, it goes into a table designed for writes, a nightly '
          + 'job turns raw rows into something a dashboard can query cheaply, and a serving '
          + 'query reads only what it needs. Building that once, correctly, mattered more to '
          + 'me than saving an afternoon.',
      ],
    },
    {
      id: 'what-gets-collected',
      heading: 'Three event types, and what each row holds',
      body: [
        'Every event on this site is one of three kinds. A page view fires once per route '
          + 'change. A click fires once per link or button a visitor actually activates, '
          + 'tagged with the section of the page it came from and where it pointed. A '
          + 'duration reading is a running total of visible seconds on the current page, sent '
          + 'on tab switches and on unload, and it only ever grows, so a resend from the same '
          + 'page view corrects itself rather than double counting.',
        'What is not on that list matters as much as what is. No IP address is ever '
          + 'written to the database, only read once by the worker to build a rate-limit key '
          + 'that is never stored. No raw user agent is stored either: it is classified into '
          + 'a device and a browser family and discarded. A referrer becomes a bare hostname, '
          + 'never the full URL. An outbound link’s query string and fragment are stripped '
          + 'before the click is recorded. workers/site-analytics/migrations/0001_create_event.sql '
          + 'is the exact schema, and it is short enough to read end to end.',
      ],
    },
    {
      id: 'pipeline',
      heading: 'From a beacon to a row on this page',
      hasVisual: true,
      body: [
        'An event leaves the browser as sendBeacon, one JSON string, no preflight. The '
          + 'worker checks the origin, validates the body, drops anything that looks like a '
          + 'bot, and writes to a single landing table called event, append only. Nothing '
          + 'gets aggregated on the way in, because the free plan gives a scheduled job the '
          + 'same 10 millisecond CPU budget as a page request, and pulling thousands of rows '
          + 'into JavaScript to sum them would blow through that before it finished a single '
          + 'day.',
        'A cron job runs once a night and does the aggregating instead, entirely in SQL: '
          + 'one delete and one insert per serving table, per day, so re-running a day is '
          + 'always safe. Seven serving tables, one row per day per dimension, cover '
          + 'everything the dashboard below asks for. When you load this page, the query '
          + 'behind it reads only the closed days from those seven tables and the still-open '
          + 'day straight from the landing table, one batch, one request. The diagram below '
          + 'traces that exact path with the real counts attached to each stage.',
      ],
    },
    {
      id: 'no-cookies',
      heading: 'No cookie, and no consent banner to go with it',
      body: [
        'The value that groups a visit’s events together lives in a single JavaScript '
          + 'variable, set once when the page first loads and gone the moment the tab '
          + 'closes. It is never written to a cookie, to localStorage, or to sessionStorage. '
          + 'Writing to sessionStorage would still count as storing information on a '
          + 'visitor’s device under the rule that actually triggers consent language, and the '
          + 'exemption argument for that kind of storage is contested. A variable that exists '
          + 'only for the life of the document sidesteps the question instead of arguing it.',
        'The cost is real and I am not hiding it: a hard reload or a new tab starts a new '
          + 'visit, so the same person reading two pages in two tabs looks like two visits. '
          + 'Every internal link on this site is a soft navigation, so in practice that cost '
          + 'rarely shows up. It is a trade I would make again.',
      ],
    },
    {
      id: 'free-tier-math',
      heading: 'What the free tier actually allows',
      body: [
        'Cloudflare Workers’ free plan allows 100,000 requests a day. D1, the SQLite '
          + 'database behind it, allows 100,000 rows written and 5,000,000 rows read a day, '
          + 'both resetting at midnight UTC, with 500 MB of storage. Every event this site '
          + 'records costs three row writes, one for the table itself and one for each of the '
          + 'two indexes it needs, so a single page view with its duration reading costs six '
          + 'to twelve row writes depending on how many clicks happened along the way.',
        'That puts the binding constraint at roughly 11,000 page views a day before '
          + 'Cloudflare would start rejecting writes, three orders of magnitude past what a '
          + 'personal portfolio actually sees. The rollup tables exist so that reads never '
          + 'become the limit either: without them, a dashboard load a year from now would '
          + 'scan a landing table with millions of rows in it just to answer how many visits '
          + 'happened last week.',
      ],
    },
    {
      id: 'limits',
      heading: 'What these numbers cannot tell you',
      body: [
        'A content blocker or a privacy extension that strips sendBeacon calls makes a '
          + 'visit invisible to this pipeline entirely, so every number here is a floor, not '
          + 'a ceiling. The bot filter catches a user agent that announces itself as a '
          + 'crawler, and it does nothing against a script that sends a normal browser’s user '
          + 'agent on purpose. Visits are counted per UTC day, so a visit that starts at '
          + '11:58pm and ends at 12:02am counts once on each side of midnight, and I would '
          + 'rather state that than round it away.',
        'There is no identity that survives across visits, by design, so there is no '
          + 'returning-visitor number on this page and there never will be one without adding '
          + 'exactly the kind of persistent identifier the no-cookie decision above rules '
          + 'out. One more edge case worth naming: a tab restored from a browser’s '
          + 'back-forward cache days later can still send a duration reading for a page it '
          + 'visited earlier. That reading lands in the table, but if its day has already '
          + 'closed and been rolled up, it is not folded back into that day’s totals. The gap '
          + 'is small and I would rather disclose it than let the rollup look more exact than '
          + 'it is.',
      ],
    },
    {
      id: 'next-time',
      heading: 'What I’d do differently',
      body: [
        'The pipeline health query behind this page counts every row in the landing table '
          + 'with a plain SELECT COUNT(*), which is a full index scan and the single most '
          + 'expensive statement it runs. It is fine at the traffic this site gets, and it '
          + 'will stop being fine well before the table hits half a million rows. The fix is '
          + 'a counter column maintained by the write path instead of a count computed at '
          + 'read time, and I know exactly where that column goes when the day comes.',
        'The all-time median time on page is already an estimate, interpolated from a '
          + 'bucket histogram rather than computed exactly, because an exact median over '
          + 'every duration reading ever recorded would mean sorting a table that only '
          + 'grows. The 7 and 30 day windows still compute it exactly, because those slices '
          + 'are small enough to sort. Once the duration table passes a few hundred thousand '
          + 'rows, I would move those exact windows to the same estimated approach rather '
          + 'than wait for a query to time out and force the change.',
      ],
    },
  ],
  links: [
    {
      label: 'The ingestion worker and its migrations, this repository',
      href: 'https://github.com/pizonkhan/pizonkhan.github.io/tree/main/workers/site-analytics',
      kind: 'repo',
    },
    {
      label: 'The tracking script, this repository',
      href: 'https://github.com/pizonkhan/pizonkhan.github.io/tree/main/lib/analytics',
      kind: 'repo',
    },
    {
      label: 'Cloudflare D1 pricing and free-tier limits',
      href: 'https://developers.cloudflare.com/d1/platform/pricing/',
      kind: 'reference',
    },
  ],
  dataStatement:
    'Every number on this page comes from this site’s own visitor events, collected by '
    + 'the worker in workers/site-analytics and stored in a Cloudflare D1 database. Counts '
    + 'exclude anything sent from a local development origin and anything whose user agent '
    + 'matched the bot filter. Visits are counted per UTC day, so a visit that crosses '
    + 'midnight counts once on each side. Nothing here is sampled or seeded. One figure is '
    + 'estimated: the all-time median time on page is interpolated from the bucket '
    + 'histogram, and it is labelled as estimated wherever it appears.',
}
