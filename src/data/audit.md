---
title: Audit
description: A rubric your agent runs against your codebase to score how harnessed it is.
---

The audit is a rubric your agent runs against your codebase. It scores each [pillar](/) — Guides, Verification, Closing the loop — flags where the harness is thin, and recommends a next step grounded in the tooling you already use.

## The prompt

```
Audit this repository against the rubric at
https://www.harnessed.md/audit/llms.txt and follow the instructions there.
```

## Scoring

For each item, the agent assigns one number:

- **0** — not present
- **1** — token: exists but unused or trivially empty
- **2** — partial: inconsistent or incomplete coverage
- **3** — solid baseline
- **4** — thorough, well-maintained
- **5** — exemplary, no areas to improve

## Output

One markdown table per section, plus an aggregate at the end:

| Item | Score | Evidence | Next step |
| --- | --- | --- | --- |

The **Next step** column should reference the tooling already in the repo (extend the existing ESLint config, not introduce Biome alongside it). One concrete action per row.

## The rubric

### Guides

- **AGENTS.md at root** — exists in the portable form, with tool aliases like `CLAUDE.md` symlinked to it; focused enough that the agent will actually read it.
- **Commands documented** — build, test, lint, deploy paths the agent can run.
- **Boundaries declared** — explicit "always do / never do / ask first."
- **Path-scoped rules** — used where the codebase has distinct subtrees (e.g. `apps/api` vs `apps/web`).
- **Skills** — repeatable workflows captured in `SKILL.md` format per the [agentskills.io spec](https://agentskills.io/specification), placed in `.agents/skills/` with tool-specific paths configured or symlinked.
- **Hooks** — mechanical enforcement for what an advisory rule can't reliably guarantee.

### Verification

- **Types** — strict mode on; escape hatches (`any`, untyped) blocked at the linter.
- **Linting** — present, with rules targeting [agent anti-patterns](/verification#deterministic-checks) (stubs, untyped, etc.).
- **Security scanning** — security ruleset wired into CI ([Semgrep](https://semgrep.dev/p/owasp-top-ten), [Snyk](https://snyk.io/), or equivalent).
- **Tests** — unit and integration in place; tests don't mock the system they're verifying.
- **Agentic review** — PR review by other agents — hosted (e.g. [CodeRabbit](https://coderabbit.ai/), [Greptile](https://www.greptile.com/)) or [a local subagent set](/verification#the-subagent-reviewer-pattern).
- **Mutation testing** — for high-stakes code, signal beyond line coverage.

### Closing the loop

- **Durable learnings** — recurring defects get extracted into rules / tests / hooks, not absorbed as one-off prompt fixes.
- **Persistence** — a mechanism that carries learnings across sessions (memory file, `/learn` skill, [`SessionEnd` hook](https://code.claude.com/docs/en/hooks), or similar).
