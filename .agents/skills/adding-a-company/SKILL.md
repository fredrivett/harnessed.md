---
name: adding-a-company
description: How to add a company to harnessed.md — file location, the numeric sort prefix, slug derivation, the required and optional YAML fields, and where to find supported ATS providers. Use when creating or editing a company entry under src/data/companies/.
---

# Adding a company

Company files live in `src/data/companies/`. The numeric prefix (e.g. `01-`) controls sort order on the homepage; the slug is the filename minus the prefix (e.g. `01-openai.yaml` → `/companies/openai`).

Required YAML fields: `name`, `url`, `reference` (`title`, `url`), `description`, `headcount`, `stage`, `ats` (`provider`, `boardId`, `departmentFilter`). Optional: `careers`.

Supported ATS providers: check `src/lib/jobs.ts` for the current list.
