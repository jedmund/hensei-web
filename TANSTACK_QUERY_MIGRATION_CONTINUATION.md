# TanStack Query Migration - Continuation Guide

This document provides context for continuing the TanStack Query v6 migration in hensei-web.

## Migration Status

### Completed (PR #441 - merged)
- Query options factories: `party.queries.ts`, `job.queries.ts`, `user.queries.ts`, `search.queries.ts`
- Mutation configurations: `party.mutations.ts`, `grid.mutations.ts`, `job.mutations.ts`
- SSR utilities: `withInitialData`, `prefetchQuery`, `prefetchInfiniteQuery`
- Example components: `JobSelectionSidebar.svelte`, `teams/[id]/+page.svelte`

### Completed (PR #442 - pending merge)
- `JobSkillSelectionSidebar.svelte` - Job skill search with infinite scroll
- `SearchContent.svelte` - Search modal for weapons/characters/summons
- `[username]/+page.svelte` - User profile page with teams/favorites tabs
- `teams/explore/+page.svelte` - Public teams listing

### Remaining Work

#### Follow-Up Prompt 5: Party Component Mutations
**Priority: High**
**Complexity: Large**

The `Party.svelte` component (1535 lines) needs to be migrated to use TanStack Query mutations instead of direct service calls.

**Files to modify:**
- `src/lib/components/party/Party.svelte`

**Current state:** Uses `PartyService`, `GridService`, `ConflictService`, and direct `partyAdapter` calls.

**Target state:** Use mutation hooks from:
- `src/lib/api/mutations/party.mutations.ts` - `useUpdateParty`, `useDeleteParty`, `useRemixParty`, `useFavoriteParty`, `useUnfavoriteParty`, `useRegeneratePreview`
- `src/lib/api/mutations/grid.mutations.ts` - `useCreateGridWeapon`, `useUpdateGridWeapon`, `useDeleteGridWeapon`, etc.
- `src/lib/api/mutations/job.mutations.ts` - `useUpdatePartyJob`, `useUpdatePartyJobSkills`, `useRemovePartyJobSkill`, `useUpdatePartyAccessory`

**Recommended sub-tasks:**
1. **5a: Party metadata mutations** - name, description, visibility using `useUpdateParty`
2. **5b: Grid weapon mutations** - add/update/delete weapons using grid mutations
3. **5c: Grid character mutations** - add/update/delete characters using grid mutations
4. **5d: Grid summon mutations** - add/update/delete summons using grid mutations
5. **5e: Job and skill mutations** - job selection, skill management using job mutations

**Key functions to migrate in Party.svelte:**
- `updatePartyDetails()` - replace `partyService.update()` with `useUpdateParty().mutate()`
- `toggleFavorite()` - replace `partyService.favorite()/unfavorite()` with `useFavoriteParty()/useUnfavoriteParty()`
- `remixParty()` - replace `partyService.remix()` with `useRemixParty()`
- `deleteParty()` - replace `partyService.delete()` with `useDeleteParty()`
- `handleSelectJob()` - replace `partyAdapter.updateJob()` with `useUpdatePartyJob()`
- `handleSelectJobSkill()` - replace `partyAdapter.updateJobSkills()` with `useUpdatePartyJobSkills()`
- Drag-drop operations - replace `gridService.moveWeapon/Character/Summon()` with appropriate mutations

#### Follow-Up Prompt 6: Remove Deprecated Resource Classes
**Priority: Low**
**Complexity: Small**
**Prerequisite:** All components migrated away from resource classes

**Files to delete:**
- `src/lib/api/adapters/resources/search.resource.svelte.ts`
- `src/lib/api/adapters/resources/party.resource.svelte.ts`
- `src/lib/api/adapters/resources/job.resource.svelte.ts`
- `src/lib/api/adapters/resources/infiniteScroll.resource.svelte.ts`

**Steps:**
1. Search for any remaining imports: `grep -r "from.*resources/" src/`
2. Migrate any remaining usages
3. Delete the resource files
4. Update any barrel exports (index.ts files)
5. Run build to verify no import errors

**Current blockers:** `InfiniteScroll.svelte` still imports `InfiniteScrollResource` type

## Patterns and Best Practices

### Infinite Query Pattern
```typescript
import { createInfiniteQuery } from '@tanstack/svelte-query'
import { IsInViewport } from 'runed'

// Create the query with thunk for reactivity
const query = createInfiniteQuery(() => ({
  ...queryOptions.list(filters),
  initialData: serverData ? {
    pages: [{ results: serverData.items, page: 1, totalPages: serverData.totalPages }],
    pageParams: [1]
  } : undefined,
  initialDataUpdatedAt: 0
}))

// Flatten and deduplicate results
const rawResults = $derived(query.data?.pages.flatMap((page) => page.results) ?? [])
const items = $derived(Array.from(new Map(rawResults.map((item) => [item.id, item])).values()))

// Infinite scroll with IsInViewport
let sentinelEl = $state<HTMLElement>()
const inViewport = new IsInViewport(() => sentinelEl, { rootMargin: '200px' })

$effect(() => {
  if (inViewport.current && query.hasNextPage && !query.isFetchingNextPage && !query.isLoading) {
    query.fetchNextPage()
  }
})
```

### Debounced Search Pattern
```typescript
let searchQuery = $state('')
let debouncedSearchQuery = $state('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined

$effect(() => {
  const query = searchQuery
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery = query
  }, 300)
  return () => { if (debounceTimer) clearTimeout(debounceTimer) }
})

// Use debouncedSearchQuery in the query, not searchQuery
const query = createInfiniteQuery(() => queryOptions.search(debouncedSearchQuery))
```

### Type Assertions for Conditional Queries
When a query can return different types based on conditions, use type assertions:
```typescript
const query = createInfiniteQuery(() => {
  if (condition) {
    return queryOptionsA()
  }
  return queryOptionsB() as unknown as ReturnType<typeof queryOptionsA>
})
```

### Mutation Pattern
```typescript
import { useUpdateParty } from '$lib/api/mutations/party.mutations'

const updatePartyMutation = useUpdateParty()

function handleSave() {
  updatePartyMutation.mutate(
    { partyId, updates },
    {
      onSuccess: () => { /* handle success */ },
      onError: (error) => { /* handle error */ }
    }
  )
}

// Use mutation state for UI
{#if updatePartyMutation.isPending}
  <span>Saving...</span>
{/if}
```

## Known Issues

### Pre-existing Build Errors
The build has pre-existing errors unrelated to TanStack Query migration:
- `Cannot find module '$lib/paraglide/server'` in `hooks.server.ts`
- `Cannot find module '$lib/paraglide/runtime'` in `hooks.ts`
- `Cannot find module '$lib/paraglide/messages'` in various components

These are paraglide i18n setup issues and should be ignored when checking for migration-related errors.

### Duplicate Key Error Fix
When using infinite queries, the API may return duplicate items across pages. Always deduplicate:
```typescript
const rawResults = $derived(query.data?.pages.flatMap((page) => page.results) ?? [])
const items = $derived(Array.from(new Map(rawResults.map((item) => [item.id, item])).values()))
```

## File Locations

### Query Options Factories
- `src/lib/api/queries/party.queries.ts`
- `src/lib/api/queries/job.queries.ts`
- `src/lib/api/queries/user.queries.ts`
- `src/lib/api/queries/search.queries.ts`

### Mutation Hooks
- `src/lib/api/mutations/party.mutations.ts`
- `src/lib/api/mutations/grid.mutations.ts`
- `src/lib/api/mutations/job.mutations.ts`

### SSR Utilities
- `src/lib/query/ssr.ts`

### Reference Implementations
- `src/lib/components/sidebar/JobSelectionSidebar.svelte` - Simple infinite query
- `src/lib/components/sidebar/JobSkillSelectionSidebar.svelte` - Infinite query with search
- `src/lib/components/sidebar/SearchContent.svelte` - Infinite query with filters and deduplication
- `src/routes/teams/[id]/+page.svelte` - SSR with initialData
- `src/routes/[username]/+page.svelte` - Conditional queries (teams vs favorites)
- `src/routes/teams/explore/+page.svelte` - Simple infinite scroll page

## Commands

```bash
# Run TypeScript check
pnpm run check

# Run development server
pnpm run dev

# Check for resource class imports
grep -r "from.*resources/" src/

# Check for createInfiniteScrollResource usage
grep -r "createInfiniteScrollResource" src/
```

## Branch Information

- Base branch: `svelte-main`
- PR #442 branch: `devin/1764405731-tanstack-query-migration-phase2`
