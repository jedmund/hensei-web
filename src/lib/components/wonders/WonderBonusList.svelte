<script lang="ts">
	/**
	 * WonderBonusList - a Wonder's bonuses as label/value rows: the summed
	 * level bonuses of a Seal or Yupei, or Symbolum's DMG Amplify.
	 */
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { bonusLabel } from '$lib/features/wonders/labels'
	import type { WonderBonus } from '$lib/types/api/wonder'

	interface Props {
		bonuses: WonderBonus[]
	}

	let { bonuses }: Props = $props()
</script>

<div class="bonus-list">
	{#each bonuses as bonus (bonus.stat)}
		{@const line = bonusLabel(bonus)}
		<DetailRow label={line.label} value={line.value} />
	{/each}
</div>

<style lang="scss">
	.bonus-list {
		display: flex;
		flex-direction: column;
	}
</style>
