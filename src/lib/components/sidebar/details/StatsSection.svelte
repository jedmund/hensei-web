<script lang="ts">
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'

	interface Props {
		itemData: any
		gridUncapLevel: number | null
		gridTranscendence: number | null
	}

	let { itemData, gridUncapLevel, gridTranscendence }: Props = $props()
</script>

{#if itemData?.hp}
	<DetailsSection title="HP">
		<DetailRow label="Base" value={itemData.hp.minHp} />
		<DetailRow label="MLB" value={itemData.hp.maxHp} />
		{#if itemData.uncap?.flb && itemData.hp.maxHpFlb}
			<DetailRow label="FLB" value={itemData.hp.maxHpFlb} />
		{/if}
		{#if itemData.uncap?.ulb && itemData.hp.maxHpUlb}
			<DetailRow label="ULB" value={itemData.hp.maxHpUlb} />
		{/if}
		{#if gridTranscendence && gridTranscendence > 0}
			<DetailRow label="T5" value={itemData.hp.maxHpXlb} />
		{/if}
	</DetailsSection>
{/if}

{#if itemData?.atk}
	<DetailsSection title="ATK">
		<DetailRow label="Base" value={itemData.atk.minAtk} />
		<DetailRow label="MLB" value={itemData.atk.maxAtk} />
		{#if itemData.uncap?.flb && itemData.atk.maxAtkFlb}
			<DetailRow label="FLB" value={itemData.atk.maxAtkFlb} />
		{/if}
		{#if itemData.uncap?.ulb && itemData.atk.maxAtkUlb}
			<DetailRow label="ULB" value={itemData.atk.maxAtkUlb} />
		{/if}
		{#if gridTranscendence && gridTranscendence > 0}
			<DetailRow label="T5" value={itemData.atk.maxAtkXlb} />
		{/if}
	</DetailsSection>
{/if}
