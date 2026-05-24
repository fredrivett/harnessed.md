---
title: Audit
description: A rubric your agent runs against your codebase to score how harnessed it is.
---

Want to know where your project's harness is thin? Paste the prompt below into your agent of choice. It'll work through a rubric covering the [three pillars](/), score each item, and recommend the next step — grounded in what your codebase already uses.

## The prompt

```
Audit this repository against the rubric at
https://www.harnessed.md/audit/llms.txt and follow the instructions there.
```

That's it. The scoring scale, output format, and rubric items all live on the site, so the prompt stays small even as the rubric evolves. Your saved prompt never goes stale.

## Scoring

For each item, the agent assigns one number:

- **0** — not present
- **1** — token: exists but unused or trivially empty
- **2** — partial: inconsistent or incomplete coverage
- **3** — solid baseline
- **4** — thorough, well-maintained
- **5** — exemplary

Forcing a single number — instead of a tick or a hedge — keeps the report honest.

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

## After the audit

The aggregate is a tracking number, not a target. Most teams won't — and shouldn't — score 70/70. The point is to see where the harness is thin, fix the parts that matter for the work you actually do, and re-run when the codebase or practices shift.

If the agent recommends a parallel stack, push back. Extending what's already wired in is almost always cheaper than introducing a second tool to do the same job.
