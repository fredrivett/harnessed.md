import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/data' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		quote: z.object({
			text: z.string(),
			source: z.string(),
			url: z.string(),
		}),
		reading: z.array(z.object({
			title: z.string(),
			url: z.string(),
			author: z.string(),
			tag: z.string(),
		})),
	}),
});

export const collections = { pages };
