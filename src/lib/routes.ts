// Maps built HTML files to the routes they serve, so the link checker can
// resolve internal #fragment links against the right page. A silent miss here
// (returning a route nothing links to) would make the checker skip links
// instead of flagging them, so these are unit-tested in routes.test.ts.

// dist-relative path -> route. "guides/index.html" -> "/guides"; "index.html" -> "/".
export function fileToRoute(relativePath: string): string {
	const rel = relativePath.replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
	return '/' + rel.replace(/\/$/, '');
}

// Normalizes an href path so it matches a fileToRoute output.
// "/guides/" and "/guides" both become "/guides"; "/" stays "/".
export function normalizeRoute(path: string): string {
	return path === '/' ? '/' : '/' + path.replace(/^\//, '').replace(/\/$/, '');
}

// Decides whether an internal href's #fragment resolves to a real id on its
// target page, given a map of route -> ids on that page. Returns the broken
// target when it doesn't resolve, or null when the link is fine OR not ours to
// check (external, no fragment, or a route we didn't build — the deliberate
// skips that must NOT silently swallow a genuinely broken same-site anchor).
export function findBrokenAnchor(
	href: string,
	currentRoute: string,
	idsByRoute: Map<string, Set<string>>,
): { targetRoute: string; fragment: string } | null {
	if (/^https?:\/\//.test(href)) return null; // external — checked elsewhere
	if (!href.includes('#')) return null;
	const [beforeFragment = '', fragment = ''] = href.split('#');
	if (!fragment) return null;
	const pathPart = beforeFragment.split('?')[0] ?? ''; // drop any query string
	const targetRoute = pathPart === '' ? currentRoute : normalizeRoute(pathPart);
	const ids = idsByRoute.get(targetRoute);
	if (ids === undefined) return null; // not an HTML route we built — skip
	return ids.has(fragment) ? null : { targetRoute, fragment };
}
