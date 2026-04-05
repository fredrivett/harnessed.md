if (window.location.hash) {
	const el = document.querySelector(window.location.hash);
	if (el) el.scrollIntoView();
}

const themes = ['auto', 'light', 'dark'] as const;
type Theme = typeof themes[number];

function getStored(): Theme {
	const stored = localStorage.getItem('theme');
	return themes.includes(stored as Theme) ? (stored as Theme) : 'auto';
}

function apply(theme: Theme) {
	const root = document.documentElement;
	root.setAttribute('data-theme', theme);

	if (theme === 'auto') {
		root.style.colorScheme = '';
		root.removeAttribute('data-force-theme');
	} else {
		root.style.colorScheme = theme;
		root.setAttribute('data-force-theme', theme);
	}

	const btn = document.getElementById('theme-toggle');
	if (btn) btn.title = theme === 'auto' ? 'system' : theme;
}

const current = getStored();
apply(current);

document.getElementById('theme-toggle')?.addEventListener('click', () => {
	const next = themes[(themes.indexOf(getStored()) + 1) % themes.length];
	localStorage.setItem('theme', next);
	apply(next);
});
