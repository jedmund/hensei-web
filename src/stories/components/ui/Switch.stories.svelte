<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/UI/Switch',
		component: Switch,
		tags: ['autodocs'],
		argTypes: {
			checked: {
				control: 'boolean',
				description: 'Whether the switch is checked'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large'],
				description: 'Switch size'
			},
			element: {
				control: 'select',
				options: [undefined, 'wind', 'fire', 'water', 'earth', 'dark', 'light'],
				description: 'Element color theme for checked state'
			},
			disabled: {
				control: 'boolean',
				description: 'Disabled state'
			},
			required: {
				control: 'boolean',
				description: 'Required field'
			},
			fullWidth: {
				control: 'boolean',
				description: 'Full width switch'
			}
		},
		args: {
			onCheckedChange: fn()
		}
	})
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ checked: false }} />

<!-- Checked -->
<Story name="Checked" args={{ checked: true }} />

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Small</span>
			<Switch size="small" />
			<Switch size="small" checked />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Medium</span>
			<Switch size="medium" />
			<Switch size="medium" checked />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Large</span>
			<Switch size="large" />
			<Switch size="large" checked />
		</div>
	</div>
</Story>

<!-- Element Colors -->
<Story name="Element Colors" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		{#each ['wind', 'fire', 'water', 'earth', 'dark', 'light'] as element}
			<div style="display: flex; align-items: center; gap: 12px;">
				<span style="width: 50px; font-size: 12px; color: #666;">{element}</span>
				<Switch {element} />
				<Switch {element} checked />
			</div>
		{/each}
	</div>
</Story>

<!-- Disabled States -->
<Story name="Disabled" asChild>
	<div style="display: flex; gap: 16px; align-items: center;">
		<Switch disabled />
		<Switch disabled checked />
	</div>
</Story>

<!-- With Labels -->
<Story name="With Labels" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
			<Switch />
			<span>Enable notifications</span>
		</label>
		<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
			<Switch checked />
			<span>Dark mode</span>
		</label>
		<label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
			<Switch size="small" />
			<span style="font-size: 14px;">Small switch with label</span>
		</label>
	</div>
</Story>

<!-- Settings Example -->
<Story name="Settings Example" asChild>
	<div
		style="display: flex; flex-direction: column; gap: 0; max-width: 300px; background: #f5f5f5; border-radius: 8px; padding: 4px 0;"
	>
		<div
			style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;"
		>
			<span>Push Notifications</span>
			<Switch size="small" checked />
		</div>
		<div
			style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;"
		>
			<span>Email Updates</span>
			<Switch size="small" />
		</div>
		<div
			style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;"
		>
			<span>Auto-save</span>
			<Switch size="small" checked />
		</div>
	</div>
</Story>
