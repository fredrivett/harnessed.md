---
title: Verification
description: How to verify what an agent ships — the layered stack from deterministic checks to multi-agent review.
reading:
  - title: Code Review for Claude Code
    url: https://claude.com/blog/code-review
    author: Anthropic
    tag: Multi-agent PR review with a verification pass
  - title: "Honk Part 3: Feedback Loops for Background Coding Agents"
    url: https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3
    author: Spotify Engineering
    tag: Deterministic verifiers and an LLM judge in production
  - title: Mutation testing for the agentic era
    url: https://blog.trailofbits.com/2026/04/01/mutation-testing-for-the-agentic-era/
    author: Trail of Bits
    tag: Why mutation testing matters when agents write the tests
  - title: AI Is Writing Our Code Faster Than We Can Verify It
    url: https://oreillyradar.substack.com/p/ai-is-writing-our-code-faster-than
    author: Andrew Stellman
    tag: The growing gap between generation speed and verification
---

Verification is the highest-leverage layer of the [harness](/) — Anthropic calls it _["the single highest-leverage thing you can do."](https://code.claude.com/docs/en/best-practices)_ Without it, the bottleneck just moves from writing code to reviewing it.

## The verification stack

Three tiers, ordered by cost. Fail fast, fail cheap — each tier exists to keep the next from doing work it shouldn't have to.

| Layer | Examples | When it runs | Cost |
| --- | --- | --- | --- |
| [Deterministic](#deterministic-checks) | Types, linters, formatters, builds | Every file edit | Free, instant |
| [Tests](#tests) | Unit, integration, end-to-end | Every change, every PR | Cheap |
| [Agentic review](#agentic-review) | Security, style, perf subagents; PR reviewers | Pre-merge | Tokens + minutes |

## Deterministic checks

The floor. Types, linters, and formatters fire on every edit and convert whole classes of error into compile-time failures.

[Snyk's research](https://snyk.io/reports/secure-adoption-in-the-genai-era/) puts around 40% of AI-generated code as containing a vulnerability, so this layer carries more weight in the agent era than it did before. Agent-specific anti-patterns worth a custom lint rule:

- **`any` and untyped escape hatches.** Agents reach for `any` whenever the type is hard. Block with `@typescript-eslint/no-explicit-any` or Pyright strict mode.
- **Stub implementations.** `TODO`, `pass`, `throw new Error('not implemented')`. A grep-level rule catches these before review.
- **Security smells.** Run [Semgrep's free `p/owasp-top-ten` ruleset](https://semgrep.dev/p/owasp-top-ten) (or equivalent) in CI.

Wire these into a [PostToolUse hook](/guides#hooks) so failures land in the agent's next turn, not in CI.

## Tests

The pyramid still applies — unit, integration, end-to-end — but agents introduce specific failure modes:

- **Mocks of the system under test.** The test mocks the thing it's meant to verify, then asserts the mock returned what the mock was told to. Enforce real dependencies in integration suites.
- **Tautological assertions.** The assertion re-encodes the implementation, not the contract. Ask: _"what would this catch if the implementation regressed?"_ If nothing, it's decoration.
- **Tests written after the fact.** Tests written second mirror the code, not the spec. Make the agent follow [red-green](https://martinfowler.com/bliki/TestDrivenDevelopment.html): failing test first, then the code that makes it pass.

Coverage is the wrong target — line coverage means lines _ran_, not that assertions are _meaningful_.

The honest signal is **mutation testing**: [Stryker](https://stryker-mutator.io/) (JS/TS/.NET), [PIT](https://pitest.org/) (Java), [mutmut](https://mutmut.readthedocs.io/) (Python), and [cargo-mutants](https://github.com/sourcefrog/cargo-mutants) (Rust) introduce small changes — `>` → `>=`, drop a `!` — then re-run your tests.

Surviving mutants are tests that weren't actually watching that behaviour; feed them back as the next round's target.

Still niche, but [ThoughtWorks Vol. 34](https://www.thoughtworks.com/radar/techniques/mutation-testing) put it in Trial as _"the most honest signal for evaluating the real fault-detection capability of a test suite."_

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
- **[Vercel Agent](https://vercel.com/agent)** — sandbox-validates suggested patches against your real build, tests, and linters before posting

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

<pre><code>Implement → Review (n parallel subagents) → Resolve → Re-review</code></pre>

Rounds 1–2 capture [~75% of the improvement](https://dev.to/yannick555/iterative-review-fix-loops-remove-llm-hallucinations-and-there-is-a-formula-for-it-4ee8) (round 1 catches half the errors, round 2 catches half of what's left); cap at 5–6 to avoid oscillation. Width beats depth — three reviewers in 30 seconds beats one monolithic prompt in two minutes.

Starting points: Anthropic's built-in [`/security-review`](https://www.anthropic.com/news/automate-security-reviews-with-claude-code), or [Every's compound-engineering plugin](https://github.com/EveryInc/compound-engineering-plugin) for a full plan → work → review → compound loop.

## Closing the loop

Verification only compounds when its signals flow back into the guides. When the same class of bug appears twice, the fix isn't a better prompt — push it into the harness. If a deterministic check can catch the pattern — a lint rule, a hook, or a test — use that. Otherwise pick the advisory form that fits: a path-scoped rule for code-area specifics, a skill for workflows, AGENTS.md for what every session needs to know.

Three questions to ask after every failure:

1. **Should this have been caught earlier?** Push enforcement upstream — to whichever cheaper layer would catch it next time.
2. **Pattern or one-off?** Patterns get hard-coded into the harness; one-offs just get fixed.
3. **Did an advisory rule fail to stick?** Upgrade it to a deterministic check — a hook, lint, or test.

### Wiring up the loop

Four levels of automation, ordered by friction:

- **Quick capture.** In Claude Code, prefix a prompt with `#` to append a [memory entry](https://code.claude.com/docs/en/memory). Zero ceremony.
- **A `/learn` skill.** Slash command that takes a bug plus the diff and proposes a candidate rule, lint, or test for review.
- **Session-end hooks.** A [`Stop` or `SessionEnd` hook](https://code.claude.com/docs/en/hooks) reflects over the session and appends learnings to a tracked file. Starters: [claude-mem](https://github.com/thedotmack/claude-mem), [claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler).
- **Dreaming.** [Anthropic's Managed Agents](https://claude.com/blog/new-in-claude-managed-agents) (May 2026) curate memory automatically via scheduled reflection. Harvey saw a ~6× completion-rate lift.

Whatever the mechanism: push one improvement into the harness (rule, test, hook) per recurring defect — never a one-off prompt fix.

Verification is where the agent meets reality. The cleaner the layers beneath, the less you need humans at the top.
