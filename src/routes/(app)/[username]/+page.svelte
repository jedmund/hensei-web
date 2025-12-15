<script lang="ts">
	import type { PageData } from './$types'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import { userQueries } from '$lib/api/queries/user.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { IsInViewport } from 'runed'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	const { data }: { data: PageData } = $props()
	const isOwner = $derived(data.isOwner || false)

	// Crew info for invite functionality
	const viewerCrewRole = $derived(crewStore.membership?.role ?? null)
	const viewerCrewId = $derived(crewStore.crew?.id ?? null)

	const partiesQuery = createInfiniteQuery(() => ({
		...userQueries.parties(data.user?.username ?? ''),
		enabled: !!data.user?.username,
		initialData: data.items
			? {
					pages: [
						{
							results: data.items,
							page: data.page || 1,
							totalPages: data.totalPages ?? 1,
							total: data.total ?? data.items.length,
							perPage: data.perPage || 20
						}
					],
					pageParams: [1]
				}
			: undefined,
		initialDataUpdatedAt: 0
	}))

	const items = $derived(() => {
		if (!partiesQuery.data?.pages) return data.items || []
		return partiesQuery.data.pages.flatMap((page) => page.results ?? [])
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

<PageMeta
	title={m.page_title_profile({ username: data.user?.username ?? '' })}
	description={m.page_desc_profile({ username: data.user?.username ?? '' })}
/>

<section class="profile">
	<ProfileHeader
		username={data.user.username}
		userId={data.user?.id}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		showGranblueId={data.user?.showGranblueId}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		activeTab="teams"
		{isOwner}
		{viewerCrewRole}
		{viewerCrewId}
	/>

	{#if partiesQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>Loading teams...</p>
		</div>
	{:else if partiesQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>Failed to load teams: {partiesQuery.error?.message || 'Unknown error'}</p>
			<Button size="small" onclick={() => partiesQuery.refetch()}>Retry</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>No teams found</p>
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
					<p>You've seen all teams!</p>
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
