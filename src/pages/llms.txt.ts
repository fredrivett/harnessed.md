import type { APIRoute } from 'astro';
import { getEntry, getCollection } from 'astro:content';
import { toPlainMarkdown } from '../lib/markdown';

export const GET: APIRoute = async () => {
	const home = await getEntry('pages', 'home');
	if (!home) throw new Error('Missing pages/home entry');
	const { title, description, quote, reading } = home.data;
	const companies = await getCollection('companies');

	const guides = await getEntry('pages', 'guides');

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		...(quote ? [`> "${quote.text}" — [${quote.source}](${quote.url})`, ''] : []),
		toPlainMarkdown(home.body ?? ''),
		'',
		...(guides ? [toPlainMarkdown(guides.body ?? ''), ''] : []),
		...(guides?.data.reading ? [
			'### Guides: further reading',
			'',
			...guides.data.reading.map((item) =>
				`- [${item.title}](${item.url}) — ${item.author} — ${item.tag}`
			),
			'',
		] : []),
		'## Companies',
		'',
		...companies.map((c) =>
			`- [${c.data.name}](${c.data.url}) — ${c.data.description} — [${c.data.reference.title}](${c.data.reference.url})`
		),
		'',
		'## Key reading',
		'',
		...(reading ?? []).map((item) =>
			`- [${item.title}](${item.url}) — ${item.author} — ${item.tag}`
		),
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
