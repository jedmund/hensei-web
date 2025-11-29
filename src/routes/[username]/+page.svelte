<script lang="ts">
	import type { PageData } from './$types'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import { userQueries } from '$lib/api/queries/user.queries'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { IsInViewport } from 'runed'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const { data } = $props() as { data: PageData }
	const tab = $derived(data.tab || 'teams')
	const isOwner = $derived(data.isOwner || false)

	const avatarFile = $derived(data.user?.avatar?.picture || '')
	const avatarSrc = $derived(getAvatarSrc(avatarFile))
	const avatarSrcSet = $derived(getAvatarSrcSet(avatarFile))

	// Note: Type assertion needed because favorites and parties queries have different
	// result structures (items vs results) but we handle both in the items $derived
	const partiesQuery = createInfiniteQuery(() => {
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
		} as unknown as ReturnType<typeof userQueries.favorites>
	})

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
	<header class="header">
		{#if data.user?.avatar?.picture}
			<img
				class="avatar"
				alt={`Avatar of ${data.user.username}`}
				src={avatarSrc}
				srcset={avatarSrcSet}
				width="64"
				height="64"
			/>
		{:else}
			<div class="avatar" aria-hidden="true"></div>
		{/if}
		<div>
			<h1>{data.user.username}</h1>
			<nav class="tabs" aria-label="Profile sections">
				<a class:active={tab === 'teams'} href="?tab=teams" data-sveltekit-preload-data="hover"
					>Teams</a
				>
				{#if isOwner}
					<a
						class:active={tab === 'favorites'}
						href="?tab=favorites"
						data-sveltekit-preload-data="hover">Favorites</a
					>
				{/if}
			</nav>
		</div>
	</header>

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
	.header {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		margin-bottom: $unit-2x;
	}
	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: $grey-80;
		border: 1px solid $grey-75;
		object-fit: cover;
	}
	.sub {
		color: $grey-55;
		margin: 0;
	}
	.tabs {
		display: flex;
		gap: $unit-2x;
		margin-top: $unit-half;
	}
	.tabs a {
		text-decoration: none;
		color: inherit;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}
	.tabs a.active {
		border-color: #3366ff;
		color: #3366ff;
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
