import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { toPlainMarkdown } from '../../lib/markdown';

export const GET: APIRoute = async () => {
	const guides = await getEntry('pages', 'guides');
	if (!guides) throw new Error('Missing pages/guides entry');
	const { title, description, reading } = guides.data;

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		toPlainMarkdown(guides.body ?? ''),
		'',
		...(reading ? [
			'## Further reading',
			'',
			...reading.map((item) =>
				`- [${item.title}](${item.url}) — ${item.author} — ${item.tag}`
			),
			'',
		] : []),
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
