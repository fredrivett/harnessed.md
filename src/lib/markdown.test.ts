import { describe, it, expect } from 'vitest';
import { toPlainMarkdown, stripPromptSection, demoteHeadings } from './markdown';

describe('toPlainMarkdown', () => {
	it('rewrites section links to their /llms.txt variant, preserving anchors', () => {
		expect(toPlainMarkdown('see [hooks](/guides#hooks)')).toBe('see [hooks](/guides/llms.txt#hooks)');
		expect(toPlainMarkdown('see [guides](/guides)')).toBe('see [guides](/guides/llms.txt)');
	});

	it('rewrites every section path', () => {
		expect(toPlainMarkdown('[a](/verification#tests) [b](/observation) [c](/audit#x)')).toBe(
			'[a](/verification/llms.txt#tests) [b](/observation/llms.txt) [c](/audit/llms.txt#x)'
		);
	});

	it('leaves non-section and external links untouched', () => {
		expect(toPlainMarkdown('[jobs](/jobs) [ext](https://x.com/guides)')).toBe(
			'[jobs](/jobs) [ext](https://x.com/guides)'
		);
	});

	it('strips anchor tags down to their text', () => {
		expect(toPlainMarkdown('go <a href="https://x.com">here</a> now')).toBe('go here now');
	});

	it('converts a pre/code block to a fenced block, stripping inner anchors', () => {
		const html = '<pre><code>ln -s <a href="/x">AGENTS.md</a> CLAUDE.md</code></pre>';
		expect(toPlainMarkdown(html)).toBe('```\nln -s AGENTS.md CLAUDE.md\n```');
	});
});

describe('stripPromptSection', () => {
	it('removes the "## The prompt" section up to the next h2, keeping surrounding content', () => {
		const body = [
			'Intro paragraph.',
			'',
			'## The prompt',
			'',
			'```',
			'do the thing',
			'```',
			'',
			'## Scoring',
			'',
			'Score it.',
		].join('\n');
		const result = stripPromptSection(body);
		expect(result).not.toContain('## The prompt');
		expect(result).not.toContain('do the thing');
		expect(result).toContain('Intro paragraph.');
		expect(result).toContain('## Scoring');
		expect(result).toContain('Score it.');
	});

	it('is a no-op when there is no prompt section', () => {
		const body = '## Scoring\n\nNo prompt here.';
		expect(stripPromptSection(body)).toBe(body);
	});
});

describe('demoteHeadings', () => {
	it('demotes headings one level', () => {
		expect(demoteHeadings('## Title\n\ntext')).toBe('### Title\n\ntext');
		expect(demoteHeadings('### Sub')).toBe('#### Sub');
	});

	it('caps at h6 — h5 becomes h6, h6 is left alone', () => {
		expect(demoteHeadings('##### Five')).toBe('###### Five');
		expect(demoteHeadings('###### Six')).toBe('###### Six');
	});

	it('does not touch # lines inside fenced code blocks', () => {
		const input = ['## Heading', '', '```', '# not a heading', '```', '', '## After'].join('\n');
		const expected = ['### Heading', '', '```', '# not a heading', '```', '', '### After'].join('\n');
		expect(demoteHeadings(input)).toBe(expected);
	});

	it('leaves content without headings unchanged', () => {
		const input = 'Just a paragraph with a # hash mid-line.';
		expect(demoteHeadings(input)).toBe(input);
	});
});
