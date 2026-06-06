const REPO = 'fredrivett/harnessed.md';

// Loose model of the GitHub repo API payload — comes off the network untyped,
// so the only field we read is optional and defended with a fallback.
interface RawGithubRepo {
	stargazers_count?: number;
}

// Memoised so a full `astro build` makes one request, not one per page. All
// pages share this module instance, so they reuse the same in-flight promise.
let starsPromise: Promise<number | null> | undefined;

async function fetchStars(): Promise<number | null> {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}`, {
			headers: { Accept: 'application/vnd.github+json' },
			// Don't let a slow/hanging GitHub stall the build — the count is
			// non-critical (the client refreshes it live) so degrade fast.
			signal: AbortSignal.timeout(3000),
		});
		if (!res.ok) return null;
		const data: RawGithubRepo = await res.json();
		return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
	} catch {
		// Offline, rate-limited, or timed out — render the en dash placeholder.
		return null;
	}
}

export function getStarCount(): Promise<number | null> {
	starsPromise ??= fetchStars();
	return starsPromise;
}

// 1234 -> "1.2k", 999 -> "999". Keeps the badge narrow.
export function formatStars(count: number): string {
	if (count < 1000) return String(count);
	const k = count / 1000;
	return `${k.toFixed(k < 10 ? 1 : 0).replace(/\.0$/, '')}k`;
}
