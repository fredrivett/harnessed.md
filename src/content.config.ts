import { defineCollection } from 'astro:content';
import { z } from 'zod';
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
		}).optional(),
		reading: z.array(z.object({
			title: z.string(),
			url: z.string(),
			author: z.string(),
			tag: z.string(),
		})).optional(),
	}),
});

const companies = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/data/companies' }),
	schema: z.object({
		name: z.string(),
		url: z.string(),
		careers: z.string().optional(),
		reference: z.object({
			title: z.string(),
			url: z.string(),
		}),
		sources: z.array(z.object({
			title: z.string(),
			url: z.string(),
		})).optional(),
		description: z.string(),
		headcount: z.enum(['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+']),
		stage: z.enum(['bootstrapped', 'seed', 'series-a', 'series-b', 'series-c', 'late-stage', 'growth', 'public']),
		currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
		ats: z.object({
			provider: z.enum(['greenhouse', 'ashby', 'careers-page']),
			boardId: z.string(),
			departmentFilter: z.string(),
		}).optional(),
	}),
});

export const collections = { pages, companies };
