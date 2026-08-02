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

## Data pipelines

Three offline scripts produce committed content this site renders. Each one is run manually,
once, by Pizon; none is wired into `npm run build` or `.github/workflows/deploy.yml`, so a
build never depends on Wikimedia Commons, NYC Open Data or a Python environment being
reachable.

| Script | Reads | Writes | Needs |
| --- | --- | --- | --- |
| `scripts/build-bird-assets.py` | Wikimedia Commons (photographs, licence and attribution via the API) | `content/data/bird-gallery.ts`, `public/projects/bird-species-cnn/gallery/<id>/*`, plus the featured robin's `bird-source.webp`, `luminance-28.json`, `activations.json` and activation sprites | Python 3 with `tensorflow`, `pillow`, `numpy`, and the ImageNet-pretrained VGG16 weights, cached locally after the first run |
| `scripts/build-nyc-sales-2025.mjs` | NYC Open Data's `w2pb-icbu`, downloaded to a gitignored `.data/` directory | `content/data/nyc-2025-sales.ts`, `content/data/nyc-2025-neighborhoods.ts`, `public/projects/nyc-home-sales-2025/points.json` and its five per-borough detail shards | Node only, no third-party package |
| `scripts/train-nyc-sales-2025.py` | The same CSV `build-nyc-sales-2025.mjs` downloads | `content/data/nyc-2025-models.ts` | Python with `numpy`, `pandas`, `scikit-learn`; `xgboost` is optional |

Every script prints what it did, including the counts a filter step removed, so its output can
be checked against the numbers quoted on the page rather than trusted blindly. Each script's own
header comment carries the exact download command and the isolated-environment setup for its
language. Rerunning one against a newer data pull is a manual act and a new commit, not a
scheduled job.

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
