<script lang="ts">
	/**
	 * RaidSectionTabs - Segmented control for raid sections
	 *
	 * Provides tabs for switching between Raids, Events, and Solo sections.
	 */
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import { RaidSection, getRaidSectionLabel } from '$lib/utils/raidSection'

	interface Props {
		value?: number
		onValueChange?: (section: number) => void
	}

	let { value = $bindable(RaidSection.Raid), onValueChange }: Props = $props()

	// Convert number to string for SegmentedControl
	let stringValue = $state(String(value))

	// Sync stringValue when external value changes
	$effect(() => {
		stringValue = String(value)
	})

	function handleChange(newValue: string) {
		const numValue = parseInt(newValue, 10)
		value = numValue
		onValueChange?.(numValue)
	}

	const sections = [
		{ value: RaidSection.Farming, label: getRaidSectionLabel(RaidSection.Farming) },
		{ value: RaidSection.Raid, label: getRaidSectionLabel(RaidSection.Raid) },
		{ value: RaidSection.Event, label: getRaidSectionLabel(RaidSection.Event) },
		{ value: RaidSection.Solo, label: getRaidSectionLabel(RaidSection.Solo) }
	]
</script>

<SegmentedControl bind:value={stringValue} onValueChange={handleChange} variant="background" size="small" grow>
	{#each sections as section (section.value)}
		<Segment value={String(section.value)}>{section.label}</Segment>
	{/each}
</SegmentedControl>
