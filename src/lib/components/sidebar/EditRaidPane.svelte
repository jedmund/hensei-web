<script lang="ts">
	/**
	 * EditRaidPane - Raid selection pane for the sidebar
	 *
	 * Allows users to browse and select a raid from organized groups.
	 * Features section tabs (Raids/Events/Solo), search, and sort toggle.
	 *
	 * With `multiple`, every click toggles a raid through `onSelect` and the
	 * pane stays open; `isSelected` (read live from the caller's state) marks
	 * what's picked.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { RaidFull } from '$lib/types/api/raid'
	import type { Raid } from '$lib/types/api/entities'
	import { createQuery } from '@tanstack/svelte-query'
	import { raidQueries } from '$lib/api/queries/raid.queries'
	import { RaidSection } from '$lib/utils/raidSection'
	import { sortRaidGroups } from '$lib/utils/raidGroupSort'
	import RaidSectionTabs from '$lib/components/raid/RaidSectionTabs.svelte'
	import RaidGroupList from '$lib/components/raid/RaidGroupList.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'

	interface Props {
		/** Currently selected raid */
		currentRaid?: Raid | null
		/** Callback when a raid is selected; null when single-select unpicks it */
		onSelect: (raid: RaidFull | null) => void
		/** Pick several raids: clicks toggle, and the caller keeps the list */
		multiple?: boolean
		/** Multi-select: whether a raid is in the caller's list */
		isSelected?: (raid: RaidFull) => boolean
	}

	let { currentRaid, onSelect, multiple = false, isSelected }: Props = $props()

	const selected = $derived(
		multiple && isSelected ? isSelected : (raid: RaidFull) => raid.id === currentRaid?.id
	)

	// State
	let searchQuery = $state('')
	let selectedSection = $state(RaidSection.Raid)
	let sortAscending = $state(false)

	// Fetch all raid groups
	const groupsQuery = createQuery(() => raidQueries.groups())

	// Filter groups by section and sort
	const filteredGroups = $derived(() => {
		if (!groupsQuery.data) return []

		// Filter by section
		const groups = groupsQuery.data.filter((group) => {
			const groupSection =
				typeof group.section === 'string' ? parseInt(group.section, 10) : group.section
			return groupSection === selectedSection
		})

		return sortRaidGroups(groups, selectedSection, sortAscending)
	})

	function handleRaidSelect(raid: RaidFull) {
		// Multi-select: the caller adds or removes it
		if (multiple) {
			onSelect(raid)
			return
		}
		// Toggle: clicking selected raid unselects it
		if (raid.id === currentRaid?.id) {
			onSelect(null)
		} else {
			onSelect(raid)
		}
	}

	function toggleSort() {
		sortAscending = !sortAscending
	}

	const isLoading = $derived(groupsQuery.isLoading)
</script>

<div class="edit-raid-pane">
	<!-- Search Input -->
	<div class="search-section">
		<Input
			leftIcon="search"
			placeholder={m.placeholder_search_raids()}
			bind:value={searchQuery}
			contained
			clearable
			fullWidth
		/>
	</div>

	<!-- Controls: Tabs + Sort -->
	<div class="controls-section">
		<RaidSectionTabs bind:value={selectedSection} />
		<Button
			variant="ghost"
			iconOnly
			icon={sortAscending ? 'arrow-up' : 'arrow-down'}
			onclick={toggleSort}
			title={m.tooltip_toggle_sort()}
		/>
	</div>

	<!-- Raid List -->
	<div class="raid-list-container">
		{#if isLoading}
			<div class="loading-state">
				<span>{m.sidebar_loading_raids()}</span>
			</div>
		{:else}
			<RaidGroupList
				groups={filteredGroups()}
				isSelected={selected}
				onSelect={handleRaidSelect}
				{searchQuery}
			/>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.edit-raid-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.search-section {
		padding: $unit-2x $unit-2x $unit $unit-2x;
	}

	.controls-section {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x $unit-2x $unit-2x;
		border-bottom: 1px solid var(--border-subtle);
	}

	.raid-list-container {
		flex: 1;
		overflow-y: auto;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-4x;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
