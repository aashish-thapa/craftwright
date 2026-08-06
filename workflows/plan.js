export const meta = {
  name: 'plan',
  description: 'Research prior art, survey the codebase, and return an ordered implementation plan — reads only, writes no code',
  whenToUse:
    'Before implementing anything non-trivial. Returns a plan you approve or reject; /craftwright:build executes it. The split exists because a workflow cannot pause for sign-off mid-run.',
  phases: [
    { title: 'Triage', detail: 'is this design-shaped or mechanical, and what needs looking up' },
    { title: 'Survey', detail: 'conventions, composition root, existing seams, pinned versions' },
    { title: 'Research', detail: 'prior art from the wider community; skipped for mechanical work' },
    { title: 'Architect', detail: 'fold survey and research into the smallest ordered plan' },
    { title: 'Critique', detail: 'adversarial pass over the plan, then revise' },
  ],
}

const TRIAGE = {
  type: 'object',
  required: ['isDesignShaped', 'rationale', 'researchAngles'],
  properties: {
    isDesignShaped: { type: 'boolean' },
    rationale: { type: 'string' },
    researchAngles: { type: 'array', items: { type: 'string' } },
  },
}

const SURVEY = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'evidence'],
        properties: {
          claim: { type: 'string' },
          evidence: { type: 'string', description: 'file:line the claim is read from' },
          isUncertain: { type: 'boolean' },
        },
      },
    },
    pinnedVersions: { type: 'array', items: { type: 'string' } },
  },
}

const RESEARCH = {
  type: 'object',
  required: ['approaches'],
  properties: {
    approaches: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'optimizesFor', 'givesUp'],
        properties: {
          name: { type: 'string' },
          optimizesFor: { type: 'string' },
          givesUp: { type: 'string' },
          library: { type: 'string' },
          source: { type: 'string' },
        },
      },
    },
    recommendation: { type: 'string' },
  },
}

const PLAN = {
  type: 'object',
  required: ['headline', 'steps', 'notDoing', 'assumptions', 'verification'],
  properties: {
    headline: { type: 'string' },
    isMisScoped: { type: 'boolean' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['order', 'change', 'principle'],
        properties: {
          order: { type: 'integer' },
          change: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
          principle: { type: 'string', description: 'the craftwright principle this step protects, e.g. §DIP' },
        },
      },
    },
    notDoing: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    verification: { type: 'string' },
  },
}

const CRITIQUE = {
  type: 'object',
  required: ['objections'],
  properties: {
    objections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['objection', 'isBlocking'],
        properties: {
          objection: { type: 'string' },
          isBlocking: { type: 'boolean' },
          step: { type: 'integer' },
        },
      },
    },
    verdict: { type: 'string' },
  },
}

const SURVEY_BRIEFS = [
  {
    key: 'ground',
    brief:
      'Establish the ground this change lands on. How is the tree organized — by domain or by technical type? Which package would a reader expect this to live in? How does this codebase declare interfaces, inject dependencies, handle errors, and structure tests, with a file:line example of each? Where is the composition root, or is there none?',
  },
  {
    key: 'blast-radius',
    brief:
      'Establish the blast radius. Which specific files does this task touch, and which callers notice? Which seams (Protocols, ABCs, interfaces, registries) already exist near the work and could be reused instead of duplicated? Read the dependency manifest and lockfile and report the pinned versions of anything this task plausibly touches.',
  },
]

const task =
  typeof args === 'string'
    ? args.trim()
    : args && typeof args.task === 'string'
      ? args.task.trim()
      : ''

if (!task) {
  return 'craftwright:plan needs a task. Run it as: /craftwright:plan <what you want built>'
}

phase('Triage')
const triage = await agent(
  `Task: ${task}

Classify this task, then stop. Do not plan it and do not read more than you need to classify it.

A task is design-shaped when there is real design space — an architecture, protocol, data model, state machine, concurrency pattern, or failure-handling strategy where the wider engineering community has competing named solutions. A task is mechanical when the shape is already dictated: a rename, a typo, a new endpoint in an established REST API, a config value, following a convention this codebase already has.

If design-shaped, give up to two research angles, each phrased as the *problem shape* rather than the symptom ("idempotent message processing pattern", not "how do I stop duplicate orders").
If mechanical, return an empty researchAngles list and say in one line why the shape is already constrained.`,
  { label: 'triage', schema: TRIAGE, effort: 'low' },
)

const isDesignShaped = triage ? triage.isDesignShaped : true
if (triage && !isDesignShaped) {
  log(`mechanical task — skipping prior-art research: ${triage.rationale}`)
}
if (!triage) {
  log('triage node returned nothing — treating the task as design-shaped and researching it')
}

const researchAngles = isDesignShaped
  ? (triage && triage.researchAngles.length ? triage.researchAngles : [task]).slice(0, 2)
  : []

const gathered = await parallel([
  ...SURVEY_BRIEFS.map((b) => () =>
    agent(`Task the survey serves: ${task}\n\n${b.brief}`, {
      phase: 'Survey',
      label: `survey:${b.key}`,
      agentType: 'craftwright:surveyor',
      schema: SURVEY,
    }).then((data) => ({ kind: 'survey', key: b.key, data })),
  ),
  ...researchAngles.map((angle, i) => () =>
    agent(
      `Problem shape to research: ${angle}\n\nIt comes from this task: ${task}\n\nReport what the wider engineering community already knows about this class of problem. At least two distinct approaches with their tradeoffs, then one recommendation.`,
      {
        phase: 'Research',
        label: `research:${i + 1}`,
        agentType: 'craftwright:researcher',
        schema: RESEARCH,
      },
    ).then((data) => ({ kind: 'research', key: angle, data })),
  ),
])

const usable = gathered.filter(Boolean).filter((g) => g.data)
const surveys = usable.filter((g) => g.kind === 'survey')
const research = usable.filter((g) => g.kind === 'research')

if (!surveys.length) {
  return 'Both survey nodes failed, so there is no map of the codebase to plan against. Nothing was written. Re-run /craftwright:plan, or plan this one by hand.'
}
if (surveys.length < SURVEY_BRIEFS.length) {
  log(`only ${surveys.length} of ${SURVEY_BRIEFS.length} survey nodes returned — the plan rests on a partial map`)
}
if (isDesignShaped && !research.length) {
  log('every research node failed — the plan proceeds without prior art, which is worth knowing when you read it')
}

phase('Architect')
const brief = JSON.stringify(
  {
    task,
    survey: surveys.map((s) => ({ area: s.key, ...s.data })),
    priorArt: research.map((r) => ({ angle: r.key, ...r.data })),
  },
  null,
  2,
)

let plan = await agent(
  `Produce the plan for this task. Everything below was gathered by other agents: the survey is what the codebase actually is, the prior art is what the field already knows.

${brief}

Plan the smallest change that satisfies the task. Every adjacent problem the survey surfaced goes in notDoing, not in steps. Name the principle each step protects. State what proves it works.`,
  { label: 'plan', agentType: 'craftwright:architect', schema: PLAN },
)

if (!plan) {
  return 'The architect node returned nothing. Nothing was written. Re-run /craftwright:plan.'
}

phase('Critique')
const critique = await agent(
  `Argue against this plan. You did not write it and you are not looking for things to like about it.

${JSON.stringify(plan, null, 2)}

The survey it was built on:
${JSON.stringify(surveys.map((s) => ({ area: s.key, ...s.data })), null, 2)}

Attack it on: steps that grew past the task, seams introduced with no second implementer coming, a step that says "refactor" without naming files, an assumption the survey contradicts, a missing step the plan needs to work, and verification that would not actually catch a regression.

Mark an objection blocking only if executing the plan as written produces the wrong outcome. "I would have done it differently" is not blocking.`,
  { label: 'critique', agentType: 'craftwright:architect', schema: CRITIQUE },
)

const objections = critique ? critique.objections : []
const blocking = objections.filter((o) => o.isBlocking)

if (!critique) {
  log('critique node returned nothing — the plan below is unreviewed')
}

let unresolvedBlocking = blocking
if (blocking.length) {
  log(`${blocking.length} blocking objection(s) — revising the plan`)
  const revised = await agent(
    `Revise this plan to answer the blocking objections against it. Change only what the objections require; a revision that rewrites the whole plan has stopped being a revision.

Plan:
${JSON.stringify(plan, null, 2)}

Blocking objections:
${JSON.stringify(blocking, null, 2)}`,
    { phase: 'Critique', label: 'revise', agentType: 'craftwright:architect', schema: PLAN },
  )
  if (revised) {
    plan = revised
    unresolvedBlocking = []
  } else {
    log('revision node returned nothing — reporting the original plan with its objections unresolved')
  }
}

return {
  task,
  plan,
  priorArt: research.map((r) => ({ angle: r.key, recommendation: r.data.recommendation, approaches: r.data.approaches })),
  researchSkipped: !isDesignShaped,
  advisoryObjections: objections.filter((o) => !o.isBlocking),
  unresolvedBlockingObjections: unresolvedBlocking,
  nothingWasWritten: true,
  nextStep:
    'Read the plan, especially assumptions and notDoing. If it is right, run /craftwright:build and pass it this plan. The approval gate is here because a workflow cannot pause for sign-off mid-run.',
}
