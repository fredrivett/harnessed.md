import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { h } from 'hastscript';
import type { ShikiTransformer } from 'shiki';

// Maps vitesse-light token colours to semantic classes so we can style
// syntax with our own CSS variables (see .tok-* rules in global.css).
// Scopes share token classes across themes — light is the source of truth,
// dark uses the same classes with different variable values.
const lightHexToClass: Record<string, string> = {
	'#393a34': 'tok-text',
	'#a0ada0': 'tok-comment',
	'#999999': 'tok-punctuation',
	'#586069': 'tok-punctuation',
	'#1e754f': 'tok-keyword',
	'#ab5959': 'tok-builtin',
	'#59873a': 'tok-function',
	'#b56959': 'tok-string',
	'#b5695977': 'tok-string',
	'#ab5e3f': 'tok-string',
	'#998418': 'tok-property',
	'#99841877': 'tok-property',
	'#b07d48': 'tok-attribute',
	'#a65e2b': 'tok-constant',
	'#2f798a': 'tok-number',
	'#2e8f82': 'tok-type',
	'#5a6aa6': 'tok-type',
	'#b05a78': 'tok-namespace',
	'#bda437': 'tok-regexp',
	'#1c6b48': 'tok-heading',
	'#2e808f': 'tok-quote',
	'#22863a': 'tok-inserted',
	'#e36209': 'tok-changed',
	'#b31d28': 'tok-invalid',
	'#393a3490': 'tok-link',
};

const tokenClasses: ShikiTransformer = {
	name: 'harnessed:token-classes',
	span(node) {
		const style = node.properties?.style;
		if (typeof style === 'string') {
			const match = style.match(/--shiki-light:\s*([^;]+)/i);
			const colour = match?.[1]?.trim().toLowerCase();
			if (colour && lightHexToClass[colour]) {
				const existing = node.properties.class;
				const next = lightHexToClass[colour];
				node.properties.class = existing ? `${existing} ${next}` : next;
			}
		}
		// Drop inline colour vars so our .tok-* classes own the rendering.
		delete node.properties.style;
	},
};

// https://astro.build/config
export default defineConfig({
	server: {
		port: Number(process.env.PORT || 4321),
	},
	site: 'https://www.harnessed.md',
	markdown: {
		syntaxHighlight: 'shiki',
		shikiConfig: {
			themes: {
				light: 'vitesse-light',
				dark: 'vitesse-dark',
			},
			defaultColor: false,
			transformers: [tokenClasses],
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
