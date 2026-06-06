---
name: observability
description: How harnessed.md is instrumented for production observation — PostHog product analytics, exception tracking, and build-time source-map upload. Use when adding or changing event tracking, touching the PostHog setup, debugging why analytics/errors aren't recording, or wiring the required environment variables in Vercel.
---

# Observability

Production observation is PostHog: product analytics, exception autocapture, and source-map upload for readable stack traces. The static site has no backend, so everything is client-side plus a build-time upload step.

## Product analytics

PostHog loads via an env-driven **inline snippet** in `src/components/posthog.astro`, pulled into every page through `Base.astro`'s `<head>`. PostHog ships its library from its own CDN at runtime (`/static/array.js`) — there is **no `posthog-js` dependency**, so don't add one; use the `window.posthog` global.

Events fire through `window.posthog?.capture(...)` (and one `identify` on newsletter signup). The optional chaining means they **no-op safely** when the library hasn't loaded — e.g. no key, or an ad-blocker. Add new events the same way; keep names `snake_case` and consistent with the existing funnel events across `index.astro`, `jobs/index.astro`, `companies/[slug]/index.astro`, and `ReadingList.astro`.

## Error tracking

Exception autocapture (wrapping `window.onerror` / unhandled rejections) is **toggled on in the PostHog project settings — not in code**. There is no documented `init()` flag for it on the web SDK. Manual `posthog.captureException(err)` is available for real client-side error boundaries, but the existing catch blocks here (GitHub star fetch, clipboard copy) are low-signal externals not worth capturing.

## Source maps

`@posthog/rollup-plugin` (a devDependency) runs in the Vite build via `astro.config.ts` to upload source maps so captured stack traces resolve to real source. It is **gated on `POSTHOG_API_KEY`**: local and CI builds don't set it, so the plugin is skipped and the gate stays green; only the Vercel production build, where the secret is set, generates → uploads → deletes the maps. `releaseVersion` is the deploy's commit SHA, for deploy-marker attribution.

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | `.env` (local) **and Vercel** (Production + Preview) | Public `phc_` client token; Astro inlines `PUBLIC_*` at build time. Without it in Vercel, production analytics silently no-op. |
| `PUBLIC_POSTHOG_HOST` | same | e.g. `https://us.i.posthog.com`. |
| `POSTHOG_API_KEY` | **Vercel only** (Production), server-side | Personal API key with *write* on Error Tracking. **Never `PUBLIC_`** — it must not reach the client bundle. Enables source-map upload. |
| `POSTHOG_PROJECT_ID` | **Vercel only** (Production), server-side | The PostHog project ID, required by the upload. |

`PUBLIC_*` vars are inlined into client JS at build, so they must exist at build time wherever the site is built (local + Vercel). The non-`PUBLIC_` keys are build-time secrets used only by the source-map plugin.

## Turning it on (manual steps)

1. Set the four vars above in the Vercel project env, then redeploy (env changes don't apply retroactively).
2. Enable exception autocapture in the PostHog project's Error Tracking settings.
3. Verify: a `/<token>/view` request fires on page load (analytics), and a deploy uploads a symbol set to PostHog (source maps — check the Vercel build log).
