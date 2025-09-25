# Infinite Scrolling Implementation with Runed

## Overview

This document outlines the implementation of infinite scrolling for the Hensei application using Runed's utilities instead of TanStack Query. Runed provides Svelte 5-specific reactive utilities that work seamlessly with runes.

## Current State Analysis

### What We Have
- **Runed v0.31.1** installed and actively used in the project
- Established resource patterns (`search.resource.svelte.ts`, `party.resource.svelte.ts`)
- Pagination with "Previous/Next" links on profile and explore pages
- API support for pagination via `page` parameter
- SSR with SvelteKit for initial page loads

### What We Need
- Automatic loading of next page when user scrolls near bottom
- Seamless data accumulation without page refreshes
- Loading indicators and error states
- Memory-efficient data management
- Accessibility support

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────┐
│            InfiniteScroll Component             │
│  - Sentinel element for intersection detection  │
│  - Loading/error UI states                      │
│  - Accessibility features                       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│       InfiniteScrollResource Class              │
│  - IsInViewport/useIntersectionObserver         │
│  - State management with $state runes           │
│  - Page tracking and data accumulation          │
│  - Loading/error state handling                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         Existing Adapters (Enhanced)            │
│  - PartyAdapter                                 │
│  - UserAdapter                                  │
│  - Support for incremental data fetching        │
└──────────────────────────────────────────────────┘
```

## Implementation Details

### 1. InfiniteScrollResource Class

Location: `/src/lib/api/adapters/resources/infiniteScroll.resource.svelte.ts`

```typescript
import { IsInViewport, watch, useDebounce } from 'runed'
import type { AdapterError } from '../types'

export interface InfiniteScrollOptions<T> {
  fetcher: (page: number) => Promise<{
    results: T[]
    page: number
    totalPages: number
    total: number
  }>
  initialData?: T[]
  pageSize?: number
  threshold?: number // pixels before viewport edge to trigger load
  debounceMs?: number
  maxItems?: number // optional limit for memory management
}

export class InfiniteScrollResource<T> {
  // Reactive state
  items = $state<T[]>([])
  page = $state(1)
  totalPages = $state<number | undefined>()
  total = $state<number | undefined>()
  loading = $state(false)
  loadingMore = $state(false)
  error = $state<AdapterError | undefined>()

  // Sentinel element for intersection detection
  sentinelElement = $state<HTMLElement | undefined>()

  // Viewport detection using Runed
  private inViewport: IsInViewport

  // Configuration
  private fetcher: InfiniteScrollOptions<T>['fetcher']
  private threshold: number
  private maxItems?: number

  // Abort controller for cancellation
  private abortController?: AbortController

  constructor(options: InfiniteScrollOptions<T>) {
    this.fetcher = options.fetcher
    this.threshold = options.threshold ?? 200
    this.maxItems = options.maxItems

    if (options.initialData) {
      this.items = options.initialData
    }

    // Set up viewport detection
    this.inViewport = new IsInViewport(
      () => this.sentinelElement,
      { rootMargin: `${this.threshold}px` }
    )

    // Create debounced load function if specified
    const loadMoreFn = options.debounceMs
      ? useDebounce(() => this.loadMore(), () => options.debounceMs!)
      : () => this.loadMore()

    // Watch for visibility changes
    watch(
      () => this.inViewport.current,
      (isVisible) => {
        if (isVisible && !this.loading && !this.loadingMore && this.hasMore) {
          loadMoreFn()
        }
      }
    )
  }

  // Computed properties
  get hasMore() {
    return this.totalPages === undefined || this.page < this.totalPages
  }

  get isEmpty() {
    return this.items.length === 0 && !this.loading
  }

  // Load initial data or reset
  async load() {
    this.reset()
    this.loading = true
    this.error = undefined

    try {
      const response = await this.fetcher(1)
      this.items = response.results
      this.page = response.page
      this.totalPages = response.totalPages
      this.total = response.total
    } catch (err) {
      this.error = err as AdapterError
    } finally {
      this.loading = false
    }
  }

  // Load next page
  async loadMore() {
    if (!this.hasMore || this.loadingMore || this.loading) return

    this.loadingMore = true
    this.error = undefined

    // Cancel previous request if any
    this.abortController?.abort()
    this.abortController = new AbortController()

    try {
      const nextPage = this.page + 1
      const response = await this.fetcher(nextPage)

      // Append new items
      this.items = [...this.items, ...response.results]

      // Trim items if max limit is set
      if (this.maxItems && this.items.length > this.maxItems) {
        this.items = this.items.slice(-this.maxItems)
      }

      this.page = response.page
      this.totalPages = response.totalPages
      this.total = response.total
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.error = err as AdapterError
      }
    } finally {
      this.loadingMore = false
      this.abortController = undefined
    }
  }

  // Manual trigger for load more (fallback button)
  async retry() {
    if (this.error) {
      await this.loadMore()
    }
  }

  // Reset to initial state
  reset() {
    this.items = []
    this.page = 1
    this.totalPages = undefined
    this.total = undefined
    this.loading = false
    this.loadingMore = false
    this.error = undefined
    this.abortController?.abort()
  }

  // Bind sentinel element
  bindSentinel(element: HTMLElement) {
    this.sentinelElement = element
  }

  // Cleanup
  destroy() {
    this.abortController?.abort()
    this.inViewport.stop()
  }
}

// Factory function
export function createInfiniteScrollResource<T>(
  options: InfiniteScrollOptions<T>
): InfiniteScrollResource<T> {
  return new InfiniteScrollResource(options)
}
```

### 2. InfiniteScroll Component

Location: `/src/lib/components/InfiniteScroll.svelte`

```svelte
<script lang="ts">
  import type { InfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    resource: InfiniteScrollResource<any>
    children: Snippet
    loadingSnippet?: Snippet
    errorSnippet?: Snippet<[Error]>
    emptySnippet?: Snippet
    endSnippet?: Snippet
    class?: string
  }

  const {
    resource,
    children,
    loadingSnippet,
    errorSnippet,
    emptySnippet,
    endSnippet,
    class: className = ''
  }: Props = $props()

  // Bind sentinel element
  let sentinel: HTMLElement
  $effect(() => {
    if (sentinel) {
      resource.bindSentinel(sentinel)
    }
  })

  // Cleanup on unmount
  $effect(() => {
    return () => resource.destroy()
  })

  // Accessibility: Announce new content
  $effect(() => {
    if (resource.loadingMore) {
      announceToScreenReader('Loading more items...')
    }
  })

  function announceToScreenReader(message: string) {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => announcement.remove(), 1000)
  }
</script>

<div class="infinite-scroll-container {className}">
  <!-- Main content -->
  {@render children()}

  <!-- Loading indicator for initial load -->
  {#if resource.loading}
    {#if loadingSnippet}
      {@render loadingSnippet()}
    {:else}
      <div class="loading-initial">
        <span class="spinner"></span>
        Loading...
      </div>
    {/if}
  {/if}

  <!-- Empty state -->
  {#if resource.isEmpty && !resource.loading}
    {#if emptySnippet}
      {@render emptySnippet()}
    {:else}
      <div class="empty-state">No items found</div>
    {/if}
  {/if}

  <!-- Sentinel element for intersection observer -->
  {#if !resource.loading && resource.hasMore}
    <div
      bind:this={sentinel}
      class="sentinel"
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Loading more indicator -->
  {#if resource.loadingMore}
    <div class="loading-more">
      <span class="spinner"></span>
      Loading more...
    </div>
  {/if}

  <!-- Error state with retry -->
  {#if resource.error && !resource.loadingMore}
    {#if errorSnippet}
      {@render errorSnippet(resource.error)}
    {:else}
      <div class="error-state">
        <p>Failed to load more items</p>
        <button onclick={() => resource.retry()}>
          Try Again
        </button>
      </div>
    {/if}
  {/if}

  <!-- End of list indicator -->
  {#if !resource.hasMore && !resource.isEmpty}
    {#if endSnippet}
      {@render endSnippet()}
    {:else}
      <div class="end-state">No more items to load</div>
    {/if}
  {/if}

  <!-- Fallback load more button for accessibility -->
  {#if resource.hasMore && !resource.loadingMore && !resource.loading}
    <button
      class="load-more-fallback"
      onclick={() => resource.loadMore()}
      aria-label="Load more items"
    >
      Load More
    </button>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/colors' as *;

  .infinite-scroll-container {
    position: relative;
  }

  .sentinel {
    height: 1px;
    margin-top: -200px; // Trigger before reaching actual end
  }

  .loading-initial,
  .loading-more,
  .error-state,
  .empty-state,
  .end-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $unit-4x;
    text-align: center;
  }

  .spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-left-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .load-more-fallback {
    display: block;
    margin: $unit-2x auto;
    padding: $unit $unit-2x;
    background: var(--button-bg);
    color: var(--button-text);
    border: 1px solid var(--button-border);
    border-radius: 4px;
    cursor: pointer;

    // Only show for keyboard/screen reader users
    &:not(:focus) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

### 3. Enhanced Party Resource

Location: Update `/src/lib/api/adapters/resources/party.resource.svelte.ts`

Add infinite scroll support to existing PartyResource:

```typescript
// Add to existing PartyResource class

// Infinite scroll for explore/gallery
exploreInfinite = createInfiniteScrollResource<Party>({
  fetcher: async (page) => {
    return await this.adapter.list({ page })
  },
  debounceMs: 200,
  threshold: 300
})

// Infinite scroll for user parties
userPartiesInfinite = createInfiniteScrollResource<Party>({
  fetcher: async (page) => {
    const username = this.currentUsername // store username when loading
    return await this.adapter.listUserParties({ username, page })
  },
  debounceMs: 200,
  threshold: 300
})
```

### 4. Usage in Routes

#### Profile Page (`/src/routes/[username]/+page.svelte`)

```svelte
<script lang="ts">
  import type { PageData } from './$types'
  import { InfiniteScroll } from '$lib/components/InfiniteScroll.svelte'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import { createInfiniteScrollResource } from '$lib/api/adapters/resources'
  import { userAdapter } from '$lib/api/adapters'
  import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

  const { data } = $props() as { data: PageData }

  // Create infinite scroll resource
  const profileResource = createInfiniteScrollResource({
    fetcher: async (page) => {
      const tab = data.tab || 'teams'
      if (tab === 'favorites' && data.isOwner) {
        return await userAdapter.getFavorites({ page })
      }
      return await userAdapter.getProfile(data.user.username, page)
    },
    initialData: data.items,
    debounceMs: 200
  })

  // Initialize with SSR data
  $effect(() => {
    if (data.items && profileResource.items.length === 0) {
      profileResource.items = data.items
      profileResource.page = data.page || 1
      profileResource.totalPages = data.totalPages
      profileResource.total = data.total
    }
  })
</script>

<section class="profile">
  <header class="header">
    <!-- Header content unchanged -->
  </header>

  <InfiniteScroll resource={profileResource}>
    <ExploreGrid items={profileResource.items} />

    {#snippet emptySnippet()}
      <p class="empty">No teams found</p>
    {/snippet}

    {#snippet endSnippet()}
      <p class="end-message">You've reached the end!</p>
    {/snippet}
  </InfiniteScroll>
</section>
```

#### Explore Page (`/src/routes/teams/explore/+page.svelte`)

```svelte
<script lang="ts">
  import type { PageData } from './$types'
  import { InfiniteScroll } from '$lib/components/InfiniteScroll.svelte'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import { createInfiniteScrollResource } from '$lib/api/adapters/resources'
  import { partyAdapter } from '$lib/api/adapters'

  const { data } = $props() as { data: PageData }

  // Create infinite scroll resource
  const exploreResource = createInfiniteScrollResource({
    fetcher: (page) => partyAdapter.list({ page }),
    initialData: data.items,
    pageSize: 20,
    maxItems: 200 // Limit for performance
  })

  // Initialize with SSR data
  $effect(() => {
    if (data.items && exploreResource.items.length === 0) {
      exploreResource.items = data.items
      exploreResource.page = data.page || 1
      exploreResource.totalPages = data.totalPages
      exploreResource.total = data.total
    }
  })
</script>

<section class="explore">
  <header>
    <h1>Explore Teams</h1>
  </header>

  <InfiniteScroll resource={exploreResource} class="explore-grid">
    <ExploreGrid items={exploreResource.items} />
  </InfiniteScroll>
</section>
```

## Performance Optimizations

### 1. Virtual Scrolling (Optional)
For extremely large lists (>500 items), consider implementing virtual scrolling:
- Use a library like `@tanstack/virtual` or build custom with Svelte
- Only render visible items + buffer
- Maintain scroll position with placeholder elements

### 2. Memory Management
- Set `maxItems` limit to prevent unbounded growth
- Implement "windowing" - keep only N pages in memory
- Clear old pages when scrolling forward

### 3. Request Optimization
- Debounce scroll events (built-in with `debounceMs`)
- Cancel in-flight requests when component unmounts
- Implement request deduplication

### 4. Caching Strategy
- Cache fetched pages in adapter layer
- Implement stale-while-revalidate pattern
- Clear cache on user actions (create, update, delete)

## Accessibility Features

### 1. Keyboard Navigation
- Hidden "Load More" button accessible via Tab
- Focus management when new content loads
- Skip links to bypass loaded content

### 2. Screen Reader Support
- Announce when new content is loading
- Announce when new content has loaded
- Announce total item count
- Announce when end is reached

### 3. Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    opacity: 0.8;
  }
}
```

### 4. ARIA Attributes
- `role="status"` for loading indicators
- `aria-live="polite"` for announcements
- `aria-busy="true"` during loading
- `aria-label` for interactive elements

## Testing Strategy

### 1. Unit Tests
```typescript
import { describe, it, expect } from 'vitest'
import { InfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'

describe('InfiniteScrollResource', () => {
  it('loads initial data', async () => {
    const resource = createInfiniteScrollResource({
      fetcher: mockFetcher,
      initialData: mockData
    })

    expect(resource.items).toEqual(mockData)
  })

  it('loads more when triggered', async () => {
    const resource = createInfiniteScrollResource({
      fetcher: mockFetcher
    })

    await resource.load()
    const initialCount = resource.items.length

    await resource.loadMore()
    expect(resource.items.length).toBeGreaterThan(initialCount)
  })

  it('stops loading when no more pages', async () => {
    // Test hasMore property
  })

  it('handles errors gracefully', async () => {
    // Test error states
  })
})
```

### 2. Integration Tests
- Test scroll trigger at various speeds
- Test with slow network (throttling)
- Test error recovery
- Test memory limits
- Test accessibility features

### 3. E2E Tests
```typescript
test('infinite scroll loads more content', async ({ page }) => {
  await page.goto('/teams/explore')

  // Initial content should be visible
  await expect(page.locator('.grid-item')).toHaveCount(20)

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

  // Wait for more content to load
  await page.waitForSelector('.grid-item:nth-child(21)')

  // Verify more items loaded
  const itemCount = await page.locator('.grid-item').count()
  expect(itemCount).toBeGreaterThan(20)
})
```

## Migration Path

### Phase 1: Infrastructure
1. Create InfiniteScrollResource class
2. Create InfiniteScroll component
3. Write unit tests

### Phase 2: Implementation
1. Update explore page (lowest risk)
2. Update profile pages
3. Update other paginated lists

### Phase 3: Optimization
1. Add virtual scrolling if needed
2. Implement advanced caching
3. Performance monitoring

### Phase 4: Polish
1. Refine loading indicators
2. Enhance error states
3. Improve accessibility
4. Add analytics

## Rollback Plan

If infinite scrolling causes issues:
1. Keep pagination code in place (commented)
2. Use feature flag to toggle between pagination and infinite scroll
3. Can revert per-route if needed

```typescript
const useInfiniteScroll = $state(
  localStorage.getItem('feature:infinite-scroll') !== 'false'
)

{#if useInfiniteScroll}
  <InfiniteScroll>...</InfiniteScroll>
{:else}
  <Pagination>...</Pagination>
{/if}
```

## Benefits Over TanStack Query

1. **Native Svelte 5**: Built specifically for Svelte runes
2. **Simpler API**: No provider setup required
3. **Smaller Bundle**: Runed is lightweight
4. **Better Integration**: Works seamlessly with SvelteKit
5. **Type Safety**: Full TypeScript support with runes

## Potential Challenges

1. **SSR Hydration**: Ensure client picks up where server left off
2. **Back Navigation**: Restore scroll position to correct item
3. **Memory Leaks**: Proper cleanup of observers and listeners
4. **Race Conditions**: Handle rapid scrolling/navigation
5. **Error Recovery**: Graceful handling of network failures

## References

- [Runed Documentation](https://runed.dev/docs)
- [Runed IsInViewport](https://runed.dev/docs/utilities/is-in-viewport)
- [Runed useIntersectionObserver](https://runed.dev/docs/utilities/use-intersection-observer)
- [Runed Resource Pattern](https://runed.dev/docs/utilities/resource)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/runes)
- [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Conclusion

This implementation leverages Runed's powerful utilities to create a robust, accessible, and performant infinite scrolling solution that integrates seamlessly with the existing Hensei application architecture. The approach follows established patterns in the codebase while adding modern UX improvements.