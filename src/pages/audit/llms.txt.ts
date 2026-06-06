import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { toPlainMarkdown } from '../../lib/markdown';

// The audit is meant to always run against all three pillars, so we inline their
// full content here rather than asking the agent to fetch each one. The source
// still lives in src/data/{guides,verification,observation}.md — this only pulls
// it in at build time, so there is no duplicated copy to keep in sync.
const REFERENCE_SLUGS = ['guides', 'verification', 'observation'] as const;

// "## The prompt" is human onboarding (the copy-paste invocation) — an agent
// reading this payload was already pointed here, so drop it from the llms.txt.
function stripPromptSection(body: string): string {
	return body.replace(/\n## The prompt\n[\s\S]*?(?=\n## )/, '');
}

// Inlined sections become reference material nested under a "## {title}" wrapper,
// so demote their headings one level to keep the hierarchy intact. Fence-aware so
// `#` lines inside code blocks are left alone. Capped at h6.
function demoteHeadings(md: string): string {
	return md
		.split(/(```[\s\S]*?```)/g)
		.map((segment, i) => (i % 2 === 1 ? segment : segment.replace(/^(#{1,5}) /gm, '#$1 ')))
		.join('');
}

export const GET: APIRoute = async () => {
	const audit = await getEntry('pages', 'audit');
	if (!audit) throw new Error('Missing pages/audit entry');
	const { title, description } = audit.data;

	const references = await Promise.all(
		REFERENCE_SLUGS.map(async (slug) => {
			const entry = await getEntry('pages', slug);
			if (!entry) throw new Error(`Missing pages/${slug} entry`);
			return entry;
		})
	);

	const lines = [
		`# ${title}`,
		'',
		`> ${description}`,
		'',
		'> Everything you need to score is in this file. The full guidance for every rubric item is bundled under "Reference material" below — score from it directly and do not fetch external pages.',
		'',
		toPlainMarkdown(stripPromptSection(audit.body ?? '')),
		'',
		'---',
		'',
		'# Reference material',
		'',
		'The rubric above links to the sections below. They are included in full so you can score from this file alone.',
		'',
		...references.flatMap((entry) => [
			'---',
			'',
			`## ${entry.data.title}`,
			'',
			demoteHeadings(toPlainMarkdown(entry.body ?? '')),
			'',
		]),
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
