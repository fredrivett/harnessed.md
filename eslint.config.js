import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// Correctness + agent anti-patterns only — no formatting/stylistic rules, so
// the existing code style (tabs, etc.) is left untouched. `astro check` remains
// the source of truth for types; ESLint adds the rules a type-checker won't,
// notably blocking the `any` escape hatch agents reach for.
//
// Plain flat-config array (not the `tseslint.config()` helper, whose overload
// astro check flags as deprecated) — we don't use `extends`, so the array form
// is equivalent.
export default [
	{ ignores: ['dist/', '.astro/'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...astro.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
		},
		rules: {
			// no-undef is off because TS (via astro check) already resolves
			// identifiers; leaving it on double-reports and false-positives on
			// ambient/env globals.
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},
];
