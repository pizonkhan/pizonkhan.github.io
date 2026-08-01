# pizonkhan.github.io

Personal portfolio for Pizon Khan, Director of Credit Analytics. Next.js 15 static export,
deployed to GitHub Pages via Actions.

Project pages here are demonstrations: each one renders an animated, interactive visualisation
of the actual pipeline, model or data behind it, so the engineering is legible without reading
a line of code.

## Commands

```bash
npm run dev        # localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint
npm run build      # the real gate: static export to out/
npm run serve      # serve the built export
```

`npm run build` is the gate that matters. This is `output: 'export'`, and a class of Next.js
mistakes only surfaces at export time, never in `dev`.

## Hard constraints

- **Static export.** No route handlers, no middleware, no `force-dynamic`, no request-time
  data fetching, no `next/image` optimisation. Content is baked in at build time from typed
  modules under `content/`.
- **Asset paths go through `withBasePath()`** (`lib/base-path.ts`). Never hardcode a
  leading-slash asset path or an absolute origin.
- **`prefers-reduced-motion` is mandatory** on every animation.
- **Accessibility.** Every visualisation needs a text or table equivalent, keyboard
  reachability where interactive, and meaning never carried by colour alone.

## Content integrity

This is a real person's professional portfolio, and Pizon works at a bank.

- Biographical fact, employers, titles, dates, metrics and credentials, comes from
  `content/profile.ts`, transcribed from the resume. Nothing here is invented.
- Every figure in a visualisation is clearly synthetic or drawn from a public dataset.
- Private and employer-adjacent repositories stay unlinked from this site.

## Asset prep

### Portrait

The only source photographs live in `Photos/`, which is gitignored: only the derived,
EXIF-stripped crops in `public/img/` are committed. `sharp-cli` was not needed: `sharp` is
already a transitive dependency of `next`, so the crop ran directly against it. This is the
command that produced the committed files from `Photos/IMG_4601.jpg` (note: omitting
`withMetadata()` entirely is what strips EXIF: calling `withMetadata(false)` does not):

```bash
node -e "
const sharp = require('sharp');
(async () => {
  await sharp('Photos/IMG_4601.jpg')
    .extract({ left: 0, top: 180, width: 640, height: 640 })
    .toColorspace('srgb')
    .webp({ quality: 82 })
    .toFile('public/img/portrait-640.webp');

  await sharp('public/img/portrait-640.webp')
    .resize(256, 256)
    .webp({ quality: 82 })
    .toFile('public/img/portrait-256.webp');
})();
"
```

Any equivalent tool is acceptable, provided the committed outputs satisfy: exact pixel
dimensions (256x256 and 640x640), WebP, sRGB, no EXIF block, and the size budgets
`portrait-640.webp` <= 55 KB and `portrait-256.webp` <= 18 KB.

### Logo

`public/logo/` holds Pizon's brand kit, committed byte-identical to what he supplied. Do not
re-author, re-tint, re-export or minify any file in it. Read `public/logo/README.md` before
touching anything that references it.

This site uses exactly one form of the mark: the stack mark, alone.

- `pk-stack-ink.svg` and `pk-stack-light.svg` are the only mark files a route renders, through
  `components/site/Wordmark.tsx`. Ink on light surfaces, light on dark, toggled by CSS with no
  render-time branch.
- The lockup files (`pk-lockup-*.svg`) are not used. They set live text in Archivo and carry
  the descriptor "Data & AI Engineering", which is not the title on the resume. Neither the
  font nor the descriptor is loaded or rendered anywhere on this site.
- Clear space around the mark is 20 of its 232 design units on every side, expressed in CSS as
  `padding: calc(var(--wordmark-h) * 0.0862)` so it stays exact at any rendered height.
- Below 24px tall, the kit's own rule is to switch to the P-only `pk-favicon-16.svg`, which is
  exactly what the favicon does.
