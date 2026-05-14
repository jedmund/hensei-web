<script lang="ts">
	/**
	 * EditCharacterPane - Edit pane for party grid characters
	 *
	 * Uses the shared CharacterEditPane for edit controls.
	 * Handles GridCharacter-specific data transformation and mutations.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { GridCharacter } from '$lib/types/api/party'
	import ItemHeader from './details/ItemHeader.svelte'
	import CharacterEditPane, {
		type CharacterEditValues,
		type CharacterEditUpdates
	} from './CharacterEditPane.svelte'
	import NotesEditSection from './notes/NotesEditSection.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import { useSyncGridCharacter, useSwitchCharacterStyle } from '$lib/api/mutations/grid.mutations'
	import Icon from '$lib/components/Icon.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { useEditPaneHeader } from './useEditPaneHeader.svelte'

	interface Props {
		paneId?: string
		character: GridCharacter
		partyId?: string
		partyShortcode?: string
		initialTab?: 'stats' | 'notes'
		onSave?: (updates: Partial<GridCharacter>) => void
		onCancel?: () => void
	}

	let {
		paneId,
		character,
		partyId,
		partyShortcode,
		initialTab = 'stats',
		onSave,
		onCancel
	}: Props = $props()

	let activeTab = $state<'stats' | 'notes'>(initialTab)

	let editPaneRef: ReturnType<typeof CharacterEditPane> | undefined = $state()

	// Sync mutation
	const syncMutation = useSyncGridCharacter()

	// Style switch mutation
	const styleMutation = useSwitchCharacterStyle()

	// Character data shortcut
	const characterData = $derived(character.character)

	// Perpetuity is only available for non-MC characters (position > 0)
	const canHavePerpetuity = $derived(character.position > 0)

	// Sync status
	const isLinkedToCollection = $derived(!!character.collectionCharacterId)
	const isOutOfSync = $derived(character.outOfSync ?? false)
	const isSyncing = $derived(syncMutation.isPending)

	// Style swap
	const hasStyleVariant = $derived.by(() => {
		if (!characterData) return false
		return (
			(characterData.styleSwaps && characterData.styleSwaps.length > 0) ||
			(characterData.styleSwap && characterData.baseCharacter != null)
		)
	})

	const styleSwitching = $derived(styleMutation.isPending)

	async function handleSwitchStyle() {
		if (!character.id) return
		await styleMutation.mutateAsync({
			id: character.id,
			partyShortcode: ''
		})
	}

	// Handle sync from collection
	async function handleSync() {
		if (!character.id || !isLinkedToCollection) return
		await syncMutation.mutateAsync({
			id: character.id,
			partyShortcode: '' // Will be handled by cache invalidation
		})
	}

	// Convert GridCharacter data to CharacterEditPane format
	const currentValues = $derived<CharacterEditValues>({
		uncapLevel: character.uncapLevel ?? 0,
		transcendenceStep: character.transcendenceStep ?? 0,
		awakening: character.awakening
			? {
					type: character.awakening.type,
					level: character.awakening.level ?? 1
				}
			: null,
		// overMastery is positional with nullable slots; the edit pane wants a
		// non-null placeholder per slot so RingsSelect can render every row.
		rings: [
			character.overMastery?.[0] ?? { modifier: 1, strength: 0 },
			character.overMastery?.[1] ?? { modifier: 2, strength: 0 },
			character.overMastery?.[2] ?? { modifier: 0, strength: 0 },
			character.overMastery?.[3] ?? { modifier: 0, strength: 0 }
		],
		earring: character.aetherialMastery ?? undefined,
		perpetuity: character.perpetuity ?? false
	})

	// Element name for action button theming
	const elementId = $derived(characterData?.element)
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

	function handleSave(updates: CharacterEditUpdates) {
		// Transform CharacterEditUpdates to GridCharacter API format
		// The CharacterEditPane already formats awakening with id/level
		onSave?.(updates as Partial<GridCharacter>)
	}
</script>

<div class="character-edit-pane">
	<ItemHeader
		type="character"
		item={character}
		itemData={characterData}
		gridUncapLevel={character.uncapLevel}
		gridTranscendence={character.transcendenceStep}
	/>

	{#if hasStyleVariant}
		<button class="style-switch-banner" onclick={handleSwitchStyle} disabled={styleSwitching}>
			<Icon name="swap" size={16} />
			<span>{styleSwitching ? 'Switching...' : 'Switch Style'}</span>
		</button>
	{/if}

	{#if isLinkedToCollection && isOutOfSync}
		<div class="sync-banner">
			<div class="sync-message">
				<Icon name="refresh-cw" size={14} />
				<span>{m.details_collection_out_of_sync()}</span>
			</div>
			<button class="sync-button" onclick={handleSync} disabled={isSyncing}>
				{isSyncing ? 'Syncing...' : 'Sync'}
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
		<CharacterEditPane
			bind:this={editPaneRef}
			{characterData}
			{currentValues}
			showPerpetuity={canHavePerpetuity}
			onSave={handleSave}
		/>
	{:else}
		<NotesEditSection type="character" item={character} {partyId} {partyShortcode} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.character-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}

	.tabs {
		padding: 0 spacing.$unit-2x;
	}

	.style-switch-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
		background: var(--button-bg);
		border: 1px solid var(--button-border);
		border-radius: spacing.$unit;
		cursor: pointer;
		transition: background 0.15s ease;

		&:hover:not(:disabled) {
			background: var(--button-bg-hover);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		:global(svg) {
			color: var(--text-secondary);
		}
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
