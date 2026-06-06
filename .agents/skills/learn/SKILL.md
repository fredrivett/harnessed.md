---
name: learn
description: Turn a recurring defect, bug, or code-review finding into a durable harness improvement instead of a one-off fix. Use after fixing something that could recur, when a reviewer (human or agent) flags a pattern, or when CI catches something an earlier layer should have caught. Routes each learning to the most enforced layer that fits — test, lint rule, hook, path-scoped rule, AGENTS.md, or LEARNINGS.md.
---

# learn

Close the loop: when a defect appears, extract one harness improvement so it can't recur — don't just patch and move on. This is the [closing-the-loop](/verification) discipline applied with the [context-tier](/guides) routing.

## When to run

Reach for `/learn` when:

- You just fixed a bug that could plausibly happen again.
- A reviewer — human, cubic, or a subagent — flagged something.
- CI or the pre-push gate caught a defect an earlier, faster layer should have caught.
- You hit a gotcha that cost time and will cost the next person time too.

Skip it for genuine one-offs (a typo, a copy tweak). Not everything is a pattern, and over-capturing turns the learnings store into noise.

## Step 1 — Triage (the three questions)

1. **Should this have been caught earlier?** If yes, push enforcement toward the fastest layer (type-check/lint before tests before CI).
2. **Pattern or one-off?** Patterns get hard-coded into the harness. One-offs just get fixed — stop here.
3. **Did an advisory rule already exist and fail to stick?** If a rule in AGENTS.md or a skill was ignored, that's the signal to upgrade it to a deterministic check.

## Step 2 — Route to the right layer (by scope)

Pick the *most enforced* layer the learning fits. Default to mechanization; fall back to advisory only when the judgment is irreducible.

| The learning is… | Goes to | Why |
| --- | --- | --- |
| A checkable code property (bad value, wrong shape, missing guard) | a **test** (`*.test.ts`) or **lint rule** (`eslint.config.js`) | deterministic, runs in the gate |
| "This must happen on every edit/commit" | a **hook** (`.claude/settings.json`) | mechanical, zero exceptions |
| Narrow to one directory or file-type | a **path-scoped rule** or the relevant **skill** | loads only in context; keeps hot memory lean |
| Broad policy that applies to ~every session | an **AGENTS.md** boundary | hot memory — use sparingly |
| A gotcha, judgment call, or dead-end that resists all the above | an entry in **`LEARNINGS.md`** | cold storage, read on demand |

Rules of thumb, straight from the guides:

- Prefer a test/lint/hook over a prose rule — an advisory rule is a reliability dice-roll.
- Keep AGENTS.md to what applies to *every* session; it's loaded every time. Narrow things belong in skills or path-scoped rules.
- `LEARNINGS.md` is the last resort, not the default. If it can be a test, make it a test.

## Step 3 — Make the change and verify

- Implement the chosen artifact (write the test / rule / hook / entry).
- For a test, follow red-green: confirm it **fails** against the unfixed code, then passes with the fix.
- Run `npm run build` (the full gate) to confirm nothing regressed.
- Commit the harness change with — or right after — the fix, so the lesson ships with the code.

## Step 4 — One improvement per defect

Extract exactly one durable improvement per recurring defect. Don't gold-plate, and don't let it sprawl into a backlog. If you spot several, do the highest-leverage one now and note the rest.
