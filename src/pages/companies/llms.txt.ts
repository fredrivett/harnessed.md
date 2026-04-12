import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { fetchJobs } from '../../lib/jobs';

export const GET: APIRoute = async () => {
	const companies = await getCollection('companies');

	const companiesWithJobs = await Promise.all(
		companies.map(async (c) => {
			const jobs = await fetchJobs(c.data.name, c.data.ats, c.data.currency);
			return { company: c, jobCount: jobs.length };
		})
	);

	const lines = [
		'# Companies practicing harness engineering',
		'',
		...companiesWithJobs.flatMap(({ company: c, jobCount }) => {
			const slug = c.id.replace(/^\d+-/, '');
			const sources = c.data.sources || [];
			return [
				`## [${c.data.name}](${c.data.url})`,
				'',
				c.data.description,
				'',
				`- Stage: ${c.data.stage}`,
				`- Headcount: ${c.data.headcount}`,
				`- Open roles: ${jobCount}`,
				`- Reference: [${c.data.reference.title}](${c.data.reference.url})`,
				...(c.data.careers ? [`- Careers: ${c.data.careers}`] : []),
				`- Detail: [/companies/${slug}/llms.txt](/companies/${slug}/llms.txt)`,
				...(sources.length > 0 ? [
					'',
					'Sources:',
					...sources.map((s) => `- [${s.title}](${s.url})`),
				] : []),
				'',
			];
		}),
	];

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
