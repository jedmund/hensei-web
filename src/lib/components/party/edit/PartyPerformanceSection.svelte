<script lang="ts">
	/**
	 * PartyPerformanceSection - Clear time and button/chain/summon counts
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import ClearTimeInput from '$lib/components/party/edit/ClearTimeInput.svelte'
	import MetricField from '$lib/components/party/edit/MetricField.svelte'

	interface Props {
		clearTime: number | null
		buttonCount: number | null
		chainCount: number | null
		summonCount: number | null
	}

	let {
		clearTime = $bindable(),
		buttonCount = $bindable(),
		chainCount = $bindable(),
		summonCount = $bindable()
	}: Props = $props()
</script>

<DetailsSection title={m.section_performance()}>
	<DetailRow label={m.party_edit_clear_time()} compact>
		<ClearTimeInput bind:value={clearTime} contained />
	</DetailRow>
	<DetailRow label={m.party_edit_button_count()} compact>
		<MetricField bind:value={buttonCount} label="B" contained />
	</DetailRow>
	<DetailRow label={m.party_edit_chain_count()} compact>
		<MetricField bind:value={chainCount} label="C" contained />
	</DetailRow>
	<DetailRow label={m.party_edit_summon_count()} compact>
		<MetricField bind:value={summonCount} label="S" contained />
	</DetailRow>
</DetailsSection>
