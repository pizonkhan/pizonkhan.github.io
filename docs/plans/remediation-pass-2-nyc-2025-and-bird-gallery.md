# Remediation pass 2: the 2025 sales map and the bird narrowing figure

Remediates the six tasks built from [nyc-v2-and-bird-gallery.md](nyc-v2-and-bird-gallery.md).
Inputs: one code review, one test run, one visual review of the built export. Every finding
below has been re-verified against the working tree and, where it is a runtime claim, against
`out/` served over HTTP in a real Chrome at the stated viewport. Measurements quoted in this
document are mine, not copied from a report.

## Goal

After this ships, `/projects/nyc-home-sales-2025/` actually draws its centrepiece: a visitor
landing on that page, in either theme, sees the OpenFreeMap basemap with price-coloured clusters
inside the reserved well instead of a blank grey box, with a clean console. The page's write-up
stops making two comparative claims that its own committed model output disproves. On the bird
page, a visitor at 375 px sees all eight bars of the "Top 8" stage plus the line that reads them
out, instead of the five and a half rows that fit before the well clips them, and a stage they
pick by hand stops being overwritten by the autoplay timers half a second later.

## Assumptions

1. **The map's container fix is applied inline, not in `app/globals.css`.** The collision is
   between two single-class selectors resolved by stylesheet order, and the map stylesheet is
   injected with the lazy chunk, so source order in `globals.css` cannot be relied on. An inline
   style beats every stylesheet without depending on load order or on a specificity arms race.
   This also keeps the fix inside the one file that owns the map and out of the global sheet
   every route pays for.
2. **The bird figure's well grows rather than the phone layout compacting.** The original plan's
   sizing note for this figure says "Measure and raise until criterion 46 passes." It does not
   sanction shrinking the photograph or the bar rows below `sm`, and criterion 54 requires the
   R3.5 responsive row to stay intact at 375 px, so the row itself cannot be collapsed to one
   line. Raising is the spec-conformant move. The one exception is the row's own width
   arithmetic, which is a deviation from the shared row and is corrected here (see R3.1).
3. **A points.json load failure is a first-class state, not only an offline curiosity.** The same
   code path renders every visitor's first 1 to 2 seconds on the page, where the accessible
   summary currently reads `Showing 0 sales ... Prices run from $0 to $0`. The fix therefore
   covers loading, empty-filter and error, not just error.
4. **No new dependency, no new file.** Every change is an edit to a file that already exists.
   Nothing here needs a test runner, a browser automation package, or a new content module.
5. **`lib/theme.ts` is not edited.** `useThemeName()`'s "light on first render, correct in an
   effect" contract is deliberate and is what keeps hydration honest for every other consumer.
   The map is the component that must not read the first-render value, so the map is where the
   fix goes.

## Triage

Ordered by real severity, not by which report raised it. Every row below was re-verified before
it was accepted.

| # | Severity | Where | What is actually wrong | Task |
| --- | --- | --- | --- | --- |
| 1 | **P0** | `SalesMap.tsx:649` | Map container computes `position: relative; height: 0`, so the centrepiece renders a blank grey box in the shipped export. Two reviewers found it independently; I confirmed the cascade by reading the built CSS. | R1.1 |
| 2 | **P0** | `SalesMap.tsx:314, 342, 541` | Dark-first load throws `Error: Source "sales" already exists.` and draws zero dots. Reproduced by me on the built export with `localStorage['pizonkhan-theme'] = 'dark'`. | R1.2 |
| 3 | **P1** | `content/projects/nyc-home-sales-2025.ts:141,157` | Two comparative claims that the committed generated modules disprove. Content integrity is this project's first rule. | R2 |
| 4 | **P1** | `SoftmaxRace.tsx:63,184` | Stage 1 overflows the 375 px well by 225 px and is clipped by `.viz-well{overflow:hidden}`. Measured, not estimated. Two causes, one of them unreported (see R3.1). | R3.1, R3.2 |
| 5 | **P2** | `SalesMap.tsx:373` | `cluster-count` requests the spec-default font stack, which OpenFreeMap 404s on every load. I reproduced the 404 and confirmed `Noto Sans Regular` returns 200 from the same endpoint. | R1.3 |
| 6 | **P2** | `SalesMap.tsx:624, 646` | The accessible summary states figures that are false while loading, while a filter matches nothing, and after a failed fetch; its last sentence contradicts the neighbourhood table's own context line. | R1.4 |
| 7 | **P2** | `ModelMechanisms.tsx:185, 230` | Two pieces of the component contract are missing: the two printed slopes and the `target` axis label. Reported independently by the code reviewer and the visual reviewer. | R4 |
| 8 | **P3** | `SoftmaxRace.tsx:148` | A stage picked during the first 1.35 s is overwritten by pending autoplay timers. | R3.3 |
| 9 | **P3** | `SoftmaxRace.tsx:218` | `alt="Photograph of a American robin."` Wrong article before a vowel sound on three of eight species, and mid-sentence capitals on the rest. | R3.4 |
| 10 | **P3** | `SalesMap.tsx:312` | The constructor-throw fallback still issues the ~230 KB `points.json` fetch, which the plan's fallback contract explicitly forbids. Rare path, real deviation. | R1.5 |
| 11 | **P3** | `scripts/build-bird-assets.py:405,453` | The script still writes `softmax-top8.json`, so re-running the documented regeneration path resurrects a deleted file. | R5 |

### Dropped as a false positive

- **`@playwright/test` added outside every manifest [code review 7].** It was not. `git diff HEAD -- package.json` shows exactly one added line, `maplibre-gl`, and `git diff HEAD -- package-lock.json | grep -i playwright` returns nothing. The four `playwright` matches in the lockfile are Next.js 15.5.22's own `peerDependencies` and `peerDependenciesMeta` entries, which are marked optional and predate this wave. There is an empty `node_modules/@playwright/` directory on this machine from an ad-hoc run; `node_modules` is gitignored, it has no lockfile entry, and it will not exist on a clean install or in CI. No action beyond the verification command in criterion 24.

### Conflicts resolved

- **`softmax-top8.json` in the build script.** The code reviewer called it medium and unowned; the tester called it inert and correctly noted it sits on a Task 5/Task 6 manifest boundary. Both are right about the facts and they only disagree about severity. Resolution: it is real (criterion 53 says "nothing references it", and three references remain), it is user-invisible (the committed file is gone, `out/` contains zero occurrences, and the script never runs in CI), and it is thirteen lines. It ships as P3, with an owner named, so it stops bouncing between manifests.
- **The bird stage-1 overflow.** The code reviewer flagged it and admitted the arithmetic was hand-estimated; neither browser-running reviewer confirmed it. I measured it on the built export. It is real: at 375 px on stage 1, `.viz-well` reports `scrollHeight` 1003 against `clientHeight` 778. Criterion 46 fails today. The reviewer's suggested height was also wrong, because the dominant cause is a row-width bug nobody found (R3.1), and fixing that first changes the required height from about 1030 to 920.
- **The map failure.** The tester and the visual reviewer reported the same defect with the same root cause and the same proof-by-override. They agree; there is nothing to reconcile. Both are folded into R1.1.

### Found during triage, not reported by anyone

- **`SoftmaxRace`'s bar row is the only one on the site that uses `w-[calc(100%-6rem)]`.** Every
  other implementation of the R3.5 responsive row (`ModelLadder.tsx`, `ModelLadder2025.tsx`,
  `ImportanceBars.tsx`, `ResultsLadder.tsx`) uses `7rem`. `6rem` does not account for the
  `gap-x-3` between the name and the value, so at 375 px the name (197 px) plus the gap (12 px)
  plus the value (96 px) is 305 px against 293 px of available width, and the value wraps onto
  its own line. Each of the eight rows renders on three lines instead of two, which is both a
  visual regression against every other ladder on the site and 120 px of the overflow in item 4.
  Measured: row height 56 px today, 41 px after the fix.
- **The accessible summary is wrong on the happy path too**, not only when the fetch fails. For
  the first 1 to 2 seconds of every visit it reads `Showing 0 sales, every property type, every
  month. Prices run from $0 to $0.` Folded into R1.4.
- **The neighbourhood table's context line overstates its own coverage.** It says the table
  "always covers every residential sale in the snapshot", but `NEIGHBORHOODS_2025` drops
  neighbourhoods below a four-sale floor, which the module's own header and the page's
  `dataStatement` both say. Folded into R1.4 so the map summary and the table agree.

## File manifest

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `components/projects/nyc2025/SalesMap.tsx` | Edit | Container positioning, theme-correct construction, idempotent layer add, cluster font, accessible summary and label states, points fetch gated on successful construction. |
| `components/projects/nyc2025/useSalesPoints.ts` | Edit | `useSalesPoints(enabled)` so the fallback state makes no fetch. |
| `components/projects/nyc2025/NeighborhoodTable.tsx` | Edit | One sentence: the table's coverage claim. |
| `content/projects/nyc-home-sales-2025.ts` | Edit | Two prose claims that the committed model modules disprove. |
| `components/projects/bird/SoftmaxRace.tsx` | Edit | Row width, well height, photo alt text, autoplay timer cancellation. |
| `components/projects/bird/BirdVisuals.tsx` | Edit | `CHROME.decision.well` height, kept identical to the figure's own so the skeleton reserves the right box. |
| `components/projects/nyc2025/ModelMechanisms.tsx` | Edit | Printed slopes for the linear mechanism, `target` axis label. |
| `scripts/build-bird-assets.py` | Edit | Stop writing `softmax-top8.json`. |

Nothing else. No new file, no new dependency, no change to `package.json`, `package-lock.json`,
`next.config.ts`, `app/globals.css`, `lib/`, or any generated module under `content/data/` or
`public/projects/`.

## Component contracts

Only one exported signature changes.

### `components/projects/nyc2025/useSalesPoints.ts`

```ts
/**
 * Fetches and decodes public/projects/nyc-home-sales-2025/points.json exactly once, through
 * withBasePath(), so a build under a subpath resolves it. `enabled` exists so the map's
 * fallback state, which covers both the WebGL-probe-false path and the rarer
 * Map-constructor-throw path, issues no request at all: the plan's fallback contract says that
 * state fetches neither points.json nor any shard. Stays 'loading' while disabled.
 */
export function useSalesPoints(enabled?: boolean): PointsState
```

`enabled` defaults to `true`, so the signature is source-compatible. The fetch effect returns
early when `enabled` is false and lists `enabled` in its dependency array. Nothing else in this
module changes: `SalesPoints`, `SaleDetail`, `PointsState`, `DetailState`, `useSaleDetail` and
the module-scope shard cache are untouched.

**Does NOT own:** when the map is ready. The caller decides that and passes it in.

### `components/projects/nyc2025/SalesMap.tsx`

`SalesMapProps` is unchanged. `SalesMap` and `MapUnsupportedFigure` are unchanged. All edits are
inside `SalesMapReady`, plus one layer definition.

New internal state and refs:

| Symbol | Type | Purpose |
| --- | --- | --- |
| `mapCreated` | `useState<boolean>` | `false` until `new maplibregl.Map(...)` returns without throwing. Passed to `useSalesPoints`. Distinct from `mapReady`, which waits for `load`. |
| `pointsStatusRef` | `useRef<PointsState['status']>('loading')` | Lets the `[]`-dependency `updateCanvasA11y` callback read the current load status without being rebuilt. Kept in sync by an effect declared alongside the existing `themeRef` and `reducedRef` sync effects, so it is written before the filter effect that reads it runs. |

Deleted: `initialThemeRef` and the render-phase assignment `if (initialThemeRef.current === null)
initialThemeRef.current = theme`. Reading a first-render theme value is the bug; there is no
correct use of that ref after this change.

**Does NOT own:** the theme system. It reads `document.documentElement.dataset.theme` once, at
construction, and continues to subscribe through `useThemeName()` for every later change.

### `components/projects/nyc2025/ModelMechanisms.tsx`

`Mechanism` and `ModelMechanismsProps` are unchanged. The component gains no props and no state.
Two render additions, both driven by constants that already exist in the module (`OLS.slope`,
`PENALISED.slope`), both formatted with `.toFixed(2)` at render time so a printed number can
never drift from the line that is drawn.

**Does NOT own:** any real metric. Both printed slopes belong to the synthetic scatter and the
figure's `source` line already says so.

### `components/projects/bird/SoftmaxRace.tsx`

No exported signature changes. `NarrowingRow`'s props are unchanged. One new internal ref:

| Symbol | Type | Purpose |
| --- | --- | --- |
| `timersRef` | `useRef<number[]>([])` | Holds the five pending autoplay timeout ids so a manual stage press can cancel them. |

**Does NOT own:** the replay-on-species-change behaviour, which stays where it is, in the
autoplay effect's dependency array.

## Data

No data module changes. No generated file is regenerated. The only content edit is prose in
`content/projects/nyc-home-sales-2025.ts`, whose `ProjectRecord` type is unchanged.

The two sentences being corrected are checked against these committed values, which the developer
must not edit:

`content/data/nyc-2025-models.ts` → `MODELS_2025`, rung-to-rung MAE cuts in dollars:

| Rung | Test MAE | Cut from the rung above |
| --- | ---: | ---: |
| Citywide median | 645,311.01 | floor |
| Ridge regression | 586,820.23 | 58,490.78 |
| k-nearest neighbours | 459,160.37 | 127,659.86 |
| Gradient boosting | 411,730.86 | 47,429.51 |
| Gradient boosting, log target | 399,410.84 | 12,320.02 |
| Random forest (winner) | 377,558.13 | 21,852.71 |

The winner's own cut is the second smallest on the ladder. Its total distance from the floor is
645,311.01 - 377,558.13 = **267,752.88**, which `formatUSD` renders as **$267,753**. The largest
single cut belongs to k-nearest neighbours, **$127,660**.

`content/data/nyc-2025-models.ts` → `IMPORTANCE_2025`, top three:

| Feature | Mean increase in test MAE |
| --- | ---: |
| Gross square feet | 569,622.65 |
| Residential units | 305,722.87 |
| Borough: Manhattan | 269,204.06 |

305,722.87 + 269,204.06 = **574,926.93**, which is **more** than 569,622.65. "More than the next
two features combined" is false. "Nearly as much as the next two features combined" is true, at
99.1 percent of their sum.

## Visual & motion design

Nothing in this pass adds an animation. Three things change what is on screen.

**The map, once its container is positioned.** No motion change. The existing one-shot entry fade
on `clusters` and `points` (`circle-opacity` 0 to 1 over 900 ms, 0 ms under reduced motion) is
untouched, as are every `easeTo`/`flyTo` duration and the `reducedRef` gate on each. What changes
is that they now run against a canvas with a non-zero size, so they are visible for the first
time. Measured on the built export with the positioning forced: container and canvas both
618 px tall inside the 620 px desktop well.

**The points-failure notice.** A static one-line panel, no transition, pinned to the top of the
well over the basemap: `absolute inset-x-4 top-4 z-10`, `bg-surface-1`, `border-border-strong`,
`rounded-(--radius-sm)`, `px-3 py-2`, `text-small text-text-secondary`. It appears only when
`pointsState.status === 'error'`. It carries no colour-only meaning and it duplicates the
sentence the WebGL fallback already uses, so a reader who hits either state reads the same
instruction.

**The linear mechanism's slope row.** A static text row beneath the plot, rendered only when
`mechanism === 'linear'`, in the same slot and with the same `text-tick text-text-tertiary`
treatment as the existing `boosting` stage row, so the two mechanisms that add a row add the same
kind of row. No transition on appearance: mechanism switching already cross-fades the overlay
marks, and a text row that fades would draw the eye away from the lines it is labelling. Each
label is preceded by an 18 x 2 px `aria-hidden` swatch drawn with the same stroke as its line,
solid `--text-primary` for least squares and 3-2 dashed `--viz-cat-6` for the penalised fit, and
the penalised label also says the word "dashed", so the mapping from label to line survives
without colour. Measured headroom: the `svg` is `flex-1` inside the well, and the existing
`boosting` row already shrinks it from 192 px to 133 px at 375 px with no overflow, so a single
text row costs about 20 px of plot height and cannot overflow the well.

**The `target` axis label.** Static, `text-tick text-text-tertiary`, `[writing-mode:vertical-rl]
rotate-180`, vertically centred to the left of the plot. The `low / feature / high` row stays
aligned with the plot by moving inside the same right-hand column as the `svg`, not by being
offset by hand.

**The bird figure's well.** Height only. No motion change, no layout change above `sm`. The taller
reserved box is set in both `SoftmaxRace.tsx` and `BirdVisuals.tsx`'s `CHROME.decision` in the
same commit, because the second is what `FigureSkeleton` reserves before the chunk lands, and a
mismatch is a layout shift the plan's criterion 27 measures.

**Voice, for every string in this document.** All copy specified here is Pizon's: no em dashes,
no throat-clearing, no padded triplets, no meta-commentary, and no reference anywhere a visitor,
a screen reader or a future reader of the source could see it to how the code was produced. The
strings below are verbatim. Do not paraphrase them, do not add a friendlier preamble, and do not
introduce an em dash into a comment or a commit message. `content/projects/registry.test.ts`
already fails the build on an em dash in any rendered content string.

## Acceptance criteria

Each is independently checkable. "The built export" means `rm -rf out .next && npm run build`,
then `npm run serve`, then a real browser at the stated viewport. Do not accept a `next dev`
result for anything in 1 through 8: the defects in R1 only exist in the export's chunked CSS.

1. On the built export at 1280 px, `/projects/nyc-home-sales-2025/` renders the OpenFreeMap
   basemap and price-coloured clustered circles inside the map well within 3 seconds of the
   figure entering view. A computed-style probe on `.viz-well .maplibregl-map` returns
   `position: absolute` and a `getBoundingClientRect().height` of at least 600 px at 1280 px and
   at least 540 px at 375 px.
2. Zooming to 16 over Manhattan splits clusters into single dots, and clicking one fills
   `SalesDetailPanel` with a non-empty address, neighbourhood, borough, price, date, building
   type and either a floor area or the string `not recorded`. This is the plan's criterion 22,
   re-run because it could not previously be attempted.
3. With `localStorage['pizonkhan-theme']` seeded to `'dark'` before first navigation, the map
   renders the dark basemap **and** its dots, the console logs zero errors and zero uncaught
   exceptions, and a probe after `load` finds `map.getSource('sales')`, `map.getLayer('clusters')`,
   `map.getLayer('cluster-count')`, `map.getLayer('points')` and `map.getLayer('selected')` all
   defined. Repeat with the value seeded to `'light'`: same result against the light basemap.
4. Toggling the theme twice in each direction after load leaves all four layers and the source
   defined, the canvas's `aria-label` and `aria-describedby` still set, and the console clean.
   This is the plan's criterion 23, re-run because the idempotency guard is new.
5. A full page load with the network tab open produces **no** request to
   `https://tiles.openfreemap.org/fonts/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/*`
   and no 4xx response of any kind. Cluster count labels still render on top of their circles in
   both themes.
6. With `**/nyc-home-sales-2025/points.json` blocked in devtools, the map well shows the sentence
   `The sales file did not load, so the map has no dots. Every figure it shows is in the
   neighbourhood table below.`, the neighbourhood table below is fully populated, the console
   logs no uncaught error, and the visually hidden `#sales-map-summary` contains neither the
   substring `Showing 0 sales` nor the substring `$0 to $0`.
7. On a normal load, `#sales-map-summary` never contains `Showing 0 sales` or `$0 to $0` at any
   point, including during the first second while `points.json` is in flight. Setting the
   property group and month to a combination that matches nothing renders
   `No sales match this filter:` followed by the group and month description, and no price range.
8. The last sentence of `#sales-map-summary` and the context line above `NeighborhoodTable` state
   the same thing about the table's coverage, and neither claims the table responds to the map's
   filters. Both mention the four-sale floor or say "not filtered"; neither contradicts the
   other.
9. `/projects/nyc-home-sales-2025/` renders the string `more than the next two features combined`
   nowhere in the built HTML, and renders `the largest single-model cut in the whole ladder`
   nowhere. `grep -r "next two features combined" out/` and
   `grep -r "largest single-model cut" out/` both return nothing.
10. Every dollar figure in the `ladder` and `winner` sections of
    `content/projects/nyc-home-sales-2025.ts` matches `MODELS_2025` or `IMPORTANCE_2025` to the
    dollar after `formatUSD` rounding, including the two new figures `$267,753` and `$127,660`.
    Checkable by hand against the table in the Data section above.
11. `npm run test` passes, including `content/projects/registry.test.ts`'s em-dash assertion over
    every rendered content string.
12. On the built export at 375 px, with the narrowing figure scrolled into view and the stage
    stepper set to `Top 8`, the figure's `.viz-well` satisfies `scrollHeight <= clientHeight`.
    Repeat for all four stages and for all eight gallery species: 32 checks, all pass. Repeat the
    four stages at 768 px and 1280 px. This is the plan's criterion 46, which fails today at
    375 px on stage 1 with `scrollHeight` 1003 against `clientHeight` 778.
13. At 375 px on stage 1, each of the eight bar rows renders on exactly two lines: the class name
    and the percentage share line one, the track alone on line two. Checkable as
    `row.getBoundingClientRect().height` of about 41 px, not 56 px, and as the name and value
    spans having equal `getBoundingClientRect().y`.
14. `SoftmaxRace.tsx`'s `well` prop and `BirdVisuals.tsx`'s `CHROME.decision.well` are the same
    object literal, value for value. `grep -n "height: 780" components/` returns nothing.
15. Reload the bird page, scroll the narrowing figure into view, and within 500 ms press the
    `Top 3` stepper button. The figure stays on `Top 3`: it does not advance at 900 ms or
    1,350 ms, and no row pulses at 1,800 ms. Repeat with the keyboard (arrow keys inside the
    stage radiogroup) for the same result.
16. With no interaction at all, the autoplay clock is unchanged: stage 0 at 0 ms, stage 1 at
    450 ms, stage 2 at 900 ms, stage 3 at 1,350 ms, each within +/- 150 ms, then the settle pulse
    at 1,800 ms returning to `scale(1)` by 2,300 ms. This is the plan's criterion 45 and it must
    still pass.
17. Under `prefers-reduced-motion: reduce`, the narrowing figure still paints stage 3 first, runs
    no timer, and its stepper still moves between all four stages instantly. This is the plan's
    criterion 44 and it must still pass.
18. The selected species' photograph has an `alt` attribute equal to that species' common name
    exactly, with no article and no trailing full stop. `grep -n "Photograph of a" components/`
    returns nothing.
19. On the mechanisms figure with `Linear` selected, the figure's own `innerText` contains both
    `0.62` and `0.22`, and contains the word `target`. Both slope strings disappear when another
    mechanism is selected; `target` stays. The `Show the numbers` disclosure for `Linear` also
    contains both slope values.
20. At 375, 768 and 1280 px, the mechanisms well satisfies `scrollWidth <= clientWidth` and
    `scrollHeight <= clientHeight` for all four mechanisms. This is the plan's criterion 28 and
    the slope row and axis label must not break it.
21. `grep -rn "softmax-top8" scripts/ app/ components/ content/ public/ out/` returns nothing.
    `python -m py_compile scripts/build-bird-assets.py` exits 0.
22. `git status --porcelain public/projects/bird-species-cnn/` shows no new untracked file after
    the script edit, and the six preserved bird components stay byte-identical:
    `git diff --stat` lists none of `PixelMatrix.tsx`, `ConvolutionSweep.tsx`, `LayerPyramid.tsx`,
    `ActivationStrip.tsx`, `TransferDiagram.tsx`, `ResultsLadder.tsx`.
23. `npm run typecheck` and `npm run lint` pass with zero errors and zero new warnings.
    `npm run build` completes and exports every route it exported before.
24. `git diff HEAD -- package.json package-lock.json` shows exactly one added dependency line,
    `maplibre-gl`, and no `playwright` line of any kind. No file outside the manifest above is
    modified: `git diff --name-only HEAD` is a subset of the eight paths listed.

### Performance budget

25. `/projects/nyc-home-sales-2025/` first-load JS stays **at or below 130 KB gzipped** in
    `next build`'s route table, unchanged from before this pass. `/projects/bird-species-cnn/`
    first-load JS is unchanged to within 1 KB.
26. The lazily loaded map chunk (`SalesMap` plus `maplibre-gl` plus its CSS) stays **at or below
    320 KB gzipped**. None of these edits may add an import to a new package.
27. The points fetch still starts within one React commit of the map construction succeeding.
    Concretely: on the built export with an unthrottled network, the `points.json` request
    appears in the network panel within 100 ms of the first tile request, not after the basemap
    finishes loading.
28. Scrolling the 2025 route top to bottom at 375 px and 1280 px produces no single layout-shift
    entry above 0.005 and total CLS below 0.02, with the bird route held to the same numbers.
    The bird well's height change must be applied to the skeleton in the same commit, so the
    reserved box never changes size when the chunk lands.

### Accessibility

29. axe reports zero violations on `/projects/nyc-home-sales-2025/` and
    `/projects/bird-species-cnn/`, in both themes, after every fix in this pass.
30. The MapLibre canvas keeps `role="region"`, a non-empty `aria-label` and an `aria-describedby`
    resolving to `#sales-map-summary`, in all three load states and after a theme toggle. The
    element hosting the canvas still has no `role="img"` and no `aria-hidden`. The inline
    positioning style must not introduce either.
31. The map's accessible summary is true in every state a visitor can reach: loading, ready,
    ready-but-no-match, and failed. A screen reader user is never told a count or a price range
    that is not on screen.
32. On the mechanisms figure, the difference between the two linear fits is legible without
    colour: each label names its line in words, the penalised label says "dashed", and both
    slope values appear in the `Show the numbers` table as well as on the figure.
33. Every new string is reachable as text. Nothing added in this pass lives only in a `title`
    attribute, only in a tooltip, or only as a colour.

## Out of scope

- Any redesign of the map figure: no new filter, no new layer, no popup, no basemap change, no
  change to the price ramp or the cluster radii.
- Compacting the bird figure's phone layout (smaller photograph, shorter tracks, tighter gaps).
  The well grows instead, per assumption 2. If a future pass wants a shorter figure on phones,
  that is a design change with its own plan.
- Regenerating any asset under `public/projects/`. `scripts/build-bird-assets.py` is edited but
  not run: it needs a 528 MB weights download and a TensorFlow environment, and criterion 58 of
  the original plan already covers byte-identical regeneration.
- Retraining anything. `scripts/train-nyc-sales-2025.py` and every module it generates are read
  only in this pass. Where the prose and the numbers disagree, the prose is what changes.
- Adding a browser test runner, a Playwright config, or any CI step. The verification above is
  manual, and the build remains the gate.
- The 2019 page (`content/projects/nyc-housing-prices.ts`) and its components. Its own
  "combined" phrasings are pre-existing and were checked in an earlier pass.
- `lib/theme.ts`, `lib/motion.ts`, `lib/roving-radio.ts`, `components/viz/Figure.tsx` and
  `app/globals.css`. All are shared by routes this pass does not touch.

---

## Tasks

Five tasks, dependency-free of each other and touching strictly disjoint file sets. Build them in
the order given, which is severity order, so the worst defect is fixed first even if the pass is
cut short.

---

### R1 - The map figure renders, in both themes, with a clean console

**Goal.** `/projects/nyc-home-sales-2025/` draws its basemap and its 44,784 dots inside the
reserved well on the built export, in both themes, with no console error and no 404, and its
accessible summary is true in every load state.

**Files.** `components/projects/nyc2025/SalesMap.tsx`,
`components/projects/nyc2025/useSalesPoints.ts`,
`components/projects/nyc2025/NeighborhoodTable.tsx`. Nothing else.

#### R1.1 The container must position itself, P0

`SalesMap.tsx:649` currently renders:

```tsx
<div ref={containerRef} className="absolute inset-0 overflow-hidden rounded-(--radius-lg)" />
```

MapLibre adds its own `maplibregl-map` class to this exact element at construction time, and
`maplibre-gl/dist/maplibre-gl.css` contains `.maplibregl-map{...;position:relative;...}`. That
stylesheet is imported inside the lazily loaded module, so Next emits it as a separate CSS chunk
(`out/_next/static/css/7dfd643b849ac952.css`) that is injected **after** the main stylesheet
(`c2f6c22a2a0c454f.css`). Tailwind's `.absolute{position:absolute}` and MapLibre's
`.maplibregl-map{position:relative}` are both single-class selectors, so specificity ties and the
later sheet wins. The element ends up `position: relative`, `inset-0` stops applying, the div
collapses to `height: 0`, and MapLibre sizes its canvas from a zero-height box. The visible result
in the shipped export is a blank grey well: the style, TileJSON, sprite and vector tile requests
all return 200 and nothing is ever painted.

Replace with:

```tsx
{/*
  Positioned inline, not with `absolute inset-0`. MapLibre stamps its own `maplibregl-map`
  class on this element, maplibre-gl.css sets `.maplibregl-map{position:relative}` at the same
  specificity as Tailwind's `.absolute`, and that stylesheet ships in the lazy chunk, so it
  loads after the main sheet and wins the cascade. An inline style cannot be beaten by either.
*/}
<div
  ref={containerRef}
  style={{ position: 'absolute', inset: 0 }}
  className="overflow-hidden rounded-(--radius-lg)"
/>
```

Keep `overflow-hidden` and the radius class. Do not add a rule to `app/globals.css`. Do not add
`!important` anywhere. Do not call `map.resize()` to compensate: with the inline style the
container has its final size before the constructor runs.

#### R1.2 Construct with the real theme, and make the layer add idempotent, P0

Two defects, one symptom. `useThemeName()` returns `'light'` on the first client render by
design, and `SalesMapReady` captures that first-render value into `initialThemeRef` during render
(line 314) and constructs the map with it (line 469). A visitor whose stored or OS theme is dark
therefore gets a light-styled map, then the corrected theme arrives, `appliedThemeRef` disagrees,
and the effect at line 541 calls `map.setStyle(dark)`. MapLibre's default diff keeps the custom
`sales` source while dropping the custom layers, so `addSourceAndLayers` throws at
`map.addSource('sales')` before re-adding a single layer. Result on a dark-first load: dark
basemap, zero dots, and an uncaught `Error: Source "sales" already exists.` in the console.
Reproduced on the built export.

1. Delete `initialThemeRef` and the render-phase assignment at line 314.
2. In the mount effect (line 461), before the constructor, read the theme the document is
   actually wearing and seed both refs from it:

```ts
// ThemeScript has already set data-theme on <html> before first paint, so the DOM is the
// truthful source here. useThemeName() deliberately reports 'light' on the first client render
// so a static export cannot mismatch on hydration, and constructing from that value is what
// gave a dark-theme visitor a light map and then a style swap it did not need.
const domTheme: ThemeName = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
themeRef.current = domTheme
appliedThemeRef.current = domTheme
```

   Use `STYLE_URL[domTheme]` in the constructor. Delete the existing
   `appliedThemeRef.current = initialThemeRef.current` line after the try/catch.
3. Make `addSourceAndLayers` safe to call more than once. At the top of the callback, before
   `map.addSource`:

```ts
// setStyle's diff does not reliably drop a runtime-added source, and it can drop the layers
// that sit on it, so this callback has to survive being handed a map that already has some of
// what it is about to add. Layers first: a source with layers on it cannot be removed.
for (const id of ['selected', 'points', 'cluster-count', 'clusters']) {
  if (map.getLayer(id)) map.removeLayer(id)
}
if (map.getSource('sales')) map.removeSource('sales')
```

Do not switch to `setStyle(url, { diff: false })` as the primary fix. The guard is the fix; a
full style reload would refetch every tile on a theme toggle and is a behaviour change the plan
did not ask for.

#### R1.3 Give the cluster labels a font the tile host serves, P2

The `cluster-count` symbol layer (line 373) sets no `layout['text-font']`, so MapLibre requests
the style-spec default stack. OpenFreeMap does not host it:
`GET /fonts/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf` returns 404, verified
by curl and reproduced in the browser on every load of the route. Both the `positron` and `dark`
styles OpenFreeMap serves use `["Noto Sans Regular"]`, and
`GET /fonts/Noto%20Sans%20Regular/0-255.pbf` returns 200.

In the `cluster-count` layer's `layout`, add as the first entry:

```ts
// OpenFreeMap's positron and dark styles both ship Noto Sans and nothing else. Leaving this
// unset makes MapLibre ask for the spec default, "Open Sans Regular,Arial Unicode MS Regular",
// which that host 404s on every load.
'text-font': ['Noto Sans Regular'],
```

#### R1.4 Tell the truth in the accessible summary and the canvas label, P2

Three separate falsehoods in `SalesMapReady`'s summary block (line 624) and
`updateCanvasA11y` (line 333), all rendered to assistive technology:

- While `points.json` is in flight, `filtered` is `EMPTY_FILTERED`, so the summary reads
  `Showing 0 sales, every property type, every month. Prices run from $0 to $0.` for the first
  second or two of every single visit.
- When the fetch fails, `PointsState`'s `'error'` branch is never read, so the same sentinel
  zeros are presented as fact with no indication anything went wrong.
- The final sentence, `The same figures are in the neighbourhood table below this map.`, is false
  whenever a group or month filter is active, and it directly contradicts
  `NeighborhoodTable.tsx`'s own context line, which says the table's counts do not change with
  the filter.

Add, at module scope next to `FALLBACK_SENTENCE`:

```ts
const POINTS_FAILURE_SENTENCE =
  'The sales file did not load, so the map has no dots. Every figure it shows is in the '
  + 'neighbourhood table below.'

const TABLE_SENTENCE =
  'The neighbourhood table below this map is not filtered: it covers every neighbourhood with '
  + 'at least four sales in the snapshot.'

const CLUSTER_SENTENCE =
  'Dots merge into clusters as you zoom out, and a cluster takes the mean price of the sales '
  + 'inside it.'
```

Replace the `summaryText` assignment with a branch on the load state, in this order:

```ts
const monthDescription = monthFilter === null ? 'every month' : `${MONTH_NAMES[monthFilter]} only`

let summaryText: string
if (pointsState.status === 'error') {
  summaryText = `${POINTS_FAILURE_SENTENCE} ${TABLE_SENTENCE}`
} else if (pointsState.status === 'loading') {
  summaryText = `Loading the 2025 sales file. ${TABLE_SENTENCE}`
} else if (filtered.count === 0) {
  summaryText =
    `No sales match this filter: ${GROUP_DESCRIPTION[group]}, ${monthDescription}. `
    + `${TABLE_SENTENCE}`
} else {
  summaryText =
    `Showing ${formatCount(filtered.count)} sales, ${GROUP_DESCRIPTION[group]}, `
    + `${monthDescription}. Prices run from ${formatUSD(filtered.minPrice)} to `
    + `${formatUSD(filtered.maxPrice)}. ${CLUSTER_SENTENCE} ${TABLE_SENTENCE}`
}
```

Render the failure notice inside the well, as a sibling **after** the container div so it stacks
above the canvas:

```tsx
{pointsState.status === 'error' && (
  <p className="absolute inset-x-4 top-4 z-10 rounded-(--radius-sm) border border-border-strong bg-surface-1 px-3 py-2 text-small text-text-secondary">
    {POINTS_FAILURE_SENTENCE}
  </p>
)}
```

Give `updateCanvasA11y` the same three states. Add a status ref beside the existing `themeRef`
and `reducedRef` sync effects, so it is written before the filter effect that calls the callback:

```ts
const pointsStatusRef = useRef<PointsState['status']>('loading')
useEffect(() => {
  pointsStatusRef.current = pointsState.status
}, [pointsState.status])
```

and inside the callback:

```ts
const status = pointsStatusRef.current
const label =
  status === 'ready'
    ? `Map of ${formatCount(filteredRef.current.count)} recorded 2025 home sales across New York City, coloured by sale price.`
    : status === 'error'
      ? 'Map of New York City home sales. The sales file did not load, so the map has no dots.'
      : 'Map of New York City home sales. The sales file is still loading.'
canvas.setAttribute('aria-label', label)
canvas.setAttribute('aria-describedby', 'sales-map-summary')
```

Keep the callback's `[]` dependency array; it reads refs on purpose.

Finally, in `NeighborhoodTable.tsx`, the `contextLine` says the table "always covers every
residential sale in the snapshot". `NEIGHBORHOODS_2025` drops neighbourhoods below a four-sale
floor, as its own generated header and the page's `dataStatement` both state. Replace the second
and third lines of that template so the two statements agree:

```ts
const contextLine =
  `The map above is currently showing ${GROUP_LABEL[group]}${month === null ? '' : `, ${MONTH_NAMES[month]} only`}. `
  + 'The table below is not filtered: it covers every neighbourhood with at least four sales in '
  + 'the snapshot, so its counts do not change with that filter.'
```

#### R1.5 The fallback state makes no points.json fetch, P3

The plan's fallback contract covers two paths, the WebGL probe returning false and
`new maplibregl.Map(...)` throwing, and says that state fetches "no `points.json` and no shard".
The probe path is correct today: `SalesMap` returns `MapUnsupportedFigure` without mounting
`SalesMapReady`. The constructor-throw path is not: `useSalesPoints()` is called at line 312 and
its effect runs before the mount effect that constructs the map, so the ~230 KB gzipped request
is already in flight when `MapUnsupportedFigure` renders.

1. In `useSalesPoints.ts`, change the signature to `useSalesPoints(enabled: boolean = true)`, add
   `if (!enabled) return` as the first statement inside the effect body, and add `enabled` to the
   dependency array. Update the doc comment to say why, in the words of the contract above.
   Leave `useSaleDetail` alone: it is already gated behind a selection that cannot exist in the
   fallback state.
2. In `SalesMap.tsx`, add `const [mapCreated, setMapCreated] = useState(false)` and call
   `setMapCreated(true)` in the mount effect immediately after the constructor returns, next to
   `mapRef.current = map`. Call the hook as `useSalesPoints(mapCreated)`.

This costs one React commit of latency on the happy path, which criterion 27 bounds. Do not
attempt to gate on `!mapFailed`: `mapFailed` is set inside an effect that runs after the hook's
own effect, so by the time it is true the request has already gone out.

**R1 acceptance:** criteria 1 through 8, 23, 24, 25, 26, 27, 29, 30, 31.

---

### R2 - The 2025 write-up stops contradicting its own model output

**Goal.** Every comparative claim in the 2025 page's prose is true against the generated modules
the page is required to source every number from.

**Files.** `content/projects/nyc-home-sales-2025.ts`. Nothing else.

#### R2.1 The ladder section, P1

Line 141 ends the `ladder` section's first paragraph with `an R² of 0.622 and a MAPE of 40.2%,
the largest single-model cut in the whole ladder.` `MODELS_2025` disproves it: the random forest's
own cut from the rung above is $21,853, the second smallest on the ladder, and the largest single
cut belongs to k-nearest neighbours at $127,660 (see the table in the Data section).

Replace the final clause and add one sentence, so the paragraph's last two sentences read exactly:

> The winner is a random forest, $377,558 test MAE, an R² of 0.622 and a MAPE of 40.2%, $267,753
> below the citywide-median floor. The largest single step on the ladder belongs to k-nearest
> neighbours, which took $127,660 off the Ridge rung on its own.

Keep the existing string-concatenation formatting and the typographic apostrophes already in the
file. Both new figures are `formatUSD` roundings of exact differences in `MODELS_2025`:
645,311.01 - 377,558.13 = 267,752.88 and 586,820.23 - 459,160.37 = 127,659.86.

#### R2.2 The winner section, P1

Line 157 says gross square feet's $569,623 is `more than the next two features combined.`
`IMPORTANCE_2025` disproves it: residential units ($305,723) plus borough Manhattan ($269,204) is
$574,927, which is larger. Change one clause so the sentence reads exactly:

> Gross square feet leads by a wide margin, $569,623 of added error when it is shuffled, nearly
> as much as the next two features combined.

Leave the rest of that paragraph, including the sentence that names residential units and
Manhattan next, untouched.

Do not touch any other section, any figure, any link, or `dataStatement`. Do not introduce an em
dash: `content/projects/registry.test.ts` fails on one.

**R2 acceptance:** criteria 9, 10, 11, 23, 24.

---

### R3 - The narrowing figure fits its well, and honours a manual stage press

**Goal.** At 375 px every stage of the bird narrowing figure renders inside its well with nothing
clipped, a stage the visitor picks stays picked, and the photograph's alt text reads as English.

**Files.** `components/projects/bird/SoftmaxRace.tsx`,
`components/projects/bird/BirdVisuals.tsx`. Nothing else.

#### R3.1 Fix the bar row's width arithmetic first, P1

`NarrowingRow`'s name span (line 63) is `w-[calc(100%-6rem)]`. Every other implementation of this
row on the site uses `7rem`: `ModelLadder.tsx:58`, `ModelLadder2025.tsx:62`,
`ImportanceBars.tsx:54`, `ResultsLadder.tsx:66`. `6rem` reserves room for the 96 px value column
but not for the `gap-x-3` between them, so at 375 px the name (197 px) plus the gap (12 px) plus
the value (96 px) is 305 px against 293 px of available width, the value wraps to its own line,
and each row renders on three lines at 56 px instead of two lines at 41 px.

Change `w-[calc(100%-6rem)]` to `w-[calc(100%-7rem)]`. Change nothing else on that span: the
`order-1`, `truncate`, `text-small text-text-primary` and `sm:w-32` classes stay as they are.

Do this before R3.2. It removes 120 px of the overflow on its own and it is what makes the height
below correct.

#### R3.2 Raise the well, in both places, P1

With R3.1 applied, I measured every stage of all eight species at 375 px on the built export. The
worst case is stage 1, at `.viz-well` `scrollHeight` 883 against `clientHeight` 778. The stack
needs 867 px of content box; the well currently offers 746 (780 minus 32 px of padding and 2 px of
border). Stages 0, 2 and 3 fit today and are unaffected.

Set the height to **920** in both places, which leaves about 35 px of slack for label and font
variation:

- `SoftmaxRace.tsx:184`: `well={{ height: 920, heightSm: 520 }}`
- `BirdVisuals.tsx:19`: `decision: { ..., well: { height: 920, heightSm: 520 } }`

`heightSm` stays 520. Measured at 768 px and 1280 px: 486 px of content in 518 px of well, no
overflow on any stage.

Both files must change in the same commit. `BirdVisuals.tsx`'s `CHROME.decision` is what
`FigureSkeleton` reserves before the chunk lands, and a mismatch between the two is a layout shift
the moment the real figure mounts.

After the change, re-measure and report the actual worst-case `scrollHeight` at 375 px across all
eight species. The well's `clientHeight` at that height is 918 px (920 minus the 2 px border), so
any species whose stage 1 reports a `scrollHeight` above 918 means the number goes up again in
both files rather than shipping a clip.

#### R3.3 A manual stage press cancels the autoplay, P3

The autoplay effect (lines 129 to 146) schedules five timeouts and clears them only in its own
cleanup, which runs on unmount and on a change to `entered`, `reduced` or `speciesId`. Pressing
the stepper does none of those, so a visitor who selects `Top 8` at t = 500 ms is forced to stage
2 at 900 ms and stage 3 at 1,350 ms, then watches a row pulse they did not ask for.

1. Add `const timersRef = useRef<number[]>([])` and:

```ts
const clearStageTimers = useCallback(() => {
  timersRef.current.forEach((id) => window.clearTimeout(id))
  timersRef.current = []
}, [])
```

2. In the autoplay effect, assign the five ids to `timersRef.current` instead of a local, and
   return `clearStageTimers` as the cleanup.
3. Change the stepper's change handler (line 148) to cancel first:

```ts
const stageStepper = useRovingRadioGroup(STAGE_VALUES, String(stage), (next) => {
  // A press wins over the entry autoplay. Without this the pending stage timers fire on top of
  // the visitor's own choice half a second later.
  clearStageTimers()
  setPulsed(false)
  setStage(Number(next) as Stage)
})
```

Do not touch the timings, the `DURATION.sequence` pulse, or the effect's dependency array. Picking
a different species must still replay the sequence, which it does through the `speciesId`
dependency.

#### R3.4 Alt text, P3

Line 218 is `alt={`Photograph of a ${selectedBird.common}.`}`, which produces
`Photograph of a American robin.` for three of the eight species and mid-sentence capitals like
`Photograph of a Bald eagle` for the rest. Both are announced on every species switch.

Replace with `alt={selectedBird.common}`. This matches how `BirdGallery` names its thumbnails, and
the figure's caption, the visible species line under the photograph and the attribution line all
already say what the image is.

**R3 acceptance:** criteria 12 through 18, 23, 24, 28, 29.

---

### R4 - The mechanisms figure prints what its contract says it prints

**Goal.** A visitor on the `Linear` mechanism can see the two slopes and knows which axis is
which, without opening the disclosure.

**Files.** `components/projects/nyc2025/ModelMechanisms.tsx`. Nothing else.

#### R4.1 Print the two slopes, P2

The component contract says the `linear` mechanism draws "the least-squares line, and a second
flatter line for a heavily penalised fit, **with the two slopes printed**". They are not printed
anywhere, on the figure or in its table, so the whole idea the figure exists to show, that the
penalty pulls the slope toward zero, is carried by line style alone.

Add a row directly beneath the `low / feature / high` axis row, rendered only for `linear`, in the
same slot the `boosting` stage row already occupies:

```tsx
{mechanism === 'linear' && (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-tick text-text-tertiary">
    <span className="flex items-center gap-1.5">
      <svg width="18" height="2" aria-hidden="true">
        <line x1="0" y1="1" x2="18" y2="1" stroke="var(--text-primary)" strokeWidth="2" />
      </svg>
      Least squares, slope {OLS.slope.toFixed(2)}
    </span>
    <span className="flex items-center gap-1.5">
      <svg width="18" height="2" aria-hidden="true">
        <line x1="0" y1="1" x2="18" y2="1" stroke="var(--viz-cat-6)" strokeWidth="2" strokeDasharray="3 2" />
      </svg>
      Penalised, slope {PENALISED.slope.toFixed(2)}, the dashed line
    </span>
  </div>
)}
```

Read both numbers from the existing `OLS` and `PENALISED` constants through `.toFixed(2)`, never
as literals, so a printed number cannot drift from the line that is drawn. They render as `0.62`
and `0.22`.

Add the same two values to the disclosure so the text equivalent carries them. In the `table`
prop, beneath the existing `{IDEA[mechanism]}` paragraph:

```tsx
{mechanism === 'linear' && (
  <p className="text-small text-text-secondary">
    Least squares slope {OLS.slope.toFixed(2)}, penalised slope {PENALISED.slope.toFixed(2)}.
    Both fitted over the 60 synthetic points above, with no unit attached.
  </p>
)}
```

#### R4.2 Label the y axis, P2

The contract says "x is labelled `feature` with `low` and `high` at the ends, y is labelled
`target`". Only the x row exists; `target` appears nowhere on the visual. Restructure the plot
area so the y label sits to the left of the plot and the x row stays aligned with the plot rather
than being offset by the label's width:

```tsx
<div ref={ref} className="flex h-full flex-col gap-2">
  <div className="flex min-h-0 flex-1 gap-1.5">
    <span className="[writing-mode:vertical-rl] rotate-180 self-center text-tick text-text-tertiary">
      target
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <svg viewBox="-4 -4 108 116" className="w-full flex-1" role="presentation" aria-hidden="true">
        {/* unchanged */}
      </svg>
      <div className="flex items-end justify-between text-tick text-text-tertiary">
        <span>low</span>
        <span>feature</span>
        <span>high</span>
      </div>
    </div>
  </div>
  {/* the linear slope row from R4.1, then the existing boosting stage row */}
</div>
```

Do not change the `viewBox`, any coordinate array, any stroke, the scatter's stagger, the
cross-fade, or the `boosting` stage row. The `svg` stays `role="presentation"` and
`aria-hidden="true"`: the disclosure table is its equivalent and R4.1 puts the slopes there.

Re-measure the well at 375, 768 and 1280 px for all four mechanisms after this. The `svg` is
`flex-1` and absorbs both additions, as the existing `boosting` row already demonstrates (it takes
the plot from 192 px to 133 px at 375 px with no overflow).

**R4 acceptance:** criteria 19, 20, 23, 24, 29, 32.

---

### R5 - The bird build script stops writing a file nothing reads

**Goal.** Re-running the documented asset regeneration path does not resurrect
`public/projects/bird-species-cnn/softmax-top8.json`.

**Files.** `scripts/build-bird-assets.py`. Nothing else.

The committed file is deleted and every app-level reference is gone, but the script still writes
it, so criterion 53's "nothing references it" is unmet and a regeneration leaves an untracked
orphan on disk. The featured robin is also a gallery species, so `build_gallery_species` already
writes its full sixteen-class softmax; the top-8 write is pure duplication.

1. Delete lines 452 to 464, the whole `# --- softmax-top8.json ---` block through the
   `Top-8 softmax predictions:` print loop.
2. Line 413: change `*block_activations, softmax = probe_model.predict(batch, verbose=0)` to
   `*block_activations, _ = probe_model.predict(batch, verbose=0)`. Leave `probe_model`'s output
   list in `main()` alone; the shape of the prediction stays the same.
3. Line 407: drop the now-unused `decode_predictions` from the import, leaving
   `from tensorflow.keras.applications.vgg16 import preprocess_input`. The import inside
   `build_gallery_species` (line 476) still needs it and is untouched.
4. Line 405, the docstring: change `and writes the five sprite sheets, activations.json and
   softmax-top8.json.` to `and writes the five sprite sheets and activations.json.`
5. Rename `build_activations_and_softmax` to `build_activations` at its definition (line 403) and
   at its single call site (line 604). Leave the parameter list as it is.

Do not run the script. It needs a 528 MB weights download and a TensorFlow environment, and no
asset changes here.

**R5 acceptance:** criteria 21, 22, 23, 24.
