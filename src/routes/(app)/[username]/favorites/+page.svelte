
<script lang="ts">
	import type { PageData } from './$types'
	import { onDestroy } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import { userQueries } from '$lib/api/queries/user.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	const { data }: { data: PageData } = $props()

	let sentinelEl = $state<HTMLElement>()

	const favoritesQuery = createInfiniteQuery(() => userQueries.favorites())

	// State-gated infinite scroll
	const loader = useInfiniteLoader(() => favoritesQuery, () => sentinelEl, { rootMargin: '300px' })

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	const items = $derived(() => {
		if (!favoritesQuery.data?.pages) return []
		return favoritesQuery.data.pages.flatMap((page) => page.items ?? [])
	})

	const isEmpty = $derived(!favoritesQuery.isLoading && items().length === 0)
</script>

<svelte:head>
	<title>{m.page_title_favorites({ username: data.user.username })}</title>
</svelte:head>

<section class="profile">
	<ProfileHeader
		username={data.user.username}
		userId={data.user?.id}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		showGranblueId={data.user?.showGranblueId}
		wikiProfile={data.user?.wikiProfile}
		showWikiProfile={data.user?.showWikiProfile}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		activeTab="favorites"
		isOwner={true}
	/>

	{#if favoritesQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>{m.favorites_loading()}</p>
		</div>
	{:else if favoritesQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>{m.favorites_load_error({ error: favoritesQuery.error?.message || '' })}</p>
			<Button size="small" onclick={() => favoritesQuery.refetch()}>{m.retry()}</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>{m.favorites_empty()}</p>
		</div>
	{:else}
		<div class="profile-grid">
			<ExploreGrid items={items()} />

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!favoritesQuery.hasNextPage}
			></div>

			{#if favoritesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.loading_more()}</span>
				</div>
			{/if}

			{#if !favoritesQuery.hasNextPage && items().length > 0}
				<div class="end">
					<p>{m.favorites_seen_all()}</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;

	.profile {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
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

		&.hidden {
			display: none;
		}
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
