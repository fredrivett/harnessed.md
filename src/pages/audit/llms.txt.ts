import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { toPlainMarkdown } from '../../lib/markdown';

export const GET: APIRoute = async () => {
	const audit = await getEntry('pages', 'audit');
	if (!audit) throw new Error('Missing pages/audit entry');
	const { title, description } = audit.data;

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		toPlainMarkdown(audit.body ?? ''),
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
