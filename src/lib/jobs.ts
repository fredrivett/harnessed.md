export interface Job {
	title: string;
	url: string;
	location: string;
	department: string;
	company: string;
}

interface AtsConfig {
	provider: 'greenhouse' | 'ashby';
	boardId: string;
	departmentFilter: string;
}

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), ms);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

async function fetchGreenhouse(boardId: string, departmentFilter: string): Promise<Job[]> {
	const res = await fetchWithTimeout(`https://boards-api.greenhouse.io/v1/boards/${boardId}/jobs?content=true`);
	if (!res.ok) return [];
	const data = await res.json();

	return (data.jobs || [])
		.filter((job: any) => {
			const dept = (job.departments?.[0]?.name || '').toLowerCase();
			return dept.includes(departmentFilter);
		})
		.map((job: any) => ({
			title: job.title,
			url: job.absolute_url,
			location: job.location?.name || 'Remote',
			department: job.departments?.[0]?.name || '',
			company: '',
		}));
}

async function fetchAshby(boardId: string, departmentFilter: string): Promise<Job[]> {
	const res = await fetchWithTimeout(`https://api.ashbyhq.com/posting-api/job-board/${boardId}`);
	if (!res.ok) return [];
	const data = await res.json();

	return (data.jobs || [])
		.filter((job: any) => {
			const dept = (job.departmentName || job.department || '').toLowerCase();
			const team = (job.teamName || job.team || '').toLowerCase();
			const title = (job.title || '').toLowerCase();
			const filter = departmentFilter.toLowerCase();
			return dept.includes(filter) || team.includes(filter) || title.includes(filter);
		})
		.map((job: any) => ({
			title: job.title,
			url: job.jobUrl || `https://jobs.ashbyhq.com/${boardId}/${job.id}`,
			location: job.locationName || job.location || 'Remote',
			department: job.departmentName || job.department || '',
			company: '',
		}));
}

export async function fetchJobs(companyName: string, ats?: AtsConfig): Promise<Job[]> {
	if (!ats) return [];

	try {
		let jobs: Job[];
		if (ats.provider === 'greenhouse') {
			jobs = await fetchGreenhouse(ats.boardId, ats.departmentFilter);
		} else {
			jobs = await fetchAshby(ats.boardId, ats.departmentFilter);
		}
		return jobs.map((job) => ({ ...job, company: companyName }));
	} catch {
		return [];
	}
}
