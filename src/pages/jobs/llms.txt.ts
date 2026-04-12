import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { fetchJobs } from '../../lib/jobs';

export const GET: APIRoute = async () => {
	const companies = await getCollection('companies');

	const jobResults = await Promise.all(
		companies.map((c) => fetchJobs(c.data.name, c.data.ats))
	);
	const allJobs = jobResults.flat();

	const lines = [
		'# Engineering jobs at harnessed companies',
		'',
		`> ${allJobs.length} openings across ${companies.length} companies.`,
		'',
		...allJobs.map((job) => {
			const parts = [`- **${job.title}** — ${job.company}`];
			if (job.department) parts.push(` — ${job.department}`);
			if (job.location) parts.push(` — ${job.location}`);
			if (job.salary) parts.push(` — ${job.salary}`);
			parts.push(` — [Apply](${job.url})`);
			return parts.join('');
		}),
		'',
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
