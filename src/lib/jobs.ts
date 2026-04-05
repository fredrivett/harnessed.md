export interface Job {
	title: string;
	url: string;
	location: string;
	department: string;
	company: string;
}

interface AtsConfig {
	provider: 'greenhouse' | 'ashby' | 'careers-page';
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

async function fetchCareersPage(url: string, departmentFilter: string): Promise<Job[]> {
	const res = await fetchWithTimeout(url);
	if (!res.ok) return [];
	const html = await res.text();

	const jobs: Job[] = [];
	const roleRegex = /<div[^>]*class="[^"]*border[^"]*rounded-lg[^"]*p-7[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
	let match;

	while ((match = roleRegex.exec(html)) !== null) {
		const block = match[0];
		const deptMatch = block.match(/<span[^>]*>([^<]+)<\/span>/);
		const titleMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/);
		const linkMatch = block.match(/<a\s+href="([^"]+)"[^>]*>Apply/);

		if (titleMatch) {
			const dept = deptMatch?.[1]?.trim() || '';
			jobs.push({
				title: titleMatch[1].trim(),
				url: linkMatch?.[1] || url,
				location: 'Remote',
				department: dept,
				company: '',
			});
		}
	}

	if (!departmentFilter) return jobs;
	const filter = departmentFilter.toLowerCase();
	return jobs.filter((j) => {
		return j.department.toLowerCase().includes(filter) || j.title.toLowerCase().includes(filter);
	});
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
		} else if (ats.provider === 'ashby') {
			jobs = await fetchAshby(ats.boardId, ats.departmentFilter);
		} else {
			jobs = await fetchCareersPage(ats.boardId, ats.departmentFilter);
		}
		return jobs.map((job) => ({ ...job, company: companyName }));
	} catch {
		return [];
	}
}
