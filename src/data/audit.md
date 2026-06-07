---
title: Audit
description: A rubric your agent runs against your codebase to score how harnessed it is.
---

The audit is a rubric your agent runs against your codebase. It scores each [pillar](/) — Guides, Verification, Observation, Closing the loop — flags where the harness is thin, and recommends a next step grounded in the tooling you already use.

## The prompt

```text wrap
Audit this repository against the rubric at
https://www.harnessed.md/audit/llms.txt and follow the instructions there.
```

## Scoring

Score each item from evidence in the repo, not from intent. For each item, the agent assigns one number:

- **0** — not present
- **1** — token: exists but unused or trivially empty
- **2** — partial: inconsistent or incomplete coverage
- **3** — solid baseline
- **4** — thorough, well-maintained
- **5** — exemplary, no areas to improve

## Output

One markdown table per section, plus an aggregate at the end:

```text
| Item | Score | Evidence | Next step |
| --- | --- | --- | --- |
```

The **Next step** column should reference the tooling already in the repo (extend the existing ESLint config, not introduce Biome alongside it). One concrete action per row, or blank if the score is 5.

## The rubric

Each item links to where the best-practice guidance lives on [/guides](/guides), [/verification](/verification), or [/observation](/observation). Those sections are bundled into the rubric page the agent reads, so it grounds each score and recommendation without fetching anything.

### Guides

- **[AGENTS.md at root](/guides#agentsmd)** — exists in the portable form, with tool aliases like `CLAUDE.md` symlinked to it; focused enough that the agent will actually read it.
- **[Commands documented](/guides#agentsmd)** — build, test, lint, deploy paths the agent can run.
- **[Boundaries declared](/guides#agentsmd)** — explicit "always do / never do / ask first."
- **[Path-scoped rules](/guides#the-config-stack)** — used where the codebase has distinct subtrees (e.g. `apps/api` vs `apps/web`).
- **[Skills](/guides#skills)** — repeatable workflows captured in `SKILL.md` format per the [agentskills.io spec](https://agentskills.io/specification), placed in `.agents/skills/` with tool-specific paths configured or symlinked.
- **[Hooks](/guides#hooks)** — mechanical enforcement for what an advisory rule can't reliably guarantee.

### Verification

- **[Types](/verification#deterministic-checks)** — strict mode on; escape hatches (`any`, untyped) blocked at the linter.
- **[Linting](/verification#deterministic-checks)** — present, with rules targeting agent anti-patterns (stubs, untyped, etc.).
- **[Security scanning](/verification#deterministic-checks)** — security ruleset wired into CI ([Semgrep](https://semgrep.dev/p/owasp-top-ten), [Snyk](https://snyk.io/), or equivalent).
- **[Tests](/verification#tests)** — unit and integration in place; tests don't mock the system they're verifying.
- **[Agentic review](/verification#agentic-review)** — PR review by other agents — hosted (e.g. [CodeRabbit](https://coderabbit.ai/), [Greptile](https://www.greptile.com/)) or a [local subagent set](/verification#the-subagent-reviewer-pattern).
- **[Mutation testing](/verification#tests)** — for high-stakes code, signal beyond line coverage.

### Observation

- **[Error tracking](/observation#error-tracking)** — exceptions captured with stack traces, source maps, and deploy markers that tie incidents back to the PR that caused them.
- **[Usage analytics](/observation#usage-analytics)** — meaningful user actions instrumented per change; activation cohorts and drop-off measurable, not just pageviews.
- **[Agentic investigation](/observation#agentic-investigation)** — an agent (hosted like [Vercel Agent](https://vercel.com/agent), or a custom loop with MCP access to logs) runs on alert and posts a root-cause hypothesis before a human looks.

### Closing the loop

- **[Durable learnings](/verification#closing-the-loop)** — recurring defects get extracted into rules / tests / hooks, not absorbed as one-off prompt fixes.
- **[Persistence](/verification#wiring-up-the-loop)** — a mechanism that carries learnings across sessions (memory file, `/learn` skill, [`SessionEnd` hook](https://code.claude.com/docs/en/hooks), or similar).
