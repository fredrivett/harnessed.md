import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { toPlainMarkdown } from '../../lib/markdown';

export const GET: APIRoute = async () => {
	const verification = await getEntry('pages', 'verification');
	if (!verification) throw new Error('Missing pages/verification entry');
	const { title, description, reading } = verification.data;

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		toPlainMarkdown(verification.body ?? ''),
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
