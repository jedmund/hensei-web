# PRD: Migrate Web App from Next.js to SvelteKit (Svelte 5 + Runes)

## Context
The app is a small but interactive site for building, saving, and sharing Granblue Fantasy team compositions. It currently runs on Next.js 14 using a hybrid of App Router and legacy Pages, with `next-intl` for i18n, Valtio for state, Radix-based UI wrappers, and Tiptap for rich text. The backend is a Rails API and will not change.

## Problem / Opportunity
- The UI layer carries Next-specific complexity (hybrid routing, middleware composition, Valtio, React wrappers around primitives) for a scope that aligns well with SvelteKit’s simpler mental model.
- Svelte 5 (Runes) and SvelteKit provide small, fast bundles and ergonomic state management for highly interactive UIs like the party editor.
- A rewrite would impose upfront cost but could yield better performance, maintainability, and developer experience.

## Goals
- Achieve feature and URL parity (including localized routing and auth/method guards) with the current Next.js app.
- Reuse domain types, data contracts, and i18n content; minimize churn to the Rails API layer.
- Maintain or improve perceived performance, accessibility, and UX of primitives (menus, dialogs, tooltips, toasts).

## Non‑Goals
- No changes to the Rails API endpoints, auth semantics, or data shape.
- No new product features beyond parity (performance and a11y improvements are in scope).

## Current State (Summary)
- Framework: Next.js 14 with `app/` and `pages/` side by side.
- Routing/i18n: `app/[locale]/…` with `next-intl` and “as-needed” default-locale prefixing; middleware composes i18n with auth/method guards.
- State: Valtio global stores for `accountState` and `appState` (party/grid/editor flows).
- Data: axios-based `utils/api.tsx`, app route handlers under `app/api/**` proxy to Rails; server helpers in `app/lib/*` with zod validation.
- UI: Components under `components/**` using SCSS modules, Radix-based wrappers, custom editor based on Tiptap React + custom extensions.
- URL State: `nuqs` binds filters to query params.
- Storybook: React/Next preset.

## Feature/Parity Requirements
- Public routes: `/`, `/new`, `/teams`, `/p/[party]` (+ tab segments), `/[username]`, `/about`, `/updates`, `/roadmap` with locale variants under `/ja` and default-locale “as-needed” behavior.
- Auth/method gates: protect `/saved` and `/profile`; 401 JSON for unauthorized API mutations; preserve method-based rules under `/api/**`.
- Party editor: weapons/summons/characters, job/skills/accessory, guidebooks, toggles, remix/delete, editability rules by cookie/user.
- Search & filters: team discovery with element/raid/recency, advanced filters from cookie, pagination (append/replace).
- i18n: reuse JSON namespaces; preserve current translation keys and locale cookie behavior.
- Primitives: dropdown menu, dialog, tooltip, toast, popover, select, switch, slider, command, segmented control with keyboard a11y.
- Editor: Tiptap with mentions, link, lists, headings, youtube, highlight, placeholder.

## Proposed Direction
Rebuild the web app on SvelteKit 2 and Svelte 5 Runes. Keep the Rails API contract intact. Adopt Svelte stores for global state and Runes for local component state. Replace React-specific libraries with Svelte-native equivalents while reusing JSON messages, type declarations, API contracts, and Tiptap core extensions.

## Target Architecture (SvelteKit)
- Routing: `src/routes/[lang=locale]/…` to mirror localized segments; top-level `/` redirects to `/new`.
- Hooks: `hooks.server.ts` handles locale detection/redirects and reproduces auth/method gates; `handleFetch` attaches bearer tokens from cookies.
- Data loading: `+layout.server.ts`/`+page.server.ts` for SSR (e.g., version, lists); `+page.ts` for client/SSR-unified fetches.
- Endpoints: `src/routes/api/**/+server.ts` proxy to Rails with zod validation and consistent status codes.
- State: Svelte `writable` stores for `account` and `app` (party, grid, search, jobs, skills, version), with typed helper actions; local UI state via runes.
- Theming: small store plus SSR-safe initial theme; apply class/data-theme on `<html>`.
- i18n: `svelte-i18n` (recommended) loading existing JSON bundles; locale cookie + accept-language fallback; “as-needed” default-locale paths.

## Dependency Mapping (Equivalents)
- Framework/Core:
  - `next` → `@sveltejs/kit`
  - `react`, `react-dom` → `svelte@5`
  - `@svgr/webpack` → `vite-svg-loader` (or inline SVG)
- Routing/URL State:
  - `next/navigation` → SvelteKit `goto`, `$page`, `afterNavigate`
  - `nuqs` → `$page.url.searchParams` + small helper or `sveltekit-search-params`
- Data/Query:
  - `@tanstack/react-query` → `@tanstack/svelte-query@5`
  - `axios` → keep or migrate to `fetch`; keep zod
- i18n:
  - `next-intl` → `svelte-i18n` (reuse JSON); remove `next-i18next`
  - `i18next*` libs → only if choosing an i18next-based Svelte binding (otherwise remove)
- UI/A11y:
  - `@radix-ui/*` → `bits-ui` primitives and/or `shadcn-svelte`
  - `tippy.js` → `svelte-tippy` (or small custom)
  - `cmdk` → `cmdk-svelte`/`cmdk-sv`
- Theming:
  - `next-themes` → small Svelte store + cookie bootstrap
- Editor:
  - `@tiptap/react` → Tiptap core with Svelte integration (e.g., `svelte-tiptap`); reuse custom extensions
- Typeahead/Select/Infinite:
  - `react-bootstrap-typeahead` → `svelte-select`
  - `react-infinite-scroll-component` → `svelte-infinite-loading` or IO-based action
- Misc:
  - `cookies-next` → `event.cookies` server-side; `js-cookie` client
  - `react-use`/`usehooks-ts` → `svelte-use`
  - `remixicon-react` → `svelte-remixicon` or `unplugin-icons` (`ri:*`)
  - `react-linkify` → `linkifyjs`/`linkify-html`
  - SCSS → `svelte-preprocess` with component-scoped styles and global imports
  - Storybook: `@storybook/nextjs` → `@storybook/sveltekit`

## Reuse vs. Rewrite
- Reuse
  - i18n bundles under `public/locales/{en,ja}`
  - Domain types `types/*.d.ts` (move to `src/lib/types`)
  - Pure utilities in `utils/*` (parsers, enums, formatters)
  - API contracts and zod schemas (`app/lib/api-utils.ts`)
  - Tiptap custom extensions (`extensions/CustomMention`, `CustomSuggestion`)
  - Public assets and SVGs
- Rewrite
  - All React components and Valtio stores as Svelte components/stores
  - Next middleware as `hooks.server.ts` (auth + locale); API handlers as `+server.ts`
  - URL/query state helpers (replace `nuqs`)
  - Theming (replace `next-themes`)
  - Storybook stories
  - Font handling (move `pages/fonts/gk-variable.woff2` to `static/` and add `@font-face`)

## Routing & i18n Details
- Localized route group `[lang=locale]` constrained to `en|ja` (from existing `i18n.config.ts`).
- “As-needed” default-locale behavior via redirects in `handle` and locale-aware links.
- Preserve existing route structure and query semantics (e.g., `/teams?element=…&raid=…`).

## Auth & Cookies
- Mirror `middleware.ts` logic: protect `/saved` and `/profile`; method-guard mixed routes; return 401 JSON for API.
- Server: use `event.cookies` and set `locals.user`; client: `js-cookie` where necessary.
- Use `handleFetch` to inject `Authorization` header from `account` cookie token.

## State & Data
- Global state: writable stores mirroring `initialAccountState` and `initialAppState` with typed actions; local UI state via runes.
- Queries: `@tanstack/svelte-query` for client/SSR-safe caching; SSR data via `+page.server.ts` where beneficial.
- Invalidation: use SvelteKit `invalidate`/`invalidateAll` in place of Next `revalidatePath`.

## UI & Editor
- Primitives: build on Bits-UI/shadcn-svelte; verify keyboard navigation and focus management; carry over SCSS look-and-feel.
- Editor: use Tiptap core with Svelte wrapper; reuse mention/suggestion logic and toolbar feature set (bold/italic/strike/heading/list/link/youtube/highlight/placeholder).

## Performance & SEO
- Expect smaller bundles and faster hydration from Svelte runtime.
- Maintain SSR for primary pages and content; keep linkable, crawlable party pages and listings.
- Optimize images/SVGs via Vite pipeline; keep existing public assets.

## Tradeoffs (Pros / Cons)
- Pros: performance, simpler state and data flows, clearer SSR/CSR boundaries, component‑scoped styling, fast DX.
- Cons: full component rewrite, parity tuning for UI primitives, community-maintained editor bindings, team ramp‑up, Storybook conversion.

## Alternatives Considered
- Stay on Next.js and complete the ongoing App Router + next‑intl consolidation (lowest risk and cost).
- Prototype SvelteKit for the party editor only (dual‑stack) and evaluate before committing.

## Open Questions
- Keep proxy endpoints under `/api/**` or talk to Rails directly with CORS? (Proxy simplifies auth and error shaping.)
- UI library choice finalization: Bits‑UI vs shadcn‑svelte (or a minimal custom layer where needed).
- Icon strategy: `unplugin-icons` vs direct SVG imports.

## Acceptance Criteria
- Route and locale parity with auth/method guards and “as‑needed” default‑locale behavior.
- Party editor parity (create/update/remix/delete; grids; jobs/skills/accessories; guidebooks; toggles).
- Query‑linked filters and pagination on `/teams`, `/saved`, `/[username]`.
- Editor parity (mentions, link, lists, headings, youtube, highlight, placeholder) and equivalent styling.
- Primitives parity with keyboard a11y and visual consistency.
- i18n keys resolve from existing JSON bundles; theme persists SSR + client.

## Success Measures
- Time‑to‑interactive and bundle size improved vs. Next build.
- No regression in error rates for API interactions (remix/delete/save).
- Positive qualitative feedback on responsiveness in editor/grid interactions.
