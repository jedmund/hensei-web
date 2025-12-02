<script lang="ts">
	/**
	 * EditCharacterSidebar - Edit sidebar for party grid characters
	 *
	 * Uses the shared CharacterEditPane for edit controls.
	 * Handles GridCharacter-specific data transformation and mutations.
	 */
	import type { GridCharacter } from '$lib/types/api/party'
	import ItemHeader from './details/ItemHeader.svelte'
	import CharacterEditPane, {
		type CharacterEditValues,
		type CharacterEditUpdates
	} from './CharacterEditPane.svelte'

	interface Props {
		character: GridCharacter
		onSave?: (updates: Partial<GridCharacter>) => void
		onCancel?: () => void
	}

	let { character, onSave, onCancel }: Props = $props()

	// Character data shortcut
	const characterData = $derived(character.character)

	// Perpetuity is only available for non-MC characters (position > 0)
	const canHavePerpetuity = $derived(character.position > 0)

	// Convert GridCharacter data to CharacterEditPane format
	const currentValues = $derived<CharacterEditValues>({
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

	<CharacterEditPane
		{characterData}
		{currentValues}
		showPerpetuity={canHavePerpetuity}
		onSave={handleSave}
		onCancel={handleCancel}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.character-edit-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}
</style>
