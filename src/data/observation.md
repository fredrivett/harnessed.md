---
title: Observation
description: How to monitor what an agent shipped — error tracking, usage, and AI-led anomaly investigation.
reading:
  - title: Vercel Agent can now run AI investigations
    url: https://vercel.com/blog/vercel-agent-can-now-run-ai-investigations
    author: Vercel
    tag: Alert-triggered AI root-cause analysis
---

Observation is the [harness's](/) third pillar — what closes the loop. [Verification](/verification) catches what's broken before it ships; observation catches what slips through. Without it, the agent never learns from production.

## The observation stack

| Layer | What it watches | When it fires |
| --- | --- | --- |
| [Error tracking](#error-tracking) | Exceptions, failed requests, crashes | Continuous |
| [Usage analytics](#usage-analytics) | Adoption, drop-off, feature use | Continuous |
| [Agentic investigation](#agentic-investigation) | Anomalies, root cause | On alert |

The first two surface that something is wrong. The third tells you why.

## Error tracking

The minimum bar. Every change carries some risk of a runtime failure; error tracking is what tells you it happened. Sentry-class tools attach source maps to stack traces, group similar errors, and link incidents back to the deploy that caused them.

What to capture beyond the exception itself:

- **Deploy markers** — every error attributable to a deploy, and through it to the PR
- **Minimum user context** — enough to reproduce, no more
- **Error boundaries** — so partial failures don't masquerade as missing data

Tools: [Sentry](https://sentry.io/), [Bugsnag](https://www.bugsnag.com/), [Rollbar](https://rollbar.com/), or platform-native equivalents.

## Usage analytics

Errors tell you when things break. Usage tells you when nothing breaks but no one's using it — the silent failure mode. An agent ships a feature, no exceptions fire, but adoption is flat: the implementation may technically work but miss the actual intent.

Patterns that earn their place:

- **Per-change instrumentation** — every meaningful surface emits at least one event
- **Activation cohorts** — first use, repeat use, drop-off by step
- **Flag-scoped rollout** — ship dark, observe, ramp up

Tools: [PostHog](https://posthog.com/) (open source, self-hostable), [Amplitude](https://amplitude.com/), [Mixpanel](https://mixpanel.com/). The pattern matters more than the vendor — pick one and instrument consistently.

## Agentic investigation

The newest layer. When an alert fires, an LLM agent queries your logs and metrics around the time of the incident, looks for what changed, and surfaces a root-cause hypothesis. The shift is from _"alert fired, dig manually"_ to _"alert fired, here's the analysis."_

[Vercel Agent Investigation](https://vercel.com/docs/agent/investigation) is the clearest GA example — runs automatically when an anomaly alert fires, queries logs and metrics, looks for related errors, and posts findings to the alert. Built on the [Vercel MCP server](https://vercel.com/changelog/agents-can-now-access-runtime-logs-with-vercels-mcp-server), so the agent has authenticated access to runtime data.

The emerging pattern beyond alert-triggered: hand a coding agent a bug report — screenshots, repro details, severity — and give it tools to query logs, deploy a debug branch with added instrumentation, and compare against baseline. Compose it from primitives: [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) for screenshot capture, [`vercel logs`](https://vercel.com/changelog/vercel-logs-cli-command-now-optimized-for-agents-with-historical-log) for queryable history, MCP for live data.

## Closing the loop

Observation feeds two flows.

Recurring patterns improve the [harness](/). When error tracking surfaces the same defect class twice, the fix isn't another patch — push it into the harness. If a deterministic check can catch the pattern — a lint rule, a hook, or a test — use that. Otherwise pick the advisory form that fits: a path-scoped rule for code-area specifics, a skill for workflows, AGENTS.md for what every session needs to know.

One-off signals feed the task list. A feature nobody uses gets investigated, then fixed or removed. A one-time error becomes a regular bug. These are tasks, not harness rules.

Three questions to ask when a signal lands:

1. **Should this have been caught earlier?** Push enforcement upstream — to whichever cheaper layer would catch it next time.
2. **Pattern or one-off?** Patterns get hard-coded into the harness; one-offs just get fixed.
3. **Did an advisory rule fail to stick?** Upgrade it to a deterministic check — a hook, lint, or test.

Observation closes the loop. Without it, the harness stops learning the moment something passes verification.
