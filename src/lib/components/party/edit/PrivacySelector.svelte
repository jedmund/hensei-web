<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import type { PartyVisibility } from '$lib/types/visibility'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		value: PartyVisibility
		element?: ElementType
		showLabel?: boolean
	}

	let { value = $bindable(), element, showLabel = true }: Props = $props()

	// SegmentedControl uses string values
	let stringValue = $derived(String(value))

	function handleValueChange(newValue: string) {
		value = Number(newValue) as PartyVisibility
	}

	const descriptions: Record<string, () => string> = {
		'1': () => m.visibility_public_description(),
		'2': () => m.visibility_unlisted_description(),
		'3': () => m.visibility_private_description()
	}

	const currentDescription = $derived(descriptions[stringValue]?.() ?? '')
</script>

<div class="privacy-selector">
	{#if showLabel}
		<span class="privacy-label">{m.visibility_label()}</span>
	{/if}
	<SegmentedControl
		value={stringValue}
		onValueChange={handleValueChange}
		variant="background"
		size="small"
		{element}
		grow
	>
		<Segment value="1">{m.visibility_public()}</Segment>
		<Segment value="2">{m.visibility_unlisted()}</Segment>
		<Segment value="3">{m.visibility_private()}</Segment>
	</SegmentedControl>
	<p class="privacy-description">{currentDescription}</p>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.privacy-selector {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.privacy-label {
		font-size: $font-name;
		font-weight: $medium;
		color: var(--text-primary);
		padding: 0 $unit;
	}

	.privacy-description {
		margin: 0;
		padding: 0 $unit;
		font-size: $font-small;
		color: var(--text-secondary);
		line-height: 1.4;
	}
</style>
