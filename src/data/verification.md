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

Verification is the highest-leverage layer of the [harness](/). Anthropic calls giving the agent a way to verify its work _["the single highest-leverage thing you can do."](https://code.claude.com/docs/en/best-practices)_ Agents produce far more code than humans can read line-by-line; without strong verification the bottleneck just moves from writing to reviewing.

## The verification stack

Three tiers, ordered by cost and depth. Cheap checks run on every edit; expensive ones gate the merge.

| Layer | Examples | When it runs | Cost |
| --- | --- | --- | --- |
| Deterministic | Types, linters, formatters, builds | Every file edit | Free, instant |
| Tests | Unit, integration, end-to-end | Every change, every PR | Cheap |
| Agentic review | Security, style, perf subagents; PR reviewers | Pre-merge | Tokens + minutes |

The principle is the same as classical CI — fail fast, fail cheap. Agentic review is powerful but slow and expensive, so the layers below must catch everything mechanical first.

## Deterministic checks

This is the floor. Types, linters, and formatters fire on every edit and turn whole classes of error into compile-time failures.

A few anti-patterns agents reach for that are worth a custom lint rule:

- **`any` and untyped escape hatches** — when an agent can't figure out the type, it reaches for `any` and moves on. Block it with `@typescript-eslint/no-explicit-any` or Pyright strict mode.
- **Stub implementations** — `TODO`, `pass`, `throw new Error('not implemented')`. A grep-level rule catches these before review.
- **Security smells** — Snyk found 36–40% of AI-generated code contains a vulnerability. Run [Semgrep's free `p/owasp-top-ten` ruleset](https://semgrep.dev/p/owasp-top-ten) (or equivalent) in CI.

## Hooks beat rules

Rules in AGENTS.md are advisory — the agent reads them and may or may not follow them. Hooks are deterministic. If you've written "always run tests after a change" and the agent keeps skipping it, convert it to a hook:

```jsonc
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npm test && npm run lint" }]
      }
    ]
  }
}
```

Six lines of config. The agent now sees the failure in its next turn and fixes it before you read the diff. The same pattern applies to formatters, type checks, migration validators, and anything else that should never be skipped.

## Tests

The standard pyramid still applies — unit, integration, end-to-end — but agents make the failure modes more interesting. Three patterns worth catching:

- **Mocks of the system under test.** When an agent can't get a real fixture working, it mocks the very thing the test claims to verify. The assertion then checks that the mock returned what the mock was told to return, and proves nothing. Enforce real dependencies for the system under test in integration suites.
- **Tautological assertions.** Re-encoding the implementation as the assertion rather than the contract. The question to ask in review: _"what would this test catch if the implementation regressed?"_ If the answer is "nothing," the test is decoration.
- **Tests written after the fact.** An agent that writes the implementation first and the test second tends to mirror its own code. Make it write the failing test first, then the fix — the test-first ordering is the difference between proving behaviour and re-describing it.

Coverage is the wrong target. Hitting 90% line coverage means lines ran — it says nothing about whether the assertions are meaningful. The honest answer is **mutation testing**: tools like [Stryker](https://stryker-mutator.io/) (JS/TS/.NET), [PIT](https://pitest.org/) (Java), [mutmut](https://mutmut.readthedocs.io/) (Python), and [cargo-mutants](https://github.com/sourcefrog/cargo-mutants) (Rust) introduce tiny changes — flipping `>` to `>=`, dropping a `!`, changing `+` to `-` — and re-run your tests. If the tests still pass, the mutant survived: the test wasn't watching that behaviour. Feed the survivors back to the agent as the next round's target.

Mutation testing is still niche — [ThoughtWorks Radar Vol. 34 (April 2026)](https://www.thoughtworks.com/radar/techniques/mutation-testing) placed it in Trial, calling it _"the most honest signal for evaluating the real fault-detection capability of a test suite."_ Which is exactly what you need when an agent will happily ship 100% coverage that proves nothing.

## Agentic review

Once the cheap checks pass, layer on review by other agents. The asymmetry is well-established: LLMs are better at reviewing than generating, so a reviewer reliably catches what the author missed.

### Multi-agent PR review

Anthropic's [Code Review for Claude Code](https://claude.com/blog/code-review) (March 2026) dispatches specialist agents in parallel — logic errors, boundary conditions, API misuse, auth flaws, project conventions — then a meta-agent verifies each finding before posting, deduplicates, and ranks by severity. Substantive comments rose from 16% of PRs to 54% after adoption; engineers disagreed with under 1% of surfaced findings.

### The hosted reviewer landscape

Beyond Anthropic's own offering, the field has consolidated around a handful of players:

- **[CodeRabbit](https://coderabbit.ai/)** — broadest platform coverage (GitHub, GitLab, Bitbucket, Azure)
- **[Greptile](https://www.greptile.com/)** — best bug-catch rate in head-to-head benchmarks via full-repo context
- **[cubic](https://www.cubic.dev/)** — high-signal reviews, used by Granola, n8n, Cal.com
- **[Graphite Diamond](https://graphite.com/)** — best fit for teams on a stacked-PR workflow
- **[Vercel Agent](https://vercel.com/agent)** — tight integration if you deploy on Vercel

They all do roughly the same job — pick by where your code already lives.

### The subagent reviewer pattern

You can run the same shape locally. Claude Code reads subagent definitions from [`.claude/agents/`](https://code.claude.com/docs/en/sub-agents) (project) or `~/.claude/agents/` (personal) — each is a markdown file with a focused system prompt and a tool allowlist:

```markdown
---
name: security-reviewer
description: Review diff for auth, secret-handling, and injection risks
tools: Read, Grep, Glob
---
Audit the diff for OWASP Top 10 patterns. Flag only verified findings,
with file:line and a one-sentence fix. No speculation.
```

Drop equivalents into `style-reviewer.md` and `performance-reviewer.md`, then dispatch all three concurrently from a parent skill. A resolver agent fixes the issues, then re-review.

```
Implement → Review (n parallel subagents) → Resolve → Re-review
```

Rules of thumb: rounds 1–2 capture roughly 75% of the improvement; hard-cap at 5–6 to avoid the model oscillating on imaginary issues. Width over depth — three concurrent reviewers in 30 seconds beats one monolithic prompt in two minutes.

If you'd rather start from a tested setup: Anthropic ships [`/security-review`](https://www.anthropic.com/news/automate-security-reviews-with-claude-code) out of the box for terminal-side audits, and [Every's compound-engineering plugin](https://github.com/EveryInc/compound-engineering-plugin) packages a plan → work → review → compound loop with 37 skills and 51 agents. For a worked walkthrough, [HAMY's 9-parallel-agent review setup](https://hamy.xyz/blog/2026-02_code-reviews-claude-subagents) is the clearest end-to-end example.

## Closing the loop

Verification only compounds when its signals flow back into the guides. When a reviewer finds the same class of bug twice, the fix isn't a better prompt — it's a new lint rule, a new test fixture, or a new entry in AGENTS.md. The harness gets sharper with each defect.

Three questions to ask after every failure:

1. **Should this have been caught earlier?** If a reviewer caught what a linter could have, add the lint rule.
2. **Is this a class or an instance?** Recurring defects become rules. One-offs just get fixed.
3. **Was the rule unwritten?** If the agent followed AGENTS.md and still made the mistake, the guide is missing something.

### Wiring up the loop

There are four levels of automation, ordered by friction:

- **Quick capture.** In Claude Code, prefix any prompt with `#` to append a [memory entry](https://code.claude.com/docs/en/memory) on the spot. Zero ceremony — useful the moment a fix lands.
- **A `/learn` skill.** A custom slash command that takes a bug plus the diff and proposes a candidate AGENTS.md rule, lint rule, or test fixture. The human still approves before it lands, but the synthesis work is done.
- **Session-end hooks.** A [`Stop` or `SessionEnd` hook](https://code.claude.com/docs/en/hooks) reflects over the session transcript and appends learnings to a tracked file. Open-source starters: [claude-mem](https://github.com/thedotmack/claude-mem), [claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler).
- **Dreaming.** Anthropic's [Managed Agents](https://claude.com/blog/new-in-claude-managed-agents) (May 2026) ship a scheduled background reflection that curates memory automatically; Harvey reported a ~6× lift in completion rates after enabling it. You choose whether updates land directly or queue for review.

Whatever the mechanism, the rule is the same: extract one durable artefact (rule, test, hook) per recurring defect — never a one-off prompt fix.

Verification is where the agent meets reality. The cleaner the layers beneath it, the less you need humans involved at the top.
