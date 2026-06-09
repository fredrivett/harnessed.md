---
name: writing-pages
description: Style and structure conventions for harnessed.md content pages (src/data/*.md rendered through .prose). Use when writing or editing any content page — guides, verification, observation, audit, or home — to keep the tone direct, browsable, and concrete, and the formatting consistent.
---

# Writing content pages

Content pages (`src/data/*.md` rendered through `.prose`) follow a few conventions:

- **Direct, not conversational.** Lead with the substance. Skip rhetorical questions, calls to action, and chatty framing — every sentence should carry information, not warmth. "Verification is the highest-leverage layer of the harness" beats "Want cleaner code?"
- **Browsable, not a manual.** Paragraphs and bullets are 1–2 sentences max — if it runs longer, split it. Cut sentences that just restate the previous one or the table above — and don't bookend a section with an intro and a closing line that make the same point. State each framing once; let the bullets carry the substance.
- **Concrete over vague.** Use specific stats tied to a named source (e.g. "Snyk found 36–40%…") instead of "studies show" or "many teams." If you can't attribute it, don't claim it.
- **Primary sources.** Link to the vendor's or author's own page (`claude.com/blog/...`) before a secondary writeup (InfoQ, TechCrunch).
- **Real headings.** Use `###` under `##` for sub-sections — don't fake hierarchy with `**Title.**` inline.
- **Tool/option lists** are bullets with a bold linked name, em-dash, and a one-line differentiator.
- **Reading lives in the frontmatter.** Add to the `reading:` list; don't write "for further reading."
- **External links open in a new tab automatically** via `rehype-external-links` — don't add the attributes by hand.
