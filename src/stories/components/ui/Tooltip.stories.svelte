<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/Tooltip',
		tags: ['autodocs']
	})
</script>

<!-- Default -->
<Story name="Default">
	<Tooltip content="This is a tooltip">
		<Button>Hover me</Button>
	</Tooltip>
</Story>

<!-- With Long Text -->
<Story name="Long Text">
	<Tooltip
		content="This is a longer tooltip message that contains more detailed information about the element."
	>
		<Button>Hover for details</Button>
	</Tooltip>
</Story>

<!-- Custom Delay -->
<Story name="Custom Delay">
	<div style="display: flex; gap: 16px;">
		<Tooltip content="Instant tooltip" delayDuration={0}>
			<Button variant="secondary">No delay</Button>
		</Tooltip>
		<Tooltip content="Default delay (200ms)">
			<Button variant="secondary">Default</Button>
		</Tooltip>
		<Tooltip content="Slow tooltip" delayDuration={500}>
			<Button variant="secondary">500ms delay</Button>
		</Tooltip>
	</div>
</Story>

<!-- Disabled -->
<Story name="Disabled">
	<div style="display: flex; gap: 16px;">
		<Tooltip content="This tooltip is visible" disabled={false}>
			<Button>Enabled</Button>
		</Tooltip>
		<Tooltip content="This tooltip won't show" disabled>
			<Button variant="secondary">Disabled</Button>
		</Tooltip>
	</div>
</Story>

<!-- On Different Elements -->
<Story name="On Different Elements">
	<div style="display: flex; gap: 24px; align-items: center;">
		<Tooltip content="Button tooltip">
			<Button size="small">Button</Button>
		</Tooltip>
		<Tooltip content="Text tooltip">
			<span style="text-decoration: underline; cursor: help;">Hover this text</span>
		</Tooltip>
		<Tooltip content="Icon tooltip">
			<span
				style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #f0f0f0; border-radius: 50%; cursor: pointer;"
				>?</span
			>
		</Tooltip>
	</div>
</Story>

<!-- Icon Button Example -->
<Story name="Icon Button Example">
	<div style="display: flex; gap: 8px;">
		<Tooltip content="Edit">
			<Button size="small" variant="secondary">Edit</Button>
		</Tooltip>
		<Tooltip content="Delete">
			<Button size="small" variant="secondary">Delete</Button>
		</Tooltip>
		<Tooltip content="Share">
			<Button size="small" variant="secondary">Share</Button>
		</Tooltip>
		<Tooltip content="Favorite">
			<Button size="small" variant="secondary">Fav</Button>
		</Tooltip>
	</div>
</Story>
