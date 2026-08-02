# NYC sales map v2, and the bird gallery

Extends `docs/plans/foundation-and-design-language.md` and
`docs/plans/remediation-pass-1-project-pages.md`. Where this document contradicts either of
them, this one wins, and the reason is stated. Both existing project pages are live and
working; nothing here is a rewrite of them.

Every external fact in this plan was verified against the live source during planning, and the
verification command is quoted inline so the developer and the reviewer can re-run it rather
than take it on faith.

## Goal

After this ships a visitor can open `/projects/nyc-home-sales-2025/` and see the real New York
City street map with a dot on every one of roughly 44,800 homes that actually changed hands in
2025, clustered so the page stays responsive, coloured by sale price, filterable by property
type and month, and clickable down to a single sale with its address, neighbourhood, exact
recorded price, date, building type and floor area, plus an outbound link that looks that address
up on Zillow. The same sale is reachable with the keyboard through the neighbourhood table, so
the readout is not a pointer-only feature. They can then
read four short explainers of how a regularised linear model, a nearest-neighbour model, a
random forest and a boosted-tree ensemble each actually work, watch each mechanism drawn on the
same synthetic scatter, and see the real error ladder those four families produced when trained
on that same 2025 data, ending with a reasoned account of which one won and what it leaned on.
The 2019 Zillow analysis stays exactly where it is, one click away, honestly labelled as the
earlier version. On `/projects/bird-species-cnn/` the visitor can pick any of eight
public-domain bird photographs and watch the network's real top-16 candidate list narrow to
eight, then three, then the single species it committed to, with every probability at every
stage a real number from a real forward pass.

---

## Assumptions

Sixteen decisions the brief did not settle, or settled against evidence I then found. Each one
changes the build.

1. **The data source is NYC Open Data `w2pb-icbu`, not `usep-8jbt` plus a PLUTO join.** This
   deviates from the brief, deliberately, and here is the evidence. The brief specified NYC
   Citywide Rolling Calendar Sales (`usep-8jbt`) joined to PLUTO (`64uk-42ks`) on
   Borough/Block/Lot for coordinates. Both datasets are real and the plan would work. But the
   Department of Finance publishes a sibling dataset, **NYC Citywide Annualized Calendar Sales
   Update (`w2pb-icbu`)**, from the same agency, which already carries `latitude`, `longitude`
   and `bbl` on every row and covers whole calendar years. Verified this session:

   ```bash
   # 845,607 rows, 2016-01-01 through 2025-12-31, one row per recorded sale
   curl -sS "https://data.cityofnewyork.us/resource/w2pb-icbu.json?\$limit=1"
   # calendar 2025 alone: 84,693 rows
   curl -sSG "https://data.cityofnewyork.us/resource/w2pb-icbu.json" \
     --data-urlencode '$select=count(1) as rows' \
     --data-urlencode "\$where=sale_date>='2025-01-01'"
   ```

   Three reasons this wins. It gives **calendar 2025 exactly**, which is what Pizon asked for,
   where the rolling file's window has already moved on (`usep-8jbt` today spans 2025-07-01 to
   2026-06-30, verified by the same `min`/`max` query, so a "2025 data" page built on it would
   be half 2026 by the time it shipped). It removes the PLUTO join entirely, and with it a
   500 MB download, a BBL construction step and an unknown join-miss rate. And its own
   geocoding coverage is 98.0% (82,974 of 84,693 rows carry a usable latitude), which is better
   than a hand-rolled join would plausibly achieve. **PLUTO is retained only as a documented
   fallback** in the generator's header comment: if a future snapshot's geocoding coverage drops
   below 90%, join the gap on BBL to `64uk-42ks`, which does carry `latitude` and `longitude`
   per lot (verified: its record keys include `bbl`, `borough`, `block`, `lot`, `latitude`,
   `longitude`). Nothing about the brief's legal reasoning is revisited; this is the same
   portal, the same agency, a better table.

2. **Zillow is a hyperlink and nothing else.** No scraping, no API, no iframe, no embed, no
   screenshot, no cached listing data, no Zestimate, no image hotlink. The map's detail panel
   renders one anchor per selected sale, `target="_blank" rel="noopener noreferrer"`, whose
   href is `https://www.zillow.com/homes/{encoded}_rb/` where `{encoded}` is
   `encodeURIComponent("{address}, NY {zip}")` built from the NYC Department of Finance's own
   public address and ZIP fields. That is an outbound link to a public search page, the same
   thing a visitor typing the address into Zillow's search box would produce. The link text is
   **"Look up this address on Zillow"**, not "view the listing", because a 2025 recorded sale
   usually has no active listing and promising one would be false. Acceptance criteria 7, 8 and 9 make
   the no-embed rule grep-checkable.

3. **A basemap is a scoped exception to two existing rules, and both exceptions are named
   here.** The foundation plan's Out of scope says "No basemap, no tiles, no GeoJSON, no mapping
   library" and "No analytics, no cookie banner, no third-party scripts of any kind." Pizon
   asked for the actual New York City map, so the first rule is lifted **for this route only**:
   MapLibre GL JS with OpenFreeMap tiles. The second rule is not lifted, because tiles are not
   scripts: OpenFreeMap serves vector tiles, fonts and sprites over plain HTTPS with **no API
   key, no signup, no cookie, no user database and no request limit** (verified at
   `openfreemap.org`), so nothing executes and nothing tracks. It is still a third-party network
   dependency, and the page says so in the figure's source line. Attribution is mandatory and
   is rendered: `OpenFreeMap, OpenMapTiles, data from OpenStreetMap`.

4. **Style URLs, verified.** Light theme uses `https://tiles.openfreemap.org/styles/positron`,
   dark theme uses `https://tiles.openfreemap.org/styles/dark`. Both were fetched this session
   and both return valid MapLibre style JSON pointing at
   `https://tiles.openfreemap.org/planet` for vectors,
   `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf` for glyphs and
   `https://tiles.openfreemap.org/sprites/ofm_f384/ofm` for sprites. Do not substitute a
   Mapbox, MapTiler, Stadia or CARTO style: all four require a key or a paid tier at some usage
   level, and this site has neither.

5. **URL structure: the new page takes a new slug and the old page does not move.** New route
   `/projects/nyc-home-sales-2025/`. The 2019 analysis stays at
   `/projects/nyc-housing-prices/` exactly where it is, so no existing inbound link breaks and
   no redirect is needed, which matters because a static export cannot serve one. The two pages
   point at each other through a new typed `related` field on `ProjectRecord`, rendered by
   `ProjectHero`. Registry order becomes `[nycHomeSales2025, nycHousingPrices, birdSpeciesCnn]`,
   so the new page leads the index, the landing page and the "Next demonstration" cycle.

6. **Point set: residential sales only, $100,000 to $10,000,000, geocoded.** Measured against
   the real 2025 slice: 84,693 rows in, 82,974 geocoded, 49,953 after the price bracket, and
   **44,784** after restricting to residential building-class categories
   (`01, 02, 03, 04, 09, 10, 12, 13, 15, 17`). The price bracket is the same one Pizon used in
   the 2019 capstone, which is what makes this "the same methodology on new data" rather than a
   different exercise. The $0 and near-$0 rows the bracket removes are deed transfers between
   related parties, not sales; the page says that in one sentence rather than silently dropping
   30,000 rows.

7. **No metric, no accuracy and no model result appears anywhere in this plan.** They do not
   exist yet. `scripts/train-nyc-sales-2025.py` computes them, writes them into
   `content/data/nyc-2025-models.ts`, and the developer writes the page's prose from the
   script's printed output. Sanity bands are given in the Data section so a wrong pipeline is
   caught, and a vitest file ties every figure quoted in the record back to the generated
   module. Inventing a plausible MAE here would be exactly the fabrication `CLAUDE.md` forbids.

8. **The model shortlist is scikit-learn only, with XGBoost optional.** Required rungs: the
   citywide median baseline, Ridge, k-nearest-neighbours, RandomForestRegressor,
   HistGradientBoostingRegressor on the raw target, and HistGradientBoostingRegressor on the
   log target. That is four genuinely different model families plus the baseline plus the
   target-transform rung, all from `numpy` + `pandas` + `scikit-learn`, which install from
   wheels on every platform with no native toolchain. XGBoost needs `libomp` on macOS and is
   therefore **optional**: if `import xgboost` succeeds the script adds a seventh rung, and if
   it does not the ladder ships with six and nothing on the page mentions XGBoost. The four
   mechanism explainers are keyed to families, not to library names, so the page copy does not
   change either way.

9. **The narrowing figure uses the real final softmax, filtered, and says so.** A single
   forward pass produces spatial feature maps at intermediate layers, not class scores, so
   there is no honest "top classes after block 2". The figure therefore shows the real top-16
   ImageNet classes from one real forward pass and reveals them in four stages, 16 to 8 to 3 to
   1, dropping the lowest-scoring classes at each step. Every number at every stage is the same
   real softmax output, filtered, never a synthesised intermediate belief, and the figure prints
   that sentence in its own caption rather than leaving it to be inferred. The architecturally
   literal alternative, training auxiliary linear probes on block outputs to produce genuinely
   computed coarse groupings, is a real and better answer to "what does the network know at
   layer k", and it is **not built here**: it needs a labelled training set per probe, a
   training run per block and a defensible story about what the probe's classes mean. It is
   listed as open question 10.

10. **The gallery drives the decision figure and nothing else.** `PixelMatrix`,
    `ConvolutionSweep`, `LayerPyramid`, `ActivationStrip`, `TransferDiagram` and `ResultsLadder`
    are **not modified** and stay keyed to the featured photograph, the American robin already
    shipped. Two reasons. Activation sprite sheets for eight birds across five blocks would add
    about 420 KB of committed assets to prove a point that does not change with the subject, and
    every one of those six components carries a fix from remediation pass R4 that a rewrite
    could quietly undo. The captions on the pixel, convolution and depth figures already name
    the source photo; that stays true. Task 6's manifest contains no file that R4 touched except
    `SoftmaxRace.tsx` and `BirdVisuals.tsx`, and the specific R4 behaviours to preserve in each
    are listed in the task notes.

11. **Eight bird species, all verified public domain, all ImageNet-1k classes.** Listed with
    exact Commons URLs, licences and photographers in the Data section. Every one was confirmed
    this session through the Commons API with `extmetadata.LicenseShortName` reading
    `Public domain`. Seven of the eight are U.S. Fish and Wildlife Service works, which is the
    same sourcing standard the shipped robin already meets.

12. **The bird gallery ships small assets, not a second copy of the pipeline.** Per species:
    a 96 x 96 thumbnail, a 320 x 320 photograph and a top-16 softmax JSON, about 30 KB total.
    The featured robin keeps its existing 448 px `bird-source.webp`, its `luminance-28.json` and
    its five activation sprites unchanged.

13. **Both new pipelines are offline, run once, never in CI.** `scripts/build-nyc-sales-2025.mjs`
    (Node) and `scripts/train-nyc-sales-2025.py` (Python) follow the established pattern from
    `scripts/build-nyc-price-surface.mjs` and `scripts/build-bird-assets.py`: a documented header,
    an input path argument, committed output, and no wiring into `npm run build` or
    `.github/workflows/deploy.yml`. The downloaded CSV lands in a gitignored `.data/` directory
    and is never committed.

14. **The 2025 snapshot is dated on the page.** `w2pb-icbu` is refreshed and revised, so a rerun
    in six months will produce slightly different aggregates. The generator therefore writes a
    `SNAPSHOT_DATE` and the SHA-256 of its input file into the generated module, the page prints
    the snapshot date, and the acceptance criteria check internal consistency and sanity bands
    rather than pinning my measured values as required output.

15. **No React map wrapper and no separate clustering library.** `maplibre-gl` is used directly
    from a `'use client'` module behind `ssr: false`. MapLibre's GeoJSON source implements
    clustering with Supercluster internally, so `cluster: true` is the whole clustering
    dependency. `react-map-gl` adds a wrapper, a peer-dependency matrix and no capability this
    page needs.

    **Install `maplibre-gl@^5`, never `latest`.** MapLibre 6 is published as of this writing, and
    every API note and every byte measurement in this plan was taken against 5.24.0: the
    `getClusterExpansionZoom` promise, the `cooperativeGestures` option, the canvas ARIA
    attributes, the WebGL2-then-WebGL context probe, and the 274 KB gzipped bundle. Moving to 6
    is a separate decision with its own measurements and its own review.

16. **The point payload carries the exact recorded sale price.** The obvious byte saving here is
    to quantise price to $100 with a `priceUnit` multiplier. Do not. Measured against the real
    2025 slice, **4,852 of the 44,784 surviving sales, 10.8%, are not a multiple of $100**
    (examples: 1,798,230, 513,035, 999,999, 380,250, 305,113), so the detail panel would have
    printed a rounded number where the page says "sale price". That is a fabricated figure by
    the standard `CLAUDE.md` sets, on a page whose whole claim is that these are the city's own
    recorded numbers. The exact price ships instead. Measured cost, same points, same encoding:
    `points.json` goes from 793,369 bytes on disk and 220,296 gzipped to **882,827 on disk and
    230,172 gzipped**, an extra 9.6 KB over the wire, inside the budget in criterion 35.
    `priceUnit` is gone from the payload and from the decoder.

---

## Copy and voice

Binding on every string in this plan that appears inside a code block, a quoted UI string or a
table cell, and on every string the developer writes:

- **No em dashes.** Colon, comma, full stop, or rewrite.
- No throat-clearing, no padded triplets, no meta-commentary, no "in this section we".
- No reference anywhere a visitor or a future maintainer could read to an AI assistant, an LLM,
  a model name or the tooling that built this site: source, comments, README, commit messages.
- Numbers are stated, never softened. "$1,150,000 median" not "strong prices".
- Every user-visible string introduced by this plan is written out verbatim below. Do not
  improvise new copy. Where a string depends on a generated number, the plan gives the sentence
  with a named placeholder and the module constant it comes from.

---

## File manifest

Nothing outside this list. If a fix seems to need another file, stop and say so.

### Task 1 - `project-relation-link`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `content/projects/types.ts` | Edit | Add `ProjectRelation` and the optional `related` field on `ProjectRecord`. |
| `components/project/ProjectHero.tsx` | Edit | Render the relation link under the tagline. |

### Task 2 - `nyc-2025-map-data`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `scripts/build-nyc-sales-2025.mjs` | New | Downloads or reads the 2025 DOF sales slice, filters, aggregates, writes the map payload, the detail shards and the two data modules. Run manually. |
| `.gitignore` | Edit | Add `/.data` so the downloaded CSV never lands in the repository. |
| `content/data/nyc-2025-sales.ts` | New (generated) | Snapshot constants, filter thresholds, price breaks, borough aggregates. |
| `content/data/nyc-2025-neighborhoods.ts` | New (generated) | Per-neighbourhood aggregates, the map's non-visual equivalent. |
| `public/projects/nyc-home-sales-2025/points.json` | New (generated) | Column-major delta-encoded point payload. |
| `public/projects/nyc-home-sales-2025/detail/manhattan.json` | New (generated) | Per-sale detail shard. |
| `public/projects/nyc-home-sales-2025/detail/bronx.json` | New (generated) | Per-sale detail shard. |
| `public/projects/nyc-home-sales-2025/detail/brooklyn.json` | New (generated) | Per-sale detail shard. |
| `public/projects/nyc-home-sales-2025/detail/queens.json` | New (generated) | Per-sale detail shard. |
| `public/projects/nyc-home-sales-2025/detail/staten-island.json` | New (generated) | Per-sale detail shard. |
| `content/data/nyc-2025-sales.test.ts` | New | Internal-consistency and sanity-band assertions over the two generated modules. |

### Task 3 - `nyc-2025-model-ladder`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `scripts/train-nyc-sales-2025.py` | New | Trains the ladder on the same CSV, computes test metrics and permutation importance, writes the model module. Run manually. |
| `content/data/nyc-2025-models.ts` | New (generated) | The real ladder and the real importance table. |
| `content/data/nyc-2025-models.test.ts` | New | Shape, ordering and sanity-band assertions over the generated module. |

### Task 4 - `nyc-2025-page`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `package.json` | Edit | Add `maplibre-gl@^5`. No other runtime dependency. |
| `package-lock.json` | Edit | The lockfile `npm install maplibre-gl@^5` writes. Listed because it is a real diff, and no other task touches it. |
| `content/projects/nyc-home-sales-2025.ts` | New | The write-up record. `status: 'live'`, `related` pointing back at the 2019 page. |
| `content/projects/nyc-housing-prices.ts` | Edit | Add `related` pointing forward. No other change. |
| `content/projects/index.ts` | Edit | Register the new record first. |
| `content/projects/registry.test.ts` | Edit | Three records, new order, allowed link hosts, relation resolution. |
| `app/projects/nyc-home-sales-2025/page.tsx` | New | Server Component: `metadata` plus one `ProjectLayout` call. |
| `components/projects/nyc2025/Nyc2025Visuals.tsx` | New | `'use client'`. Every `dynamic()` call for this route, the `CHROME` map, the 200 px gate. |
| `components/projects/nyc2025/SalesMap.tsx` | New | The centrepiece: MapLibre map, clustering, filters, legend, detail panel, table. |
| `components/projects/nyc2025/SalesDetailPanel.tsx` | New | The persistent readout for the selected sale, including the Zillow lookup link. |
| `components/projects/nyc2025/NeighborhoodTable.tsx` | New | Searchable, sortable, keyboard-operable neighbourhood table linked to the map. |
| `components/projects/nyc2025/useSalesPoints.ts` | New | Fetches and decodes `points.json` and the per-borough detail shards. |
| `components/projects/nyc2025/zillow-link.ts` | New | The one place a Zillow URL is constructed. |
| `components/projects/nyc2025/zillow-link.test.ts` | New | Encoding and shape assertions. |
| `components/projects/nyc2025/ModelMechanisms.tsx` | New | Four mechanisms on one synthetic scatter. |
| `components/projects/nyc2025/ModelLadder2025.tsx` | New | The real error ladder. |
| `components/projects/nyc2025/ImportanceBars.tsx` | New | Real permutation importance for the winning model. |

### Task 5 - `bird-gallery-assets`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `scripts/build-bird-assets.py` | Edit | Loop over the gallery: download, crop, verify with the model, emit per-species assets and the gallery module. |
| `content/data/bird-gallery.ts` | New (generated) | The eight species, their attributions and their expected ImageNet labels. |
| `public/projects/bird-species-cnn/gallery/<id>/thumb-96.webp` | New (generated) | Eight files, one per species. |
| `public/projects/bird-species-cnn/gallery/<id>/photo-320.webp` | New (generated) | Eight files, one per species. |
| `public/projects/bird-species-cnn/gallery/<id>/softmax.json` | New (generated) | Eight files, real top-16 softmax per species. |
| `content/data/bird-gallery.test.ts` | New | Attribution completeness and manifest integrity. |

### Task 6 - `bird-narrowing-figure`

| Path | New/Edit | Purpose |
| --- | --- | --- |
| `components/projects/bird/SoftmaxRace.tsx` | Edit | Becomes the gallery-driven staged narrowing figure. Filename kept on purpose. |
| `components/projects/bird/BirdGallery.tsx` | New | The eight-thumbnail picker. |
| `components/projects/bird/BirdVisuals.tsx` | Edit | `CHROME.decision` gains the new well size and title. |
| `content/projects/bird-species-cnn.ts` | Edit | `decision` section prose, `demonstration` sentence, `dataStatement`. |
| `public/projects/bird-species-cnn/softmax-top8.json` | Delete | Superseded by `gallery/american-robin/softmax.json`. |
| `README.md` | Edit | Document all three offline pipelines in one place. |

---

## Component contracts

### `content/projects/types.ts` (Task 1)

```ts
/**
 * A sibling project this record supersedes or continues. Rendered by ProjectHero as one link
 * under the tagline. `slug` must resolve in the registry; registry.test.ts asserts it.
 *
 * This exists because ProjectSectionBlock.body is plain text and cannot carry a link, and a
 * page that silently replaces an older analysis without pointing at it is not honest.
 */
export interface ProjectRelation {
  slug: string
  /** Link text, in Pizon's voice. States what the other page is, not that it is "related". */
  label: string
  /** 'earlier': the other page came first. 'later': the other page supersedes this one. */
  direction: 'earlier' | 'later'
}
```

`ProjectRecord` gains `related?: ProjectRelation`. Nothing else in the type changes, and the
integrity doc comment at the top of the file stays byte-identical.

### `components/project/ProjectHero.tsx` (Task 1)

One block added between the tagline paragraph and the "What moves on this page" block:

```tsx
{record.related && (
  <p className="text-small mt-3">
    <Link href={`/projects/${record.related.slug}/`} className="text-accent hover:text-accent-hover">
      {record.related.label} &rarr;
    </Link>
  </p>
)}
```

`next/link`, trailing slash, no `target`, no `rel`: this is an internal route. The eyebrow, the
`<h1>`, the tagline, the demonstration block and the headline figures are untouched, so the
other two project pages render byte-identically until their records gain a `related`.

**Does NOT own:** the relation's existence check (that is `registry.test.ts`), or any styling
beyond one line of link text.

### `components/projects/nyc2025/useSalesPoints.ts` (Task 4)

```ts
'use client'

export interface SalesPoints {
  /** Snapshot metadata, printed by the figure so the page dates its own data. */
  meta: {
    generatedAt: string      // 'YYYY-MM-DD'
    first: string            // earliest sale_date in the snapshot, 'YYYY-MM-DD'
    last: string             // latest sale_date, 'YYYY-MM-DD'
    n: number
  }
  /** Decoded WGS84 coordinates, length n. */
  lon: Float64Array
  lat: Float64Array
  /** Exact recorded sale price in whole dollars, length n. Never rounded: see assumption 16. */
  price: Uint32Array
  /** Index into CLASS_CODES, length n. */
  cls: Uint8Array
  /** 0..4, index into BOROUGHS, length n. */
  borough: Uint8Array
  /** 0..11, calendar month of the sale, length n. */
  month: Uint8Array
}

export interface SaleDetail {
  address: string
  apartment: string       // '' when the sale is a whole building or lot
  /**
   * Neighbourhood as the Department of Finance spells it, e.g. 'SUNNYSIDE'. Decoded from the
   * shard's own name table, not from NEIGHBORHOODS_2025: the aggregate module drops rows below
   * the four-sale floor, and every individual sale still has a neighbourhood.
   */
  neighborhood: string
  zip: string
  /** Day offset from January 1 of the snapshot year. Rendered as a date by the panel. */
  day: number
  /** Gross square feet. 0 means the Department of Finance recorded none. */
  grossSqFt: number
  /** Year built. 0 means not recorded. */
  yearBuilt: number
}

export type PointsState =
  | { status: 'loading' }
  | { status: 'ready'; points: SalesPoints }
  | { status: 'error' }

/** Nothing selected, shard in flight, shard decoded, or shard request failed. */
export type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; detail: SaleDetail }
  | { status: 'error' }

/**
 * Fetches and decodes public/projects/nyc-home-sales-2025/points.json exactly once, through
 * withBasePath(), so a build under a subpath resolves it.
 */
export function useSalesPoints(): PointsState

/**
 * Fetches the detail shard for one borough on demand, through withBasePath(), and caches it for
 * the session. Returns 'loading' while the shard is in flight, so the caller renders its
 * reserved line box rather than a spinner, and 'error' when the request fails, so the panel can
 * never sit on the loading sentence forever.
 */
export function useSaleDetail(
  boroughIndex: number | null,
  globalIndex: number | null,
): DetailState
```

The decoder is the only non-obvious code in this module and its contract is exact:

```
y[0] = dy[0];            y[i] = y[i-1] + dy[i]
x[0] = dx[0];            x[i] = x[i-1] + dx[i]
lat[i] = origin.lat + y[i] / scale
lon[i] = origin.lon + x[i] / scale
price[i] = p[i]          // exact dollars: no unit, no multiplier, no rounding
```

Shards carry an ascending `index` array of global point indices; the hook builds one
`Map<number, number>` per shard on first decode, so a lookup is O(1) and no binary search is
needed.

**Does NOT own:** rendering, MapLibre, clustering, filtering or formatting.

### `components/projects/nyc2025/SalesMap.tsx` (Task 4)

```tsx
'use client'

export type PropertyGroup = 'all' | 'houses' | 'condos' | 'coops'

export interface SalesMapProps {
  /** Defaults to 'all'. Present so a future route can deep-link a filtered view. */
  initialGroup?: PropertyGroup
}
```

Owns: the `Figure` wrapper, the MapLibre instance and its lifecycle, the GeoJSON source and the
four layers, the focused-neighbourhood marker, the property-group radiogroup, the month
`<select>`, the `ScaleLegend`, the selection state, `SalesDetailPanel`, `NeighborhoodTable`, and
the `FigureTable` equivalent.

MapLibre configuration, exactly:

| Option | Value | Why |
| --- | --- | --- |
| `style` | `https://tiles.openfreemap.org/styles/positron` light, `.../dark` dark | Assumption 4 |
| `bounds` | `[[-74.28, 40.48], [-73.68, 40.93]]` with `padding: 24` | Starts fitted to the city, no fly-in |
| `maxBounds` | `[[-74.35, 40.44], [-73.60, 40.98]]` | A visitor cannot pan to Ohio and pull 400 tiles |
| `minZoom` / `maxZoom` | `9` / `17` | Bounds the tile cost at both ends |
| `attributionControl` | `{ compact: false }` | Attribution is mandatory and must be visible. See the note under this table |
| `cooperativeGestures` | `true` | Two-finger pan on touch, so the page still scrolls on a phone |
| `keyboard` | `true` | MapLibre's own arrow-key pan and +/- zoom stay available |
| `dragRotate`, `touchPitch` | `false` | A 2D price map has no use for pitch or bearing |

**Attribution needs no code.** The style's TileJSON at `https://tiles.openfreemap.org/planet`
already carries `OpenFreeMap`, `OpenMapTiles` and `Data from OpenStreetMap` as links, verified
this session:

```bash
curl -sS https://tiles.openfreemap.org/planet | python3 -c "import json,sys; print(json.load(sys.stdin)['attribution'])"
```

MapLibre's `AttributionControl` collects that from the source and renders it. Add no
`customAttribution`, suppress none of it, and do not hand-write the credit line somewhere else on
the page, which would double it.

Every unclustered feature carries exactly four properties and no others: `p`, the exact sale
price in dollars; `c`, the index into `CLASS_CODES`; `b`, the borough index; and `i`, the global
point index the `selected` layer and the detail shards both key on. No address, ZIP,
neighbourhood name or date goes onto a feature: those live in the shards and are fetched on
click. The property-group and month filters are applied while building the `FeatureCollection`,
not as layer filters, so a filtered-out sale is absent from the source rather than hidden by a
layer.

Source and layers:

```
source 'sales'      GeoJSON, cluster: true, clusterRadius: 60, clusterMaxZoom: 14,
                    clusterProperties: { priceSum: ['+', ['get', 'p']] }
layer  'clusters'   circle, filter ['has','point_count'], radius by point_count
                    steps 14 / 18 / 24 / 30 at 10 / 100 / 1000,
                    fill = ramp step of (priceSum / point_count), stroke 1px hairline literal
layer  'cluster-count'  symbol, text-field = abbreviated point_count, text-size 11,
                    text-color '#F6F6F4', text-halo-color '#0B0C0E', text-halo-width 1
layer  'points'     circle, filter ['!', ['has','point_count']], radius interpolated
                    3 at z11 to 6 at z16, fill = ramp step of ['get','p'], stroke 0.5 hairline
layer  'selected'   circle, filter ['all', ['!', ['has','point_count']],
                    ['==', ['get','i'], selectedIndex ?? -1]], radius +4,
                    fill transparent, stroke 2px ACCENT[theme]
```

**The focused-neighbourhood ring is a `maplibregl.Marker`, not a fifth layer.** When a table row
is focused or hovered, `SalesMap` places one marker at that row's centroid with a custom element:
a 24 px circle, `border: 2px solid var(--accent)`, transparent fill, `pointer-events: none`,
`aria-hidden="true"`. It is removed on blur. Three reasons over a layer: the layer count stays at
four, so criterion 23's theme-change assertion does not have to grow; a DOM marker survives
`setStyle`, so the theme dance does not have to re-add it; and `var(--accent)` resolves in DOM,
so it flips theme with no JavaScript. This is the same category of mark as the clicked sale's
ring, which is why criterion 49 lists them together.

Cluster colour is the **mean** of the sale prices inside the cluster, because MapLibre's
`clusterProperties` only supports reducible aggregations and a median is not one. The legend
caption and the map's visually hidden summary both say "mean", never "median". Individual dots
carry their own exact recorded price, unrounded, per assumption 16.

Three things that will otherwise be got wrong, stated so they are not:

1. **`setStyle` destroys custom sources and layers.** On a theme change, call `map.setStyle(url)`
   and re-add the source and all four layers inside a one-shot `map.once('styledata', ...)`
   handler. Do not try to keep them; do not recreate the `Map`.
2. **`getClusterExpansionZoom` returns a Promise in MapLibre 5.** Await it before `easeTo`.
3. **Every camera move takes an explicit duration.** `easeTo({ ..., duration: reduced ? 0 : 500 })`.
   Do not rely on any library-level reduced-motion flag; the site's own
   `usePrefersReducedMotion()` is the single source of truth for this, per the foundation plan.

WebGL absence is a first-class state, not a crash. **`maplibregl.supported()` does not exist in
MapLibre 5.** It is not in the published typings, so calling it fails `npm run typecheck`, which
is criterion 1. Probe directly instead, then wrap the constructor:

```ts
function hasWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
```

MapLibre 5 asks for `webgl2` and falls back to `webgl`, which is exactly what this probe mirrors
(verified in 5.24.0's dist). If the probe returns false, or `new maplibregl.Map(...)` throws,
render the well's fallback, which is the sentence `This map needs WebGL, which this browser has
turned off. Every figure it shows is in the neighbourhood table below.` plus the table, which is
rendered unconditionally anyway.

In that fallback state the component renders the sentence and `NeighborhoodTable` and nothing
else: no `SalesDetailPanel`, no `points.json` fetch and no shard fetch, since every number the
table shows comes from `content/data/nyc-2025-neighborhoods.ts`. Row activation becomes a no-op
beyond moving focus. Every handler that touches the map instance must therefore tolerate it being
null, and there is exactly one place that can be true.

**Does NOT own:** the decode (that is `useSalesPoints`), the Zillow URL (that is `zillow-link.ts`),
the detail panel's markup, or the neighbourhood table's sorting.

### `components/projects/nyc2025/SalesDetailPanel.tsx` (Task 4)

```tsx
export interface SalesDetailPanelProps {
  /** Null when nothing is selected. The panel is always rendered, so its box is reserved. */
  sale: {
    globalIndex: number
    /** Exact recorded price, straight out of points.json. Never rounded. */
    price: number
    boroughIndex: number
    classCode: string
    /** 0..11. Printed only in the error state, where the shard's exact date is unavailable. */
    month: number
  } | null
  /** From useSaleDetail. 'idle' when nothing is selected. */
  detail: DetailState
  /** From content/data/nyc-2025-sales.ts. */
  year: number
}
```

Renders a two-row grid inside a `--surface-1` panel with `--border-subtle`, `aria-live="polite"`,
**always mounted** so the shard resolving cannot append unreserved height (the R4.5 lesson).

Four states, one per `DetailState`, with verbatim copy:

| State | What it renders |
| --- | --- |
| `idle` | `Select a dot on the map, or a row in the table, to see one sale.` |
| `loading` | `Loading the address for this sale.` |
| `error` | `Could not load the address for this sale.` then, from `sale` alone, the borough, the building type and the month name |
| `ready` | The full readout below |

Ready state, in this order: address (and apartment when present), neighbourhood and borough,
sale price, sale date, building type, gross square feet or the string `not recorded`, year built
or `not recorded`, then the Zillow anchor.

Where each ready-state line comes from, so no line is left without a source:

| Line | Source |
| --- | --- |
| Address, apartment | `detail.address`, `detail.apartment` |
| Neighbourhood | `detail.neighborhood` |
| Borough | `BOROUGHS_2025[sale.boroughIndex].name` |
| Sale price | `formatUSD(sale.price)` |
| Sale date | `detail.day` added to January 1 of `year` |
| Building type | `CLASS_LABELS[sale.classCode]` |
| Gross square feet | `detail.grossSqFt`, or `not recorded` when it is 0 |
| Year built | `detail.yearBuilt`, or `not recorded` when it is 0 |
| Zillow anchor | `zillowSearchUrl(detail.address, detail.zip)`, rendered only when it is non-null |

Zillow anchor, verbatim: `Look up this address on Zillow`, followed by the visually hidden
suffix `(opens a Zillow search in a new tab)`.

**Does NOT own:** fetching, the map, or the URL construction.

### `components/projects/nyc2025/zillow-link.ts` (Task 4)

```ts
/**
 * Builds an outbound link to a Zillow *search* for a street address. This is the only place a
 * zillow.com URL is constructed on this site.
 *
 * What this is: a hyperlink to a public search page, built from the address and ZIP the New
 * York City Department of Finance publishes on its own open-data portal.
 *
 * What this is not, and must never become: an embed, an iframe, a fetch, a cached response, a
 * screenshot, or any storage of Zillow content. Zillow's terms forbid all of those. If a future
 * feature wants listing detail on the page, the answer is no.
 */
export function zillowSearchUrl(address: string, zip: string): string | null
```

Implementation is one line plus a guard: return
`` `https://www.zillow.com/homes/${encodeURIComponent(`${address.trim()}, NY ${zip.trim()}`)}_rb/` ``,
and return `null` when `address` is empty after trimming. The return type is `string | null`, not
`string`, and `SalesDetailPanel` renders the anchor only when the result is non-null, so an
address the Department of Finance left blank produces no link rather than a broken search.

### `components/projects/nyc2025/NeighborhoodTable.tsx` (Task 4)

```tsx
export interface NeighborhoodTableProps {
  /** From content/data/nyc-2025-neighborhoods.ts, pre-sorted by median descending. */
  rows: readonly NeighborhoodStat[]
  /** Applied by the parent so the table always describes what the map is showing. */
  group: PropertyGroup
  month: number | null
  /** neighborhoodKey(row), never a bare name. Null when nothing is focused. */
  focus: string | null
  onFocus: (key: string | null) => void
  /**
   * Flies the map to that neighbourhood's centroid AND selects the sale nearest that centroid,
   * which is the only keyboard path to the detail panel. See the note under this block.
   */
  onSelect: (row: NeighborhoodStat) => void
}

/**
 * Row identity, exported from this module and imported by SalesMap so the table and the map's
 * centroid ring can never disagree about which row is focused.
 *
 * A bare name is not unique. The 2026-08-01 snapshot has SUNNYSIDE in Queens and SUNNYSIDE in
 * Staten Island, both above the four-sale floor, with different medians and centroids 30 km
 * apart (verified against the live slice). The generator groups by (borough, name), so that
 * pair is unique by construction and this key is total.
 */
export function neighborhoodKey(row: NeighborhoodStat): string   // `${row.b}:${row.name}`
```

This is the map's non-visual equivalent and the keyboard path to everything the map encodes.
It is **not** a transcription of 44,784 dots, which would be unusable; it is the same data
aggregated to the 245 borough-and-neighbourhood rows the Department of Finance itself names,
which is the level at which the map's colour is actually readable.

Columns, left to right, and there are exactly these five:

| Header | Cell |
| --- | --- |
| `Neighbourhood` | `row.name` |
| `Borough` | `BOROUGHS_2025[row.b].name`. This column is not decoration: it is what tells two SUNNYSIDE rows apart |
| `Sales` | `formatCount(row.n)` |
| `Median` | `formatUSD(row.median)` |
| `Median $ / sq ft` | `formatUSD(row.perSqFt)` with `{row.perSqFtRows} sales` beneath it in `text-tick text-text-tertiary`, or the single word `not recorded` when `perSqFt` is null |

- A search `<input type="search">` labelled `Filter neighbourhoods`, filtering on a
  case-insensitive substring of the name.
- Column headers are `<button>`s inside `<th scope="col">` with `aria-sort`, sorting by name,
  borough, sales, median or median price per square foot. Rows whose `perSqFt` is null sort last
  in **both** directions, so a null never reads as a low value. 33 of the 245 rows are null in
  the measured snapshot.
- Shows the first 25 rows with a `Show all {rows.length} neighbourhoods` toggle, whose label
  prints the real count from `rows.length` rather than a number typed into the source.
- Every body row is a real `<tr>` with real `<td>` cells, `tabIndex={0}`, `aria-selected`, and
  `onMouseEnter` / `onMouseLeave` / `onFocus` / `onBlur` calling `onFocus(neighborhoodKey(row))`
  or `onFocus(null)`, exactly the shape R3.4 established in `BoroughTable`. `Enter` or `Space` on
  a focused row calls `onSelect(row)`. The React `key` is `neighborhoodKey(row)`.
- **`onSelect` also selects a sale, and that is not decoration.** A dot on a WebGL canvas cannot
  take focus, so without this the detail panel would be pointer-only, which the site's own rule
  against pointer-only interaction forbids. `SalesMap`'s handler flies to the centroid and then
  picks the point with the smallest squared distance to it **among the points currently passing
  the property-group and month filters**, a single scan over at most 44,784 points, about 1 ms.
  Ties break to the lower global index, so the same row always selects the same sale. The panel
  then fills exactly as it does after a click, which is what makes the empty state's promise of
  "or a row in the table" true.
- The focused row's neighbourhood is highlighted on the map by an accent ring on **one**
  centroid, the one belonging to the focused row's own borough. `SalesMap` resolves the key back
  to its row with `rows.find((r) => neighborhoodKey(r) === focus)`, so exactly one row can match.
  The selected row's background is `bg-accent-wash` with metadata in `--text-secondary`, never
  `--text-tertiary`.

**Does NOT own:** the map, the aggregation, or the filter state.

### `components/projects/nyc2025/ModelMechanisms.tsx` (Task 4)

```tsx
export type Mechanism = 'linear' | 'neighbours' | 'forest' | 'boosting'

export interface ModelMechanismsProps {
  initialMechanism?: Mechanism   // default 'linear'
}
```

One `Figure`, one synthetic scatter of 60 points, four mechanisms drawn over it, switched by a
`role="radiogroup"` using `useRovingRadioGroup`. Every coordinate, every fitted line and every
tree split is a hardcoded array in this module's own scope. No RNG at runtime, no seed, no
fitting in the browser, so every visitor and every screenshot sees the same figure.

The axes carry **no unit and no dollar sign**: x is labelled `feature` with `low` and `high` at
the ends, y is labelled `target`. Nothing in this figure can be misread as a measurement from
the 2025 dataset, which is the same rule `ImputationSpread` follows on the 2019 page.

| Mechanism | What is drawn | The idea it makes visible |
| --- | --- | --- |
| `linear` | The scatter, the least-squares line, and a second flatter line for a heavily penalised fit, with the two slopes printed | A straight line, and a penalty that pulls its slope toward zero |
| `neighbours` | A vertical cursor, the five nearest points ringed, a horizontal tick at their mean | The prediction is an average of the closest examples, so it is bumpy and cannot extrapolate |
| `forest` | Three faint step functions and their average as one solid step function | Each tree is a set of splits; averaging many of them smooths the steps out |
| `boosting` | A stepper across three stages: stage 1's step function, then stage 2 added, then stage 3, with the residual bars shrinking at each stage | Each new tree fits what the last one got wrong |

**Does NOT own:** any real metric. The real numbers live in the next figure.

### `components/projects/nyc2025/ModelLadder2025.tsx` (Task 4)

No props. Reads `MODELS_2025` from `content/data/nyc-2025-models.ts`, renders one horizontal bar
per rung ordered worst to best, x = test MAE in dollars, using the identical responsive row from
R3.5 (`w-[calc(100%-7rem)] truncate sm:w-64 lg:w-72`, value column, full-width bar track below
`sm`). Winning bar `--text-primary` and the printed word `best`; every other bar
`--text-tertiary`. Monochrome, for the reason the 2019 `ModelLadder` is monochrome: one metric,
one channel.

### `components/projects/nyc2025/ImportanceBars.tsx` (Task 4)

No props. Reads `IMPORTANCE_2025`. Twelve horizontal bars, x = mean increase in test MAE when
that feature is shuffled, in dollars. Top feature `--text-primary`, the rest `--text-tertiary`,
each bar printing its feature label at the start and its dollar value at the end, plus a
`+/- std` in the `FigureTable`. Same responsive row as above.

### `components/projects/bird/BirdGallery.tsx` (Task 6)

```tsx
'use client'

export interface BirdGalleryProps {
  /** Species id from content/data/bird-gallery.ts. */
  value: string
  onChange: (id: string) => void
  /** Called on pointerenter and focus so the next bird's softmax is already in cache. */
  onPrefetch?: (id: string) => void
}
```

A `role="radiogroup"` with `aria-label="Bird photograph"` containing eight `<button role="radio">`
elements, keyboard-driven by `useRovingRadioGroup` from `lib/roving-radio.ts`. Each button
contains a 96 x 96 `<img>` with `width={96}`, `height={96}`, a `withBasePath()` src and `alt=""`,
plus a visually hidden span carrying the species common name, so the accessible name is the bird
and not the filename. Selected state carries **three** channels: a 2 px `--accent` ring, full
opacity against 0.6 for the rest, and a printed check character `[x]` in the visually hidden
label reading `selected`. Below `sm` the strip scrolls horizontally with
`overflow-x: auto; scroll-snap-type: x mandatory`.

**Does NOT own:** the softmax data, the narrowing stages, or any `Figure` chrome.

### `components/projects/bird/SoftmaxRace.tsx` (Task 6, edited in place)

The filename does not change. Two behaviours from remediation pass R4 must survive the edit, and
one thing that is **not** in the file today must be added. Both lists are here so a rewrite
cannot lose the first silently or skip the second.

Must survive, both shipped today at `components/projects/bird/SoftmaxRace.tsx`:

- **R4.6**, the settle pulse releases: a second timeout 240 ms after the first sets `pulsed`
  back to `false`, and both are cleared in the effect's cleanup.
- **R4.6 second half**, the responsive row: name and value share line one below `sm`, the bar
  track takes a full-width line two, and from `sm` up the order resets to name, track, value.

Must be added, and it is new work, not preservation:

- Move the `useInViewOnce` ref onto a wrapper `<div>` that is rendered in the loading and error
  states as well as the ready state. Today the ref sits on the div inside the
  `asset.status === 'ready'` branch only. The component still works, because R1.1 rewrote the
  hook itself to a callback ref that re-attaches when the node mounts late, so this is belt and
  braces rather than a bug fix: it is the same change R4.3 made to `ActivationStrip.tsx`, and it
  makes the component correct on its own terms rather than dependent on the hook's internals.
  This figure now has more loading states than it did, one per species, so it earns the wrapper.

New props: none. New internal state: `speciesId` (default the featured robin), `stage` (0..3).

```tsx
type Stage = 0 | 1 | 2 | 3   // 16 candidates, 8, 3, the prediction
const STAGE_SIZE = [16, 8, 3, 1] as const
```

Layout: `flex-col` below `sm`, `sm:flex-row`. Left column, 40% at `sm` and up: the selected
`photo-320.webp` rendered at 240 px square with `width={320}` and `height={320}` attributes and a
CSS size of 240 px, so swapping species cannot shift the layout, its attribution line under it,
then `BirdGallery`. Right
column: the stage stepper, then the ladder for the current stage.

Stage rendering, which is what makes the narrowing legible rather than just shorter:

| Stage | Form | Content |
| --- | --- | --- |
| 0 | A two-column grid of 16 chips, name plus percentage, no bars | All 16 real classes |
| 1 | 8 rows, log-scaled bar, name at the start, percentage at the end | The top 8 of the same 16 |
| 2 | 3 rows, taller, same encoding, plus each row's share of the top 3 printed | The top 3 |
| 3 | One row rendered large: the class name at `--fs-h3`, the probability beneath it | The prediction |

**Bar length is log-scaled and the figure says so**, because the winner is typically above 99%
and rank 2 is typically below 0.5%: on a linear scale ranks 2 through 16 would all be invisible.
The exact percentage is printed on every row at every stage, so the log scale never hides a
value, and the `FigureTable` carries all 16 exact probabilities to four decimal places. Anything
below 0.01% prints as `<0.01%` with the exact value in the table.

**Does NOT own:** the gallery's keyboard behaviour, the asset fetch (that is `useBirdAsset`), or
any other figure on the page.

---

## Data

### The 2025 sales snapshot

Source, verbatim into the generator's header comment:

```
NYC Open Data, "NYC Citywide Annualized Calendar Sales Update", dataset id w2pb-icbu,
published by the New York City Department of Finance.
https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu

Download (about 16 MB, calendar 2025 only):
  curl -sSG "https://data.cityofnewyork.us/resource/w2pb-icbu.csv" \
    --data-urlencode '$select=sale_date,sale_price,borough,neighborhood,building_class_category,building_class_at_time_of,address,apartment_number,zip_code,residential_units,total_units,land_square_feet,gross_square_feet,year_built,latitude,longitude,bbl,nta' \
    --data-urlencode "\$where=sale_date>='2025-01-01'" \
    --data-urlencode '$limit=100000' \
    -o .data/nyc-sales-2025.csv
```

Field notes the generator must handle, every one of them observed in the real file:

- `borough` is `"1"` to `"5"` as text: 1 Manhattan, 2 Bronx, 3 Brooklyn, 4 Queens, 5 Staten Island.
- `land_square_feet` and `gross_square_feet` arrive with thousands separators (`"2,021"`). Strip
  commas before `Number()`. Do not assume a numeric type from the Socrata metadata.
- `gross_square_feet` is `0` for most condo and co-op rows. Zero means not recorded, not zero
  area. Never divide by it without a guard.
- `building_class_at_time_of` is the real field name. It is truncated in the API and is not a typo.
- `sale_price` of `0` is a deed transfer between related parties, not a sale.
- `apartment_number` is often empty.

Filter chain, in this order, with the generator printing the surviving count after each step:

```
1. sale_date within the target calendar year                 84,693
2. latitude and longitude present and non-zero               82,974
3. 100000 <= sale_price <= 10000000                          49,953
4. building_class_category in 01 02 03 04 09 10 12 13 15 17  44,784
```

Those four counts are planner-measured against the snapshot downloaded on 2026-08-01. They are
**reference values, not required output**: `w2pb-icbu` is revised, so a later snapshot will
differ. The sanity bands the generator enforces, and stops on, are in acceptance criterion 12.

### `content/data/nyc-2025-sales.ts` (generated)

```ts
export interface BoroughStat2025 {
  name: string
  /** Sales surviving the filter chain. */
  n: number
  median: number
  p25: number
  p75: number
  /** Median dollars per gross square foot, over the subset that records one. */
  medianPerSqFt: number
  /** How many rows that median is computed from. Printed on the page: it is small. */
  perSqFtRows: number
}

export const SNAPSHOT = {
  /** Date the CSV was downloaded. Printed on the page. */
  generatedAt: '2026-08-01',
  /** SHA-256 of the input CSV, so a rerun can be proven identical. */
  inputSha256: '...',
  year: 2025,
  first: '2025-01-02',
  last: '2025-12-31',
  rowsDownloaded: 84693,
  rowsGeocoded: 82974,
  rowsInPriceBracket: 49953,
  points: 44784,
} as const

export const PRICE_FILTER = { min: 100_000, max: 10_000_000 } as const
export const CLASS_CODES = ['01','02','03','04','09','10','12','13','15','17'] as const
export const CLASS_LABELS: Record<string, string>   // exactly the ten strings tabled below
export const CLASS_GROUPS = {
  houses: ['01','02','03'],
  condos: ['04','12','13','15'],
  coops:  ['09','10','17'],
} as const
export const BOROUGHS_2025: readonly BoroughStat2025[]
export const CITYWIDE_2025 = { median: 840_000, p25: 545_000, p75: 1_349_000 } as const
/** Septiles of the point price distribution: the six ramp breakpoints. */
export const PRICE_BREAKS: readonly number[]
```

Planner-measured reference values for the 2026-08-01 snapshot. The generator's output for the
same input must match these; a different snapshot may not, and that is expected:

| Borough | n | median | p25 | p75 | median $/sq ft | rows behind it |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Manhattan | 12,661 | 1,150,000 | 670,000 | 2,200,000 | 1,042 | 189 |
| Brooklyn | 10,978 | 995,000 | 660,000 | 1,650,000 | 588 | 5,469 |
| Queens | 13,935 | 720,000 | 425,000 | 995,000 | 564 | 7,779 |
| Staten Island | 3,998 | 710,000 | 550,000 | 883,750 | 469 | 3,440 |
| Bronx | 3,212 | 627,650 | 325,000 | 860,000 | 378 | 2,046 |
| **Citywide** | **44,784** | **840,000** | **545,000** | **1,349,000** | | |

`PRICE_BREAKS` measured: `[397495, 594054, 750000, 935000, 1240000, 1880308]`.

**Percentile convention, stated once and binding on both scripts.** Every median, quartile and
septile in this wave is a linear interpolation between the two nearest order statistics, which is
`numpy.percentile`'s default and `statistics.median`'s behaviour for an even count. The Node
generator must implement the same rule rather than picking a nearest-rank element, or its numbers
will drift from the Python script's by a few dollars and the page will quote two different
medians for the same data.

**`CLASS_LABELS`, verbatim.** The Department of Finance's own category text is shouted and
pluralised, which is not how anything else on this site reads. These ten strings are the rendered
labels, keyed by code, and the generator writes exactly them. Do not derive them with a
title-case-and-singularise transform, and do not invent an eleventh: the generator exits non-zero
if a surviving row carries a code outside this table.

| Code | Department of Finance category | Rendered label |
| --- | --- | --- |
| `01` | ONE FAMILY DWELLINGS | `One family dwelling` |
| `02` | TWO FAMILY DWELLINGS | `Two family dwelling` |
| `03` | THREE FAMILY DWELLINGS | `Three family dwelling` |
| `04` | TAX CLASS 1 CONDOS | `Tax class 1 condo` |
| `09` | COOPS - WALKUP APARTMENTS | `Co-op, walkup apartment` |
| `10` | COOPS - ELEVATOR APARTMENTS | `Co-op, elevator apartment` |
| `12` | CONDOS - WALKUP APARTMENTS | `Condo, walkup apartment` |
| `13` | CONDOS - ELEVATOR APARTMENTS | `Condo, elevator apartment` |
| `15` | CONDOS - 2-10 UNIT RESIDENTIAL | `Condo, 2 to 10 unit residential` |
| `17` | CONDO COOPS | `Condo co-op` |

All ten categories were confirmed present in the 2025 slice, with counts from 1,000 rows
(`12 CONDOS - WALKUP APARTMENTS`) to 18,316 (`01 ONE FAMILY DWELLINGS`), before the price and
geocoding filters.

**Manhattan's per-square-foot median rests on 189 rows out of 12,661**, because condo and co-op
sales do not record gross square feet. That is not a defect to hide: the page prints the row
count next to every per-square-foot figure, and the acceptance criteria require it.

### `content/data/nyc-2025-neighborhoods.ts` (generated)

```ts
export interface NeighborhoodStat {
  /**
   * As the Department of Finance spells it, e.g. 'UPPER WEST SIDE (79-96)'. NOT unique on its
   * own: see the note under this block. Rows are keyed by (b, name).
   */
  name: string
  /** 0..4 into BOROUGHS_2025. */
  b: number
  n: number
  median: number
  p25: number
  p75: number
  /** null when fewer than 4 rows record a gross square footage. */
  perSqFt: number | null
  /**
   * How many rows perSqFt was computed from, null exactly when perSqFt is null. The
   * neighbourhood table prints it under the figure: some of these denominators are thin and
   * hiding that would be dishonest.
   */
  perSqFtRows: number | null
  /** Mean of the member sales' coordinates, 5 decimal places. Used to fly the map. */
  lat: number
  lon: number
}

export const NEIGHBORHOODS_2025: readonly NeighborhoodStat[]  // sorted by median, descending
```

Rows are grouped by **(borough, name)**, not by name. Measured: **245 rows** clear a four-sale
floor, 4 fall below it and are dropped, 33 of the 245 have a null `perSqFt`, and the module is
about 35,300 bytes on disk, 8,100 gzipped. Highest median: `JAVITS CENTER` at $4,998,750 over
57 sales. Lowest: `PARKCHESTER` at $235,000 over 270 sales.

**One name appears twice.** `SUNNYSIDE` is a Queens neighbourhood and a Staten Island
neighbourhood, and in this snapshot both clear the floor, with different medians and centroids
30 km apart. Verified against the live slice:

```bash
curl -sSG "https://data.cityofnewyork.us/resource/w2pb-icbu.json" \
  --data-urlencode '$select=borough,neighborhood,count(1) as n' \
  --data-urlencode "\$where=sale_date>='2025-01-01' AND sale_date<'2026-01-01' AND upper(neighborhood) like '%SUNNYSIDE%'" \
  --data-urlencode '$group=borough,neighborhood'
# borough 4 and borough 5, both non-empty
```

That is why `NeighborhoodTable` keys focus and selection by `${b}:${name}` rather than by name,
why the table has a borough column, and why criterion 61 exists.

### `public/projects/nyc-home-sales-2025/points.json` (generated)

Column-major, delta-encoded, plain JSON. Chosen over verbose GeoJSON and over a custom binary
format on measured evidence:

| Encoding | On disk | Gzipped |
| --- | ---: | ---: |
| Verbose GeoJSON FeatureCollection | 6,005,631 | 632,122 |
| Array-of-arrays JSON | 1,604,712 | 478,776 |
| Fixed-width binary, 11 bytes per point | 492,624 | 341,173 |
| **Column-major delta JSON, this format** | **793,272** | **218,951** |
| Custom delta varint binary | 271,645 | 182,509 |

The custom binary is 36 KB smaller over the wire and costs a hand-written codec on both sides
that nothing else on this site needs. The column-major delta JSON gets 97% of the win with
`JSON.parse` plus one cumulative-sum loop, so that is what ships.

The five rows above compare **encodings**, and all five were measured with the price column
quantised to $100. Assumption 16 then removed that quantisation, because it misreports one sale
in nine. The shipped payload therefore carries exact prices and measures **882,827 bytes on disk,
230,172 gzipped**, and criterion 35's budget is set against those numbers, not against the
793,272 in the table. The ranking of the five encodings is unaffected.

```jsonc
{
  "version": 1,
  "generatedAt": "2026-08-01",
  "year": 2025,
  "first": "2025-01-02",
  "last": "2025-12-31",
  "n": 44784,
  "origin": { "lon": -74.25471, "lat": 40.49954 },
  "scale": 100000,        // integer units per degree: 1e-5 deg, about 1.1 m
  "dy": [ ... n ints ],   // delta of the quantised latitude offset, sorted ascending
  "dx": [ ... n ints ],   // delta of the quantised longitude offset
  "p":  [ ... n ints ],   // EXACT recorded sale price in whole dollars. No unit, no rounding.
  "c":  [ ... n ints ],   // index into CLASS_CODES
  "b":  [ ... n ints ],   // 0..4 borough index
  "m":  [ ... n ints ]    // 0..11 calendar month
}
```

There is no `priceUnit` key and there must not be one. Coordinates are quantised to about 1.1 m,
which is a rendering decision on a map whose smallest dot is 3 px; price is not quantised at all,
because it is printed as a number the city recorded. Assumption 16 has the measurement.

Points are sorted by `(y, x, price)` ascending before delta encoding. That order is the
canonical global index every detail shard refers to.

### `public/projects/nyc-home-sales-2025/detail/<borough>.json` (generated)

```jsonc
{
  "borough": "Queens",
  "boroughIndex": 3,
  "index": [ 12, 19, 23, ... ],   // ascending global point indices
  "a": [ "132-05 89 AVENUE", ... ],
  "u": [ "3B", "", ... ],
  "z": [ "11418", ... ],
  "d": [ 23, ... ],               // day offset from January 1
  "g": [ 1200, 0, ... ],          // gross square feet, 0 = not recorded
  "y": [ 1930, 0, ... ],          // year built, 0 = not recorded
  "neighborhoods": [ "ASTORIA", "BAYSIDE", ... ],  // this borough's DOF names, sorted, deduped
  "nb": [ 0, 7, 7, ... ]          // index into neighborhoods, one per sale
}
```

`neighborhoods` and `nb` are how `SaleDetail.neighborhood` gets a value. They live in the shard
rather than in `points.json` because the panel is the only thing that needs a per-sale
neighbourhood, and the shard is fetched on click while `points.json` is fetched by everyone who
scrolls to the map. A per-borough name table keeps the column at 2 to 3 characters per sale and
costs about 1 KB of strings. Sale price is deliberately **not** repeated here: `points.json`
already carries the exact figure and the panel reads it from there.

Measured sizes for the 2026-08-01 snapshot, on disk and gzipped, with these columns included:

| Shard | Sales | Neighbourhoods | On disk | Gzipped |
| --- | ---: | ---: | ---: | ---: |
| Queens | 13,935 | 60 | 772,675 | 179,788 |
| Manhattan | 12,661 | 39 | 728,338 | 130,620 |
| Brooklyn | 10,978 | 60 | 596,982 | 137,996 |
| Staten Island | 3,998 | 54 | 210,766 | 55,819 |
| Bronx | 3,212 | 36 | 180,076 | 43,839 |

Fetched only when a visitor first clicks a point in that borough, then cached for the session.
No visitor ever downloads more than one of these unless they click in more than one borough.

### `content/data/nyc-2025-models.ts` (generated by Task 3)

```ts
export type ModelFamily = 'baseline' | 'linear' | 'neighbours' | 'forest' | 'boosting'

export interface Model2025Result {
  name: string
  family: ModelFamily
  /** Test-set mean absolute error in dollars. */
  mae: number
  rmse: number
  /** Test-set R-squared on dollars, not on the log target. */
  r2: number
  /** Test-set MAPE as a fraction. */
  mape: number
  medianAe: number
  /** The exact hyperparameters this rung was fitted with. */
  params: string
  note?: string
}

export interface FeatureImportance {
  /** Column name as the pipeline sees it. */
  feature: string
  /** Human label rendered on the bar. */
  label: string
  /** Mean increase in test MAE, in dollars, when this column is shuffled. */
  meanIncreaseMae: number
  std: number
}

export const TRAINING = {
  rows: 0, trainRows: 0, testRows: 0, seed: 42, testSize: 0.2,
  features: [] as readonly string[],
  target: 'sale_price',
} as const

export const MODELS_2025: readonly Model2025Result[]     // worst to best, baseline first
export const WINNER: Model2025Result
export const IMPORTANCE_2025: readonly FeatureImportance[]  // top 12, descending
```

**No values appear in this plan.** They are produced by the run and transcribed by the generator.

### `content/data/bird-gallery.ts` (generated by Task 5)

```ts
export interface GalleryBird {
  /** Kebab-case id, also the asset directory name. */
  id: string
  /** Common name as rendered in the picker, e.g. 'Bald eagle'. */
  common: string
  /** Binomial, rendered in the caption. */
  scientific: string
  /** The ImageNet-1k class the forward pass is expected to return as rank 1. */
  expectedLabel: string
  /** The probability it actually returned for that label, from the same pass. */
  topProbability: number
  photographer: string
  license: string
  sourceUrl: string
  /** Source file on Wikimedia Commons, for reproducibility. */
  sourceFile: string
}

export const BIRD_GALLERY: readonly GalleryBird[]
export const FEATURED_BIRD_ID = 'american-robin'
```

The eight species. Every licence below was read from the Commons API's
`extmetadata.LicenseShortName` during planning and every one returned `Public domain`.

| id | Common name | ImageNet class | Photographer / credit | Commons file |
| --- | --- | --- | --- | --- |
| `american-robin` | American robin | `robin` | Courtney Celley, USFWS Midwest Region | `American robin (49781211678).jpg` |
| `bald-eagle` | Bald eagle | `bald eagle` | Steve Hillebrand, USFWS | `Haliaeetus leucocephalus-tree-USFWS.jpg` |
| `american-goldfinch` | American goldfinch | `goldfinch` | USFWS Midwest Region | `American goldfinch (49882388693).jpg` |
| `great-gray-owl` | Great gray owl | `great grey owl` | USFWS Alaska Region | `Great gray owl (53298384180).jpg` |
| `american-white-pelican` | American white pelican | `pelican` | USFWS Mountain Prairie | `American White Pelican Bear River MBR (51847214774).jpg` |
| `laysan-albatross` | Laysan albatross | `albatross` | Chris Swenson, USFWS | `Laysan albatross, Credit USFWS Chris Swenson (5182342300).jpg` |
| `great-egret` | Great egret | `American egret` | USFWS Pacific Region | `USFWS great egret (23853294125).jpg` |
| `ruby-throated-hummingbird` | Ruby-throated hummingbird | `hummingbird` | USFWS Midwest Region | `Ruby-throated hummingbird (50038506407).jpg` |

Approved substitutes, verified public domain, for use only if a download fails or a crop cannot
be made to pass the model check: American flamingo
(`Flamingo walking (38733359000).jpg`, USFWS Pacific Southwest, ImageNet `flamingo`) and wood
duck (`Wood duck (53068651259).jpg`, USFWS Midwest, ImageNet `drake`). A substitution is
recorded in the script's species table and nowhere else; the gallery module is generated from it.

**The licence and photographer strings are read from the Commons API at build time, not typed
in by hand.** The script queries
`https://commons.wikimedia.org/w/api.php?action=query&titles=File:...&prop=imageinfo&iiprop=url|extmetadata`
and writes `Artist`, `Credit` and `LicenseShortName` into the generated module after stripping
HTML. If `LicenseShortName` does not match `/public domain|CC0/i`, the script raises and writes
nothing. That is what makes the attribution real rather than transcribed.

### `public/projects/bird-species-cnn/gallery/<id>/softmax.json` (generated by Task 5)

```json
[{"label":"robin","probability":0.995792}, ... 16 entries, descending]
```

Same producer as the existing `softmax-top8.json`, same `decode_predictions` call with
`top=16`, underscores replaced with spaces. The shipped robin's real top-8 is already on disk
and its rank 1 is `robin` at 0.995792, which is the shape every species will have: one class
near certainty and a long tail of fractions of a percent. That is why the narrowing ladder is
log-scaled.

---

## Visual and motion design

### The new NYC route, section by section

| Position | Section id | What the visitor reads | What they see move |
| --- | --- | --- | --- |
| Hero | | Title, tagline, the link back to the 2019 analysis, three headline figures | Nothing. The `<h1>` is the LCP element. |
| Centrepiece | | The `demonstration` sentence | `SalesMap`: the city's own street map with every 2025 residential sale on it, clusters splitting as you zoom |
| 1 | `problem` | Why redo it: 2019 asking prices from a scrape against 2025 recorded sale prices from the city | Prose only |
| 2 | `data` | The source, the four filters, what each one removed and why | Prose only |
| 3 | `geography` | What the dots show, what the colour means, and why 44,784 markers had to be clustered rather than drawn | Prose only, pointing back at the map |
| 4 | `models` | Four model families, what each one actually does | `ModelMechanisms` |
| 5 | `ladder` | Every rung, scored the same way, on the same split | `ModelLadder2025` |
| 6 | `winner` | Why that model won, grounded in the computed metrics, and what it leaned on | `ImportanceBars` |
| 7 | `limits` | What this model cannot see: condition, renovation, whether the sale was arm's length, the missing floor areas | Prose only |
| 8 | `next-time` | What he would do differently | Prose only |

Three of eight sections carry a visual, which is the ratio the two existing pages hold.

### `SalesMap`

**Well `{ height: 560, heightSm: 620 }`.** The base value is the phone; `heightSm` applies from
640 px up. Below the `Figure`, inside the same lazy chunk, the component renders the filter row,
the legend, `SalesDetailPanel` and `NeighborhoodTable`, so the centrepiece's loading element in
`Nyc2025Visuals.tsx` is a `FigureSkeleton` **plus** an `aria-hidden` placeholder block sized to
that trailing content, exactly the fix R3.3 made for `PriceSurface`. Measure it on the built
export and raise the number until criterion 27 passes.

**Entry.** The map is created already fitted to the NYC bounds, so there is no camera fly-in.
The two data layers start at `circle-opacity: 0` and transition to their final opacity over
`--dur-draw` (900 ms) using MapLibre's paint transition, which produces the dots appearing over
the street map rather than being there from the first frame. Reduced motion: transition duration
0, dots present in the first painted frame.

**Cluster click.** `await map.getClusterExpansionZoom(clusterId)`, then
`map.easeTo({ center, zoom, duration: reduced ? 0 : 500 })`. Clusters therefore split apart as
you go in, which is the motion that makes the density legible.

**Point click.** Sets `selectedIndex`, which drives the `selected` layer's filter and the detail
panel. The accent ring appears within `--dur-fast`. If the borough's detail shard is not yet
loaded, the panel shows its loading sentence in a box that is already the right height.

**Filter change.** Property group or month change rebuilds the GeoJSON and calls
`source.setData(...)`. At 44,784 points this is a single synchronous rebuild of about 40 ms;
do not debounce a radiogroup, do debounce nothing else, and do not animate the change: the dots
that no longer match simply are not there. The neighbourhood table's numbers are recomputed from
the same filter so the two never disagree.

**Neighbourhood row select.** `map.flyTo({ center: [row.lon, row.lat], zoom: 14, duration: reduced ? 0 : 700 })`,
and in the same handler `setSelectedIndex` to the filtered point nearest that centroid, so the
accent ring and the detail panel arrive with the camera rather than waiting for a click. This is
the keyboard path to the panel.

**Legend.** `ScaleLegend` with `PRICE_BREAKS` formatted through `formatCompactUSD`, low label
`Lower`, high label `Higher`, and the caption line `Cluster colour is the mean price of the
sales inside it. Single dots carry their own price.`

**Figure copy**, verbatim, and duplicated into `Nyc2025Visuals.tsx`'s `CHROME.centrepiece`:

- Eyebrow: `44,784 RECORDED SALES` (the real count, written by the developer from `SNAPSHOT.points`)
- Title: `Every home New York sold in 2025`
- Caption: `One dot per recorded sale. Zoom in and the clusters split into the sales behind them.`
- Source: `New York City Department of Finance, Citywide Annualized Calendar Sales, calendar 2025, downloaded {SNAPSHOT.generatedAt}. Basemap: OpenFreeMap, OpenMapTiles, data from OpenStreetMap.`

**Accessible equivalent.** Three layers of it, because a clustered map of 44,784 points has no
honest literal transcription:

1. **The map's own description, on the canvas, not on the container.** Do **not** put
   `role="img"` on the element that hosts the map. `role="img"` carries Children Presentational:
   True, which strips everything inside it out of the accessibility tree, and inside it are two
   things that must stay: MapLibre's canvas, which takes `tabindex="0"` because `keyboard: true`
   gives it arrow-key pan and `+`/`-` zoom, and the attribution control's links to OpenFreeMap,
   OpenMapTiles and OpenStreetMap. Focusable elements with no name and no role inside a
   presentational subtree are an axe violation, and criterion 31 allows none.

   Do this instead. MapLibre 5 already gives its canvas `role="region"` and
   `aria-label="Map"` (verified in 5.24.0's `_setupContainer`). Keep the role, replace the label,
   and point it at a fuller description:

   ```ts
   const canvas = map.getCanvas()
   canvas.setAttribute('aria-label', label)          // short, names the thing
   canvas.setAttribute('aria-describedby', 'sales-map-summary')
   ```

   `label`, regenerated on every filter change, verbatim shape:
   `Map of {n} recorded 2025 home sales across New York City, coloured by sale price.`

   `#sales-map-summary` is a `<p className="sr-only">` rendered by `SalesMap` immediately before
   the map container, holding the current filter state and the pointer to the table, verbatim
   shape: `Showing {n} sales, {group description}, {month description}. Prices run from {min} to
   {max}. Dots merge into clusters as you zoom out, and a cluster takes the mean price of the
   sales inside it. The same figures are in the neighbourhood table below this map.` It is not an
   `aria-live` region: the detail panel already owns the one live region in this figure, and two
   competing announcements on one keypress is worse than none. Re-apply both attributes after any
   `styledata` re-add, since a `setStyle` cycle is the one place they could be lost.

2. `NeighborhoodTable`, always rendered, searchable, sortable, keyboard-operable, 245 rows.
   This is the real equivalent: the same data at the level its colour is readable at.
3. `Figure`'s `<details>` holds a `FigureTable` of the five borough rows, including the
   `perSqFtRows` column criterion 13 requires, plus a sentence naming the highest and lowest
   neighbourhood medians and the counts behind them.

No information is hover-only. Everything the map encodes by colour is a number in the table, and
no count or denominator lives in a `title` attribute.

### `ModelMechanisms`

**Well `{ ratio: '4 / 3', ratioSm: '16 / 9' }`.** On first view the 60 scatter points fade in
over `--dur-draw` with `--stagger` capped at 8. Switching mechanism cross-fades the overlay
marks over `--dur-base` with `--ease-in-out`; the scatter never moves, so the eye compares like
with like. The `boosting` stepper advances one stage per press over `--dur-base`. Nothing
autoplays after the first fade. Reduced motion: points at final opacity on first paint, instant
mechanism and stage changes.

Marks and their measured contrast on the `--surface-2` well, both themes, all of which clear the
3:1 geometry floor from the foundation plan's Colour section:

| Mark | Token | Light | Dark |
| --- | --- | ---: | ---: |
| Scatter points | `--text-tertiary` | 5.05:1 | 5.15:1 |
| Fitted line, current mechanism | `--text-primary` | 16.51:1 | 15.76:1 |
| Secondary line (penalised fit, individual trees) | `--viz-cat-6`, 2 px dashed | 4.20:1 | 3.43:1 |
| Residual bars (`boosting` only) | `--viz-seq-5` | 3.92:1 | 3.67:1 |
| Neighbour rings (`neighbours` only) | `--text-primary`, 1.5 px, unfilled | 16.51:1 | 15.76:1 |

The `neighbours` cursor is the one accent mark in this figure and it is a cursor, not a value.

**Figure copy:** eyebrow `FOUR MECHANISMS`, title `How each model actually fits`, caption
`Same synthetic points every time. Only the fitting rule changes.`, source
`Illustrative. Synthetic values chosen to show each mechanism, not measurements from the sales data.`

### `ModelLadder2025` and `ImportanceBars`

Both grow their bars left to right over `--dur-draw` with `--stagger` 40 ms capped at 8 on first
view, then park. Reduced motion: final widths, one 120 ms fade. Wells:
`ModelLadder2025 { height: 380, heightSm: 340 }`, `ImportanceBars { height: 520, heightSm: 460 }`.
Both use the R3.5 responsive row so nothing clips at 375 px and nothing truncates at 1280 px.

**`ModelLadder2025` copy:** eyebrow `MODEL LADDER, 2025 DATA`, title
`Every rung, scored the same way`, caption written by the developer from the real result, of the
form `The floor is predicting the citywide median for every sale. {winner name} takes {X} off
it.`, source `Computed by scripts/train-nyc-sales-2025.py on the same 2025 sales the map draws.`

**`ImportanceBars` copy:** eyebrow `WHAT THE MODEL LEANS ON`, title
`Permutation importance, test set`, caption `Each bar is how much worse the model gets when that
one column is shuffled.`, source
`Permutation importance over 10 repeats on the held-out test set, computed by scripts/train-nyc-sales-2025.py.`

### The bird narrowing figure

**Well `{ height: 780, heightSm: 520 }`.** The base value is the stacked phone layout: gallery
strip, photograph, attribution, stepper, ladder. Measure and raise until criterion 46 passes.

**Autoplay, once.** On first view the stages advance on this clock, measured from the moment the
figure enters view: stage 0 at 0 ms, stage 1 at 450 ms, stage 2 at 900 ms, stage 3 at 1,350 ms.
The figure then parks on stage 3 and changes stage again only when the visitor presses a stepper
control or picks another bird. Dropped chips and rows fade out over 240 ms while the survivors
reflow up over the same 240 ms with `--ease-in-out`; nothing slides sideways. The winner's row
does one settle pulse starting at 1,800 ms, which is `DURATION.sequence` and is the existing
timer this component already schedules, `scale(1)` to `1.02` to `1` over 240 ms, and
**releases**, per R4.6. Criterion 45 tests exactly these five timestamps.

**Selecting a different bird** fetches that species' `softmax.json` if it is not cached, resets
to stage 0 and replays the sequence once. Under reduced motion it jumps straight to stage 3 with
no replay.

**Reduced motion.** No autoplay and no stage timers at all. The figure renders **stage 3**, the
prediction, on first paint, and the stage stepper is rendered and fully operable so a reader can
step back through 3, 2, 1, 0 with instant transitions. This follows the foundation plan's rule
that autoplay controls are not rendered under reduced motion but manual step controls are.

**Figure copy**, verbatim, duplicated into `BirdVisuals.tsx`'s `CHROME.decision`:

- Eyebrow: `SOFTMAX`
- Title: `Sixteen candidates, then one`
- Caption: `Pick a bird. The list narrows to eight, then three, then the species the network committed to.`
- Source: `One forward pass per photograph through stock ImageNet VGG16. Every probability shown at every stage is that pass's final softmax output, filtered, not a mid-network guess: the network produces no class scores before its last layer.`

That source line is the integrity guarantee for this whole figure and it is not optional.

Below the ladder, a permanent line in `--text-secondary` reading, with the real numbers
substituted at render time from the loaded asset:
`Rank 1 takes {p1} of the probability. The other fifteen classes share {rest} between them.`

**Accessible equivalent.** `Figure`'s `<details>` carries a `FigureTable` with all 16 rows for
the selected species: rank, class name, probability to four decimals, and whether it survives
into stage 1, 2 and 3. Plus one row per gallery species with its photographer, licence and
source URL, so every attribution is readable without hovering a photograph.

---

## Acceptance criteria

Numbered so a tester can pass or fail each without judgment. Task assignments are at the end of
each task's section.

### Build, export and voice

1. `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` all exit 0 with no
   new warnings. `out/` gains `projects/nyc-home-sales-2025/index.html` and every previously
   exported route still exists.
2. `NEXT_PUBLIC_BASE_PATH=/preview npm run build` exits 0, and every asset URL emitted for the
   new route, including `points.json`, the five detail shards and every gallery image, is
   prefixed with `/preview`.
3. No route handler, middleware, `force-dynamic`, request-time fetch or `next/image`
   optimisation is introduced. `app/projects/nyc-home-sales-2025/page.tsx` contains no
   `'use client'` and no `dynamic(` call and exports `metadata`; every `ssr: false` import for
   that route lives in `components/projects/nyc2025/Nyc2025Visuals.tsx`.
4. `grep -rn "src=\"/" components app` returns nothing new: every asset URL still goes through
   `withBasePath()`.
5. **Voice.** `grep -rn "—" app components lib content scripts README.md` returns exactly one
   match: `content/projects/registry.test.ts`, the assertion that forbids em dashes in rendered
   strings. That assertion stays, Task 4 keeps it, and no file this wave adds or edits
   introduces a second match. (Verified against the pre-wave tree: that line is the only match
   today, and `content/profile.ts` contains none.)
   `grep -rni "claude\|anthropic\|chatgpt\|copilot\|ai assistant\|generated by"`
   over `app components lib content scripts .github README.md` returns nothing, and no commit
   message in this wave contains any of them. Note the interaction with criterion 14: generated
   modules say `Produced by <script>`, the phrasing `content/data/nyc-price-surface.ts` already
   uses, never `Generated by`, which this grep forbids. Every user-visible string added by this
   wave appears verbatim in this document or is a number read from a generated module.
6. Neither `npm run build` nor `.github/workflows/deploy.yml` invokes
   `scripts/build-nyc-sales-2025.mjs`, `scripts/train-nyc-sales-2025.py` or
   `scripts/build-bird-assets.py`.

### Content integrity and the legal boundary

7. `grep -rni "zillow" app components lib content scripts` returns matches in these files and no
   others. **Four are pre-existing and this wave does not touch them**: they name the 2019
   listing extract in a `source` line or a doc comment and they are outside every task manifest,
   which is deliberate, per the Out of scope rule that the 2019 page changes only by gaining one
   `related` field.

   | File | Status |
   | --- | --- |
   | `components/projects/nyc/PriceSurface.tsx` | Pre-existing, untouched |
   | `components/projects/nyc/ImputationSpread.tsx` | Pre-existing, untouched |
   | `components/projects/nyc/BoroughSpread.tsx` | Pre-existing, untouched |
   | `content/projects/nyc-housing-prices.ts` | Pre-existing prose, plus this wave's `related` label |
   | `components/projects/nyc2025/zillow-link.ts` | Added by this wave |
   | `components/projects/nyc2025/zillow-link.test.ts` | Added by this wave |
   | `components/projects/nyc2025/SalesDetailPanel.tsx` | Added by this wave |
   | `content/projects/nyc-home-sales-2025.ts` | Added by this wave, prose only |

   The check that matters for this wave: `grep -rni "zillow" components/projects/nyc2025` matches
   only the three files listed above as added, and the only `zillow.com` URL anywhere in the
   repository is the one `zillow-link.ts` builds.
8. No `<iframe>`, `<img>`, `fetch`, `XMLHttpRequest`, `link rel=preconnect` or CSS `url()` in the
   repository references a `zillow.com` host. The only Zillow reference in the exported HTML is
   inside an `<a href>` produced at runtime, and no Zillow string appears in any committed JSON
   under `public/`.
9. Every Zillow anchor rendered by `SalesDetailPanel` carries `target="_blank"` and
   `rel="noopener noreferrer"`, and its visible text is `Look up this address on Zillow`.
10. No committed file under `public/projects/nyc-home-sales-2025/` contains an owner name, a
    buyer name, a seller name, a document number or any field not listed in the Data section.
    `points.json` contains no strings other than its metadata keys and values.
11. The raw sales CSV is not committed: `git ls-files | grep -c "nyc-sales-2025.csv"` returns 0
    and `.gitignore` contains `/.data`.
12. `scripts/build-nyc-sales-2025.mjs` stops with a non-zero exit and a printed reason if any of
    these sanity bands fails, rather than writing a wrong module: geocoding coverage below 90%,
    surviving points outside 30,000 to 60,000, citywide median outside $500,000 to $1,500,000,
    any borough with fewer than 500 sales, or fewer than 150 neighbourhoods clearing the
    four-sale floor.
13. Every per-square-foot figure rendered anywhere on the new route prints, **in visible text next
    to it**, the number of sales it was computed from. `BoroughStat2025.perSqFtRows` is
    non-optional; `NeighborhoodStat.perSqFtRows` is `number | null` and is null exactly when that
    row's `perSqFt` is null. The borough `FigureTable` carries the count as its own column, and
    the neighbourhood table prints it under the figure inside the same cell. No count is in a
    `title` attribute, a tooltip or any other hover-only affordance: the map section's rule that
    no information is hover-only covers this table too.
14. `content/data/nyc-2025-sales.ts`, `content/data/nyc-2025-neighborhoods.ts`,
    `content/data/nyc-2025-models.ts` and `content/data/bird-gallery.ts` each open with a
    `GENERATED. Do not hand-edit.` comment naming the script that produced them and the source
    they came from, in the form `Produced by <script> against <source>`, matching
    `content/data/nyc-price-surface.ts`. Not `Generated by`: criterion 5's grep forbids that
    phrase.
15. Every numeric claim in `content/projects/nyc-home-sales-2025.ts` appears in one of the
    generated modules. Concretely: each of the three `headlineFigures[].value` strings equals the
    corresponding value formatted through `lib/format.ts` from `content/data/nyc-2025-sales.ts`
    or `content/data/nyc-2025-models.ts`. Asserted in `content/projects/registry.test.ts`,
    which is Task 4's file: the record does not exist when Task 3 runs, so its own test file
    cannot reach it.
16. `content/projects/index.ts` exports exactly three records in the order
    `['nyc-home-sales-2025', 'nyc-housing-prices', 'bird-species-cnn']`, all three `status: 'live'`.
17. Every `related.slug` in every record resolves through `getProject` to a `live` record, and
    the two NYC records point at each other with opposite `direction` values.
18. Every `ProjectLink.href` in the registry starts with `https://github.com/pizonkhan/`,
    `https://www.kaggle.com/` or `https://data.cityofnewyork.us/`. No other host appears in
    `links`.
19. `content/data/bird-gallery.ts` has exactly eight entries, each with a non-empty
    `photographer`, `license` and `sourceUrl`, each `license` matching `/public domain|CC0/i`,
    and each `sourceUrl` on `commons.wikimedia.org`.
20. For every gallery species, `expectedLabel` equals the `label` of rank 1 in that species'
    `softmax.json`, and `topProbability` equals its probability. The build script raises rather
    than writing a species whose rank 1 does not match its expected class.

### The map

21. At 1280 px the map renders the OpenFreeMap basemap plus clustered dots within 3 seconds of
    the chunk landing on a throttled Fast 3G profile, and the attribution control shows
    `OpenMapTiles` and `OpenStreetMap`.
22. Zooming from the initial fitted view to zoom 16 over Manhattan splits clusters into
    individual dots, and clicking one dot fills `SalesDetailPanel` with a non-empty address, a
    non-empty neighbourhood, a borough, a price, a date, a building type and either a floor area
    or the string `not recorded`. Every one of those lines is populated; none renders empty or
    `undefined`.
23. Switching the theme toggle re-styles the basemap and **all four data layers are still
    present and still coloured** afterwards, verified by asserting
    `map.getLayer('points')` and `map.getSource('sales')` are defined after the `styledata`
    event fires.
24. The map cannot be panned outside `maxBounds` and cannot be zoomed below 9 or above 17.
25. With WebGL disabled, the route still renders, shows the fallback sentence, shows the full
    neighbourhood table, requests neither `points.json` nor any shard, and logs no uncaught
    error. Activating a table row in that state changes nothing and throws nothing.
26. `NeighborhoodTable` reaches every neighbourhood by keyboard: tab to the search input, type
    a substring, tab into the table, arrow or tab through rows, `Enter` on a row moves the map
    **and fills `SalesDetailPanel` with the sale nearest that neighbourhood's centroid**, so the
    panel is reachable with no pointer at all. Each body row has real `<td>` cells and no
    `colSpan`. Column header buttons expose `aria-sort`.
27. Scrolling the route top to bottom on a throttled connection at 375 and 1280 px produces no
    single layout-shift entry attributable to a figure swap above **0.005**, including the
    centrepiece swap with the visitor already parked on it, and total CLS below **0.02**.
28. At 375, 768 and 1280 px every `.viz-well` on the route satisfies
    `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`. At 1280 px no model name in
    `ModelLadder2025` and no feature label in `ImportanceBars` is truncated.
29. Arrow keys in the property-group radiogroup move both the selection and
    `document.activeElement`; `Home` and `End` jump to first and last.
30. Every figure on the route is wrapped in `Figure`, has a non-empty `source`, and has a
    `<details>` containing a `<table>`.
31. axe reports zero violations on `/projects/nyc-home-sales-2025/` in both themes, and
    Lighthouse Accessibility scores 100.

### Performance budget

32. `/projects/nyc-home-sales-2025/` first-load JS is **≤ 130 KB gzipped** in `next build`'s
    route table, unchanged from the other two project routes. The map chunk is not in it.
33. The lazily loaded map chunk, meaning `SalesMap` plus `maplibre-gl` plus its CSS, is
    **≤ 320 KB gzipped**. This is by far the largest chunk on the site and it is stated rather
    than hidden: `maplibre-gl@5` alone measures 274 KB gzipped, the page's whole purpose is the
    map, and the chunk is requested only when the map's container comes within 200 px of the
    viewport.
34. The three model-figure chunks combined are **≤ 35 KB gzipped**.
35. `public/projects/nyc-home-sales-2025/points.json` is **≤ 950,000 bytes on disk and
    ≤ 245,000 bytes gzipped**. No detail shard exceeds **850,000 bytes on disk or 190,000 bytes
    gzipped**. `content/data/nyc-2025-neighborhoods.ts` is **≤ 45,000 bytes on disk**. Byte
    counts rather than KB, so there is no KB-versus-KiB argument at review time. Planner-measured
    on the 2026-08-01 snapshot, with exact prices in the payload and the neighbourhood columns in
    the shards: points.json 882,827 and 230,172; Queens, the largest shard, 772,675 and 179,788;
    Manhattan 728,338 and 130,620; Brooklyn 596,982 and 137,996; Staten Island 210,766 and
    55,819; Bronx 180,076 and 43,839; the neighbourhood module about 35,300 on disk. Check with
    `gzip -9 -c <file> | wc -c`.
36. At a 375 x 667 viewport, on load none of the four visual chunks is requested; scrolling to
    the centrepiece requests exactly one; the three section chunks then arrive in section order.
    The gating lives in `Nyc2025Visuals.tsx` and nowhere else.
37. No detail shard is requested until the visitor selects a sale in that borough, whether by
    clicking a dot or by activating a neighbourhood row in that borough. Loading the route and
    scrolling it end to end without selecting anything requests zero shards, and selecting in one
    borough requests that borough's shard only.
38. Initial map render issues **fewer than 40 tile requests** at the default fitted view on a
    1280 px viewport.
39. Lighthouse mobile Performance on `/projects/nyc-home-sales-2025/` is **≥ 85**, LCP **≤ 2.5 s**
    and TBT **≤ 600 ms**. This is the one route on the site under a relaxed bar, for the reason
    in criterion 33; every other route keeps its existing budget, and `/` and
    `/projects/nyc-housing-prices/` must still measure ≥ 95.
40. The bird route's first-load JS is still **≤ 115 KB gzipped** and its six visual chunks are
    still **≤ 70 KB gzipped** combined. The gallery adds assets, not route JS.
41. Total committed assets under `public/projects/bird-species-cnn/gallery/` are **≤ 320 KB**,
    and no single species directory exceeds **45 KB**.

### Motion and reduced motion

42. With `prefers-reduced-motion: reduce` emulated, loading both new and changed routes produces
    no element whose computed `transition-duration` or `animation-duration` exceeds 150 ms.
43. Under reduced motion the map's dots are present in the first painted frame after the chunk
    loads, every `easeTo` and `flyTo` is called with `duration: 0`, and no autoplay control
    exists anywhere.
44. Under reduced motion the narrowing figure renders stage 3 on first paint, runs no timer, and
    its stage stepper still moves between all four stages.
45. With default motion the stages advance on this clock, timed from the figure entering view:
    stage 0 at 0 ms, stage 1 at 450 ms, stage 2 at 900 ms, stage 3 at 1,350 ms, each within
    +/- 150 ms. The figure then parks: no further stage change happens without a press. The
    winner's settle pulse starts at 1,800 ms and the winning row's computed `transform` is back
    to `scale(1)` by 2,300 ms and stays there.
46. At 375, 768 and 1280 px the narrowing figure's well satisfies
    `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`, all eight gallery
    thumbnails are reachable, and the attribution line for the selected species is visible.
47. No animation loops anywhere: `grep -rn "repeat: Infinity\|infinite"` in `components/` returns
    nothing.
48. Every JS-driven animation added by this wave reads `usePrefersReducedMotion` from
    `lib/motion.ts`. `grep -rn "useReducedMotion" components lib app` returns nothing, and no
    MapLibre reduced-motion flag is relied on in place of the hook.

### Accent discipline

49. The foundation plan's criterion 67 enumerated four sanctioned uses of an accent token. This
    wave adds three, and the list is now closed at seven until a plan edits it again:
    (a) `:focus-visible` rings anywhere;
    (b) `KernelSweep`'s 3 x 3 window outline;
    (c) `PriceSurfaceCanvas`'s focused-borough glow;
    (d) `BoroughTable`'s selected-row wash;
    (e) **`SalesMap`'s two position markers**: the `selected` layer's ring on the clicked sale,
    and the `Marker` ring on the focused neighbourhood's centroid. Both mark where the user is,
    neither encodes a value, and they are one entry because they are one idea;
    (f) **`NeighborhoodTable`'s selected-row wash**, with metadata in `--text-secondary`;
    (g) **`BirdGallery`'s ring on the selected thumbnail**, which marks a selection.
    In every one of (e), (f) and (g) the accent is a selection marker, never a value. A tester
    confirms each is present and that no eighth use exists: no `--accent*` property and no
    `ACCENT` literal appears as a fill, stroke or background on any mark whose position, length,
    area or colour carries a value, in any file added by this wave.

### Bird gallery correctness

50. Selecting each of the eight thumbnails updates the photograph, the attribution line, the
    caption's species name and all four stages, and every probability rendered matches that
    species' committed `softmax.json` to the digit.
51. Every stage of the narrowing shows a strict subset of the previous stage's classes, and the
    16, 8, 3 and 1 counts are exact.
52. Every probability below 0.01% renders as `<0.01%` on the bar row and as its exact
    four-decimal value in the `FigureTable`.
53. `public/projects/bird-species-cnn/softmax-top8.json` no longer exists and nothing references
    it. `PixelMatrix`, `ConvolutionSweep`, `LayerPyramid`, `ActivationStrip`, `TransferDiagram`
    and `ResultsLadder` are byte-identical to their state before this wave
    (`git diff --stat` lists none of them).
54. Two R4 fixes survive in `SoftmaxRace.tsx`: the settle pulse releases (the winning row's
    computed `transform` returns to `scale(1)`), and the R3.5 responsive row is intact at 375 px.
    Separately, and this one is **new work rather than preservation**, the `useInViewOnce` ref now
    sits on a wrapper element rendered in the loading and error states as well as the ready state.
    Before this wave the ref was inside the `asset.status === 'ready'` branch only, which is why
    this clause is phrased as a change: the always-mounted wrapper was R4.3's fix for
    `ActivationStrip.tsx`, not something `SoftmaxRace.tsx` ever had.

### Payload precision, map semantics and row identity

59. `public/projects/nyc-home-sales-2025/points.json` contains no `priceUnit` key, and
    `grep -rn "priceUnit" app components lib content scripts public` returns nothing. Every value in `p` is an
    exact recorded sale price in whole dollars: take any 20 points, find each one's position in
    its borough shard through the shard's `index` array, read the address and date, locate that
    row in the source CSV, and the prices are equal to the dollar. `useSalesPoints.ts` performs
    no arithmetic on the `p` column: it is copied into `price` unchanged, and the price
    `SalesDetailPanel` prints is that value formatted through `formatUSD` and nothing else.
60. The element hosting the MapLibre canvas has no `role="img"` and no `aria-hidden`. The canvas
    keeps `role="region"`, carries an `aria-label` that changes when the property group or month
    changes, and an `aria-describedby` resolving to the visually hidden `#sales-map-summary`
    paragraph, whose text also changes with the filter. Tabbing through the figure reaches the
    canvas and every attribution link, each with a non-empty accessible name. Both attributes are
    still correct after a theme toggle. axe reports zero violations, which is criterion 31.
61. Row identity in `NeighborhoodTable` is `${b}:${name}`, never a bare name. Where two rows in
    `NEIGHBORHOODS_2025` share a name across boroughs (in the 2026-08-01 snapshot that is
    `SUNNYSIDE`, Queens and Staten Island), focusing or hovering one of them sets
    `aria-selected="true"` on that row only, and rings exactly one centroid on the map, the one
    in that row's own borough. The table shows a borough column, so the two rows are
    distinguishable on screen without interacting with either.
62. When a detail shard request fails, forced by blocking
    `**/nyc-home-sales-2025/detail/*.json` in devtools, clicking a dot renders
    `Could not load the address for this sale.` plus the borough, building type and month, and
    the panel never sits on `Loading the address for this sale.` indefinitely. No uncaught error
    reaches the console.

---

## Tasks

Six tasks, dependency-ordered, strictly disjoint file sets.

---

### Task 1 - `project-relation-link`

**Goal.** Give the project template a typed way for one project page to point at another, so the
2025 page and the 2019 page can name each other without either one inventing a link.

**Files.** `content/projects/types.ts`, `components/project/ProjectHero.tsx`. Two files, and it
is deliberately small: it is the only change in this wave that touches the shared template every
project page renders through, and isolating it makes "did this break the other two pages" a
one-diff question.

**Depends on.** Nothing.

**Notes.**
- Do not add `related` to any record in this task. The 2025 record does not exist yet, and a
  `related` pointing at a missing slug would render a link to a 404 in the intermediate state.
  Task 4 adds both sides at once.
- `ProjectHero` keeps rendering byte-identically when `related` is absent, which is the state
  both existing pages are in after this task.

**Acceptance.** 1, 5. Additionally: 55. `/projects/nyc-housing-prices/` and
`/projects/bird-species-cnn/` render with no visual change, verified by screenshot diff at
1280 px in both themes.

---

### Task 2 - `nyc-2025-map-data`

**Goal.** Turn one public CSV into the committed point payload, the detail shards and the two
aggregate modules the map runs on, with every filter, count and threshold printed by the script
and provable by rerunning it.

**Files.** Exactly the Task 2 table, 11 entries.

**Depends on.** Nothing.

**Notes.**
- Follow `scripts/build-nyc-price-surface.mjs` exactly: a header comment naming the source and
  the exact download command, an optional input path in `process.argv[2]`, deterministic output,
  no dependency outside Node's standard library, and no wiring into any npm script.
- If `process.argv[2]` is absent, download to `.data/nyc-sales-2025.csv` using the documented
  SODA URL and reuse the file if it is already there. Print the SHA-256 of the input and write
  it into `SNAPSHOT.inputSha256`.
- Print the surviving count after every filter step, in the order the Data section gives, before
  writing anything. Then check the sanity bands in criterion 12 and exit non-zero if any fails.
- Sort points by `(y, x, price)` ascending **before** delta encoding, and build the detail shards
  from that same ordering. The whole client contract is that a shard's `index` values are global
  indices into the sorted arrays.
- Do not write any owner, buyer, seller, document or BBL field into any committed file. BBL is
  fetched only so a future PLUTO fallback has a join key; it is not shipped.
- Neighbourhood names ship exactly as the Department of Finance spells them, parenthetical
  street ranges included. Do not tidy them. Group by **(borough, name)**, not by name:
  `SUNNYSIDE` exists in Queens and in Staten Island and both clear the four-sale floor.
- Write the **exact** `sale_price` into `p`. No `priceUnit`, no division, no rounding. Assumption
  16 has the measurement and criterion 59 is the check.
- Each shard carries `neighborhoods`, that borough's sorted deduped DOF names, and `nb`, one
  index per sale. That is the only path a per-sale neighbourhood has to the detail panel.
- Percentiles are linear interpolations between the two nearest order statistics, the same rule
  Task 3's Python uses. Do not use nearest-rank: the two scripts would then print different
  medians for the same data.
- `CLASS_LABELS` is the literal ten-row table in the Data section, written out, not derived by a
  title-case transform. Exit non-zero if a surviving row's code is outside those ten.
- `content/data/nyc-2025-sales.test.ts` asserts internal consistency, not my measured values:
  borough counts sum to `SNAPSHOT.points`, `PRICE_BREAKS` is strictly ascending and length 6,
  every borough median lies inside `PRICE_FILTER`, every neighbourhood has `n >= 4`, the
  neighbourhood counts sum to at most `SNAPSHOT.points`, and every `perSqFt` that is non-null is
  backed by at least four rows.

**Acceptance.** 1, 5, 6, 10, 11, 12, 13, 14, 35 (the payload and shard budgets), 59.

---

### Task 3 - `nyc-2025-model-ladder`

**Goal.** Train a real model ladder on the same 2025 sales, compute real test metrics and real
permutation importance, and commit them as a typed module.

**Files.** Exactly the Task 3 table, 3 entries.

**Depends on.** Task 2, for the filter definitions the script must mirror exactly.

**Notes.**
- Follow `scripts/build-bird-assets.py`'s shape: a long header docstring explaining what the
  script does, what it needs, how to make an isolated environment, and why. Requirements:
  `numpy`, `pandas`, `scikit-learn`. Nothing else is required.
- **The filter chain must be identical to Task 2's**, byte for byte in its thresholds, or the
  page will claim a model was trained on the sales the map draws when it was not. Restate the
  four filters in the docstring and print the surviving count so the two scripts can be compared
  by eye.
- Features: borough (one-hot), building class category (one-hot), latitude, longitude, sale
  month, residential units, total units, land square feet, gross square feet, year built.
  Zeros in `gross_square_feet`, `land_square_feet` and `year_built` mean "not recorded" and are
  converted to `NaN` first, then imputed with `IterativeImputer`, which is the same MICE step the
  2019 project used. Do not one-hot the 245 neighbourhoods: it is 245 columns of near-duplicate
  information that latitude and longitude already carry, and it invites leakage.
- `IterativeImputer` is still experimental in scikit-learn, so
  `from sklearn.experimental import enable_iterative_imputer` must come **before**
  `from sklearn.impute import IterativeImputer` or the import raises. This trips everyone once.
- Percentiles, including the citywide median baseline, use `numpy.percentile`'s default linear
  interpolation, which is the rule Task 2's generator mirrors.
- Split: `train_test_split(test_size=0.2, random_state=42)`. State the seed in `TRAINING`.
- Rungs, in this order: citywide median baseline, `Ridge` (alpha by 5-fold CV over
  `[0.1, 1, 10, 100, 1000]`), `KNeighborsRegressor` (k by 5-fold CV over `[3, 5, 10, 20, 40]`,
  features scaled), `RandomForestRegressor(n_estimators=300)` with `max_depth` by 3-fold CV,
  `HistGradientBoostingRegressor` on the raw target with a small grid, and the same estimator on
  `log(sale_price)` with predictions exponentiated back before scoring. If `import xgboost`
  succeeds, add a seventh rung; if it raises, print one line saying it was skipped and continue.
- **Every metric is computed in dollars on the held-out test set**, including for the log-target
  rung, which must be exponentiated before scoring or its MAE is not comparable to the others.
  This is the single most likely way to produce a ladder that lies.
- Permutation importance: `permutation_importance(..., n_repeats=10, random_state=42,
  scoring='neg_mean_absolute_error')` on the test set, for the winning model only, reported as a
  positive dollar increase. Take the top 12.
- Print the full ladder as a table to stdout at the end. The developer writes the page's prose
  from that printout in Task 4, and the printout is what the reviewer checks the prose against.
- `content/data/nyc-2025-models.test.ts` asserts: the ladder is ordered worst to best by MAE,
  the baseline is first and has the highest MAE, `WINNER` is the last entry, every `r2` is
  between -1 and 1, every `mae` is between $50,000 and $1,000,000, `IMPORTANCE_2025` has 12
  entries sorted descending, and `TRAINING.seed === 42`.

**Acceptance.** 1, 5, 6, 14. Additionally: 56. Rerunning the script against the same input CSV
produces a byte-identical `content/data/nyc-2025-models.ts`. 57. The printed ladder in the run
log matches the committed module row for row.

---

### Task 4 - `nyc-2025-page`

**Goal.** Ship the demonstration: the real NYC map over the real 2025 sales, the four model
mechanisms, the real ladder, the real importance, and the write-up that ties them together, with
the 2019 page linked from it and linking back.

**Files.** Exactly the Task 4 table, 17 entries.

**Depends on.** Tasks 1, 2, 3.

**This task is not split, and here is why.** Every candidate split leaves two tasks editing
`app/projects/nyc-home-sales-2025/page.tsx` and `content/projects/nyc-home-sales-2025.ts`,
because a figure cannot be mounted without the route passing it through `sectionVisuals` and the
record declaring `hasVisual`. The rule against overlapping manifests outranks the preference for
small tasks, so the page ships whole. It is comparable in size to the foundation plan's Task 4.
`package-lock.json` is in this manifest and in no other, for the same reason: one task installs
the one new dependency.

**Notes.**
- Write the record's prose **after** reading Task 3's printed ladder and Task 2's printed counts.
  Do not write a number this wave did not compute. If a number is missing, leave `TODO(pizon:)`.
- `#problem` carries the honest framing of why this exists: the 2019 page predicts asking prices
  from a scraped listing set, this one predicts recorded sale prices from the city's own
  register, and those are different questions with different error floors. Do not claim the two
  model ladders are comparable, because they are not: different target, different features,
  different years.
- `#data` carries the filter chain and what each step removed, including the sentence that the
  $0 rows are deed transfers between related parties rather than sales.
- `#geography` carries the clustering decision as an engineering beat: 44,784 DOM markers is not
  a map, it is a frozen tab, so the points go into a GeoJSON source with clustering on and the
  browser draws them in WebGL.
- `#limits` carries what the model cannot see: interior condition, renovation, whether the sale
  was arm's length, and the missing floor areas, with the Manhattan 189-of-12,661 figure stated
  plainly.
- `related` goes on **both** records in this task, pointing at each other. The 2019 record's
  label, verbatim: `Rebuilt on the city's own 2025 sale records`. The 2025 record's label,
  verbatim: `The earlier version, on 2019 Zillow listings`.
- `content/projects/nyc-housing-prices.ts` gets `related` and nothing else. Do not touch its
  title, tagline, summary, sections, links or dataStatement: those were settled in the
  remediation pass and every figure on that page is keyed to them.
- `registry.test.ts` gains `https://data.cityofnewyork.us/` in `ALLOWED_LINK_HOSTS`, the relation
  assertions from criteria 17 and 18, and criterion 15's assertion that each of the 2025 record's
  three `headlineFigures[].value` strings equals the matching generated value formatted through
  `lib/format.ts`. That assertion lives here rather than in Task 3's test file because the record
  does not exist yet when Task 3 runs.
- **Two existing assertions in that file must be updated, not preserved.** The file today asserts
  `projects.map(p => p.slug)` equals `['nyc-housing-prices', 'bird-species-cnn']` and that the
  live records have length 2, in a test named "holds exactly the two wave-1 records". Both are
  false the moment the third record registers, so update them to the three-record order in
  criterion 16 and rename the test to match. Every other assertion in the file stays byte-identical:
  no employer/company/client field, the host allowlist mechanism, the em-dash check, next-time
  last, unique section ids, non-empty prose, and sourced headline figures. In particular do not
  delete the em-dash assertion: criterion 5 depends on it being the one em dash in the tree.
- `Nyc2025Visuals.tsx` follows `NycVisuals.tsx` exactly: a `CHROME` map, four
  `dynamic(..., { ssr: false })` calls, a `LazyVisual` gate at `rootMargin: '200px'`, and the
  centrepiece's loading element carrying the extra reserved block for the trailing filter row,
  legend, panel and table. Each `CHROME` entry holds `eyebrow` and `title` verbatim from this
  plan, `hasCaption: true`, and the same `well` object the loaded figure passes. It does **not**
  hold the caption text: `FigureSkeletonProps` has no `caption` prop, it reserves the line with a
  non-breaking space.
- Install the map with `npm install maplibre-gl@^5`, not `npm install maplibre-gl`. See
  assumption 15.
- Import `maplibre-gl/dist/maplibre-gl.css` inside `SalesMap.tsx`, not in `globals.css`, so the
  stylesheet lands in the map chunk rather than the route's critical CSS.
- If the MapLibre worker fails to instantiate under `next build`'s webpack output, switch the
  import to `maplibre-gl/dist/maplibre-gl-csp` and its accompanying `workerUrl` setting rather
  than disabling the worker. Report it either way.
- The four radiogroups and the neighbourhood table's header buttons use
  `useRovingRadioGroup` from `lib/roving-radio.ts`. Do not write a fifth key handler.
- Do not add a second convolution component, a second scale helper, a second ramp, or a second
  figure chrome. Everything under `components/viz/` and `lib/viz/` already exists and is reused.

**Acceptance.** 1, 2, 3, 4, 5, 7, 8, 9, 13, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 29,
30, 31, 32, 33, 34, 36, 37, 38, 39, 42, 43, 47, 48, 49 (entries e and f), 59, 60, 61, 62.

---

### Task 5 - `bird-gallery-assets`

**Goal.** Extend the existing forward-pass script from one photograph to eight, with real
attribution read from the source and a model-verified crop for every one.

**Files.** Exactly the Task 5 table.

**Depends on.** Nothing. Runs independently of the NYC tasks.

**Notes.**
- **Read `scripts/build-bird-assets.py` before changing it.** It already downloads, crops,
  resizes, writes a luminance matrix, runs a real `VGG16(weights='imagenet')` forward pass,
  selects channels by spatial variance and writes sprite sheets under a byte budget. The
  existing single-photo path and every asset it produces stay exactly as they are; the gallery is
  additive.
- Replace the module-level `SOURCE_IMAGE_URL` and `CROP_BOX` constants with a `SPECIES` table of
  eight entries, each carrying `id`, `common`, `scientific`, `expected_label`, `commons_file`,
  and an optional `crop_box`. The robin's entry keeps its current URL and its current
  `CROP_BOX = (805, 105, 2205, 1505)`, so its existing assets regenerate byte-identically.
- **Default crop rule when `crop_box` is absent:** the largest centred square of the source,
  then resize to the target. This is deterministic and needs no eye.
- **The model verifies the crop.** After the forward pass, assert that rank 1 of the top-16 is
  the species' `expected_label` and that its probability is at least 0.20. If it is not, print
  the actual top-3 and raise. Fix by supplying a `crop_box` and rerunning, or by substituting one
  of the two approved species. Never ship a species whose expected label is wrong, and never
  relabel a species to match what the model said.
- **Attribution comes from the Commons API, not from this document.** For each species, query
  `action=query&titles=File:<commons_file>&prop=imageinfo&iiprop=url|extmetadata`, strip HTML from
  `Artist`, `Credit` and `LicenseShortName`, and write them into `content/data/bird-gallery.ts`.
  If `LicenseShortName` does not match `/public domain|CC0/i`, raise and write nothing. Rate-limit
  to one request per 3 seconds with a descriptive `User-Agent`; the API returns a plain-text
  "too many requests" body rather than JSON when you go faster.
- Per species, write `gallery/<id>/thumb-96.webp`, `gallery/<id>/photo-320.webp` and
  `gallery/<id>/softmax.json` (top-16). Reuse the existing `save_webp_under_budget` helper with
  budgets of 6 KB and 30 KB.
- Do **not** write activation sprites or a luminance matrix for gallery species. Assumption 10
  explains why, and the budget in criterion 41 depends on it.
- Do not delete `softmax-top8.json` in this task. Task 6 deletes it in the same change that stops
  reading it.
- `content/data/bird-gallery.test.ts` asserts criteria 19 and 20 against the committed JSON.

**Acceptance.** 1, 5, 6, 14, 19, 20, 41. Additionally: 58. Regenerating with the robin's existing
crop box produces `bird-source.webp`, `luminance-28.json`, `activations.json` and all five
activation sprites byte-identical to the committed files.

---

### Task 6 - `bird-narrowing-figure`

**Goal.** Turn the decision figure into the gallery-driven narrowing Pizon asked for, without
regressing anything the remediation pass fixed.

**Files.** Exactly the Task 6 table.

**Depends on.** Task 5.

**Notes.**
- **Read the R4 section of `docs/plans/remediation-pass-1-project-pages.md` before editing
  `SoftmaxRace.tsx`.** R4.6 fixed a settle pulse that never released and a row that clipped at
  375 px. Both fixes must be intact when this task is done, and criterion 54 checks them.
- One thing criterion 54 asks for is **not** in the file today and is new work here: move the
  `useInViewOnce` ref onto a wrapper `<div>` mounted in the loading and error states as well as
  the ready state. In the shipped file the ref is on the div inside the
  `asset.status === 'ready'` branch, and the figure works anyway because R1.1 made the hook a
  callback ref that attaches on late mount. The always-mounted wrapper was R4.3's fix for
  `ActivationStrip.tsx`. Adopt it here too: this figure gains one loading state per species, so
  the node it observes should not come and go.
- Edit `SoftmaxRace.tsx` in place rather than renaming it. The name is now slightly narrow for
  what it does, and the alternative is a delete-plus-create that loses the diff against those
  fixes. Add a doc comment saying the component owns the gallery and why the filename stayed.
- The gallery state is local to this component. Do **not** add a context provider, do not touch
  `app/projects/bird-species-cnn/page.tsx`, and do not touch any other bird component. The
  gallery drives this figure and nothing else, per assumption 10.
- `useBirdAsset` already takes an arbitrary path under
  `public/projects/bird-species-cnn/`, so `useBirdAsset('gallery/bald-eagle/softmax.json')` works
  with no edit to that hook. Cache per species inside the component so switching back to a bird
  does not refetch.
- Update `CHROME.decision` in `BirdVisuals.tsx` to the new title, caption flag and well size, and
  keep it in step with the `Figure` props inside the component: that duplication is deliberate
  and load-bearing, since the skeleton prints them before the chunk arrives.
- `content/projects/bird-species-cnn.ts`: rewrite the `decision` section's prose so it argues the
  narrowing rather than describing the picture, add one sentence stating that no class scores
  exist before the final layer, update `demonstration` to promise the gallery, and extend
  `dataStatement` to say the gallery photographs are public-domain works with per-photo credit in
  the figure. Do not touch any other section, any figure, or the `TODO(pizon:)` about the Kaggle
  citation.
- `README.md` gains one **Data pipelines** section documenting all three offline scripts, what
  each needs, what each writes, and the rule that none of them runs in CI. This is the only task
  that edits the README, so it documents the NYC scripts too.

**Acceptance.** 1, 4, 5, 30, 40, 42, 44, 45, 46, 47, 48, 49 (entry g), 50, 51, 52, 53, 54.

---

## Out of scope

- **No Zillow data of any kind.** No listing text, no photograph, no Zestimate, no price history,
  no embed, no iframe, no cached response. One outbound search link, and that is the whole
  integration.
- **No PLUTO join in this wave.** It is documented in the generator as the fallback if a future
  snapshot's geocoding coverage collapses, and it is not built.
- **No vector tiles, no PMTiles, no tippecanoe.** The point payload is small enough to ship whole
  at 219 KB gzipped, and a tiling toolchain is a native binary the build agent may not have.
- **No predicted-versus-actual scatter and no residual map.** Both are good figures and both are
  a fifth figure on a page that already has four. Listed as a follow-up.
- **No live inference anywhere.** No TensorFlow.js, no ONNX, no WASM model. Both pages remain
  precomputed assets plus real arithmetic in the browser.
- **No auxiliary linear probes on VGG16 block outputs.** See assumption 9 and open question 10.
- **No changes to `PixelMatrix`, `ConvolutionSweep`, `LayerPyramid`, `ActivationStrip`,
  `TransferDiagram` or `ResultsLadder`.**
- **No change to the 2019 NYC page beyond one `related` field.**
- **No scheduled refresh of the 2025 data.** One dated snapshot. Re-running the pipeline later is
  a manual act and a new commit.
- **No neighbourhood one-hot in the model** and no target encoding, for the leakage reason in
  Task 3's notes.
- **No map on the landing page.** The landing page's budget is 120 KB gzipped and the map chunk
  is 320 KB.
- **No 3D, no pitch, no bearing, no terrain, no heatmap layer.**
- **No search box over addresses.** The detail panel is reached through the map or the
  neighbourhood table. An address search implies a lookup service this site does not have.
- **No bank content anywhere near either page.** Both projects are personal work; the employment
  boundary is untouched and no file added by this wave imports from `content/profile.ts`.

---

## Open questions for Pizon

Each has a default so nothing blocks, and each is small to reverse.

1. **URL structure.** Default: the new page is `/projects/nyc-home-sales-2025/` and the 2019
   page stays exactly where it is at `/projects/nyc-housing-prices/`. The alternative, giving the
   new page the old slug and moving the old page down a level, breaks every existing inbound link
   to the 2019 page and a static export cannot redirect. Say the word if you would rather take
   the hit.
2. **The model shortlist.** Default: median baseline, Ridge, k-nearest-neighbours, random forest,
   histogram gradient boosting, and the same boosting on a log target, with XGBoost added only if
   it installs cleanly. That is four model families and it maps onto the four mechanism
   explainers. If you want LightGBM or CatBoost in the ladder instead, both are one import and one
   rung, but both add a native dependency the build has to survive.
3. **The eight birds.** Default: robin, bald eagle, American goldfinch, great gray owl, American
   white pelican, Laysan albatross, great egret, ruby-throated hummingbird. All eight are ImageNet
   classes, so the network gets them right and the demonstration lands. Two approved substitutes
   are on the bench. If you would rather show a species ImageNet does **not** know, so the figure
   shows the network confidently wrong, that is a genuinely interesting page and a different one.
4. **How the map loads.** Default: it loads automatically once its container is within 200 px of
   the viewport, like every other figure on the site. The alternative is a click-to-load poster,
   which saves a phone visitor about 500 KB but costs the first impression. If you want the
   poster, the honest version of it is a static dot plot with no basemap, which is a second
   renderer to build.
5. **The Zillow link's wording.** Default: `Look up this address on Zillow`. It is deliberately
   not "view the listing", because a recorded 2025 sale usually has no live listing and the link
   lands on a search page. If you would rather drop the link entirely, it is one component and one
   helper.
6. **Non-residential sales.** Default: excluded. The 44,784 points are homes. Including storefronts,
   garages, warehouses and condo storage lockers would take the map to about 50,000 points and
   would make "what a New York home sold for" a slightly false title.
7. **Whether the 2019 page keeps its card on the landing page.** Default: yes, all three cards, in
   registry order with the 2025 page first. The alternative is to move the 2019 page behind the
   new one and off the landing grid.
8. **The dark basemap.** Default: OpenFreeMap's `dark` style. It was verified this session and it
   costs nothing. If it reads too heavy against the site's Ink background, the fallback is
   `positron` in both themes with a note in the figure caption.
9. **Refresh cadence.** Default: one snapshot, dated on the page. The dataset updates monthly. If
   you want the page to track it, that is a manual rerun and a commit, roughly ten minutes, and
   the page copy already prints the snapshot date so it stays honest between runs.
10. **The stronger version of the narrowing figure.** What ships is the real final softmax
    revealed in stages, which is honest and buildable. The architecturally literal version trains
    a small linear probe on each VGG16 block's pooled activations, so each stage shows a genuinely
    computed coarse grouping at that depth rather than a filtered view of the final answer. It
    needs a labelled training set, five short training runs and a defensible story about what a
    probe's classes mean. It is the best future enhancement on this page. Worth doing?
