<script lang="ts">
	/**
	 * GuideEffectFilters - the guidebook search's target, stackable and tag
	 * filters. The tag filter shows only when the catalogue has tags.
	 */
	import * as m from '$lib/paraglide/messages'
	import Select from '$lib/components/ui/Select.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import type { GuideEffectTargetFilter } from './guidebook'
	import { targetLabel } from './labels'

	interface Props {
		target: GuideEffectTargetFilter
		stackableOnly: boolean
		tags: string[]
		/** The catalogue's wiki tags */
		tagOptions: { value: string; label: string }[]
	}

	let {
		target = $bindable(),
		stackableOnly = $bindable(),
		tags = $bindable(),
		tagOptions
	}: Props = $props()

	const TARGETS: GuideEffectTargetFilter[] = ['all', 'everyone', 'race', 'proficiency', 'character']
	const targetOptions = TARGETS.map((value) => ({ value, label: targetLabel(value) }))
</script>

<div class="filter-row">
	<div class="target">
		<span class="filter-label">{m.solomonis_web_guidebook_filter_target()}</span>
		<Select
			options={targetOptions}
			value={target}
			onValueChange={(v) => {
				target = v ?? 'all'
			}}
			size="small"
			contained
			fullWidth
		/>
	</div>
	<label class="stackable">
		<span class="filter-label">{m.solomonis_web_guidebook_filter_stackable()}</span>
		<Switch bind:checked={stackableOnly} size="small" />
	</label>
</div>

{#if tagOptions.length > 0}
	<div class="tags">
		<span class="filter-label">{m.solomonis_web_guidebook_filter_tags()}</span>
		<MultiSelect
			options={tagOptions}
			value={tags}
			onValueChange={(v) => {
				tags = v
			}}
			placeholder={m.solomonis_web_guidebook_filter_tags_any()}
			size="small"
			contained
			fullWidth
		/>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.filter-row {
		display: flex;
		align-items: flex-end;
		gap: $unit-2x;
	}

	.target,
	.tags {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.stackable {
		display: flex;
		align-items: center;
		gap: $unit;
		padding-bottom: $unit-half;
	}

	.filter-label {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}
</style>
