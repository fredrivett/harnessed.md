import { readFileSync, existsSync } from 'fs';
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

// --- Integration: check built llms.txt files ---

const dist = join(import.meta.dirname, '..', 'dist');

const htmlTagRegex = /<\/?(?:pre|code|a|div|span|p|section|ul|li|ol|table|tr|td|th|thead|tbody|img|br|hr)\b[^>]*>/i;

function checkFile(path: string, label: string, checks: (content: string) => void) {
  const fullPath = join(dist, path);
  assert(existsSync(fullPath), `${label}: file should exist at ${path}`);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf-8');
  const htmlMatch = content.match(htmlTagRegex);
  assert(!htmlMatch, `${label}: contains raw HTML: ${htmlMatch?.[0]}`);
  checks(content);
}

// /llms.txt — slim index
checkFile('llms.txt', 'llms.txt', (content) => {
  assert(content.includes('# harnessed.md'), 'llms.txt should have title');
  assert(content.includes('## Sections'), 'llms.txt should have Sections');
  assert(content.includes('/llms-full.txt'), 'llms.txt should link to llms-full.txt');
  assert(content.includes('/guides/llms.txt'), 'llms.txt should link to guides/llms.txt');
  assert(content.includes('/jobs/llms.txt'), 'llms.txt should link to jobs/llms.txt');
  assert(content.includes('/companies/llms.txt'), 'llms.txt should link to companies/llms.txt');
  assert(content.includes('## Companies'), 'llms.txt should have Companies section');
});

// /llms-full.txt — everything in one file
checkFile('llms-full.txt', 'llms-full.txt', (content) => {
  assert(content.includes('# harnessed.md'), 'llms-full.txt should have title');
  assert(content.includes('## Companies'), 'llms-full.txt should have Companies section');
  assert(content.includes('## Key reading'), 'llms-full.txt should have Key reading section');
  assert(content.includes('## AGENTS.md'), 'llms-full.txt should have guides content');
  assert(content.includes('```\nIntent'), 'llms-full.txt should have ASCII diagram in fenced code block');
  assert(!content.includes('<pre>'), 'llms-full.txt should not contain <pre> tags');
});

// /guides/llms.txt
checkFile('guides/llms.txt', 'guides/llms.txt', (content) => {
  assert(content.includes('# Guides'), 'guides/llms.txt should have title');
  assert(content.includes('## AGENTS.md'), 'guides/llms.txt should have AGENTS.md section');
  assert(content.includes('## Further reading'), 'guides/llms.txt should have Further reading');
});

// /jobs/llms.txt
checkFile('jobs/llms.txt', 'jobs/llms.txt', (content) => {
  assert(content.includes('# Engineering jobs'), 'jobs/llms.txt should have title');
  assert(content.includes('openings across'), 'jobs/llms.txt should have job count summary');
});

// /companies/llms.txt
checkFile('companies/llms.txt', 'companies/llms.txt', (content) => {
  assert(content.includes('# Companies'), 'companies/llms.txt should have title');
  assert(content.includes('OpenAI'), 'companies/llms.txt should list OpenAI');
});

// /companies/openai/llms.txt (spot check one company)
checkFile('companies/openai/llms.txt', 'companies/openai/llms.txt', (content) => {
  assert(content.includes('# OpenAI'), 'companies/openai/llms.txt should have company name');
  assert(content.includes('## Engineering jobs'), 'companies/openai/llms.txt should have jobs section');
});

// --- Results ---

if (errors.length) {
  console.error(`\n❌ ${errors.length} llms.txt check(s) failed:\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error('');
  process.exit(1);
} else {
  console.log('✓ llms.txt checks passed');
}
