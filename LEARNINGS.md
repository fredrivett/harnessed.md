# Learnings

Cold storage (per the [context tiers](https://www.harnessed.md/guides) on the site) for durable learnings that **can't** be mechanized into a test, lint rule, or hook — gotchas, judgment calls, dead-ends, and rationale. This file is read on demand, not loaded every session, so it stays out of `AGENTS.md`.

Captured via the `learn` skill. Before adding here, check the routing: a learning that can become a test / lint rule / hook / path-scoped rule belongs there instead, *enforced*. This file is only for the residue.

Append newest at the top. Each entry: date — one-line title, then what happened and the takeaway.

---

## 2026-06-06 — `?` is not `| undefined` under exactOptionalPropertyTypes

`astro/tsconfigs/strictest` enables `exactOptionalPropertyTypes`, which splits two things normal `strict` conflates: `?` means *the key may be absent*; `| undefined` means *the value may be explicitly `undefined`*. A normaliser that always assigns `salary: maybeUndefined` then needs the field typed `salary?: string | undefined`.

Prefer the alternative: **omit the key when there's no value** (`...(salary ? { salary } : {})`) so a plain `salary?: string` holds. It keeps the type honest and matches how the other code paths in `src/lib/jobs.ts` build their objects.

Why this lives here and not in a lint rule: it's a design judgment (omit vs. widen), not a mechanical violation a linter can flag.
