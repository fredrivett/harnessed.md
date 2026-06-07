import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileToRoute, findBrokenAnchor } from '../src/lib/routes';

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

const routeOf = (file: string) => fileToRoute(relative(dist, file));

const htmlFiles = walk(dist);

// Map every route to the set of element ids it renders, so we can check that
// internal #fragment links actually resolve. rehype-slug strips dots, so a
// heading like "AGENTS.md" yields id="agentsmd" — a link to #agents-md is dead.
const idsByRoute = new Map<string, Set<string>>();
const idRegex = /\sid="([^"]+)"/g;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const ids = new Set<string>();
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    if (match[1]) ids.add(match[1]);
  }
  idsByRoute.set(routeOf(file), ids);
}

const linkRegex = /<a\s[^>]*href="([^"]*)"[^>]*>/g;
const relRegex = /\brel="([^"]*)"/;
const targetRegex = /\btarget="([^"]*)"/;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const route = routeOf(file);
  const path = relative(dist, file);
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0];
    const href = match[1] ?? '';

    if (/^https?:\/\//.test(href)) {
      // External links must open safely.
      const hasTargetBlank = targetRegex.test(tag) && tag.match(targetRegex)?.[1] === '_blank';
      const hasRelNoopener = relRegex.test(tag) && (tag.match(relRegex)?.[1] ?? '').includes('noopener');

      if (!hasTargetBlank || !hasRelNoopener) {
        const missing = [
          !hasTargetBlank && 'target="_blank"',
          !hasRelNoopener && 'rel="noopener"',
        ].filter(Boolean).join(' and ');
        errors.push(`${path}: missing ${missing} on ${tag.slice(0, 80)}`);
      }
      continue;
    }

    // Internal anchors must resolve to a real id on the target page.
    const broken = findBrokenAnchor(href, route, idsByRoute);
    if (broken) {
      errors.push(`${path}: broken anchor "#${broken.fragment}" -> ${broken.targetRoute} (no matching id)`);
    }
  }
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} link issue(s):\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error('');
  process.exit(1);
} else {
  console.log('✓ External links open safely and all internal anchors resolve');
}
