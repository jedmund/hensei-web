# Migration Advice: Next App Router + next-intl vs. SvelteKit

## Context
Small hobby app for a niche game community: create/share team compositions, with aspirations for collection tracking. Current stack is Next.js with a hybrid of Pages + App Router and `next-i18next`. The path forward considers migrating to Next 15 with `next-intl` or rewriting in SvelteKit.

## Opinionated Summary
- If you stay on Next: unify on App Router and `next-intl`. It’s the idiomatic, low-risk path on Next 15 and removes hybrid friction.
- If you prefer SvelteKit and want a better DX long term: a focused rewrite is reasonable for this scope. Expect higher upfront cost, but likely faster iteration afterwards.

## When Staying on Next
- App Router: move fully off Pages Router to reduce complexity.
- i18n: adopt `next-intl` idioms.
  - Localized segment `app/[locale]/layout.tsx` with `unstable_setRequestLocale` and `getMessages()`.
  - Compose middleware: run `next-intl` first, then auth; strip locale before auth checks.
  - Replace `next/link` and `next/navigation` with `next-intl/navigation` to preserve locale.
  - Replace `useTranslation` with `useTranslations` and `<Trans>` with `t.rich()`.
  - Localize metadata via `getTranslations` in `generateMetadata`.
  - Remove `i18n` from `next.config.js`; delete `next-i18next.config.js` when done.
- Effort: medium. Many small file touches, predictable changes, minimal risk.

## When Switching to SvelteKit
- Fit: Excellent for small, interactive apps; simpler routing and data loading; stores are ergonomic; great DX.
- i18n: Use `svelte-i18n` or `typesafe-i18n`; reuse existing JSON namespaces.
- Migration outline:
  - Rebuild routes and core UI (builder, share pages) first.
  - Port styles and assets; map API endpoints or use SvelteKit endpoints.
  - Re-implement auth/cookies and URL structure for shareability.
  - Add collection tracking after the core flow is stable.
- Effort: medium–high. A rewrite is real work, but constrained domain makes it feasible.

## Decision Guidance
- Choose Next if you want quickest path to stability with current code.
- Choose SvelteKit if you value developer experience and faster iteration beyond the migration.

## Practical Next Steps (Next.js Path)
1. Create `i18n.config.ts` with `locales` and `defaultLocale`.
2. Compose `middleware.ts` with `next-intl/middleware` first, then auth (strip locale).
3. Add `app/[locale]/layout.tsx` with `unstable_setRequestLocale` + `getMessages()` and `NextIntlClientProvider`.
4. Replace `next/link` and `next/navigation` with `next-intl/navigation`.
5. Swap `next-i18next` usages for `next-intl` (`useTranslations`, `t.rich`).
6. Localize `generateMetadata`; update server-only paths to use `getTranslations`.
7. Remove `i18n` from `next.config.js`; delete `next-i18next.config.js` and dependency.
8. Remove Pages Router pages once App Router feature parity is confirmed.

## Practical Next Steps (SvelteKit Path)
1. Prototype the builder and a share page in SvelteKit.
2. Port translations; wire `svelte-i18n` or `typesafe-i18n`.
3. Recreate auth/session and URL structures.
4. Decide incremental migration (subdomain) vs. cutover.
5. Migrate remaining features; add collection tracking last.

## Recommendation
Stabilize quickly by finishing the Next App Router + `next-intl` migration you’ve already started. If Next still feels clunky after that, plan a small SvelteKit prototype; if the DX clicks, proceed with a focused rewrite.

