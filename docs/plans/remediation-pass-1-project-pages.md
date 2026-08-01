# Remediation Pass 1 — NYC and Bird demonstration pages

Triage of three independent review passes (code review, tester, visual review) into one
ordered set of instructions. Every claim below was re-verified against the working tree
before it was written down: by reading the code, by running `npm run build`, or by driving
the built export in Playwright at 375, 768 and 1280 px. Verification evidence is quoted
inline so the developer does not have to take any of it on faith.

Extends `docs/plans/foundation-and-design-language.md`. Where this document contradicts that
one, this one wins, and the reason is stated.

## Goal

After this pass, a visitor with default motion settings actually sees the two bird visuals
that are currently invisible to them, the NYC map finishes drawing Staten Island instead of
leaving 100 cells permanently faded, every figure on both pages fits its own frame on a
phone, the readouts describe the thing that is on screen, and both routes come in under
their first-load JS budgets. Nothing new ships. This is entirely repair.

## Assumptions

1. **Wave 2 (the bird page) is in scope.** The tester correctly noted that the bird route,
   its components and its assets are in the working tree although the report covered only
   Task 4. They were built to the orchestrator's instruction and they are live on the page,
   so they are reviewed and repaired here rather than reverted.
2. **`components/viz/KernelSweep.tsx` is not modified.** It is shared with the landing hero,
   which is the one route under a 120 KB budget with no headroom. Every convolution fix
   below lives in the consumer, `ConvolutionSweep.tsx`.
3. **`framer-motion` stays in `package.json`.** `components/experience/RoleTimeline.tsx`
   still uses `useScroll`/`useTransform` on `/experience`, which has no numeric budget in the
   spec. Removing it there is a separate piece of work.
4. **The NYC target is list price.** See Data below. The tagline is corrected to match the
   twenty other places on the same page that say "list price"; the underlying Zillow column
   is `price` on a 2019 listings scrape, and the record's own summary already frames the
   business question as "what to ask".
5. **A fixed-height figure well is allowed.** The original spec gave every well an
   aspect ratio. That is wrong for figures whose content is a stack of text rows, whose
   height does not scale with width. This document amends the `Figure` contract instead of
   forcing those figures into a ratio.

## What I dropped, and why

- **"The developer's report was materially incomplete" (tester).** Accurate, and worth
  saying, but it is not a code defect and there is nothing to change in a file. Carried
  forward as a process requirement at the end of this document, not as a fix.
- **"Move `BoroughTable` and the readout out of the lazy chunk" (code review 3, alternative
  fix).** Rejected. That pulls `content/data/nyc-boroughs.ts` and the table component into
  the route's first-load JS, which is the exact budget this pass has to bring down. The
  height-reservation fix is specified instead.
- **"Have `KernelSweep` call `onCursorChange` as its auto-sweep advances" (code review 11,
  first suggested fix).** Rejected. The sweep steps 676 cells in about 2.3 s; that fix means
  676 parent state updates, 676 recomputes of the readout `useMemo`, and 676 mutations of an
  `aria-live="polite"` region, which is an accessibility regression rather than a fix. The
  second suggested fix (park-position default) is the one specified.
- **"The convolution figure is clipped at desktop."** Not a finding anyone filed, but I
  measured it while checking the others and it is a false alarm: at 1280 px
  `.viz-well` for that figure reports `scrollHeight 574 === clientHeight 574`. Nothing is
  clipped. No change to its ratio.
- **"The `4x` caption is only a typography nit."** Kept, not dropped, but ranked last: it is
  a one-character change and it is the only literal-string deviation from the spec.

Nothing else in the three reports was a false positive. Every other claim reproduced.

## File manifest

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `lib/motion.ts` | Edit | `useInViewOnce` becomes a callback ref so it attaches to nodes that mount late. |
| `lib/viz/well.ts` | New | `WellSize` type and `wellStyle()`, the single source of the figure well's reserved box. |
| `lib/roving-radio.ts` | New | `useRovingRadioGroup`, the one implementation of the WAI-ARIA radio-group keyboard contract. |
| `components/viz/Figure.tsx` | Edit | `ratio: string` becomes `well: WellSize`. |
| `components/viz/FigureSkeleton.tsx` | Edit | Same prop change, same helper, so the two box models cannot drift. |
| `app/globals.css` | Edit | `.viz-well` reads its ratio/height from custom properties, with an `sm` override. |
| `components/project/ProjectSection.tsx` | Edit | Drop `framer-motion`; CSS reveal instead. |
| `components/ui/Section.tsx` | Edit | Drop `framer-motion`; CSS reveal instead. |
| `components/projects/nyc/PriceSurfaceCanvas.tsx` | Edit | Fix the entry-threshold scale so every cell finishes drawing. |
| `components/projects/nyc/PriceSurface.tsx` | Edit | Hover sets borough focus; `ViewControl` uses the roving hook; `well` prop. |
| `components/projects/nyc/BoroughTable.tsx` | Edit | Real `<td>` cells so column headers associate. |
| `components/projects/nyc/ModelLadder.tsx` | Edit | Responsive row layout; `well` prop. |
| `components/projects/nyc/BoroughSpread.tsx` | Edit | Caption multiplication sign; `well` prop. |
| `components/projects/nyc/ImputationSpread.tsx` | Edit | `StateControl` uses the roving hook; `well` prop. |
| `components/projects/nyc/NycVisuals.tsx` | Edit | `CHROME` entries carry `well` instead of `ratio`. |
| `content/projects/nyc-housing-prices.ts` | Edit | Tagline says list price. |
| `components/projects/bird/PixelMatrix.tsx` | Edit | Reduced motion shows the twelve values; `well` prop. |
| `components/projects/bird/SoftmaxRace.tsx` | Edit | Release the settle pulse; responsive rows; `well` prop. |
| `components/projects/bird/ResultsLadder.tsx` | Edit | Responsive rows; visible chance rule; `well` prop. |
| `components/projects/bird/LayerPyramid.tsx` | Edit | Roving hook; `well` prop sized so the strip fits on a phone. |
| `components/projects/bird/ActivationStrip.tsx` | Edit | Ref on an always-mounted wrapper (belt and braces with the hook fix). |
| `components/projects/bird/ConvolutionSweep.tsx` | Edit | Cursor default matches the parked window; roving hook; stable readout line box; `well` prop. |
| `components/projects/bird/TransferDiagram.tsx` | Edit | Theme-aware hatch and fill; `well` prop. |
| `components/projects/bird/BirdVisuals.tsx` | Edit | `CHROME` entries carry `well` instead of `ratio`. |
| `content/data/bird-model-ladder.ts` | Edit | Grayscale row transcribes the printed evaluation; header comment corrected. |
| `content/projects/bird-species-cnn.ts` | Edit | Grayscale prose matches the corrected figure; dataset TODO reworded. |

Nothing outside this list. If a fix seems to need another file, stop and say so.

## Tasks

Four tasks, dependency-ordered, disjoint file sets. R1 first: R3 and R4 both consume its two
new modules and the changed `Figure` prop.

---

### R1 — `shared-primitives`

**Goal:** one working in-view hook, one figure-well contract that supports both a ratio and a
fixed height, one radio-group keyboard implementation.

**Files:** `lib/motion.ts`, `lib/viz/well.ts` (new), `lib/roving-radio.ts` (new),
`components/viz/Figure.tsx`, `components/viz/FigureSkeleton.tsx`, `app/globals.css`.

#### R1.1 — `useInViewOnce` never attaches to a late-mounting node

Highest-severity defect in the whole pass. Two bird figures are blank for every visitor who
has not turned motion off.

`lib/motion.ts:57-77` attaches the `IntersectionObserver` in an effect whose deps are
`[hasEntered, threshold, rootMargin]` and reads `ref.current`. `ActivationStrip` and
`SoftmaxRace` both render a "Loading…" paragraph first and only mount the ref'd node after a
`fetch` resolves. At effect time `ref.current` is `null`, the effect bails, and because none
of the three deps ever changes the effect never runs again. `hasEntered` stays `false`
forever, and every element gated on it stays at `opacity: 0` or `width: 0`.

Reproduced on the built export, scrolling incrementally to the bottom at 1280 px:

```
[default] tiles: ["0","0","0","0","0","0"]   softmax bar widths: [2,2,2,2,2,2,2,2]
[reduce]  tiles: ["1","1","1","1","1","1"]   softmax bar widths: [870,2,2,2,2,2,2,2]
```

Rewrite the hook to hold the observed node in state and hand back a callback ref:

```ts
export function useInViewOnce<T extends Element>(
  options?: { threshold?: number; rootMargin?: string },
): [React.RefCallback<T>, boolean] {
  const [node, setNode] = useState<T | null>(null)
  const [hasEntered, setHasEntered] = useState(false)
  const threshold = options?.threshold ?? 0.25
  const rootMargin = options?.rootMargin ?? '0px 0px -15% 0px'
  const ref = useCallback((next: T | null) => setNode(next), [])

  useEffect(() => {
    if (hasEntered || !node) return
    const observer = new IntersectionObserver(/* unchanged body */)
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, hasEntered, threshold, rootMargin])

  return [ref, hasEntered]
}
```

There are sixteen call sites and none of them reads `.current` (verified:
`grep -rn "ref.current" app components` returns nothing for these refs), so `ref={ref}` keeps
working everywhere and no consumer needs an edit for this change alone.

Two consequences to expect rather than be surprised by: the activation thumbnails and the
softmax bars will animate for the first time, and the permanently-stuck settle pulse in
`SoftmaxRace` (R4.3) becomes visible, which is why that fix ships in the same pass.

#### R1.2 — the figure well gets a fixed-height mode

Today `Figure`/`FigureSkeleton` take `ratio: string` and set `aspect-ratio` inline. A well
whose content is a stack of text rows has a content height that does not change with width,
so no single ratio can fit it at both 375 px and 1280 px. Measured, at 1280 px, inside
`TransferDiagram`'s `4 / 3` well: usable height 832 px, content height 212 px, so 620 px of
empty panel. At 375 px the same figure's content is 267 px inside a 213 px well, so it is
clipped. One ratio cannot serve both.

Add `lib/viz/well.ts`:

```ts
import type { CSSProperties } from 'react'

/** Either an aspect ratio for the well, or an explicit reserved height in px. */
export type WellSize =
  | { ratio: string; ratioSm?: string }
  | { height: number; heightSm?: number }

/** The only place that turns a WellSize into CSS. Figure and FigureSkeleton both call it. */
export function wellStyle(size: WellSize): CSSProperties {
  const style: Record<string, string> = {}
  if ('ratio' in size) {
    style['--well-ratio'] = size.ratio
    if (size.ratioSm) style['--well-ratio-sm'] = size.ratioSm
  } else {
    style['--well-height'] = `${size.height}px`
    if (size.heightSm) style['--well-height-sm'] = `${size.heightSm}px`
  }
  return style as CSSProperties
}
```

In `app/globals.css`, replace the inline `aspectRatio` with token reads on `.viz-well`
(everything else about the rule is unchanged):

```css
.viz-well {
  aspect-ratio: var(--well-ratio, auto);
  height: var(--well-height, auto);
  /* position, background, border, radius, padding, overflow unchanged */
}

@media (min-width: 640px) {
  .viz-well {
    aspect-ratio: var(--well-ratio-sm, var(--well-ratio, auto));
    height: var(--well-height-sm, var(--well-height, auto));
  }
}
```

`Figure` and `FigureSkeleton` both swap `ratio: string` for `well: WellSize` and both render
`<div className="viz-well" style={wellStyle(well)}>`. Neither computes the style itself. The
JSDoc on the prop stays as it is in spirit: this is the anti-CLS contract, and a fixed height
honours it at least as strictly as a ratio does.

Do not add a `min-height`. The well clips deliberately; the acceptance test below is what
proves nothing is clipped.

#### R1.3 — one roving-tabindex implementation

Four separate radiogroups move `aria-checked` on arrow keys and never move DOM focus, so a
screen-reader user hears their focused radio become unchecked and never hears the new
selection, and a sighted keyboard user watches the focus ring sit on an unselected segment.
Reproduced by the tester: focus "Sobel X", press ArrowRight, selection and readout move to
"Sobel Y", `document.activeElement` is still the "Sobel X" button. The same code appears in
`PriceSurface.tsx:204`, `ImputationSpread.tsx:201`, `ConvolutionSweep.tsx:134` and
`LayerPyramid.tsx:65`. Four copies is how it drifted; make it one.

Add `lib/roving-radio.ts` (client module):

```ts
export function useRovingRadioGroup<T extends string>(
  values: readonly T[],
  value: T,
  onChange: (next: T) => void,
): {
  /** Spread onto the element that carries role="radiogroup". */
  groupProps: { onKeyDown: (event: KeyboardEvent<HTMLElement>) => void }
  /** Spread onto each role="radio" button. */
  getRadioProps: (option: T) => {
    ref: (node: HTMLButtonElement | null) => void
    role: 'radio'
    'aria-checked': boolean
    tabIndex: 0 | -1
    onClick: () => void
  }
}
```

Behaviour, exactly: ArrowRight and ArrowDown select the next value and wrap; ArrowLeft and
ArrowUp select the previous and wrap; Home selects the first; End selects the last; each of
those calls `event.preventDefault()`, then `onChange(next)`, then `.focus()` on the newly
selected option's node from an internal `Map<T, HTMLButtonElement>`. Any other key is
ignored and not prevented. `tabIndex` is `0` for the selected option and `-1` for the rest,
which is unchanged from today. The hook owns no styling and renders nothing.

`.focus()` is safe to call synchronously in the handler: the target node is already mounted,
only its `tabIndex` changes on the following render.

**R1 acceptance criteria**

1. `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` all pass.
2. In a browser, a `useInViewOnce` consumer that mounts its ref'd node only after an async
   load still reports `hasEntered === true` once scrolled into view. Concretely: with default
   motion at 1280 px, after scrolling the bird route top to bottom, all six activation tiles
   report `opacity: 1` and the winning softmax bar is wider than 2 px.
3. `grep -n "aspectRatio" components/viz/Figure.tsx components/viz/FigureSkeleton.tsx`
   returns nothing; both files call `wellStyle`.
4. `Figure` and `FigureSkeleton` given the same `well` value render wells of identical
   height at 375, 768 and 1280 px (compare `getBoundingClientRect().height`).
5. `useRovingRadioGroup` exists in `lib/roving-radio.ts` and is the only place in
   `components/` where an arrow key changes a radio selection after R3 and R4 land
   (`grep -rn "ArrowRight" components/` returns matches only inside components that import
   the hook, and none of them calls `onChange` directly from a key handler).

---

### R2 — `route-bundle-budget`

**Goal:** get `/projects/nyc-housing-prices/` and `/projects/bird-species-cnn/` under budget.

**Files:** `components/project/ProjectSection.tsx`, `components/ui/Section.tsx`.

Criterion 32 caps the NYC route at 130 KB gzipped first-load JS and the bird page section of
the spec caps that route at 115 KB. Both measure 150 KB. Confirmed here on a clean build:

```
Route (app)                                 Size  First Load JS
/                                        13.1 kB         119 kB
/projects                                1.14 kB         148 kB
/projects/bird-species-cnn               3.11 kB         150 kB
/projects/nyc-housing-prices             2.95 kB         150 kB
+ First Load JS shared by all             103 kB
```

The tester was right that this is not Task 4's own code: all three of that task's sub-budgets
pass. The cause is one chunk. `chunks/554-*.js` is 41.2 KB gzipped, it is `framer-motion`,
and it is referenced by `out/projects/index.html`, `out/projects/nyc-housing-prices/index.html`,
`out/projects/bird-species-cnn/index.html` and `out/experience/index.html`, but not by
`out/index.html`. On the two project routes the only importer is
`components/project/ProjectSection.tsx`, which uses `motion.section` for a fade-and-rise that
the site already does in plain CSS on the landing page. The original spec even assumed
framer-motion would live inside the lazily-loaded `PriceSurface` chunk, not the route.

Rewrite both `ProjectSection` and `Section` to keep exactly the same reveal without the
library. Both already call `useInViewOnce` and `usePrefersReducedMotion`; keep those, keep the
element, the ids, the `Container`, the headings and the children untouched, and drive the
reveal with inline style:

```tsx
<section
  id={id}
  ref={ref}
  className="py-(--space-section)"
  style={{
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : 'translateY(12px)',
    transition: reduced
      ? 'opacity var(--dur-fast) var(--ease-out)'
      : 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
  }}
>
```

`transform: 'none'` rather than `translateY(0)` when visible, so no stale containing block is
left behind. The values match the motion vocabulary already in the spec: `--dur-slow` 480 ms,
`--ease-out`, `translateY(12px)`, one shot, never re-fires. The global reduced-motion net in
`globals.css` clamps transitions to 1 ms regardless, and the explicit `reduced` branch keeps
the per-component contract the spec requires.

**R2 acceptance criteria**

6. `grep -rn "framer-motion" components/project components/ui` returns nothing.
7. `next build`'s route table reports first-load JS ≤ **130 KB** for
   `/projects/nyc-housing-prices/`, ≤ **115 KB** for `/projects/bird-species-cnn/`, and
   ≤ **120 KB** for `/` (unchanged). Expect roughly 109 KB on the two project routes.
8. `grep -c "554-" out/projects/nyc-housing-prices/index.html` (substituting the new hash for
   the framer chunk) returns 0; the chunk is absent from both project routes and from
   `/projects`.
9. Visually, a section still fades and rises once on first scroll into view at 480 ms, and
   under `prefers-reduced-motion: reduce` it is fully visible with no vertical movement.

---

### R3 — `nyc-remediation`

**Files:** `components/projects/nyc/PriceSurfaceCanvas.tsx`, `PriceSurface.tsx`,
`BoroughTable.tsx`, `ModelLadder.tsx`, `BoroughSpread.tsx`, `ImputationSpread.tsx`,
`NycVisuals.tsx`, `content/projects/nyc-housing-prices.ts`.

#### R3.1 — the map never finishes drawing (high)

`PriceSurfaceCanvas.tsx:206-207`:

```ts
const threshold = distance / layout.maxDistance          // ranges 0..1
const entryFraction = reduced ? 1 : Math.max(0, Math.min((progress - threshold) / 0.244, 1))
```

`PriceSurface.tsx:62` clamps `progress` at 1 after 900 ms, but a cell needs
`progress >= threshold + 0.244` to reach a full entry fraction. Computed against the committed
`CELLS` array: at final `progress = 1`, **100 cells** have `threshold > 0.756` and never reach
full alpha or full scale, all 100 of them in Staten Island (borough index 4), and **1 cell**
has `threshold >= 1`, hits `entryFraction <= 0 → continue`, and is never painted at all. The
rAF loop then stops, and every later redraw (view change, theme toggle, borough focus)
recomputes the same partial values, so the fringe stays faded and shrunken for the rest of the
session. Reduced-motion visitors are unaffected, which is why this passed the earlier check.

Fix by compressing the thresholds so the last cell starts at 756 ms and finishes at 900 ms:

```ts
const threshold = (distance / layout.maxDistance) * (1 - 0.244)
```

Leave `entryFraction`, the 0.244 window, `DURATION.draw` and the reduced-motion branch alone.
The ring-from-the-centroid choreography is unchanged; only the schedule is compressed.

#### R3.2 — hovering a cell does not focus its borough (medium)

The spec's Borough interrogation paragraph: "Hovering a *cell* on the canvas sets the same
state plus a cell-level readout". `PriceSurface.tsx:141` passes `onHoverCell={setHoveredCell}`
only, so the map's own hover path produces a readout but never the dim-and-glow that a
`BoroughTable` row produces. Two paths the spec defines as equivalent behave differently.

```tsx
onHoverCell={(cell) => {
  setHoveredCell(cell)
  setFocusBorough(cell ? BOROUGH_NAMES[cell.b] : null)
}}
```

Pointer leave already sends `null`, which clears both. Leave `BoroughTable`'s own
focus/blur handlers exactly as they are, so keyboard behaviour does not change. The focus
transition stays at `--dur-fast` (120 ms), so crossing a borough boundary reads as a state
change, not a flicker.

#### R3.3 — the centrepiece skeleton reserves the wrong height (medium)

`NycVisuals.tsx:51` reserves only a `FigureSkeleton`, but the loaded `PriceSurface` renders a
legend/readout row and a five-row `BoroughTable` *below* the figure, inside the same lazy
chunk. Measured on the built export, comparing the loaded `PriceSurface` root against its own
`<figure>`: **290 px** of unreserved height at 1280 px and **425 px** at 375 px. When the chunk
lands while the visitor is already at the centrepiece, everything below jumps by that amount,
which is far outside criterion 74's 0.005 per-swap budget.

Reserve it. In `NycVisuals.tsx`, give the centrepiece its own loading element rather than a
bare `FigureSkeleton`: the skeleton, then a placeholder block whose height matches the
legend/readout row plus the five-row table, using the same `flex flex-col gap-4` wrapper the
loaded component uses so the gap arithmetic matches. The placeholder is an empty
`aria-hidden` div with a fixed height (`h-[425px] sm:h-[290px]`, adjusted until criterion 12
below passes). No spinner, no shimmer, no pulse, consistent with the rest of the skeleton
contract. Keep this local to the `centrepiece` entry; the other three NYC figures reserve
correctly today.

#### R3.4 — `BoroughTable` rows are one cell wide (medium)

`BoroughTable.tsx:46-79` declares four `scope="col"` headers and then gives every body row a
single `<td colSpan={4}>` containing a CSS-grid button. Column navigation in a screen reader
collapses: there is no data cell for "Median" to associate with, so "Median: $1,870,000" is
not reachable that way. The grid alignment under the headers is a visual promise the
accessibility tree does not keep.

Use the spec's alternative row shape: a real `<tr>` with four real `<td>` cells, the row
itself `tabIndex={0}` with `aria-selected={selected}` and the existing
`onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` handlers moved onto the `<tr>`. Keep the
`bg-accent-wash` selected state, the `--dur-fast` colour transition, the tabular-nums
alignment and the `view === 'perSqft'` column swap exactly as they are. The row must remain
reachable and operable by keyboard, which `tabIndex={0}` plus the focus handler gives; the
focus ring must be visible on the row.

#### R3.5 — `ModelLadder` is clipped on a phone and truncated on a desktop (medium)

At 375 px the well reports `scrollWidth 330 > clientWidth 325` and `scrollHeight 188 >
clientHeight 182`: the `w-44` name column plus the `w-28` value column plus two `gap-3`s
exceed the 293 px of usable width, so the `flex-1` bar track collapses to 2 px and the value
column is clipped by `overflow: hidden`. At 1280 px the opposite problem: `w-44` truncates
"Random forest tuned (80 trees, depth 14)" with hundreds of px free to its right.

Give the row a single responsive layout, not two DOM variants:

```tsx
<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
  <span className="w-[calc(100%-7rem)] truncate sm:w-64 sm:flex-shrink-0 lg:w-72" title={model.name}>…</span>
  <span className="w-24 text-right sm:order-none sm:w-28">…</span>
  <div className="order-last h-4 w-full sm:order-none sm:w-auto sm:flex-1">…bar…</div>
</div>
```

Below `sm` the name and value share the first line and the bar track takes a full-width second
line; from `sm` up the order resets to name, track, value on one line. Keep `title` on the name
for genuine overflow. Keep the bar's own colours, border, `scaleX` transform, 900 ms
`--ease-out` transition, staggered delay and the "best" tag.

Then set the well to a fixed height, which is what makes the taller mobile rows fit:
`well={{ height: 420, heightSm: 360 }}`.

#### R3.6 — the caption's multiplication sign (medium, one character)

`BoroughSpread.tsx:45` renders `over 4x Brooklyn's`. The spec fixes this string with the
multiplication sign, and the same page's hero prints `3.3×` from
`content/projects/nyc-housing-prices.ts:44`. One route, two conventions.

```
Manhattan's spread is the story: its p90 is over 4× Brooklyn's.
```

#### R3.7 — radiogroups adopt the hook

`ViewControl` in `PriceSurface.tsx:204-239` and `StateControl` in
`ImputationSpread.tsx:201-238` both delete their local `handleKeyDown` and their inline
`role`/`aria-checked`/`tabIndex`/`onClick` props in favour of `useRovingRadioGroup` from R1.
Their class names, labels and `aria-label`s do not change.

#### R3.8 — the well prop migration

`PriceSurface` `{ ratio: '4 / 3' }`, `ImputationSpread` `{ ratio: '16 / 9' }`, `BoroughSpread`
`{ ratio: '16 / 9' }`, `ModelLadder` `{ height: 420, heightSm: 360 }`. The `CHROME` map in
`NycVisuals.tsx` carries the identical values, since those are the skeletons. The comment in
that file about keeping the two in step stays true and stays accurate.

#### R3.9 — the tagline says sale price, every figure says list price (medium, content integrity)

`content/projects/nyc-housing-prices.ts:8` reads "Predicting sale price across 59,350 NYC
listings", and it is rendered by the project hero and by the `/projects` card. Every figure on
the same page labels the same Zillow field "median list price": the canvas `aria-label`, the
legend, the readout, the `FigureTable` caption and the centrepiece source line. The record's
own summary and its `#problem` section already frame the question as an asking price, and the
capstone's report frames the client's worry as "a steep asking price". The underlying column
is `price` on a 2019 Zillow listings scrape.

Change the tagline to:

```
Predicting list price across 59,350 NYC listings, and finding that location beats every other feature combined.
```

Nothing else in the record changes. Do not touch `summary`, `dataset`, `headlineFigures` or
any section body.

**R3 acceptance criteria**

10. With default motion at 1280 px, after the centrepiece entry animation completes, every
    cell in the map is drawn at full opacity and full scale. Testable without pixel peeping:
    with the committed `CELLS`, computing `entryFraction` at `progress = 1` for all 2,244
    cells returns `1` for all 2,244 (today it returns values below 1 for 100 of them and 0 for
    one of them).
11. Hovering any cell of the map dims every non-matching borough to 0.2 alpha over 120 ms and
    outlines the hovered borough's cells in `--accent`; leaving the map restores all cells.
    A `BoroughTable` row hover produces the identical state.
12. Scrolling `/projects/nyc-housing-prices/` top to bottom on a throttled connection at both
    375 and 1280 px, no single layout-shift entry attributable to a figure swap exceeds
    **0.005**, including the centrepiece swap with the visitor already parked on it.
13. `components/projects/nyc/BoroughTable.tsx` contains no `colSpan`; each body row has four
    `<td>` elements; a screen reader reading the third cell of the first row announces the
    "Median" header with the value.
14. At 375, 768 and 1280 px, every `.viz-well` on the route satisfies
    `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`. At 1280 px, no model name
    in `ModelLadder` is truncated (`span.scrollWidth <= span.clientWidth` for every name).
    At 375 px, every bar track is at least 80 px wide.
15. Arrow keys in the view switcher and in the imputation state control move both the
    selection and `document.activeElement` to the newly selected radio; Home and End jump to
    first and last.
16. `grep -n "4×" components/projects/nyc/BoroughSpread.tsx` matches and `grep -n "4x "`
    does not.
17. The strings "sale price" and "sales price" appear nowhere under `content/` or `out/` for
    this route; the hero subtitle and the `/projects` card both read "list price".

---

### R4 — `bird-remediation`

**Files:** `components/projects/bird/PixelMatrix.tsx`, `SoftmaxRace.tsx`, `ResultsLadder.tsx`,
`LayerPyramid.tsx`, `ActivationStrip.tsx`, `ConvolutionSweep.tsx`, `TransferDiagram.tsx`,
`BirdVisuals.tsx`, `content/data/bird-model-ladder.ts`,
`content/projects/bird-species-cnn.ts`.

#### R4.1 — reduced motion never shows the twelve luminance values (high)

`PixelMatrix.tsx:43` initialises `useState(reduced)`, but `usePrefersReducedMotion` returns
`false` on the first render and flips in an effect, so `revealed` starts `false` for everyone.
The reveal effect then early-returns when `reduced` is true, so `setRevealed(true)` never runs.
The value overlays read `opacity: revealed ? 0.92 : 0` with no `reduced` term, so a
reduced-motion visitor gets a grey grid with zero printed numbers, permanently. The grid
itself only appears because its own opacity on line 124 does include `reduced ||`.

Verified on the built export: with `reducedMotion: 'reduce'`, all twelve overlays report
`opacity: 0`; with default motion they report `0.92`. This is exactly backwards from the
spec, which says reduced motion renders "the grid directly with the twelve values already
shown".

```tsx
opacity: reduced || revealed ? 0.92 : 0,
```

Matching the pattern already used one block above it. No other change to the component.

#### R4.2 — the centrepiece is unusable on a phone (high)

At 375 px the `ResultsLadder` well reports `scrollWidth 442` against `clientWidth 325`: `w-56`
(224 px) plus `w-44` (176 px), both `flex-shrink-0`, plus two `gap-3`s, in 293 px of usable
width. The bar track collapses to 2 px and the value column is clipped 117 px off the right
edge. At 1280 px the same fixed columns truncate "Baseline CNN, 2 conv blocks, 1…",
"EfficientNetB0, low-LR fine-tuni…" and "VGG16, fine-tuned from block4_…", with free space to
their right. The checkpoint names are the substance of the flagship proof visual.

Apply the same responsive row from R3.5, with a wider desktop name column because the bird
names are longer (`w-[calc(100%-7rem)] truncate sm:w-72 lg:w-80`), and the same value column
treatment; the "chance, 1 in 315" and "final model" tags stay in the value column and must
remain visible at 375 px. Set `well={{ height: 420, heightSm: 360 }}`.

#### R4.3 — the depth figure is entirely clipped below `sm` (high)

At 375 px `LayerPyramid`'s well reports `scrollHeight 524` against `clientHeight 182`. The
five radios alone run to the bottom of the well and the whole `ActivationStrip` sits 100 px
past the clip line, so a mobile visitor never sees a single activation thumbnail, the layer
caption, or the source-photo attribution that Task 5 put there deliberately.

Set `well={{ height: 520, heightSm: 420 }}`. The measured content at 375 px is 507 px, so 520
clears it with the well's 32 px of padding accounted for; at `sm` and above the two-column
layout needs about 180 px, so 420 also removes a large empty region that exists today at
1280 px. Do not otherwise restructure the layout: the `flex-col sm:flex-row` split, the radio
widths derived from `spatialOut`, the staggered 180 ms entry and the strip's 3/6-column grid
all stay.

In `ActivationStrip.tsx`, move the `useInViewOnce` ref onto a wrapper `<div>` that is rendered
in the loading and error states too, so the observer has a node from first render. R1.1 makes
this unnecessary in principle; do it anyway, because it costs one element and it makes the
component correct on its own terms rather than dependent on the hook's internals.

#### R4.4 — the convolution readout describes a window the visitor never sees (high)

`ConvolutionSweep.tsx:37` sets `const activeCursor = cursor ?? { row: 1, col: 1 }`. For
default-motion visitors `sweepCursor` is `undefined`, so `KernelSweep` runs its own
uncontrolled sweep and parks at `(outSize - 1, outSize - 1)`, which is `(25, 25)` for a 28×28
input. Meanwhile the persistent readout, the `aria-live` paragraph and the "Show the numbers"
table, whose caption says "for the window at the current cursor", all print the arithmetic for
row 2, column 2. Family rule 7 requires the readout to mirror the visual; here it contradicts
it until the visitor presses an arrow key.

```tsx
const activeCursor = cursor ?? (reduced ? { row: 1, col: 1 } : { row: SIZE - 3, col: SIZE - 3 })
```

`SIZE - 3` is 25, which is exactly where the uncontrolled sweep parks, and the reduced-motion
branch keeps the controlled `(1, 1)` start it has today. Do not modify `KernelSweep`.

#### R4.5 — the readout paragraph is not reserved (medium)

`ConvolutionSweep.tsx:123` renders the `aria-live` paragraph only once the JSON fetch
resolves, appending unreserved height below an already-swapped figure. Measured on the built
export: **37 px** of late height at 1280 px, **79 px** at 375 px, both after the skeleton has
already been replaced, so the page shifts twice.

Always render the paragraph's line box. Keep the element and its `aria-live="polite"` mounted
from first render and render `&nbsp;` while `readout` is `null`, so its height is stable. Do
not put a loading sentence in an `aria-live` region.

#### R4.6 — the settle pulse never releases (medium)

`SoftmaxRace.tsx:96` sets `pulsed` true at 1800 ms and never resets it, and the bar's style is
`scale(isWinner && pulsed ? 1.02 : 1)`. The spec is a single pulse, 1 → 1.02 → 1 over 240 ms.
As written the winning bar, a mark whose length encodes a probability, is left permanently 2 %
too long. Invisible today only because R1.1 keeps `entered` false; it becomes visible the
moment the hook is fixed.

Schedule a second timeout 240 ms after the first that sets `pulsed` back to `false`, and clear
both in the effect's cleanup. Under reduced motion neither timer runs and no pulse occurs,
which is unchanged.

While in this file, apply the R3.5 responsive row so the eight rows are not clipped at 375 px
(the well currently reports `scrollHeight 188 > clientHeight 182`) and set
`well={{ height: 420, heightSm: 360 }}`.

#### R4.7 — the frozen hatch disappears in dark theme (medium)

`TransferDiagram.tsx:72-74` hardcodes the hatch as
`repeating-linear-gradient(45deg, rgba(11,12,14,0.14) …)`, which is light-theme ink at 14 %.
On the dark well (`--surface-2` is `#1B1C1E`) it is imperceptible, and the fine-tuned blocks'
`--surface-1` fill (`#141517`) is nearly the same colour as the well, so the spec's
hatch-plus-word encoding degrades to word-only in dark. Reported independently by the code
reviewer and the visual reviewer.

Two changes:

- Drive the stripe colour from a theme token: `var(--viz-hairline)` inside the gradient
  (`var()` is valid in CSS gradients, unlike in canvas), which already flips per theme.
- Give the fine-tuned blocks a mark that clears the well in both themes: keep the
  `--surface-1` fill and set `borderColor: 'var(--text-primary)'` on fine-tuned blocks while
  frozen blocks keep `--border-subtle`. Three signals then carry the distinction: border
  weight, hatch, and the printed word. None of them is colour alone.

Set `well={{ height: 340, heightSm: 300 }}`. Measured content is 267 px at 375 px and 212 px
at 1280 px, against a `4 / 3` well that is 213 px at 375 px (clipped) and 832 px at 1280 px
(620 px of empty panel). This is the single change that fixes both.

#### R4.8 — the chance rung communicates nothing (medium)

`ResultsLadder.tsx:74` puts the dashed `--border-strong` marker on the border of the chance
bar itself, and that bar is `0.317 / 97.651` of the track, about 0.32 %, so it renders as a
1 to 2 px sliver at any viewport. The spec's intent, "so the floor is not something the reader
has to work out", is carried only by the printed label.

Draw the marker independently of the data width: a full-row-height dashed vertical rule
positioned at the chance fraction of the track (`left: 0.317/97.651 * 100%`), 1 px wide,
`--border-strong`, plus the existing printed `chance, 1 in 315` label. The chance bar itself
keeps the same fill as the other non-winning bars. The rule is decorative, so it takes
`aria-hidden`; the label carries the meaning.

#### R4.9 — radiogroups adopt the hook

`KernelControl` in `ConvolutionSweep.tsx:134-171` and the VGG16 block picker in
`LayerPyramid.tsx:65-79` both switch to `useRovingRadioGroup`. In `LayerPyramid`, keep the
per-block inline `width`/`opacity` style and the staggered transition; the hook only supplies
`ref`, `role`, `aria-checked`, `tabIndex` and `onClick`.

#### R4.10 — the grayscale row records the wrong metric (medium, content integrity)

`content/data/bird-model-ladder.ts:31` records `accuracy: 0.208` sourced as
`nb01 cells 102-104`. Every other row in the file transcribes the notebook's own printed
evaluation line. Verified directly against the public notebook
(`Capstone 3/Notebooks/01_Data Wrangling, Exploration, Preprocessing and Hyper Parameter
Tuning.ipynb`): cell 102 runs `gs_model.evaluate(gs_test, label_cat['test'])` and prints
`Test Accuracy: 21.778`. The committed 0.208 is epoch 99's `val_accuracy` of 0.2083; the final
epoch's was 0.2178, so 20.8 % is also the second-to-last epoch rather than the last. The
highest `val_accuracy` anywhere in that run is 0.3137.

This one is my error, not the developer's: the spec's own data table said "~30% peak, 20.8%
final val". The developer transcribed the spec faithfully. Correcting both.

Set the row to:

```ts
{
  name: 'Grayscale CNN, 100 epochs',
  accuracy: 0.21778,
  source: 'nb01 cell 102',
  note: 'Peaked at 31.4% during training, then 21.778% at evaluation.',
}
```

Then correct the header comment. Its current second paragraph claims the grayscale row and
two search-strategy figures are the only ones recorded to one decimal place; after this change
every row is a printed evaluation figure to three decimals. Replace that paragraph with a
statement of what is actually true, and record two facts a future reader will otherwise
"correct" back into a bug:

- Notebook 02's evaluation cells print the label `Valid Accuracy` but call
  `model.evaluate(test_generator, ...)`. The label in the notebook is wrong; the figures are
  test-set figures. Verified in cells 26, 33, 60 and 75. Do not renumber these rows or
  relabel them "validation" on the strength of the printed string.
- Notebook 01's runs fit with `validation_data=(X_test, y_test)` and then evaluate on that
  same split, so its "Test Accuracy" figures are on the split used for early stopping. Worth
  recording in the module comment. Do not put this caveat on the page.

#### R4.11 — the prose that quotes the grayscale figure

`content/projects/bird-species-cnn.ts`, the `next-time` section, currently says the grayscale
run "settled at 20.8% on validation, a loss of roughly 40 points against the equivalent colour
run". Update to the corrected figure and the arithmetic that follows from it: it finished at
21.778 % against the equivalent colour run's 60.762 %, which is roughly 39 points. Keep the
sentence's shape and voice; change the numbers only. Do not touch the 97.651 %, 94.984 %,
73.206 % or 45,980 figures anywhere in the record: all four are verified correct.

#### R4.12 — the dataset citation contradicts the record's own TODO

`content/projects/bird-species-cnn.ts:35-37` carries `TODO(pizon): … Pick a reachable
citation for this dataset before this record goes live`, and the record is now
`status: 'live'` with `dataset.provenance` naming `gpiosenka/100-bird-species`, a listing that
404s, and with the dataset entry missing from `links`. The TODO was not deleted, which is
right; what happened is that the page shipped past its own stated precondition.

Do not invent a replacement URL, and do not delete the TODO. Reword it so it describes the
state that actually shipped, for example:

```
// TODO(pizon): the original Kaggle listing (gpiosenka/100-bird-species) has been removed and
// 404s. The page ships a text-only citation for it, with no link. Add a reachable URL to
// `links` if you find one you are willing to stand behind.
```

Then raise it with Pizon as an open question (see the end of this document). No other change.

#### R4.13 — the well prop migration

`ResultsLadder` `{ height: 420, heightSm: 360 }`, `PixelMatrix` `{ ratio: '1 / 1' }`,
`ConvolutionSweep` `{ ratio: '2 / 1' }`, `LayerPyramid` `{ height: 520, heightSm: 420 }`,
`SoftmaxRace` `{ height: 420, heightSm: 360 }`, `TransferDiagram`
`{ height: 340, heightSm: 300 }`. The `CHROME` map in `BirdVisuals.tsx` carries identical
values.

These heights come from measuring the loaded content on the built export. If a row lands a
few pixels taller than measured, raise the number until criterion 20 passes rather than
letting anything clip.

**R4 acceptance criteria**

18. With `prefers-reduced-motion: reduce`, all twelve luminance overlays in `PixelMatrix`
    render at `opacity: 0.92` on first paint, with no crossfade and no source photograph.
19. With default motion, after scrolling to each figure: all six activation thumbnails reach
    `opacity: 1`; the eight softmax bars reach their final widths; the winning bar's computed
    `transform` returns to `scale(1)` within 2.5 s of settling and stays there.
20. At 375, 768 and 1280 px, every `.viz-well` on the route satisfies
    `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`. Specifically at 375 px:
    all five VGG16 radios and all six activation thumbnails are inside the depth well, both
    attribution lines are visible, and every ladder row shows its name, its bar and its
    percentage.
21. At 1280 px, no checkpoint name in `ResultsLadder` is truncated.
22. Before pressing any key, the convolution readout, its `aria-live` paragraph and the
    "Show the numbers" table all describe the same window the accent cursor is drawn around.
    Pressing an arrow key moves both together.
23. The convolution readout paragraph occupies the same height before and after the JSON
    resolves; no layout-shift entry on this route attributable to a figure swap exceeds 0.005.
24. In dark theme, the frozen blocks in `TransferDiagram` are visually distinguishable from
    the fine-tuned blocks with the text labels covered; the same holds in light theme.
    `grep -n "rgba(11,12,14" components/projects/bird/TransferDiagram.tsx` returns nothing.
25. The chance marker in `ResultsLadder` is visible at 375 and 1280 px and is not the border
    of the chance bar.
26. Arrow keys in the kernel picker and the VGG16 block picker move both selection and
    `document.activeElement`.
27. `content/data/bird-model-ladder.ts` records `0.21778` for the grayscale row with source
    `nb01 cell 102`, and every `accuracy` in the file equals the figure printed by that cell's
    own `model.evaluate(...)` call. The header comment makes no claim that is false for any
    row.
28. `content/projects/bird-species-cnn.ts` contains no occurrence of "20.8"; the `next-time`
    section quotes 21.778 % and roughly 39 points. The dataset `TODO(pizon:)` marker is still
    present and its wording matches the shipped state.

---

## Global acceptance criteria

29. `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` all pass with no
    new warnings. `npm run build` is the gate.
30. No route handler, middleware, `force-dynamic`, request-time fetch or `next/image`
    optimization is introduced. Both project routes stay server components with no
    `'use client'` and no `dynamic(` call, with every `ssr: false` import still confined to
    `NycVisuals.tsx` and `BirdVisuals.tsx`.
31. Every asset URL still goes through `withBasePath()`. `grep -rn "src=\"/" components app`
    returns nothing new.
32. Zero console errors and zero uncaught rejections on both routes, at 375 and 1280 px, in
    light and dark themes, with default and reduced motion.
33. axe reports no new violations on either route in either theme.
34. **Voice.** `grep -rn "—" app components lib content scripts README.md` returns matches
    in `content/profile.ts` only, and the em dashes in the exported HTML under `out/` are
    exactly the ones `content/profile.ts` supplies. No "AI tell" phrasing: no throat-clearing
    openers, no padded triplets, no meta-commentary about the writing. No occurrence of "claude", "anthropic",
    "chatgpt", "copilot", "AI assistant" or "generated by" anywhere under `app`, `components`,
    `lib`, `content`, `scripts`, `.github`, in commit messages, or in the exported HTML. Every
    user-visible string added or changed by this pass is listed verbatim in this document;
    do not improvise new copy.
35. No private repository link, no client name, and no figure that is not either synthetic or
    from the cited public source appears on either page.

## Data

Two content corrections. Both are transcriptions from public sources, both verified against
the source before this document was written.

**`content/data/bird-model-ladder.ts`**, the grayscale row. Source: the public capstone
repository, `Capstone 3/Notebooks/01_Data Wrangling, Exploration, Preprocessing and Hyper
Parameter Tuning.ipynb`, cell 102, whose final two lines are:

```python
_, gs_acc = gs_model.evaluate(gs_test, label_cat['test'],  verbose=0)
print('Test Accuracy: %.3f' % (gs_acc * 100))
```

and whose printed output is `Test Accuracy: 21.778`. The highest `val_accuracy` in that run's
epoch log is `0.3137`; the last epoch's is `0.2178`; the second-to-last is `0.2083`.

```ts
{
  name: 'Grayscale CNN, 100 epochs',
  accuracy: 0.21778,
  source: 'nb01 cell 102',
  note: 'Peaked at 31.4% during training, then 21.778% at evaluation.',
}
```

**`content/projects/nyc-housing-prices.ts`**, the tagline. The target column is `price` in a
2019 Zillow NYC listings extract; the record's `summary`, its `#problem` section and the
capstone report all frame the question as an asking price; every figure on the page already
says "list price".

```ts
tagline:
  'Predicting list price across 59,350 NYC listings, and finding that location beats '
  + 'every other feature combined.',
```

No other content record, data module or figure changes.

## Visual and motion design

What actually moves differently after this pass:

- **NYC map entry.** Same choreography, same 900 ms, same expanding ring from the centroid,
  same 220 ms per-cell fade and 0.4 → 1 scale. The only change is that the last cell now
  starts at 756 ms instead of 1000 ms, so the sequence finishes inside its own duration.
  Reduced motion: unchanged, paints complete.
- **NYC map hover.** Pointer over a cell now dims non-matching boroughs to 0.2 alpha over
  120 ms and outlines the hovered borough, matching what a table row already does. Pointer
  leave restores over the same 120 ms. Reduced motion: instant, no alpha transition.
- **Section reveals.** Identical to today (opacity 0 → 1, `translateY(12px)` → 0, 480 ms,
  `--ease-out`, once), implemented in CSS instead of framer-motion. Reduced motion: a 120 ms
  opacity fade with no translate.
- **Activation thumbnails and softmax bars.** These animate for the first time: thumbnails
  fade in at 240 ms with a 40 ms stagger capped at eight, bars grow over 1800 ms. Both were
  specified and neither has ever run for a default-motion visitor.
- **Softmax settle pulse.** One shot: `scale(1) → 1.02 → 1` over 240 ms at 1800 ms, then done.
  Not a permanent 2 % distortion.
- **Bar rows below `sm`.** Two lines instead of one: name and value on the first, the bar
  track full width on the second. From `sm` up, unchanged from today's single line.
- **Figure wells.** Six figures move from an aspect ratio to a reserved fixed height. Nothing
  animates as a result; the box is reserved before the chunk lands exactly as it is today.

Everything else keeps the motion vocabulary already in the spec: `--dur-fast` 120 ms,
`--dur-base` 240 ms, `--dur-slow` 480 ms, `--dur-draw` 900 ms, `--dur-sequence` 1800 ms,
`--ease-out` for entrances, `--stagger` 40 ms capped at eight items. Every animation still
reads `usePrefersReducedMotion()` and renders its terminal state immediately when reduced.

## Out of scope

- `/experience` and `components/experience/RoleTimeline.tsx`. That route still loads
  framer-motion at 155 KB first-load. It has no numeric budget in the spec, and its parallax
  needs `useScroll`. A separate pass.
- Removing `framer-motion` from `package.json`.
- `components/viz/KernelSweep.tsx`. Shared with the landing hero; not touched here.
- Any new figure, section, route or content record.
- Lighthouse tuning beyond the first-load JS numbers in criterion 7.
- Choosing a replacement URL for the bird dataset citation. That is Pizon's call.

## Open questions for Pizon

1. **Bird dataset citation.** The Kaggle listing `gpiosenka/100-bird-species` has been
   removed and 404s. The page currently names it in prose with no link. Accept that, or
   supply a reachable citation (an archived listing or a mirror you are willing to stand
   behind) to put back in `links`? Until you answer, the `TODO(pizon:)` marker stays in the
   record.
2. **NYC target label.** This pass changes the hero tagline from "sale price" to "list price"
   so the page stops contradicting its own figures. Confirm that matches your memory of the
   capstone's target column.

## A note on reporting

The verification report for this pass must state every path in the working tree that changed,
including anything built to a separate instruction, and must state any acceptance criterion
that fails along with its measured value. The previous report claimed a twelve-file diff while
the tree held two full routes; the work itself was sound, but a report that does not match
`git status --porcelain` costs a reviewer more than the work saves.
