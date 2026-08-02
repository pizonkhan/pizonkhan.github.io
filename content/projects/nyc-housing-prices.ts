import type { ProjectRecord } from './types'

export const nycHousingPrices: ProjectRecord = {
  slug: 'nyc-housing-prices',
  status: 'live',
  title: 'What a New York home is worth, and why',
  tagline:
    'Predicting list price across 59,350 NYC listings, and finding that location beats '
    + 'every other feature combined.',
  summary:
    'A mid-west REIT wanted to know what to ask for new-build homes across the five '
    + 'boroughs, and which structures return the most. I cleaned a 1,507-column Zillow '
    + 'extract down to 32 usable features, imputed the gaps with MICE, and worked a model '
    + 'ladder from a mean baseline to a tuned XGBoost regressor.',
  year: '2021',
  demonstration:
    'The map below is the real city with 2,244 aggregated cells of 2019 listing data laid on '
    + 'top. Three views switch the colour: how thick the listings are, what they were asking, '
    + 'and what that worked out to per square foot.',
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
    {
      id: 'problem',
      heading: 'The problem',
      body: [
        'A mid-west real estate investment trust builds and sells new homes across New '
          + 'York City. They wanted two things out of the same dataset: a defensible asking '
          + 'price for a new build in a given borough, and a ranked list of which structural '
          + 'features actually move that price.',
        'The raw material was a 2019 Zillow scrape of NYC listings, 75,630 rows and 1,507 '
          + 'columns. Most of what a scrape like that carries is listing-agent boilerplate: '
          + 'broker names, MLS identifiers, duplicate geocoding under five different column '
          + 'names. The city itself does most of the real work here, and the rest of this '
          + 'page is spent proving that rather than asserting it.',
      ],
    },
    {
      id: 'data',
      heading: 'From 1,507 columns to 32',
      body: [
        '1,507 raw columns collapsed to 32 usable features. What survived the cut was the '
          + 'structural core of a listing: bedrooms, bathrooms, living area, lot size, year '
          + 'built, borough, and the coordinates themselves. Everything else was metadata '
          + 'about the listing rather than about the home.',
        'List price ranged from four-figure data entry errors to eight-figure penthouses, '
          + 'and a model should be scored on neither. Restricting the working set to '
          + '$100,000 to $10,000,000 dropped the rows a human underwriter would also throw '
          + 'out, and left 62,456 listings for the rest of the pipeline.',
      ],
    },
    {
      id: 'imputation',
      heading: 'Why the gaps needed MICE',
      hasVisual: true,
      body: [
        'A mean or median fill answers a missing value with the same number no matter '
          + 'what else is true about the listing. Every filled row lands on one point, the '
          + 'distribution’s spread collapses around it, and a model trained on the '
          + 'result learns that a gap carries no information, when in this dataset it did: '
          + 'older buildings were far more likely to be missing a year built, and smaller '
          + 'listings were far more likely to be missing a lot size. The gaps were not '
          + 'random.',
        'MICE (Multiple Imputation by Chained Equations) fills a missing value with a '
          + 'prediction from every other column in that row, using a gradient-boosting '
          + 'estimator, then repeats the pass so a later fill can correct an earlier one. A '
          + 'missing lot size on a five-bedroom colonial lands near where five-bedroom '
          + 'colonials actually sit, not at the citywide average. The distribution keeps its '
          + 'shape instead of collapsing into a spike.',
      ],
    },
    {
      id: 'location',
      heading: 'Location beats everything else combined',
      hasVisual: true,
      body: [
        'A Spearman correlation heatmap is a reasonable first pass at feature importance, '
          + 'and it ranked latitude and longitude near the bottom of 23 features. That '
          + 'ranking measures a linear, monotonic relationship, and location’s effect '
          + 'on price is neither: the same latitude means something completely different in '
          + 'Manhattan than in Staten Island.',
        'The tree-based models told a different story. Feature importance from the random '
          + 'forest and XGBoost runs put longitude seventh of twenty-three, ahead of living '
          + 'area and bedroom count. Five boroughs, five distributions, and Manhattan’s '
          + 'spread alone runs past four times Brooklyn’s. A tree model can split on '
          + 'longitude and recover that structure directly. A linear correlation cannot.',
      ],
    },
    {
      id: 'approach',
      heading: 'The model ladder',
      hasVisual: true,
      body: [
        'Every model in the ladder was scored the same way: mean absolute error in dollars '
          + 'on a held-out test set. Predicting the citywide mean for every listing sets the '
          + 'floor at $495,843. A plain linear regression cuts that by roughly a quarter. '
          + 'Nearest neighbours and random forests each buy a further, smaller step.',
        'The largest single jump came last, and it did not come from a better algorithm. '
          + 'XGBoost with default settings on the raw target landed at $220,372. Tuned and '
          + 'trained on the log of price, then exponentiated back, it landed at $191,771, a '
          + 'test R² of 0.723. A skewed dollar target punishes a model for missing the '
          + 'handful of eight-figure listings by exactly as much as it rewards it for the '
          + 'rest; the log transform corrects that before the model ever sees the data.',
      ],
    },
    {
      id: 'result',
      heading: 'What it found',
      body: [
        'The model’s answer, and the borough table’s, point the same way: build '
          + 'where the price ceiling is highest and the volume still supports it. '
          + 'Manhattan’s median list price, $1,870,000, is nearly double '
          + 'Brooklyn’s and over three times Staten Island’s, and from the 20th '
          + 'percentile up it carries that premium at every step.',
        'Brooklyn is the second-best combination of price and volume, a $969,500 median '
          + 'across 12,794 listings, well ahead of Manhattan’s 3,575. Queens follows at '
          + 'a $725,000 median across the largest single pool of listings in the dataset, '
          + '22,049. That is the order I gave back to the client: Manhattan first for '
          + 'margin, Brooklyn second for margin and depth together, Queens third for reach.',
      ],
    },
    {
      id: 'next-time',
      heading: 'What I’d do differently',
      body: [
        'The first fix has nothing to do with the model. Two different notebooks in this '
          + 'project’s history reached two different tuned XGBoost configurations, at '
          + 'test MAE $191,771 and $198,191, and reconciling which one actually produced the '
          + 'published report took more effort than the tuning itself. A run that is not '
          + 'logged with its own configuration and its own number is a run you have to '
          + 're-derive later.',
        'The second is upstream of the model entirely: pull in a location feature that '
          + 'means something a raw coordinate does not, distance to the nearest subway stop '
          + 'or a school district boundary, so the tree models have something more legible '
          + 'than latitude and longitude to split on.',
      ],
    },
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
  related: {
    slug: 'nyc-home-sales-2025',
    label: "Rebuilt on the city's own 2025 sale records",
    direction: 'later',
  },
}
