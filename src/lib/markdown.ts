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
