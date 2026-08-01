# Foundation & Design Language

## Goal

After this ships, a recruiter who lands on `https://pizonkhan.github.io` sees, in three
seconds, who Pizon is and what he does — and in thirty seconds can watch New York City
assemble itself out of 59,350 real housing listings, recolour by median price, and answer
"where does the money live" without reading a word. They can move from that demonstration to
a credentials surface that states his bank accomplishments as written on his résumé, with no
company-specific artifact anywhere on the site. This plan settles the design system (type,
colour, spacing, motion, imagery, the logo and favicon, and how every data visualisation is
styled so they read as one family), the route map, the landing page, the reusable
project-demonstration template, and both capstone project pages in enough detail to build and
test.

---

## Revision log

**Revision 1.** Three changes, all of them Pizon's calls, plus every downstream section they
touch.

1. **The colour system now comes out of his own branding.** The teal-chrome system is
   withdrawn. Every neutral in both themes is derived from the three colours the logo kit
   documents, Ink `#0B0C0E`, Graphite `#6E7478` and Paper `#F6F6F4`, so the site reads as the
   same object as the mark rather than a site the mark was pasted onto. Chrome moves to one
   azure accent, `#12539E` light and `#79ACF2` dark. Every contrast ratio in the Colour section
   was recomputed from the new base colours and none of the old numbers survive. The magma
   sequential ramp, the categorical series and the diverging ramp are untouched.
2. **The logo slot is filled.** `public/logo/` holds real assets, so `site.logo` is no longer
   `null` and `Wordmark` renders the stack mark from day one. The typographic K-plus-square
   fallback is withdrawn. The lockup files, the descriptor "Data & AI Engineering" and the
   Archivo font the lockups depend on are all explicitly out, because the only professional
   headline this site states is the one in `content/profile.ts`. A real favicon and
   apple-touch-icon come with the mark, so the create-next-app `.ico` goes.
3. **Project pages interleave theory and demonstration.** Pizon's instruction: open with an
   overview of the project and the results, then work through the core topics with a
   visualisation demonstrating each one. So `ProjectSection` gains a `visual` slot,
   `ProjectLayout` places section visuals inline instead of bundling figures at the end, the
   NYC page splits into theory beats with `ImputationSpread` (new), `BoroughSpread` and
   `ModelLadder` each attached to the beat it proves, and the bird page's five distillation
   stages become five theory sections with `ResultsLadder` promoted to the top as the results
   overview.

Updated in the same pass so the document stays consistent: the text of assumptions 8 and 9
(numbering unchanged), the design-language governing rule, the Colour and elevation tokens, the
logo section, the `Wordmark`, `ProjectLayout`, `ProjectSection`, `ProjectSectionBlock` and
`content/site.ts` contracts, both project content specs and their Visual and motion design
sections, the Task 1, Task 2 and Task 4 manifests and notes, acceptance criteria 15, 17, 23,
32, 39, 46 and 47 plus new criteria 60 to 73, the Out of scope list, and open questions 2 and
4. Task identities and numbering did not move. Nothing in the type scale, the spacing, radius
and elevation scale, the motion vocabulary and its durations, the accessibility rules, the
imagery and portrait section, the employment-boundary rule or the content-integrity rules
changed.

**Revision 2.** Nine review findings, resolved in place, plus five defects found on a final
self-pass. The goal, the task identities, every data table and every content-integrity rule are
unchanged.

1. **`ssr: false` cannot appear in a Server Component on Next 15.** The canonical route sample
   called `next/dynamic` with `{ ssr: false }` inside `app/projects/<slug>/page.tsx`, which
   exports `metadata` and is therefore a Server Component. `next build` on 15.5.22 fails that
   with *"`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it
   into a Client Component."* **Route shape** is rewritten: the page stays a Server Component
   and keeps its `metadata`, and every `dynamic()` call plus the 200 px viewport gating moves
   into one `'use client'` wrapper per project, `components/projects/nyc/NycVisuals.tsx`. The
   bird page gets the same two-file shape in wave 2.
2. **`BoroughSpread`'s p30 to p70 band was invisible.** `--accent-wash` on the `--surface-2`
   figure well measures 1.00:1 light and 1.14:1 dark, so the interquartile spread the caption
   calls the story could not be seen in either theme. The whisker, the band and the median tick
   are re-specified in tokens that clear 3:1 on the well in both themes, and the three pairs are
   published as a measured table that criterion 17 now covers. The `--border-strong` whisker
   went with it at 1.42:1 and 1.63:1, which is acceptable for an axis and not for data.
3. **The accent rule is stated precisely instead of absolutely.** Accent marks where the user
   is, never what a number is. Criterion 67 enumerates four sanctioned chrome uses, which covers
   `KernelSweep`'s window outline and `PriceSurface`'s selection glow, and `BoroughSpread` now
   contains no accent token at all.
4. **`Wordmark`'s accessible name no longer needs a render-time theme branch.** Both `<img>`
   elements carry `alt={logo.alt}` and neither carries `aria-hidden`; `display: none` already
   removes the inactive one from the accessibility tree.
5. **`ProjectSectionBlock`'s doc comment stopped mandating a `problem` section** that the bird
   record does not have. Only `next-time`-last is universal now.
6. **`FigureSkeleton` exists.** The route sample used it and nothing specified it. It is in the
   Task 1 manifest with a contract that makes criterion 35's zero-shift reservation real.
7. **Four em dashes were about to ship** in `site.title`, the NYC tagline, the NYC
   demonstration sentence and a code comment. All four are rewritten, and a new
   **Copy and voice** section plus criterion 76 make the rule checkable.
8. **Task 3's file count** matches its table: 15, not 16.
9. **The hero kernel pass is 14 rows, not 16.** A 3x3 valid convolution over a 16x16 input has
   `size - 2` window positions, which is the convention the bird page and the component contract
   already used. 14 x 90 ms = 1.26 s.

The same 3:1 test then failed two more figures that the review did not reach, so they are fixed
here too: `ModelLadder`'s winning bar was `--viz-seq-7` at 1.66:1 on the light well and its other
bars were `--text-tertiary` at 40% (1.72:1), and `ImputationSpread`'s imputed segment was
`--viz-seq-4` at 2.49:1 on the dark well with observed bars at 60% alpha (2.39:1). The Colour
section now states which class of mark owes 3:1 and which does not, so this is a rule the next
figure can be checked against rather than a list of three fixes.

Found on the self-pass and fixed in the same revision. `var()` does not resolve inside a canvas,
so `lib/viz/palette.ts` now exports literal `HAIRLINE` and `ACCENT` values keyed by theme and a
new `lib/theme.ts` supplies the active theme; `PriceSurfaceCanvas` needs both and `ThemeToggle`
needed a home for its state anyway. The Task 2 note named a client, "Capital Fortune", which the
record's own `summary` correctly anonymises to "a mid-west REIT". Assumption 15 records that a
stale, untracked, pre-revision partial build is already on disk under `content/site.ts`,
`lib/motion.ts`, `lib/format.ts` and `lib/viz/`, and that those files are overwritten rather than
extended. Criterion 68 greps for the word `teal` as well as the withdrawn hexes, because that
stale `lib/viz/palette.ts` still says it. And the four NYC figures now carry their eyebrow,
title, caption and source copy in writing, because `FigureSkeleton` prints the eyebrow and title
before the chunk lands and two developers would otherwise write two different ones.

---

## Assumptions

1. **The employment boundary is enforced structurally, not by memory.** Bank work lives only
   on `/experience/` and only as text sourced from `content/profile.ts`. The
   `ProjectRecord` type has **no employer field**, the projects registry is a closed array of
   personal projects, and no file under `app/experience/` or `components/experience/` may
   import from `components/viz/`, `components/projects/` or `content/projects/`. That last
   rule is grep-checkable and appears in the acceptance criteria.
2. **Generic technique explainers are inside Pizon's line.** He wrote: *"we can show the PD
   and LGD models but it has to be in general terms and topics not specific weights and model
   parameters."* So `/experience/` carries short, text-only explainers of PD/LGD dual risk
   rating, weights-of-evidence binning, and point-in-time snapshots — with **no numbers, no
   thresholds, no interactive demo, no diagram of a real pipeline**. If Pizon wants even this
   removed, it is one file (`content/techniques.ts`) and one component. See Open Questions.
3. **The Springboard capstone repo is public and may be linked.**
   `https://github.com/pizonkhan/Springboard-Data-Science` is public (verified: the shallow
   clone in this session has that remote). The private-repo policy applies to employer-adjacent
   and commercial work; these two capstones are neither. So these two project pages *may* carry
   a source link, and that is part of what distinguishes them from the bank work.
4. **Only one `izinex` reference exists in the tracked source.** `grep -rn izinex` over the
   repo returns exactly one hit: `content/profile.ts:34`. The brief said two places; the second
   occurrence is in `Resume/PizonKhanResume_080126.docx`, which is `.gitignore`d and never
   shipped. Fixing the resume document is out of scope for a code change; the manifest fixes
   `content/profile.ts` and the acceptance criteria assert `grep -r izinex` is clean outside
   `Resume/`.
5. **No charting library.** The visuals are hand-rolled canvas + SVG on top of two small scale
   helpers. `visx`/`d3` would add 40–90 KB gzipped for scales and axes we can write in 80
   lines, and the performance budget below is tight. Only `framer-motion` and `clsx` are added.
6. **The bird capstone's headline number is 97.65%, not 94%.** The brief said "~94% accuracy
   on a 100-epoch EfficientNet run". The notebooks show that EfficientNetB0 run was **lost and
   never reproduced** — Pizon's own note in `02_Preprocessing_Modeling.ipynb` cell 16 says so.
   The reproducible, published headline is **VGG16 fine-tuned from `block4_conv1`: 97.651% top-1
   over 315 species** (notebook cell 75; the written report rounds it to 97.5%). The page leads
   with that and mentions the lost EfficientNet run only as a footnote in the write-up.
7. **The final custom-CNN architecture diagram is *not* `model_plot.png`.** Both `plot_model`
   calls in notebook 01 were passed `cnn_model` (the 2-block baseline), so `model_plot.png` and
   `basic_cnn_plot.png` are byte-identical and both depict the 60.8% baseline. Neither is
   shipped. The layer table is transcribed from the printed `model.summary()` instead.
8. **No asset from the previous site is carried forward.** No `PizonLogo.png`, no hiking or
   comic-con photographs, nothing. The only imagery this plan permits is the two files in
   `/Users/pizon/Projects/Personal Website/Photos/` and the branding assets Pizon supplied
   himself at `public/logo/`.
9. **The logo has arrived and fills the slot.** `public/logo/` holds Pizon's own mark with its
   own README, so the slot is filled on day one and the typographic fallback is withdrawn.
   Three decisions follow from the assets rather than from the brief. First, only the stack
   mark ships (`pk-stack-ink.svg` on light surfaces, `pk-stack-light.svg` on dark). The lockup
   files are not used, the descriptor "Data & AI Engineering" appears nowhere on the site, and
   the Archivo font the lockups depend on is not loaded; the only professional headline the
   site states is the one in `content/profile.ts`. Second, the mark is a **vertical** stack on
   a `72 x 232` viewBox, an aspect ratio of `0.31:1`, which inverts the wide slot this plan
   originally reserved, so the header and footer boxes are rebuilt around it below. Third,
   because the mark now stands alone with no adjacent name text, `LogoSlot.alt` carries
   `Pizon Khan` rather than an empty string.
10. **The portrait is small by design, because the source is small.** The best photo is 747×970.
    At 2× that supports ~370 px rendered before visible softness. So the landing page's visual
    weight is typography, motion and the data visualisations; the portrait is a 120 px human
    anchor, not a hero image. This is also the right composition for a data person, so the
    constraint and the design agree.
11. **`next/image` optimisation is unavailable** (`images: { unoptimized: true }`). Every image
    is pre-resized, pre-compressed, EXIF-stripped and colour-converted to sRGB at asset-prep
    time and committed as a static file, served through a plain `<img>` with explicit
    `width`/`height` and a `withBasePath()` src.
12. **Theme is user-selectable with a system default**, persisted in `localStorage`, applied by
    an inline `<script>` in `<head>` before paint. No `next-themes` dependency.
13. **`metadataBase` is the one sanctioned place an absolute origin appears**, sourced from
    `content/site.ts`. Every other URL is either relative or goes through `withBasePath()`.
14. **Wave 1 is four tasks and does not include the bird page.** The bird page needs
    pre-generated model assets (a TensorFlow forward pass, ~500 MB of ImageNet weights) that
    could stall a build agent. It is fully specified below and reserved as wave 2 with a
    non-overlapping manifest. In wave 1 it appears on `/projects/` as a `status: 'planned'`
    card, so no internal link 404s.
15. **A stale, pre-revision partial build is already on disk, and it is overwritten rather than
    extended.** `git status` lists `content/site.ts`, `lib/motion.ts`, `lib/format.ts`,
    `lib/viz/palette.ts` and `lib/viz/scale.ts` as untracked files written against the
    *previous* revision of this plan. `content/site.ts` still declares
    `logo: null as LogoSlot | null` with the withdrawn typographic-fallback comment, and
    `lib/viz/palette.ts` still calls the chrome teal. All five are marked **New** in the Task 1
    manifest and that is deliberate: replace each file wholesale with the contract in this
    document. Merging into them is exactly how the withdrawn null-logo branch and the withdrawn
    teal survive into a build, and criteria 60, 68 and 76 exist to catch that.

---

## Copy and voice

Every string this plan specifies, and every string the developer writes into a component, obeys
the same rules. They are not stylistic preferences, they are acceptance criterion 76.

- **No em dashes.** Use a colon, a comma, a full stop, or rewrite the sentence. This binds
  rendered copy, code comments, `README.md` and commit messages alike.
- **No throat-clearing, no padded triplets, no meta-commentary.** "The map is 2,244 aggregated
  cells", not "In this section we will explore the fascinating ways in which".
- **No reference anywhere to an AI assistant, an LLM, a model name, or the tooling used to build
  this site**, in any file a visitor or a future maintainer could read: source, comments,
  README, commit messages. The one legitimate appearance of "LLM" on this site is Pizon's own
  resume bullet about a chatbot he built, which ships verbatim.
- **Numbers are stated, never softened.** "$191,771 test MAE", not "strong accuracy".
- This document's own prose is planner prose and uses em dashes freely. That is not a licence:
  nothing under `docs/plans/` ships. What ships is what appears inside a code block, a quoted UI
  string or a table cell in this plan, and all of that follows the rules above.
- The single exception is `content/profile.ts`, transcribed from Pizon's resume. Its strings
  ship verbatim, em dashes included, because they are his own words about his own career. See
  open question 11.

---

## File manifest

### Task 1 — Foundation: design tokens, app shell, visualisation primitives

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `package.json` | Edit | Add `framer-motion@^12`, `clsx@^2`. No other runtime deps. |
| `.gitignore` | Edit | Add `/Photos` — source photographs stay out of git; only the derived, EXIF-stripped crops in `public/img/` are committed. Add `.DS_Store` so the Finder droppings sitting next to the logo assets never land in the repository. |
| `app/globals.css` | Edit | Replace scaffold. All design tokens, both themes, base typography, the shared visualisation-figure CSS, reduced-motion global. |
| `app/layout.tsx` | Edit | Replace scaffold. Fonts, `ThemeScript`, `SkipLink`, `SiteHeader`, `SiteFooter`, metadata from `content/site.ts` including the `icons` block, every URL through `withBasePath()`. |
| `app/not-found.tsx` | New | 404 page using the shell. |
| `lib/motion.ts` | New (**overwrite** the stale untracked file) | `usePrefersReducedMotion`, `useInViewOnce`, `DURATION`, `EASE`, `STAGGER`. |
| `lib/theme.ts` | New | `ThemeName`, `resolveInitialTheme`, `applyTheme`, `useThemeName`. The one place theme state is read at runtime. |
| `lib/format.ts` | New (**overwrite**) | `formatUSD`, `formatCompactUSD`, `formatPercent`, `formatCount`, all tabular-safe. |
| `lib/viz/palette.ts` | New (**overwrite**) | Sequential ramp, categorical series, diverging ramp, and the theme-keyed literal `HAIRLINE` and `ACCENT` a canvas needs; `rampIndexFor()`. |
| `lib/viz/scale.ts` | New (**overwrite**) | `linearScale`, `quantileBreaks`, `extent`, `niceTicks`. |
| `components/ui/Container.tsx` | New | Width constraint (`content` \| `narrow` \| `prose`). |
| `components/ui/Section.tsx` | New | Vertical rhythm + optional eyebrow/heading; scroll-reveal. |
| `components/ui/Eyebrow.tsx` | New | Mono uppercase label. |
| `components/ui/Prose.tsx` | New | Serif long-form wrapper at the prose measure. |
| `components/ui/Pill.tsx` | New | Small status/tag chip. |
| `components/ui/ButtonLink.tsx` | New | Primary/ghost link button, `next/link` based. |
| `components/ui/Metric.tsx` | New | Large tabular figure + label + source note. |
| `components/site/Wordmark.tsx` | New | **The logo.** Renders `site.logo`'s stack mark as a light/dark `<img>` pair toggled by CSS. No fallback branch. |
| `components/site/SiteHeader.tsx` | New | Sticky header, `Wordmark`, nav from `content/site.ts`, theme toggle. |
| `components/site/SiteFooter.tsx` | New | `Wordmark`, contact links, the integrity statement. |
| `components/site/SkipLink.tsx` | New | "Skip to content". |
| `components/site/ThemeToggle.tsx` | New | Client toggle, `aria-pressed`, writes `localStorage`. |
| `components/site/ThemeScript.tsx` | New | Inline pre-paint theme script. |
| `components/viz/Figure.tsx` | New | The shared visualisation chrome, the thing that makes every chart one family. |
| `components/viz/FigureSkeleton.tsx` | New | `Figure`'s box model with an empty well. Holds the reserved height open while a lazily-imported visual's chunk is in flight, so nothing shifts when it lands. |
| `components/viz/FigureTable.tsx` | New | The accessible table equivalent rendered inside `Figure`'s disclosure. |
| `components/viz/ScaleLegend.tsx` | New | Discrete 7-step ramp legend with labelled breakpoints. |
| `components/viz/AnimatedNumber.tsx` | New | Count-up on first view; reduced motion = final value. |
| `components/viz/KernelSweep.tsx` | New | Shared convolution primitive. Used decoratively in the hero (16×16) and with real luminance data + controls on the bird page (28×28). |
| `content/site.ts` | New (**overwrite** the stale untracked file, which still has `logo: null`) | Site name, URL, nav, SEO copy, integrity statement, **the populated `logo` slot** and the **`icons`** block. |
| `content/profile.ts` | Edit | `links.github` → `https://github.com/pizonkhan`. Nothing else changes. |
| `README.md` | Edit | Replace create-next-app boilerplate. Includes the **Asset prep** section: the exact portrait crop commands and the logo usage rules. |
| `app/favicon.ico` | Delete | create-next-app default. Replaced by the icons declared in `app/layout.tsx`. |
| `public/logo/**` | New (already on disk) | Pizon's brand kit, committed byte-identical. Only `pk-stack-ink.svg`, `pk-stack-light.svg`, `pk-favicon-16.svg`, `png/pk-32.png` and `png/pk-180.png` are referenced by a route; the rest stay as the kit. Do not re-author, re-tint, re-export or minify any file. |

### Task 2 — Project content model, index route, demonstration template

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `content/projects/types.ts` | New | `ProjectRecord` and friends, the per-section visual contract, and the integrity rule as a doc comment. |
| `content/projects/index.ts` | New | Frozen registry; `getProject(slug)`. |
| `content/projects/nyc-housing-prices.ts` | New | Full write-up record. `status: 'live'`. |
| `content/projects/bird-species-cnn.ts` | New | Full write-up record. `status: 'planned'`. |
| `app/projects/page.tsx` | New | Demonstrations index. |
| `components/project/ProjectCard.tsx` | New | Index card; handles `planned` (no link, "write-up in progress" pill). |
| `components/project/ProjectHero.tsx` | New | Title, tagline, demo promise, headline figures. |
| `components/project/ProjectLayout.tsx` | New | The reusable template: hero and results → optional overarching centrepiece → theory sections, each with its own embedded visual → meta rail → next-project. |
| `components/project/ProjectSection.tsx` | New | One theory section: heading, prose, optional embedded visual, stable anchor. |
| `components/project/ProjectMeta.tsx` | New | Stack / dataset / links rail. |
| `components/project/SourceNote.tsx` | New | The "where this number came from" line. |

### Task 3 — Landing page, experience surface, portrait imagery

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `components/ui/Portrait.tsx` | New | The portrait primitive — fixed sizes, fixed crop, swappable source. |
| `public/img/portrait-256.webp` | New (generated) | 256×256 square crop of `Photos/IMG_4601.jpg`, sRGB, EXIF stripped. |
| `public/img/portrait-640.webp` | New (generated) | 640×640 square crop of the same, sRGB, EXIF stripped. |
| `app/page.tsx` | Edit | Replace scaffold with the landing page. |
| `app/experience/page.tsx` | New | Credentials surface. |
| `components/home/Hero.tsx` | New | First viewport. |
| `components/home/ProofStrip.tsx` | New | Three résumé figures, count-up. |
| `components/home/DemonstrationsPreview.tsx` | New | Project cards from the registry. |
| `components/home/CapabilityGrid.tsx` | New | Skills from `profile.ts`, grouped. |
| `components/home/ContactBlock.tsx` | New | Portrait, email, links. |
| `components/experience/RoleTimeline.tsx` | New | Employers → roles → highlights, verbatim. |
| `components/experience/EducationList.tsx` | New | Education, verbatim. |
| `components/experience/SkillMatrix.tsx` | New | Full skill groups. |
| `components/experience/TechniqueNotes.tsx` | New | Generic method explainers + the boundary statement. |
| `content/techniques.ts` | New | The generic explainers, each with `scope: 'general-method'`. |
| `public/file.svg` | Delete | create-next-app leftover. |
| `public/globe.svg` | Delete | create-next-app leftover. |
| `public/next.svg` | Delete | create-next-app leftover. |
| `public/vercel.svg` | Delete | create-next-app leftover. |
| `public/window.svg` | Delete | create-next-app leftover. |

### Task 4 — NYC housing price surface (first demonstration)

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `scripts/build-nyc-price-surface.mjs` | New | Deterministic aggregation from the public capstone CSV → the three data modules. Run manually; not part of `npm run build`. |
| `content/data/nyc-price-surface.ts` | New (generated) | The binned grid. Committed output. |
| `content/data/nyc-boroughs.ts` | New (generated) | Borough aggregates + deciles. Committed output. |
| `content/data/nyc-model-ladder.ts` | New (hand-transcribed) | Eight model results from the capstone notebook. |
| `app/projects/nyc-housing-prices/page.tsx` | New | The route. Server Component: `metadata` plus one `ProjectLayout` call. No `'use client'`, no `dynamic()`. |
| `components/projects/nyc/NycVisuals.tsx` | New | `'use client'`. Every `next/dynamic` call for this route, the `FigureSkeleton` reservations and the 200 px viewport gate. Exports `NycCentrepiece`, `NycImputation`, `NycLocation`, `NycApproach`. |
| `components/projects/nyc/PriceSurface.tsx` | New | The centrepiece: view switcher + canvas + legend + borough table. |
| `components/projects/nyc/PriceSurfaceCanvas.tsx` | New | Canvas renderer + O(1) hit test. |
| `components/projects/nyc/BoroughTable.tsx` | New | Linked, keyboard-operable borough interrogation. |
| `components/projects/nyc/ImputationSpread.tsx` | New | Section visual for `#imputation`: one distribution, observed vs mean fill vs MICE. Synthetic values, labelled as such. |
| `components/projects/nyc/BoroughSpread.tsx` | New | Section visual for `#location`: decile strips per borough. |
| `components/projects/nyc/ModelLadder.tsx` | New | Section visual for `#approach`: error-shrinking bars. |

### Reserved for wave 2 (specified below, not built now)

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `scripts/build-bird-assets.py` | New | VGG16 forward pass → committed assets. |
| `public/projects/bird-species-cnn/**` | New | Photo, luminance matrix, activation sprite sheets, softmax JSON. |
| `content/data/bird-model-ladder.ts` | New | Seven real results. |
| `content/data/bird-vgg16-layers.ts` | New | The VGG16 layer table. |
| `app/projects/bird-species-cnn/page.tsx` | New | The route. |
| `components/projects/bird/**` | New | `BirdVisuals` (the `'use client'` dynamic-import wrapper, same shape as `NycVisuals`), `ResultsLadder` (centrepiece), `PixelMatrix`, `LayerPyramid`, `ActivationStrip`, `SoftmaxRace`, `TransferDiagram`. No stepper: each stage is its own section visual. |
| `content/projects/bird-species-cnn.ts` | Edit | Flip `status` to `'live'`. |

---

## Design language

The site is made by someone whose stated passion is *"finding insights and bringing out those
insights with beautiful visualization."* The system therefore has one governing rule:

> **UI chrome and data encoding never share a hue.** Chrome is azure, hue 212 degrees. Data
> is magma, hue 253 through 27 degrees by way of magenta and red. The nearest step of the data
> ramp sits 38.6 degrees from the chrome hue. A visitor can never mistake a button for a value,
> and a chart never inherits a meaning from the brand.
>
> **The neutrals under both of them come from one place: the logo.** Ink `#0B0C0E`, Graphite
> `#6E7478` and Paper `#F6F6F4` are the three colours Pizon's mark is built from, and they
> generate every surface, border and text tier in both themes. The mark is not placed on the
> site; the site is built out of the mark's palette.

### Typography

Three families, all self-hosted at build time via `next/font/google` (no runtime CDN — required
for a static export).

| Role | Family | Weights / axes | Loaded |
| --- | --- | --- | --- |
| UI, display, numerals | **Inter** (variable) | 400–700 | `preload: true`, `display: 'swap'` |
| Long-form project prose | **Source Serif 4** (variable) | 400, 600 | `preload: false` |
| Figure labels, ticks, code, eyebrows | **JetBrains Mono** | 400, 500 | `preload: false` |

All three: `subsets: ['latin']`, exposed as `--font-sans`, `--font-serif`, `--font-mono`.
Inter gets `font-feature-settings: 'cv05' 1, 'ss03' 1` (single-storey `l`, disambiguated `1`)
and every numeral context gets `font-variant-numeric: tabular-nums`.

**Scale** (fluid; the `clamp` mins are the mobile values, maxes the ≥1280px values):

| Token | Size | Family | Weight | Tracking | Leading |
| --- | --- | --- | --- | --- | --- |
| `--fs-display` | `clamp(2.75rem, 6vw, 4.5rem)` | sans | 600 | `-0.03em` | 1.02 |
| `--fs-h1` | `clamp(2rem, 4vw, 3rem)` | sans | 600 | `-0.025em` | 1.08 |
| `--fs-h2` | `clamp(1.5rem, 2.4vw, 2rem)` | sans | 600 | `-0.02em` | 1.16 |
| `--fs-h3` | `1.25rem` | sans | 600 | `-0.01em` | 1.3 |
| `--fs-lead` | `clamp(1.125rem, 1.6vw, 1.3125rem)` | sans | 400 | `-0.01em` | 1.5 |
| `--fs-prose` | `1.125rem` | **serif** | 400 | `0` | 1.65 |
| `--fs-body` | `1rem` | sans | 400 | `0` | 1.6 |
| `--fs-small` | `0.875rem` | sans | 400 | `0` | 1.5 |
| `--fs-label` | `0.75rem` | **mono** | 500 | `0.08em`, uppercase | 1.4 |
| `--fs-tick` | `0.6875rem` | **mono** | 400 | `0.02em` | 1 |
| `--fs-metric` | `clamp(2rem, 3.5vw, 2.75rem)` | sans | 600, `tabular-nums` | `-0.02em` | 1 |

Measure: prose at `68ch`, never wider. Headings may run to the content width.

### Colour

Set as CSS custom properties on `:root` and overridden under `[data-theme='dark']`, then
mapped into Tailwind 4 with `@theme inline`. Dark variant:
`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`

**Neutrals, derived from the brand trio rather than invented.** Light surfaces are Paper
stepped toward Graphite; dark surfaces are Ink stepped toward Paper; borders step toward
Graphite in both themes. That is what keeps the darks cool and the lights warm, which is how
the mark itself is built.

| Token | Light | Dark | Derivation | Use |
| --- | --- | --- | --- | --- |
| `--surface-0` | `#F6F6F4` | `#0B0C0E` | Paper / Ink, exact brand values | Page background |
| `--surface-1` | `#FFFFFF` | `#141517` | Knockout white / Ink + 4% Paper | Cards, header, tooltips |
| `--surface-2` | `#EBECEA` | `#1B1C1E` | Paper + 8% Graphite / Ink + 7% Paper | Figure canvas background, insets, code |
| `--border-subtle` | `#DEDFDE` | `#292B2E` | Paper + 18% Graphite / Ink + 30% Graphite | Hairlines, dividers |
| `--border-strong` | `#C6C8C9` | `#3C4043` | Paper + 35% Graphite / Ink + 50% Graphite | Card outlines, focus containers |
| `--text-primary` | `#0B0C0E` | `#F6F6F4` | Ink / Paper, exact brand values | Headings, body |
| `--text-secondary` | `#464A4E` | `#A4A8AA` | Ink + 60% Graphite / Graphite + 40% Paper | Supporting copy |
| `--text-tertiary` | `#5F6468` | `#898E91` | Ink + 85% Graphite / Graphite + 20% Paper | Ticks, captions, metadata |

**Measured contrast, recomputed from these exact hexes.** Ticks and captions live inside figure
wells, so every text tier is measured against `--surface-2` as well as against the page and
cards. None of the ratios from the previous revision carry over; the base colours changed.

| Text token | on `--surface-0` | on `--surface-1` | on `--surface-2` |
| --- | ---: | ---: | ---: |
| `--text-primary` light | 18.08:1 | 19.57:1 | 16.51:1 |
| `--text-secondary` light | 8.26:1 | 8.94:1 | 7.54:1 |
| `--text-tertiary` light | 5.53:1 | 5.98:1 | 5.05:1 |
| `--text-primary` dark | 18.08:1 | 16.88:1 | 15.76:1 |
| `--text-secondary` dark | 8.16:1 | 7.62:1 | 7.11:1 |
| `--text-tertiary` dark | 5.91:1 | 5.52:1 | 5.15:1 |

Every tier clears 4.5:1 on every surface it can appear on, in both themes. Two results the
developer must not "simplify" back toward the brand sheet:

- **Graphite is a rule colour, not a text colour.** `#6E7478` measures **4.38:1** on Paper and
  **4.00:1** on `--surface-2`, so it fails AA for body text. That is exactly why the logo kit
  restricts it to the dividing rule. `--text-tertiary` light is Graphite darkened one step to
  `#5F6468` to clear the threshold with margin. Do not "restore" the brand value here.
- **Light `--surface-1` is pure white, not Paper.** Paper is the page and cards lift off it.
  The two are only **1.08:1** apart, so a card is always additionally bounded by
  `--border-subtle`, never by luminance alone.

**Chrome accent: one hue, azure at 212 degrees.** Teal is withdrawn. The replacement had to
read unmistakably as interface rather than as data, so it sits at least 38 degrees from every
step of the magma ramp, it is not a violet, magenta, red, orange or amber, and it is saturated
enough that a button never reads as a neutral.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--accent` | `#12539E` | `#79ACF2` | Links, focus ring, primary button fill, active state |
| `--accent-hover` | `#0D4382` | `#A5C7F6` | Hover and active press |
| `--accent-contrast` | `#FFFFFF` | `#0B0C0E` | Text and icons on an accent fill |
| `--accent-wash` | `#E3EDF8` | `#122840` | Selected-row tint, chip background |

Measured:

| Pair | Light | Dark |
| --- | ---: | ---: |
| `--accent` on `--surface-0` | 7.04:1 | 8.38:1 |
| `--accent` on `--surface-1` | 7.62:1 | 7.83:1 |
| `--accent` on `--surface-2` | 6.43:1 | 7.31:1 |
| `--accent-contrast` on an `--accent` fill | 7.62:1 | 8.38:1 |
| `--accent-contrast` on an `--accent-hover` fill | 9.80:1 | 11.28:1 |
| `--accent-hover` on `--surface-0` | 9.06:1 | 11.28:1 |
| `--text-primary` on `--accent-wash` | 16.53:1 | 13.83:1 |
| `--text-secondary` on `--accent-wash` | 7.55:1 | 6.24:1 |

Both `--accent` values clear 4.5:1 on both `--surface-0` tones with room to spare, and both
clear the 3:1 non-text threshold that the focus ring needs on every surface it can land on.
`--text-tertiary` on `--accent-wash` measures 5.05:1 light and 4.52:1 dark; the dark figure is
thin, so **a washed row renders its metadata in `--text-secondary`, never `--text-tertiary`.**

**Hue separation, measured against the data palettes.** Light accent hue 212.1, dark accent hue
214.7. Distance to the nearest magma step (`#1D1147`, hue 253.3) is 41.2 degrees light and 38.6
degrees dark, and every other step is further. That is the separation that matters, because the
sequential ramp is the only encoding on this site that carries magnitude by hue alone. The
categorical and diverging palettes are always paired with a second non-colour channel under
family rule 5 below, so their chrome constraint is the absolute one instead: **no data series
and no data encoding is ever drawn in `--accent`, `--accent-hover` or `--accent-wash`.** Accent
marks *where the user is*, never *what a number is*. If a mark's position, length, area or fill
carries a value it may not be an accent token; if it marks focus, a cursor or a selection, it
may. There are exactly four sanctioned chrome uses on this site, enumerated in acceptance
criterion 67, and nothing is added to that list without editing this plan.
`--viz-cat-6` (`#5B7192`, hue 216) and `--viz-div-neg` (`#2B7C8C`, hue 190) sit near the chrome
hue, but both are far lower in saturation and neither is ever rendered without a direct label.

**Non-text contrast, and the two classes of mark it splits the site into.** WCAG 1.4.11 wants
3:1 for graphics that carry meaning, and a mark inside a figure is measured against the well,
`--surface-2`, not against the page. Applied literally to a heatmap that rule is unmeetable, so
this plan draws the line where it actually matters:

- **Geometry-is-the-encoding.** Bars, whiskers, bands, ticks, rules, connectors: you read their
  *extent*, and you cannot read the extent of something you cannot see. These **must clear 3:1
  against the well in both themes**, no exceptions, and each one's measured pair is published in
  its figure's own section.
- **Fill-is-the-encoding.** The 7-step sequential ramp on the price surface and the density
  alpha behind it. The value is read off a labelled legend with numeric breakpoints, a linked
  table row and a persistent readout, all of which family rules 5 and 9 already require. What
  these owe instead is **step-to-step discriminability** (each adjacent ramp pair differs by at
  least 15 in CIE L*) plus the `--viz-hairline` stroke on every cell, so no cell's boundary
  disappears into its neighbour. They are exempt from 3:1 against the well, and that exemption
  applies to the price surface alone.

Two tokens fail the geometry test on the well and are therefore **barred from carrying meaning
inside any figure**:

| Token on `--surface-2` | Light | Dark | Verdict |
| --- | ---: | ---: | --- |
| `--accent-wash` | 1.00:1 | 1.14:1 | Never a mark. Selected-row tint and chip background only. |
| `--border-strong` | 1.42:1 | 1.63:1 | The one axis baseline only, which is chrome, not data. |

So does **any alpha below about 0.8 on `--text-tertiary`**: at 60% it measures 2.39:1 light and
2.69:1 dark, at 40% it is 1.72:1 and 1.91:1. A dimmed bar is not a valid mark on this site. Use
the token at full opacity and carry the emphasis with a different token instead.

Two steps of the sequential ramp are also unusable as flat geometry fills, though they remain
correct inside the ramp: `--viz-seq-7` (`#FBA55F`) measures **1.66:1** on the light well and
`--viz-seq-4` (`#9A2E7E`) measures **2.49:1** on the dark one. `--viz-seq-5` (`#C94371`) is the
only ramp step that clears 3:1 on both (**3.92:1** light, **3.67:1** dark), which is why it is
the one the bar figures use.

The tokens that clear the geometry test are `--text-tertiary` (5.05:1 light, 5.15:1 dark),
`--text-secondary` (7.54:1 / 7.11:1), `--text-primary` (16.51:1 / 15.76:1), `--viz-cat-6`
(4.20:1 / 3.43:1) and `--viz-seq-5` (3.92:1 / 3.67:1). Per-mark measurements are published in
each figure's own section.

**Sequential data ramp — 7 discrete steps, magma-derived, identical in both themes.**

| Step | Hex |
| --- | --- |
| `--viz-seq-1` (lowest) | `#1D1147` |
| `--viz-seq-2` | `#3F1073` |
| `--viz-seq-3` | `#6A1F81` |
| `--viz-seq-4` | `#9A2E7E` |
| `--viz-seq-5` | `#C94371` |
| `--viz-seq-6` | `#EE6A5E` |
| `--viz-seq-7` (highest) | `#FBA55F` |

The ramp does not change between themes — the encoding must mean the same thing in both. It
stays legible because every filled mark carries a hairline stroke (`--viz-hairline`: Ink at
`rgba(11,12,14,0.16)` light, Paper at `rgba(246,246,244,0.14)` dark) and every figure canvas
sits on `--surface-2` rather than on the page background.

**Categorical series (max 6).** Each must be paired with a second, non-colour channel — direct
label, marker shape, or dash pattern.

`--viz-cat-1 #0E9AA0` · `--viz-cat-2 #E0912F` · `--viz-cat-3 #7A5CD6` ·
`--viz-cat-4 #DD5E5E` · `--viz-cat-5 #3F9E63` · `--viz-cat-6 #5B7192`

**Diverging (residuals).** `--viz-div-neg #2B7C8C` ← `--viz-div-mid #8D8D93` → `--viz-div-pos #C1553B`.

**Semantic.** `--ok #2F855A` / `#4FD18B`; `--warn #B4530A` / `#F2A03D`; `--bad #C0432F` / `#F2765E`.

### Spacing, radius, elevation

Base unit 4px (Tailwind 4's default scale is used directly for component-internal spacing).
Semantic layout tokens:

- `--space-section: clamp(4rem, 9vw, 7rem)` — vertical padding between page sections
- `--space-block: clamp(2rem, 4vw, 3rem)` — between blocks inside a section
- `--width-content: 76rem` · `--width-narrow: 44rem` · `--measure-prose: 68ch`
- `--radius-sm: 6px` (controls) · `--radius-md: 10px` (cards, portrait rect) · `--radius-lg: 16px` (figures) · `--radius-full: 999px` (pills, circular portrait)
- Elevation is **light theme only**, and the shadow is Ink rather than a blue-grey:
  `--shadow-card: 0 1px 2px rgba(11,12,14,.05), 0 8px 24px -12px rgba(11,12,14,.14)`. Both
  alphas are one notch heavier than the previous revision's because the page is now Paper
  rather than near-white, and a card lifting off Paper needs slightly more shadow to read.
  Dark theme conveys elevation with `--surface-1`/`--surface-2` plus `--border-subtle`; `--shadow-card: none`.

### The logo

Pizon supplied the mark. It lives in `public/logo/` with its own README, and this site uses
exactly one form of it: **the stack mark, alone.** Not the lockup, not the descriptor.

**What ships and what does not**

| File | Used | Where |
| --- | --- | --- |
| `pk-stack-ink.svg` | **Yes** | `Wordmark` on light theme, header and footer |
| `pk-stack-light.svg` | **Yes** | `Wordmark` on dark theme, header and footer |
| `pk-favicon-16.svg` | **Yes** | Browser tab icon at every size. It is a 512-unit viewBox of the P-only tile, so it scales up as well as down. |
| `png/pk-32.png` | **Yes** | PNG icon fallback for clients that will not take an SVG icon |
| `png/pk-180.png` | **Yes** | `apple-touch-icon` |
| `pk-lockup-ink.svg`, `pk-lockup-light.svg` | **No** | They set live `<text>` in Archivo and carry the descriptor "Data & AI Engineering". Neither the font nor the descriptor is used on this site. |
| `pk-avatar-*.svg`, `png/pk-16.png`, `png/pk-64.png`, `png/pk-512.png`, `png/pk-mark-ink-transparent.png` | **No** | Kept in the repository as the brand kit for GitHub and elsewhere. Referenced by no route. |

**Why the mark alone.** The lockup's descriptor states a professional identity that is not the
one on the résumé. `content/profile.ts` and `content/site.ts` say **Director, Credit
Analytics**, and that is the only headline this site uses. Putting "Data & AI Engineering" in
the header would add a second, unsourced job title to a banker's public page. So the header
carries the mark, the `<h1>` carries the name, the role line carries the title, and there is no
third claim anywhere on the site.

**Geometry, read off the file and the kit's README rather than invented**

| Property | Value |
| --- | --- |
| Intrinsic size | `72 x 232`, the SVG `viewBox` and its `width`/`height` attributes |
| Aspect ratio | `0.3103 : 1` (width : height). This is a **vertical** stack: P, dividing rule, K. |
| Rendered height | **32 px** in the header, **28 px** in the footer |
| Rendered width | height × 72 / 232, so **9.93 px** header and **8.69 px** footer |
| Minimum legible height | **24 px** with both letters, per the kit's README. Both uses clear it. Below 24 px the kit says to switch to `pk-favicon-16.svg`, which is exactly what the favicon does. |
| Clear space | **20 design units on all four sides**: the stem width, one fifth of the P's 100-unit cap height. The mark is 232 units tall, so that is `20 / 232 = 8.62%` of rendered height, which is **2.76 px** at 32 px and **2.41 px** at 28 px. Apply it as `padding: calc(var(--wordmark-h) * 0.0862)` so it stays exact at any height. It is **not** baked into the file. |
| Reserved box | `10 × 32` in the header, `9 × 28` in the footer, plus the clear-space padding. The header link's hit area is separately padded to at least `44 × 44` with a matching `margin-inline-start: -8px` so the mark still optically aligns to the container's left edge. |
| Colour | Two tones, fixed by the kit: Ink `#0B0C0E` or Paper `#F6F6F4` letterforms plus a Graphite `#6E7478` rule. **Do not** convert the paths to `currentColor`, do not re-tint, do not apply the accent. The kit forbids it, and the site's own neutrals are already these exact three values. |
| Theme switching | Two `<img>` elements, one per file, toggled by a CSS `[data-theme]` rule. No JS, no flash, no render-time branch. Both files are under 500 bytes, so the second request is cheaper than the machinery to avoid it. |

**Wiring.** `content/site.ts` exports `logo: LogoSlot`, now populated:

```ts
export interface LogoSlot {
  /** Path relative to public/. Passed through withBasePath() at render time. */
  src: string
  /** Dark-theme variant. Rendered alongside src and toggled by CSS. */
  srcDark?: string
  /** Intrinsic size. Drives the reserved box, so there is no layout shift. */
  width: number
  height: number
  /** Alt text. The mark stands alone here, so it carries the name. */
  alt: string
}

logo: {
  src: '/logo/pk-stack-ink.svg',
  srcDark: '/logo/pk-stack-light.svg',
  width: 72,
  height: 232,
  alt: 'Pizon Khan',
}
```

It is still a slot. If the mark is ever redrawn, this object and the two files change and
`Wordmark.tsx` does not. **The typographic K-plus-square fallback from the previous revision is
withdrawn**: do not build it, and do not leave a `logo === null` branch behind. `WordmarkProps`
keeps its `height` prop, so the reserved box follows the mark's real aspect ratio at any size.

**Favicon and touch icon.** The create-next-app `app/favicon.ico` is deleted. Icons are declared
explicitly in `app/layout.tsx`'s `metadata`, sourced from `content/site.ts`, every URL through
`withBasePath()` so a subpath deploy does not 404:

```ts
icons: {
  icon: [
    { url: withBasePath(site.icons.svg), type: 'image/svg+xml' },
    { url: withBasePath(site.icons.png32), sizes: '32x32', type: 'image/png' },
  ],
  apple: { url: withBasePath(site.icons.apple180), sizes: '180x180' },
}
```

Do **not** additionally create `app/icon.svg` or `app/apple-icon.png`. Next's metadata file
convention and an explicit `metadata.icons` both emit `<link>` tags, and using both emits
duplicates.

### Imagery

**There are exactly two usable photographs and no others.** Nothing from the previous site is
reused — not the old logo, not the hiking or comic-con photos.

| File | Size | Assessment | Role |
| --- | --- | --- | --- |
| `Photos/IMG_4601.jpg` | 747 × 970 | White polo, brown leather armchair, exposed brick and plant behind, soft natural light, direct eye contact, relaxed. Clearly the better frame. | **Primary portrait.** The only photograph on the site in wave 1. |
| `Photos/IMG_4522.jpg` | 770 × 1059 | Navy suit and tie — better attire — but harsh overhead light, hotel-corridor background with a wall sconce in frame, head tilted, hand on the tie. | **Secondary.** Not used in wave 1. Crop spec recorded below for a future `/about/` at ≤ 200 px. |

**The resolution ceiling drives the layout.** 747 px of source at 2× device pixel ratio is
~370 px of comfortable rendered width. Above that it goes soft and reads as amateur, and there
is no higher-resolution original. Therefore:

- **No full-bleed hero photograph. No large above-the-fold portrait. No background image.**
- The landing page's visual weight comes from typography, motion and the data visualisations.
- The portrait appears at **120 px** (hero, circular), **88 px** (mobile hero, circular) and
  **240 px** (contact block, rounded rect). All comfortably inside the ceiling.
- Both sources are portrait-orientation phone photos with cluttered right-hand backgrounds, so
  the crop is **face-centred and tight**, never the full frame.

**Crop specification — `Photos/IMG_4601.jpg` (primary).** Square crop, origin top-left:

```
x = 0,  y = 180,  width = 640,  height = 640
```

This centres the face at roughly (0.50, 0.50) of the crop, keeps the shoulders and polo collar,
and pushes the plant and brick to soft background. Output two files, both **sRGB**, **EXIF
stripped**, **quality 82 WebP**:

| Output | Size | Purpose | Budget |
| --- | --- | --- | --- |
| `public/img/portrait-256.webp` | 256 × 256 | `srcSet` 1× for the 240 px use, 2× for the 120 px use | ≤ 18 KB |
| `public/img/portrait-640.webp` | 640 × 640 | `srcSet` 2× for the 240 px use | ≤ 55 KB |

**Crop specification — `Photos/IMG_4522.jpg` (secondary, not built in wave 1).** Square crop
`x = 115, y = 280, width = 420, height = 420`. This excludes the wall sconce (which begins
around `x = 545`) and the hand (below `y = 900`). Maximum honest rendered size: **200 px**.

**Asset-prep commands** (documented in `README.md`; run once, commit the outputs — the
`Photos/` originals are gitignored and never published):

```bash
npx --yes sharp-cli@^5 \
  --input  "Photos/IMG_4601.jpg" \
  --output "public/img/portrait-640.webp" \
  extract --left 0 --top 180 --width 640 --height 640 \
  -- --format webp --quality 82 --withMetadata false --colourspace srgb

npx --yes sharp-cli@^5 \
  --input  "public/img/portrait-640.webp" \
  --output "public/img/portrait-256.webp" \
  resize 256 256 \
  -- --format webp --quality 82 --withMetadata false
```

If `sharp-cli`'s flag surface differs at install time, any equivalent tool is acceptable
**provided** the committed outputs satisfy: exact pixel dimensions, WebP, sRGB, no EXIF
(verify with `exiftool` or by asserting the file contains no `Exif\0\0` marker), and the size
budgets above. Record whatever command actually worked in `README.md`.

**Rules for every image on the site**

1. `src` goes through `withBasePath()`. No leading-slash literal.
2. Explicit `width` and `height` attributes matching the intrinsic file, plus a CSS size — so
   the box is reserved before the bytes land and CLS stays at zero.
3. `alt` is a real description for the portrait (`"Pizon Khan"`), `alt=""` for anything
   decorative.
4. Plain `<img>`, not `next/image` — optimisation is off and `next/image` only adds a wrapper.
5. Hero portrait: `loading="eager"`, `fetchPriority="low"` (the `<h1>` must remain LCP).
   Contact portrait: `loading="lazy"`, `decoding="async"`.
6. A `1px solid var(--border-subtle)` ring on the portrait in both themes, so it separates from
   the background without a shadow.

### Motion vocabulary

| Token | Value | Applies to |
| --- | --- | --- |
| `--dur-fast` | `120ms` | Hover, press, tooltip in/out, focus ring |
| `--dur-base` | `240ms` | Toggle, theme swap, tab/segment change, colour re-encode |
| `--dur-slow` | `480ms` | Section scroll-reveal, card enter, figure recolour |
| `--dur-draw` | `900ms` | A dataset drawing itself (bars growing, cells assembling) |
| `--dur-sequence` | `1800ms` | An orchestrated multi-step sequence (softmax race) |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Everything entering |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State changes between two steady states |
| `--ease-linear` | `linear` | Constant-rate traversal only (the kernel sweep) |
| `--stagger` | `40ms` | Per-item delay, capped at 8 items (max 320ms total) |

Triggers, exhaustively:

1. **Scroll into view, once.** `useInViewOnce` with `rootMargin: '0px 0px -15% 0px'`,
   `threshold: 0.25`. Fires section reveals (opacity 0→1, `translateY(12px)→0`, `--dur-slow`,
   `--ease-out`) and one-shot data draws. Never re-fires on scroll back.
2. **Pointer/keyboard focus.** `--dur-fast`. Hover and `:focus-visible` produce identical
   visual states.
3. **Explicit user control.** Segmented controls, steppers, play buttons. `--dur-base` for
   discrete state changes, `--dur-draw` for a re-draw.
4. **Nothing autoplays more than once, and nothing loops.** The hero's `KernelSweep` runs one
   pass and parks. Each of the bird page's section visuals runs one pass on first view and parks; nothing on
   that page autoplays a sequence, because the sequence is now the page's own scroll order.
5. **The portrait never animates** beyond the section reveal it sits inside. No parallax, no
   hover zoom, no filter transition. It is an anchor, not an effect.

**Reduced motion (`prefers-reduced-motion: reduce`) — mandatory, per-component, and global:**

- `app/globals.css` carries the global net:
  `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; } }`
- Every JS-driven animation reads `usePrefersReducedMotion()` from `lib/motion.ts` and renders
  its **terminal state immediately**: bars at final width, cells at final colour, the kernel
  parked at a user-controllable position, the pyramid fully collapsed.
- Count-ups render the final number.
- Autoplay controls are not rendered at all; manual step controls are.
- A single 120ms opacity fade on first paint is permitted so nothing snaps in jarringly.
- **Do not import `useReducedMotion` from `framer-motion`.** Use
  `usePrefersReducedMotion` from `lib/motion.ts`, so components that never touch framer-motion
  do not pull it in.

### How every visualisation is styled (the family rules)

Enforced by `components/viz/Figure.tsx`. Every visual on the site is a child of it.

1. **Chrome.** Eyebrow (mono, uppercase, `--text-tertiary`) → title (`--fs-h3`) →
   optional one-line `caption` → the canvas well → a footer row of `source` (mono, small) and a
   `<details>` disclosure labelled "Show the numbers".
2. **The well.** `background: var(--surface-2)`, `border: 1px solid var(--border-subtle)`,
   `border-radius: var(--radius-lg)`, `padding: 16px`, and a **fixed `aspect-ratio` reserved
   before the chunk loads** so CLS stays at zero.
3. **Axes.** One 1px baseline in `--border-strong`. No gridlines. No chart border. Tick labels
   in `--fs-tick` mono, `--text-tertiary`, max 6 ticks per axis.
4. **Marks.** Every filled mark gets a `0.5px` `--viz-hairline` stroke. Corner radius 2px on
   bars, 0 on grid cells.
5. **Colour never carries meaning alone.** Every colour encoding is accompanied by at least one
   of: a labelled legend with numeric breakpoints, a direct text label on the mark, an ordered
   position, or a linked table row.
6. **Focus.** `outline: 2px solid var(--accent); outline-offset: 2px;` on every interactive
   mark and control. `:focus-visible` only — never suppressed.
7. **Tooltips / readouts.** `--surface-1`, `1px solid var(--border-strong)`,
   `--radius-sm`, `--shadow-card`, mono tabular numerals, appear in `--dur-fast`, and are
   **also mirrored into a persistent readout panel** so keyboard users get the same information
   without hover.
8. **Numerals.** Always `tabular-nums`. Currency always via `lib/format.ts`.
9. **Provenance.** `Figure` requires a non-empty `source` prop. There is no way to render a
   chart on this site without stating where the numbers came from.

---

## Information architecture

All routes are static; `trailingSlash: true` is already on, so **every internal `href` is
written with a trailing slash** (`/projects/`, not `/projects`) to avoid a redirect hop on
GitHub Pages.

```
/                                   Landing
/experience/                        Credentials. Bank work lives here, text only
/projects/                          Demonstrations index
/projects/nyc-housing-prices/       Demonstration 1
/projects/bird-species-cnn/         Demonstration 2   (wave 2)
404                                 app/not-found.tsx
```

No `[slug]` dynamic route. Each project gets its own route folder that imports its own
centrepiece component. That removes `generateStaticParams` from the picture entirely (one
fewer export-time foot-gun) and makes each project page independently ownable by one task.
Adding project three costs one content file + one route folder + one centrepiece component.

**Movement.** Header carries the `Wordmark` (the stack mark, 32 px tall) linking to `/`, then two nav items:
**Work** (`/projects/`) and **Experience** (`/experience/`), plus the theme toggle. The landing
page funnels to both. Each project page ends with a "Next demonstration" link that cycles
through `status: 'live'` records. The experience page ends with a link to `/projects/` phrased
as *"The work I can show you in full →"* — that sentence is the seam between the two halves of
the site and is the polite, honest way of saying the bank work has no demo.

**How bank experience is surfaced without a demonstration page.** `/experience/` is:

1. `RoleTimeline` — every employer, role, date range and highlight bullet rendered **verbatim**
   from `content/experience` in `content/profile.ts`. The only motion is a staggered reveal of
   role cards (`--dur-slow`, `--stagger`) and a vertical rule that draws down as you scroll
   (`scaleY` 0→1, scroll-linked, disabled under reduced motion).
2. `SkillMatrix` — the five skill groups, verbatim.
3. `EducationList` — verbatim.
4. `TechniqueNotes` — three to five generic method explainers with a fixed, prominent boundary
   statement rendered above them.

The page contains no chart, no photograph, no number that is not on the résumé, and imports
nothing from `components/viz/`, `components/projects/` or `content/projects/`.

---

## Landing page

Section by section. The whole page's first-load JS budget is 120 KB gzipped (see Acceptance).

### 1. Hero — the first viewport

**Left column** (2/3 on ≥1024px, full width below):

- Eyebrow: `NEW YORK CITY` (mono, uppercase)
- `<h1>` at `--fs-display`: **Pizon Khan**
- Role line at `--fs-lead`, `--text-secondary`: `Director, Credit Analytics · Webster Bank`
  — composed from `profile.headline` and `profile.company`, never hardcoded.
- Positioning paragraph: `profile.summary` verbatim, at `--fs-lead`, max `52ch`.
- Two CTAs: **See the demonstrations** (primary → `/projects/`) and **Experience** (ghost →
  `/experience/`).

**Right column** (≥1024px only): a vertical stack, right-aligned —

1. `<KernelSweep size={16} decorative />` at 320 × 320.
2. Beneath it, `<Portrait size={120} shape="circle" />` with a one-line mono caption
   `Pizon Khan · NYC`, left-aligned to the portrait.

Below 1024px the right column does not render. Instead `<Portrait size={88} shape="circle" />`
sits **above the eyebrow**, and `KernelSweep` is dropped entirely on mobile (it is decorative and
costs layout height that the copy needs more).

**What the first viewport communicates in three seconds:** a name, a face at human scale, a
city, a senior title at a bank, one sentence of positioning, and — moving quietly beside it — a
window sliding over numbers and turning them into structure. That glyph is the site's whole
thesis and it reappears at full fidelity on the bird page. The photograph is deliberately the
smallest element in the composition.

**Motion:** on mount, headline mask-reveal (`clip-path` inset 100%→0, `--dur-slow`,
`--ease-out`), then role line and paragraph fade-up staggered 40ms, then CTAs. Total ≤ 620ms.
The portrait fades in with the block it belongs to and does nothing else. `KernelSweep` starts
400ms in, runs one pass over all 14 window positions at 90ms/row (1.26s: a 3x3 valid
convolution over a 16x16 input has `size - 2` rows, the same convention the bird page and the
`KernelSweep` contract use), then parks with the output map complete.
**Reduced motion:** everything at final state on first paint; `KernelSweep` renders its
completed output map with the window parked at the last cell.

### 2. Proof strip

Three `Metric` cards, all derived from `content/profile.ts` bullets — nothing invented:

| Value | Label | Source bullet |
| --- | --- | --- |
| `15+` | Snowflake pipelines feeding the credit data mart | Director bullet 1 |
| `$1.5M` | Saved annually replacing licensed risk models | Manager bullet 1 |
| `~100` | Users across 10+ enterprise teams | Director bullet 1 |

Numbers count up over `--dur-draw` on first view (`AnimatedNumber`); the label never animates.
Reduced motion: final value, no count. Each card carries a small `SourceNote`: "From the
résumé." — the site never shows a figure without saying where it came from.

### 3. Demonstrations

Heading: **"The project pages are the demonstration."** One sentence: *A link to a repo proves
nothing. These pages run the work in front of you.*

Then the project cards from `content/projects/index.ts` via `ProjectCard`. `live` records link;
`planned` records render greyed with a "Write-up in progress" pill and no link. Cards reveal
staggered on scroll.

### 4. Capabilities

`CapabilityGrid` — the five skill groups from `profile.skills`, as a responsive definition
list. Group headings in mono eyebrow style; items as `Pill`s. No motion beyond the section
reveal. This section exists so the page is honest about breadth without the hero having to
carry a tag cloud.

### 5. Contact

Two columns on ≥768px. Left: `<Portrait size={240} shape="rect" />` (rounded rect,
`--radius-md`). Right: email (`profile.email`), GitHub (`profile.links.github` — post-fix),
LinkedIn, and the integrity statement from `content/site.ts` rendered small: *"Every figure on
this site comes from a public dataset or is explicitly labelled as illustrative. No employer
data, client names, model parameters or internal systems appear anywhere."*

This is the one place a recruiter is looking for a face, and 240 px is the largest size the
source honestly supports.

---

## Project demonstration pattern

The reusable template both capstones instantiate. Adding project three or four should cost one
content record, one route folder and its visuals, nothing else.

### Route shape

Two files per project, and the split is not a preference.

```
app/projects/<slug>/page.tsx                 Server Component. metadata + one ProjectLayout call.
components/projects/<slug>/<Slug>Visuals.tsx Client Component. Every dynamic import for that route.
```

**Why two.** `page.tsx` exports `metadata`, so it is a Server Component and can never carry
`'use client'`. On Next 15 (this repo is 15.5.22) a `next/dynamic` call with `{ ssr: false }`
inside a Server Component is a hard build failure, not a warning:

> `ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a
> Client Component.

So every `dynamic(..., { ssr: false })` call lives in one `'use client'` module per project,
which is also the natural home for the viewport-proximity gating that criteria 34 and 73 test.
The page imports named wrappers from it and hands them to `ProjectLayout` as ordinary elements.
A Server Component may create elements of Client Components and pass them as props, which is
what keeps `ProjectLayout`, `ProjectSection` and the whole write-up out of the client bundle
while the visuals stay client-only.

```tsx
// components/projects/nyc/NycVisuals.tsx
'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { FigureSkeleton } from '@/components/viz/FigureSkeleton'
import { useInViewOnce } from '@/lib/motion'

/**
 * Chrome for the reserved box, so a figure that has not loaded yet still shows its own title
 * instead of a grey rectangle. Each entry must match the Figure props inside the corresponding
 * component. They are duplicated here rather than imported because importing from those modules
 * would pull them into this chunk and defeat the split.
 */
const CHROME = {
  centrepiece: { eyebrow: '59,350 LISTINGS', title: 'New York, drawn by its own listings', hasCaption: true, ratio: '4 / 3' },
  imputation:  { eyebrow: 'MISSING DATA', title: 'What a mean fill does to a distribution', hasCaption: true, ratio: '16 / 9' },
  location:    { eyebrow: 'LIST PRICE BY BOROUGH', title: 'Five boroughs, five distributions', hasCaption: true, ratio: '16 / 9' },
  approach:    { eyebrow: 'MODEL LADDER', title: 'Eight rungs from the mean to XGBoost', hasCaption: true, ratio: '16 / 9' },
} as const

type ChromeKey = keyof typeof CHROME

const PriceSurfaceLazy = dynamic(
  () => import('./PriceSurface').then(m => m.PriceSurface),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.centrepiece} /> },
)
// ...ImputationSpreadLazy, BoroughSpreadLazy, ModelLadderLazy, each with its own CHROME entry

/**
 * Reserves the figure's exact height before the chunk exists, and defers the import until the
 * box is within 200 px of the viewport. next/dynamic only requests a chunk when the component
 * actually renders, so gating the render gates the request. `useInViewOnce` returns false on
 * the server, so the exported HTML ships the skeleton and hydration cannot mismatch.
 */
function LazyVisual({ which, children }: { which: ChromeKey; children: ReactNode }) {
  const [ref, near] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  return <div ref={ref}>{near ? children : <FigureSkeleton {...CHROME[which]} />}</div>
}

export function NycCentrepiece() {
  return <LazyVisual which="centrepiece"><PriceSurfaceLazy /></LazyVisual>
}
export function NycImputation() { /* LazyVisual which="imputation" -> ImputationSpreadLazy */ }
export function NycLocation()   { /* LazyVisual which="location"   -> BoroughSpreadLazy */ }
export function NycApproach()   { /* LazyVisual which="approach"   -> ModelLadderLazy */ }
```

```tsx
// app/projects/nyc-housing-prices/page.tsx  -- no 'use client', no dynamic()
import { ProjectLayout } from '@/components/project/ProjectLayout'
import { nycHousingPrices } from '@/content/projects/nyc-housing-prices'
import {
  NycCentrepiece, NycImputation, NycLocation, NycApproach,
} from '@/components/projects/nyc/NycVisuals'

export const metadata = { /* from the record */ }

export default function Page() {
  return (
    <ProjectLayout
      record={nycHousingPrices}
      centrepiece={<NycCentrepiece />}
      sectionVisuals={{
        imputation: <NycImputation />,
        location: <NycLocation />,
        approach: <NycApproach />,
      }}
    />
  )
}
```

The three elided exports have the same one-line body as `NycCentrepiece` with their own `which`
key and their own lazy component. The comment bodies above are elision, not a spec for an empty
function.

`sectionVisuals` is keyed by `ProjectSectionBlock.id`. Content records stay JSX-free, which is
why the map lives in the route and not in `content/`.

### Page order (fixed for every project)

Pizon's instruction for these pages: give an overview of the project and the results first,
then dive into the core topics and their theory, each one demonstrated by a visualisation. The
order below is that instruction made structural, so a page cannot drift back into prose with a
picture on top.

1. **`ProjectHero`** — eyebrow (year · dataset scale), title, tagline, the `demonstration`
   sentence (*what you are about to see move*), up to three `headlineFigures`. **No photograph.**
   This is the overview and the result, in the first viewport.
2. **Centrepiece** (optional) — the one overarching interactive visual, immediately under the
   hero, when the project has one. NYC has one: the price surface. The bird page puts its
   results ladder here instead. A project with neither passes nothing and loses no structure.
3. **Theory sections** — `record.sections` in array order, each rendered by `ProjectSection`.
   A section is a heading, its prose, and, when the route supplies one for that section's `id`,
   an **embedded visual demonstrating that section's specific idea**, rendered directly after
   the prose inside the same `<section>`. This is the body of the page: read the argument, see
   the thing the argument is about, move on. Not every section carries a visual, and a section
   that does not is not a failure.
4. **Supporting figures** (optional, expected empty) — the old catch-all block, kept only for a
   figure that genuinely belongs to no single section. Both current projects pass nothing here.
   A figure landing in this array is a signal that no argument has been attached to it yet.
5. **`ProjectMeta`** — stack pills, dataset provenance block, public links.
6. **Next demonstration** link.

Section visuals obey every rule any other visual obeys: each one is wrapped in `Figure` **by its
own component**, so the eyebrow, title, required `source` and the "Show the numbers" table are
still mandatory. Placement inside a section changes nothing about provenance or accessibility.

### What the template does NOT own

- It does not know how any visualisation works. It receives them as `ReactNode`.
- It does not wrap anything in `Figure`. Every visual arrives already wrapped, with its own
  eyebrow, title, `source` and table. A bare `<canvas>` handed to `sectionVisuals` is a defect.
- It does not decide which visual belongs to which section. The route does, by `id`.
- It does not fetch, compute or format any figure. Content arrives pre-formatted as strings.
- It does not render markdown. `body` is `string[]`; each entry is one `<p>`.
- It does not decide colours. Everything is tokens.
- It renders no imagery of any kind.

---

## Component contracts

### `lib/motion.ts`

```ts
export const DURATION = {
  fast: 0.12, base: 0.24, slow: 0.48, draw: 0.9, sequence: 1.8,
} as const

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const

export const STAGGER = 0.04

/** Live-updating; listens to the media query, does not just read it once. */
export function usePrefersReducedMotion(): boolean

/**
 * Fires once, never resets. Returns [ref, hasEntered]. `hasEntered` is false on the server and
 * on the first client render, so a static export cannot mismatch on hydration and a lazily
 * imported visual ships its FigureSkeleton into the exported HTML.
 */
export function useInViewOnce<T extends Element>(
  options?: { threshold?: number; rootMargin?: string },
): [React.RefObject<T | null>, boolean]
```

`usePrefersReducedMotion` must return `false` on the server and during the first client render,
then update in an effect — otherwise hydration mismatches on a static export.

### `lib/theme.ts`

```ts
export type ThemeName = 'light' | 'dark'

/** localStorage first, then the OS media query. Client only; never called during render. */
export function resolveInitialTheme(): ThemeName

/** Sets document.documentElement.dataset.theme and persists to localStorage. */
export function applyTheme(theme: ThemeName): void

/**
 * The theme currently on <html>. Returns 'light' on the server and during the first client
 * render, then corrects in an effect, so a static export cannot mismatch on hydration.
 * Subscribes with a MutationObserver on documentElement's data-theme attribute, so a canvas
 * repaints when the toggle fires without either component importing the other.
 */
export function useThemeName(): ThemeName
```

Two consumers and no others: `ThemeToggle`, for `aria-pressed` and its label, and any canvas
visual that has to pick a literal colour, which in wave 1 is `PriceSurfaceCanvas` alone.
`ThemeScript` deliberately does **not** import this: it is an inline pre-paint string and
duplicates the storage key on purpose, because an import would be a round trip before first
paint and that is exactly the flash criterion 16 forbids.

**Does NOT own:** the CSS, the tokens, or the pre-paint script itself.

### `components/site/Wordmark.tsx`

```tsx
export interface WordmarkProps {
  /** Rendered mark height in px. 32 in the header, 28 in the footer. Drives the reserved box. */
  height?: number
  /** Renders as a link to '/' when true (header) and plain when false (footer). */
  asLink?: boolean
  className?: string
}
```

Reads `site.logo` from `content/site.ts` and renders the mark. There is no `null` branch, no
typographic fallback and no glyph drawn in code.

- Renders **two** `<img>` elements, `logo.src` and `logo.srcDark`, each with
  `src={withBasePath(...)}`, `width={logo.width}` and `height={logo.height}` (the intrinsic
  `72 × 232`, which is what reserves the box), sized in CSS to `height: {height}px; width: auto`.
  A CSS rule keyed on `[data-theme]` displays exactly one of them. No JS, no theme read during
  render, so nothing can mismatch on hydration.
- Accessible name: when `asLink`, the `<a>` carries `aria-label="Pizon Khan, home"` and both
  images carry `alt=""`. When **not** a link, **both** images carry `alt={logo.alt}` and
  **neither** carries `aria-hidden`. The CSS `display: none` on the inactive variant already
  removes it from the accessibility tree, so the name is announced exactly once in either theme
  with no render-time branch. Do not try to put the alt on "the visible one": which one is
  visible is a CSS fact, and this component is not allowed to read the theme during render.
- Clear space is `padding: calc(var(--wordmark-h) * 0.0862)` on all four sides, where
  `--wordmark-h` is the `height` prop in px. That is the 20-of-232 stem width the kit's README
  requires, expressed so it stays correct at any height.
- When `asLink`, the `<a>` is `display: inline-flex`, `align-items: center`,
  `justify-content: flex-start`, `min-width: 44px`, `min-height: 44px`, with
  `margin-inline-start: -8px` and matching inline padding, so the target is large enough to hit
  and the mark still lines up with the container's left edge.

**Does NOT own:** navigation, theme state, the favicon, or any layout outside its reserved box.
It never loads a font, never renders the lockup, and never renders the descriptor. Swapping the
mark later is a `content/site.ts` change plus two files, with no edit here.

### `components/ui/Portrait.tsx`

```tsx
export interface PortraitProps {
  /** Rendered CSS size in px. 88 | 120 | 240 are the only sanctioned values. */
  size: 88 | 120 | 240
  shape: 'circle' | 'rect'
  /** Eager only for the hero instance. */
  priority?: boolean
  /** Optional mono caption rendered beneath, left-aligned. */
  caption?: string
  className?: string
}
```

Renders a plain `<img>`:

```tsx
<img
  src={withBasePath('/img/portrait-640.webp')}
  srcSet={`${withBasePath('/img/portrait-256.webp')} 256w, ${withBasePath('/img/portrait-640.webp')} 640w`}
  sizes={`${size}px`}
  width={640}
  height={640}
  alt="Pizon Khan"
  loading={priority ? 'eager' : 'lazy'}
  fetchPriority={priority ? 'low' : undefined}
  decoding="async"
/>
```

wrapped in a `<span>` of exactly `size × size` with `overflow: hidden`,
`border-radius: var(--radius-full)` for `circle` / `var(--radius-md)` for `rect`, and
`box-shadow: inset 0 0 0 1px var(--border-subtle)`.

**Hard rules:** the component **never** accepts a `src`, a `width` beyond `size`, or a
`fill`/`cover` layout mode. Swapping in a better source photograph later means replacing the
two files in `public/img/` at the same dimensions — **zero code change, zero layout change**.
If a higher-resolution original arrives, add a `portrait-1280.webp` to the `srcSet` and raise
the sanctioned size union; nothing else moves.

**Does NOT own:** cropping (done at asset-prep time), art direction, any hover or scroll effect.

### `lib/viz/palette.ts`

```ts
import type { ThemeName } from '@/lib/theme'

export const SEQ: readonly [string, string, string, string, string, string, string]
export const CATEGORICAL: readonly string[]      // 6 entries
export const DIVERGING: { neg: string; mid: string; pos: string }

/** For SVG and DOM, where var() resolves. */
export const HAIRLINE_CSS = 'var(--viz-hairline)'

/** The literal values behind --viz-hairline. light: rgba(11,12,14,0.16). dark: rgba(246,246,244,0.14). */
export const HAIRLINE: Record<ThemeName, string>

/**
 * The literal values behind --accent. light: #12539E. dark: #79ACF2. Canvas selection chrome
 * only, which on this site means the kernel window outline and the focused-borough glow. Never
 * a data mark. See acceptance criterion 67.
 */
export const ACCENT: Record<ThemeName, string>

/** Maps a value to 0..6 given ascending breakpoints of length 6. */
export function rampIndexFor(value: number, breaks: readonly number[]): number
```

`SEQ` entries are the literal hex strings, **not** `var(...)` references, because they are
consumed by `CanvasRenderingContext2D.fillStyle` where `var()` does not resolve. The same seven
values are additionally declared as CSS custom properties for the SVG/DOM legend.

**The `var()` rule, written down once so nobody rediscovers it the hard way.** A canvas draws
with resolved colour strings. `ctx.fillStyle = 'var(--x)'` is invalid and is *silently ignored*,
which leaves the previous fill in place and produces a chart that is wrong rather than blank. So
every canvas component takes its colours from the literals in this module, picks between the
light and dark entry with `useThemeName()` from `lib/theme.ts`, and redraws when that value
changes. SVG and DOM components use the CSS custom properties directly and need none of this.
`SEQ`, `CATEGORICAL` and `DIVERGING` are identical in both themes, so only `HAIRLINE` and
`ACCENT` are theme-keyed.

### `lib/viz/scale.ts`

```ts
export function linearScale(domain: [number, number], range: [number, number]): (v: number) => number
export function extent(values: readonly number[]): [number, number]
export function quantileBreaks(sorted: readonly number[], bins: number): number[]
export function niceTicks(domain: [number, number], count?: number): number[]
```

### `components/viz/Figure.tsx`

```tsx
export interface FigureProps {
  /** Mono uppercase kicker, e.g. "MEDIAN LIST PRICE". */
  eyebrow: string
  /** Sentence-case figure title. */
  title: string
  /** Optional one-line explanation shown under the title. */
  caption?: string
  /** REQUIRED. Rendered in the footer. There is no unsourced figure on this site. */
  source: string
  /** Reserved aspect ratio for the well, e.g. "4 / 3". Prevents CLS. */
  ratio: string
  /** Optional controls rendered in the well's top-right (segmented control etc.). */
  controls?: React.ReactNode
  /** The accessible equivalent. REQUIRED. Rendered inside <details>. */
  table: React.ReactNode
  /** The visual itself. */
  children: React.ReactNode
  className?: string
}
```

Renders: `<figure>` → header (eyebrow, title, caption, controls) → the well (`--surface-2`,
`--radius-lg`, `aspect-ratio: {ratio}`) → `<figcaption>` (source + `<details><summary>Show the
numbers</summary>{table}</details>`).

Does NOT own: any scale, colour choice, data, or interaction. It is chrome and a11y contract only.

### `components/viz/FigureSkeleton.tsx`

```tsx
export interface FigureSkeletonProps {
  /** The eyebrow the loaded figure will print. Rendered for real, not as a grey bar. */
  eyebrow: string
  /** The title the loaded figure will print. Rendered for real. */
  title: string
  /** True when the loaded figure has a caption, so that line is reserved too. */
  hasCaption?: boolean
  /** The same string Figure receives, e.g. "4 / 3". */
  ratio: string
  className?: string
}
```

`Figure`'s box model with an empty well: the same `<figure>`, the same header margins, the real
eyebrow and title, one reserved blank line when `hasCaption`, the well (`--surface-2`,
`1px solid var(--border-subtle)`, `--radius-lg`, `aspect-ratio: {ratio}`) containing nothing,
and one reserved blank line at the height of the footer row. `aria-busy="true"` on the
`<figure>`; the well is `aria-hidden`.

**No spinner, no shimmer, no pulse, no grey skeleton bars.** It is a titled empty well. That
reads as "a figure is loading here" without adding an animation that would then need its own
reduced-motion fallback.

Its geometry *is* the contract. Swapping a `FigureSkeleton` for the figure it stands in for must
move nothing, which is what makes criterion 35 achievable on a route where every figure arrives
late. `Figure` and `FigureSkeleton` are written and edited in the same sitting; changing a header
margin in one and not the other is a defect that shows up as layout shift far from its cause.

**Does NOT own:** data, motion, colour, or the loaded figure's content. It never knows what is
coming.

### `components/viz/FigureTable.tsx`

```tsx
export interface FigureTableProps {
  caption: string
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows: Record<string, string>[]   // pre-formatted strings only
}
```

A plain `<table>` with `<caption>`, `<th scope="col">`, `tabular-nums` on right-aligned
columns, `overflow-x: auto` on the wrapper. No sorting, no virtualisation.

### `components/viz/ScaleLegend.tsx`

```tsx
export interface ScaleLegendProps {
  /** Seven colours, low → high. */
  colors: readonly string[]
  /** Six ascending breakpoint labels, pre-formatted (e.g. "$525K"). */
  breakLabels: readonly string[]
  lowLabel: string     // e.g. "Lower"
  highLabel: string    // e.g. "Higher"
  /** Index 0..6 to emphasise, or null. Used when a borough row is focused. */
  highlightIndex?: number | null
}
```

Renders seven swatches with the six breakpoint labels between them, plus low/high end labels.
`role="img"` with an `aria-label` that spells out the full range in words.

### `components/viz/AnimatedNumber.tsx`

```tsx
export interface AnimatedNumberProps {
  value: number
  /** Called to render the current value. Must be pure. */
  format: (v: number) => string
  durationMs?: number       // default DURATION.draw * 1000
  className?: string
}
```

Counts from 0 to `value` on first entry into view using `requestAnimationFrame` with
`--ease-out` applied to progress. Under reduced motion, renders `format(value)` immediately and
mounts no RAF loop. Always wrapped in `aria-live="off"`; the final value is the only thing a
screen reader reads because the element also carries `aria-label={format(value)}`.

### `components/viz/KernelSweep.tsx`

The shared convolution primitive. **Used twice: decoratively in the landing hero at 16×16 with
synthetic values, and with real image luminance at 28×28 on the bird page.** Do not write a
second convolution component.

```tsx
export type Kernel3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
]

export interface KernelSweepProps {
  /** Grid edge length. 16 for the hero, 28 for the bird page. */
  size: number
  /** Row-major input values, 0..255, length size*size. Omit for the hero's built-in pattern. */
  input?: readonly number[]
  /** The 3x3 kernel. Default: SOBEL_X. */
  kernel?: Kernel3
  /** ms per row of the sweep. Default 90. */
  rowDurationMs?: number
  /** Decorative mode: aria-hidden, no controls, one pass, then park. */
  decorative?: boolean
  /** Controlled cursor position for reduced-motion / keyboard stepping. */
  cursor?: { row: number; col: number } | null
  onCursorChange?: (c: { row: number; col: number }) => void
  className?: string
}

export const KERNELS: Record<'identity' | 'sobelX' | 'sobelY' | 'laplacian' | 'blur', Kernel3>
```

Renders two square grids side by side (stacked below 640px): the **input** grid (greyscale
cells) with a 3×3 accent-outlined window, and the **output** grid (`size - 2` edge, ramp
coloured) that fills in as the window passes. Convolution is computed in JavaScript in a
`useMemo` over the whole input — real arithmetic, no model, no network.

Motion: the window translates at constant rate (`--ease-linear`), one row per
`rowDurationMs`, and each output cell fades in over 120ms as it is produced.
**Reduced motion:** no sweep. The output grid renders complete. The window sits at
`cursor ?? {row:1,col:1}` and, in non-decorative mode, arrow keys move it one cell at a time
with the readout updating instantly.

Does NOT own: image decoding, asset loading, the layer pyramid, or the softmax panel.

### `components/project/ProjectLayout.tsx`

```tsx
export interface ProjectLayoutProps {
  record: ProjectRecord
  /**
   * The one overarching demonstration, rendered directly under the hero as the overview and
   * result. Optional: a project whose story is carried entirely by its section visuals passes
   * nothing.
   */
  centrepiece?: React.ReactNode
  /**
   * Keyed by ProjectSectionBlock.id. Each entry renders inside that section, after its prose.
   * A key with no matching section id is a defect: ProjectLayout console.errors in development
   * and renders nothing for it.
   */
  sectionVisuals?: Record<string, React.ReactNode>
  /** Escape hatch for a figure that belongs to no single section. Expected empty. */
  supporting?: React.ReactNode[]
}
```

Renders the six-part page order above. For each `record.sections[i]` it renders
`<ProjectSection {...section} visual={sectionVisuals?.[section.id]} />`. When a section declares
`hasVisual: true` and no visual is supplied, it logs a development-only `console.error` naming
the slug and the section id, and in production renders the prose alone rather than crashing the
route.

Does NOT own: any visualisation, any `Figure` wrapper, any number, any colour decision, any
imagery.

### `components/project/ProjectSection.tsx`

```tsx
export interface ProjectSectionProps {
  /** Stable anchor id. Also the sectionVisuals key. */
  id: string
  heading: string
  /** One string per paragraph. */
  body: string[]
  /** The visual demonstrating this section's idea. Already wrapped in Figure by its owner. */
  visual?: React.ReactNode
  /** Declared on the content record; drives the development-time missing-visual check. */
  hasVisual?: boolean
}
```

Renders `<section id={id}>` → an `<h2>` with a self-link anchor → the paragraphs inside `Prose`
at the `68ch` measure → the `visual`, when present, in a block **outside** the prose measure so
the figure may run to `--width-content` while the text stays readable. The visual is separated
from the prose by `--space-block` and always comes after it, because the paragraph sets up what
the figure demonstrates. The section reveal is the existing `Section` scroll-reveal; the visual
runs its own first-view animation independently, so a long section does not fire its figure
before the reader gets there.

**Does NOT own:** the figure's chrome, its data, its motion, or the choice of which figure lands
here.

### `components/project/ProjectCard.tsx`

```tsx
export interface ProjectCardProps {
  record: ProjectRecord
  /** 'index' on /projects/, 'home' on the landing page (denser). */
  variant?: 'index' | 'home'
}
```

For `status === 'planned'`: renders as a non-interactive `<article>` (no `<a>`), 70% opacity,
with a `Pill` reading "Write-up in progress". It must not be focusable.

### `components/projects/nyc/PriceSurface.tsx`

```tsx
export type SurfaceView = 'density' | 'median' | 'perSqft'

export interface PriceSurfaceProps {
  /** Defaults to 'density' so the map assembles before it means anything. */
  initialView?: SurfaceView
}
```

Owns: the `Figure` wrapper, the view segmented control (`role="radiogroup"`), the
`ScaleLegend`, the readout panel, the `BoroughTable`, and the `FigureTable` equivalent.
Delegates all drawing to `PriceSurfaceCanvas`. Imports its data from
`content/data/nyc-price-surface.ts` and `content/data/nyc-boroughs.ts`.

### `components/projects/nyc/PriceSurfaceCanvas.tsx`

```tsx
export interface PriceSurfaceCanvasProps {
  cells: PriceCell[]
  view: SurfaceView
  /** Borough to emphasise; all others drop to 20% alpha. */
  focusBorough: BoroughName | null
  /** Fires on pointer move and on canvas keyboard pan. */
  onHoverCell: (cell: PriceCell | null) => void
  /** 0..1 draw progress, driven by the parent's reveal animation. */
  progress: number
  /** From useThemeName(). Selects the hairline and glow literals; see lib/viz/palette.ts. */
  theme: ThemeName
}
```

Draws on a `<canvas>` sized by `devicePixelRatio`. Hit testing is O(1): the grid is a regular
lat/lon lattice, so pointer `(x, y)` inverts directly to `(latIndex, lonIndex)` and looks up a
`Map<string, PriceCell>`. No picking buffer, no quadtree.

Cell fills come from `SEQ`, which is theme-invariant, but the hairline stroke on every cell and
the focused-borough glow are not: both are read from `HAIRLINE[theme]` and `ACCENT[theme]` in
`lib/viz/palette.ts`, because `var()` does not resolve in a canvas. `theme` therefore belongs in
the redraw dependency list, and toggling the theme repaints the whole grid within `--dur-base`.

The canvas itself is **not** the keyboard surface — `BoroughTable` is. The canvas carries
`role="img"` and an `aria-label` summarising the view.

### `components/projects/nyc/BoroughTable.tsx`

```tsx
export interface BoroughTableProps {
  boroughs: BoroughStat[]
  view: SurfaceView
  focus: BoroughName | null
  onFocus: (b: BoroughName | null) => void
}
```

Five rows, each a `<button>` inside a `<tr>` (or `<tr tabIndex={0}>` with `role="row"` and
`aria-selected`). Focus/hover on a row sets `focusBorough`, which dims the map. This is the
keyboard path to every piece of information the map encodes.

---

## Data

### `content/site.ts`

```ts
export interface LogoSlot {
  src: string
  srcDark?: string
  width: number
  height: number
  alt: string
}

export interface SiteIcons {
  /** P-only tile. Primary icon at every size. */
  svg: string
  /** Raster fallback for clients that will not take an SVG icon. */
  png32: string
  /** apple-touch-icon. */
  apple180: string
}

export const site = {
  name: 'Pizon Khan',
  url: 'https://pizonkhan.github.io',
  title: 'Pizon Khan: data platforms, risk models, and the visuals that explain them',
  description:
    'Director of Credit Analytics in New York City. Project pages here are demonstrations: '
    + 'the pipeline, the model and the data run in front of you.',
  nav: [
    { label: 'Work', href: '/projects/' },
    { label: 'Experience', href: '/experience/' },
  ],
  /**
   * The mark, alone. Not the lockup: the lockup carries a descriptor that is not the title on
   * the resume, and it depends on a font this site does not load. Read
   * public/logo/README.md before touching any of this.
   */
  logo: {
    src: '/logo/pk-stack-ink.svg',
    srcDark: '/logo/pk-stack-light.svg',
    width: 72,
    height: 232,
    alt: 'Pizon Khan',
  } satisfies LogoSlot,
  /** Consumed only by metadata in app/layout.tsx, where each is passed through withBasePath(). */
  icons: {
    svg: '/logo/pk-favicon-16.svg',
    png32: '/logo/png/pk-32.png',
    apple180: '/logo/png/pk-180.png',
  } satisfies SiteIcons,
  integrityStatement:
    'Every figure on this site comes from a public dataset or is explicitly labelled as '
    + 'illustrative. No employer data, client names, model parameters or internal systems '
    + 'appear anywhere.',
} as const
```

### `content/projects/types.ts`

```ts
/**
 * INTEGRITY RULE: read before adding a record.
 *
 * This registry holds PERSONAL projects only. Pizon is Director of Credit Analytics at a
 * bank and cannot publish company-specific detail. There is deliberately NO employer field
 * on ProjectRecord and there never should be. Employer accomplishments belong on
 * /experience/, rendered verbatim from content/profile.ts, with no demonstration attached.
 *
 * Every `href` must be publicly reachable. Never link a private repository.
 */

export type ProjectStatus = 'live' | 'planned'
export type ProjectGlyph = 'grid' | 'kernel' | 'flow'

export interface ProjectFigure {
  label: string
  /** Pre-formatted for display. Never computed at render time. */
  value: string
  /** Where this number came from. Required. */
  source: string
}

export interface ProjectLink {
  label: string
  href: string
  kind: 'repo' | 'dataset' | 'report' | 'reference'
}

export interface ProjectDataset {
  name: string
  scale: string
  provenance: string
  href?: string
}

export interface ProjectSectionBlock {
  /**
   * Stable kebab-case anchor, unique within the record, and the key the route uses in
   * ProjectLayout's `sectionVisuals` map. Ids are per project rather than a fixed six, because
   * the theory beats differ by project. One convention holds across every record: the last
   * section is `next-time`. There is no mandatory first section. The overview and the result
   * live in the hero and the centrepiece, above `sections` entirely, so a project whose first
   * beat is `pixels` rather than `problem` is correct.
   */
  id: string
  heading: string
  /** One string per paragraph. No markdown, no HTML. */
  body: string[]
  /**
   * True when this section's argument is carried by an embedded visual, in which case the
   * route must supply sectionVisuals[id]. Checked in development, not enforced by the type.
   */
  hasVisual?: boolean
}

export interface ProjectRecord {
  slug: string
  status: ProjectStatus
  title: string
  tagline: string
  summary: string
  year: string
  /** One sentence: what the visitor will see MOVING on this page. */
  demonstration: string
  glyph: ProjectGlyph
  stack: string[]
  dataset: ProjectDataset
  /** Max 3. */
  headlineFigures: ProjectFigure[]
  sections: ProjectSectionBlock[]
  links: ProjectLink[]
  /** Rendered in the footer of every figure on the page. */
  dataStatement: string
}
```

### Sample record — `content/projects/nyc-housing-prices.ts`

```ts
import type { ProjectRecord } from './types'

export const nycHousingPrices: ProjectRecord = {
  slug: 'nyc-housing-prices',
  status: 'live',
  title: 'What a New York home is worth, and why',
  tagline:
    'Predicting sale price across 59,350 NYC listings, and finding that location beats '
    + 'every other feature combined.',
  summary:
    'A mid-west REIT wanted to know what to ask for new-build homes across the five '
    + 'boroughs, and which structures return the most. I cleaned a 1,507-column Zillow '
    + 'extract down to 32 usable features, imputed the gaps with MICE, and worked a model '
    + 'ladder from a mean baseline to a tuned XGBoost regressor.',
  year: '2021',
  demonstration:
    'The map below is not a picture of New York. It is 2,244 aggregated cells of the actual '
    + 'listing data assembling themselves. The city’s shape is an artefact of where the '
    + 'homes are.',
  glyph: 'grid',
  stack: ['Python', 'pandas', 'scikit-learn', 'XGBoost', 'MICE / IterativeImputer', 'seaborn'],
  dataset: {
    name: 'Zillow New York City listings, 2019',
    scale: '75,630 observations x 1,507 columns raw -> 62,456 x 32 after cleaning and MICE',
    provenance:
      'Public Zillow 2019 NYC extract, as used in the Springboard capstone. Figures shown '
      + 'here are aggregates of at least four listings per cell; no individual listing, '
      + 'address or owner appears on this page.',
    href: 'https://github.com/pizonkhan/Springboard-Data-Science/tree/master/Capstone%202%20-%20NYC%20Housing%20Prediction',
  },
  headlineFigures: [
    {
      label: 'Test MAE, tuned XGBoost',
      value: '$191,771',
      source: 'Notebooks/04_Modeling.ipynb, final evaluation cell',
    },
    {
      label: 'Test R²',
      value: '0.723',
      source: 'Notebooks/04_Modeling.ipynb, final evaluation cell',
    },
    {
      label: 'Manhattan median vs Staten Island',
      value: '3.3×',
      source: 'Computed from Data/final_nyc.csv: $1,870,000 vs $572,500',
    },
  ],
  sections: [
    { id: 'problem', heading: 'The problem', body: [/* see write-up guidance */] },
    { id: 'data', heading: 'From 1,507 columns to 32', body: [] },
    { id: 'imputation', heading: 'Why the gaps needed MICE', body: [], hasVisual: true },
    {
      id: 'location',
      heading: 'Location beats everything else combined',
      body: [],
      hasVisual: true,
    },
    { id: 'approach', heading: 'The model ladder', body: [], hasVisual: true },
    { id: 'result', heading: 'What it found', body: [] },
    { id: 'next-time', heading: 'What I’d do differently', body: [] },
  ],
  links: [
    {
      label: 'Capstone repository',
      href: 'https://github.com/pizonkhan/Springboard-Data-Science/tree/master/Capstone%202%20-%20NYC%20Housing%20Prediction',
      kind: 'repo',
    },
    {
      label: 'Written report (PDF)',
      href: 'https://github.com/pizonkhan/Springboard-Data-Science/blob/master/Capstone%202%20-%20NYC%20Housing%20Prediction/NYC_Housing_Report.pdf',
      kind: 'report',
    },
  ],
  dataStatement:
    'Public Zillow 2019 NYC data. Cells with fewer than four listings are omitted.',
}
```

### `content/techniques.ts`

```ts
export interface TechniqueNote {
  id: string
  title: string
  /** 2-4 sentences. General method only. */
  body: string[]
  /** Compile-time reminder of the boundary. Both fields are required. */
  scope: 'general-method'
  containsEmployerSpecifics: false
}
```

Wave-1 entries: `pd-lgd-dual-risk-rating`, `weights-of-evidence-binning`,
`point-in-time-snapshots`, `data-quality-reconciliation`. Each body describes the *idea* — what
a PD model estimates, what an LGD model estimates, why a dual rating separates the two, what
WoE binning does to a continuous driver, why a point-in-time snapshot differs from a
current-state table. **No coefficients, no bin edges, no thresholds, no portfolio names, no
system names, no accuracy figures.** The ROC figures in `profile.ts` stay on the résumé
timeline (they are on his résumé) and must not be repeated inside a technique note, because a
technique note is where a reader would read them as model documentation.

### `content/data/nyc-price-surface.ts` (generated)

```ts
export interface PriceCell {
  /** Grid indices: round(lat / 0.005), round(lon / 0.005). */
  r: number
  c: number
  /** Listing count in this cell. Always >= 4. */
  n: number
  /** Median list price, USD, rounded to the dollar. */
  med: number
  /** Median $/sqft, USD, rounded. null when fewer than 4 valid rows. */
  sqft: number | null
  /** Modal borough for the cell. */
  b: 0 | 1 | 2 | 3 | 4
}

export const GRID_STEP = 0.005
export const BOROUGH_NAMES = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] as const
export const ROW_RANGE: [number, number] = [8100, 8183]
export const COL_RANGE: [number, number] = [-14851, -14740]
export const MEDIAN_BREAKS = [525_000, 600_000, 679_841, 800_000, 962_282, 1_323_877]
export const SQFT_BREAKS = [157, 198, 236, 283, 385, 560]
export const CELLS: readonly PriceCell[] = [ /* 2,244 entries, generated */ ]
```

Verified by the planner against `Data/final_nyc.csv`: at `GRID_STEP = 0.005` with a minimum of
4 listings per cell, **2,244 cells survive, covering 99.0% of the 59,350 rows**. Raw JSON of the
compact form is ~63 KB, ~18 KB gzipped. Row index range 8100–8183 (84 rows), column index range
−14851 to −14740 (112 columns). `MEDIAN_BREAKS` and `SQFT_BREAKS` above are the septile
breakpoints the planner computed from that same aggregation — the generator must reproduce them
exactly; if it does not, the generator is wrong.

### `content/data/nyc-boroughs.ts` (generated) — planner-verified values

```ts
export interface BoroughStat {
  name: string
  n: number
  median: number
  mean: number
  p25: number
  p75: number
  medianPerSqft: number
  /** p10..p90, nine values. */
  deciles: number[]
}
```

| Borough | n | median | mean | p25 | p75 | median $/sqft |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Manhattan | 3,575 | 1,870,000 | 4,253,143 | 782,000 | 4,400,000 | 968 |
| Brooklyn | 12,794 | 969,500 | 1,341,580 | 680,500 | 1,500,000 | 429 |
| Queens | 22,049 | 725,000 | 843,129 | 505,000 | 960,000 | 248 |
| Bronx | 8,778 | 599,000 | 698,800 | 465,000 | 740,000 | 236 |
| Staten Island | 12,154 | 572,500 | 641,616 | 450,000 | 725,000 | 177 |
| **All** | **59,350** | **700,000** | **1,093,371** | — | — | — |

Deciles p10…p90:

| Borough | p10 | p20 | p30 | p40 | p50 | p60 | p70 | p80 | p90 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Manhattan | 461,000 | 674,500 | 900,000 | 1,325,000 | 1,870,000 | 2,495,000 | 3,450,000 | 5,750,000 | 9,995,000 |
| Brooklyn | 500,000 | 635,000 | 735,000 | 840,000 | 969,500 | 1,150,000 | 1,360,000 | 1,680,000 | 2,350,000 |
| Queens | 310,000 | 450,000 | 555,000 | 640,000 | 725,000 | 814,843 | 900,000 | 999,999 | 1,325,000 |
| Bronx | 340,000 | 435,000 | 490,000 | 545,000 | 599,000 | 650,000 | 700,000 | 775,000 | 899,000 |
| Staten Island | 349,000 | 422,458 | 478,000 | 529,000 | 572,500 | 625,000 | 680,000 | 775,000 | 925,000 |

Source for every number in these two tables: `Capstone 2 - NYC Housing Prediction/Data/final_nyc.csv`
in `github.com/pizonkhan/Springboard-Data-Science` (59,350 rows, the borough-labelled cleaned
Zillow 2019 extract). Computed by the planner; the generator script must reproduce them.

### `content/data/nyc-model-ladder.ts` (hand-transcribed)

```ts
export interface ModelResult {
  name: string
  /** Test-set mean absolute error, USD. */
  mae: number
  /** Test-set R-squared. null for the mean baseline. */
  r2: number | null
  /** Test-set MAPE as a fraction. null where not recorded. */
  mape: number | null
  note?: string
}
```

| Model | Test MAE | Test R² | MAPE |
| --- | ---: | ---: | ---: |
| Predict the mean | 495,842.77 | — | — |
| Linear regression | 379,598.39 | 0.348 | 0.535 |
| k-NN, k = 2 | 261,900.76 | 0.578 | 0.315 |
| k-NN tuned, k = 18 | 249,954.91 | 0.624 | 0.322 |
| Random forest, defaults | 236,077.92 | 0.675 | 0.326 |
| Random forest tuned (80 trees, depth 14) | 222,413.37 | 0.698 | 0.301 |
| XGBoost, defaults | 220,371.98 | 0.697 | 0.290 |
| **XGBoost tuned, log target** | **191,770.86** | **0.723** | **0.216** |

Source: `Capstone 2 - NYC Housing Prediction/Notebooks/04_Modeling.ipynb`, printed cell outputs.
Tuned parameters: `max_depth 9, min_child_weight 3, eta 0.05, subsample 1.0,
colsample_bytree 0.8, objective reg:squarederror, eval_metric mae`.

> **Provenance note the developer must not "fix".** The `Redo/Preprocessing and Modeling.ipynb`
> notebook contains a *different* tuning run that lands on `max_depth 6, colsample_bytree 0.9`
> and MAE `198,190.93`. The published report and `Data/gbtuned.PNG` use the `Notebooks/04`
> numbers, so those are the ones the site shows. Record this discrepancy in a code comment.

---

## Visual & motion design

### Landing hero — see "Landing page" above.

### NYC page — which visual belongs to which section

| Position | Section id | What the visitor reads | What they see move |
| --- | --- | --- | --- |
| Hero | — | Title, tagline, three headline figures: `$191,771` test MAE, `0.723` test R², `3.3×` Manhattan over Staten Island | Nothing. Static, above the fold, the LCP element is the `<h1>`. |
| Centrepiece | — | The `demonstration` sentence | `PriceSurface`: 2,244 cells assembling into the shape of New York, then recolouring by price |
| 1 | `problem` | The brief: what to ask for new-build homes across five boroughs, and which structures return the most | Prose only |
| 2 | `data` | 75,630 × 1,507 raw down to 62,456 × 32, and the $100K to $10M price bracket | Prose only |
| 3 | `imputation` | Why a mean fill was wrong and MICE was not | `ImputationSpread` |
| 4 | `location` | The Spearman heatmap ranked latitude and longitude low; the tree models disagreed | `BoroughSpread` |
| 5 | `approach` | Mean baseline to tuned XGBoost, eight rungs | `ModelLadder` |
| 6 | `result` | What the model found, and the borough recommendation | Prose only, pointing back at the map |
| 7 | `next-time` | What he would do differently | Prose only |

Three of the seven sections carry a visual. That is the ratio to hold: a figure appears because
it proves the paragraph beside it, not because the page has gone too long without one.

### NYC centrepiece (overview and result) — `PriceSurface`

**Well aspect ratio `4 / 3`.** The grid is 112 columns × 84 rows; at 900 px wide each cell is
~8 px. Cells are drawn as squares with a 1 px gap.

**Three linked views**, switched by a `role="radiogroup"` segmented control:

| View | Encoding | Legend |
| --- | --- | --- |
| `density` (default) | Neutral `--text-tertiary` at alpha `0.25 + 0.75 * (n / 40, clamped)` | "Fewer listings → more listings" |
| | *Fill-is-the-encoding, so the 3:1 floor does not apply here. See the Colour section.* | |
| `median` | 7-step `SEQ` ramp binned by `MEDIAN_BREAKS` | `$525K · $600K · $680K · $800K · $962K · $1.32M` |
| `perSqft` | Same ramp binned by `SQFT_BREAKS`; cells with `sqft === null` drawn as an outline only | `$157 · $198 · $236 · $283 · $385 · $560` |

**Entry animation (the three-second hook).** On first view (`useInViewOnce`), the `density`
view assembles: each cell's `progress` threshold is `distanceFromCentroid / maxDistance`, so
cells appear in an expanding ring from the geographic centroid outward. Each cell fades
`0 → 1` and scales `0.4 → 1` about its own centre over 220 ms once its threshold is crossed.
Total sequence `--dur-draw` (900 ms). The result: New York City's five boroughs, its water
gaps, and the Manhattan spine draw themselves out of the listing data. Nothing about the map is
a basemap — the shape *is* the data. Say so in the caption.

**View change animation.** `--dur-base` (240 ms), `--ease-in-out`, colour interpolation only.
Cell geometry never moves between views, so the eye tracks the same places.

**Borough interrogation.** Hover or keyboard-focus a `BoroughTable` row →
`focusBorough` set → non-matching cells animate to `alpha 0.2` over `--dur-fast`, matching
cells keep full alpha and gain a 1 px `--accent` outer glow; the readout panel above the table
fills with `n / median / p25–p75 / median $ per sq ft`. Hovering a *cell* on the canvas sets
the same state plus a cell-level readout (`n listings · median $X`). The readout panel is
always present (it shows the all-boroughs summary when nothing is focused), so a keyboard user
never depends on a transient tooltip.

**Reduced motion.** No assembly: the grid paints complete on first view with a single 120 ms
opacity fade. No colour interpolation on view change — instant recolour. No alpha transition on
borough focus — instant. Everything else (interaction, readouts) is unchanged.

**Accessible equivalent.** `Figure`'s `<details>` contains a `FigureTable` with one row per
borough: name, listings, median, p25, p75, median $/sqft — the same numbers the map encodes,
plus a sentence naming the highest and lowest cell medians. The canvas is `role="img"` with
`aria-label` regenerated per view, e.g. *"Map of 2,244 aggregated cells across New York City,
coloured by median list price from $172,500 to $22,000,000. Manhattan is highest."*

**Figure copy.** Eyebrow `59,350 LISTINGS`. Title `New York, drawn by its own listings`.
Caption `Nothing here is a basemap. The shape is where the homes are.` Source
`Zillow 2019 NYC extract, 59,350 cleaned listings aggregated into 2,244 cells of at least four listings each.`
The eyebrow and title do not change between views, because `FigureSkeleton` prints them before
the chunk arrives and a title that changed on load would be a layout shift and a surprise. These
four strings are duplicated in `NycVisuals.tsx`'s `CHROME` map; keep them in step.

### NYC section visual, `#imputation` — `ImputationSpread`

The theory beat: **one number cannot stand in for a distribution.** This is the only figure on
the NYC page whose values are synthetic, and it says so in its own source line, because the
per-column null rates are not recoverable from the committed cleaned CSV and inventing them
would be a fabrication. What is real here is the mechanism, and the mechanism is the point of
the section.

**Well aspect ratio `16 / 9`.** One histogram of one feature, 24 bins, drawn from a hardcoded
array in the component's own module. No RNG at runtime and no seed, so every visitor and every
screenshot sees the same shape.

**No axis on this figure carries a unit.** The x axis is bin index, labelled `low` on the left
and `high` on the right, and the y axis is a row count. There is no dollar sign, no square-foot
label and no feature name that maps to a Zillow column, so nothing here can be misread as a
measurement from the dataset.

**Three states**, switched by a `role="radiogroup"` segmented control:

| State | What is drawn |
| --- | --- |
| `observed` (default) | Only the rows that had a value. A right-skewed distribution with a visible bite out of it. |
| `mean` | The same bars plus every filled row stacked on top, all of them landing in the one bin containing the mean. That bin runs off the top of the well, is clipped, and prints its true count above the clip with a caret. |
| `mice` | The same bars plus the filled rows distributed in proportion to the conditional shape, so the silhouette stays the silhouette. |

The imputed portion is drawn in `--viz-seq-5` (`#C94371`) **with a 45-degree hatch** and a direct
text label reading `imputed`, so the observed/imputed split is carried by texture and label
rather than by colour. Observed bars are `--text-tertiary` at **full opacity**, with a
`--viz-hairline` rule where the two segments meet.

| Mark | Token | On the `--surface-2` well |
| --- | --- | ---: |
| Observed rows | `--text-tertiary` | 5.05:1 light, 5.15:1 dark |
| Imputed rows | `--viz-seq-5` + 45° hatch + `imputed` label | 3.92:1 light, 3.67:1 dark |

Two earlier choices are **withdrawn** and must not come back. `--viz-seq-4` measured 2.49:1 on
the dark well, and `--text-tertiary` at 60% alpha measured 2.39:1 light and 2.69:1 dark, so on a
dark screen the figure's whole argument was a pair of shapes you had to squint at. The two fills
that replace them are close in luminance to each other on purpose: the observed and imputed
segments stack into one bar whose total height is the quantity, and the split between them is
read from the hatch and the label, which is the second channel family rule 5 requires.

**Motion.** On first view the `observed` bars grow bottom-up over `--dur-draw` with `--stagger`
across bins, capped at 8 steps. Switching state animates only the imputed segment's height over
`--dur-base` with `--ease-in-out`; the observed bars never move, so the eye compares like with
like. The clipped bar in `mean` overshoots by 4% and settles once over `--dur-fast`.
**Reduced motion:** final heights on first paint, instant state change, no overshoot.

**Copy.** Eyebrow: `MISSING DATA`. Title: `What a mean fill does to a distribution`. Caption:
`Same rows, same gaps, two ways of filling them.` Source:
`Illustrative. Synthetic values chosen to show the mechanism, not measurements from the Zillow extract.`
The eyebrow and title are duplicated in `NycVisuals.tsx`'s `CHROME` map so the skeleton can
print them; keep them in step.

**Accessible equivalent.** `FigureTable` with one row per bin: bin index, observed count, count
after mean fill, count after MICE, plus a closing sentence naming the tallest bin's height in
each state. The segmented control is keyboard operable with arrow keys and announces its state
through `aria-checked`.

### NYC section visual, `#location` — `BoroughSpread`

Attached to the section arguing that location dominates. The prose makes the Spearman-versus-
trees point (the heatmap ranked latitude and longitude low, while the tree models put
`longitude` seventh of twenty-three, above `livingArea` and `Bedrooms`); this figure is what
makes it obvious, because five boroughs' decile bands barely overlap.

**Well aspect ratio `16 / 9`.** Five horizontal decile strips, one per borough, on a shared
log-scaled x axis from $100K to $10M (the wrangling bounds Pizon used), ordered by median with
the highest at the top. Each strip is three marks, and **no accent token appears anywhere in
this figure**:

| Mark | Encodes | Token | Geometry |
| --- | --- | --- | --- |
| Whisker | p10 to p90 | `--text-tertiary` | 2 px rule, 8 px end caps at both ends |
| Band | p30 to p70 | `--viz-cat-6` fill, `--viz-hairline` stroke | 14 px tall, `--radius-sm` |
| Median tick | p50 | `--text-primary` | 2 px wide, 22 px tall, so it overhangs the band |

Thickness and containment tell the three apart before colour does, and every one of them is
labelled in text: `p10` and `p90` under the Manhattan strip, `p30 to p70` inside the Manhattan
band, the borough name at the strip start, and the median value in mono at the strip end.
Nothing in this figure is carried by colour alone.

**Non-text contrast, measured.** Every mark clears 3:1 against what it sits on, in both themes:

| Pair | Light | Dark |
| --- | ---: | ---: |
| `--viz-cat-6` band on the `--surface-2` well | 4.20:1 | 3.43:1 |
| `--text-tertiary` whisker on the `--surface-2` well | 5.05:1 | 5.15:1 |
| `--text-primary` median tick on the `--viz-cat-6` band | 3.93:1 | 4.60:1 |

`--accent-wash` was the original band fill and is **withdrawn**: it measures 1.00:1 on the light
well and 1.14:1 on the dark one, which made the interquartile spread, the thing this figure
exists to show, invisible in both themes. `--border-strong` was the original whisker and went
with it at 1.42:1 and 1.63:1. Do not restore either.

**Motion.** On first view each strip's whisker draws left to right over `--dur-slow`, staggered
40 ms, then its band and median tick fade in over `--dur-fast`. Reduced motion: drawn complete,
one 120 ms fade.

**Figure copy.** Eyebrow `LIST PRICE BY BOROUGH`. Title `Five boroughs, five distributions`.
Caption `Manhattan's spread is the story: its p90 is over 4× Brooklyn's.` Source
`Zillow 2019 NYC extract, 59,350 cleaned listings.`
`FigureTable` = the decile table above.

### NYC section visual, `#approach` — `ModelLadder`

Attached to the model-ladder section, the third theory beat: every rung buys error reduction,
and the last rung buys it from the target transform rather than from the algorithm.

**Well aspect ratio `16 / 9`.** Horizontal bars, one per model, ordered worst → best top to
bottom, x = test MAE. The figure is deliberately monochrome, because it charts one metric and a
second hue would imply a second dimension that is not there:

| Mark | Token | On the `--surface-2` well |
| --- | --- | ---: |
| The winning rung (tuned XGBoost, log target) | `--text-primary` | 16.51:1 light, 15.76:1 dark |
| Every other rung | `--text-tertiary` | 5.05:1 light, 5.15:1 dark |

The two bar tones are 3.27:1 apart light and 3.06:1 dark, so the winner is distinguishable from
the rest without relying on hue at all. `--viz-seq-7` was the original winning fill and is
**withdrawn**: it measures 1.66:1 on the light well, which makes the one bar the figure exists to
single out the hardest one to see. Every bar prints its model name at the bar start and its MAE
at the bar end in mono, and the winning bar additionally prints `best`, so the ranking survives
with no colour at all. On first view the bars grow left → right over `--dur-draw` with
`--stagger` 40 ms, so the error visibly shrinks down the list. Reduced motion: final widths, one
fade.

**Figure copy.** Eyebrow `MODEL LADDER`. Title `Eight rungs from the mean to XGBoost`. Caption
`Every rung buys error. The last one buys it from the target transform, not the algorithm.`
Source `Capstone notebook 04_Modeling.ipynb, printed test-set results.`
`FigureTable` = the eight-row table above with MAE, R² and MAPE columns.

### Bird page — theory sections (wave 2, specified now)

The bird narrative was already a five-stage sequence, which is close to the shape Pizon asked
for. It is now written as that shape rather than hidden inside a stepper: five theory sections,
each with its own prose and its own embedded visual, read top to bottom by scrolling. The
tablist stepper is **withdrawn**, and with it its `aria-selected` bookkeeping and the fact that
four of five stages were invisible on arrival.

| Position | Section id | The idea the section argues | Visual |
| --- | --- | --- | --- |
| Hero | — | 315 species, 97.651% top-1 | Nothing |
| Centrepiece | — | The whole result, before any explanation | `ResultsLadder` |
| 1 | `pixels` | An image is a matrix of numbers | `PixelMatrix` |
| 2 | `convolution` | A filter is nine numbers, and edges fall out of it | `KernelSweep` at 28 × 28 |
| 3 | `depth` | Space shrinks, meaning accumulates | `LayerPyramid` + `ActivationStrip` |
| 4 | `decision` | 4,096 numbers become one bird | `SoftmaxRace` |
| 5 | `transfer` | What was frozen, what was retrained, what that bought | `TransferDiagram` |
| 6 | `next-time` | The 8 GB GPU, the grayscale experiment, the three tuners | Prose only |

**`ResultsLadder` moves to the top.** It used to be the last thing on the page; it is now the
centrepiece, immediately under the hero, because the overview and the results come first. Eight
bars from 0.317% (a dense-only network, exactly chance at 1 in 315) to 97.651%, each labelled
with its model name at the bar start. On first view the bars grow left to right over
`--dur-draw`, `--stagger` 40 ms, so the climb is visible. The chance rung is marked with a
dashed `--border-strong` rule and the printed label `chance, 1 in 315`, so the floor is not
something the reader has to work out. Reduced motion: final widths, one fade.

**1. `PixelMatrix`.** The 448 px source photo cross-fades over 600 ms into a 28 × 28 grid of
greyscale cells; twelve cells then reveal their integer luminance in mono over `--dur-slow`.
The twelve are chosen at asset-build time, not at runtime, so the figure is deterministic.
*Reduced motion:* the grid renders directly with the twelve values already shown.

**2. `KernelSweep` at 28 × 28.** `<KernelSweep size={28} input={luminance28} />` with a kernel
picker (identity, Sobel-X, Sobel-Y, Laplacian, blur). The window sweeps at 90 ms per row (26
rows, about 2.3 s); a live readout shows the nine input values, the nine kernel weights, their
products and the sum. This is real arithmetic in the browser. *Reduced motion:* no sweep, output
complete, arrow keys step the window and the readout updates.

**3. `LayerPyramid` + `ActivationStrip`.** Five slabs representing VGG16's real block outputs —
224²×64, 112²×128, 56²×256, 28²×512, 14²×512, 7²×512 — footprint halving, depth growing. Slabs
collapse inward in sequence, 5 × 180 ms staggered. Alongside, `ActivationStrip` shows six
channel thumbnails for the selected block from a **stock ImageNet VGG16 forward pass** on the
shipped photo; tiles fade in staggered 40 ms. *Reduced motion:* slabs and tiles render final;
block selection still works.

**4. `SoftmaxRace`.** Flatten 25,088 → 4,096 → 4,096 → softmax. A bar race over the **top 8
ImageNet-1k classes with the real probabilities from that same forward pass**: bars grow from 0
over `--dur-sequence` (1,800 ms), re-sorting as they grow, the winner pulsing once
(`scale 1 → 1.02 → 1`, 240 ms) on settle. Class names are always printed at the bar start,
never colour-only. *Reduced motion:* final bar widths, sorted, no pulse.

**5. `TransferDiagram`** (new; it replaces what the stepper called S5). The honest bridge, and
now a visual instead of only a caption. A vertical stack of VGG16's five blocks plus the head,
each block labelled with its conv layers and parameter count. Blocks 1 to 3 are drawn with a
45-degree hatch and the printed word `frozen`; blocks 4 and 5 are solid `--surface-2` with the
printed word `fine-tuned`; the 1,000-way head is drawn struck through with a 315-way head
beside it and a connecting rule between them. On first view the frozen blocks fade in, then the
fine-tuned pair, then the head swap draws its connector; total `--dur-draw`. Meaning is carried
by the printed words and the hatch, never by fill alone. *Reduced motion:* final state, one fade.

Caption, stated plainly rather than implied: *"Everything above this point is stock ImageNet
VGG16, the backbone I froze. I replaced the 1,000-way head with a 315-way one, froze blocks 1
to 3, and fine-tuned from block4_conv1."*

**Accessible equivalents.** Each section's figure carries its own `<details>` table: `pixels`
the 28 × 28 matrix summary (min, max, mean, plus the twelve revealed values), `convolution` the
kernel matrix and a worked example of one output cell, `depth` the VGG16 layer table, `decision`
the top-8 class and probability list, `transfer` the block table with frozen or fine-tuned state
and parameter counts, and the centrepiece the eight-row results table. Because the stepper is
gone there is no tablist, no `role="tabpanel"` and no `aria-live` stage announcement to get
wrong; each figure is an ordinary landmark in reading order.

**Performance.** Six lazily-imported visuals on one route, following the same two-file shape
the NYC route uses and for the same reason: `app/projects/bird-species-cnn/page.tsx` stays a
Server Component with a `metadata` export, and every `next/dynamic` call with `ssr: false`, its
`FigureSkeleton` reservation and its 200 px viewport gate live in one `'use client'` module,
`components/projects/bird/BirdVisuals.tsx`, with its own `CHROME` map. See **Route shape**.
Budget: route first-load JS ≤ **115 KB gzipped**, the six visual chunks ≤ **70 KB gzipped**
combined, and the pre-generated assets ≤ **320 KB** as tabulated below.

### Bird — `ResultsLadder` data (verified from the notebooks)

| Model | Result | Where |
| --- | ---: | --- |
| Dense-only MLP, no convolution | 0.317% | nb01 cell 90 — exactly chance (1/315) |
| Grayscale CNN, 100 epochs | ~30% peak, 20.8% final val | nb01 cells 102–104 |
| Baseline CNN, 2 conv blocks, 10 epochs | 60.762% | nb01 cell 95 |
| Tuned custom CNN, 3 conv blocks, 9,131,387 params | 73.206% | nb01 cell 133 |
| EfficientNetB0, frozen backbone | 49.778% | nb02 cell 26 |
| EfficientNetB0, low-LR pass | 70.095% | nb02 cell 33 |
| VGG16, frozen backbone + new 315-way head | 94.984% | nb02 cell 60 |
| **VGG16, fine-tuned from `block4_conv1`** | **97.651%** | **nb02 cell 75** |

Dataset facts: 315 species; 45,980 train / 1,575 test / 1,575 validation images, all
224×224×3 JPG; 5 test and 5 validation images per species; most-represented species House
Finch (249 train), least Black Swan (119); mean 145.97 train images per species. Source:
`Capstone 3/Notebooks/01_*.ipynb` cells 17, 29–31. Public dataset:
`https://www.kaggle.com/gpiosenka/100-bird-species`.

Custom-CNN layer table (transcribed from `model.summary()`, nb01 cell 131):
`Conv2D 3×3×32 same → (56,56,32) 896` · `MaxPool → (28,28,32)` · `Conv2D 3×3×64 → (28,28,64)
18,496` · `MaxPool → (14,14,64)` · `Conv2D 3×3×128 → (14,14,128) 73,856` · `MaxPool →
(4,4,128)` · `Flatten → 2,048` · `Dense 2048 4,196,352` · `Dropout 0.2` · `Dense 2048
4,196,352` · `Dropout 0.2` · `Dense 315 softmax 645,435`. **Total 9,131,387.**

VGG16 layer table (from the report's printed summary): 13 conv layers in five blocks
(64,64 / 128,128 / 256,256,256 / 512,512,512 / 512,512,512), spatial 224 → 112 → 56 → 28 → 14 →
7, flatten 25,088, fc1 4,096 (102,764,544 params), fc2 4,096 (16,781,312), head 315
(1,290,555). Backbone total after removing the 1,000-way head: **134,260,544**.

### Bird — assets to pre-generate and commit

Generated by `scripts/build-bird-assets.py` (Python 3, `tensorflow`, `Pillow`, `numpy`) — run
manually by Pizon, **never in CI**. Committed outputs under `public/projects/bird-species-cnn/`:

| Asset | Content | Budget |
| --- | --- | --- |
| `bird-source.webp` | 448×448 public-domain bird photo (USFWS / Wikimedia CC0). `TODO(pizon):` choose the photo; attribution string goes in the project record. | ≤ 60 KB |
| `luminance-28.json` | 28×28 array of 0–255 integers, box-downsampled greyscale of the photo. Drives `KernelSweep`. | ≤ 3 KB |
| `activations/block1.webp` … `block5.webp` | One sprite sheet per VGG16 block: 6 channels × 96×96 greyscale, laid out 6 × 1 (576×96). From `block{n}_conv1` of **stock ImageNet VGG16** (`keras.applications.VGG16(weights='imagenet')`). | ≤ 25 KB each |
| `activations.json` | Per block: layer name, output shape, the six channel indices, one-line caption. | ≤ 2 KB |
| `softmax-top8.json` | `[{ label, probability }] × 8` from the same forward pass, real values. | ≤ 1 KB |

Total asset budget **≤ 320 KB**, all lazy-loaded with the centrepiece chunk.

**Why stock ImageNet weights and not Pizon's checkpoint:** his fine-tuned weights are not in the
public repo (`Capstone 3/Notebooks/saved_model.pb` is an EfficientNetB0 *graph* with no
`variables/` directory — the weights were stripped). Stock VGG16 blocks 1–3 are literally the
frozen layers of his model, so the activations shown are the real early layers of the real
architecture. The page says this in plain words rather than implying otherwise.

**Do not ship** `Capstone 3/Notebooks/model_plot.png` or `basic_cnn_plot.png` — they are
byte-identical and both depict the 60.8% baseline CNN, not the final model.

---

## Acceptance criteria

Numbered so a tester can pass or fail each without judgment.

### Build & export

1. `npm run typecheck` exits 0.
2. `npm run lint` exits 0 with zero warnings.
3. `npm run build` exits 0 and `out/` contains `index.html`, `experience/index.html`,
   `projects/index.html`, `projects/nyc-housing-prices/index.html`, `404.html`.
4. `grep -rn "izinex" --include='*.ts' --include='*.tsx' --include='*.md' .` (excluding
   `node_modules/` and `Resume/`) returns no matches.
5. No file under `app/`, `components/`, `lib/` or `content/` contains a string matching
   `href="/[^"]` or `src="/[^"]` for a local asset; every local asset path goes through
   `withBasePath()`. (Internal `next/link` route hrefs are exempt and must all end in `/`.)
6. `grep -rn "https://pizonkhan.github.io"` matches only `content/site.ts` (consumed by
   `metadataBase` in `app/layout.tsx`).
7. `NEXT_PUBLIC_BASE_PATH=/preview npm run build` also exits 0, and no emitted HTML under
   `out/` contains the string `"/_next/` without the `/preview` prefix.

### Content integrity

8. `content/projects/types.ts` contains no field named `employer`, `company` or `client`, and
   `ProjectRecord` has none.
9. `grep -rn "components/viz\|components/projects\|content/projects" app/experience components/experience`
   returns no matches.
10. Every `ProjectLink.href` in `content/projects/*.ts` starts with `https://github.com/pizonkhan/`
    or `https://www.kaggle.com/`. No other host appears.
11. Every entry in `content/techniques.ts` has `scope: 'general-method'` and
    `containsEmployerSpecifics: false`, and no `body` string contains a digit other than as part
    of an ordinary word (spot-check: no percentages, no dollar amounts, no ratios).
12. `components/viz/Figure.tsx` types `source` and `table` as required (non-optional) props.
13. The integrity statement from `content/site.ts` is rendered in the site footer on every page.
14. Every number rendered on `/experience/` appears verbatim in `content/profile.ts`.

### Design system

15. `app/globals.css` defines all tokens listed in the Colour, Typography, Spacing and Motion
    tables above, with the exact hex values given, including `--surface-0` `#F6F6F4` light and
    `#0B0C0E` dark, `--text-primary` `#0B0C0E` light and `#F6F6F4` dark, and `--accent`
    `#12539E` light and `#79ACF2` dark.
16. Toggling the theme changes `document.documentElement.dataset.theme` between `light` and
    `dark`, persists to `localStorage`, and produces no flash of the wrong theme on a hard
    reload (verified by loading with the toggle set to dark and observing the first painted
    frame).
17. Every text token measured against `--surface-0`, `--surface-1` and `--surface-2` meets
    WCAG AA (≥ 4.5:1 for body, ≥ 3:1 for ≥ 24px text) in **both** themes, and each measured
    ratio matches the ratio table in the Colour section to within 0.05. Separately, **every
    geometry-is-the-encoding mark on the site clears 3:1 against the `--surface-2` well in both
    themes**: the three `BoroughSpread` marks, both `ImputationSpread` fills, and both
    `ModelLadder` bar tones. Each measured ratio matches the per-figure table to within 0.05.
    The price surface's ramp and density alpha are the one exemption, and the exemption is
    written in the Colour section. No mark anywhere uses `--text-tertiary` below full opacity,
    and neither `--viz-seq-7` nor `--viz-seq-4` is used as a flat geometry fill.
18. Every interactive element shows a visible `:focus-visible` ring of
    `2px solid var(--accent)` with `2px` offset. No `outline: none` without a replacement.
19. Exactly three font families load, all via `next/font/google`; no `<link>` to
    `fonts.googleapis.com` appears in the exported HTML.

### Accessibility

20. Every visualisation is wrapped in `Figure` and therefore has a `<details>` disclosure
    containing a `<table>` with the same information. The only `<figure>` element on the site
    without a `<details>` is `FigureSkeleton`, which carries `aria-busy="true"` and is replaced
    by the real figure when its chunk lands.
21. Axe (or Lighthouse a11y) reports **zero** violations on `/`, `/experience/`, `/projects/`
    and `/projects/nyc-housing-prices/`; Lighthouse Accessibility score is 100 on all four.
22. Every piece of information the price-surface map encodes by colour is reachable by keyboard
    through `BoroughTable` and readable in the persistent readout panel — no information is
    hover-only.
23. Tabbing through `/projects/nyc-housing-prices/` reaches: skip link, wordmark, header nav,
    theme toggle, the three price-surface view radios, five borough rows, the three
    `ImputationSpread` state radios, each figure's "Show the numbers" disclosure, meta links,
    footer links — in DOM order, with no keyboard trap.
24. `planned` project cards are not focusable and contain no `<a>`.
25. A skip link is the first focusable element on every page and moves focus to `<main>`.

### Motion

26. With `prefers-reduced-motion: reduce` emulated, loading `/` and
    `/projects/nyc-housing-prices/` produces **no** element whose computed
    `transition-duration` or `animation-duration` exceeds 150 ms.
27. Under reduced motion, the price surface renders all 2,244 cells at final colour within the
    first painted frame after its chunk loads, and no autoplay control is present anywhere on
    the site.
28. Every JS animation in the repo reads `usePrefersReducedMotion` from `lib/motion.ts`; no file
    imports `useReducedMotion` from `framer-motion`
    (`grep -rn "useReducedMotion" components lib app` returns nothing).
29. No animation loops. `grep -rn "repeat: Infinity\|infinite"` in `components/` returns nothing.
30. The portrait has no transition, transform, filter or animation of its own in either theme.

### Performance budget

31. `/` first-load JS ≤ **120 KB gzipped** as reported by `next build`'s route table. Re-baselined
    from an initial 105 KB after wave 1 verification: `/_not-found`, an empty page with zero
    page-specific code, already measures 103 KB from the React 19 + Next 15.5 App Router shared
    runtime alone, so 105 KB was never achievable. 120 KB leaves headroom above the measured
    103 KB floor plus this route's own ~13-16 KB, without inviting real page-code bloat back in.
32. `/projects/nyc-housing-prices/` first-load JS ≤ **130 KB gzipped**; the lazily-loaded
    `PriceSurface` chunk (component code + `framer-motion` + the three data modules) ≤ **60 KB
    gzipped**; and the three section-visual chunks (`ImputationSpread`, `BoroughSpread`,
    `ModelLadder`) ≤ **30 KB gzipped** combined. Splitting the figures across sections must not
    raise the route's first-load number, because none of them is in it.
33. `content/data/nyc-price-surface.ts` is ≤ **90 KB** on disk and ≤ **24 KB gzipped**.
34. All four NYC visual chunks are outside the route's first-load JS and each is requested
    only when its container comes within 200 px of the viewport. Verified in the network panel
    at a 375 × 667 viewport: on load none of the four is requested; scrolling to the centrepiece
    requests exactly one; the three section chunks then arrive in section order. The gating
    lives in `components/projects/nyc/NycVisuals.tsx` and nowhere else.
35. Cumulative Layout Shift < **0.02** on all four routes (every `Figure` well and every
    `Portrait` box reserves its size before its bytes land).
36. Lighthouse Performance ≥ **95** on mobile emulation for `/` and
    `/projects/nyc-housing-prices/`.
37. Total font payload ≤ **135 KB**, of which ≤ **50 KB** is preloaded.
38. Total image payload on `/` ≤ **75 KB**, and the LCP element on `/` is the `<h1>`, not an
    image (verified in the Lighthouse LCP breakdown).

### Imagery and the logo

39. `public/img/` contains exactly two files: `portrait-256.webp` (256 × 256) and
    `portrait-640.webp` (640 × 640). No other image is committed under `public/img/` in wave 1.
    `public/logo/` is Pizon's supplied brand kit and is exempt from this count.
40. Neither committed portrait contains an EXIF block (`grep -c $'Exif\0\0'` returns 0) and
    both are sRGB, not Display P3.
41. `portrait-640.webp` ≤ 55 KB, `portrait-256.webp` ≤ 18 KB.
42. `Photos/` is listed in `.gitignore` and `git ls-files Photos` returns nothing.
43. No file anywhere in the repo references `PizonLogo`, `IMG_4522`, or any filename from the
    previous site.
44. `Portrait` is rendered at exactly 88, 120 or 240 CSS px and nowhere else; the union type
    permits no other value, so a larger use is a type error.
45. Every `<img>` in the repo has explicit `width` and `height` attributes and a `src` produced
    by `withBasePath()`.
46. The header renders the stack mark at exactly 32 CSS px tall and the footer at 28 CSS px
    tall, measured with `getBoundingClientRect()`, and each rendered width equals its height ×
    72 / 232 within 0.5 px. No typographic wordmark, no `logo === null` branch and no
    `K`-plus-square glyph exists anywhere in `components/site/Wordmark.tsx`.
47. `components/site/Wordmark.tsx` is the only component that references `site.logo`, and
    `app/layout.tsx` is the only file that references `site.icons`.

### NYC demonstration correctness

48. `content/data/nyc-boroughs.ts` reproduces the planner-verified borough table exactly:
    Manhattan n = 3,575 median = 1,870,000; Brooklyn n = 12,794 median = 969,500;
    Queens n = 22,049 median = 725,000; Bronx n = 8,778 median = 599,000;
    Staten Island n = 12,154 median = 572,500.
49. `CELLS.length === 2244`, every cell has `n >= 4`, and no cell carries an address,
    neighbourhood or any per-listing field.
50. `MEDIAN_BREAKS` equals `[525000, 600000, 679841, 800000, 962282, 1323877]` and
    `SQFT_BREAKS` equals `[157, 198, 236, 283, 385, 560]`.
51. `content/data/nyc-model-ladder.ts` reproduces the eight-row table exactly, including
    `191770.86 / 0.723 / 0.216` for the tuned XGBoost row, and carries the code comment about
    the `Redo/` notebook discrepancy.
52. The raw source CSV is **not** committed to this repository; `scripts/build-nyc-price-surface.mjs`
    takes its input path as `argv[2]` and its header comment names the public repository and
    file it comes from.
53. Switching between the three views does not change any cell's position on screen (verified
    by screenshot diff of geometry, or by asserting the canvas draw call uses identical
    coordinates across views).

### The logo, the favicon and the brand palette

(54 to 59 are claimed by the per-task acceptance lists below.)

60. `content/site.ts` exports `logo` as a `LogoSlot`, not `null`, with
    `src: '/logo/pk-stack-ink.svg'`, `srcDark: '/logo/pk-stack-light.svg'`, `width: 72`,
    `height: 232` and `alt: 'Pizon Khan'`.
61. With `data-theme="light"` exactly one mark image has a computed `display` other than
    `none` and its `src` resolves to `pk-stack-ink.svg`; with `data-theme="dark"` exactly one is
    visible and it resolves to `pk-stack-light.svg`. Checked in both the header and the footer.
    Neither `<img>` carries `aria-hidden`, and in each theme the accessibility tree exposes the
    wordmark's name exactly once: `Pizon Khan, home` for the header link, `Pizon Khan` for the
    footer mark.
62. `Wordmark`'s clear space equals rendered height × 20 / 232 on all four sides (2.76 px at
    32 px and 2.41 px at 28 px, within 0.1 px), and the header's logo link has a hit area of at
    least 44 × 44 CSS px.
63. `grep -rn` over `app/ components/ content/ lib/` returns no match for `pk-lockup`,
    `pk-avatar`, `Archivo`, or the string `Data & AI Engineering`, and the exported HTML in
    `out/` contains none of them either.
64. `app/favicon.ico` no longer exists, and every exported `index.html` contains a `rel="icon"`
    link to `/logo/pk-favicon-16.svg`, a `rel="icon"` link to `/logo/png/pk-32.png`, and a
    `rel="apple-touch-icon"` link to `/logo/png/pk-180.png`. Under
    `NEXT_PUBLIC_BASE_PATH=/preview` all three are prefixed with `/preview`. No duplicate icon
    link is emitted, and no `app/icon.*` or `app/apple-icon.*` file exists.
65. Every file under `public/logo/` is byte-identical to what Pizon supplied: nothing there has
    been re-tinted, re-exported, minified or renamed, and no `.DS_Store` is committed.
66. `--accent` light `#12539E` measures ≥ 4.5:1 against `--surface-0` light `#F6F6F4`, and
    `--accent` dark `#79ACF2` measures ≥ 4.5:1 against `--surface-0` dark `#0B0C0E`. Both also
    clear 3:1 against `--surface-2` in their own theme, which is what the focus ring needs.
67. **Accent is chrome only.** Under `components/viz/` and `components/projects/`, no
    `--accent*` custom property and no `ACCENT` literal from `lib/viz/palette.ts` is used as a
    `fillStyle`, `strokeStyle`, SVG `fill`/`stroke`, or CSS background on any mark whose
    position, length, area or colour carries a value. Exactly four uses are sanctioned; a tester
    confirms each is present and that no fifth exists:
    (a) `:focus-visible` rings, anywhere;
    (b) `KernelSweep`'s 3×3 window outline, which is a cursor, not a value;
    (c) `PriceSurfaceCanvas`'s 1 px outer glow on cells of the focused borough, which is a
    selection marker, not a value;
    (d) `BoroughTable`'s `--accent-wash` background on the selected row, whose metadata renders
    in `--text-secondary` rather than `--text-tertiary`.
    `grep -n "accent\|ACCENT" components/projects/nyc/BoroughSpread.tsx` returns nothing.
68. `grep -rni "0E7C86\|39C6C0\|FBFCFD\|0B0F14\|E9EEF4\|0F1720\|F1F4F8\|teal"` over
    `app/ components/ content/ lib/ README.md` returns no matches: neither the withdrawn teal
    hexes, nor the withdrawn neutral hexes, nor the word `teal` in a comment survives in the
    source. The stale untracked `lib/viz/palette.ts` currently on disk still says "teal" in its
    header comment, so this criterion fails unless that file is replaced rather than edited.

### Project template narrative

69. `ProjectSection` accepts a `visual` prop and renders it after that section's prose, inside
    the same `<section>` element, outside the `68ch` prose measure.
70. On `/projects/nyc-housing-prices/`, once every chunk has loaded, the DOM order is: hero,
    the `PriceSurface` figure, then seven `<section>` elements in record order, with a
    `<figure>` inside `#imputation`, `#location` and `#approach` and no `<figure>` inside the
    other four. No figure appears between the last section and the meta rail. In the exported
    HTML, before any chunk loads, those same four positions hold a `FigureSkeleton` with the
    same reserved height.
71. `ProjectLayout` renders without crashing, and renders the write-up in full, when
    `centrepiece`, `sectionVisuals` and `supporting` are all omitted.
72. Every visual passed through `sectionVisuals` renders a `<figure>` with a non-empty source
    line and a `<details>` table. `ImputationSpread`'s source line contains the word
    `Synthetic`, and no axis label, tick or table cell in that figure carries a `$` or the
    string `sqft`.
73. `app/projects/nyc-housing-prices/page.tsx` contains no `'use client'` directive and no
    `dynamic(` call, and it exports `metadata`. Every `next/dynamic` call with `ssr: false` for
    that route lives in `components/projects/nyc/NycVisuals.tsx`, whose first line is
    `'use client'`. `npm run build` emits no error or warning containing the string
    `ssr: false`.
### Figure loading, figure contrast, and voice

74. Swapping a `FigureSkeleton` for its loaded figure moves nothing. Measured with the Layout
    Instability API while scrolling `/projects/nyc-housing-prices/` top to bottom on a throttled
    connection: no single layout-shift entry attributable to a figure swap exceeds **0.005**,
    and the four skeletons render no spinner, no shimmer and no pulse
    (`grep -rn "animate\|shimmer\|pulse" components/viz/FigureSkeleton.tsx` returns nothing).
75. `BoroughSpread` renders three distinguishable marks per strip (whisker, band, median tick)
    and prints `p10`, `p90`, `p30 to p70`, each borough name and each median value as text. Its
    band is `--viz-cat-6`, its whisker `--text-tertiary` and its median tick `--text-primary`.
76. **Voice.** `grep -rn "—" app components lib content scripts README.md` returns matches in
    `content/profile.ts` only (resume transcription, see **Copy and voice**), and the em dashes
    in the exported HTML under `out/` are exactly the ones `content/profile.ts` supplies. No
    other rendered string, code comment or README line contains an em dash. Separately,
    `grep -rni "claude\|anthropic\|chatgpt\|copilot\|ai assistant\|generated by"` over
    `app components lib content scripts README.md .github` returns nothing, and `git log` since
    the first commit of this wave contains none of those strings either.

---

## Tasks

Four tasks for the first build wave, ordered by dependency, with strictly disjoint file sets.

---

### Task 1 — `foundation-design-system`

**Goal.** Establish the design tokens, the app shell, the logo and favicon, and the visualisation
primitives that every later page composes, so no page ever invents a colour, a duration, a chart
chrome or a brand mark.

**Files.** Exactly the Task 1 table in the File manifest (34 entries).

**Depends on.** Nothing.

**Notes for the implementer.**
- `app/page.tsx` is **not** in this manifest. It still renders the create-next-app default and
  still imports `/next.svg`. That is expected; Task 3 replaces it. Do not touch it, and do not
  delete the `public/*.svg` files it references.
- `content/profile.ts`: change **only** line 34's GitHub URL. Every other byte stays.
- **The logo already exists. Do not design one, do not redraw one, do not convert the mark to
  `currentColor`.** `public/logo/` is committed exactly as supplied. `Wordmark` renders the
  stack mark from `site.logo` on day one; there is no `null` branch and no typographic
  fallback. Only `pk-stack-ink.svg`, `pk-stack-light.svg`, `pk-favicon-16.svg`,
  `png/pk-32.png` and `png/pk-180.png` may be referenced by a route. The lockup files, the
  Archivo font and the descriptor "Data & AI Engineering" are out of bounds. Read
  `public/logo/README.md` before writing `Wordmark`.
- Delete `app/favicon.ico` in the same commit that adds `metadata.icons`, so no route is ever
  exported without an icon.
- Every neutral token is a derivation of Ink, Graphite or Paper and the derivation is written
  into the Colour table. If a value in `globals.css` disagrees with that table, the table wins.
  Do not round a hex "to something cleaner"; the contrast ratios were computed from these
  exact values.
- `KernelSweep` must be written for both its consumers now (hero at 16×16 decorative, bird page
  at 28×28 with real input and keyboard cursor), even though only the hero uses it in wave 1.
  A second convolution component later is a defect.
- **Five files in this manifest already exist on disk as untracked, pre-revision drafts**:
  `content/site.ts`, `lib/motion.ts`, `lib/format.ts`, `lib/viz/palette.ts` and
  `lib/viz/scale.ts`. Replace each one wholesale with the contract in this document. Do not
  merge into them: `content/site.ts` currently has `logo: null` and `lib/viz/palette.ts`
  currently calls the chrome teal, and both are withdrawn. Criteria 60, 68 and 76 catch a merge.
- `Figure` and `FigureSkeleton` share a box model and are written in the same sitting. The
  skeleton exists so a lazily imported figure reserves its exact height. If the two drift, every
  project route starts shifting and criterion 35 fails a long way from the cause.
- **Nothing a canvas draws may be a `var()`.** `lib/viz/palette.ts` holds the literals,
  `lib/theme.ts` says which theme is active. That costs one hook and removes a class of silent
  wrong-colour bugs, because an invalid `fillStyle` is ignored rather than thrown.
- `README.md` must contain the **Asset prep** section verbatim from this plan (portrait crop
  commands, and the logo usage rules from **The logo**: mark only, no lockup, no Archivo, clear
  space of 20/232 of rendered height) so the next person does not have to find this document.
- **Copy and voice** binds every string and every comment this task writes, including the
  README.

**Acceptance.** Criteria 1, 2, 4, 6, 12, 15, 16, 17 (the text tiers and the Colour section's
disqualification table; the `BoroughSpread` marks land in Task 4), 18, 19, 25, 26, 28, 29, 37,
42, 43, 46, 47, 60, 61, 62, 63, 64, 65, 66, 67 (the `components/viz/` half only: `KernelSweep`'s
window outline and focus rings are the sole accent uses that exist at this point), 68, 76.
Additionally: 54. `npm run build` succeeds and `out/index.html` still renders (the scaffold
page) — proving the shell change did not break export.

---

### Task 2 — `project-content-model-and-template`

**Goal.** Define the project content type, write both project records in full, ship the
`/projects/` index, and build the reusable demonstration template so project pages three and
four cost one content file plus one route folder.

**Files.** Exactly the Task 2 table (11 entries).

**Depends on.** Task 1 (tokens, `Container`, `Section`, `Prose`, `Pill`, `ButtonLink`, `Eyebrow`).

**Notes for the implementer.**
- Write the **full** `sections[].body` prose for both records now, using the source material
  summarised in this plan, split across the section ids listed in the Data section rather than
  the old fixed six. For the NYC record: `problem` carries the client brief, anonymised the way
  the record's own `summary` already anonymises it ("a mid-west REIT"), and the client is never
  named anywhere on the site; `data`
  carries the 1,507 → 32 column reduction and the price-bracket outlier handling ($100K–$10M);
  `imputation` carries why simple mean/median imputation failed and MICE with a
  gradient-boosting estimator did not, written to be read **beside** `ImputationSpread`, so it
  explains the mechanism rather than describing the picture; `location` carries the finding
  that latitude and longitude outranked what the Spearman heatmap implied, beside
  `BoroughSpread`; `approach` carries the model ladder beside `ModelLadder`; `result` carries
  the borough recommendation (Manhattan, then Brooklyn, then Queens); `next-time` closes. For
  the bird record, cover the 315-species task, the 56×56 downscale forced by an 8 GB GPU, the
  grayscale experiment that lost 40 points of accuracy, the three tuners (RandomSearch 0.730,
  Hyperband 0.690, Bayesian 0.712), and the freeze/unfreeze story, split across the six bird
  section ids listed in **Bird page — theory sections**.
- A section that declares `hasVisual: true` must read as an argument, not as a caption. If a
  paragraph only describes the figure next to it, delete the paragraph.
- `ProjectLayout` and `ProjectSection` must both render correctly with no visual supplied. The
  template ships in this task; the visuals arrive in Task 4 and in wave 2.
- `bird-species-cnn.ts` is `status: 'planned'` in this wave. Do not create its route.
- Feature-importance magnitudes are **not** available as numbers — only the ordering is legible
  from the committed chart. Write the finding as prose ("`Tax_Assessed_Value` dominated, but
  `longitude` ranked seventh of twenty-three, above `livingArea` and `Bedrooms`") and do not
  invent magnitudes or render an importance chart.
- The template renders no imagery. No portrait, no logo, no screenshots.
- This task writes more prose than any other on the site. **Copy and voice** is binding on all
  of it: no em dashes, no throat-clearing, no padded triplets, no meta-commentary, and no
  reference anywhere to how the site was built. Criterion 76 greps for it.

**Acceptance.** Criteria 1, 2, 3 (`projects/index.html` only), 8, 10, 12, 20, 24, 69, 71, 76.
Additionally: 55. `/projects/` renders exactly two cards, one linked and one non-focusable
`planned` card. 56. `ProjectLayout` renders with a `centrepiece` of `null` without crashing
(so a future project can ship its write-up before its visual).

---

### Task 3 — `landing-experience-and-portrait`

**Goal.** Replace the scaffold homepage with the real landing page, ship the
experience/credentials surface where the bank work lives without a demonstration, and produce
the two committed portrait derivatives.

**Files.** Exactly the Task 3 table (15 new/edited + 5 deletions).

**Depends on.** Tasks 1 and 2 (needs `content/projects/index.ts` for the demonstrations
section, and `KernelSweep` for the hero).

**Notes for the implementer.**
- Generate the two portrait files **first**, verify criteria 39–41, then build `Portrait`
  against them. Record the exact command that worked in `README.md`.
- Use **only** `Photos/IMG_4601.jpg`. Do not use `IMG_4522.jpg` in wave 1 and do not commit it.
- Delete the five `public/*.svg` files **in the same commit** that removes the scaffold's
  `next/image` usages from `app/page.tsx`, so the build never references a missing file.
- Every biographical string on both pages comes from `content/profile.ts`. If a heading needs a
  fact the profile does not contain, leave `TODO(pizon):` rather than writing it.
- `TechniqueNotes` renders its boundary statement **above** the notes, not below:
  *"These are descriptions of general methods. Nothing here reflects any employer's models,
  parameters, thresholds, portfolios or systems."*
- `/experience/` carries **no photograph**.

**Acceptance.** Criteria 1, 2, 3 (`index.html`, `experience/index.html`, `404.html`), 5, 9, 11,
13, 14, 21 (for `/` and `/experience/`), 23 (adapted: tab order on `/`), 26, 30, 31, 35, 36
(for `/`), 38, 39, 40, 41, 44, 45, 76.
Additionally: 57. `grep -rn "next.svg\|vercel.svg\|window.svg\|globe.svg\|file.svg"` returns no
matches anywhere in the repo. 58. The three proof-strip figures render `15+`, `$1.5M` and `~100`
and each carries a source note. 59. At a 375 px viewport the hero renders the 88 px portrait and
no `KernelSweep`; at 1280 px it renders `KernelSweep` at 320 px and the 120 px portrait.

---

### Task 4 — `nyc-price-surface`

**Goal.** Ship the first demonstration: an animated, interrogable price surface of New York
City that draws itself from 59,350 real public listings, plus the model ladder and borough
spread that explain it.

**Files.** Exactly the Task 4 table (12 entries).

**Depends on.** Tasks 1, 2, 3.

**Notes for the implementer.**
- Source data: clone `https://github.com/pizonkhan/Springboard-Data-Science` (public) and run
  `node scripts/build-nyc-price-surface.mjs "<clone>/Capstone 2 - NYC Housing Prediction/Data/final_nyc.csv"`.
  The clone is **not** committed and the script is **not** wired into `npm run build`.
- The generator's contract: `GRID_STEP = 0.005`; cell key `(round(lat/step), round(lon/step))`;
  drop cells with fewer than 4 listings; `$_Per_SqFT` filtered to `[20, 5000]` before its
  median, `null` if fewer than 4 valid rows survive; borough = modal borough of the cell;
  breakpoints = septiles of the cell-median distribution. If the generator does not reproduce
  criteria 48–50 exactly, it is wrong — do not adjust the expected values.
- Do not commit any per-listing field. The aggregate is the deliverable; the CSV contains
  street addresses and must not leave the clone.
- Use `PriceSurfaceCanvas`'s O(1) lattice inversion for hit testing. Do not add a quadtree, a
  picking buffer, or 2,244 SVG rects.
- `ImputationSpread` ships a hardcoded array of synthetic bin counts in its own module. Do not
  generate them at runtime, do not seed an RNG, and do not derive them from `final_nyc.csv`.
  Its source line must say the values are synthetic. It is the one figure on the page that is
  not a measurement, and it has to be unambiguous about that.
- The three section visuals are three separate dynamic imports, each passed through
  `sectionVisuals` under its own section id. Do not bundle them into one block after the
  write-up; that is the shape this revision removed.
- **`app/projects/nyc-housing-prices/page.tsx` is a Server Component.** It exports `metadata`
  and contains no `'use client'` and no `dynamic()` call. All four dynamic imports, all four
  `FigureSkeleton` reservations and the 200 px viewport gate live in
  `components/projects/nyc/NycVisuals.tsx`, which starts with `'use client'`. This is not a
  style preference: on Next 15, `ssr: false` inside a Server Component fails `npm run build`
  outright with *"`ssr: false` is not allowed with `next/dynamic` in Server Components."* See
  **Route shape** for the exact shape of both files.
- **`BoroughSpread` uses no accent token.** Band `--viz-cat-6`, whisker `--text-tertiary`,
  median tick `--text-primary`, because those are the tokens that clear 3:1 on the `--surface-2`
  well in both themes. `--accent-wash` measures 1.00:1 there and is barred; so is
  `--border-strong` at 1.42:1.
- `PriceSurfaceCanvas` reads `HAIRLINE[theme]` and `ACCENT[theme]` as literals from
  `lib/viz/palette.ts` and takes `theme` from `useThemeName()`. A `var()` handed to a canvas is
  silently ignored, which paints the wrong colour rather than failing.

**Acceptance.** Criteria 1, 2, 3 (all five HTML files), 5, 17 (the three `BoroughSpread` marks),
20, 21, 22, 23, 26, 27, 32, 33, 34, 35, 36, 48, 49, 50, 51, 52, 53, 67, 70, 72, 73, 74, 75, 76.

---

### Wave 2 (specified above, reserved manifests — not built now)

- **Task 5 — `bird-cnn-assets`**: `scripts/build-bird-assets.py`,
  `public/projects/bird-species-cnn/**`, `content/data/bird-model-ladder.ts`,
  `content/data/bird-vgg16-layers.ts`.
- **Task 6 — `bird-cnn-page`**: `app/projects/bird-species-cnn/page.tsx`,
  `components/projects/bird/**`, and the one-line `status` flip in
  `content/projects/bird-species-cnn.ts`.

Task 6 is the only task that edits a Task 2 file, and it edits a single literal. Flagged here so
it is a deliberate, reviewed change rather than a silent overlap.

---

## Out of scope

- **No asset from the previous site.** No `PizonLogo.png`, no hiking photo, no comic-con photo.
- **No logo design and no logo variants.** Pizon's mark ships as supplied. The lockup, the
  avatars and the Archivo font are unused, and no new mark, monogram or wordmark is drawn.
- **No lockup and no descriptor.** "Data & AI Engineering" appears nowhere on the site. The
  only professional headline is the one in `content/profile.ts`.
- **No full-bleed, background, or above-the-fold-dominant photograph**, now or later at this
  source resolution.
- **No `IMG_4522.jpg` in wave 1.** Its crop is specified for a future `/about/` at ≤ 200 px.
- **No `/about/` page.**
- **No blog, notes section, or CMS.** Content is typed modules.
- **No search, no tag filtering, no pagination.** Two projects.
- **No analytics, no cookie banner, no third-party scripts of any kind.**
- **No loading spinners and no shimmer skeletons.** A lazily imported figure shows its own
  eyebrow and title over an empty well and nothing else.
- **No social card image.** `metadata` ships without `openGraph.images` in wave 1; a designed
  `public/og.png` is a follow-up. `png/pk-512.png` is not a substitute, since an OG card needs
  the name in it and the mark alone does not carry one.
- **No stepper on the bird page.** The five stages are five sections, not five tabs.
- **No résumé PDF download.** `Resume/` is gitignored and stays that way.
- **No client-side model inference.** No TensorFlow.js, no ONNX runtime, no WASM. The bird page
  is precomputed assets plus real-but-simple arithmetic (convolution) in the browser.
- **No basemap, no tiles, no GeoJSON, no mapping library.** The NYC "map" is the binned listing
  data and nothing else.
- **No i18n, no RTL.**
- **No bank-work demonstration of any kind**, now or later. That is the point of the structural
  separation, not a wave-1 deferral.
- **No feature-importance chart** for the NYC project — the magnitudes are not recoverable from
  the committed material, and reading them off a PNG would be inventing numbers.

---

## Open questions for Pizon

These change the build and are genuinely his call. The plan picks a default for each so nothing
blocks; each is a small, contained change to reverse.

1. **Get a proper high-resolution headshot.** This is the single asset that would let the hero
   design be more ambitious. `IMG_4601.jpg` is 747 × 970 — a phone photo — which caps any honest
   rendered size at roughly 370 px. That is why the portrait on this site is a 120 px anchor
   rather than a presence. With a 2400 px-wide studio frame the hero could carry a large
   duotone portrait beside the type, or a full-height right column, and the whole page would
   gain a register it currently cannot have. `Portrait` is deliberately built so that a better
   source drops in with **zero code change** — replace the two files in `public/img/` at the
   same dimensions, or add a `portrait-1280.webp` and widen the sanctioned size union. Worth a
   couple of hours with a photographer.
2. **The logo is wired, and two calls are still yours.** `public/logo/` is in the repository
   and the header, the footer and the favicon all use it. First: the site uses the **mark
   alone**, with no name set beside it. If you want your name in the header as well, that is a
   small change to one component, but it deliberately will not be the lockup, because the
   lockup's descriptor states a different job title from the one on your résumé. Second: the
   mark is a tall vertical stack, so at header scale it is a 10 px wide sliver 32 px tall. It
   reads as a deliberate monogram, which is the intent. If you want more presence up there, a
   horizontal variant of the same two letters is the thing to draw next, and it drops into the
   same slot with no code change.
3. **Font pairing.** Default: **Inter + Source Serif 4 + JetBrains Mono**. The serif is what
   gives the project write-ups a report-like register (it suits someone who writes LaTeX). If
   you'd rather the whole site be one voice, dropping Source Serif 4 saves ~55 KB and is a
   one-line change in `app/layout.tsx` plus one token in `globals.css`.
4. **Accent colour.** Settled at your request: **azure `#12539E` light / `#79ACF2` dark** for
   chrome, with the magma violet→amber ramp still reserved for data. Teal is withdrawn. The
   neutrals are no longer a separate invention either; they are your own Ink, Graphite and
   Paper extended into a full light and dark scale, which is what makes the mark look native
   rather than applied. If you want to move the chrome hue again, the constraints are: clear
   4.5:1 on `#F6F6F4` and on `#0B0C0E`, and stay at least 35 degrees from every step of the
   magma ramp. That rules out violets, magentas, reds, oranges and ambers, and you have already
   ruled out teal, which leaves blues and greens. Green is the weaker option, since a green
   button reads as a status rather than as a control.
5. **What the landing page leads with.** Default: **your name and the bank title first**, with
   the visual work one scroll below. The alternative — leading with the demonstration and
   putting the title second — reads as a stronger portfolio but a weaker résumé. Which audience
   is this site for first?
6. **The technique notes on `/experience/`.** Default: **four short, number-free explainers**
   of PD/LGD dual risk rating, weights-of-evidence binning, point-in-time snapshots and data
   reconciliation. This sits inside the line you drew, but you are the one who has read the
   contract. If you want them gone it is one content file and one component.
7. **The ROC figures on your résumé** (`~89% PD`, `~70% LGD` on CRE) are currently rendered
   verbatim in the role timeline because they are on your résumé. Confirm you're comfortable
   with them appearing on a public page.
8. **The bird photo.** Wave 2 needs one public-domain 448 × 448 bird image with a clear
   attribution. Default plan: pick a USFWS or Wikimedia CC0 image; if you'd rather use one of
   the Kaggle dataset images, confirm the licence allows redistribution.
9. **Dark or light as the first-visit default.** Default: **follow the OS setting**. If you want
   the site to open dark regardless, that's one line in `ThemeScript`.
10. **`github.com/pizonkhan/Springboard-Data-Science` is linked from both project pages.**
    Confirm that repo should stay public — the project pages lose a lot if it goes private, and
    the plan would need to drop the source links.
11. **Your resume prose contains em dashes and the site renders it verbatim.**
    `content/profile.ts` uses them in the summary and in two Director bullets, and the rule
    everywhere else on this site is that no em dash ships. Those strings are your words about
    your own career, so the plan leaves them exactly as transcribed rather than editing your
    resume for you, and criterion 76 carves out that one file. If you would rather they read as
    colons or full stops, that is a single pass over `content/profile.ts` that changes no fact,
    and the exception in criterion 76 goes away with it.
