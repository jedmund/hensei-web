
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import type { LayoutData } from './$types'

	const { data, children }: { data: LayoutData; children: () => any } = $props()

	// Query for the user's crew
	const crewQuery = createQuery(() => crewQueries.myCrew())

	// Update crew store when query data changes
	$effect(() => {
		if (crewQuery.data) {
			crewStore.setCrew(crewQuery.data, crewQuery.data.currentMembership ?? null)
		} else if (crewQuery.isError) {
			crewStore.clear()
		}
	})

	// Sync loading state
	$effect(() => {
		crewStore.setLoading(crewQuery.isLoading)
	})
</script>

<div class="crew-layout">
	{@render children?.()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.crew-layout {
		max-width: 1200px;
		margin: 0 auto;
	}
</style>
