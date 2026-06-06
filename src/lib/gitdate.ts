import { execFileSync } from 'node:child_process';

/**
 * Last git commit date (committer date, strict ISO) across one or more
 * repo-relative paths — i.e. when a page's source content was last edited.
 * With several paths, returns the single newest date among them.
 *
 * Runs at build time (SSG) and in dev. Returns null when no real date is
 * available — git missing, an untracked/uncommitted file, or a shallow CI
 * clone where the file's last commit is outside the fetched depth. Callers
 * omit the timestamp rather than show a misleading build-time stand-in.
 */
export function lastModified(...paths: string[]): Date | null {
	try {
		const out = execFileSync(
			'git',
			['log', '-1', '--format=%cI', '--', ...paths],
			{ encoding: 'utf8' },
		).trim();
		if (out) return new Date(out);
	} catch {
		// git missing or paths untracked — no reliable date to show
	}
	return null;
}
