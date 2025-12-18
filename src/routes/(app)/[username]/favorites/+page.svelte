<svelte:options runes={true} />

<script lang="ts">
	import type { PageData } from './$types'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import { userQueries } from '$lib/api/queries/user.queries'
	import { IsInViewport } from 'runed'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const { data }: { data: PageData } = $props()

	const favoritesQuery = createInfiniteQuery(() => userQueries.favorites())

	const items = $derived(() => {
		if (!favoritesQuery.data?.pages) return []
		return favoritesQuery.data.pages.flatMap((page) => page.items ?? [])
	})

	const isEmpty = $derived(!favoritesQuery.isLoading && items().length === 0)
	const showSentinel = $derived(favoritesQuery.hasNextPage && !favoritesQuery.isFetchingNextPage)

	let sentinelEl = $state<HTMLElement>()

	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '300px'
	})

	$effect(() => {
		if (
			inViewport.current &&
			favoritesQuery.hasNextPage &&
			!favoritesQuery.isFetchingNextPage &&
			!favoritesQuery.isLoading
		) {
			favoritesQuery.fetchNextPage()
		}
	})
</script>

<svelte:head>
	<title>{data.user.username}'s Favorites / granblue.team</title>
</svelte:head>

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
		activeTab="favorites"
		isOwner={true}
	/>

	{#if favoritesQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>Loading favorites...</p>
		</div>
	{:else if favoritesQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>Failed to load favorites: {favoritesQuery.error?.message || 'Unknown error'}</p>
			<Button size="small" onclick={() => favoritesQuery.refetch()}>Retry</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>No favorite teams yet</p>
		</div>
	{:else}
		<div class="profile-grid">
			<ExploreGrid items={items()} />

			{#if showSentinel}
				<div class="load-more-sentinel" bind:this={sentinelEl}></div>
			{/if}

			{#if favoritesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}

			{#if !favoritesQuery.hasNextPage && items().length > 0}
				<div class="end">
					<p>You've seen all favorites!</p>
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
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
