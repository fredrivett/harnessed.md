---
title: Guides
description: A practical guide to configuring your agent harness — AGENTS.md, skills, hooks, and context tiers.
reading:
  - title: Best Practices for Claude Code
    url: https://code.claude.com/docs/en/best-practices
    author: Anthropic
    tag: The official playbook
  - title: Extend Claude with Skills
    url: https://code.claude.com/docs/en/skills
    author: Anthropic
    tag: Creating, configuring, and sharing skills
  - title: Hooks Guide
    url: https://code.claude.com/docs/en/hooks-guide
    author: Anthropic
    tag: Lifecycle events and mechanical enforcement
  - title: Agent Skills Specification
    url: https://agentskills.io/specification
    author: Anthropic
    tag: The open standard for portable skills
  - title: How to Write a Great agents.md
    url: https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
    author: GitHub
    tag: Lessons from 2,500+ repos
---

The [harness](/) has three parts: guides, verification, observation. This page covers **guides** — the instructions that steer an agent _before_ it acts.

A well-configured guide layer is the highest-leverage investment you can make. It determines whether your agent produces useful work on the first attempt or burns cycles on wrong approaches.

## AGENTS.md

[AGENTS.md](https://agents.md/) is an open, tool-agnostic standard for guiding coding agents. It lives at your project root and is read by Codex, Cursor, Gemini CLI, GitHub Copilot, and others. It's backed by the [Linux Foundation's Agentic AI Foundation](https://agentic-ai.dev/) with support from OpenAI, Anthropic, Google, and AWS.

Claude Code reads `CLAUDE.md`, which is a superset — it supports everything AGENTS.md does plus Claude-specific features like `@imports` and path-scoped rules. If you use multiple tools, write an AGENTS.md as your cross-tool base and import it:

```
# CLAUDE.md
@AGENTS.md

# Claude-specific
Use plan mode for changes under src/billing/.
```

What to include — from [GitHub's analysis of 2,500+ repos](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/):

- **Commands** — build, test, lint, deploy
- **Testing** — how to run tests, preferred frameworks
- **Project structure** — key directories and their purpose
- **Code style** — only rules that differ from defaults
- **Git workflow** — branch naming, PR conventions
- **Boundaries** — "always do", "ask first", "never do"

Keep it short. For each line, ask: _"would removing this cause the agent to make mistakes?"_ If not, cut it. A focused 50-line file outperforms a comprehensive 500-line file — important rules get lost in noise.

## The config stack

AGENTS.md is just one layer. Modern agent tools support progressive disclosure — information loads only when relevant, keeping the agent's context clean.

| Layer | What | When it loads |
| --- | --- | --- |
| AGENTS.md | Durable policy and conventions | Every session |
| Path-scoped rules | File-type or directory-specific instructions | When working in matching paths |
| Skills | On-demand knowledge and workflows | When relevant or directly invoked |
| Hooks | Mechanical enforcement | Every time, zero exceptions |
| Subagents | Isolated task delegation | When spawned for research, review, etc. |

The key distinction: AGENTS.md is _advisory_ — the agent reads it but may not follow it perfectly. Hooks are _deterministic_ — they run scripts that enforce behaviour mechanically. If something must happen every time (formatting, linting, blocking commits to main), use a hook, not a rule.

## Skills

Skills extend what an agent can do. A skill is a folder with a `SKILL.md` file containing instructions the agent loads on demand — domain knowledge, workflows, or repeatable tasks you invoke with `/skill-name`.

The [Agent Skills](https://agentskills.io/specification) open standard works across Claude Code, Codex, Cursor, VS Code Copilot, and others. Skills are how you teach an agent about _your_ domain without bloating every session's context.

Examples of useful skills:

- **Workflows** — `/deploy`, `/fix-issue 1234`, `/review-pr`
- **Domain knowledge** — API conventions, database patterns, legacy system context
- **Compound loops** — [Every's compound engineering plugin](https://every.to/guides/compound-engineering) uses skills to implement plan/work/review/compound cycles

## Hooks

Hooks run scripts at specific points in the agent's lifecycle — before a tool runs, after a file edit, when a session starts. Unlike rules which are advisory, hooks guarantee the action happens.

Common hooks:

- Run a linter after every file edit
- Block commits to `main` or `production`
- Auto-format code on save
- Validate that migrations have a corresponding rollback

The rule of thumb: if you've written a rule in AGENTS.md and the agent keeps ignoring it, convert it to a hook.

## Context tiers

Most people put everything in AGENTS.md and wonder why the agent ignores half of it. The problem is context — agents perform best with the [smallest possible set of high-signal tokens](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

Think about your guides in three tiers:

- **Hot memory** (always loaded) — AGENTS.md, path-scoped rules. Keep this minimal: only what applies to _every_ session.
- **Domain specialists** (invoked per task) — skills and subagents. Domain knowledge, workflows, and focused expertise that loads when relevant.
- **Cold memory** (retrieved on demand) — design docs, past learnings, architectural decisions. The agent searches for these when it needs them.

When you notice your AGENTS.md growing past ~100 lines, move domain-specific knowledge to skills and project documentation to cold storage. The agent will find it when it needs it.
