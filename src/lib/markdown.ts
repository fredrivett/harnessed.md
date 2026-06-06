const SECTION_PATHS = ['guides', 'verification', 'observation', 'audit'];

export function toPlainMarkdown(body: string): string {
	const stripped = body
		.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_match, content: string) => {
			const plain = content.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');
			return '```\n' + plain.trimEnd() + '\n```';
		})
		.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');

	const sectionRegex = new RegExp(`\\]\\(/(${SECTION_PATHS.join('|')})(#[^)]*)?\\)`, 'g');
	return stripped.replace(sectionRegex, (_match, section: string, anchor = '') => `](/${section}/llms.txt${anchor})`);
}

// "## The prompt" is human onboarding (the copy-paste invocation) — an agent
// reading an inlined payload was already pointed there, so drop it.
export function stripPromptSection(body: string): string {
	return body.replace(/\n## The prompt\n[\s\S]*?(?=\n## )/, '');
}

// When a section is inlined as reference material under a "## {title}" wrapper,
// demote its headings one level to keep the hierarchy intact. Fence-aware so
// `#` lines inside code blocks are left alone. Capped at h6.
export function demoteHeadings(md: string): string {
	return md
		.split(/(```[\s\S]*?```)/g)
		.map((segment, i) => (i % 2 === 1 ? segment : segment.replace(/^(#{1,5}) /gm, '#$1 ')))
		.join('');
}
