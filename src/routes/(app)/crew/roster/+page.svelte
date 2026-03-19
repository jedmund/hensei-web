
<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { type UnifiedSearchSeriesRef } from '$lib/api/adapters/search.adapter'
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import RosterRow from '$lib/components/crew/RosterRow.svelte'
	import RosterSearch from '$lib/components/crew/RosterSearch.svelte'
	import type { RosterSearchResult } from '$lib/components/crew/RosterSearch.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Item type for roster
	type ItemType = 'Character' | 'Weapon' | 'Summon'

	// Selected item with metadata
	interface SelectedItem {
		id: string
		granblueId: string
		name: string
		type: ItemType
		element?: number
		season?: number | null
		series?: UnifiedSearchSeriesRef[] | null
	}

	// State
	let selectedItems = $state<SelectedItem[]>([])
	let hasCheckedOfficer = $state(false)

	// Check if user is an officer (one-time after initial load)
	$effect(() => {
		if (crewStore.isLoading) return
		if (hasCheckedOfficer) return
		hasCheckedOfficer = true
		if (!crewStore.isOfficer) {
			goto(localizeHref('/crew'))
		}
	})

	// Derived ID arrays for the roster query key
	const characterIds = $derived(
		selectedItems.filter((i) => i.type === 'Character').map((i) => i.id)
	)
	const weaponIds = $derived(selectedItems.filter((i) => i.type === 'Weapon').map((i) => i.id))
	const summonIds = $derived(selectedItems.filter((i) => i.type === 'Summon').map((i) => i.id))

	// TanStack Query handles deduplication, cancellation, caching
	const rosterQuery = createQuery(() => ({
		...crewQueries.roster(characterIds, weaponIds, summonIds)
	}))

	const rosterData = $derived(rosterQuery.data?.members ?? [])
	const isLoadingRoster = $derived(rosterQuery.isLoading && selectedItems.length > 0)

	// Show error toast on query failure
	$effect(() => {
		if (rosterQuery.isError) {
			toast.error(extractErrorMessage(rosterQuery.error, 'Failed to load roster'))
		}
	})

	function handleSelect(result: RosterSearchResult) {
		if (selectedItems.some((item) => item.id === result.id && item.type === result.type)) return

		selectedItems = [
			...selectedItems,
			{
				id: result.id,
				granblueId: result.granblueId,
				name: result.name,
				type: result.type,
				element: result.element,
				season: result.season,
				series: result.series
			}
		]
	}

	function removeItem(id: string, type: ItemType) {
		selectedItems = selectedItems.filter((item) => !(item.id === id && item.type === type))
	}

	function getItemImage(item: SelectedItem): string {
		switch (item.type) {
			case 'Character':
				return getCharacterImage(item.granblueId, 'square', '01')
			case 'Weapon':
				return getWeaponImage(item.granblueId, 'square')
			case 'Summon':
				return getSummonImage(item.granblueId, 'square')
		}
	}

</script>

<svelte:head>
	<title>{m.page_title_crew_roster()}</title>
</svelte:head>

<div class="page">
	<div class="card">
		<CrewHeader
			title={crewStore.crew?.name ?? ''}
			subtitle={crewStore.crew?.gamertag ?? undefined}
			description={crewStore.crew?.description ?? undefined}
		/>

		<CrewTabs userElement={data.currentUser?.element} />

		<div class="roster-content">
			<RosterSearch onSelect={handleSelect} />

			<!-- Roster Grid -->
			<div class="roster-section">
				{#if isLoadingRoster}
					<div class="loading-roster">{m.crew_roster_loading()}</div>
				{:else if rosterData.length > 0}
					<div class="roster-grid">
						{#if selectedItems.length > 0}
							<div class="roster-header">
								<div class="member-col"></div>
								{#each selectedItems as item (item.id + item.type)}
									<div class="item-col">
										<RichTooltip>
											{#snippet content()}
												<div class="tooltip-content">
													<span class="item-name">{item.name}</span>
													{#if item.type === 'Character'}
														<CharacterTags
															character={{
																element: item.element,
																season: item.season,
																series: item.series
															}}
														/>
													{/if}
												</div>
											{/snippet}
											{#snippet children()}
												<div class="header-item-wrapper">
													<img
														src={getItemImage(item)}
														alt={item.name}
														class="header-item-image"
													/>
													<button
														class="remove-item-btn"
														onclick={() => removeItem(item.id, item.type)}
														aria-label={m.crew_roster_remove_aria({ name: item.name })}
													>
														<Icon name="close" size={12} />
													</button>
												</div>
											{/snippet}
										</RichTooltip>
									</div>
								{/each}
							</div>
						{/if}
						<div class="roster-body">
							{#each rosterData as member (member.userId)}
								<RosterRow {member} {selectedItems} />
							{/each}
						</div>
					</div>
				{:else}
					<div class="empty-roster">{m.crew_roster_no_members()}</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
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
		overflow: visible;
	}

	.roster-content {
		padding: spacing.$unit-2x;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.roster-grid {
		overflow-x: auto;
		font-size: typography.$font-regular;
	}

	.roster-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x spacing.$unit 0;
	}

	.item-col {
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-item-wrapper {
		position: relative;
	}

	.tooltip-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.item-name {
		font-weight: typography.$medium;
	}

	.header-item-image {
		width: 60px;
		height: 60px;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
	}

	.remove-item-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: var(--surface-hover, #e5e5e5);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition:
			opacity 0.15s,
			background-color 0.15s,
			color 0.15s;

		&:hover {
			background: var(--color-red, #dc2626);
			color: white;
		}
	}

	.item-col:hover .remove-item-btn {
		opacity: 1;
	}

	.loading-roster,
	.empty-roster {
		padding: spacing.$unit-3x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
