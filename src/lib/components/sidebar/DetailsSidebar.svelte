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
	import CollectionSection from './details/CollectionSection.svelte'
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

	// Compute collection count from embedded party data.
	// Only counts collection items whose uncap/transcendence meets or exceeds the grid item's.
	const collectionCount = $derived.by(() => {
		const gid = itemData?.granblueId
		if (!gid) return 0

		// Use active collection from the party store (viewer or source)
		const vc = partyStore.activeCollection
		if (!vc) return 0

		const reqUncap = gridUncapLevel ?? 0
		const reqTrans = gridTranscendence ?? 0
		const meetsLevel = (uncap: number, trans: number) => uncap >= reqUncap && trans >= reqTrans

		if (type === 'character') return vc.characters.filter((c) => String(c.character.granblueId) === String(gid) && meetsLevel(c.uncapLevel ?? 0, c.transcendenceStep ?? 0)).length
		if (type === 'weapon') return vc.weapons.filter((w) => String(w.weapon.granblueId) === String(gid) && meetsLevel(w.uncapLevel ?? 0, w.transcendenceStep ?? 0)).length
		if (type === 'summon') return vc.summons.filter((s) => String(s.summon.granblueId) === String(gid) && meetsLevel(s.uncapLevel ?? 0, s.transcendenceStep ?? 0)).length
		return 0
	})

	// For weapons: count how many of this weapon's granblueId are in the grid
	const gridCount = $derived.by(() => {
		if (type !== 'weapon') return undefined
		const gid = itemData?.granblueId
		if (!gid || !partyStore.party) return undefined
		return partyStore.party.weapons.filter((w) => String(w.weapon?.granblueId) === String(gid)).length
	})

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
		const partyShortcode = partyStore.party?.shortcode ?? ''
		if (!itemId || !isLinkedToCollection || !partyShortcode) return

		if (type === 'character') {
			await syncCharacterMutation.mutateAsync({ id: itemId, partyShortcode })
		} else if (type === 'weapon') {
			await syncWeaponMutation.mutateAsync({ id: itemId, partyShortcode })
		} else if (type === 'summon') {
			await syncSummonMutation.mutateAsync({ id: itemId, partyShortcode })
		}
	}
</script>

<div class="details-sidebar">
	<ItemHeader {type} {item} {itemData} {gridUncapLevel} {gridTranscendence} />

	<DetailsSidebarSegmentedControl
		hasModifications={showSegmentedControl}
		bind:selectedView
	/>

	<CollectionSection
		{type}
		count={collectionCount}
		{gridCount}
		element={itemData?.element}
		hasCollection={!!partyStore.activeCollection}
		sourceUsername={partyStore.activeCollectionUser === 'source' ? partyStore.party?.collectionSourceUser?.username : undefined}
		isOutOfSync={isLinkedToCollection && isOutOfSync}
		{isSyncing}
		onSync={handleSync}
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

	.details-sidebar {
		padding: 0 0 spacing.$unit-2x;
		color: var(--text-primary);
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
