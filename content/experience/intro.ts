/**
 * Page-level copy for /experience/. This is a synthesis of facts in content/profile.ts, not a
 * transcription of the résumé, which is why it lives here and not there. Every claim and every
 * number below traces to a string in content/profile.ts; see docs/plans/experience-page-v2.md
 * for the mapping. Do not add a fact this file cannot trace.
 */
export const experienceIntro = {
  heading: 'From ETL jobs to owning a credit data platform.',
  paragraph:
    'I started in 2020 building ETL processes and k-means segmentation models at ' +
    'ProMarketingHub, spent early 2022 at Whiterock.ai automating real-estate data ingestion ' +
    'on Airflow, and joined Webster Bank that June as a data scientist, assembling the credit ' +
    'approval history the dual-risk-rating models were later trained on. By 2024 I was ' +
    'leading the team of 8 that built those models, PD and LGD in house, replacing licensed ' +
    'vendor models and saving $1.5M a year. Since July 2025 I have owned the Credit Data Mart ' +
    'as Director of Credit Analytics, from the 15+ Snowflake pipelines underneath it to the ' +
    'executive applications running on top. Every step has taken me one layer further down ' +
    'the stack, closer to the data the reporting stands on.',
  metaDescription:
    'Roles, skills and education, plus short notes on the general methods behind the work: ' +
    'dual risk rating, weights of evidence, point-in-time snapshots and nearest neighbors.',
} as const
