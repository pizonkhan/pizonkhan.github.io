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

export interface PricingFlowStep {
  id: string
  title: string
  /** One short sentence. No dollar amounts, no fee names, ever. */
  body: string
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
      source: 'Everything from the dispatch board to fraud reviews, in one sidebar.',
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
    intro: [
      // Repo: three route surfaces (src/app/account/*, src/app/driver/*, src/app/(console)/console/*)
      // share one Next.js app and one Supabase project; package.json has a single dependency tree,
      // there is no separate repo per portal.
      'All three sides are one Next.js application on one Supabase project, not three separate '
      + 'codebases stitched together. Customers, chauffeurs and the office all read and write '
      + 'against the same Postgres database, and the tables that matter have row-level security '
      + 'turned on, so the database enforces who can see what, not just the page that renders it.',
      // Repo: src/lib/auth/roles.ts declares five roles and the permission predicates (canManageUsers,
      // canManagePricing, canAdminTeam, etc); its own header comment states those predicates are
      // mirrored by SQL helper functions (is_developer(), can_admin_team(), etc) that the Postgres
      // policies in supabase/migrations/*.sql call directly, confirmed against policies on
      // pricing_configs, global_modifiers, invoices, transactions, chat_conversations, chat_messages,
      // kb_entries, accounts and reservations.
      'The five roles from the office side are the clearest example. What a dispatcher, an '
      + 'administrator or an owner can do is defined once in the application and mirrored as SQL '
      + 'policies in Postgres, so the same boundary is enforced twice, in two different layers, '
      + 'rather than trusted to the front end alone.',
    ] satisfies readonly string[],
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
        // Repo: /console/messages, src/app/(console)/console/messages/realtime.tsx. ChatRealtime
        // subscribes via supabase.channel(...).on('postgres_changes', ...) to the chat_messages and
        // chat_conversations tables, filtered by conversation_id when viewing one thread. Its own
        // comment: "Supabase Realtime respects RLS, so this only delivers rows the signed-in staff
        // user can read." A 400ms setTimeout coalesces bursts before calling router.refresh(). Filters
        // for needs-reply / active / bot / resolved, agent "Take over" and "Hand back to bot" per the
        // existing figures/portal sourcing above.
        body:
          'Every website chat and contact form lands in one inbox, live. It runs on Supabase '
          + 'Realtime: the console subscribes directly to the conversation and message tables, so a '
          + 'new message shows up without polling, and a burst of them coalesces into a single '
          + 'refresh instead of redrawing the page for each one. The same row-level security that '
          + 'gates the rest of the console gates the subscription, so an agent only ever receives '
          + 'updates for threads their role can already read. Threads are filtered by whether someone '
          + 'is waiting on a reply, and an agent can take over from the assistant at any point.',
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
      // Repo: src/lib/pricing.ts (rate models, one evaluation path shared by the booking site and
      // the console), src/lib/routes.ts (Google Routes API for the real route distance).
      'Before, a price came from whoever picked up the phone. Now every quote, on the website or '
      + 'in the office, comes out of the same engine, using the same rate model and the same real '
      + 'route from Google, whether a customer is looking at a screen or a dispatcher is booking a '
      + 'call-in trip over the phone.',
      // Repo: supabase/migrations/20260517145703_initial_schema.sql. pricing_configs is one JSONB
      // row per vehicle (vehicle_slug primary key, model + every fee as JSONB); global_modifiers is
      // a single row (id integer primary key default 1 check (id = 1)) for fleet-wide settings.
      // Both `enable row level security`. The `_select` policies use `using (true)`, per the
      // migration's own comment: "publicly SELECT-able so the marketing /quote page can render
      // without a session." The `_write_owner_dev` policies restrict writes to
      // `current_user_role() in ('owner','developer')`, matching canManagePricing() in
      // src/lib/auth/roles.ts. The portal write surfaces are
      // src/app/(console)/console/vehicles/[slug]/actions.ts and
      // src/app/(console)/console/modifiers/actions.ts. There is no cache between a write and the
      // next read: fetchPricingConfigs uses only React's request-scoped cache(), and the quote route
      // queries the table directly.
      'The rate models and every fee live in Postgres, not in a spreadsheet or a config file that '
      + 'ships with a deploy. Each vehicle has its own pricing row, and there is one more row of '
      + 'fleet-wide settings behind it. Row-level security means only the owner or developer role '
      + 'can write to either, the same boundary enforced everywhere else on the platform, while the '
      + 'booking site reads them on every quote. Change a rate in the portal and the very next '
      + 'quote uses it. No redeploy, no waiting on a release.',
    ],
    flow: {
      figureEyebrow: 'PRICING CONFIG',
      figureTitle: 'How a rate change reaches a quote',
      figureCaption: 'The path from an edit in the portal to a live quote on the site.',
      // Repo: same migration citation as pricing.body[1] above.
      figureSource:
        'Rate models and fleet settings live in Postgres, gated by the same role checks used '
        + 'everywhere else on the platform.',
      tableCaption: 'The three-step path from a portal edit to a live quote, in words.',
      steps: [
        {
          id: 'edit',
          title: 'Edit',
          body: 'An owner or developer changes a rate model or a fleet-wide setting in the portal.',
        },
        {
          id: 'write',
          title: 'Write',
          body: 'Row-level security checks the role before the write reaches the table. Everyone else can read it, only that role can change it.',
        },
        {
          id: 'quote',
          title: 'Quote',
          body: 'The booking site and the office read the same row on the very next quote. Nothing to redeploy.',
        },
      ] satisfies readonly PricingFlowStep[],
    },
  },

  assistant: {
    eyebrow: 'Customer chat',
    heading: 'An assistant that knows what not to answer.',
    body: [
      // Repo: src/lib/anthropic.ts uses @anthropic-ai/sdk against a Claude model; src/lib/chat/
      // bot.ts builds a system prompt whose knowledge base is seeded and edited by the office,
      // and instructs the model to answer only from it.
      // Repo: src/lib/chat/customer-actions.ts queries .from("kb_entries");
      // supabase/migrations/20260614000000_add_live_chat.sql creates kb_entries with
      // kb_entries_read_admin / kb_entries_write_admin RLS policies. bot.ts injects the KB content
      // into the system prompt at request time, so an edit is live on the next message.
      'The chat on the website is built on Anthropic’s Claude API. It answers from a knowledge '
      + 'base the office controls, and only from that: coverage, vehicles, how booking works, '
      + 'what is included. That knowledge base is its own table in the same Postgres database as '
      + 'everything else, and the bot reads it fresh on every message, so what the assistant is '
      + 'allowed to say changes the moment the entries change, not on the next deploy.',
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
    body: [
      // Repo: README describes the project as a rebuild of newyorklimo.net, notes the production
      // target is that domain with the DNS cutover still pending, and that the domain currently
      // points at the old WordPress site.
      'newyorklimo.net is the site the business has had for years. It is WordPress, and it cannot '
      + 'give a customer a price or take a booking. The replacement is a Next.js application: an '
      + 'instant quote off a real route, booking and payment online, a trip lookup, a customer '
      + 'account, an application flow for chauffeurs, and the whole office portal behind it. It '
      + 'runs at its own address while the domain still points at the old site.',
      // Repo: README.md, "Live: https://newyorklimo-web.vercel.app (auto-deploys on push to main)"
      // and "Hosting: Vercel (frontend + server actions)". src/app/api/stripe/webhook/route.ts is the
      // webhook that reconciles charge state; the booking flow authorises with
      // capture_method: "manual", which is what makes a stale hold a real customer-facing problem.
      // vercel.json defines one cron: { path: "/api/cron/reservation-janitor", schedule: "0 6 * * *" },
      // which is UTC, so it runs overnight in New York. The route's own header comment explains it
      // reconciles reservations stuck in pending_payment past Stripe's PaymentIntent auto-expiry by
      // checking each one's live PaymentIntent status and cancelling/releasing the hold rather than
      // letting it expire silently, explicitly skipping already-succeeded ones for a human to review.
      'The new site deploys to Vercel automatically on every push to main, both the front end and '
      + 'the server actions behind it. Payments run through Stripe, and a webhook keeps the '
      + 'database in step with what Stripe actually did on each charge, but a webhook can be '
      + 'missed. So a Vercel Cron job runs overnight, checks every reservation still marked as '
      + 'awaiting payment against Stripe’s own record of it, and releases the hold on anything that '
      + 'never actually went through, instead of leaving a customer’s card authorized against a '
      + 'booking nobody will ever confirm.',
    ] satisfies readonly string[],
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
      // Repo: vercel.json cron + src/app/api/cron/reservation-janitor/route.ts, see modernization
      // sourcing above.
      'A daily reconciliation job that checks stale payments against Stripe instead of trusting a webhook alone',
      'A pricing engine with a fixed order of operations',
      // Repo: bot.ts seeds the model's knowledge base from office-edited content and exposes a
      // single escalate_to_human tool for everything outside it. See assistant.body above.
      'An LLM application scoped to a knowledge base the office controls, with everything else '
      + 'handed to a person',
      'Analytics windowed in the operation’s own timezone',
      'Three separate authenticated portals on one codebase',
      // Repo: src/app/(console)/console/messages/realtime.tsx, see portal.capabilities messages
      // sourcing above.
      'A live console inbox wired to Supabase Realtime, filtered through the same row-level security as everything else',
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
