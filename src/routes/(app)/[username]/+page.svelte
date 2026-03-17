<script lang="ts">
	import type { PageData } from './$types'
	import type { Party } from '$lib/types/api/party'
	import { onDestroy } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { ContextMenu } from 'bits-ui'
	import { goto } from '$app/navigation'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import MigrateBanner from '$lib/components/profile/MigrateBanner.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import { filterItemsToParams } from '$lib/utils/filterConversion'
	import { useDeleteParty } from '$lib/api/mutations/party.mutations'
	import { page } from '$app/stores'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	const { data }: { data: PageData } = $props()
	const isOwner = $derived(data.isOwner || false)

	// Crew info for invite functionality
	const viewerCrewRole = $derived(crewStore.membership?.role ?? null)
	const viewerCrewId = $derived(crewStore.crew?.id ?? null)

	// Filter state
	let filterItems = $state<FilterItem[]>([])

	// Convert pill filters to API params
	const filterParams = $derived(filterItemsToParams(filterItems))

	const hasActiveFilters = $derived(filterItems.length > 0)

	let sentinelEl = $state<HTMLElement>()

	const partiesQuery = createInfiniteQuery(() => ({
		...partyQueries.userParties(data.user?.username ?? '', {
			filters: filterParams
		}),
		enabled: !!data.user?.username,
		initialData: !hasActiveFilters && data.items
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
		initialDataUpdatedAt: Date.now()
	}))

	// State-gated infinite scroll
	const loader = useInfiniteLoader(() => partiesQuery, () => sentinelEl, { rootMargin: '300px' })

	// Reset loader when filters change
	$effect(() => {
		void filterParams
		loader.reset()
	})

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	const items = $derived(
		partiesQuery.data?.pages.flatMap((page) => page.results) ?? data.items ?? []
	)

	const isEmpty = $derived(!partiesQuery.isLoading && items.length === 0)

	function handleFiltersChange(newFilters: FilterItem[]) {
		filterItems = newFilters
	}

	// Delete team
	const deleteParty = useDeleteParty()
	let deleteTarget = $state<Party | null>(null)
	let deleteDialogOpen = $state(false)

	function confirmDeleteTeam(party: Party) {
		deleteTarget = party
		deleteDialogOpen = true
	}

	async function handleDeleteTeam() {
		if (!deleteTarget) return
		await deleteParty.mutateAsync({ id: deleteTarget.id, shortcode: deleteTarget.shortcode })
		deleteDialogOpen = false
		deleteTarget = null
	}
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
		wikiProfile={data.user?.wikiProfile}
		showWikiProfile={data.user?.showWikiProfile}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		activeTab="teams"
		{isOwner}
		{viewerCrewRole}
		{viewerCrewId}
		collectionPrivacy={data.user?.collectionPrivacy}
		isAuthenticated={$page.data?.isAuthenticated}
	/>

	{#if isOwner}
		<MigrateBanner element={data.user?.avatar?.element} />
	{/if}

	<ExploreFilters bind:filters={filterItems} onFiltersChange={handleFiltersChange} />

	{#if partiesQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>{m.profile_loading()}</p>
		</div>
	{:else if partiesQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>{m.profile_load_error({ error: partiesQuery.error?.message || '' })}</p>
			<Button size="small" onclick={() => partiesQuery.refetch()}>{m.retry()}</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>{m.profile_empty()}</p>
		</div>
	{:else}
		<div class="profile-grid">
			<ul class="grid" role="list">
				{#each items as party (party.id)}
					<li>
						{#if isOwner}
							<ContextMenu.Root>
								<ContextMenu.Trigger>
									{#snippet child({ props })}
										<div {...props}>
											<GridRep {party} />
										</div>
									{/snippet}
								</ContextMenu.Trigger>
								<ContextMenu.Portal>
									<ContextMenu.Content class="context-menu">
										<ContextMenu.Item
											class="context-menu-item"
											onclick={() => goto(localizeHref(`/teams/${party.shortcode}`))}
										>
											{m.context_view_team()}
										</ContextMenu.Item>
										<ContextMenu.Separator class="context-menu-separator" />
										<ContextMenu.Item
											class="context-menu-item danger"
											onclick={() => confirmDeleteTeam(party)}
										>
											{m.context_delete_team()}
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Portal>
							</ContextMenu.Root>
						{:else}
							<GridRep {party} />
						{/if}
					</li>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!partiesQuery.hasNextPage}
			></div>

			{#if partiesQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.profile_loading_more()}</span>
				</div>
			{/if}

			{#if !partiesQuery.hasNextPage && items.length > 0}
				<div class="end">
					<p>{m.profile_seen_all()}</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={m.confirm_delete_team_title()}
	message={m.confirm_delete_team_message()}
	loading={deleteParty.isPending}
	onconfirm={handleDeleteTeam}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/mixins' as *;
	@use '$lib/components/ui/menu/menu-styles';

	.profile {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit-3x;
		padding: 0;

		@include breakpoint(tablet) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $unit-2x; }
		@include breakpoint(phone) { grid-template-columns: 1fr; gap: $unit; }

		& > li { list-style: none; }
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
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
