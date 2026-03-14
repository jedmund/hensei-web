<script lang="ts">
	/**
	 * EditCharacterSidebar - Edit sidebar for party grid characters
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
	import { useSyncGridCharacter, useSwitchCharacterStyle } from '$lib/api/mutations/grid.mutations'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		character: GridCharacter
		onSave?: (updates: Partial<GridCharacter>) => void
		onCancel?: () => void
	}

	let { character, onSave, onCancel }: Props = $props()

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
		return (characterData.styleSwaps && characterData.styleSwaps.length > 0) ||
			(characterData.styleSwap && characterData.baseCharacter != null)
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
		rings: character.overMastery ?? [
			{ modifier: 1, strength: 0 },
			{ modifier: 2, strength: 0 },
			{ modifier: 0, strength: 0 },
			{ modifier: 0, strength: 0 }
		],
		earring: character.aetherialMastery ?? undefined,
		perpetuity: character.perpetuity ?? false
	})

	function handleSave(updates: CharacterEditUpdates) {
		// Transform CharacterEditUpdates to GridCharacter API format
		// The CharacterEditPane already formats awakening with id/level
		onSave?.(updates as Partial<GridCharacter>)
	}

	function handleCancel() {
		onCancel?.()
	}
</script>

<div class="character-edit-sidebar">
	<ItemHeader
		type="character"
		item={character}
		itemData={characterData}
		gridUncapLevel={character.uncapLevel}
		gridTranscendence={character.transcendenceStep}
	/>

	{#if hasStyleVariant}
		<button
			class="style-switch-banner"
			onclick={handleSwitchStyle}
			disabled={styleSwitching}
		>
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
			<button
				class="sync-button"
				onclick={handleSync}
				disabled={isSyncing}
			>
				{isSyncing ? 'Syncing...' : 'Sync'}
			</button>
		</div>
	{/if}

	<CharacterEditPane
		{characterData}
		{currentValues}
		showPerpetuity={canHavePerpetuity}
		onSave={handleSave}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.character-edit-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
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
