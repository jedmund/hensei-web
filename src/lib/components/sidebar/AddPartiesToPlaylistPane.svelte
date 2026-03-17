<script lang="ts">
	import type { Party } from '$lib/types/api/party'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { page } from '$app/stores'
	import { partyQueries, buildFilterQuery } from '$lib/api/queries/party.queries'
	import { playlistQueries } from '$lib/api/queries/playlist.queries'
	import {
		useAddPartyToPlaylist,
		useRemovePartyFromPlaylist
	} from '$lib/api/mutations/playlist.mutations'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { filterItemsToParams } from '$lib/utils/filterConversion'
	import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		playlistId: string
		playlistSlug: string
		username: string
	}

	let { playlistId, playlistSlug, username }: Props = $props()

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const badgeColor = $derived(
		currentUser?.element ? `var(--${currentUser.element}-button-bg)` : 'var(--text-tertiary)'
	)

	const playlistQuery = createQuery(() => playlistQueries.detail(username, playlistSlug))
	const partyIds = $derived(
		new Set((playlistQuery.data?.parties ?? []).map((p) => p.id))
	)

	const addMutation = useAddPartyToPlaylist()
	const removeMutation = useRemovePartyFromPlaylist()

	let userFilters = $state<FilterItem[]>([])
	let sentinelEl = $state<HTMLElement>()

	const filterParams = $derived(filterItemsToParams(userFilters))
	const cleanFilterParams = $derived(buildFilterQuery(filterParams))

	const partiesQuery = createInfiniteQuery(() =>
		partyQueries.userParties(username, { filters: cleanFilterParams })
	)

	const loader = useInfiniteLoader(
		() => partiesQuery,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	$effect(() => {
		void cleanFilterParams
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	const parties = $derived(partiesQuery.data?.pages.flatMap((page) => page.results) ?? [])
	const isEmpty = $derived(parties.length === 0 && !partiesQuery.isLoading && !partiesQuery.isError)

	function isInPlaylist(party: Party): boolean {
		return partyIds.has(party.id)
	}

	async function handleClick(party: Party) {
		const alreadyIn = isInPlaylist(party)

		try {
			if (alreadyIn) {
				await removeMutation.mutateAsync({ playlistId, partyId: party.id })
			} else {
				await addMutation.mutateAsync({ playlistId, partyId: party.id })
			}
		} catch {
			// Error handled by mutation state
		}
	}

	function handleFiltersChange(newFilters: FilterItem[]) {
		userFilters = newFilters
	}
</script>

<div class="add-to-playlist-pane">
	<div class="filters-section">
		<ExploreFilters filters={userFilters} onFiltersChange={handleFiltersChange} contained />
	</div>

	<div class="parties-list">
		{#if partiesQuery.isLoading && parties.length === 0}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<span>{m.sidebar_loading_parties()}</span>
			</div>
		{:else if partiesQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{m.sidebar_parties_error()}</p>
				<button type="button" onclick={() => partiesQuery.refetch()}>{m.retry()}</button>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				<p>{m.sidebar_no_parties()}</p>
			</div>
		{:else}
			<div class="parties-grid">
				{#each parties as party (party.id)}
					{@const alreadyIn = isInPlaylist(party)}
					<Tooltip content={m.playlist_already_added()} disabled={!alreadyIn}>
						{#snippet children()}
							<button
								class="party-item"
								onclick={() => handleClick(party)}
								disabled={addMutation.isPending || removeMutation.isPending}
							>
								<GridRep {party} disabled dimmed={alreadyIn}>
									{#snippet indicator()}
										{#if alreadyIn}
											<span
												class="in-playlist-badge"
												style:background-color={badgeColor}
											>
												<Icon name="check" size={10} />
											</span>
										{/if}
									{/snippet}
								</GridRep>
							</button>
						{/snippet}
					</Tooltip>
				{/each}
			</div>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!partiesQuery.hasNextPage}
			></div>

			{#if partiesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.loading_more()}</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.add-to-playlist-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.filters-section {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: $unit-2x;
		background: var(--sidebar-bg);
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;

		:global(.filter-trigger::before),
		:global(.filter-input-wrapper::before) {
			inset: -3px !important;
			filter: blur(6px) !important;
		}

		:global(.filter-trigger:hover::before),
		:global(.filter-input-wrapper::before) {
			animation-name: none !important;
		}

		:global(.dropdown) {
			width: 100%;
		}
	}

	.parties-list {
		display: flex;
		flex-direction: column;
		gap: $unit;
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x;
		background: var(--page-bg);
	}

	.parties-grid {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.party-item {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		transition: opacity 0.15s ease;

		&:disabled {
			cursor: not-allowed;
		}
	}

	.in-playlist-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex-shrink: 0;
		color: white;
	}

	.loading-state,
	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-tertiary);
	}

	.error-state button {
		padding: $unit $unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: $input-corner;
		background: var(--button-bg);
		cursor: pointer;
		color: var(--text-primary);

		&:hover {
			background: var(--button-bg-hover);
		}
	}

	.load-more-sentinel {
		height: 1px;

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
