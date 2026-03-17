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
		context?: 'team' | 'playlist'
	}

	let { value = $bindable(), element, showLabel = true, context = 'team' }: Props = $props()

	// SegmentedControl uses string values
	let stringValue = $derived(String(value))

	function handleValueChange(newValue: string) {
		value = Number(newValue) as PartyVisibility
	}

	const contextLabel = $derived(context === 'playlist' ? m.visibility_context_playlist() : m.visibility_context_team())

	const descriptions: Record<string, () => string> = {
		'1': () => m.visibility_public_description({ context: contextLabel }),
		'2': () => m.visibility_unlisted_description({ context: contextLabel }),
		'3': () => m.visibility_private_description({ context: contextLabel })
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
	{#if context === 'playlist'}
		<p class="privacy-note">{m.visibility_playlist_note()}</p>
	{/if}
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

	.privacy-description,
	.privacy-note {
		margin: 0;
		padding: 0 $unit;
		font-size: $font-small;
		color: var(--text-secondary);
		line-height: 1.4;
	}
</style>
