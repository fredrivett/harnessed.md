import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { h } from 'hastscript';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.harnessed.md',
	markdown: {
		shikiConfig: {
			theme: 'css-variables',
		},
		rehypePlugins: [
			[rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }],
			rehypeSlug,
			[rehypeAutolinkHeadings, {
				behavior: 'prepend',
				properties: { className: ['heading-hash'] },
				content: (node: { tagName: string }) => {
					const depth = Number(node.tagName.charAt(1));
					return [h('span', '#'.repeat(depth))];
				},
			}],
		],
	},
});
