# pizonkhan.github.io — professional portfolio

Personal portfolio for **Pizon Khan**, Director of Credit Analytics at Webster Bank (NYC).
Next.js 15 static export, deployed to GitHub Pages via Actions.

## The thesis

A recruiter will not clone a repo. The differentiator here is that **project pages are
demonstrations** — an animated, interactive visualization of the actual pipeline, model or
data, rendered on the page, that makes the engineering legible in ten seconds. Every project
page should answer: *what does the visitor see moving here that proves the work?*

## Commands

```bash
npm run dev        # localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint
npm run build      # THE gate — static export to out/
npm run serve      # serve the built export
```

`npm run build` is the real gate. This is `output: 'export'`, and a whole class of Next.js
mistakes only surfaces at export time, never in dev.

## Hard constraints

- **Static export.** No route handlers, no middleware, no `force-dynamic`, no request-time
  data fetching, no `next/image` optimization. `generateStaticParams` is required on every
  dynamic route. Content is baked in at build time from typed modules under `content/`.
- **Asset paths go through `withBasePath()`** ([lib/base-path.ts](lib/base-path.ts)). Never
  hardcode a leading-slash asset path or an absolute origin.
- **`prefers-reduced-motion` is mandatory** on every animation. No exceptions.
- **Accessibility:** every visualization needs a text or table equivalent, keyboard
  reachability where interactive, and meaning never carried by color alone. Contrast must
  hold in both light and dark themes.

## Content integrity — the rule that matters most

This is a real person's professional portfolio, and Pizon works at a bank.

- **Never invent biographical fact.** Employers, titles, dates, metrics and credentials come
  from [content/profile.ts](content/profile.ts), which is transcribed from the resume. If
  something is missing, leave a `TODO(pizon):` marker — a visible blank beats a plausible
  fabrication.
- **Every figure in a visualization must be clearly synthetic or from a public source.**
  Nothing that could read as real bank data, real client names, or internal systems.
- **Private repos stay private and unlinked.** Commercial and employer-adjacent projects get
  write-ups and visuals, never a code link.

## Voice

- **No em dashes anywhere displayed** — not in site copy, not in code comments, not in commit
  messages that end up in visible history. Use a period, a comma, or restructure the sentence.
- **Nothing reads as AI-generated.** No "Let's dive in", no triplet lists for their own sake, no
  meta-commentary about the writing itself. Site copy is Pizon's voice: direct, specific, no
  filler.
- **No comment, string, or file anywhere may reference Claude, AI authorship, or generation.**
  This applies to code comments and to any user-facing text.

## Layout

```
app/               App Router routes
components/        Shared UI; heavy visualizations are next/dynamic + ssr:false
content/           Typed content modules — the only source of biographical fact
lib/               Helpers (base-path, hooks)
docs/plans/        Specs written by the planner agent
.claude/agents/    planner (Opus 5) · developer (Sonnet 5) · reviewer (Fable 5) · tester (Sonnet 5)
.claude/workflows/ portfolio-build.js — the plan→build→verify→fix→gate pipeline
```

## Building features

Non-trivial work goes through the `portfolio-build` workflow rather than being written
straight through. Each stage runs in its own context: Opus 5 plans at extra-high effort,
Sonnet 5 implements, Fable 5 reviews adversarially, Sonnet 5 verifies by actually running
the build. The reviewer and tester never see each other's conclusions, so when they agree
it means something.

## Deployment

Push to `main` → Actions runs typecheck, lint and build, then publishes `out/` to Pages.
The site is a GitHub Pages **user site**, so the repo must be named `<username>.github.io`
and `basePath` is empty.
