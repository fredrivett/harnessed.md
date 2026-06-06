import { describe, it, expect } from 'vitest';
import { salaryRange, extractGreenhouseSalary, type Job } from './jobs';

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
