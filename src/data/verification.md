---
title: Verification
description: How to verify what an agent ships — the layered stack from deterministic checks to multi-agent review.
reading:
  - title: Code Review for Claude Code
    url: https://claude.com/blog/code-review
    author: Anthropic
    tag: Multi-agent PR review with a verification pass
  - title: LLM Verification Loops — Best Practices and Patterns
    url: https://timjwilliams.medium.com/llm-verification-loops-best-practices-and-patterns-07541c854fd8
    author: Tim Williams
    tag: Reflect → implement → review → resolve
  - title: Lint Against the Machine
    url: https://medium.com/@montes.makes/lint-against-the-machine-a-field-guide-to-catching-ai-coding-agent-anti-patterns-3c4ef7baeb9e
    author: Christopher Montes
    tag: A field guide to AI coding anti-patterns
  - title: Hooks Reference
    url: https://code.claude.com/docs/en/hooks
    author: Anthropic
    tag: PostToolUse and mechanical enforcement
  - title: 2026 Agentic Coding Trends Report
    url: https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf
    author: Anthropic
    tag: How coding agents are reshaping development
---

Verification is the highest-leverage layer of the [harness](/) — Anthropic calls giving an agent a way to verify its work _["the single highest-leverage thing you can do."](https://code.claude.com/docs/en/best-practices)_ Without it, the bottleneck just moves from writing code to reviewing it.

## The verification stack

Three tiers, ordered by cost. Fail fast, fail cheap — each tier exists to keep the next from doing work it shouldn't have to.

| Layer | Examples | When it runs | Cost |
| --- | --- | --- | --- |
| Deterministic | Types, linters, formatters, builds | Every file edit | Free, instant |
| Tests | Unit, integration, end-to-end | Every change, every PR | Cheap |
| Agentic review | Security, style, perf subagents; PR reviewers | Pre-merge | Tokens + minutes |

## Deterministic checks

The floor. Types, linters, and formatters fire on every edit and convert whole classes of error into compile-time failures. Agent-specific anti-patterns worth a custom lint rule:

- **`any` and untyped escape hatches.** Agents reach for `any` whenever the type is hard. Block with `@typescript-eslint/no-explicit-any` or Pyright strict mode.
- **Stub implementations.** `TODO`, `pass`, `throw new Error('not implemented')`. A grep-level rule catches these before review.
- **Security smells.** Snyk found 36–40% of AI-generated code contains a vulnerability. Run [Semgrep's free `p/owasp-top-ten` ruleset](https://semgrep.dev/p/owasp-top-ten) (or equivalent) in CI.

Wire these into a [PostToolUse hook](/guides#hooks) so failures land in the agent's next turn, not in CI.

## Tests

The pyramid still applies — unit, integration, end-to-end — but agents introduce specific failure modes:

- **Mocks of the system under test.** The test mocks the thing it's meant to verify, then asserts the mock returned what the mock was told to. Enforce real dependencies in integration suites.
- **Tautological assertions.** The assertion re-encodes the implementation, not the contract. Ask: _"what would this catch if the implementation regressed?"_ If nothing, it's decoration.
- **Tests written after the fact.** Tests written second mirror the code, not the spec. Make the agent write the failing test first.

Coverage is the wrong target — line coverage means lines _ran_, not that assertions are _meaningful_. The honest signal is **mutation testing**: [Stryker](https://stryker-mutator.io/) (JS/TS/.NET), [PIT](https://pitest.org/) (Java), [mutmut](https://mutmut.readthedocs.io/) (Python), and [cargo-mutants](https://github.com/sourcefrog/cargo-mutants) (Rust) introduce small changes — `>` → `>=`, drop a `!` — and re-run your tests. Surviving mutants are tests that weren't actually watching that behaviour; feed them back as the next round's target. Still niche, but [ThoughtWorks Vol. 34](https://www.thoughtworks.com/radar/techniques/mutation-testing) put it in Trial as _"the most honest signal for evaluating the real fault-detection capability of a test suite."_

## Agentic review

Once the cheap checks pass, layer on review by other agents. LLMs are better at reviewing than generating — a reviewer reliably catches what the author missed.

### Multi-agent PR review

Anthropic's [Code Review for Claude Code](https://claude.com/blog/code-review) (March 2026) dispatches specialist agents in parallel — logic, boundary conditions, API misuse, auth flaws, project conventions — and a meta-agent verifies each finding before posting. Substantive comments rose from 16% of PRs to 54% post-adoption, with <1% engineer disagreement on findings.

### The hosted reviewer landscape

Beyond Anthropic's own offering, a handful of options have emerged:

- **[CodeRabbit](https://coderabbit.ai/)** — cross-platform support across GitHub, GitLab, Bitbucket, and Azure DevOps
- **[Greptile](https://www.greptile.com/)** — full-repo context, pitched at large/legacy codebases
- **[cubic](https://www.cubic.dev/)** — emphasis on high-signal output; used by Granola, n8n, Cal.com
- **[Graphite Diamond](https://graphite.com/)** — built around Graphite's stacked-PR workflow
- **[Vercel Agent](https://vercel.com/agent)** — tight integration with Vercel deployments

They all do roughly the same job — pick by where your code already lives.

### The subagent reviewer pattern

Same shape, locally. Drop subagent definitions into [`.claude/agents/`](https://code.claude.com/docs/en/sub-agents) — each is a markdown file with a focused prompt and tool allowlist:

```markdown
---
name: security-reviewer
description: Review diff for auth, secret-handling, and injection risks
tools: Read, Grep, Glob
---
Audit the diff for OWASP Top 10 patterns. Flag only verified findings,
with file:line and a one-sentence fix. No speculation.
```

Add `style-reviewer.md` and `performance-reviewer.md`, dispatch concurrently, then loop:

```
Implement → Review (n parallel subagents) → Resolve → Re-review
```

Rounds 1–2 capture ~75% of the improvement; cap at 5–6 to avoid oscillation. Width beats depth — three reviewers in 30 seconds beats one monolithic prompt in two minutes.

Starting points: Anthropic's built-in [`/security-review`](https://www.anthropic.com/news/automate-security-reviews-with-claude-code), or [Every's compound-engineering plugin](https://github.com/EveryInc/compound-engineering-plugin) for a full plan → work → review → compound loop.

## Closing the loop

Verification only compounds when its signals flow back into the guides. When the same class of bug appears twice, the fix isn't a better prompt — it's a new lint rule, a new test fixture, or a new entry in AGENTS.md.

Three questions to ask after every failure:

1. **Should this have been caught earlier?** If a reviewer caught what a linter could have, add the lint rule.
2. **Is this a class or an instance?** Recurring defects become rules. One-offs just get fixed.
3. **Was the rule unwritten?** If the agent followed AGENTS.md and still made the mistake, the guide is missing something.

### Wiring up the loop

Four levels of automation, ordered by friction:

- **Quick capture.** In Claude Code, prefix a prompt with `#` to append a [memory entry](https://code.claude.com/docs/en/memory). Zero ceremony.
- **A `/learn` skill.** Slash command that takes a bug plus the diff and proposes a candidate rule, lint, or test fixture for review.
- **Session-end hooks.** A [`Stop` or `SessionEnd` hook](https://code.claude.com/docs/en/hooks) reflects over the session and appends learnings to a tracked file. Starters: [claude-mem](https://github.com/thedotmack/claude-mem), [claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler).
- **Dreaming.** [Anthropic's Managed Agents](https://claude.com/blog/new-in-claude-managed-agents) (May 2026) curate memory automatically via scheduled reflection. Harvey saw a ~6× completion-rate lift.

Whatever the mechanism: extract one durable artefact (rule, test, hook) per recurring defect — never a one-off prompt fix.

Verification is where the agent meets reality. The cleaner the layers beneath, the less you need humans at the top.
