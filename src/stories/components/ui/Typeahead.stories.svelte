<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import Typeahead from '$lib/components/ui/Typeahead.svelte'
	import { fn } from 'storybook/test'

	const { Story } = defineMeta({
		title: 'Components/UI/Typeahead',
		component: Typeahead,
		tags: ['autodocs'],
		argTypes: {
			searchable: {
				control: 'boolean',
				description: 'Enable search/filtering'
			},
			multiple: {
				control: 'boolean',
				description: 'Allow multiple selections'
			},
			creatable: {
				control: 'boolean',
				description: 'Allow creating new options'
			},
			clearable: {
				control: 'boolean',
				description: 'Show clear button'
			},
			disabled: {
				control: 'boolean',
				description: 'Disabled state'
			},
			size: {
				control: 'select',
				options: ['small', 'medium', 'large'],
				description: 'Component size'
			},
			contained: {
				control: 'boolean',
				description: 'Contained background style'
			},
			fullWidth: {
				control: 'boolean',
				description: 'Full width'
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

	const elementOptions = [
		{ value: 'wind', label: 'Wind' },
		{ value: 'fire', label: 'Fire' },
		{ value: 'water', label: 'Water' },
		{ value: 'earth', label: 'Earth' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	]

	const characterOptions = [
		{ value: 'narmaya', label: 'Narmaya', element: 'dark' },
		{ value: 'cagliostro', label: 'Cagliostro', element: 'earth' },
		{ value: 'zeta', label: 'Zeta', element: 'fire' },
		{ value: 'yurius', label: 'Yurius', element: 'wind' },
		{ value: 'lily', label: 'Lily', element: 'water' },
		{ value: 'lucio', label: 'Lucio', element: 'light' },
		{ value: 'olivia', label: 'Olivia', element: 'dark' },
		{ value: 'anila', label: 'Anila', element: 'fire' }
	]

	const tagOptions = [
		{ value: 'attack', label: 'Attack' },
		{ value: 'defense', label: 'Defense' },
		{ value: 'support', label: 'Support' },
		{ value: 'healing', label: 'Healing' },
		{ value: 'buffer', label: 'Buffer' },
		{ value: 'debuffer', label: 'Debuffer' }
	]
</script>

<!-- Default - args-only for autodocs -->
<Story name="Default" args={{ options: elementOptions, placeholder: 'Select element...' }} />

<!-- With Label -->
<Story
	name="With Label"
	args={{ options: elementOptions, label: 'Element', placeholder: 'Search elements...' }}
/>

<!-- Required Field -->
<Story
	name="Required Field"
	args={{ options: elementOptions, label: 'Primary Element', placeholder: 'Required', required: true }}
/>

<!-- With Error -->
<Story
	name="With Error"
	args={{ options: elementOptions, label: 'Element', error: 'Please select an element' }}
/>

<!-- Multiple Selection -->
<Story name="Multiple Selection" asChild>
	<div style="max-width: 400px;">
		<Typeahead options={tagOptions} multiple label="Tags" placeholder="Select tags..." />
	</div>
</Story>

<!-- Multiple with Max -->
<Story name="Multiple with Max" asChild>
	<div style="max-width: 400px;">
		<Typeahead
			options={characterOptions}
			multiple
			max={3}
			label="Select up to 3 characters"
			placeholder="Choose characters..."
		/>
	</div>
</Story>

<!-- Creatable -->
<Story name="Creatable" asChild>
	<div style="max-width: 300px;">
		<Typeahead
			options={tagOptions}
			creatable
			label="Tags (can create new)"
			placeholder="Type to add..."
		/>
	</div>
</Story>

<!-- All Sizes -->
<Story name="All Sizes" asChild>
	<div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px;">
		<Typeahead options={elementOptions} size="small" value="wind" label="Small" />
		<Typeahead options={elementOptions} size="medium" value="fire" label="Medium" />
		<Typeahead options={elementOptions} size="large" value="water" label="Large" />
	</div>
</Story>

<!-- Contained -->
<Story name="Contained" args={{ options: elementOptions, contained: true, placeholder: 'Contained style' }} />

<!-- Disabled -->
<Story name="Disabled" args={{ options: elementOptions, disabled: true, value: 'earth' }} />

<!-- Not Clearable -->
<Story
	name="Not Clearable"
	args={{ options: elementOptions, clearable: false, value: 'dark', label: 'Cannot clear' }}
/>

<!-- Character Search Example -->
<Story name="Character Search Example" asChild>
	<div style="max-width: 350px;">
		<Typeahead
			options={characterOptions}
			label="Search Character"
			placeholder="Type character name..."
			searchable
		/>
	</div>
</Story>

<!-- Full Width -->
<Story
	name="Full Width"
	args={{ options: elementOptions, label: 'Full Width Select', fullWidth: true, placeholder: 'Takes full width' }}
/>
