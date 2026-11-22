<script lang="ts">
	/**
	 * WonderBonusList - a Wonder's bonuses as label/value rows, each with the
	 * game's bonus icon where we have it: the summed level bonuses of a Seal
	 * or Yupei, or Symbolum's DMG Amplify.
	 */
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { bonusIcon, bonusLabel } from '$lib/features/wonders/labels'
	import { getWonderBonusIcon } from '$lib/utils/images/wonders'
	import type { WonderBonus } from '$lib/types/api/wonder'

	interface Props {
		bonuses: WonderBonus[]
	}

	let { bonuses }: Props = $props()
</script>

<div class="bonus-list">
	{#each bonuses as bonus (bonus.stat)}
		{@const line = bonusLabel(bonus)}
		{@const icon = bonusIcon(bonus.stat)}
		<DetailRow label={line.label} value={line.value}>
			{#snippet labelSlot()}
				<span class="bonus-label">
					{#if icon}
						<img class="bonus-icon" src={getWonderBonusIcon(icon)} alt="" width="24" height="24" />
					{/if}
					{line.label}
				</span>
			{/snippet}
		</DetailRow>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.bonus-list {
		display: flex;
		flex-direction: column;
	}

	.bonus-label {
		display: inline-flex;
		align-items: center;
		gap: $unit;
	}

	.bonus-icon {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}
</style>
