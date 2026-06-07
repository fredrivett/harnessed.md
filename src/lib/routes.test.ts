import { describe, it, expect } from 'vitest';
import { fileToRoute, normalizeRoute } from './routes';

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
