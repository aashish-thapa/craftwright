export const meta = {
  name: 'build',
  description: 'Execute an approved plan, then review the diff through architecture, correctness, and performance lenses with adversarial verification and a bounded fix loop',
  whenToUse:
    'After /craftwright:plan produced a plan you approve. Pass it the plan. Leaves changes in the working tree — it never commits.',
  phases: [
    { title: 'Implement', detail: 'the only node that writes; serial by design' },
    { title: 'Review', detail: 'three lenses over the diff, in parallel, read-only' },
    { title: 'Verify', detail: 'an independent agent tries to refute each blocking finding' },
    { title: 'Fix', detail: 'apply what survived, then re-review' },
  ],
}

const MAX_ROUNDS = 2
const MAX_VERIFY_PER_LENS = 2

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['summary', 'file', 'isBlocking', 'failureScenario'],
        properties: {
          summary: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          isBlocking: { type: 'boolean' },
          failureScenario: {
            type: 'string',
            description: 'concrete inputs or state, and the wrong outcome that follows',
          },
          fix: { type: 'string' },
          principle: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['isRefuted', 'reasoning'],
  properties: {
    isRefuted: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
}

const LENSES = [
  {
    key: 'architecture',
    agentType: 'craftwright:senior-reviewer',
    brief:
      'Review it for architecture: responsibilities that should split, concrete dependencies where a seam belongs, a switch that wants polymorphism, duplicated knowledge, layering violations, visibility markers that do not match reach, and anything reinventing a stdlib or well-known package helper. Mark a finding blocking when the structure will force edits to working code on the next feature.',
  },
  {
    key: 'correctness',
    agentType: 'craftwright:bug-hunter',
    brief:
      'Review it for correctness: boundary conditions, unhandled error paths, the never-in-production tripwires, silent coercion, concurrency hazards, leaked resources, and retry loops missing a cap, backoff, or jitter.',
  },
  {
    key: 'performance',
    agentType: 'craftwright:perf-reviewer',
    brief:
      'Review it for performance: growth that outpaces its input, N+1 I/O, clients built inside loops, repeated identical work, sequential awaits over independent items, a blocked event loop, write amplification, and unbounded memory.',
  },
]

const DIFF_INSTRUCTION =
  'Find the changes yourself: run `git diff` for tracked edits and `git status --porcelain` for new files, then read any new file in full — an untracked file does not appear in `git diff` and is exactly where an unreviewed defect hides.'

const brief =
  typeof args === 'string' ? args.trim() : args ? JSON.stringify(args, null, 2) : ''

if (!brief) {
  return 'craftwright:build needs an approved plan. Run /craftwright:plan first, then pass its plan to /craftwright:build.'
}

phase('Implement')
const built = await agent(
  `Execute this approved plan. It has already been reviewed and approved by a human — implement what it says, not an improved version of it.

${brief}

The plan's notDoing list is binding. Leave every change in the working tree: do not commit, do not push, do not create a branch.`,
  { label: 'implement', agentType: 'craftwright:implementer' },
)

if (built === null) {
  return 'The implementer node failed. Check `git status` — it may have left partial changes in the working tree. Nothing was committed.'
}

const seen = new Set()
const fixedFindings = []
const advisory = []
const unverified = []
let refutedCount = 0
let round = 1
let lastFixReport = null
let fixesAwaitingReview = false

while (round <= MAX_ROUNDS) {
  const reviews = await parallel(
    LENSES.map((lens) => () =>
      agent(
        `A change was just made to this repository against the plan below. ${DIFF_INSTRUCTION}

${lens.brief}

The plan the change was built from, so you can tell an intentional decision from an accident:
${brief}

Report only what you can tie to a concrete failure. Findings you cannot defend cost the next node a round.`,
        {
          phase: 'Review',
          label: `${lens.key} r${round}`,
          agentType: lens.agentType,
          schema: FINDINGS,
        },
      ).then((result) => ({ lens: lens.key, findings: result ? result.findings : [] })),
    ),
  )

  const returned = reviews.filter(Boolean)
  if (returned.length < LENSES.length) {
    log(`round ${round}: ${LENSES.length - returned.length} lens(es) failed — this round reviewed less than it should have`)
  }

  const found = returned.flatMap((r) => r.findings.map((f) => ({ ...f, lens: r.lens })))
  advisory.push(...found.filter((f) => !f.isBlocking))

  // Deduplicate against every earlier round before spending verify agents: an
  // unfixed finding resurfaces verbatim next round, and re-refuting it is the
  // most expensive way to learn nothing changed.
  const fresh = []
  for (const f of found) {
    if (!f.isBlocking) continue
    const id = `${f.file}:${f.line === undefined ? '' : f.line}:${f.summary}`.toLowerCase()
    if (seen.has(id)) continue
    seen.add(id)
    fresh.push(f)
  }

  if (!fresh.length) {
    log(`round ${round}: no new blocking findings — the diff is clean at this depth`)
    fixesAwaitingReview = false
    break
  }

  const perLens = new Map()
  const queued = []
  let overCap = 0
  for (const f of fresh) {
    const taken = perLens.get(f.lens) || 0
    if (taken >= MAX_VERIFY_PER_LENS) {
      unverified.push(f)
      overCap += 1
      continue
    }
    perLens.set(f.lens, taken + 1)
    queued.push(f)
  }
  if (overCap) {
    log(`round ${round}: ${overCap} blocking finding(s) exceeded the ${MAX_VERIFY_PER_LENS}-per-lens verify cap; they are reported unverified rather than dropped`)
  }

  const verdicts = await parallel(
    queued.map((f) => () =>
      agent(
        `Another agent reported this finding against the current working tree. Your job is to refute it, not to agree with it.

${JSON.stringify(f, null, 2)}

${DIFF_INSTRUCTION}

Read the actual code. Refute it if the path is unreachable, a caller already guarantees the invariant, the framework or language handles it, the plan made this tradeoff deliberately, or the failure scenario simply does not follow from the code.

If you cannot refute it and you are genuinely unsure, do not refute it. A wrongly-dropped defect ships; a wrongly-kept one costs one fix.`,
        { phase: 'Verify', label: `refute ${f.lens} r${round}`, schema: VERDICT },
      ).then((verdict) => ({ finding: f, verdict })),
    ),
  )

  // Index-aligned rather than filtered: parallel() keeps position and returns null
  // for a failed agent, so the finding a dead verify node belongs to is only
  // recoverable by position.
  const judged = []
  verdicts.forEach((v, i) => {
    if (v && v.verdict) judged.push(v)
    else unverified.push(queued[i])
  })

  const confirmed = judged.filter((v) => !v.verdict.isRefuted).map((v) => v.finding)
  refutedCount += judged.filter((v) => v.verdict.isRefuted).length

  const unjudged = queued.length - judged.length
  if (unjudged > 0) {
    log(`round ${round}: ${unjudged} verify node(s) returned nothing — those findings are carried unverified`)
  }

  log(`round ${round}: ${confirmed.length} confirmed, ${judged.length - confirmed.length} refuted`)

  if (!confirmed.length) {
    log(`round ${round}: nothing survived verification`)
    fixesAwaitingReview = false
    break
  }

  phase('Fix')
  lastFixReport = await agent(
    `Fix these confirmed findings in the working tree. Each one survived an independent agent trying to refute it.

${JSON.stringify(confirmed, null, 2)}

Fix exactly these. Do not refactor around them, do not fix things you notice on the way past, do not commit.`,
    { label: `fix r${round}`, agentType: 'craftwright:implementer' },
  )

  if (lastFixReport === null) {
    log(`round ${round}: the fix node failed — the confirmed findings below are still present in the working tree`)
    return {
      implemented: built,
      confirmedButUnfixed: confirmed,
      fixedFindings,
      advisoryFindings: advisory,
      unverifiedFindings: unverified,
      roundsRun: round,
      nothingWasCommitted: true,
    }
  }

  fixedFindings.push(...confirmed)
  fixesAwaitingReview = true
  round += 1
}

if (fixesAwaitingReview) {
  log(`stopped at the ${MAX_ROUNDS}-round cap with the last round's fixes not re-reviewed`)
}

return {
  implemented: built,
  fixedFindings,
  lastFixReport,
  advisoryFindings: advisory,
  unverifiedFindings: unverified,
  refutedCount,
  roundsRun: Math.min(round, MAX_ROUNDS),
  fixesNotReReviewed: fixesAwaitingReview,
  nothingWasCommitted: true,
  nextStep:
    'Read `git diff` yourself before committing. Advisory findings were reported, not fixed — they are yours to triage.',
}
