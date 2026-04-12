import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { fetchJobs } from '../../../lib/jobs';

export const getStaticPaths = (async () => {
	const companies = await getCollection('companies');
	return companies.map((company) => ({
		params: { slug: company.id.replace(/^\d+-/, '') },
		props: { company },
	}));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute = async ({ props }) => {
	const { company } = props as Props;
	const jobs = await fetchJobs(company.data.name, company.data.ats);
	const sources = company.data.sources || [];

	const lines = [
		`# ${company.data.name}`,
		'',
		company.data.description,
		'',
		`- Website: ${company.data.url}`,
		`- Stage: ${company.data.stage}`,
		`- Headcount: ${company.data.headcount}`,
		`- Reference: [${company.data.reference.title}](${company.data.reference.url})`,
		...(company.data.careers ? [`- Careers: ${company.data.careers}`] : []),
		'',
		...(sources.length > 0 ? [
			'## What they\'ve said',
			'',
			...sources.map((s: { title: string; url: string }) => `- [${s.title}](${s.url})`),
			'',
		] : []),
		`## Engineering jobs (${jobs.length})`,
		'',
		...(jobs.length > 0 ? jobs.map((job) => {
			const parts = [`- **${job.title}**`];
			if (job.department) parts.push(` — ${job.department}`);
			if (job.location) parts.push(` — ${job.location}`);
			if (job.salary) parts.push(` — ${job.salary}`);
			parts.push(` — [Apply](${job.url})`);
			return parts.join('');
		}) : ['No jobs available via API.']),
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
