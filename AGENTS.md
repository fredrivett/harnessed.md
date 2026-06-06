# AGENTS.md

## Commands

- `npm run dev` — local dev server (Astro, default port 4321).
- `npm run lint` — ESLint (correctness + agent anti-patterns; no formatting rules).
- `npm test` — unit tests (Vitest) for pure helpers.
- `npm run build` — the full pre-push gate: type-check → lint → tests → build → link + llms.txt checks. See [Verification](#verification) for the steps.

## Rules

- All external links must open in a new tab using `target="_blank" rel="noopener"`.

## Writing pages

Content pages (`src/data/*.md` rendered through `.prose`) follow a few conventions:

- **Direct, not conversational.** Lead with the substance. Skip rhetorical questions, calls to action, and chatty framing — every sentence should carry information, not warmth. "Verification is the highest-leverage layer of the harness" beats "Want cleaner code?"
- **Browsable, not a manual.** Paragraphs and bullets are 1–2 sentences max — if it runs longer, split it. Cut sentences that just restate the previous one or the table above.
- **Concrete over vague.** Use specific stats tied to a named source (e.g. "Snyk found 36–40%…") instead of "studies show" or "many teams." If you can't attribute it, don't claim it.
- **Primary sources.** Link to the vendor's or author's own page (`claude.com/blog/...`) before a secondary writeup (InfoQ, TechCrunch).
- **Real headings.** Use `###` under `##` for sub-sections — don't fake hierarchy with `**Title.**` inline.
- **Tool/option lists** are bullets with a bold linked name, em-dash, and a one-line differentiator.
- **Reading lives in the frontmatter.** Add to the `reading:` list; don't write "for further reading."
- **External links open in a new tab automatically** via `rehype-external-links` — don't add the attributes by hand.

## Agent-facing outputs (llms.txt)

The `*/llms.txt` routes are payloads an agent consumes, not pages a human browses. One principle governs whether to link or inline:

- **Inline when the content is always needed, small, and co-generated; link out when it's optional, large, or an independent entry point.** A mandatory fetch is a reliability dice-roll — every link the agent *must* follow is a chance to skip, fail, or half-read it. Spend that risk only when the content isn't always needed or is too large to inline.
- **Inlining is cheap here because routes pull `.body` from `src/data/*.md` at build time** — there's no duplicated copy to maintain, so freshness and single-source-of-truth are free. (See `src/pages/audit/llms.txt.ts`, which bundles the three pillar sections so the audit runs from one self-contained file.)
- **Keep instructions consistent with the payload.** If an llms.txt inlines its reference material, don't also tell the agent to fetch it — contradictory instructions are worse than either alone.

## Adding a company

Company files live in `src/data/companies/`. The numeric prefix (e.g. `01-`) controls sort order on the homepage; the slug is the filename minus the prefix (e.g. `01-openai.yaml` → `/companies/openai`).

Required YAML fields: `name`, `url`, `reference` (`title`, `url`), `description`, `headcount`, `stage`, `ats` (`provider`, `boardId`, `departmentFilter`). Optional: `careers`.

Supported ATS providers: check `src/lib/jobs.ts` for the current list.

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
