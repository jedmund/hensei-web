# TanStack Query SSR Integration

This directory contains utilities for integrating TanStack Query v6 with SvelteKit's server-side rendering.

## Architecture Overview

The project uses a hybrid approach for SSR:

1. **QueryClient in Layout**: The `QueryClient` is created in `+layout.ts` and passed to `+layout.svelte` via the load function. This enables prefetching in child page load functions.

2. **Server Data with initialData**: Pages that use `+page.server.ts` can pass server-fetched data as `initialData` to TanStack Query using the `withInitialData()` helper.

3. **Prefetching in +page.ts**: Pages that use `+page.ts` (universal load functions) can use `prefetchQuery()` to populate the QueryClient cache before rendering.

## Usage Examples

### Pattern 1: Using Server Data with initialData

For pages that already fetch data in `+page.server.ts`:

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import { withInitialData } from '$lib/query/ssr'
  import type { PageData } from './$types'

  let { data } = $props<{ data: PageData }>()

  // Use server-fetched party as initial data
  // The query won't refetch until the data becomes stale
  const party = createQuery(() => ({
    ...partyQueries.byShortcode(data.party?.shortcode ?? ''),
    ...withInitialData(data.party),
    enabled: !!data.party?.shortcode
  }))
</script>

{#if $party.data}
  <h1>{$party.data.name}</h1>
{/if}
```

### Pattern 2: Prefetching in Universal Load Functions

For pages that can use `+page.ts` (not server-only):

```typescript
// +page.ts
import type { PageLoad } from './$types'
import { prefetchQuery } from '$lib/query/ssr'
import { partyQueries } from '$lib/api/queries/party.queries'

export const load: PageLoad = async ({ parent, params }) => {
  const { queryClient } = await parent()

  // Prefetch party data into the cache
  await prefetchQuery(queryClient, partyQueries.byShortcode(params.id))

  // No need to return data - it's already in the QueryClient cache
  return { shortcode: params.id }
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import type { PageData } from './$types'

  let { data } = $props<{ data: PageData }>()

  // Data is already in cache from prefetch - no loading state on initial render
  const party = createQuery(() => partyQueries.byShortcode(data.shortcode))
</script>

{#if $party.data}
  <h1>{$party.data.name}</h1>
{/if}
```

### Pattern 3: Infinite Queries with Prefetching

For paginated data:

```typescript
// +page.ts
import type { PageLoad } from './$types'
import { prefetchInfiniteQuery } from '$lib/query/ssr'
import { partyQueries } from '$lib/api/queries/party.queries'

export const load: PageLoad = async ({ parent }) => {
  const { queryClient } = await parent()

  // Prefetch first page of parties
  await prefetchInfiniteQuery(queryClient, partyQueries.list())
}
```

## Migration Guide

### From Server-Only to TanStack Query

1. **Keep existing +page.server.ts** - No changes needed to server load functions
2. **Add TanStack Query to component** - Use `createQuery` with `withInitialData`
3. **Benefit from caching** - Subsequent navigations use cached data

### From Custom Resources to TanStack Query

1. **Replace resource imports** with query/mutation imports
2. **Use createQuery** instead of resource state
3. **Use mutations** for CRUD operations with automatic cache invalidation

## Files

- `queryClient.ts` - QueryClient factory (legacy, kept for reference)
- `ssr.ts` - SSR utilities (withInitialData, prefetchQuery, etc.)
