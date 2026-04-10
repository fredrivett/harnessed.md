export function toPlainMarkdown(body: string): string {
	return body
		.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_match, content: string) => {
			const plain = content.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');
			return '```\n' + plain.trimEnd() + '\n```';
		})
		.replace(/<a[^>]*>([^<]*)<\/a>/g, '$1');
}
