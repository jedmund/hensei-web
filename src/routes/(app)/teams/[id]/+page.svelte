<script lang="ts">
	import type { PageData } from './$types'
	import Party from '$lib/components/party/Party.svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import { withInitialData } from '$lib/query/ssr'

	let { data }: { data: PageData } = $props()

	/**
	 * TanStack Query v6 SSR Integration Example
	 *
	 * This demonstrates the `withInitialData` pattern for pages using +page.server.ts.
	 * The server-fetched party data is used as initial data for the query, which means:
	 *
	 * 1. No loading state on initial render (data is already available)
	 * 2. The query can refetch in the background when data becomes stale
	 * 3. The data is cached and shared across components using the same query key
	 *
	 * Note: The Party component currently manages its own state, so we pass the
	 * server data directly. In a future refactor, the Party component could use
	 * this query directly for automatic cache updates and background refetching.
	 */
	const partyQuery = createQuery(() => ({
		...partyQueries.byShortcode(data.party?.shortcode ?? ''),
		...withInitialData(data.party),
		enabled: !!data.party?.shortcode
	}))

	// Use query data if available, fall back to server data
	// This allows the query to refetch and update the UI automatically
	const party = $derived(partyQuery.data ?? data.party)
</script>

{#if party}
	<Party party={party} canEdit={data.canEdit || false} authUserId={data.authUserId} />
{:else}
	<div>
		<h1>Party not found</h1>
		<p>No party data available for this code.</p>
	</div>
{/if}
