<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import { fn } from 'storybook/test'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'

	const { Story } = defineMeta({
		title: 'Components/UI/CharacterTypeahead',
		component: CharacterTypeahead,
		tags: ['autodocs'],
		args: {
			onValueChange: fn()
		}
	})

	const selectedCharacter = {
		id: 'character-narmaya-summer',
		granblueId: '3040169000',
		label: 'Narmaya',
		element: 3,
		season: 4,
		series: [
			{
				id: 'series-grand',
				slug: 'grand',
				name: { en: 'Grand', ja: 'リミテッド' }
			}
		]
	}
</script>

<Story
	name="Empty"
	args={{
		placeholder: 'Search for character...',
		contained: true
	}}
/>

<Story
	name="Selected Recruit"
	args={{
		value: selectedCharacter.granblueId,
		initialCharacter: selectedCharacter,
		contained: true
	}}
/>
