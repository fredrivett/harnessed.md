import { formatStars } from '../lib/github';

// The build-time count renders instantly; this refreshes it to live on load.
// GitHub's unauthenticated API allows 60 req/hour per visitor IP — plenty.
const link = document.querySelector<HTMLAnchorElement>('.github-star');
if (link) {
	fetch('https://api.github.com/repos/fredrivett/harnessed.md', {
		headers: { Accept: 'application/vnd.github+json' },
	})
		.then((res) => (res.ok ? res.json() : null))
		.then((data: { stargazers_count?: number } | null) => {
			const count = data?.stargazers_count;
			if (typeof count !== 'number') return;
			let span = link.querySelector<HTMLSpanElement>('.star-count');
			if (!span) {
				span = document.createElement('span');
				span.className = 'star-count';
				link.appendChild(span);
			}
			// En dash for a zero count too — don't display a bare "0".
			span.textContent = count > 0 ? formatStars(count) : '–';
		})
		.catch(() => {
			// Offline or rate-limited — keep the build-time count.
		});
}
