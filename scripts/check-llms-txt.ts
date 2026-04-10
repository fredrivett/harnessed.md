import { readFileSync } from 'fs';
import { join } from 'path';
import { toPlainMarkdown } from '../src/lib/markdown';

const errors: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

// --- Unit tests for toPlainMarkdown ---

// Converts <pre><code> to fenced code blocks
assert(
  toPlainMarkdown('<pre><code>hello\nworld</code></pre>') === '```\nhello\nworld\n```',
  'should convert <pre><code> to fenced code blocks'
);

// Strips <a> tags inside code blocks
assert(
  toPlainMarkdown('<pre><code><a href="/guides">Guides</a> ◄───</code></pre>') === '```\nGuides ◄───\n```',
  'should strip <a> tags inside code blocks'
);

// Strips <a> tags outside code blocks
assert(
  toPlainMarkdown('See <a href="/guides">Guides</a> for more.') === 'See Guides for more.',
  'should strip <a> tags outside code blocks'
);

// Leaves plain markdown untouched
const plain = '## Hello\n\n- one\n- two';
assert(
  toPlainMarkdown(plain) === plain,
  'should leave plain markdown untouched'
);

// Handles multiple code blocks
const multi = '<pre><code>a</code></pre>\n\ntext\n\n<pre><code>b</code></pre>';
assert(
  toPlainMarkdown(multi) === '```\na\n```\n\ntext\n\n```\nb\n```',
  'should handle multiple code blocks'
);

// --- Integration: check built llms.txt ---

const dist = join(import.meta.dirname, '..', 'dist');
const llmsTxt = readFileSync(join(dist, 'llms.txt'), 'utf-8');

// No raw HTML tags in output
const htmlTagRegex = /<\/?(?:pre|code|a|div|span|p|section|ul|li|ol|table|tr|td|th|thead|tbody|img|br|hr)\b[^>]*>/i;
const htmlMatch = llmsTxt.match(htmlTagRegex);
assert(
  !htmlMatch,
  `llms.txt contains raw HTML: ${htmlMatch?.[0]}`
);

// Contains expected sections
assert(llmsTxt.includes('# harnessed.md'), 'llms.txt should have title');
assert(llmsTxt.includes('## Companies'), 'llms.txt should have Companies section');
assert(llmsTxt.includes('## Key reading'), 'llms.txt should have Key reading section');
assert(llmsTxt.includes('## AGENTS.md'), 'llms.txt should have guides content');

// ASCII diagram is in a fenced code block, not raw HTML
assert(llmsTxt.includes('```\nIntent'), 'llms.txt should have ASCII diagram in fenced code block');
assert(!llmsTxt.includes('<pre>'), 'llms.txt should not contain <pre> tags');

// --- Results ---

if (errors.length) {
  console.error(`\n❌ ${errors.length} llms.txt check(s) failed:\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error('');
  process.exit(1);
} else {
  console.log('✓ llms.txt checks passed');
}
