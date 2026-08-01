export const meta = {
  name: 'portfolio-build',
  description: 'Plan → build → review+test → fix → gate, for a feature on the portfolio site',
  whenToUse:
    'Any non-trivial feature on the portfolio: a new project page, a visualization, a layout ' +
    'system. Opus 5 plans at extra-high effort, Sonnet 5 builds, Fable 5 reviews adversarially ' +
    'and Sonnet 5 verifies empirically — each in its own context.',
  phases: [
    { title: 'Plan', detail: 'Opus 5 (xhigh) writes the spec and splits it into disjoint tasks', model: 'opus' },
    { title: 'Build', detail: 'Sonnet 5 (high) implements each task in sequence', model: 'sonnet' },
    { title: 'Verify', detail: 'Fable 5 reviews and Sonnet 5 tests, in parallel per task' },
    { title: 'Fix', detail: 'Sonnet 5 applies every confirmed finding in one coherent pass', model: 'sonnet' },
    { title: 'Gate', detail: 'Sonnet 5 re-runs the full build and reports SHIP or BLOCK', model: 'sonnet' },
  ],
}

// ---------------------------------------------------------------------------
// The brief. Accepts a bare string or { brief } so the workflow can be invoked
// either way without the caller having to remember which.
// ---------------------------------------------------------------------------
const brief = typeof args === 'string' ? args : args?.brief
if (!brief) throw new Error('portfolio-build needs a brief: pass a string, or { brief: "..." }')

const MAX_TASKS = 4 // keeps the run inside the 15-agent budget: 1 + N + 2N + 2

const PLAN_SCHEMA = {
  type: 'object',
  required: ['planPath', 'summary', 'tasks'],
  properties: {
    planPath: { type: 'string', description: 'Path to the plan doc written under docs/plans/' },
    summary: { type: 'string', description: 'Two or three sentences on what ships' },
    assumptions: { type: 'array', items: { type: 'string' } },
    tasks: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'goal', 'files', 'acceptance'],
        properties: {
          id: { type: 'string', description: 'kebab-case task id' },
          goal: { type: 'string' },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exact file manifest this task owns. Must be disjoint from other tasks.',
          },
          acceptance: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const BUILD_SCHEMA = {
  type: 'object',
  required: ['taskId', 'filesChanged', 'buildPassed', 'report'],
  properties: {
    taskId: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    buildPassed: { type: 'boolean', description: 'Did an actually-executed npm run build succeed?' },
    deviations: { type: 'array', items: { type: 'string' } },
    todos: { type: 'array', items: { type: 'string' } },
    report: { type: 'string', description: 'Full handoff report for reviewer and tester' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  required: ['findings', 'verdict'],
  properties: {
    verdict: { type: 'string', description: 'Does the change meet the acceptance criteria?' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'claim', 'failure', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium'] },
          file: { type: 'string' },
          line: { type: 'number' },
          claim: { type: 'string' },
          failure: { type: 'string', description: 'Concrete scenario → wrong outcome' },
          fix: { type: 'string' },
        },
      },
    },
  },
}

const TEST_SCHEMA = {
  type: 'object',
  required: ['verdict', 'commands', 'failures'],
  properties: {
    verdict: { type: 'string', enum: ['SHIP', 'BLOCK'] },
    commands: {
      type: 'array',
      items: {
        type: 'object',
        required: ['command', 'result'],
        properties: {
          command: { type: 'string' },
          result: { type: 'string', description: 'pass | fail | not run — observed, never inferred' },
          notes: { type: 'string' },
        },
      },
    },
    failures: { type: 'array', items: { type: 'string' }, description: 'Real captured error output' },
    unmetCriteria: { type: 'array', items: { type: 'string' } },
    testsAdded: { type: 'array', items: { type: 'string' } },
  },
}

// ---------------------------------------------------------------------------
// Phase 1 — Plan. One Opus 5 pass at extra-high effort, so the whole feature is
// designed by a single mind before any of it is built.
// ---------------------------------------------------------------------------
phase('Plan')

const plan = await agent(
  `Write the implementation spec for this feature on the portfolio site.

BRIEF:
${brief}

Read the repository as it actually is before you design anything. Follow your output
format exactly: write the plan to docs/plans/<slug>.md, then split it into tasks whose
file manifests are strictly DISJOINT — tasks are built sequentially but reviewed in
parallel, and overlapping manifests produce conflicting edits.

Order tasks by dependency: shared types, tokens and layout before the pages that use them.
Produce at most ${MAX_TASKS} tasks; if the brief is larger than that, scope this run to the
${MAX_TASKS} highest-value tasks and list the remainder under "Out of scope".`,
  { agentType: 'planner', label: 'plan', phase: 'Plan', model: 'opus', effort: 'xhigh', schema: PLAN_SCHEMA },
)

if (!plan) throw new Error('Planning failed — nothing to build.')

let tasks = plan.tasks
if (tasks.length > MAX_TASKS) {
  const dropped = tasks.slice(MAX_TASKS).map(t => t.id)
  log(`⚠️ Planner returned ${tasks.length} tasks; running the first ${MAX_TASKS}. Deferred: ${dropped.join(', ')}`)
  tasks = tasks.slice(0, MAX_TASKS)
}

// Overlapping manifests are the one thing that silently corrupts this pipeline.
// Surface it rather than letting two developers fight over a file.
const owner = new Map()
for (const t of tasks) {
  for (const f of t.files || []) {
    if (owner.has(f)) log(`⚠️ File "${f}" is claimed by both ${owner.get(f)} and ${t.id} — edits may conflict.`)
    else owner.set(f, t.id)
  }
}

log(`Plan: ${plan.summary}`)
log(`${tasks.length} task(s): ${tasks.map(t => t.id).join(', ')}`)

// ---------------------------------------------------------------------------
// Phase 2 — Build. Sequential on purpose: each developer sees what the previous
// ones actually did, which is what keeps the design coherent across tasks and
// stops three agents from inventing three different Card components.
// ---------------------------------------------------------------------------
phase('Build')

const builds = []
for (const task of tasks) {
  const priorWork = builds.length
    ? `\n\nALREADY BUILT IN THIS RUN — reuse these, do not reinvent them:\n${builds
        .map(b => `- ${b.taskId}: ${b.filesChanged.join(', ')}`)
        .join('\n')}`
    : ''

  const build = await agent(
    `Implement this task from the spec at ${plan.planPath}. Read the spec first.

TASK: ${task.id}
GOAL: ${task.goal}

FILE MANIFEST — the files this task owns:
${task.files.map(f => `- ${f}`).join('\n')}

ACCEPTANCE CRITERIA:
${task.acceptance.map((a, i) => `${i + 1}. ${a}`).join('\n')}${priorWork}

Run npx tsc --noEmit as you go and npm run build before you return. Report the real
outcome — set buildPassed only if you actually observed a successful build.`,
    { agentType: 'developer', label: `build:${task.id}`, phase: 'Build', model: 'sonnet', effort: 'high', schema: BUILD_SCHEMA },
  )

  if (build) builds.push(build)
  else log(`⚠️ Build agent for ${task.id} returned nothing — that task is unverified.`)
}

if (!builds.length) throw new Error('Every build task failed — nothing to review.')

// ---------------------------------------------------------------------------
// Phase 3 — Verify. Two independent contexts per task: Fable 5 reasons about the
// code, Sonnet 5 runs it. Neither sees the other's conclusion, so agreement
// between them is real signal rather than one echoing the other.
// ---------------------------------------------------------------------------
phase('Verify')

const verified = await pipeline(builds, build => {
  const task = tasks.find(t => t.id === build.taskId) || tasks[builds.indexOf(build)]
  const criteria = (task?.acceptance || []).map((a, i) => `${i + 1}. ${a}`).join('\n')
  const context = `SPEC: ${plan.planPath}
TASK: ${build.taskId} — ${task?.goal || ''}

ACCEPTANCE CRITERIA:
${criteria}

FILES CHANGED: ${build.filesChanged.join(', ')}

DEVELOPER'S REPORT (treat as a claim to check, not as fact):
${build.report}`

  return parallel([
    () =>
      agent(
        `Review this change adversarially.\n\n${context}\n\nRead the actual diff and the changed files in full. Report only findings whose concrete failure you can name.`,
        { agentType: 'reviewer', label: `review:${build.taskId}`, phase: 'Verify', model: 'fable', effort: 'high', schema: REVIEW_SCHEMA },
      ),
    () =>
      agent(
        `Verify this change empirically.\n\n${context}\n\nRun the commands, capture the real output, and judge each acceptance criterion against what you observed. The static-export build is the gate.`,
        { agentType: 'tester', label: `test:${build.taskId}`, phase: 'Verify', model: 'sonnet', effort: 'high', schema: TEST_SCHEMA },
      ),
  ]).then(([review, test]) => ({ taskId: build.taskId, review, test }))
})

const results = verified.filter(Boolean)
const findings = results.flatMap(r =>
  (r.review?.findings || []).map(f => ({ ...f, taskId: r.taskId })),
)
const blockers = results.filter(r => r.test?.verdict === 'BLOCK')
const testFailures = results.flatMap(r => (r.test?.failures || []).map(f => `[${r.taskId}] ${f}`))

log(`${findings.length} review finding(s), ${blockers.length} failing test gate(s)`)

// ---------------------------------------------------------------------------
// Phase 4 — Fix. One agent, not one per finding: fixes routinely touch the same
// files, and a single context that sees every finding at once produces a
// coherent change instead of N agents overwriting each other.
// ---------------------------------------------------------------------------
let fix = null
if (findings.length || blockers.length) {
  phase('Fix')

  const findingList = findings.length
    ? findings
        .map(
          (f, i) =>
            `${i + 1}. [${f.severity}] ${f.file}${f.line ? ':' + f.line : ''} (${f.taskId})\n` +
            `   Claim: ${f.claim}\n   Failure: ${f.failure}\n   Suggested fix: ${f.fix}`,
        )
        .join('\n\n')
    : '(none)'

  const failureList = testFailures.length ? testFailures.join('\n\n') : '(none)'

  fix = await agent(
    `Apply the confirmed findings below to the codebase. Spec: ${plan.planPath}

REVIEW FINDINGS:
${findingList}

TEST FAILURES (real captured output):
${failureList}

Fix the highest severity first. Where a finding is wrong — the reviewer misread the code —
do not change anything; say which finding you rejected and why. Do not make a test pass by
weakening the test or the assertion it makes.

Run npm run build before returning and report the real result.`,
    { agentType: 'developer', label: 'fix', phase: 'Fix', model: 'sonnet', effort: 'high', schema: BUILD_SCHEMA },
  )
}

// ---------------------------------------------------------------------------
// Phase 5 — Gate. A final empirical pass over the whole build. Nothing ships on
// an agent's say-so; it ships on an observed green build.
// ---------------------------------------------------------------------------
phase('Gate')

const gate = await agent(
  `Final verification gate for the whole feature. Spec: ${plan.planPath}

${fix ? `Fixes were applied after the first round:\n${fix.report}\n` : 'No fixes were required after review.\n'}
Re-run the full suite from a clean state — typecheck, lint, npm run build, tests — and
confirm the static export in out/ actually contains every route the spec calls for.

Judge every acceptance criterion across all tasks:
${tasks.map(t => `[${t.id}]\n${t.acceptance.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}`).join('\n')}

Return SHIP only if you observed a passing build. Otherwise BLOCK with the shortest
list of things that must change.`,
  { agentType: 'tester', label: 'gate', phase: 'Gate', model: 'sonnet', effort: 'high', schema: TEST_SCHEMA },
)

return {
  plan: { path: plan.planPath, summary: plan.summary, assumptions: plan.assumptions || [] },
  tasks: tasks.map(t => t.id),
  filesChanged: [...new Set(builds.flatMap(b => b.filesChanged))],
  reviewFindings: findings,
  fixApplied: fix ? fix.report : null,
  gate: gate || { verdict: 'BLOCK', failures: ['Gate agent returned nothing — verify manually.'] },
  todos: builds.flatMap(b => b.todos || []),
}
