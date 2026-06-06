# AGENTS.md

## Commands

- `npm run dev` — local dev server (Astro, default port 4321).
- `npm run lint` — ESLint (correctness + agent anti-patterns; no formatting rules).
- `npm test` — unit tests (Vitest) for pure helpers.
- `npm run build` — the full pre-push gate: type-check → lint → tests → build → link + llms.txt checks. See [Verification](#verification) for the steps.

## Deploy

No deploy command lives in this repo — shipping is handled by Vercel's GitHub integration. Pushing to `main` deploys production (`https://www.harnessed.md`); pull requests get preview deployments automatically. Vercel serves the static Astro output (`dist/`); there's no committed `vercel.json`, so build settings live in the Vercel project dashboard.

## Rules

- All external links must open in a new tab using `target="_blank" rel="noopener"`.

## Agent-facing outputs (llms.txt)

The `*/llms.txt` routes are payloads an agent consumes, not pages a human browses. One principle governs whether to link or inline:

- **Inline when the content is always needed, small, and co-generated; link out when it's optional, large, or an independent entry point.** A mandatory fetch is a reliability dice-roll — every link the agent *must* follow is a chance to skip, fail, or half-read it. Spend that risk only when the content isn't always needed or is too large to inline.
- **Inlining is cheap here because routes pull `.body` from `src/data/*.md` at build time** — there's no duplicated copy to maintain, so freshness and single-source-of-truth are free. (See `src/pages/audit/llms.txt.ts`, which bundles the three pillar sections so the audit runs from one self-contained file.)
- **Keep instructions consistent with the payload.** If an llms.txt inlines its reference material, don't also tell the agent to fetch it — contradictory instructions are worse than either alone.

## Skills

Domain-specific workflows live in `.agents/skills/` (symlinked to `.claude/skills/`) and load on demand — keep them out of this file. Current skills:

- **writing-pages** — tone and formatting conventions for content pages (`src/data/*.md`).
- **adding-a-company** — fields and file layout for a company entry under `src/data/companies/`.

## Verification

Run `npm run build` to check for errors before pushing. This runs:

1. `astro check` — TypeScript type checking (`astro/tsconfigs/strictest`)
2. `eslint .` — flat-config lint; blocks the `any` escape hatch (`@typescript-eslint/no-explicit-any`). Correctness only, no formatting rules, so it leaves the tab style alone. Config in `eslint.config.js`.
3. `vitest run` — unit tests (`*.test.ts`) for pure helpers like `src/lib/markdown.ts`
4. `astro build` — static site generation
5. `check-links` — verifies all external links have `target="_blank" rel="noopener"`
6. `check-llms-txt` — verifies llms.txt has no raw HTML and contains expected sections

### Two test layers, on purpose

- **Unit tests (Vitest, `*.test.ts`)** — pure logic: string transforms, parsers, anything with branching that's cheap to call directly. Fast feedback, rich assertions.
- **Integration checks (`tsx scripts/check-*.ts`)** — assert against the *built* `dist/` output, not mocks. They verify the real artifact ships correctly (valid links, well-formed llms.txt), which is the thing we actually care about and can't fake at the unit level.

Keep them separate. The check scripts intentionally aren't ported into Vitest — they test a different layer (rendered output vs. pure functions) and need no test-runner machinery. When adding a test, pick the layer by what you're verifying: function behaviour → unit; "does the shipped site hold this property" → a check script.
