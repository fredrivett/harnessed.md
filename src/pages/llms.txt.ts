import type { APIRoute } from 'astro';
import { getEntry, getCollection } from 'astro:content';
import { toPlainMarkdown } from '../lib/markdown';

export const GET: APIRoute = async () => {
	const home = await getEntry('pages', 'home');
	if (!home) throw new Error('Missing pages/home entry');
	const { title, description, quote } = home.data;
	const companies = await getCollection('companies');

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		...(quote ? [`> "${quote.text}" — [${quote.source}](${quote.url})`, ''] : []),
		toPlainMarkdown(home.body ?? ''),
		'',
		'## Sections',
		'',
		'- [Guides](/guides/llms.txt) — configuring your agent harness',
		'- [Verification](/verification/llms.txt) — verifying what an agent ships',
		'- [Observation](/observation/llms.txt) — monitoring what shipped',
		'- [Audit](/audit/llms.txt) — score how harnessed your codebase is',
		'- [Jobs](/jobs/llms.txt) — engineering jobs at harnessed companies',
		'- [Companies](/companies/llms.txt) — who is doing harness engineering',
		'',
		'## Companies',
		'',
		...companies.map((c) => {
			const slug = c.id.replace(/^\d+-/, '');
			return `- [${c.data.name}](/companies/${slug}/llms.txt) — ${c.data.description}`;
		}),
		'',
		'---',
		'',
		'For the complete content in a single file, see [/llms-full.txt](/llms-full.txt)',
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
