/**
 * Everything the /business/ route and the landing page's Business section render.
 *
 * SOURCING RULE, same discipline as content/profile.ts. Every fact below is either derived
 * from the source project on disk (marked `Repo:`) or stated directly by Pizon (marked
 * `Confirmed directly by Pizon:`). Nothing here may be invented, rounded up, or inferred.
 *
 * WHAT MAY NEVER APPEAR HERE:
 *   - Revenue, ARR, bookings per day, fleet size, customer or driver counts, or any figure
 *     about the operating business rather than the software.
 *   - The three placeholder stats the source project itself flags as unverified
 *     ("30+ years serving NYC", "40+ vehicles", "10k+ rides per year").
 *   - The legal entity name, phone number, business address, EIN, or payment handles.
 *   - Any link to, or mention of, the source repository. It is private and stays unlinked.
 *   - His father's name.
 *
 * Counts below were taken on 2026-08-02. Each one carries the exact enumeration or the command
 * that produced it, so it can be rechecked rather than trusted.
 */

export type BusinessGlyphKind = 'route' | 'sedan' | 'board' | 'handoff'

export interface BusinessFigure {
  /** Pre-formatted for display. Never computed at render time. */
  value: string
  label: string
  /** Where this number came from. Required. */
  source: string
}

export interface BusinessAudience {
  id: string
  glyph: BusinessGlyphKind
  title: string
  body: string
}

export interface BusinessCapability {
  id: string
  title: string
  body: string
}

export interface BusinessLink {
  label: string
  href: string
  /** One short line under the link saying what it is. */
  note: string
}

export interface FareRow {
  label: string
  /** Whole US dollars. Illustrative, not a real rate. */
  amount: number
}

export const business = {
  eyebrow: 'Family business · New York',

  heading: 'The software behind my father’s chauffeur business.',

  // Confirmed directly by Pizon: his father has run a luxury chauffeur business in the New York
  // area since the 1990s, and Pizon took on its technology. No founding year is claimed: the
  // source project's own content checklist lists the founding year as still unknown.
  lead:
    'He has run it in New York since the 1990s. I rebuilt the technology around it: a booking '
    + 'site that prices a real route and takes payment, a portal where the office runs the whole '
    + 'day, one pricing engine behind every quote, and a chat assistant that hands off to a '
    + 'person the moment a question gets specific.',

  metaDescription:
    'The platform I built for my father’s New York chauffeur business: online booking and '
    + 'payment, a staff portal for the whole day, a pricing engine, and a chat assistant on Claude.',

  figures: [
    {
      value: '3',
      label: 'Portals on one platform',
      // Repo: three separate authenticated surfaces, each with its own sign-in route.
      // src/app/account/* (customers), src/app/driver/* (chauffeurs),
      // src/app/(console)/console/* (staff).
      source: 'Customers, chauffeurs and the office. Each has its own sign-in on the live site.',
    },
    {
      value: '14',
      label: 'Screens in the staff portal',
      // Repo: the sidebar in src/app/(console)/console/layout.tsx. In order: Dashboard,
      // Reservations, Dispatch board, Messages, Customers, Accounts, Finance, Reports,
      // Fraud reviews, Drivers, Vehicle pricing, Global modifiers, Users, My account.
      source: 'Counted in the project source, August 2026.',
    },
    {
      value: '13',
      label: 'Ordered steps in the pricing engine',
      // Repo: src/lib/pricing.ts header, "strict 13-step application order per the locked spec".
      source: 'The engine’s fixed application order.',
    },
  ] satisfies BusinessFigure[],

  background: {
    eyebrow: 'Background',
    heading: 'How it ran before.',
    body: [
      // Confirmed directly by Pizon: family relationship, the decade, and that he grew into the
      // technology side of it.
      // Repo: the platform's own services content (src/lib/content.ts) has service pages for
      // airport, corporate, weddings and charter.
      'My father has run a luxury chauffeur business in New York since the 1990s. Airport runs, '
      + 'corporate accounts, weddings, charters. I grew up around it, and for years the '
      + 'technology side of it was a WordPress site that could not give a customer a price or '
      + 'take a booking.',
      // Repo: the WordPress fix list in the source project's own notes records "No instant quote"
      // among the old site's gaps, and the staff portal ships a "create a booking by phone or
      // WhatsApp" flow precisely because that is how bookings arrive today.
      'Everything else ran on the phone. A customer called, someone worked out a price, a '
      + 'chauffeur got assigned, and the paperwork caught up later. I rebuilt that as software.',
    ],
  },

  platform: {
    eyebrow: 'The platform',
    heading: 'One platform, three sides.',
    audiences: [
      {
        id: 'customers',
        glyph: 'route',
        title: 'Customers',
        // Repo: /quote (Google Maps + pricing engine), /book (Stripe Payment Element),
        // /lookup, /account (trip history), /account/trips/[code] (detail + "Book this trip
        // again"), /account/trips/[code]/receipt, /account/payment-methods (saved cards).
        body:
          'A customer sets pickup and drop-off on a real map, sees the price for the vehicle they '
          + 'want before anything is committed, books and pays. Afterwards they have an account: '
          + 'past trips, receipts, saved cards, and a one-click rebook of a trip they have taken '
          + 'before.',
      },
      {
        id: 'chauffeurs',
        glyph: 'sedan',
        title: 'Chauffeurs',
        // Repo: /drive (apply), /driver/signup, /driver/onboarding, the drivers review and
        // approve panel in the staff portal, /driver (job feed), /driver/earnings.
        body:
          'Chauffeurs apply through the site, upload their licence and insurance, and get reviewed '
          + 'by the office. Once approved they have their own portal: the jobs they have been '
          + 'offered, accept or decline, and what they have earned.',
      },
      {
        id: 'office',
        glyph: 'board',
        title: 'The office',
        // Repo: src/lib/auth/roles.ts declares exactly five roles (owner, developer,
        // administrator, dispatcher, viewer); the capability matrix puts money and reviews with
        // administrators, and pay, pricing and user management with the owner.
        body:
          'One portal for the whole operation. Reservations, the day’s dispatch board, customer '
          + 'messages, money and reporting, with five permission levels, so a dispatcher works the '
          + 'day, an administrator works the money, and pay and pricing stay with the owner.',
      },
    ] satisfies BusinessAudience[],
  },

  portal: {
    eyebrow: 'Employee portal',
    heading: 'The whole day in one place.',
    // Confirmed directly by Pizon: before the platform, the day ran on the phone. No claim about
    // paper or spreadsheets. Nothing in the source project records how the office kept the day.
    intro:
      'This is the part I am proudest of. The day used to run on the phone. Now it is one '
      + 'portal, and everything that happens to a trip is recorded against it.',
    capabilities: [
      {
        id: 'reservations',
        title: 'Reservations',
        // Repo: /console/reservations list (search, multi-select status chips, pagination),
        // /console/reservations/new with three fare types (engine fare, hourly, flat negotiated),
        // capture/refund actions, and the append-only reservation_events audit trail.
        body:
          'Every booking in one list, whether it came from the website or a phone call, with '
          + 'search, filters and the status of each trip. A dispatcher can create one from '
          + 'scratch, price it three different ways, take payment, and see the whole history of '
          + 'what happened to it.',
      },
      {
        id: 'dispatch',
        title: 'Dispatch board',
        // Repo: /console/dispatch day view (hour timeline or column-per-chauffeur swimlane with
        // a red Unassigned column), inline quick-assign, and the seven-day week grid.
        body:
          'The day laid out by hour or by chauffeur, with an unassigned column that is the '
          + 'to-do list. Assign from the card without leaving the board. A week view shows the '
          + 'next seven days and where the gaps are.',
      },
      {
        id: 'messages',
        title: 'Messages',
        // Repo: /console/messages, real-time via Supabase Realtime, filters for needs-reply /
        // active / bot / resolved, agent "Take over" and "Hand back to bot", and contact-form
        // inquiries landing as threads in the same inbox.
        body:
          'Every website chat and contact form lands in one inbox, live. Threads are filtered by '
          + 'whether someone is waiting on a reply, and an agent can take over from the assistant '
          + 'at any point.',
      },
      {
        id: 'finance',
        title: 'Finance',
        // Repo: /console/finance, six tabs. Payments ledger covers card captures, refunds, bank
        // transfers, cash, invoice payments and chauffeur payouts, each row deep-linked to its
        // trip, account, invoice and chauffeur. Card rows land unsettled and are marked settled
        // against the bank statement. Invoices carry aging buckets.
        body:
          'A ledger of every real movement of money: card captures, refunds, bank transfers, '
          + 'cash, invoice payments and chauffeur payouts, each linked back to the trip it came '
          + 'from. Corporate accounts get invoices with aging buckets, and card rows stay '
          + 'unsettled until someone confirms them against the bank statement.',
      },
      {
        id: 'business-analytics',
        title: 'Business analytics',
        // Repo: /console/reports over 30d / 90d / 12m windows bucketed in America/New_York
        // (src/lib/console/analytics-calc.ts). KPIs: trips, average fare, booked against
        // collected revenue from the ledger, cancellation rate, new against returning customers.
        // Breakdowns by vehicle, payment method and fare type.
        body:
          'Trips and money over a rolling window, in New York time: booked against actually '
          + 'collected, average fare, cancellation rate, new against returning customers, and '
          + 'breakdowns by vehicle, payment method and fare type.',
      },
      {
        id: 'employee-analytics',
        title: 'Employee analytics',
        // Repo: the driver-activity table on /console/reports (assigned, completed, earnings),
        // driver payables in Finance, per-trip pay with mark-paid on the chauffeur's page, and
        // the year-end 1099 generated from the same records.
        body:
          'Per-chauffeur activity across the same window: trips offered, trips completed, '
          + 'earnings, and what is still owed. Payouts get recorded from the same page, and the '
          + 'year-end tax form comes out of the same records.',
      },
    ] satisfies BusinessCapability[],
  },

  pricing: {
    eyebrow: 'Pricing',
    heading: 'Every quote comes out of one engine.',
    body: [
      // Repo: src/lib/pricing.ts (three pricing models, 13-step order), src/lib/routes.ts
      // (Google Routes API), per-vehicle pricing_configs edited at /console/vehicles/[slug].
      'Before, a price came from whoever picked up the phone. Now every quote, on the website or '
      + 'in the office, comes out of the same engine. It takes the real route from Google, '
      + 'applies the rate model configured for that vehicle, adds only the conditions that '
      + 'actually apply to the trip, and returns one number.',
      // Repo: pricing.ts invariants. Only the highest of peak / holiday / late-night applies.
      // Gratuity is taken on the base fare and baked into the total, never a visible line item.
      // Tolls are per-vehicle: Google's estimate times a class-aware premium, or a flat amount.
      'The rules that matter are the ones that stop a price running away. Peak, holiday and '
      + 'late-night never stack, the highest one wins. Gratuity is inside the number the customer '
      + 'sees, not a line added at the end. Tolls are estimated per vehicle class, because a bus '
      + 'does not pay what a sedan pays. The office changes any of it from the portal and the '
      + 'website prices the next quote with it.',
    ],
    fare: {
      figureEyebrow: 'SAMPLE FARE',
      figureTitle: 'How one quote adds up',
      figureCaption: 'Illustrative numbers on an invented trip, not a live quote.',
      figureSource:
        'Sample figures chosen for this page. Real rates are configured per vehicle in the '
        + 'portal and are not published here.',
      tableCaption: 'Illustrative fare components for a sample trip, in US dollars.',
      totalLabel: 'What the customer sees',
      // Illustrative only. Deliberately round numbers that sum to a round total, so nobody can
      // read a real rate card out of them.
      rows: [
        { label: 'Base fare', amount: 95 },
        { label: 'Distance', amount: 62 },
        { label: 'Late night', amount: 24 },
        { label: 'Tolls', amount: 18 },
        { label: 'Taxes and fees', amount: 21 },
        { label: 'Gratuity, included', amount: 30 },
      ] satisfies FareRow[],
      total: 250,
    },
  },

  assistant: {
    eyebrow: 'Customer chat',
    heading: 'An assistant that knows what not to answer.',
    body: [
      // Repo: src/lib/anthropic.ts uses @anthropic-ai/sdk against a Claude model; src/lib/chat/
      // bot.ts builds a system prompt whose knowledge base is seeded and edited by the office,
      // and instructs the model to answer only from it.
      'The chat on the website is built on Anthropic’s Claude API. It answers from a knowledge '
      + 'base the office controls, and only from that: coverage, vehicles, how booking works, '
      + 'what is included.',
      // Repo: bot.ts exposes a single escalate_to_human tool and instructs the model to call it,
      // without writing an answer, for anything about a specific reservation, payment, refund,
      // change, cancellation or complaint, and never to invent prices, availability or policy.
      // The escalated thread surfaces in the office inbox; after about five minutes with no
      // agent reply the widget asks the customer for an email.
      'The design decision that matters is where it stops. Pricing, availability, policy, and '
      + 'anything about a specific trip, payment, refund, change or complaint are all outside '
      + 'what it is built to answer. Those go to a person: the thread is handed off and shows up '
      + 'in the office inbox marked as waiting. If nobody replies within a few minutes the '
      + 'customer is asked for an email, so the office can follow up after they have left the '
      + 'site.',
    ],
    glyphCaption: 'Three questions the assistant can answer. The fourth goes to a person.',
  },

  modernization: {
    eyebrow: 'Before and after',
    heading: 'Replacing the WordPress site.',
    body:
      // Repo: README describes the project as a rebuild of newyorklimo.net, notes the production
      // target is that domain with the DNS cutover still pending, and that the domain currently
      // points at the old WordPress site.
      'newyorklimo.net is the site the business has had for years. It is WordPress, and it cannot '
      + 'give a customer a price or take a booking. The replacement is a Next.js application: an '
      + 'instant quote off a real route, booking and payment online, a trip lookup, a customer '
      + 'account, an application flow for chauffeurs, and the whole office portal behind it. It '
      + 'runs at its own address while the domain still points at the old site.',
    links: [
      {
        label: 'The platform',
        href: 'https://newyorklimo-web.vercel.app/',
        note: 'What I built. Live.',
      },
      {
        label: 'The site it replaces',
        href: 'https://newyorklimo.net/',
        note: 'The WordPress site still on the domain.',
      },
    ] satisfies BusinessLink[],
  },

  stack: {
    eyebrow: 'Stack',
    heading: 'Built with.',
    // Repo: package.json dependencies and the locked stack section of the project's own notes.
    items: [
      'Next.js',
      'TypeScript',
      'React',
      'Tailwind CSS',
      'Supabase',
      'PostgreSQL',
      'Row-level security',
      'Stripe',
      'Google Maps Platform',
      'Anthropic Claude API',
      'Vercel',
      'shadcn/ui',
    ],
  },

  skills: {
    heading: 'What it took.',
    items: [
      // Repo: 38 versioned SQL migrations under supabase/migrations as of 2026-08-02.
      'Schema design and versioned migrations against a live Postgres database',
      // Repo: src/lib/auth/roles.ts plus mirrored SQL policy helpers on every table.
      'Row-level access control across five permission levels',
      // Repo: manual-capture authorisation, capture, refund, early-fraud-warning queue and a
      // chargeback evidence composer.
      'Payment authorisation, capture, refunds and chargeback evidence',
      'A pricing engine with a fixed order of operations',
      // Repo: bot.ts seeds the model's knowledge base from office-edited content and exposes a
      // single escalate_to_human tool for everything outside it. See assistant.body above.
      'An LLM application scoped to a knowledge base the office controls, with everything else '
      + 'handed to a person',
      'Analytics windowed in the operation’s own timezone',
      'Three separate authenticated portals on one codebase',
      'The design system, the marketing pages and the whole front end',
    ],
  },

  landing: {
    eyebrow: 'Family business',
    heading: 'Building the software behind my father’s business.',
    // Confirmed directly by Pizon: the business, the decade, and that the work came in by phone.
    // Same claims as `background`, worded shorter for the landing page.
    body:
      'My father has run a luxury chauffeur business in New York since the 1990s, booked over the '
      + 'phone. I built the platform it runs on now: customers quote and book online, the office '
      + 'works reservations, dispatch and money in one portal, and every price comes out of one '
      + 'engine.',
    linkLabel: 'How I built it',
    href: '/business/',
  },
} as const
