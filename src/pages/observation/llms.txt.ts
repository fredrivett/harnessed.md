import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { toPlainMarkdown } from '../../lib/markdown';

export const GET: APIRoute = async () => {
	const observation = await getEntry('pages', 'observation');
	if (!observation) throw new Error('Missing pages/observation entry');
	const { title, description, reading } = observation.data;

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		toPlainMarkdown(observation.body ?? ''),
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
