# Search Sidebar Refactor Plan (Infinite Scroll + Legacy Parity)

This plan upgrades `src/lib/components/panels/SearchSidebar.svelte` to support infinite-scrolling search with cancellable requests, modular components, and accessible UX. It also aligns result content with our previous app’s components so we show the most useful fields.

Relevant packages to install:
https://runed.dev/docs/getting-started
https://runed.dev/docs/utilities/resource

## Goals
- Smooth, infinite-scrolling search with debounced input and request cancellation.
- Modular, testable components (header, filters, list, items).
- Strong accessibility and keyboard navigation.
- Reuse legacy field choices for results (image, name, uncap, tags).

## Legacy Result Fields (from hensei-web)
Reference: `../hensei-web/components/*Result`
- Common
  - Thumbnail (grid variant), localized name.
  - `UncapIndicator` with FLB/ULB/Transcendence (stage displayed as 5 in old UI).
  - Element tag.
- Weapons
  - Proficiency tag.
- Summons
  - “Subaura” badge (if applicable/available from API).
- Characters
  - Respect `special` flag for `UncapIndicator`.
- Implementation
  - Use our image helper (`get*Image`) and placeholders; do not hardcode paths.

## Data Flow
- Unified adapter: `searchResource(type, params, { signal })` wraps current resource-specific search functions and normalizes the output to `{ results, total, nextCursor? }`.
- Debounce input: 250–300ms.
- Cancellation: AbortController cancels prior request when query/filters/cursor change.
- Single orchestrating effect: listens to `open`, `type`, `debouncedQuery`, and `filters`. Resets state and triggers initial fetch.

## Infinite Scrolling
- IntersectionObserver sentinel at list bottom triggers `loadMore()` when visible.
- Guards: `isLoading`, `hasMore`, `error` prevent runaway loads.
- Use Runed's `resource()` for fetching (Svelte 5‑native) instead of TanStack Query:
  - Reactive key: `{ type, query: debouncedQuery, filters, page }`.
  - Resource fn receives `AbortSignal` for cancellation.
  - `keepPreviousValue: true` to avoid flicker on refresh.
  - Append or replace items based on `page`.

### Runed setup
- Install: `pnpm add runed`
- Import where needed: `import { resource } from 'runed'`
- No extra config required; works seamlessly with Svelte 5 runes ($state/$derived/$effect).

## State Orchestration
- State: `items[]`, `isLoading`, `error`, `hasMore`, `page`, `debouncedQuery`, `filters`, `open`.
- Reset state on open/type/query/filters change; cancel in-flight; fetch page 1.
- Persist last-used filters per type in localStorage and restore on open.
- Optional lightweight cache: `Map<string, { items, page, hasMore, timestamp }>` keyed by `{ type, query, filters }` with small TTL.

## UX & Accessibility
- Loading skeletons for image/title/badges.
- Error state with Retry and helpful copy.
- Empty state: “No results — try widening filters.”
- Keyboard
  - Focus trap when open; restore focus to trigger on close.
  - Arrow Up/Down to move highlight; Enter to select; Escape to close.
  - `aria-live=polite` announcements for loading and result counts.
- Performance
  - Pre-fetch next page when 60–70% scrolled (if not using IO sentinel aggressively).
  - Virtualization as a stretch goal if lists become large.

## Componentization
- `SearchSidebarHeader.svelte`: search input (debounced), close button, result count.
- `FilterGroup.svelte`: Element, Rarity, Proficiency; emits `{ element?: number[], rarity?: number[], proficiency1?: number[] }`.
- Result items (choose either specialized components or generic + slots)
  - `WeaponResultItem.svelte`: image, name, UncapIndicator, [Element, Proficiency].
  - `SummonResultItem.svelte`: image, name, UncapIndicator, [Element, Subaura?].
  - `CharacterResultItem.svelte`: image, name, UncapIndicator(special), [Element].
- `ResultList.svelte`: renders items, manages sentinel and keyboard focus.
- `searchResource.ts`: adapter normalizing current API responses.

## Normalized API Contract
- Input
  - `type: 'weapon' | 'character' | 'summon'`
  - `query?: string`
  - `filters: { element?: number[]; rarity?: number[]; proficiency1?: number[] }`
  - `cursor?: { page?: number; perPage?: number }` (or token-ready for future)
  - `signal: AbortSignal`
- Output
  - `{ results: any[]; total: number; nextCursor?: { page?: number } }`

## Tasks (Phased)

### Phase 1 — Infra & UX Baseline
- [ ] Add `searchResource` adapter + types; normalize outputs.
- [ ] Debounce input and wire AbortController for cancellation.
- [ ] Consolidate effects; initialize/reset state predictably.
- [ ] Implement infinite scroll via IntersectionObserver; add guards.
- [ ] Add skeleton, error, and empty states (minimal styles).

### Phase 2 — Componentization & Fields
- [ ] Build `FilterGroup` (Element, Rarity, Proficiency) and emit filters.
- [ ] Implement `WeaponResultItem`, `SummonResultItem`, `CharacterResultItem` with fields per legacy.
- [ ] Extract `SearchSidebarHeader` (input, count, close) and `ResultList` (items + sentinel).

### Phase 3 — A11y & Keyboard
- [ ] Add focus trap and restore focus on close.
- [ ] Apply listbox/option roles; `aria-live` for loading/count.
- [ ] Arrow/Enter/Escape handlers; scroll highlighted item into view.

### Phase 4 — Persistence & Performance
- [ ] Persist filters per type in localStorage; hydrate on open.
- [ ] Optional: add small in-memory cache keyed by `{ type, query, filters }` (TTL 2–5 min).
- [ ] Optional: prefetch next page on near-end scroll.
- [ ] Optional: list virtualization if needed.

## Example: resource() Outline (Runed)
```
// Debounce query (250–300ms)
let query = $state('')
let debouncedQuery = $state('')
let debounceTimer: any
$effect(() => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => (debouncedQuery = query.trim()), 280)
})

// Paging + items
let page = $state(1)
let items: any[] = $state([])
let hasMore = $state(true)

const params = $derived(() => ({ type, query: debouncedQuery, filters, page }))

import { resource } from 'runed'
const searchRes = resource(
  params,
  async (p, ctx) => searchResource(p.type, { query: p.query, filters: p.filters, page: p.page, perPage: 20 }, { signal: ctx.signal }),
  { keepPreviousValue: true }
)

$effect(() => {
  const val = searchRes.value
  if (!val) return
  if (page === 1) items = val.results
  else items = [...items, ...val.results]
  hasMore = val.nextCursor?.page ? true : false // or derive from total_pages
})

// IntersectionObserver sentinel triggers loadMore
function onIntersect() {
  if (!searchRes.loading && hasMore) page += 1
}
```

### Phase 5 — Tests & Polish
- [ ] Unit tests for adapter (debounce + abort cases).
- [ ] Interaction tests (keyboard nav, infinite scroll, retry/reload).
- [ ] Visual QA: confirm result item content matches legacy intent.

## Acceptance Criteria
- Infinite scrolling with smooth loading; no duplicate/stale requests.
- Results show image, name, uncap, and tags mirroring legacy components.
- Accessible: screen-reader friendly, keyboard navigable, focus managed.
- Filters and results are modular and easily testable.
- Caching (or local persistence) makes repeat searches feel instant.

## Notes / Risks
- svelte-query adds a dependency; keep adapter thin to allow opting in later.
- Subaura badge requires API support; if not present, hide or infer conservatively.
- Virtualization is optional; only implement if list length causes perf issues.

## Extending To Teams Explore

The same resource-based, infinite-scroll pattern should power `src/routes/teams/explore/+page.svelte` to keep UX and tech consistent.

Guidelines:
- Shared primitives
  - Reuse the resource() orchestration, IntersectionObserver sentinel, and list state (`items`, `page`, `hasMore`, `isLoading`, `error`).
  - Reuse skeleton, empty, and error components/styles for visual consistency.
  - Optional: extract a tiny `use:intersect` action and a generic `InfiniteList.svelte` wrapper.
- Explore adapter
  - Create `exploreResource(params, { signal })` that normalizes `{ results, total, nextCursor }` from the teams listing endpoint.
  - Inputs: `query?`, `filters?` (element, tags), `sort?` (newest/popular), `page`, `perPage`.
- SSR-friendly
  - `+page.server.ts` fetches `page=1` for SEO and first paint; client continues with infinite scroll.
  - Initialize client state from server data; enable `keepPreviousValue` to avoid flicker on hydration.
- URL sync
  - Reflect `query`, `filters`, `sort`, and `page` in search params. On mount, hydrate state from the URL.
  - Improves shareability and back/forward navigation.
- Cards and filters
  - Implement `TeamCard.svelte` (thumbnail, name/title, owner, likes, updatedAt, element/tags) with a matching skeleton card.
  - Build `TeamsFilterGroup.svelte` mirroring the sidebar’s `FilterGroup.svelte` experience.
- Performance
  - Lazy-load images with `loading="lazy"` and `decoding="async"`; consider prefetching page+1 on near-end scroll.
  - Virtualization only if card density leads to perf issues.

By following these conventions, the search sidebar and explore page share the same mental model, enabling rapid iteration and less bespoke code per page.
