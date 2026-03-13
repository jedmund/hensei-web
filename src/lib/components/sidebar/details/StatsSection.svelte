<script lang="ts">
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		itemData: any
		gridUncapLevel: number | null
		gridTranscendence: number | null
	}

	let { itemData, gridUncapLevel, gridTranscendence }: Props = $props()
</script>

{#if itemData?.hp}
	<DetailsSection title={m.details_hp()}>
		<DetailRow label={m.details_base()} value={itemData.hp.minHp} />
		<DetailRow label={m.details_mlb()} value={itemData.hp.maxHp} />
		{#if itemData.uncap?.flb && itemData.hp.maxHpFlb}
			<DetailRow label={m.details_flb()} value={itemData.hp.maxHpFlb} />
		{/if}
		{#if itemData.uncap?.ulb && itemData.hp.maxHpUlb}
			<DetailRow label={m.details_ulb()} value={itemData.hp.maxHpUlb} />
		{/if}
		{#if gridTranscendence && gridTranscendence > 0}
			<DetailRow label={m.details_t5()} value={itemData.hp.maxHpXlb} />
		{/if}
	</DetailsSection>
{/if}

{#if itemData?.atk}
	<DetailsSection title={m.details_atk()}>
		<DetailRow label={m.details_base()} value={itemData.atk.minAtk} />
		<DetailRow label={m.details_mlb()} value={itemData.atk.maxAtk} />
		{#if itemData.uncap?.flb && itemData.atk.maxAtkFlb}
			<DetailRow label={m.details_flb()} value={itemData.atk.maxAtkFlb} />
		{/if}
		{#if itemData.uncap?.ulb && itemData.atk.maxAtkUlb}
			<DetailRow label={m.details_ulb()} value={itemData.atk.maxAtkUlb} />
		{/if}
		{#if gridTranscendence && gridTranscendence > 0}
			<DetailRow label={m.details_t5()} value={itemData.atk.maxAtkXlb} />
		{/if}
	</DetailsSection>
{/if}
