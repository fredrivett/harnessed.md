import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const GET: APIRoute = async () => {
	const home = await getEntry('pages', 'home');
	const { title, description, quote, reading } = home.data;

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		`> "${quote.text}" — [${quote.source}](${quote.url})`,
		'',
		'## What is a harnessed company?',
		'',
		home.body,
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
