// Adds a copy button to every rendered code block (pre.astro-code, the Shiki
// output for fenced code). Skips the hand-written ASCII diagram on the home
// page, which is a plain <pre> without the .astro-code class.

const COPIED_MS = 1500;

const COPY_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

const CHECK_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function setIdle(btn: HTMLButtonElement) {
	btn.innerHTML = `${COPY_ICON}<span>Copy</span>`;
	btn.setAttribute('aria-label', 'Copy code');
	btn.classList.remove('copied');
}

function setCopied(btn: HTMLButtonElement) {
	btn.innerHTML = `${CHECK_ICON}<span>Copied</span>`;
	btn.setAttribute('aria-label', 'Copied');
	btn.classList.add('copied');
}

document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
	if (pre.parentElement?.classList.contains('code-block')) return;

	const wrap = document.createElement('div');
	wrap.className = 'code-block';
	pre.parentNode?.insertBefore(wrap, pre);
	wrap.appendChild(pre);

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'copy-btn';
	setIdle(btn);
	wrap.appendChild(btn);

	let timer: ReturnType<typeof setTimeout> | undefined;

	btn.addEventListener('click', async () => {
		const code = (pre.querySelector('code') ?? pre).textContent ?? '';
		try {
			await navigator.clipboard.writeText(code.replace(/\n$/, ''));
		} catch {
			return;
		}
		setCopied(btn);
		clearTimeout(timer);
		timer = setTimeout(() => setIdle(btn), COPIED_MS);
	});
});
