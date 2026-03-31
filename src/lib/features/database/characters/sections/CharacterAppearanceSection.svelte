<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getElementLabel } from '$lib/utils/element'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity shape from API
		character: any
		editMode?: boolean
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData?: any
	}

	let { character, editMode = false, editData = $bindable() }: Props = $props()

	const genderVariants = $derived(
		editMode ? editData.gender_variants : (character?.genderVariants ?? false)
	)

	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData.element : character?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})
</script>

<DetailsContainer title="Appearance">
	{#if !editMode}
		<DetailItem
			label="Gender Variants"
			sublabel="Has separate Gran and Djeeta artwork"
			value={genderVariants ? 'Yes' : 'No'}
		/>
	{:else}
		<DetailItem
			label="Gender Variants"
			sublabel="Has separate Gran and Djeeta artwork"
			bind:value={editData.gender_variants}
			editable={true}
			type="checkbox"
			element={elementName}
		/>
	{/if}
</DetailsContainer>
