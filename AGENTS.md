# AGENTS.md

## Commands

- `npm run dev` — local dev server (Astro, default port 4321).
- `npm run lint` — ESLint (correctness + agent anti-patterns; no formatting rules).
- `npm test` — unit tests (Vitest) for pure helpers.
- `npm run build` — the full pre-push gate: type-check → lint → tests → build → link + llms.txt checks. See [Verification](#verification) for the steps.

## Deploy

No deploy command lives in this repo — shipping is handled by Vercel's GitHub integration. Pushing to `main` deploys production (`https://www.harnessed.md`); pull requests get preview deployments automatically. Vercel serves the static Astro output (`dist/`); there's no committed `vercel.json`, so build settings live in the Vercel project dashboard.

## Observation

Product analytics is PostHog, loaded via an env-driven inline snippet in `src/components/posthog.astro` and pulled into every page through `Base.astro`. Page and funnel events fire through `window.posthog?.capture(...)`, so they no-op safely when the library hasn't loaded (e.g. no key). PostHog ships from its own CDN at runtime (`/static/array.js`) — there's no `posthog-js` dependency.

The client token is read from `PUBLIC_POSTHOG_PROJECT_TOKEN` / `PUBLIC_POSTHOG_HOST` (Astro inlines `PUBLIC_*` at build time). They live in `.env` for local dev and **must also be set in the Vercel project env (Production + Preview)** — otherwise the production build inlines `undefined` and analytics silently no-op.

Error tracking is PostHog exception autocapture — toggled on in the PostHog project settings, not in code. Stack traces are de-minified by source maps uploaded at build time via `@posthog/rollup-plugin` in `astro.config.ts`, gated on `POSTHOG_API_KEY` (a **build-time, server-side** personal API key — never `PUBLIC_`). Only the Vercel production build, where that secret plus `POSTHOG_PROJECT_ID` are set, generates and uploads maps (then deletes them); local and CI builds have no key, so the plugin is skipped and the gate stays green. `releaseVersion` is the deploy's commit SHA, for deploy-marker attribution.

## Boundaries

**Always**
- Run `npm run build` and get it green before pushing — it's the full gate (type-check → lint → tests → build → link/llms.txt checks).
- Work on a branch and open a PR; let the Vercel preview deploy validate before merge.

**Never**
- Push directly to `main` — it deploys straight to production (`www.harnessed.md`).
- Use `any` or other type escape hatches — the linter blocks it; type the real shape (see `RawGreenhouseJob`/`RawAshbyJob` in `src/lib/jobs.ts`).
- Hand-add `target="_blank" rel="noopener"` to links — `rehype-external-links` adds it at build and `check-links` enforces it.
- Reformat code for style — lint is correctness-only and the repo uses tabs; match the surrounding file.

**Ask first**
- Adding a dependency — the stack is deliberately lean (Astro + a few rehype plugins).
- Adding an ATS provider or changing the company schema — touches `src/lib/jobs.ts` and every `src/data/companies/*.yaml`.
- Changing the harness taxonomy (Guides / Verification / Observation) — it's the site's core thesis and recurs across pages and llms.txt.

## Agent-facing outputs (llms.txt)

The `*/llms.txt` routes are payloads an agent consumes, not pages a human browses. One principle governs whether to link or inline:

- **Inline when the content is always needed, small, and co-generated; link out when it's optional, large, or an independent entry point.** A mandatory fetch is a reliability dice-roll — every link the agent *must* follow is a chance to skip, fail, or half-read it. Spend that risk only when the content isn't always needed or is too large to inline.
- **Inlining is cheap here because routes pull `.body` from `src/data/*.md` at build time** — there's no duplicated copy to maintain, so freshness and single-source-of-truth are free. (See `src/pages/audit/llms.txt.ts`, which bundles the three pillar sections so the audit runs from one self-contained file.)
- **Keep instructions consistent with the payload.** If an llms.txt inlines its reference material, don't also tell the agent to fetch it — contradictory instructions are worse than either alone.

## Skills

Domain-specific workflows live in `.agents/skills/` (symlinked to `.claude/skills/`) and load on demand — keep them out of this file. Current skills:

- **writing-pages** — tone and formatting conventions for content pages (`src/data/*.md`).
- **adding-a-company** — fields and file layout for a company entry under `src/data/companies/`.
- **learn** — after a recurring defect or review finding, extract one durable harness improvement (test, lint rule, hook, path-scoped rule, or a `LEARNINGS.md` note) instead of a one-off fix.

## Verification

Run `npm run build` to check for errors before pushing. It's a composition of the named scripts below (`check`, `lint`, `test`, `build:site`, `check:links`, `check:llms-txt`) — each stays runnable on its own:

1. `npm run check` (`astro check`) — TypeScript type checking (`astro/tsconfigs/strictest`)
2. `npm run lint` (`eslint .`) — flat-config lint; blocks the `any` escape hatch (`@typescript-eslint/no-explicit-any`). Correctness only, no formatting rules, so it leaves the tab style alone. Config in `eslint.config.js`.
3. `npm run test` (`vitest run`) — unit tests (`*.test.ts`) for pure helpers like `src/lib/markdown.ts`
4. `npm run build:site` (`astro build`) — static site generation
5. `npm run check:links` — verifies all external links have `target="_blank" rel="noopener"`
6. `npm run check:llms-txt` — verifies llms.txt has no raw HTML and contains expected sections

### CI

`.github/workflows/ci.yml` runs these same six scripts as separate steps on every PR (and on `main`), so a failure names the exact stage. It's the same definitions `npm run build` composes — no drift. A parallel `security` job runs Semgrep's free OWASP Top 10 ruleset (`--error`, so findings fail it). The `build` job is required in `main` branch protection; promote `security` to required too once you're comfortable (it's currently clean).

### Edit-time enforcement (hook)

`.claude/settings.json` defines a `PostToolUse` hook that runs `npm run lint` after every `Edit`/`Write` to a JS/TS/Astro file, so anti-patterns like the `any` escape hatch land in the agent's next turn rather than waiting for CI. The heavier stages (type-check, tests) stay in the pre-push gate. (Changes to `.claude/settings.json` need a `/hooks` reload or restart to take effect mid-session.)

### Two test layers, on purpose

- **Unit tests (Vitest, `*.test.ts`)** — pure logic: string transforms, parsers, anything with branching that's cheap to call directly. Fast feedback, rich assertions.
- **Integration checks (`tsx scripts/check-*.ts`)** — assert against the *built* `dist/` output, not mocks. They verify the real artifact ships correctly (valid links, well-formed llms.txt), which is the thing we actually care about and can't fake at the unit level.

Keep them separate. The check scripts intentionally aren't ported into Vitest — they test a different layer (rendered output vs. pure functions) and need no test-runner machinery. When adding a test, pick the layer by what you're verifying: function behaviour → unit; "does the shipped site hold this property" → a check script.
