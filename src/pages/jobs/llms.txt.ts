import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { fetchJobs } from '../../lib/jobs';

export const GET: APIRoute = async () => {
	const companies = await getCollection('companies');

	const companyJobs = await Promise.all(
		companies.map(async (c) => ({
			company: c,
			jobs: await fetchJobs(c.data.name, c.data.ats),
		}))
	);

	const totalJobs = companyJobs.reduce((sum, { jobs }) => sum + jobs.length, 0);
	const companiesWithOpenings = companyJobs.filter(({ jobs }) => jobs.length > 0).length;

	const lines = [
		'# Engineering jobs at harnessed companies',
		'',
		`> ${totalJobs} openings across ${companiesWithOpenings} companies.`,
		'',
		...companyJobs.flatMap(({ company, jobs }) => {
			if (jobs.length === 0) return [];
			return [
				`## ${company.data.name} (${jobs.length})`,
				'',
				...jobs.map((job) => {
					const parts = [`- **${job.title}**`];
					if (job.department) parts.push(` — ${job.department}`);
					if (job.location) parts.push(` — ${job.location}`);
					if (job.salary) parts.push(` — ${job.salary}`);
					parts.push(` — [Apply](${job.url})`);
					return parts.join('');
				}),
				'',
			];
		}),
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
