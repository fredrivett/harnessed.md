import { describe, it, expect } from 'vitest';
import { fileToRoute, normalizeRoute, findBrokenAnchor } from './routes';

describe('fileToRoute', () => {
	it('maps the root index to "/"', () => {
		expect(fileToRoute('index.html')).toBe('/');
	});

	it('maps a nested index to its directory route', () => {
		expect(fileToRoute('guides/index.html')).toBe('/guides');
		expect(fileToRoute('audit/index.html')).toBe('/audit');
	});

	it('maps a non-index html file to a route', () => {
		expect(fileToRoute('404.html')).toBe('/404');
	});

	it('normalizes Windows separators', () => {
		expect(fileToRoute('guides\\index.html')).toBe('/guides');
	});
});

describe('normalizeRoute', () => {
	it('keeps the root route', () => {
		expect(normalizeRoute('/')).toBe('/');
	});

	it('strips a trailing slash so it matches fileToRoute output', () => {
		expect(normalizeRoute('/guides/')).toBe('/guides');
		expect(normalizeRoute('/guides')).toBe('/guides');
	});

	it('agrees with fileToRoute for the same page', () => {
		expect(normalizeRoute('/guides/')).toBe(fileToRoute('guides/index.html'));
	});
});

describe('findBrokenAnchor', () => {
	const ids = new Map<string, Set<string>>([
		['/guides', new Set(['agentsmd', 'hooks'])],
		['/audit', new Set([])],
	]);

	it('flags a cross-page anchor that resolves to no id (the original bug)', () => {
		expect(findBrokenAnchor('/guides#agents-md', '/audit', ids)).toEqual({
			targetRoute: '/guides',
			fragment: 'agents-md',
		});
	});

	it('passes a cross-page anchor that does resolve', () => {
		expect(findBrokenAnchor('/guides#agentsmd', '/audit', ids)).toBeNull();
	});

	it('resolves a same-page anchor against the current route', () => {
		expect(findBrokenAnchor('#hooks', '/guides', ids)).toBeNull();
		expect(findBrokenAnchor('#nope', '/guides', ids)).toEqual({
			targetRoute: '/guides',
			fragment: 'nope',
		});
	});

	it('resolves a target route written with a trailing slash', () => {
		expect(findBrokenAnchor('/guides/#hooks', '/audit', ids)).toBeNull();
	});

	// The deliberate skips: each must return null, never a false positive.
	it('skips external links', () => {
		expect(findBrokenAnchor('https://x.com/guides#agents-md', '/audit', ids)).toBeNull();
	});

	it('skips links with no fragment or an empty fragment', () => {
		expect(findBrokenAnchor('/guides', '/audit', ids)).toBeNull();
		expect(findBrokenAnchor('/guides#', '/audit', ids)).toBeNull();
	});

	it('skips routes that were not built (cannot verify, must not flag)', () => {
		expect(findBrokenAnchor('/jobs#anything', '/audit', ids)).toBeNull();
	});
});
