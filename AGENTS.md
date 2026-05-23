# AGENTS.md

## Rules

- All external links must open in a new tab using `target="_blank" rel="noopener"`.

## Writing pages

Content pages (`src/data/*.md` rendered through `.prose`) follow a few conventions:

- **Browsable, not a manual.** Paragraphs and bullets are 1–2 sentences max — if it runs longer, split it. Cut sentences that just restate the previous one or the table above.
- **Concrete over vague.** Use specific stats tied to a named source (e.g. "Snyk found 36–40%…") instead of "studies show" or "many teams." If you can't attribute it, don't claim it.
- **Primary sources.** Link to the vendor's or author's own page (`claude.com/blog/...`) before a secondary writeup (InfoQ, TechCrunch).
- **Real headings.** Use `###` under `##` for sub-sections — don't fake hierarchy with `**Title.**` inline.
- **Tool/option lists** are bullets with a bold linked name, em-dash, and a one-line differentiator.
- **Reading lives in the frontmatter.** Add to the `reading:` list; don't write "for further reading."
- **External links open in a new tab automatically** via `rehype-external-links` — don't add the attributes by hand.

## Adding a company

Company files live in `src/data/companies/`. The numeric prefix (e.g. `01-`) controls sort order on the homepage; the slug is the filename minus the prefix (e.g. `01-openai.yaml` → `/companies/openai`).

Required YAML fields: `name`, `url`, `reference` (`title`, `url`), `description`, `headcount`, `stage`, `ats` (`provider`, `boardId`, `departmentFilter`). Optional: `careers`.

Supported ATS providers: check `src/lib/jobs.ts` for the current list.

## Verification

Run `npm run build` to check for errors before pushing. This runs:

1. `astro check` — TypeScript type checking
2. `astro build` — static site generation
3. `check-links` — verifies all external links have `target="_blank" rel="noopener"`
4. `check-llms-txt` — verifies llms.txt has no raw HTML and contains expected sections
