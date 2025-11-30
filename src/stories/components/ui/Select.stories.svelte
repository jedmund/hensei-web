<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Select from '$lib/components/ui/Select.svelte'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/UI/Select',
		component: Select,
		tags: ['autodocs'],
		argTypes: {
			size: {
				control: 'select',
				options: ['small', 'medium', 'large'],
				description: 'Select size'
			},
			contained: {
				control: 'boolean',
				description: 'Contained background style'
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
				description: 'Full width select'
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
			}
		},
		args: {
			onValueChange: fn()
		}
	})

	const basicOptions = [
		{ value: 'wind', label: 'Wind' },
		{ value: 'fire', label: 'Fire' },
		{ value: 'water', label: 'Water' },
		{ value: 'earth', label: 'Earth' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	]

	const numberOptions = [
		{ value: 1, label: 'Level 1' },
		{ value: 2, label: 'Level 2' },
		{ value: 3, label: 'Level 3' },
		{ value: 4, label: 'Level 4' },
		{ value: 5, label: 'Level 5' }
	]

	const disabledOptions = [
		{ value: 'option1', label: 'Available Option' },
		{ value: 'option2', label: 'Also Available' },
		{ value: 'option3', label: 'Unavailable', disabled: true },
		{ value: 'option4', label: 'Another Available' }
	]
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ options: basicOptions, placeholder: 'Select element...' }} />

<!-- With Value -->
<Story name="With Value" args={{ options: basicOptions, value: 'fire' }} />

<!-- With Label -->
<Story
	name="With Label"
	args={{ options: basicOptions, label: 'Element', placeholder: 'Choose element' }}
/>

<!-- Required Field -->
<Story
	name="Required Field"
	args={{ options: basicOptions, label: 'Primary Element', placeholder: 'Required', required: true }}
/>

<!-- With Error -->
<Story
	name="With Error"
	args={{ options: basicOptions, label: 'Element', error: 'Please select an element' }}
/>

<!-- Contained Variant -->
<Story name="Contained" args={{ options: basicOptions, contained: true, placeholder: 'Contained select' }} />

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; flex-direction: column; gap: 12px; max-width: 200px;">
		<Select options={basicOptions} size="small" value="wind" />
		<Select options={basicOptions} size="medium" value="fire" />
		<Select options={basicOptions} size="large" value="water" />
	</div>
</Story>

<!-- Size Comparison -->
<Story name="Size Comparison" asChild>
	<div style="display: flex; gap: 12px; align-items: start; flex-wrap: wrap;">
		<div>
			<span style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Small</span>
			<Select options={basicOptions} size="small" value="wind" />
		</div>
		<div>
			<span style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Medium</span>
			<Select options={basicOptions} size="medium" value="fire" />
		</div>
		<div>
			<span style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Large</span>
			<Select options={basicOptions} size="large" value="water" />
		</div>
	</div>
</Story>

<!-- With Number Values -->
<Story name="Number Values" args={{ options: numberOptions, label: 'Select Level', value: 3 }} />

<!-- Disabled Options -->
<Story
	name="Disabled Options"
	args={{ options: disabledOptions, label: 'Select Option', placeholder: 'Some options disabled' }}
/>

<!-- Disabled State -->
<Story name="Disabled State" args={{ options: basicOptions, disabled: true, value: 'earth' }} />

<!-- Full Width -->
<Story
	name="Full Width"
	args={{ options: basicOptions, label: 'Full Width Select', fullWidth: true, placeholder: 'Takes full width' }}
/>

<!-- Form Example -->
<Story name="Form Example" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px;">
		<Select options={basicOptions} label="Main Element" placeholder="Select..." required />
		<Select options={basicOptions} label="Secondary Element" placeholder="Optional" />
		<Select options={numberOptions} label="Skill Level" value={1} />
	</div>
</Story>
