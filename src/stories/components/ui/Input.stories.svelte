<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Input from '$lib/components/ui/Input.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/Input',
		component: Input,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'contained', 'duration', 'number', 'range'],
				description: 'Input variant style'
			},
			contained: {
				control: 'boolean',
				description: 'Contained background style'
			},
			label: {
				control: 'text',
				description: 'Field label'
			},
			error: {
				control: 'text',
				description: 'Error message'
			},
			placeholder: {
				control: 'text',
				description: 'Placeholder text'
			},
			leftIcon: {
				control: 'text',
				description: 'Left icon name'
			},
			rightIcon: {
				control: 'text',
				description: 'Right icon name'
			},
			disabled: {
				control: 'boolean',
				description: 'Disabled state'
			},
			required: {
				control: 'boolean',
				description: 'Required field'
			},
			readonly: {
				control: 'boolean',
				description: 'Read-only field'
			},
			fullWidth: {
				control: 'boolean',
				description: 'Full width input'
			},
			maxLength: {
				control: 'number',
				description: 'Maximum character length'
			}
		}
	})
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ placeholder: 'Enter text...' }} />

<!-- With Label -->
<Story name="With Label" args={{ label: 'Username', placeholder: 'Enter username' }} />

<!-- Required Field -->
<Story name="Required Field" args={{ label: 'Email', placeholder: 'Enter email', required: true }} />

<!-- With Error -->
<Story
	name="With Error"
	args={{
		label: 'Password',
		type: 'password',
		error: 'Password must be at least 8 characters',
		value: 'abc'
	}}
/>

<!-- Contained Variant -->
<Story name="Contained" args={{ variant: 'contained', placeholder: 'Contained input' }} />

<!-- With Icons -->
<Story name="With Icons" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;">
		<Input leftIcon="search" placeholder="Search..." />
		<Input rightIcon="info" placeholder="With right icon" />
		<Input leftIcon="user" rightIcon="check" placeholder="Both icons" />
	</div>
</Story>

<!-- With Character Counter -->
<Story name="Character Counter" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;">
		<Input placeholder="Type something..." counter maxLength={100} label="With max length" />
		<Input placeholder="No max limit" counter label="Counter only" />
	</div>
</Story>

<!-- Number Input -->
<Story name="Number Input" asChild>
	<div style="display: flex; gap: 12px; align-items: center;">
		<span style="color: #666;">Quantity:</span>
		<Input variant="number" type="number" value="0" />
	</div>
</Story>

<!-- Range Input -->
<Story name="Range Input" asChild>
	<div style="display: flex; gap: 12px; align-items: center;">
		<span style="color: #666;">Level:</span>
		<Input variant="range" type="number" value="1" />
	</div>
</Story>

<!-- Disabled State -->
<Story name="Disabled" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;">
		<Input placeholder="Disabled input" disabled />
		<Input label="Disabled with label" placeholder="Cannot edit" disabled />
	</div>
</Story>

<!-- Read-only State -->
<Story
	name="Read-only"
	args={{ label: 'Read-only field', value: 'This cannot be changed', readonly: true }}
/>

<!-- Full Width -->
<Story
	name="Full Width"
	args={{ label: 'Full width input', placeholder: 'Takes full container width', fullWidth: true }}
/>

<!-- Password Input -->
<Story
	name="Password Input"
	args={{ type: 'password', label: 'Password', placeholder: 'Enter password' }}
/>

<!-- All Variants -->
<Story name="All Variants" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px;">
		<Input variant="default" placeholder="Default variant" label="Default" />
		<Input variant="contained" placeholder="Contained variant" label="Contained" />
		<div style="display: flex; gap: 12px; align-items: end;">
			<div>
				<span style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Number</span>
				<Input variant="number" type="number" value="42" />
			</div>
			<div>
				<span style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Range</span>
				<Input variant="range" type="number" value="100" />
			</div>
		</div>
	</div>
</Story>

<!-- Form Example -->
<Story name="Form Example" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px; max-width: 350px;">
		<Input label="Full Name" placeholder="John Doe" required />
		<Input label="Email" type="email" placeholder="john@example.com" required leftIcon="mail" />
		<Input label="Password" type="password" placeholder="Min 8 characters" required />
		<Input label="Bio" placeholder="Tell us about yourself..." counter maxLength={200} />
	</div>
</Story>
