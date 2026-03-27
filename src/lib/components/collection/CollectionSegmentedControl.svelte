<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import type { CollectionCounts } from '$lib/types/api/collection'

	interface Props {
		activeEntityType: string
		onValueChange: (value: string) => void
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
		counts?: CollectionCounts
	}

	let { activeEntityType, onValueChange, element, counts }: Props = $props()

	function formatLabel(label: string, count?: number) {
		return count != null ? `${label} (${count})` : label
	}

	const selectOptions = $derived([
		{
			value: 'characters',
			label: formatLabel(m.collection_tab_characters(), counts?.characters)
		},
		{ value: 'weapons', label: formatLabel(m.collection_tab_weapons(), counts?.weapons) },
		{ value: 'summons', label: formatLabel(m.collection_tab_summons(), counts?.summons) },
		{
			value: 'artifacts',
			label: formatLabel(m.collection_tab_artifacts(), counts?.artifacts)
		}
	])
</script>

<div class="segmented-desktop">
	<SegmentedControl
		value={activeEntityType}
		{onValueChange}
		variant="blended"
		size="small"
		{element}
	>
		<Segment value="characters">
			{m.collection_tab_characters()}
			{#if counts?.characters != null}
				<span class="count">{counts.characters}</span>
			{/if}
		</Segment>
		<Segment value="weapons">
			{m.collection_tab_weapons()}
			{#if counts?.weapons != null}
				<span class="count">{counts.weapons}</span>
			{/if}
		</Segment>
		<Segment value="summons">
			{m.collection_tab_summons()}
			{#if counts?.summons != null}
				<span class="count">{counts.summons}</span>
			{/if}
		</Segment>
		<Segment value="artifacts">
			{m.collection_tab_artifacts()}
			{#if counts?.artifacts != null}
				<span class="count">{counts.artifacts}</span>
			{/if}
		</Segment>
	</SegmentedControl>
</div>

<div class="select-mobile">
	<Select
		options={selectOptions}
		value={activeEntityType}
		onValueChange={(v) => v && onValueChange(v)}
		size="small"
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.count {
		margin-left: $unit-half;
		color: inherit;
		opacity: 0.7;
	}

	.select-mobile {
		display: none;
	}

	@media (max-width: 600px) {
		.segmented-desktop {
			display: none;
		}

		.select-mobile {
			display: block;
		}
	}
</style>
