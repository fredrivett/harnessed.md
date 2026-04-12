export interface Job {
	title: string;
	url: string;
	location: string;
	department: string;
	company: string;
	salary?: string;
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
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			},
		});
	} finally {
		clearTimeout(timeout);
	}
}

function formatSalary(raw: string): string {
	// Replace dollar amounts with $XXXK notation, e.g. $290,000 → $290K
	return raw.replace(/\$([\d,]+)/g, (_, digits) => {
		const val = Math.round(Number(digits.replace(/,/g, '')) / 1000);
		return `$${val}K`;
	}).replace(/\s*USD$/, '');
}

function extractGreenhouseSalary(job: any): string | undefined {
	// Check metadata for salary fields
	const meta = job.metadata as any[] | undefined;
	if (meta) {
		for (const m of meta) {
			const name = (m.name || '').toLowerCase();
			if (name.includes('salary') || name.includes('compensation') || name.includes('pay')) {
				if (m.value) return formatSalary(String(m.value));
			}
		}
	}

	// Check HTML content for pay-transparency section
	// Greenhouse returns double-encoded HTML (e.g. &lt;div&gt;), so decode entities first
	const content = (job.content as string | undefined)
		?.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
	if (content) {
		const payMatch = content.match(/class="pay-range">([\s\S]*?)<\/div>/);
		if (payMatch) {
			// Extract text, strip tags, normalise whitespace
			const raw = payMatch[1]!.replace(/<[^>]+>/g, '').replace(/&mdash;/g, '–').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
			if (raw) return formatSalary(raw);
		}
	}

	return undefined;
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
			salary: extractGreenhouseSalary(job),
		}));
}

async function fetchCareersPage(url: string, departmentFilter: string): Promise<Job[]> {
	const res = await fetchWithTimeout(url, 15000);
	if (!res.ok) {
		console.warn(`[careers-page] ${url} returned ${res.status}`);
		return [];
	}
	const html = await res.text();
	const baseUrl = new URL(url).origin;

	const jobs: Job[] = [];

	// Pattern 1: Every-style (span department → h3 title → Apply link)
	const rolesSection = html.split('id="open-roles"')[1] || html;
	const cardRegex = /<span[^>]*>([^<]+)<\/span>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<a\s+href="([^"]+)"[^>]*>[^<]*Apply/g;
	let match;

	while ((match = cardRegex.exec(rolesSection)) !== null) {
		const dept = match[1]!.trim();
		const title = match[2]!.trim();
		const applyUrl = match[3]!;
		if (title.includes("Don't see your role")) continue;
		jobs.push({ title, url: applyUrl, location: '—', department: dept, company: '' });
	}

	// Pattern 2: Shopify-style (<a href="/careers/slug_uuid"><h4>Title</h4><span>Location</span></a>)
	if (jobs.length === 0) {
		const linkRegex = /<a\s[^>]*href="(\/careers\/[^"]*_[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
		while ((match = linkRegex.exec(html)) !== null) {
			const href = match[1]!;
			if (href.includes('?')) continue;
			const inner = match[2]!;
			const h4Match = inner.match(/<h4[^>]*>([^<]+)<\/h4>/);
			if (!h4Match?.[1]) continue;
			const title = h4Match[1].trim();
			const spanMatch = inner.match(/<span[^>]*>([^<]+)<\/span>/);
			const loc = spanMatch?.[1]?.trim() ?? '';
			const location = loc && loc !== 'Apply' ? loc : '—';
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
			salary: job.compensationTierSummary ? formatSalary(job.compensationTierSummary) : undefined,
		}));
}

export function salaryRange(jobs: Job[]): string | undefined {
	const withSalary = jobs.filter((j) => j.salary);
	if (withSalary.length === 0) return undefined;

	// Extract all dollar amounts from salary strings
	const amounts: number[] = [];
	for (const job of withSalary) {
		const matches = job.salary!.matchAll(/\$([\d,]+)k?/gi);
		for (const m of matches) {
			let val = Number(m[1]!.replace(/,/g, ''));
			if (m[0]!.toLowerCase().endsWith('k')) val *= 1000;
			if (val > 0) amounts.push(val);
		}
	}
	if (amounts.length === 0) return undefined;

	const min = Math.min(...amounts);
	const max = Math.max(...amounts);
	const fmt = (n: number) => `$${Math.round(n / 1000)}K`;
	return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
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
