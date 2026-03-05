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
	import Icon from '$lib/components/Icon.svelte'
	import {
		useSyncGridCharacter,
		useSyncGridWeapon,
		useSyncGridSummon
	} from '$lib/api/mutations/grid.mutations'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item: initialItem }: Props = $props()

	// Sync mutations
	const syncCharacterMutation = useSyncGridCharacter()
	const syncWeaponMutation = useSyncGridWeapon()
	const syncSummonMutation = useSyncGridSummon()

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

	// Track the item ID to detect when switching to a different item
	let currentItemId = $state<string | undefined>(undefined)

	// Update view when switching to a different item
	$effect(() => {
		const itemId = item && 'id' in item ? item.id : undefined
		if (itemId !== currentItemId) {
			currentItemId = itemId
			if (!showSegmentedControl) {
				// Force canonical view for non-modifiable items
				selectedView = 'canonical'
			} else {
				// Default to user view for modifiable items
				selectedView = 'user'
			}
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

	// Sync status - check if linked to collection and out of sync
	const isLinkedToCollection = $derived.by(() => {
		if (type === 'character') return !!(item as GridCharacter).collectionCharacterId
		if (type === 'weapon') return !!(item as GridWeapon).collectionWeaponId
		if (type === 'summon') return !!(item as GridSummon).collectionSummonId
		return false
	})

	const isOutOfSync = $derived.by(() => {
		if (type === 'character') return (item as GridCharacter).outOfSync ?? false
		if (type === 'weapon') return (item as GridWeapon).outOfSync ?? false
		if (type === 'summon') return (item as GridSummon).outOfSync ?? false
		return false
	})

	const isSyncing = $derived(
		syncCharacterMutation.isPending ||
			syncWeaponMutation.isPending ||
			syncSummonMutation.isPending
	)

	// Handle sync from collection
	async function handleSync() {
		const itemId = item && 'id' in item ? item.id : undefined
		if (!itemId || !isLinkedToCollection) return

		if (type === 'character') {
			await syncCharacterMutation.mutateAsync({ id: itemId, partyShortcode: '' })
		} else if (type === 'weapon') {
			await syncWeaponMutation.mutateAsync({ id: itemId, partyShortcode: '' })
		} else if (type === 'summon') {
			await syncSummonMutation.mutateAsync({ id: itemId, partyShortcode: '' })
		}
	}
</script>

<div class="details-sidebar">
	<ItemHeader {type} {item} {itemData} {gridUncapLevel} {gridTranscendence} />

	{#if isLinkedToCollection && isOutOfSync}
		<div class="sync-banner">
			<div class="sync-message">
				<Icon name="refresh-cw" size={14} />
				<span>Out of sync with collection</span>
			</div>
			<button class="sync-button" onclick={handleSync} disabled={isSyncing}>
				{isSyncing ? 'Syncing...' : 'Sync'}
			</button>
		</div>
	{/if}

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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.details-sidebar {
		padding: 0 0 spacing.$unit-2x;
		color: var(--text-primary);
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.sync-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--warning-bg, rgba(255, 193, 7, 0.15));
		border: 1px solid var(--warning-border, rgba(255, 193, 7, 0.3));
		border-radius: spacing.$unit;
		gap: spacing.$unit-2x;
	}

	.sync-message {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;
		color: var(--warning-text, #b59100);

		:global(svg) {
			color: inherit;
		}
	}

	.sync-button {
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
		background: var(--button-bg);
		border: 1px solid var(--button-border);
		border-radius: spacing.$unit-half;
		cursor: pointer;
		transition: background 0.15s ease;

		&:hover:not(:disabled) {
			background: var(--button-bg-hover);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.canonical-view {
		display: flex;
		position: relative;
		flex-direction: column;
		gap: spacing.$unit-4x;
	}
</style>
