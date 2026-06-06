import { describe, it, expect } from 'vitest';
import {
	salaryRange,
	extractGreenhouseSalary,
	parseCareersHtml,
	normalizeGreenhouseJobs,
	normalizeAshbyJobs,
	type Job,
} from './jobs';

const job = (overrides: Partial<Job>): Job => ({
	title: 'Engineer',
	url: 'https://example.com/job',
	location: 'Remote',
	department: 'Engineering',
	company: 'Acme',
	...overrides,
});

const EN_DASH = '–';

describe('salaryRange', () => {
	it('returns undefined when no job has a salary', () => {
		expect(salaryRange([])).toBeUndefined();
		expect(salaryRange([job({}), job({})])).toBeUndefined();
	});

	it('returns undefined when salary strings contain no parseable amount', () => {
		expect(salaryRange([job({ salary: 'Competitive' })])).toBeUndefined();
	});

	it('formats a single amount without a range', () => {
		expect(salaryRange([job({ salary: '$120,000' })])).toBe('$120K');
	});

	it('formats a range from one comma-formatted string', () => {
		expect(salaryRange([job({ salary: '$120,000 – $180,000' })])).toBe(`$120K ${EN_DASH} $180K`);
	});

	it('expands the k suffix to thousands', () => {
		expect(salaryRange([job({ salary: '$120k - $180k' })])).toBe(`$120K ${EN_DASH} $180K`);
	});

	it('spans amounts across multiple jobs and ignores those without salary', () => {
		const jobs = [job({ salary: '$100k' }), job({ salary: '$200k' }), job({})];
		expect(salaryRange(jobs)).toBe(`$100K ${EN_DASH} $200K`);
	});

	it('rounds to the nearest thousand', () => {
		expect(salaryRange([job({ salary: '$150,500' })])).toBe('$151K');
	});
});

describe('extractGreenhouseSalary', () => {
	it('reads a salary value from matching metadata', () => {
		const meta = { metadata: [{ name: 'Salary Range', value: '$120k–$180k' }] };
		expect(extractGreenhouseSalary(meta)).toBe('$120k–$180k');
	});

	it('matches compensation and pay metadata names too', () => {
		expect(extractGreenhouseSalary({ metadata: [{ name: 'Total Compensation', value: '$200k' }] })).toBe('$200k');
		expect(extractGreenhouseSalary({ metadata: [{ name: 'Base Pay', value: '$90k' }] })).toBe('$90k');
	});

	it('skips metadata entries with no value', () => {
		expect(extractGreenhouseSalary({ metadata: [{ name: 'salary', value: '' }] })).toBeUndefined();
	});

	it('ignores non-salary metadata', () => {
		expect(extractGreenhouseSalary({ metadata: [{ name: 'Department', value: 'Engineering' }] })).toBeUndefined();
	});

	it('decodes double-encoded HTML and extracts the pay-range section', () => {
		const content = '&lt;div class="pay-range"&gt;$120,000&mdash;$180,000&lt;/div&gt;';
		expect(extractGreenhouseSalary({ content })).toBe(`$120,000${EN_DASH}$180,000`);
	});

	it('strips inner tags and normalises whitespace inside pay-range', () => {
		const content = '<div class="pay-range">\n  <span>$100k</span>\n</div>';
		expect(extractGreenhouseSalary({ content })).toBe('$100k');
	});

	it('returns undefined when there is no metadata or pay-range content', () => {
		expect(extractGreenhouseSalary({})).toBeUndefined();
		expect(extractGreenhouseSalary({ content: '<div>no salary here</div>' })).toBeUndefined();
	});
});

describe('parseCareersHtml', () => {
	// Pattern 1: Every-style — span department, h3 title, Apply link, gated on #open-roles
	const everyHtml = [
		'<section>',
		'<div id="open-roles">',
		'<span>Engineering</span><h3>Staff Engineer</h3><a href="https://every.to/jobs/staff">Apply now</a>',
		'<span>Design</span><h3>Product Designer</h3><a href="https://every.to/jobs/designer">Apply</a>',
		'<span>Other</span><h3>Don\'t see your role? Reach out</h3><a href="https://every.to/contact">Apply</a>',
		'</div>',
		'</section>',
	].join('\n');

	it('parses Every-style cards and drops the "Don\'t see your role" card', () => {
		expect(parseCareersHtml(everyHtml, 'https://every.to', '')).toEqual([
			{ title: 'Staff Engineer', url: 'https://every.to/jobs/staff', location: '—', department: 'Engineering', company: '' },
			{ title: 'Product Designer', url: 'https://every.to/jobs/designer', location: '—', department: 'Design', company: '' },
		]);
	});

	it('filters Every-style results by department', () => {
		const result = parseCareersHtml(everyHtml, 'https://every.to', 'engineering');
		expect(result).toHaveLength(1);
		expect(result[0]!.title).toBe('Staff Engineer');
	});

	// Pattern 2: Shopify-style — only runs when Pattern 1 finds nothing
	const shopifyHtml = [
		'<ul>',
		'<a href="/careers/senior-dev_abc123"><h4>Senior Developer</h4><span>Ottawa</span></a>',
		'<a href="/careers/designer_def456"><h4>Designer</h4><span>Remote</span></a>',
		'</ul>',
	].join('\n');

	it('falls back to Shopify-style links and absolutises relative hrefs', () => {
		expect(parseCareersHtml(shopifyHtml, 'https://shopify.com', '')).toEqual([
			{ title: 'Senior Developer', url: 'https://shopify.com/careers/senior-dev_abc123', location: 'Ottawa', department: '', company: '' },
			{ title: 'Designer', url: 'https://shopify.com/careers/designer_def456', location: 'Remote', department: '', company: '' },
		]);
	});

	it('skips Shopify-style links with query strings, missing h4, and treats "Apply" as no location', () => {
		const html = [
			'<a href="/careers/old_role?foo=bar"><h4>Old Role</h4><span>NY</span></a>',
			'<a href="/careers/no-title_x1"><span>Nope</span></a>',
			'<a href="/careers/applyish_x2"><h4>Open Role</h4><span>Apply</span></a>',
		].join('\n');
		expect(parseCareersHtml(html, 'https://shopify.com', '')).toEqual([
			{ title: 'Open Role', url: 'https://shopify.com/careers/applyish_x2', location: '—', department: '', company: '' },
		]);
	});

	it('filters Shopify-style results by title when there is no department', () => {
		const result = parseCareersHtml(shopifyHtml, 'https://shopify.com', 'designer');
		expect(result).toHaveLength(1);
		expect(result[0]!.title).toBe('Designer');
	});

	it('returns an empty array when nothing matches', () => {
		expect(parseCareersHtml('<div>no jobs</div>', 'https://x.com', '')).toEqual([]);
	});
});

describe('normalizeGreenhouseJobs', () => {
	it('returns an empty array when the payload has no jobs', () => {
		expect(normalizeGreenhouseJobs({}, '')).toEqual([]);
		expect(normalizeGreenhouseJobs({ jobs: [] }, 'engineering')).toEqual([]);
	});

	it('filters by department and maps fields including salary from metadata', () => {
		const data = {
			jobs: [
				{
					title: 'Staff Engineer',
					absolute_url: 'https://boards.greenhouse.io/acme/1',
					departments: [{ name: 'Engineering' }],
					location: { name: 'Remote - US' },
					metadata: [{ name: 'Pay Range', value: '$180k–$220k' }],
				},
				{
					title: 'Marketer',
					absolute_url: 'https://boards.greenhouse.io/acme/2',
					departments: [{ name: 'Marketing' }],
					location: { name: 'NYC' },
				},
			],
		};
		expect(normalizeGreenhouseJobs(data, 'engineering')).toEqual([
			{
				title: 'Staff Engineer',
				url: 'https://boards.greenhouse.io/acme/1',
				location: 'Remote - US',
				department: 'Engineering',
				company: '',
				salary: '$180k–$220k',
			},
		]);
	});

	it('falls back to Remote location and undefined salary when absent', () => {
		const data = { jobs: [{ title: 'Eng', absolute_url: 'https://x/1', departments: [{ name: 'Eng' }] }] };
		expect(normalizeGreenhouseJobs(data, '')[0]).toMatchObject({ location: 'Remote', salary: undefined });
	});
});

describe('normalizeAshbyJobs', () => {
	it('returns an empty array when the payload has no jobs', () => {
		expect(normalizeAshbyJobs({}, 'acme', '')).toEqual([]);
	});

	it('maps fields and uses jobUrl when present', () => {
		const data = {
			jobs: [
				{
					title: 'Backend Engineer',
					jobUrl: 'https://jobs.ashbyhq.com/acme/abc',
					departmentName: 'Engineering',
					locationName: 'Remote',
					compensationTierSummary: '$140k–$170k',
				},
			],
		};
		expect(normalizeAshbyJobs(data, 'acme', 'engineering')).toEqual([
			{
				title: 'Backend Engineer',
				url: 'https://jobs.ashbyhq.com/acme/abc',
				location: 'Remote',
				department: 'Engineering',
				company: '',
				salary: '$140k–$170k',
			},
		]);
	});

	it('synthesises a URL from boardId + id and falls back to Remote when fields are missing', () => {
		const data = { jobs: [{ title: 'Eng', id: 'xyz', departmentName: 'Engineering' }] };
		expect(normalizeAshbyJobs(data, 'acme', '')[0]).toMatchObject({
			url: 'https://jobs.ashbyhq.com/acme/xyz',
			location: 'Remote',
			salary: undefined,
		});
	});

	it('matches the filter on team or title, not just department', () => {
		const data = {
			jobs: [
				{ title: 'Designer', id: '1', teamName: 'Platform' },
				{ title: 'Platform Engineer', id: '2', departmentName: 'Engineering' },
				{ title: 'Recruiter', id: '3', departmentName: 'People' },
			],
		};
		const result = normalizeAshbyJobs(data, 'acme', 'platform');
		expect(result.map((j) => j.title)).toEqual(['Designer', 'Platform Engineer']);
	});

	it('falls back from departmentName to department', () => {
		const data = { jobs: [{ title: 'Eng', id: '1', department: 'Engineering' }] };
		expect(normalizeAshbyJobs(data, 'acme', '')[0]!.department).toBe('Engineering');
	});
});
