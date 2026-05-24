---
title: Observation
description: How to monitor what an agent shipped — error tracking, usage, and AI-led anomaly investigation.
reading:
  - title: Monitoring and Observability
    url: https://copyconstruct.medium.com/monitoring-and-observability-8417d1952e1c
    author: Cindy Sridharan
    tag: The canonical essay distinguishing the two
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

Errors tell you when things break. Usage tells you about the silent failures — a new feature ships and adoption stays flat, a working one starts losing traction, a funnel step drops users. Things technically work but something is off.

Patterns that earn their place:

- **Per-change instrumentation** — every meaningful user action emits at least one event
- **Activation cohorts** — first use, repeat use, drop-off by step
- **Flag-scoped rollout** — ship dark, observe, ramp up

Tools: [PostHog](https://posthog.com/) (open source, self-hostable), [Amplitude](https://amplitude.com/), [Mixpanel](https://mixpanel.com/). The pattern matters more than the vendor — pick one and instrument consistently.

## Agentic investigation

When an alert fires, an LLM agent queries your logs and metrics around the time of the incident, looks for what changed, and surfaces a root-cause hypothesis. The shift is from _"alert fired, dig manually"_ to _"alert fired, here's the analysis."_

[Vercel Agent Investigation](https://vercel.com/docs/agent/investigation) is the clearest GA example — runs automatically when an anomaly alert fires, queries logs and metrics, looks for related errors, and posts findings to the alert. Built on the [Vercel MCP server](https://vercel.com/changelog/agents-can-now-access-runtime-logs-with-vercels-mcp-server), so the agent has authenticated access to runtime data.

The emerging pattern beyond alert-triggered: hand a coding agent a bug report — screenshots, repro details, severity — and give it tools to query logs, deploy a debug branch with added instrumentation, and compare against baseline. Compose it from primitives: [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) for screenshot capture, [`vercel logs`](https://vercel.com/changelog/vercel-logs-cli-command-now-optimized-for-agents-with-historical-log) for queryable history, MCP for live data.

## Closing the loop

Production signals feed two flows. Recurring patterns become [harness](/) improvements; one-off signals become tasks. The work is sorting which is which — see [Verification: Closing the loop](/verification#closing-the-loop) for the three-question framing that applies here verbatim.

The signals you have to wire up are different, though. Errors and analytics live in third-party tools; the harness lives in your repo. Four ways to close the gap, ordered by friction:

- **Manual capture.** Incident retros write a one-line learning to the same file you'd use after a verification failure. Zero infra, full context.
- **Deploy-marker linking.** Tag every release with the commit SHA in Sentry/PostHog. Now every error and every funnel regression points at a PR, and the PR points at the agent prompt that produced it.
- **Alert-triggered investigation.** [Vercel Agent Investigation](https://vercel.com/docs/agent/investigation), [Sentry Seer](https://sentry.io/welcome/), or a custom MCP loop — when an anomaly fires, an agent queries logs, identifies the change, and posts a root-cause hypothesis to the alert thread before a human reads it.
- **Triage into fix or harness rule.** The step most teams skip. Sort each finding using the [three questions](/verification#closing-the-loop): one-offs go to the task list as a fix; recurring patterns get extracted into the harness — a lint rule, a test, or an AGENTS.md entry. Skip the triage and observation becomes a notification system, not a learning loop.

Observation closes the loop. Without it, the harness stops learning the moment something passes verification.
