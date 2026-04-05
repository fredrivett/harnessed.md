# AGENTS.md

## Rules

- All external links must open in a new tab using `target="_blank" rel="noopener"`.

## Adding a company

Company files live in `src/data/companies/`. The numeric prefix (e.g. `01-`) controls sort order on the homepage; the slug is the filename minus the prefix (e.g. `01-openai.yaml` → `/companies/openai`).

Required YAML fields: `name`, `url`, `reference` (`title`, `url`), `description`, `headcount`, `stage`, `ats` (`provider`, `boardId`, `departmentFilter`). Optional: `careers`.

Supported ATS providers: check `src/lib/jobs.ts` for the current list.

## Verify

Run `npm run build` to check for errors before pushing.
