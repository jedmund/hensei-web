<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import {
		detectModifications,
		canWeaponBeModified,
		hasNotesOrSubstitutions
	} from '$lib/utils/modificationDetector'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSidebarSegmentedControl from './modifications/DetailsSidebarSegmentedControl.svelte'
	import ItemHeader from './details/ItemHeader.svelte'
	import BasicInfoSection from './details/BasicInfoSection.svelte'
	import StatsSection from './details/StatsSection.svelte'
	import SkillsSection from './details/SkillsSection.svelte'
	import TeamView from './details/TeamView.svelte'
	import OutOfSyncBanner from './details/OutOfSyncBanner.svelte'
	import SyncToCollectionDialog from './details/SyncToCollectionDialog.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { getEditKey } from '$lib/utils/editKeys'
	import { localizedName } from '$lib/utils/locale'
	import {
		useSyncGridCharacter,
		useSyncGridWeapon,
		useSyncGridSummon,
		useSyncGridCharacterToCollection,
		useSyncGridWeaponToCollection,
		useSyncGridSummonToCollection
	} from '$lib/api/mutations/grid.mutations'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item: initialItem }: Props = $props()

	// Sync mutations (collection → grid)
	const syncCharacterMutation = useSyncGridCharacter()
	const syncWeaponMutation = useSyncGridWeapon()
	const syncSummonMutation = useSyncGridSummon()

	// Sync mutations (grid → collection)
	const syncCharacterToCollectionMutation = useSyncGridCharacterToCollection()
	const syncWeaponToCollectionMutation = useSyncGridWeaponToCollection()
	const syncSummonToCollectionMutation = useSyncGridSummonToCollection()

	// Dialog state
	let syncToCollectionDialogOpen = $state(false)

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

	// Show segmented control whenever Team view has something to show: actual
	// modifications, a modifiable weapon, or party-side notes/substitutions.
	const showSegmentedControl = $derived(
		(type === 'weapon'
			? canWeaponBeModified(item as GridWeapon)
			: modificationStatus.hasModifications) || hasNotesOrSubstitutions(item)
	)

	// Track selected view - updated reactively based on modifiability
	let selectedView = $state<'canonical' | 'user'>('user')

	// Track the item ID to detect when switching to a different item
	let currentItemId = $state<string | undefined>(undefined)

	// Default-tab rules per type:
	// - Weapon: Team only when there's substantive team-side content (notes,
	//   subs, awakening, AX, befoulment, weapon keys, bullets, or a picked
	//   element override). Bare affordances like an empty key slot aren't
	//   enough.
	// - Summon: Team only when there are notes or substitutions. Uncap/quick/
	//   friend flags alone aren't enough to push past the canonical Info view.
	// - Character: Team whenever there are modifications or notes/subs.
	const defaultToTeamView = $derived(
		type === 'weapon'
			? hasNotesOrSubstitutions(item) ||
					modificationStatus.hasAwakening ||
					modificationStatus.hasAxSkills ||
					modificationStatus.hasBefoulment ||
					modificationStatus.hasWeaponKeys ||
					modificationStatus.hasBullets ||
					modificationStatus.hasElement
			: type === 'summon'
				? hasNotesOrSubstitutions(item)
				: modificationStatus.hasModifications || hasNotesOrSubstitutions(item)
	)

	// Update view when switching to a different item
	$effect(() => {
		const itemId = item && 'id' in item ? item.id : undefined
		if (itemId !== currentItemId) {
			currentItemId = itemId
			if (!showSegmentedControl || !defaultToTeamView) {
				selectedView = 'canonical'
			} else {
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

		if (type === 'character')
			return vc.characters.filter(
				(c) =>
					String(c.character.granblueId) === String(gid) &&
					meetsLevel(c.uncapLevel ?? 0, c.transcendenceStep ?? 0)
			).length
		if (type === 'weapon')
			return vc.weapons.filter(
				(w) =>
					String(w.weapon.granblueId) === String(gid) &&
					meetsLevel(w.uncapLevel ?? 0, w.transcendenceStep ?? 0)
			).length
		if (type === 'summon')
			return vc.summons.filter(
				(s) =>
					String(s.summon.granblueId) === String(gid) &&
					meetsLevel(s.uncapLevel ?? 0, s.transcendenceStep ?? 0)
			).length
		return 0
	})

	// For weapons: count how many of this weapon's granblueId are in the grid
	const gridCount = $derived.by(() => {
		if (type !== 'weapon') return undefined
		const gid = itemData?.granblueId
		if (!gid || !partyStore.party) return undefined
		return partyStore.party.weapons.filter((w) => String(w.weapon?.granblueId) === String(gid))
			.length
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

	const outOfSyncFields = $derived.by((): string[] => {
		if (type === 'character') return (item as GridCharacter).outOfSyncFields ?? []
		if (type === 'weapon') return (item as GridWeapon).outOfSyncFields ?? []
		if (type === 'summon') return (item as GridSummon).outOfSyncFields ?? []
		return []
	})

	const isOutOfSync = $derived(isLinkedToCollection && outOfSyncFields.length > 0)

	// Element key for ghost button styling (matches Button's element prop union)
	const buttonElement = $derived.by(() => {
		const key = getElementKey(itemData?.element)
		const allowed = ['wind', 'fire', 'water', 'earth', 'dark', 'light'] as const
		return (allowed as readonly string[]).includes(key)
			? (key as (typeof allowed)[number])
			: undefined
	})

	// Limit detection for the bool-style pill copy
	const isLimitItem = $derived.by(() => {
		if (type === 'weapon') return !!(item as GridWeapon).weapon?.limit
		if (type === 'summon') return !!(item as GridSummon).summon?.limit
		return false
	})

	// Find the linked collection item so the push-confirm dialog can render
	// before/after diffs. Looked up by the grid item's collection_*_id, which
	// the backend stamps when an item is linked.
	const linkedCollectionItem = $derived.by(() => {
		const vc = partyStore.activeCollection
		if (!vc) return undefined
		if (type === 'character') {
			const cid = (item as GridCharacter).collectionCharacterId
			return cid ? vc.characters.find((c) => c.id === cid) : undefined
		}
		if (type === 'weapon') {
			const wid = (item as GridWeapon).collectionWeaponId
			return wid ? vc.weapons.find((w) => w.id === wid) : undefined
		}
		if (type === 'summon') {
			const sid = (item as GridSummon).collectionSummonId
			return sid ? vc.summons.find((s) => s.id === sid) : undefined
		}
		return undefined
	})

	// Localized item name for the dialog copy.
	const itemName = $derived(itemData?.name ? localizedName(itemData.name) : undefined)

	// Permission checks
	const isPartyOwner = $derived.by(() => {
		const party = partyStore.party
		if (!party) return false
		if (authStore.user?.id && party.user?.id === authStore.user.id) return true
		if (!party.user && party.shortcode && getEditKey(party.shortcode)) return true
		return false
	})

	const isCollectionOwner = $derived(
		!!authStore.user && partyStore.party?.collectionSourceUserId === authStore.user.id
	)

	const isSyncing = $derived(
		syncCharacterMutation.isPending || syncWeaponMutation.isPending || syncSummonMutation.isPending
	)

	const isSyncingToCollection = $derived(
		syncCharacterToCollectionMutation.isPending ||
			syncWeaponToCollectionMutation.isPending ||
			syncSummonToCollectionMutation.isPending
	)

	// Handle sync from collection. When `fields` is omitted or empty, the
	// backend syncs every tracked column (full sync); otherwise it only copies
	// the named camelCase fields (e.g. ['uncapLevel', 'overMastery.1']).
	async function handleSync(fields?: string[]) {
		const itemId = item && 'id' in item ? item.id : undefined
		const partyShortcode = partyStore.party?.shortcode ?? ''
		if (!itemId || !isLinkedToCollection || !partyShortcode) return

		const params = { id: itemId, partyShortcode, fields }

		if (type === 'character') {
			await syncCharacterMutation.mutateAsync(params)
		} else if (type === 'weapon') {
			await syncWeaponMutation.mutateAsync(params)
		} else if (type === 'summon') {
			await syncSummonMutation.mutateAsync(params)
		}
	}

	// Handle sync to collection (grid → collection). `fields` semantics match
	// `handleSync` above.
	async function handleSyncToCollection(fields?: string[]) {
		const itemId = item && 'id' in item ? item.id : undefined
		const partyShortcode = partyStore.party?.shortcode ?? ''
		if (!itemId || !isLinkedToCollection || !partyShortcode) return

		const params = { id: itemId, partyShortcode, fields }

		if (type === 'character') {
			await syncCharacterToCollectionMutation.mutateAsync(params)
		} else if (type === 'weapon') {
			await syncWeaponToCollectionMutation.mutateAsync(params)
		} else if (type === 'summon') {
			await syncSummonToCollectionMutation.mutateAsync(params)
		}
	}

	// Permission flags for the sync menu buttons.
	//
	// Pull (collection → grid) requires party-edit rights. Push (grid →
	// collection) is also offered to the party owner, since the common case is
	// "owner of the party is the owner of the linked collection". When that
	// isn't true (someone editing their own party with a friend's collection
	// linked) the push request still hits the backend, which rejects unless
	// the requester is the actual collection_source_user. We accept that
	// trade-off — surfacing the option is better than silently hiding it from
	// the user who in practice owns both.
	const canPull = $derived(isLinkedToCollection && isPartyOwner)
	const canPush = $derived(isLinkedToCollection && (isCollectionOwner || isPartyOwner))

	// Captured fields for the pending push action. Set when an inline section
	// button opens the dialog; cleared back to undefined for the banner's
	// "Sync all" which intentionally pushes everything.
	let pendingPushScope = $state<string | undefined>(undefined)
	let pendingPushFields = $state<string[] | undefined>(undefined)

	function openPushDialog(scope?: string, fields?: string[]) {
		pendingPushScope = scope
		pendingPushFields = fields
		syncToCollectionDialogOpen = true
	}

	function confirmPush() {
		return handleSyncToCollection(pendingPushFields)
	}
</script>

<div class="details-sidebar">
	<ItemHeader
		{type}
		{item}
		{itemData}
		{gridUncapLevel}
		{gridTranscendence}
		collectionPill={partyStore.activeCollection
			? {
					count: collectionCount,
					gridCount,
					isLimitItem,
					sourceUsername:
						partyStore.activeCollectionUser === 'source'
							? partyStore.party?.collectionSourceUser?.username
							: undefined,
					isOutOfSync
				}
			: undefined}
	/>

	<DetailsSidebarSegmentedControl hasModifications={showSegmentedControl} bind:selectedView />

	{#if isOutOfSync}
		<OutOfSyncBanner
			{type}
			fieldCount={outOfSyncFields.length}
			element={buttonElement}
			{canPull}
			{canPush}
			{isSyncing}
			{isSyncingToCollection}
			onSyncFromCollection={() => handleSync()}
			onSyncToCollection={() => openPushDialog()}
		/>
	{/if}

	<SyncToCollectionDialog
		bind:open={syncToCollectionDialogOpen}
		{type}
		scope={pendingPushScope}
		name={itemName}
		fields={pendingPushFields ?? outOfSyncFields}
		gridItem={item}
		collectionItem={linkedCollectionItem}
		onConfirm={confirmPush}
	/>

	{#if selectedView === 'canonical'}
		<div class="canonical-view">
			<BasicInfoSection {type} {itemData} />
			<StatsSection {type} {itemData} {gridUncapLevel} {gridTranscendence} />
			<SkillsSection {type} {itemData} />
		</div>
	{:else}
		<TeamView
			{type}
			{item}
			{gridUncapLevel}
			{gridTranscendence}
			{modificationStatus}
			{isPartyOwner}
			{outOfSyncFields}
			{canPull}
			{canPush}
			{isSyncing}
			{isSyncingToCollection}
			syncElement={buttonElement}
			onSyncFromCollection={(fields) => handleSync(fields)}
			onSyncToCollection={(scope, fields) => openPushDialog(scope, fields)}
		/>
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
