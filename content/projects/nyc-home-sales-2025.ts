import type { ProjectRecord } from './types'
import { SNAPSHOT, CITYWIDE_2025 } from '@/content/data/nyc-2025-sales'
import { WINNER } from '@/content/data/nyc-2025-models'
import { formatCount, formatUSD } from '@/lib/format'

export const nycHomeSales2025: ProjectRecord = {
  slug: 'nyc-home-sales-2025',
  status: 'live',
  title: 'What New York homes actually sold for in 2025',
  tagline:
    'Every one of 44,784 recorded residential sales across the five boroughs, mapped and '
    + 'clustered, run through a real model ladder that a random forest wins.',
  summary:
    'The Department of Finance publishes every recorded home sale in the city. I turned '
    + 'calendar 2025’s slice of that register into a clustered street map, then re-ran the '
    + 'model-ladder exercise from the 2019 capstone on this new, cleaner ground truth: a '
    + 'citywide median floor, a regularised linear fit, nearest neighbours, two boosted-tree '
    + 'rungs and a random forest, every one scored the same way on the same held-out split.',
  year: '2025',
  demonstration:
    'The map below draws all 44,784 recorded 2025 home sales onto the real streets of New '
    + 'York, coloured by price and clustered so the browser can carry the weight. Click a '
    + 'dot, or a row in the neighbourhood table beneath it, and the sale opens: address, '
    + 'neighbourhood, exact recorded price, date, building type, floor area, and a link to '
    + 'look the address up on Zillow.',
  glyph: 'flow',
  stack: ['Node.js', 'Python', 'scikit-learn', 'MapLibre GL JS', 'OpenFreeMap'],
  dataset: {
    name: 'NYC Department of Finance, Citywide Annualized Calendar Sales (w2pb-icbu)',
    scale: '84,693 recorded 2025 sales to 44,784 residential, geocoded, $100,000 to $10,000,000',
    provenance:
      `Public NYC Open Data extract, downloaded ${SNAPSHOT.generatedAt}. Every dot on the `
      + 'map and every number on this page comes from a recorded sale or a model actually '
      + 'trained on those sales; nothing is simulated.',
    href: 'https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu',
  },
  headlineFigures: [
    {
      label: 'Recorded sales, 2025',
      value: formatCount(SNAPSHOT.points),
      source: 'NYC Department of Finance, dataset w2pb-icbu, calendar 2025, after every filter.',
    },
    {
      label: 'Citywide median sale price',
      value: formatUSD(CITYWIDE_2025.median),
      source: 'Computed from the same 44,784 recorded sales.',
    },
    {
      label: 'Test MAE, winning model',
      value: formatUSD(WINNER.mae),
      source: 'scripts/train-nyc-sales-2025.py, held-out test set, random forest.',
    },
  ],
  sections: [
    {
      id: 'problem',
      heading: 'A different question than 2019 asked',
      body: [
        'The 2019 capstone predicted what a Zillow listing asked for, a number a broker '
          + 'sets and a buyer can negotiate down from. This page predicts something else: '
          + 'what the New York City Department of Finance actually recorded as the sale '
          + 'price, the number a deed and a closing statement agree on. An asking price and '
          + 'a recorded price answer different questions on different years with different '
          + 'features, so the two model ladders on these two pages are not a rematch, and '
          + 'this page does not claim one model beat the other.',
        'What carries over is the method: clean the register, hold out a real test set, '
          + 'score every model the same way, and read off which family actually wins '
          + 'rather than assuming it going in.',
      ],
    },
    {
      id: 'data',
      heading: 'From 84,693 recorded sales to 44,784 mapped points',
      body: [
        'The Department of Finance publishes the Citywide Annualized Calendar Sales '
          + 'Update, dataset w2pb-icbu, and calendar 2025 alone holds 84,693 recorded '
          + 'sales. Four filters, applied in order, get from that raw file to the points '
          + 'on the map. 82,974 of the 84,693 rows carry a usable latitude and longitude. '
          + 'Of those, 49,953 fall inside the $100,000 to $10,000,000 bracket the 2019 '
          + 'capstone also used, the same range an underwriter would keep and a human '
          + 'would throw the rest out for. The sales priced at $0 or near it are not steep '
          + 'discounts: they are deed transfers between related parties, a parent adding a '
          + 'child to a deed or an estate settling, not a market transaction, and dropping '
          + 'them is why that bracket exists. The last filter keeps residential building '
          + 'classes only, houses, condos and co-ops, and leaves 44,784 sales, the number '
          + 'every dot, every model and every figure on this page is built from.',
      ],
    },
    {
      id: 'geography',
      heading: '44,784 dots is not a map you can draw one at a time',
      body: [
        'Every sale on this page carries a real latitude and longitude, straight from the '
          + 'Department of Finance’s own geocoding. Drawing 44,784 individual markers '
          + 'would freeze the page before the first paint finished, so the points go into '
          + 'a single GeoJSON source with MapLibre’s built-in clustering turned on: dots '
          + 'that sit close together at the current zoom level merge into one circle, '
          + 'sized by how many sales it holds and coloured by their mean price, and the '
          + 'browser draws the whole thing in WebGL. Zoom in and a cluster splits apart '
          + 'into the individual sales behind it.',
        'Colour on the map is one channel, mean price for a cluster and exact price for a '
          + 'single dot, and it is never the only place a number lives: the neighbourhood '
          + 'table below the map carries the same figures at the level the Department of '
          + 'Finance itself names, medians, quartiles and price per square foot, for all '
          + '245 neighbourhoods that cleared a four-sale floor.',
      ],
    },
    {
      id: 'models',
      heading: 'Four model families, and what each one is actually doing',
      hasVisual: true,
      body: [
        'Every model on this page answers the same question from the same inputs: '
          + 'borough, building type, month of sale, unit counts, land and floor area, '
          + 'year built, and the sale’s own coordinates. What differs is the mechanism. A '
          + 'regularised linear model fits one straight relationship between those inputs '
          + 'and price and penalises a slope that gets too confident. A nearest-neighbour '
          + 'model has no fitted relationship at all: it predicts a price as the average '
          + 'of the closest sales it has seen. A random forest averages many rough '
          + 'step-function trees, each one a different set of splits over the same '
          + 'features, and boosting builds one tree at a time, each new tree fitted to '
          + 'correct what the trees before it got wrong.',
        'The figure below draws all four mechanisms over one synthetic scatter with no '
          + 'dollar values attached, so what it compares is how a model fits, not what it '
          + 'predicts. The real numbers are in the next two figures.',
      ],
    },
    {
      id: 'ladder',
      heading: 'The real ladder, on the real 2025 sales',
      hasVisual: true,
      body: [
        'Predicting the citywide median for every sale sets the floor at a test MAE of '
          + '$645,311. A Ridge regression, a straight-line fit with an L2 penalty, brings '
          + 'that down to $586,820. k-nearest neighbours, averaging the 5 closest '
          + 'comparable sales, cuts it further to $459,160. Two boosted-tree rungs land '
          + 'close together: $411,731 fitted on the raw price and $399,411 fitted on its '
          + 'logarithm and exponentiated back to dollars before scoring, so the model is '
          + 'never rewarded for underpricing a mansion and overpricing a studio by the '
          + 'same dollar amount. The winner is a random forest, $377,558 test MAE, an R² '
          + 'of 0.622 and a MAPE of 40.2%, $267,753 below the citywide-median floor. The '
          + 'largest single step on the ladder belongs to k-nearest neighbours, which '
          + 'took $127,660 off the Ridge rung on its own.',
        'Every rung above was scored the same way: mean absolute error in dollars, on '
          + 'the same 8,957-row held-out test set, on a model that never saw those rows '
          + 'during fitting or tuning.',
      ],
    },
    {
      id: 'winner',
      heading: 'What the winning model actually leaned on',
      hasVisual: true,
      body: [
        'Permutation importance answers a narrower question than "what matters": how '
          + 'much worse does the random forest get, on the held-out test set, when one '
          + 'column is shuffled and every other column is left alone? Gross square feet '
          + 'leads by a wide margin, $569,623 of added error when it is shuffled, nearly '
          + 'as much as the next two features combined. Residential units and being in '
          + 'Manhattan follow, then longitude and latitude themselves, meaning the model '
          + 'is doing real work locating a sale within a borough, not just placing it in '
          + 'one.',
        'None of that is a surprise once you have seen the borough table: size and '
          + 'location were already carrying most of the 2019 ladder’s signal too. What is '
          + 'different this time is that the model can say so with a number attached to '
          + 'each feature, not just a ranking.',
      ],
    },
    {
      id: 'limits',
      heading: 'What this model cannot see',
      body: [
        'A random forest fitted on Department of Finance fields has no way to know '
          + 'whether a sale closed at arm’s length, whether a kitchen was renovated last '
          + 'year or thirty years ago, or what condition a building was in. It also '
          + 'cannot see a floor area that was never recorded: gross square feet is '
          + 'missing for most condo and co-op sales, which is why Manhattan’s median '
          + 'price per square foot rests on only 189 of its 12,661 sales, and every other '
          + 'per-square-foot figure on this page states its own denominator next to it '
          + 'rather than hiding a thin one.',
        '245 neighbourhoods is coarser than a single building, and a borough one-hot is '
          + 'coarser still: the model was deliberately not given a 245-column '
          + 'neighbourhood encoding, because at that resolution it would mostly be '
          + 'memorising which neighbourhood a coordinate already implies, not learning '
          + 'anything a real underwriter could act on elsewhere.',
      ],
    },
    {
      id: 'next-time',
      heading: 'What I’d do differently',
      body: [
        'The 2019 project logged two different tuned configurations and had to '
          + 'reconcile which one produced the published number. This one only ran once, '
          + 'with scripts/train-nyc-sales-2025.py printing every rung’s metrics to a log '
          + 'alongside the module it wrote, specifically so that question cannot come up '
          + 'again.',
        'The next real improvement is not a new model family, it is a better feature: a '
          + 'distance to the nearest subway stop or a proper renovation flag would very '
          + 'likely outrank several of the twelve features the random forest currently '
          + 'leans on, and neither one is in the Department of Finance’s own file.',
      ],
    },
  ],
  links: [
    {
      label: 'Sales map pipeline, this repository',
      href: 'https://github.com/pizonkhan/pizonkhan.github.io/blob/main/scripts/build-nyc-sales-2025.mjs',
      kind: 'repo',
    },
    {
      label: 'NYC Department of Finance sales data (w2pb-icbu)',
      href: 'https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu',
      kind: 'dataset',
    },
  ],
  dataStatement:
    `NYC Department of Finance, dataset w2pb-icbu, calendar 2025, downloaded ${SNAPSHOT.generatedAt}. `
    + 'Map clusters are coloured by mean sale price; individual dots carry their own exact '
    + 'recorded price. Neighbourhood figures with fewer than four sales are omitted.',
  related: {
    slug: 'nyc-housing-prices',
    label: 'The earlier version, on 2019 Zillow listings',
    direction: 'earlier',
  },
}
