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
