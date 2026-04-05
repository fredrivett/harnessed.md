// @ts-check
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript';

// https://astro.build/config
export default defineConfig({
	markdown: {
		shikiConfig: {
			theme: 'none',
		},
		rehypePlugins: [
			rehypeSlug,
			[rehypeAutolinkHeadings, {
				behavior: 'prepend',
				properties: { className: ['heading-hash'] },
				content: (node) => {
					const depth = Number(node.tagName.charAt(1));
					return [h('span', '#'.repeat(depth))];
				},
			}],
		],
	},
});
