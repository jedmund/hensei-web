<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries, crewKeys } from '$lib/api/queries/crew.queries'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { ELEMENT_DISPLAY_ORDER } from '$lib/utils/element'
	import {
		addRosterItem,
		removeRosterItem,
		toSelectedItems,
		type RosterItemType
	} from '$lib/features/crew/rosterItems'
	import type { CrewRoster, EnrichedRosterItem, RosterItemRef } from '$lib/types/api/crew'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import RosterSearch from '$lib/components/crew/RosterSearch.svelte'
	import type { RosterSearchResult } from '$lib/components/crew/RosterSearch.svelte'
	import RosterElementTabs from '$lib/components/crew/roster/RosterElementTabs.svelte'
	import RosterGrid from '$lib/components/crew/roster/RosterGrid.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

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
	const selectedItems = $derived(toSelectedItems(enrichedItems))

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
		const newItems = addRosterItem(activeRoster.items, result)
		if (!newItems) return

		const rosterId = activeRoster.id

		// Optimistically update the rosters list cache
		queryClient.setQueryData(crewKeys.crewRosters(), (old: CrewRoster[] | undefined) =>
			old?.map((r) => (r.id === rosterId ? { ...r, items: newItems } : r))
		)

		saveRoster(rosterId, newItems)
	}

	function removeItem(id: string, type: RosterItemType) {
		if (!activeRoster) return

		const rosterId = activeRoster.id
		const newItems = removeRosterItem(activeRoster.items, id, type)

		// Optimistically update the rosters list cache
		queryClient.setQueryData(crewKeys.crewRosters(), (old: CrewRoster[] | undefined) =>
			old?.map((r) => (r.id === rosterId ? { ...r, items: newItems } : r))
		)

		saveRoster(rosterId, newItems)
	}
</script>

<svelte:head>
	<title>{m.page_title_crew_roster()}</title>
</svelte:head>

<CrewPage overflow="visible">
	<CrewHeader
		title={crewStore.crew?.name ?? ''}
		subtitle={crewStore.crew?.gamertag ?? undefined}
		description={crewStore.crew?.description ?? undefined}
	/>

	<CrewTabs userElement={data.currentUser?.element} />

	<div class="roster-content">
		<RosterElementTabs value={activeElement} onChange={(element) => (activeElement = element)} />
		{#if isSaving}
			<span class="save-indicator">{m.crew_roster_saving()}</span>
		{/if}

		{#if crewStore.isOfficer}
			<RosterSearch onSelect={handleSelect} />
		{/if}

		<!-- Roster Grid -->
		<div class="roster-section">
			{#if rostersQuery.isLoading}
				<div class="roster-message">{m.crew_roster_loading()}</div>
			{:else if !activeRoster}
				<div class="roster-message">{m.crew_roster_no_members()}</div>
			{:else if activeRoster.items.length === 0}
				<div class="roster-message">{m.crew_roster_empty_items()}</div>
			{:else if isLoadingRoster}
				<div class="roster-message">{m.crew_roster_loading()}</div>
			{:else if rosterMembers.length > 0}
				<RosterGrid
					items={selectedItems}
					members={rosterMembers}
					canEdit={crewStore.isOfficer}
					onRemove={removeItem}
				/>
			{:else}
				<div class="roster-message">{m.crew_roster_no_members()}</div>
			{/if}
		</div>
	</div>
</CrewPage>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.roster-content {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.save-indicator {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	// Loading and empty messages in place of the grid
	.roster-message {
		padding: spacing.$unit-3x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
