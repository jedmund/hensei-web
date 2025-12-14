<script lang="ts">
	import type { PageData } from './$types'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import { userQueries, type FavoritesPageResult } from '$lib/api/queries/user.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { IsInViewport } from 'runed'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const { data } = $props() as { data: PageData }
	const tab = $derived(data.tab || 'teams')
	const isOwner = $derived(data.isOwner || false)
	const activeTab = $derived<'teams' | 'favorites'>(tab === 'favorites' ? 'favorites' : 'teams')

	// Crew info for invite functionality
	const viewerCrewRole = $derived(crewStore.membership?.role ?? null)
	const viewerCrewId = $derived(crewStore.crew?.id ?? null)

	// Note: Type assertion needed because favorites and parties queries have different
	// result structures (items vs results) but we handle both in the items $derived
	const getQueryOptions = () => {
		const isFavorites = tab === 'favorites' && isOwner

		if (isFavorites) {
			return {
				...userQueries.favorites(),
				initialData: data.items
					? {
							pages: [
								{
									items: data.items,
									page: data.page || 1,
									totalPages: data.totalPages,
									total: data.total,
									perPage: data.perPage || 20
								}
							],
							pageParams: [1]
						}
					: undefined,
				initialDataUpdatedAt: 0
			}
		}

		return {
			...userQueries.parties(data.user?.username ?? ''),
			enabled: !!data.user?.username,
			initialData: data.items
				? {
						pages: [
							{
								results: data.items,
								page: data.page || 1,
								totalPages: data.totalPages,
								total: data.total,
								perPage: data.perPage || 20
							}
						],
						pageParams: [1]
					}
				: undefined,
			initialDataUpdatedAt: 0
		}
	}
	const partiesQuery = createInfiniteQuery(getQueryOptions as () => ReturnType<typeof userQueries.favorites>)

	const items = $derived(() => {
		if (!partiesQuery.data?.pages) return data.items || []
		const isFavorites = tab === 'favorites' && isOwner
		if (isFavorites) {
			return partiesQuery.data.pages.flatMap((page) => (page as any).items ?? [])
		}
		return partiesQuery.data.pages.flatMap((page) => (page as any).results ?? [])
	})

	const isEmpty = $derived(!partiesQuery.isLoading && items().length === 0)
	const showSentinel = $derived(partiesQuery.hasNextPage && !partiesQuery.isFetchingNextPage)

	let sentinelEl = $state<HTMLElement>()

	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '300px'
	})

	$effect(() => {
		if (
			inViewport.current &&
			partiesQuery.hasNextPage &&
			!partiesQuery.isFetchingNextPage &&
			!partiesQuery.isLoading
		) {
			partiesQuery.fetchNextPage()
		}
	})
</script>

<section class="profile">
	<ProfileHeader
		username={data.user.username}
		userId={data.user?.id}
		avatarPicture={data.user?.avatar?.picture}
		{activeTab}
		{isOwner}
		{viewerCrewRole}
		{viewerCrewId}
	/>

	{#if partiesQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>Loading {tab}...</p>
		</div>
	{:else if partiesQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>Failed to load {tab}: {partiesQuery.error?.message || 'Unknown error'}</p>
			<Button size="small" onclick={() => partiesQuery.refetch()}>Retry</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>{tab === 'favorites' ? 'No favorite teams yet' : 'No teams found'}</p>
		</div>
	{:else}
		<div class="profile-grid">
			<ExploreGrid items={items()} />

			{#if showSentinel}
				<div class="load-more-sentinel" bind:this={sentinelEl}></div>
			{/if}

			{#if partiesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}

			{#if !partiesQuery.hasNextPage && items().length > 0}
				<div class="end">
					<p>You've seen all {tab === 'favorites' ? 'favorites' : 'teams'}!</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;

	.profile {
		padding: $unit-2x 0;
	}

	.empty,
	.end,
	.error {
		text-align: center;
		padding: $unit-4x;
		color: var(--text-secondary);

		p {
			margin: 0;
		}
	}

	.error {
		color: var(--text-error, #dc2626);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}

		p {
			margin: 0;
		}
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
