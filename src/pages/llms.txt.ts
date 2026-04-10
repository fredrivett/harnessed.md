import type { APIRoute } from 'astro';
import { getEntry, getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
	const home = await getEntry('pages', 'home');
	if (!home) throw new Error('Missing pages/home entry');
	const { title, description, quote, reading } = home.data;
	const companies = await getCollection('companies');

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		`> "${quote.text}" — [${quote.source}](${quote.url})`,
		'',
		home.body,
		'',
		'## Guides',
		'',
		'The guide layer steers the agent before it acts. A well-configured guide layer is the highest-leverage investment you can make.',
		'',
		'### AGENTS.md',
		'',
		'AGENTS.md is an open, tool-agnostic standard for guiding coding agents. It lives at your project root and is read by Codex, Cursor, Gemini CLI, GitHub Copilot, and others. Claude Code reads CLAUDE.md, which is a superset. If you use multiple tools, write an AGENTS.md as your cross-tool base and import it into CLAUDE.md.',
		'',
		'What to include: commands (build, test, lint, deploy), testing (how to run tests, preferred frameworks), project structure (key directories), code style (only non-default rules), git workflow (branch naming, PR conventions), boundaries (always do, ask first, never do).',
		'',
		'Keep it short. For each line, ask: "would removing this cause the agent to make mistakes?" If not, cut it.',
		'',
		'### The config stack',
		'',
		'- AGENTS.md — durable policy and conventions, loads every session',
		'- Path-scoped rules — file-type or directory-specific instructions, loads when working in matching paths',
		'- Skills — on-demand knowledge and workflows, loads when relevant or directly invoked',
		'- Hooks — mechanical enforcement, runs every time with zero exceptions',
		'- Subagents — isolated task delegation, spawned for research, review, etc.',
		'',
		'AGENTS.md is advisory. Hooks are deterministic. If something must happen every time, use a hook.',
		'',
		'### Context tiers',
		'',
		'- Hot memory (always loaded) — AGENTS.md, path-scoped rules. Keep minimal.',
		'- Domain specialists (invoked per task) — skills and subagents. Loads when relevant.',
		'- Cold memory (retrieved on demand) — design docs, past learnings. Agent searches when needed.',
		'',
		'## Companies',
		'',
		...companies.map((c) =>
			`- [${c.data.name}](${c.data.url}) — ${c.data.description} — [${c.data.reference.title}](${c.data.reference.url})`
		),
		'',
		'## Key reading',
		'',
		...reading.map((item) =>
			`- [${item.title}](${item.url}) — ${item.author} — ${item.tag}`
		),
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
