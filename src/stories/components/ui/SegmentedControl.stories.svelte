<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/SegmentedControl',
		tags: ['autodocs']
	})
</script>

<script>
	let viewValue = $state('grid')
	let twoOptValue = $state('on')
	let blendedValue = $state('all')
	let bgValue = $state('day')
	let elementValue = $state('wind')
	let gapValue = $state('first')
	let growValue = $state('characters')
	let tabValue = $state('characters')
	let disabledValue = $state('enabled')
</script>

<!-- Default -->
<Story name="Default">
	<SegmentedControl bind:value={viewValue}>
		<Segment value="grid">Grid</Segment>
		<Segment value="list">List</Segment>
		<Segment value="compact">Compact</Segment>
	</SegmentedControl>
</Story>

<!-- Two Options -->
<Story name="Two Options">
	<SegmentedControl bind:value={twoOptValue}>
		<Segment value="on">On</Segment>
		<Segment value="off">Off</Segment>
	</SegmentedControl>
</Story>

<!-- Blended Variant -->
<Story name="Blended Variant">
	<SegmentedControl variant="blended" bind:value={blendedValue}>
		<Segment value="all">All</Segment>
		<Segment value="active">Active</Segment>
		<Segment value="archived">Archived</Segment>
	</SegmentedControl>
</Story>

<!-- Background Variant -->
<Story name="Background Variant">
	<SegmentedControl variant="background" bind:value={bgValue}>
		<Segment value="day">Day</Segment>
		<Segment value="week">Week</Segment>
		<Segment value="month">Month</Segment>
	</SegmentedControl>
</Story>

<!-- Element Colors -->
<Story name="Element Colors">
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<SegmentedControl bind:value={elementValue} element="wind">
			<Segment value="wind">Wind</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
		<SegmentedControl element="fire" value="fire">
			<Segment value="fire">Fire</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
		<SegmentedControl element="water" value="water">
			<Segment value="water">Water</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
		<SegmentedControl element="earth" value="earth">
			<Segment value="earth">Earth</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
		<SegmentedControl element="dark" value="dark">
			<Segment value="dark">Dark</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
		<SegmentedControl element="light" value="light">
			<Segment value="light">Light</Segment>
			<Segment value="other">Other</Segment>
		</SegmentedControl>
	</div>
</Story>

<!-- With Gap -->
<Story name="With Gap">
	<SegmentedControl gap bind:value={gapValue}>
		<Segment value="first">First</Segment>
		<Segment value="second">Second</Segment>
		<Segment value="third">Third</Segment>
	</SegmentedControl>
</Story>

<!-- Grow to Fill -->
<Story name="Grow to Fill">
	<div style="width: 400px; border: 1px dashed #ccc; padding: 16px;">
		<SegmentedControl grow bind:value={growValue}>
			<Segment value="characters">Characters</Segment>
			<Segment value="weapons">Weapons</Segment>
			<Segment value="summons">Summons</Segment>
		</SegmentedControl>
	</div>
</Story>

<!-- Tab Example -->
<Story name="Tab Example">
	<div style="max-width: 500px;">
		<SegmentedControl bind:value={tabValue} grow>
			<Segment value="characters">Characters</Segment>
			<Segment value="weapons">Weapons</Segment>
			<Segment value="summons">Summons</Segment>
		</SegmentedControl>
		<div
			style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; min-height: 100px;"
		>
			{#if tabValue === 'characters'}
				<p>Character content goes here</p>
			{:else if tabValue === 'weapons'}
				<p>Weapon content goes here</p>
			{:else}
				<p>Summon content goes here</p>
			{/if}
		</div>
	</div>
</Story>

<!-- Disabled Segment -->
<Story name="Disabled Segment">
	<SegmentedControl bind:value={disabledValue}>
		<Segment value="enabled">Enabled</Segment>
		<Segment value="also-enabled">Also Enabled</Segment>
		<Segment value="disabled" disabled>Disabled</Segment>
	</SegmentedControl>
</Story>
