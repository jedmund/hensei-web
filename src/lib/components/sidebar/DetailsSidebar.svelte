<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { detectModifications, canWeaponBeModified } from '$lib/utils/modificationDetector'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSidebarSegmentedControl from './modifications/DetailsSidebarSegmentedControl.svelte'
	import ItemHeader from './details/ItemHeader.svelte'
	import BasicInfoSection from './details/BasicInfoSection.svelte'
	import StatsSection from './details/StatsSection.svelte'
	import SkillsSection from './details/SkillsSection.svelte'
	import TeamView from './details/TeamView.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item: initialItem }: Props = $props()

	// Derive item from partyStore for reactivity, fall back to prop if not in store
	// This ensures the sidebar updates when party data changes (e.g., uncap level)
	let item = $derived.by(() => {
		const activeId = sidebar.activeItemId
		if (activeId && partyStore.party) {
			const storeItem = partyStore.getItem(type, activeId)
			if (storeItem) return storeItem
		}
		return initialItem
	})

	let modificationStatus = $derived(detectModifications(type, item))

	// For weapons, only show segmented control if the weapon can be modified
	const showSegmentedControl = $derived(
		type === 'weapon'
			? canWeaponBeModified(item as GridWeapon)
			: modificationStatus.hasModifications
	)

	// Track selected view - updated reactively based on modifiability
	let selectedView = $state<'canonical' | 'user'>('user')

	// Update view when switching to items with different modifiability
	$effect(() => {
		if (!showSegmentedControl) {
			// Force canonical view for non-modifiable items
			selectedView = 'canonical'
		} else if (showSegmentedControl && selectedView === 'canonical') {
			// Switch to user view when selecting a modifiable item
			selectedView = 'user'
		}
	})

	// Helper to get the actual item data
	function getItemData() {
		if (type === 'character') {
			return (item as GridCharacter).character
		} else if (type === 'weapon') {
			return (item as GridWeapon).weapon
		} else {
			return (item as GridSummon).summon
		}
	}

	// Get the item's actual data
	const itemData = $derived(getItemData())

	// Grid item info (uncap levels from the grid item itself) - convert undefined to null
	const gridUncapLevel = $derived(
		type === 'character'
			? ((item as GridCharacter).uncapLevel ?? null)
			: type === 'weapon'
				? ((item as GridWeapon).uncapLevel ?? null)
				: ((item as GridSummon).uncapLevel ?? null)
	)

	const gridTranscendence = $derived(
		type === 'character'
			? ((item as GridCharacter).transcendenceStep ?? null)
			: type === 'weapon'
				? ((item as GridWeapon).transcendenceStep ?? null)
				: ((item as GridSummon).transcendenceStep ?? null)
	)
</script>

<div class="details-sidebar">
	<ItemHeader {type} {item} {itemData} {gridUncapLevel} {gridTranscendence} />

	<DetailsSidebarSegmentedControl
		hasModifications={showSegmentedControl}
		bind:selectedView
	/>

	{#if selectedView === 'canonical'}
		<div class="canonical-view">
			<BasicInfoSection {type} {itemData} />
			<StatsSection {itemData} {gridUncapLevel} {gridTranscendence} />
			<SkillsSection {type} {itemData} />
		</div>
	{:else}
		<TeamView {type} {item} {itemData} {gridUncapLevel} {gridTranscendence} {modificationStatus} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.details-sidebar {
		padding: 0 0 spacing.$unit-2x;
		color: var(--text-primary, colors.$grey-10);
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.canonical-view {
		display: flex;
		position: relative;
		flex-direction: column;
		gap: spacing.$unit-4x;
	}
</style>
