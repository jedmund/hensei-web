<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Button from '$lib/components/ui/Button.svelte'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/UI/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['primary', 'secondary', 'ghost', 'text', 'destructive', 'notice', 'subtle'],
				description: 'Visual style variant'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large', 'icon'],
				description: 'Button size'
			},
			shape: {
				control: 'select',
				options: ['default', 'circular', 'pill'],
				description: 'Border radius shape'
			},
			element: {
				control: 'select',
				options: [undefined, 'wind', 'fire', 'water', 'earth', 'dark', 'light'],
				description: 'Element color theme'
			},
			elementStyle: {
				control: 'boolean',
				description: 'Apply element-specific button styling'
			},
			contained: {
				control: 'boolean',
				description: 'Contained background style'
			},
			disabled: {
				control: 'boolean',
				description: 'Disabled state'
			},
			fullWidth: {
				control: 'boolean',
				description: 'Full width button'
			},
			iconOnly: {
				control: 'boolean',
				description: 'Icon only mode (no text)'
			},
			active: {
				control: 'boolean',
				description: 'Active/pressed state'
			}
		},
		args: {
			onclick: fn()
		}
	})

	const variants = ['primary', 'secondary', 'ghost', 'text', 'destructive', 'notice', 'subtle']
	const sizes = ['small', 'medium', 'large']
	const elements = ['wind', 'fire', 'water', 'earth', 'dark', 'light']
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ variant: 'secondary' }}>
	{#snippet children()}Button{/snippet}
</Story>

<!-- All Variants -->
<Story name="All Variants" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		{#each variants as variant}
			<Button {variant}>{variant}</Button>
		{/each}
	</div>
</Story>

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		{#each sizes as size}
			<Button {size}>{size}</Button>
		{/each}
		<Button size="icon" icon="settings" iconOnly />
	</div>
</Story>

<!-- Disabled States -->
<Story name="Disabled States" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		{#each variants as variant}
			<Button {variant} disabled>{variant}</Button>
		{/each}
	</div>
</Story>

<!-- Shapes -->
<Story name="Shapes" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		<Button shape="default">Default</Button>
		<Button shape="pill">Pill</Button>
		<Button shape="circular" icon="plus" iconOnly />
	</div>
</Story>

<!-- With Icons -->
<Story name="With Icons" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		<Button icon="plus" iconPosition="left">Add Item</Button>
		<Button icon="arrow-right" iconPosition="right">Continue</Button>
		<Button icon="settings" iconOnly size="icon" />
	</div>
</Story>

<!-- Element Colors -->
<Story name="Element Colors" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div>
			<h4 style="margin: 0 0 8px; font-size: 14px; color: #666;">Without elementStyle</h4>
			<div style="display: flex; flex-wrap: wrap; gap: 12px;">
				{#each elements as element}
					<Button {element}>{element}</Button>
				{/each}
			</div>
		</div>
		<div>
			<h4 style="margin: 0 0 8px; font-size: 14px; color: #666;">With elementStyle</h4>
			<div style="display: flex; flex-wrap: wrap; gap: 12px;">
				{#each elements as element}
					<Button {element} elementStyle>{element}</Button>
				{/each}
			</div>
		</div>
	</div>
</Story>

<!-- Contained -->
<Story name="Contained" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		<Button contained>Contained</Button>
		<Button contained variant="primary">Primary Contained</Button>
	</div>
</Story>

<!-- Full Width -->
<Story name="Full Width" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;">
		<Button fullWidth>Full Width Button</Button>
		<Button fullWidth variant="primary">Primary Full Width</Button>
	</div>
</Story>

<!-- Size Variant Matrix -->
<Story name="Size Variant Matrix" asChild>
	<div style="display: grid; gap: 8px;">
		<div
			style="display: grid; grid-template-columns: 80px repeat({variants.length}, 1fr); gap: 8px; align-items: center;"
		>
			<span></span>
			{#each variants as variant}
				<span style="font-size: 12px; text-align: center; color: #666;">{variant}</span>
			{/each}
		</div>
		{#each sizes as size}
			<div
				style="display: grid; grid-template-columns: 80px repeat({variants.length}, 1fr); gap: 8px; align-items: center;"
			>
				<span style="font-size: 12px; color: #666;">{size}</span>
				{#each variants as variant}
					<Button {variant} {size}>{size}</Button>
				{/each}
			</div>
		{/each}
	</div>
</Story>

<!-- Active States -->
<Story name="Active States" asChild>
	<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
		<Button active>Active</Button>
		<Button active variant="primary">Active Primary</Button>
		<Button active variant="ghost">Active Ghost</Button>
	</div>
</Story>
