# TanStack Query Migration Guide

This document contains follow-up prompts for migrating remaining components to TanStack Query v6.

## Migration Status

### Completed (PR #441)
- Query options factories: `party.queries.ts`, `job.queries.ts`, `user.queries.ts`
- Mutation configurations: `party.mutations.ts`, `grid.mutations.ts`, `job.mutations.ts`
- SSR utilities: `withInitialData`, `prefetchQuery`, `prefetchInfiniteQuery`
- Example components: `JobSelectionSidebar.svelte`, `teams/[id]/+page.svelte`

### Pending Migration

The following components still use direct adapter calls or resource classes and should be migrated in future PRs.

---

## Follow-Up Prompt 1: Job Skill Selection Sidebar

**Scope**: Migrate `JobSkillSelectionSidebar.svelte` to use TanStack Query

**Prompt**:
```
Migrate the JobSkillSelectionSidebar component to use TanStack Query v6.

The component currently uses InfiniteScrollResource for paginated skill loading.
Replace it with createInfiniteQuery using jobQueries.skills().

Files to modify:
- src/lib/components/sidebar/JobSkillSelectionSidebar.svelte

Reference implementation:
- src/lib/components/sidebar/JobSelectionSidebar.svelte (already migrated)
- src/lib/api/queries/job.queries.ts (jobQueries.skills for infinite query)

Key changes:
1. Replace InfiniteScrollResource with createInfiniteQuery
2. Use jobQueries.skills(jobId, { query: searchTerm }) for the query options
3. Handle pagination with query.fetchNextPage() and query.hasNextPage
4. Update loading/error states to use query.isLoading, query.isError
```

---

## Follow-Up Prompt 2: Search Modal Migration

**Scope**: Migrate search functionality to use TanStack Query

**Prompt**:
```
Migrate the search functionality to use TanStack Query v6.

The existing search.queries.ts has infinite query options for weapons, characters,
summons, and job skills. Wire these up to the actual search components.

Files to modify:
- src/lib/components/search/SearchPanel.svelte (or equivalent)
- src/lib/features/search/openSearchSidebar.svelte.ts

Reference:
- src/lib/api/queries/search.queries.ts (existing query options)
- src/lib/components/InfiniteScrollQuery.svelte (existing TanStack Query component)

Key changes:
1. Use createInfiniteQuery with searchQueries.weapons/characters/summons
2. Implement debounced search input (debounce the value, not the query)
3. Use InfiniteScrollQuery component for rendering results
4. Remove dependency on SearchResource class
```

---

## Follow-Up Prompt 3: User Profile Page

**Scope**: Migrate user profile page to use TanStack Query with SSR

**Prompt**:
```
Migrate the [username]/+page.svelte to use TanStack Query v6 with SSR.

The page currently fetches user profile and parties in +page.server.ts.
Add TanStack Query integration using the withInitialData pattern.

Files to modify:
- src/routes/[username]/+page.svelte

Reference:
- src/routes/teams/[id]/+page.svelte (already migrated with withInitialData)
- src/lib/api/queries/user.queries.ts (userQueries.profile, userQueries.parties)
- src/lib/query/ssr.ts (withInitialData helper)

Key changes:
1. Add createQuery for user profile with withInitialData
2. Add createInfiniteQuery for user parties with initialData from server
3. Use $derived to prefer query data over server data
4. Enable background refetching for fresh data
```

---

## Follow-Up Prompt 4: Teams Explore Page

**Scope**: Migrate teams explore page to use TanStack Query

**Prompt**:
```
Migrate the teams/explore page to use TanStack Query v6 for party listing.

The page displays a paginated list of public parties with filtering.

Files to modify:
- src/routes/teams/explore/+page.svelte
- src/routes/teams/explore/+page.server.ts (if needed)

Reference:
- src/lib/api/queries/party.queries.ts (partyQueries.list for infinite query)
- src/lib/query/ssr.ts (prefetchInfiniteQuery for SSR)

Key changes:
1. Use createInfiniteQuery with partyQueries.list(filters)
2. Implement filter state that triggers query refetch
3. Use infinite scroll or "Load More" button with query.fetchNextPage()
4. Consider prefetching first page in +page.ts for faster initial load
```

---

## Follow-Up Prompt 5: Party Component Mutations

**Scope**: Wire up Party component to use TanStack Query mutations

**Prompt**:
```
Migrate the Party component to use TanStack Query mutations for CRUD operations.

The Party component currently uses PartyService and GridService directly.
Replace these with TanStack Query mutations for automatic cache invalidation.

Files to modify:
- src/lib/components/party/Party.svelte

Reference:
- src/lib/api/mutations/party.mutations.ts (useUpdateParty, useDeleteParty, etc.)
- src/lib/api/mutations/grid.mutations.ts (useUpdateGridWeapon, etc.)
- src/lib/api/mutations/job.mutations.ts (useUpdateJob, useUpdateSkills)

Key changes:
1. Import and use mutation hooks (useUpdateParty, useDeleteParty, etc.)
2. Replace direct service calls with mutation.mutate()
3. Leverage optimistic updates for immediate UI feedback
4. Use mutation.isPending for loading states
5. Use mutation.error for error handling

Note: This is a larger refactor. Consider breaking it into sub-tasks:
- 5a: Party metadata mutations (name, description, visibility)
- 5b: Grid weapon mutations
- 5c: Grid character mutations
- 5d: Grid summon mutations
- 5e: Job and skill mutations
```

---

## Follow-Up Prompt 6: Remove Deprecated Resource Classes

**Scope**: Remove deprecated resource classes after migration is complete

**Prompt**:
```
Remove the deprecated resource classes now that TanStack Query migration is complete.

Files to delete:
- src/lib/api/adapters/resources/search.resource.svelte.ts
- src/lib/api/adapters/resources/party.resource.svelte.ts
- src/lib/api/adapters/resources/job.resource.svelte.ts
- src/lib/api/adapters/resources/infiniteScroll.resource.svelte.ts

Pre-requisites:
1. Verify no components import these files (use grep)
2. Ensure all functionality has been migrated to TanStack Query
3. Run build to confirm no import errors

Steps:
1. Search for any remaining imports of resource classes
2. Migrate any remaining usages to TanStack Query
3. Delete the resource files
4. Update any barrel exports (index.ts files)
5. Run build and tests to verify
```

---

## Migration Checklist

Use this checklist to track overall migration progress:

- [x] Create query options factories
- [x] Create mutation configurations
- [x] Add SSR utilities
- [x] Migrate JobSelectionSidebar (example)
- [x] Migrate teams/[id] page (SSR example)
- [ ] Migrate JobSkillSelectionSidebar
- [ ] Migrate search functionality
- [ ] Migrate user profile page
- [ ] Migrate teams explore page
- [ ] Migrate Party component mutations
- [ ] Remove deprecated resource classes
- [ ] Add TanStack Query devtools (optional)

## Notes

- Always test locally before pushing changes
- Run `npm run build` to verify TypeScript compilation
- The existing adapters remain unchanged - TanStack Query wraps them
- Cache invalidation is handled automatically by mutations
- SSR uses hybrid approach: existing +page.server.ts + withInitialData pattern
