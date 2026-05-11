<script lang="ts">
	/**
	 * EditWeaponPane - Edit pane for party grid weapons
	 *
	 * Uses the shared WeaponEditPane for edit controls.
	 * Handles GridWeapon-specific data transformation and mutations.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { GridWeapon } from '$lib/types/api/party'
	import ItemHeader from './details/ItemHeader.svelte'
	import WeaponEditPane, {
		type WeaponEditValues,
		type WeaponEditUpdates
	} from './WeaponEditPane.svelte'
	import NotesEditSection from './notes/NotesEditSection.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import { useSyncGridWeapon } from '$lib/api/mutations/grid.mutations'
	import Icon from '$lib/components/Icon.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { useEditPaneHeader } from './useEditPaneHeader.svelte'

	interface Props {
		paneId?: string
		weapon: GridWeapon
		partyId?: string
		partyShortcode?: string
		onSave?: (updates: Partial<GridWeapon>) => void
		onCancel?: () => void
	}

	let { paneId, weapon, partyId, partyShortcode, onSave, onCancel }: Props = $props()

	let activeTab = $state<'stats' | 'notes'>('stats')

	let editPaneRef: ReturnType<typeof WeaponEditPane> | undefined = $state()

	// Sync mutation
	const syncMutation = useSyncGridWeapon()

	// Weapon data shortcut
	const weaponData = $derived(weapon.weapon)

	// Sync status
	const isLinkedToCollection = $derived(!!weapon.collectionWeaponId)
	const isOutOfSync = $derived(weapon.outOfSync ?? false)
	const isSyncing = $derived(syncMutation.isPending)

	// Handle sync from collection
	async function handleSync() {
		if (!weapon.id || !isLinkedToCollection) return
		await syncMutation.mutateAsync({
			id: weapon.id,
			partyShortcode: ''
		})
	}

	// Convert GridWeapon data to WeaponEditPane format
	const currentValues = $derived<WeaponEditValues>({
		uncapLevel: weapon.uncapLevel ?? 0,
		transcendenceStep: weapon.transcendenceStep ?? 0,
		element: weapon.element ?? weaponData?.element ?? 0,
		weaponKey1Id: weapon.weaponKeys?.[0]?.id,
		weaponKey2Id: weapon.weaponKeys?.[1]?.id,
		weaponKey3Id: weapon.weaponKeys?.[2]?.id,
		awakening: weapon.awakening
			? {
					type: weapon.awakening.type,
					level: weapon.awakening.level ?? 1
				}
			: null,
		axSkills: weapon.ax ?? [],
		befoulment: weapon.befoulment ?? null,
		bullets: weapon.bullets ?? []
	})

	// Element name for action button theming
	const elementId = $derived(weapon.element || weaponData?.element)
	const elementName = $derived(
		elementId
			? (getElementKey(elementId) as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light')
			: undefined
	)

	useEditPaneHeader({
		paneId: () => paneId,
		activeTab: () => activeTab,
		elementName: () => elementName,
		saveStats: () => editPaneRef?.save(),
		hasChanges: () => editPaneRef?.getHasChanges() ?? false,
		onCancel
	})

	function handleSave(updates: WeaponEditUpdates) {
		onSave?.(updates as Partial<GridWeapon>)
	}
</script>

<div class="weapon-edit-pane">
	<ItemHeader
		type="weapon"
		item={weapon}
		itemData={weaponData}
		gridUncapLevel={weapon.uncapLevel}
		gridTranscendence={weapon.transcendenceStep}
	/>

	{#if isLinkedToCollection && isOutOfSync}
		<div class="sync-banner">
			<div class="sync-message">
				<Icon name="refresh-cw" size={14} />
				<span>{m.sidebar_weapon_out_of_sync()}</span>
			</div>
			<button class="sync-button" onclick={handleSync} disabled={isSyncing}>
				{isSyncing ? m.sidebar_weapon_syncing() : m.sidebar_weapon_sync()}
			</button>
		</div>
	{/if}

	<div class="tabs">
		<SegmentedControl bind:value={activeTab} variant="background" size="small" grow>
			<Segment value="stats">{m.tab_stats()}</Segment>
			<Segment value="notes">{m.tab_notes()}</Segment>
		</SegmentedControl>
	</div>

	{#if activeTab === 'stats'}
		<WeaponEditPane
			bind:this={editPaneRef}
			{weaponData}
			{currentValues}
			position={weapon.position}
			onSave={handleSave}
		/>
	{:else}
		<NotesEditSection type="weapon" item={weapon} {partyId} {partyShortcode} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.weapon-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}

	.tabs {
		padding: 0 spacing.$unit-2x;
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
</style>
