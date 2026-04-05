---
title: harnessed.md
description: What harness engineering is, why it matters, and who's doing it.
quote:
  text: "The primary job is no longer to write code, but to design environments, specify intent, and build feedback loops that allow agents to do reliable work."
  source: OpenAI, Harness Engineering
  url: https://openai.com/index/harness-engineering/
reading:
  - title: My AI Adoption Journey
    url: https://mitchellh.com/writing/my-ai-adoption-journey
    author: Mitchell Hashimoto
    tag: The origin of harness engineering
  - title: Harness Engineering
    url: https://openai.com/index/harness-engineering/
    author: Ryan Lopopolo / OpenAI
    tag: 1M lines of code, zero written by humans
  - title: Harness Engineering for Coding Agent Users
    url: https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html
    author: Birgitta Böckeler / ThoughtWorks
    tag: The guides and sensors framework
  - title: Compound Engineering
    url: https://every.to/guides/compound-engineering
    author: Kieran Klaassen, Dan Shipper / Every
    tag: How Every codes with agents
---

## What is a harnessed company?

Engineering has fundamentally changed.

Traditionally engineers spent 80% of their time on features, 20% on the system. Harnessed companies flip that on its head: 80% goes to the harness — the machine that builds the machine. 20% guiding where it goes.

The harness has three parts:

- **Guides** — steer the agent *before* it acts: AGENTS.md, design docs, architecture maps, rules, learnings
- **Verify** — check the work before it ships: types, linters, tests, agentic review
- **Observe** — monitor: error tracking, usage patterns, performance

```
  Intent ◄··········································╮
    │              improvements + fixes             ·
    ▼                                               ·
  Guides ◄·····································╮    ·
    │                                          ·    ·
    │ constrain + direct                evolve ·    ·
    ▼                                          ·    ·
  Agent builds ◄───────┐                       ·    ·
    │                  │                       ·    ·
    ▼                  │ no: fix               ·    ·
  Verify ··············╁·······················┤    ·
    │                  │                       ·    ·
    ▼                  │                       ·    ·
  Pass? ───────────────┘                       ·    ·
    │                                          ·    ·
    │ yes                                      ·    ·
    ▼                                          ·    ·
  Ship                                         ·    ·
    │                                          ·    ·
    ▼                                          ·    ·
  Observe ·····································┴····╯
```

The system gets better over time. Signals from verification and observation feed back into the guides — you don't just fix the code, you refine the harness so it never breaks that way again. That's what makes it engineering, not configuration.
