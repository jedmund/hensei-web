<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries, crewKeys } from '$lib/api/queries/crew.queries'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/utils/images'
	import {
		ELEMENT_DISPLAY_ORDER,
		getElementClass,
		getElementImage,
		getElementLabel
	} from '$lib/utils/element'
	import type { CrewRoster, EnrichedRosterItem, RosterItemRef } from '$lib/types/api/crew'
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

	// Selected item with metadata (local UI state enriched beyond what's persisted)
	interface SelectedItem {
		id: string
		granblueId: string
		name: string
		type: ItemType
		element?: number
		season?: number | null
	}

	// State — default to first element in display order (Fire)
	let activeElement = $state<number>(ELEMENT_DISPLAY_ORDER[0])
	let hasCheckedOfficer = $state(false)
	let saveTimeout: ReturnType<typeof setTimeout> | null = null

	const queryClient = useQueryClient()

	// Check if user is an officer (one-time after crew data loads)
	// We wait for membership to be populated rather than checking isLoading,
	// because cached query data can cause isLoading to be false before the
	// setCrew effect runs.
	$effect(() => {
		if (!crewStore.membership) return
		if (hasCheckedOfficer) return
		hasCheckedOfficer = true
		if (!crewStore.isOfficer) {
			goto(localizeHref('/crew'))
		}
	})

	// Fetch all rosters for the crew
	const rostersQuery = createQuery(() => crewQueries.crewRosters())
	const rosters = $derived(rostersQuery.data ?? [])

	// Find the active roster by element
	const activeRoster = $derived(rosters.find((r) => r.element === activeElement))
	const activeRosterId = $derived(activeRoster?.id ?? '')

	// Fetch the active roster's data (items + member ownership)
	const rosterDetailQuery = createQuery(() => crewQueries.crewRoster(activeRosterId))
	const rosterDetail = $derived(rosterDetailQuery.data)
	const rosterMembers = $derived(rosterDetail?.members ?? [])
	const isLoadingRoster = $derived(rosterDetailQuery.isLoading && !!activeRosterId)

	// Enriched items from the API (includes granblueId, name, element, etc.)
	const enrichedItems = $derived<EnrichedRosterItem[]>(rosterDetail?.items ?? [])

	// Build selectedItems from the enriched API data
	const selectedItems = $derived<SelectedItem[]>(
		enrichedItems.map((item) => ({
			id: item.id,
			granblueId: item.granblueId,
			name: item.name,
			type: item.type,
			element: item.element,
			season: item.season
		}))
	)

	// Show error toast on query failure
	$effect(() => {
		if (rosterDetailQuery.isError) {
			toast.error(extractErrorMessage(rosterDetailQuery.error, 'Failed to load roster'))
		}
	})

	// Mutation for saving roster items
	const updateRosterMutation = createMutation(() => ({
		mutationFn: (vars: { rosterId: string; items: RosterItemRef[] }) =>
			crewAdapter.updateCrewRoster(vars.rosterId, { items: vars.items }),
		onSuccess: (updatedRoster) => {
			// Update the rosters list cache
			queryClient.setQueryData(crewKeys.crewRosters(), (old: CrewRoster[] | undefined) =>
				old?.map((r) => (r.id === updatedRoster.id ? { ...r, items: updatedRoster.items } : r))
			)
			// Invalidate the detail query to refetch member ownership
			queryClient.invalidateQueries({ queryKey: crewKeys.crewRoster(updatedRoster.id) })
		},
		onError: (_error, vars) => {
			toast.error(extractErrorMessage(_error, 'Failed to save roster'))
			// Rollback: invalidate to refetch server state
			queryClient.invalidateQueries({ queryKey: crewKeys.crewRosters() })
			queryClient.invalidateQueries({ queryKey: crewKeys.crewRoster(vars.rosterId) })
		}
	}))

	const isSaving = $derived(updateRosterMutation.isPending)

	function saveRoster(rosterId: string, items: RosterItemRef[]) {
		// Debounce saves — capture rosterId at call time to avoid race with tab switching
		if (saveTimeout) clearTimeout(saveTimeout)
		saveTimeout = setTimeout(() => {
			updateRosterMutation.mutate({ rosterId, items })
		}, 500)
	}

	function handleSelect(result: RosterSearchResult) {
		if (!activeRoster) return
		if (activeRoster.items.some((item) => item.id === result.id && item.type === result.type))
			return

		const rosterId = activeRoster.id
		const newItems: RosterItemRef[] = [...activeRoster.items, { id: result.id, type: result.type }]

		// Optimistically update the rosters list cache
		queryClient.setQueryData(crewKeys.crewRosters(), (old: CrewRoster[] | undefined) =>
			old?.map((r) => (r.id === rosterId ? { ...r, items: newItems } : r))
		)

		saveRoster(rosterId, newItems)
	}

	function removeItem(id: string, type: ItemType) {
		if (!activeRoster) return

		const rosterId = activeRoster.id
		const newItems = activeRoster.items.filter((item) => !(item.id === id && item.type === type))

		// Optimistically update the rosters list cache
		queryClient.setQueryData(crewKeys.crewRosters(), (old: CrewRoster[] | undefined) =>
			old?.map((r) => (r.id === rosterId ? { ...r, items: newItems } : r))
		)

		saveRoster(rosterId, newItems)
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
			<!-- Element tabs -->
			<div class="element-tabs">
				{#each ELEMENT_DISPLAY_ORDER as element (element)}
					<button
						class="element-tab {getElementClass(element)}"
						class:active={activeElement === element}
						onclick={() => (activeElement = element)}
					>
						<img
							src={getElementImage(element)}
							alt={getElementLabel(element)}
							class="element-icon"
						/>
						{getElementLabel(element)}
					</button>
				{/each}
			</div>
			{#if isSaving}
				<span class="save-indicator">{m.crew_roster_saving()}</span>
			{/if}

			{#if crewStore.isOfficer}
				<RosterSearch onSelect={handleSelect} />
			{/if}

			<!-- Roster Grid -->
			<div class="roster-section">
				{#if rostersQuery.isLoading}
					<div class="loading-roster">{m.crew_roster_loading()}</div>
				{:else if !activeRoster}
					<div class="empty-roster">{m.crew_roster_no_members()}</div>
				{:else if activeRoster.items.length === 0}
					<div class="empty-roster">{m.crew_roster_empty_items()}</div>
				{:else if isLoadingRoster}
					<div class="loading-roster">{m.crew_roster_loading()}</div>
				{:else if rosterMembers.length > 0}
					<div class="roster-grid">
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
															season: item.season
														}}
													/>
												{/if}
											</div>
										{/snippet}
										<div class="header-item-wrapper">
											<img src={getItemImage(item)} alt={item.name} class="header-item-image" />
											{#if crewStore.isOfficer}
												<button
													class="remove-item-btn"
													onclick={() => removeItem(item.id, item.type)}
													aria-label={m.crew_roster_remove_aria({ name: item.name })}
												>
													<Icon name="close" size={12} />
												</button>
											{/if}
										</div>
									</RichTooltip>
								</div>
							{/each}
						</div>
						<div class="roster-body">
							{#each rosterMembers as member (member.userId)}
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
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.element-tabs {
		display: flex;
		gap: spacing.$unit-half;
		align-items: center;
	}

	.element-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit spacing.$unit;
		border: none;
		border-radius: layout.$item-corner;
		background: var(--pill-bg);
		color: var(--text-primary);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;

		&.element-fire {
			&.active {
				background: var(--fire-nav-selected-bg);
				color: var(--fire-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--fire-nav-selected-bg);
				color: var(--fire-nav-selected-text);
			}
		}
		&.element-water {
			&.active {
				background: var(--water-nav-selected-bg);
				color: var(--water-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--water-nav-selected-bg);
				color: var(--water-nav-selected-text);
			}
		}
		&.element-earth {
			&.active {
				background: var(--earth-nav-selected-bg);
				color: var(--earth-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--earth-nav-selected-bg);
				color: var(--earth-nav-selected-text);
			}
		}
		&.element-wind {
			&.active {
				background: var(--wind-nav-selected-bg);
				color: var(--wind-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--wind-nav-selected-bg);
				color: var(--wind-nav-selected-text);
			}
		}
		&.element-dark {
			&.active {
				background: var(--dark-nav-selected-bg);
				color: var(--dark-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--dark-nav-selected-bg);
				color: var(--dark-nav-selected-text);
			}
		}
		&.element-light {
			&.active {
				background: var(--light-nav-selected-bg);
				color: var(--light-nav-selected-text);
			}
			&:hover:not(.active) {
				background: var(--light-nav-selected-bg);
				color: var(--light-nav-selected-text);
			}
		}
	}

	.element-icon {
		width: 16px;
		height: 16px;
	}

	.save-indicator {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
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
		background: var(--pill-bg);
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

	.member-col {
		flex: 1;
		min-width: 150px;
		position: sticky;
		left: 0;
		padding-left: spacing.$unit-2x;
		background: var(--card-bg);
		z-index: effects.$z-raised;
	}

	.loading-roster,
	.empty-roster {
		padding: spacing.$unit-3x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
