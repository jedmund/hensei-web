<script lang="ts">
	import CharacterUncap from '$lib/features/database/characters/detail/CharacterUncap.svelte'
	import type { AdminCharacterRow } from '$lib/types/api/admin'

	// A characters list row: the uncaps the character has, shown at their maximum
	let {
		row
	}: {
		row: Pick<
			AdminCharacterRow,
			'special' | 'flb' | 'ulb' | 'transcendence' | 'maxTranscendenceStage'
		>
	} = $props()
</script>

<div class="uncap-cell">
	<CharacterUncap record={{ special: row.special ?? false, uncap: row }} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.uncap-cell {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: 100%;
		padding: spacing.$unit-half;
	}
</style>
