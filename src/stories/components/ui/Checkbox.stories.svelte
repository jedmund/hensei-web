<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/UI/Checkbox',
		component: Checkbox,
		tags: ['autodocs'],
		argTypes: {
			checked: {
				control: 'boolean',
				description: 'Whether the checkbox is checked'
			},
			indeterminate: {
				control: 'boolean',
				description: 'Indeterminate state (partial selection)'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large'],
				description: 'Checkbox size'
			},
			variant: {
				control: 'select',
				options: ['default', 'bound'],
				description: 'Visual variant'
			},
			contained: {
				control: 'boolean',
				description: 'Contained background style (alias for variant=bound)'
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

<!-- Indeterminate -->
<Story name="Indeterminate" args={{ indeterminate: true }} />

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Small</span>
			<Checkbox size="small" />
			<Checkbox size="small" checked />
			<Checkbox size="small" indeterminate />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Medium</span>
			<Checkbox size="medium" />
			<Checkbox size="medium" checked />
			<Checkbox size="medium" indeterminate />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 60px; font-size: 12px; color: #666;">Large</span>
			<Checkbox size="large" />
			<Checkbox size="large" checked />
			<Checkbox size="large" indeterminate />
		</div>
	</div>
</Story>

<!-- Variants -->
<Story name="Variants" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Default</span>
			<Checkbox variant="default" />
			<Checkbox variant="default" checked />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Bound</span>
			<Checkbox variant="bound" />
			<Checkbox variant="bound" checked />
		</div>
		<div style="display: flex; align-items: center; gap: 12px;">
			<span style="width: 80px; font-size: 12px; color: #666;">Contained</span>
			<Checkbox contained />
			<Checkbox contained checked />
		</div>
	</div>
</Story>

<!-- Element Colors -->
<Story name="Element Colors" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px;">
		{#each ['wind', 'fire', 'water', 'earth', 'dark', 'light'] as element}
			<div style="display: flex; align-items: center; gap: 12px;">
				<span style="width: 50px; font-size: 12px; color: #666;">{element}</span>
				<Checkbox {element} />
				<Checkbox {element} checked />
				<Checkbox {element} indeterminate />
			</div>
		{/each}
	</div>
</Story>

<!-- Disabled States -->
<Story name="Disabled" asChild>
	<div style="display: flex; gap: 12px; align-items: center;">
		<Checkbox disabled />
		<Checkbox disabled checked />
		<Checkbox disabled indeterminate />
	</div>
</Story>

<!-- With Labels -->
<Story name="With Labels" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px;">
		<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
			<Checkbox />
			<span>Accept terms and conditions</span>
		</label>
		<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
			<Checkbox checked />
			<span>Subscribe to newsletter</span>
		</label>
		<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
			<Checkbox size="small" />
			<span style="font-size: 14px;">Small checkbox with label</span>
		</label>
	</div>
</Story>

<!-- Checklist Example -->
<Story name="Checklist Example" asChild>
	<div
		style="display: flex; flex-direction: column; gap: 0; max-width: 250px; background: #f5f5f5; border-radius: 8px; padding: 8px 0;"
	>
		<label
			style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer;"
		>
			<Checkbox checked />
			<span>Complete profile</span>
		</label>
		<label
			style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer;"
		>
			<Checkbox checked />
			<span>Verify email</span>
		</label>
		<label
			style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer;"
		>
			<Checkbox />
			<span>Add payment method</span>
		</label>
		<label
			style="display: flex; align-items: center; gap: 12px; padding: 8px 16px; cursor: pointer;"
		>
			<Checkbox />
			<span>Enable 2FA</span>
		</label>
	</div>
</Story>
