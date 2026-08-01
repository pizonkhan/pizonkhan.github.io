/**
 * Single source of truth for biographical fact. Everything here comes from Pizon's
 * resume: nothing in this file may be invented, embellished or rounded up. Components
 * render this; they never hardcode a title, date or metric of their own.
 */

export interface Role {
  title: string
  start: string
  end: string
  highlights: string[]
}

export interface Employer {
  company: string
  location: string
  roles: Role[]
}

export interface Education {
  school: string
  credential: string
  detail?: string
  graduated: string
}

export const profile = {
  name: 'Pizon Khan',
  headline: 'Director, Credit Analytics',
  company: 'Webster Bank',
  location: 'New York City',
  email: 'pizon.skhan@gmail.com',
  links: {
    github: 'https://github.com/pizonkhan',
    linkedin: 'https://linkedin.com/in/pizon-khan',
  },
  /**
   * The positioning: not "a data engineer who also does ML", but someone who owns a
   * bank's credit data platform end to end: the pipelines, the risk models on top of
   * them, and the applications the business actually uses.
   */
  summary:
    'I build the data platforms banks run their credit decisions on, from the Snowflake ' +
    'pipelines and dimensional models underneath, to the risk models trained on them, to ' +
    'the LLM-backed applications that put both in front of executives.',
} as const

export const experience: Employer[] = [
  {
    company: 'Webster Bank',
    location: 'Stamford, CT',
    roles: [
      {
        title: 'Director, Credit Analytics',
        start: 'Jul 2025',
        end: 'Present',
        highlights: [
          'Architected and own the Credit Data Mart, the bank’s system of record for credit reporting: conformed loan-, customer- and collateral-level tables fed by 15+ Snowflake pipelines producing daily and monthly point-in-time snapshots, consumed by 10+ enterprise teams (~100 users) and published each month-end as the basis for earnings and shareholder reporting.',
          'Built automated data-quality and anomaly-detection pipelines that surface outliers, inconsistencies and reconciliation breaks before publication, cutting month-end remediation from 1–2 weeks to under 1 week.',
          'Designed and shipped the Credit Deal Tracker, a Snowflake Streamlit application processing ~60 executive credit deals per month: OCR and regex-based text and table extraction from deal memos, Cortex LLM summarization, and lifecycle tracking of approvals, comments and change logs in a governed database.',
          'Extended the platform with an executive dashboard, auto-generated committee decks and an embedded LLM chatbot answering natural-language questions over deal data, cutting per-deal effort from ~60 minutes to 5–10 and distributing intake across ~24 users.',
          'Lead infrastructure, tooling and AI architecture decisions for the Credit organization, scoping and presenting enterprise programs to executive stakeholders, IT and EPO, then serving as hands-on technical implementer.',
        ],
      },
      {
        title: 'Manager, Data Science',
        start: 'Feb 2024',
        end: 'Jul 2025',
        highlights: [
          'Led a team of 8 building in-house PD and LGD dual-risk-rating models for Commercial Real Estate, Sponsor & Specialty and Asset-Based Lending portfolios, replacing licensed Moody’s models and saving $1.5M annually; binned-variable logistic regression with weights of evidence achieved ~89% (PD) and ~70% (LGD) ROC on CRE.',
          'Built a Python application parsing rich text and images to detect bias language in credit appraisal documents, cutting review time from ~60 minutes to under 2 minutes per document for a 15-person team and eliminating a ~$25K/year vendor subscription while improving detection accuracy.',
          'Developed a React and TypeScript loan-origination web application integrated with Snowflake for live data flow, operationalizing the dual-risk-rating models for commercial lending.',
        ],
      },
      {
        title: 'Data Scientist',
        start: 'Jun 2022',
        end: 'Feb 2024',
        highlights: [
          'Extracted and consolidated historical credit approval data across internal systems and third-party sources (TREPP), imputing gaps via k-nearest-neighbor clustering, to establish the analytical foundation for the bank’s dual-risk-rating models.',
          'Partnered with credit underwriters to translate underwriting judgment into quantifiable risk drivers aligned to observed default and loss patterns across CRE, S&S and ABL portfolios.',
        ],
      },
    ],
  },
  {
    company: 'Whiterock.ai',
    location: 'New York, NY',
    roles: [
      {
        title: 'Data Scientist',
        start: 'Jan 2022',
        end: 'May 2022',
        highlights: [
          'Automated ingestion of Black Knight and third-party real-estate data using Apache Airflow on GCP, reducing processing time 20% and improving data quality.',
          'Performed EDA and ETL on large property datasets to engineer risk drivers for home-price models.',
        ],
      },
    ],
  },
  {
    company: 'ProMarketingHub',
    location: 'Queens, NY',
    roles: [
      {
        title: 'Junior Data Scientist',
        start: 'Jul 2020',
        end: 'Oct 2021',
        highlights: [
          'Built ETL processes and k-means customer segmentation models in Python to power targeted marketing campaigns.',
        ],
      },
    ],
  },
]

export const education: Education[] = [
  {
    school: 'Georgia Institute of Technology',
    credential: 'M.S., Computer Science',
    detail:
      'In progress · GPA 3.7 / 4.0 · Concentration in Big Data Systems, Cloud Computing, Machine Learning and Large Language Models.',
    graduated: 'In progress',
  },
  {
    school: 'Queens College, City University of New York',
    credential: 'B.S., Computer Science & Applied Mathematics',
    detail: 'Double major.',
    graduated: '2020',
  },
]

export const skills = [
  {
    group: 'Languages',
    items: ['Python', 'SQL', 'SAS', 'R', 'Java', 'C++', 'TypeScript', 'JavaScript', 'Bash', 'LaTeX'],
  },
  {
    group: 'Data & Cloud',
    items: [
      'Snowflake (Snowpark, Streamlit, Cortex, Snowpipe, Tasks & Streams)',
      'AWS (SageMaker, S3, Lambda)',
      'GCP (BigQuery)',
      'Databricks',
      'Apache Airflow',
      'Spark',
      'dbt',
    ],
  },
  {
    group: 'Data Engineering',
    items: [
      'ETL/ELT pipeline design',
      'Dimensional & data-mart modeling',
      'Point-in-time snapshots',
      'Slowly changing dimensions',
      'Orchestration',
      'Data quality & reconciliation frameworks',
      'CI/CD',
      'Git',
    ],
  },
  {
    group: 'AI & Machine Learning',
    items: [
      'Large Language Models',
      'RAG',
      'Prompt engineering',
      'NLP',
      'OCR (Tesseract, ABBYY)',
      'scikit-learn',
      'XGBoost',
      'TensorFlow/Keras',
      'PyTorch',
      'Logistic regression',
      'Weights of evidence',
      'Clustering',
      'Model back-testing',
    ],
  },
  {
    group: 'Applications & Visualization',
    items: ['Streamlit', 'React', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'REST APIs', 'Docker', 'A/B testing'],
  },
]
