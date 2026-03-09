
<script lang="ts">
	import { onDestroy } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	let sentinelEl = $state<HTMLElement>()

	// Query for shared parties
	const sharedPartiesQuery = createInfiniteQuery(() => ({
		...crewQueries.sharedParties(),
		enabled: crewStore.isInCrew
	}))

	// State-gated infinite scroll
	const loader = useInfiniteLoader(
		() => sharedPartiesQuery,
		() => sentinelEl,
		{ rootMargin: '300px' }
	)

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	const items = $derived(
		sharedPartiesQuery.data?.pages.flatMap((page) => page.parties) ?? []
	)

	const isEmpty = $derived(!sharedPartiesQuery.isLoading && items.length === 0)
</script>

<svelte:head>
	<title>Crew Teams / granblue.team</title>
</svelte:head>

<div class="page">
	<div class="card">
		<CrewHeader
			title={crewStore.crew?.name ?? ''}
			subtitle={crewStore.crew?.gamertag ?? undefined}
			description={crewStore.crew?.description ?? undefined}
		/>

		<CrewTabs userElement={data.currentUser?.element} />

		<div class="content">
			{#if !crewStore.isInCrew}
				<div class="empty-state">
					<Icon name="users" size={32} />
					<p>You're not in a crew</p>
				</div>
			{:else if sharedPartiesQuery.isLoading}
				<div class="loading-state">
					<Icon name="loader-2" size={32} class="spin" />
					<p>Loading shared teams...</p>
				</div>
			{:else if sharedPartiesQuery.isError}
				<div class="error-state">
					<Icon name="alert-circle" size={32} />
					<p>Failed to load teams: {sharedPartiesQuery.error?.message || 'Unknown error'}</p>
					<Button size="small" onclick={() => sharedPartiesQuery.refetch()}>Retry</Button>
				</div>
			{:else if isEmpty}
				<div class="empty-state">
					<Icon name="share-2" size={32} />
					<p>No teams have been shared with your crew yet</p>
					<span class="hint">Crew members can share their teams from the team settings</span>
				</div>
			{:else}
				<div class="teams-grid">
					<ExploreGrid {items} />

					<div
						class="load-more-sentinel"
						bind:this={sentinelEl}
						class:hidden={!sharedPartiesQuery.hasNextPage}
					></div>

					{#if sharedPartiesQuery.isFetchingNextPage}
						<div class="loading-more">
							<Icon name="loader-2" size={20} class="spin" />
							<span>Loading more...</span>
						</div>
					{/if}

					{#if !sharedPartiesQuery.hasNextPage && items.length > 0}
						<div class="end-message">
							<p>You've seen all shared teams</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.content {
		padding: spacing.$unit-2x;
	}

	.teams-grid {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.empty-state,
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-6x spacing.$unit-4x;
		color: var(--text-secondary);
		text-align: center;
		gap: spacing.$unit;

		p {
			margin: 0;
			font-size: typography.$font-regular;
		}

		.hint {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
		}
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.end-message {
		text-align: center;
		padding: spacing.$unit-2x;
		color: var(--text-tertiary);
		font-size: typography.$font-small;

		p {
			margin: 0;
		}
	}

	.load-more-sentinel {
		height: 1px;

		&.hidden {
			display: none;
		}
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
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
