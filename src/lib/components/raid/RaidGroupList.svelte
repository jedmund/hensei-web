<script lang="ts">
	/**
	 * RaidGroupList - Scrollable list of raid groups
	 *
	 * Filters and displays raid groups with search support.
	 * Each group is rendered using RaidGroupItem.
	 */
	import type { RaidGroupFull, RaidFull } from '$lib/types/api/raid'
	import RaidGroupItem from './RaidGroupItem.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		groups: RaidGroupFull[]
		selectedRaidId?: string
		onSelect: (raid: RaidFull) => void
		searchQuery?: string
	}

	let { groups, selectedRaidId, onSelect, searchQuery = '' }: Props = $props()

	function getRaidName(raid: RaidFull): string {
		if (typeof raid.name === 'string') return raid.name
		const en = raid.name?.en || ''
		const ja = raid.name?.ja || ''
		return `${en} ${ja}`.toLowerCase()
	}

	function getGroupName(group: RaidGroupFull): string {
		if (typeof group.name === 'string') return group.name
		const en = group.name?.en || ''
		const ja = group.name?.ja || ''
		return `${en} ${ja}`.toLowerCase()
	}

	// Filter groups and their raids based on search query
	const filteredGroups = $derived(() => {
		if (!searchQuery.trim()) return groups

		const query = searchQuery.toLowerCase().trim()

		return groups
			.map((group) => {
				// Check if group name matches
				const groupMatches = getGroupName(group).includes(query)

				// Filter raids within the group
				const matchingRaids = group.raids.filter((raid) => getRaidName(raid).includes(query))

				// Include group if it matches or has matching raids
				if (groupMatches) {
					return group // Return full group if group name matches
				} else if (matchingRaids.length > 0) {
					return { ...group, raids: matchingRaids }
				}
				return null
			})
			.filter((group): group is RaidGroupFull => group !== null)
	})

	const hasResults = $derived(filteredGroups().length > 0)
</script>

<div class="raid-group-list">
	{#if hasResults}
		{#each filteredGroups() as group (group.id)}
			<RaidGroupItem {group} {selectedRaidId} {onSelect} />
		{/each}
	{:else}
		<div class="empty-state">
			<span class="empty-text">{m.raid_no_raids_found()}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.raid-group-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-4x;
	}

	.empty-text {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
