<script lang="ts">
	/**
	 * EditSummonPane - Edit pane for party grid summons.
	 *
	 * Summons don't currently expose a Stats tab (main / friend / quick_summon
	 * are edited inline on the grid), so this pane only renders the Notes
	 * content for parity with EditCharacterPane and EditWeaponPane.
	 */
	import type { GridSummon } from '$lib/types/api/party'
	import ItemHeader from './details/ItemHeader.svelte'
	import NotesEditSection from './notes/NotesEditSection.svelte'

	interface Props {
		paneId?: string
		summon: GridSummon
		partyId?: string
		partyShortcode?: string
		onSave?: (updates: Partial<GridSummon>) => void
		onCancel?: () => void
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { paneId, summon, partyId, partyShortcode, onSave, onCancel }: Props = $props()

	const summonData = $derived(summon.summon)
</script>

<div class="summon-edit-pane">
	<ItemHeader
		type="summon"
		item={summon}
		itemData={summonData}
		gridUncapLevel={summon.uncapLevel}
		gridTranscendence={summon.transcendenceStep}
	/>

	<div class="body">
		<NotesEditSection type="summon" item={summon} {partyId} {partyShortcode} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.summon-edit-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: spacing.$unit-4x;
	}

	.body {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}
</style>
