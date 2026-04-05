import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const dist = join(import.meta.dirname, '..', 'dist');
const errors: string[] = [];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (full.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const linkRegex = /<a\s[^>]*href="(https?:\/\/[^"]*)"[^>]*>/g;
const relRegex = /\brel="([^"]*)"/;
const targetRegex = /\btarget="([^"]*)"/;

for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf-8');
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0];
    const path = relative(dist, file);

    const hasTargetBlank = targetRegex.test(tag) && tag.match(targetRegex)?.[1] === '_blank';
    const hasRelNoopener = relRegex.test(tag) && (tag.match(relRegex)?.[1] ?? '').includes('noopener');

    if (!hasTargetBlank || !hasRelNoopener) {
      const missing = [
        !hasTargetBlank && 'target="_blank"',
        !hasRelNoopener && 'rel="noopener"',
      ].filter(Boolean).join(' and ');
      errors.push(`${path}: missing ${missing} on ${tag.slice(0, 80)}`);
    }
  }
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} external link(s) missing target="_blank" rel="noopener":\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error('');
  process.exit(1);
} else {
  console.log('✓ All external links have target="_blank" rel="noopener"');
}
