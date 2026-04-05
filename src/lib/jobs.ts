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
		return await fetch(url, {
			signal: controller.signal,
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HarnessedBot/1.0)' },
		});
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
	const baseUrl = new URL(url).origin;

	const jobs: Job[] = [];

	// Pattern 1: Every-style (span department → h3 title → Apply link)
	const rolesSection = html.split('id="open-roles"')[1] || html;
	const cardRegex = /<span[^>]*>([^<]+)<\/span>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<a\s+href="([^"]+)"[^>]*>[^<]*Apply/g;
	let match;

	while ((match = cardRegex.exec(rolesSection)) !== null) {
		const dept = match[1].trim();
		const title = match[2].trim();
		const applyUrl = match[3];
		if (title.includes("Don't see your role")) continue;
		jobs.push({ title, url: applyUrl, location: '—', department: dept, company: '' });
	}

	// Pattern 2: Shopify-style (<a href="/careers/slug_uuid"><h4>Title</h4><span>Location</span></a>)
	if (jobs.length === 0) {
		const linkRegex = /<a\s[^>]*href="(\/careers\/[^"]*_[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
		while ((match = linkRegex.exec(html)) !== null) {
			const href = match[1];
			const inner = match[2];
			const h4Match = inner.match(/<h4[^>]*>([^<]+)<\/h4>/);
			if (!h4Match) continue;
			const title = h4Match[1].trim();
			const spanMatch = inner.match(/<span[^>]*>([^<]+)<\/span>/);
			const location = spanMatch ? spanMatch[1].trim() : '—';
			jobs.push({ title, url: `${baseUrl}${href}`, location, department: '', company: '' });
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
