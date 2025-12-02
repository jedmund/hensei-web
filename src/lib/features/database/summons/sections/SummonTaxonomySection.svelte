<svelte:options runes={true} />

<script lang="ts">
	import type { SummonSuggestions } from '$lib/api/adapters/entity.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import { getElementOptions } from '$lib/utils/element'

	interface Props {
		summon: any
		editMode?: boolean
		editData?: any
		// Suggestion support for batch import
		suggestions?: SummonSuggestions
		dismissedSuggestions?: Set<string>
		onAcceptSuggestion?: (field: string, value: any) => void
		onDismissSuggestion?: (field: string) => void
	}

	let {
		summon,
		editMode = false,
		editData = $bindable(),
		suggestions,
		dismissedSuggestions,
		onAcceptSuggestion,
		onDismissSuggestion
	}: Props = $props()

	const elementOptions = getElementOptions()
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<SuggestionDetailItem
			label="Element"
			bind:value={editData.element}
			editable={true}
			type="select"
			options={elementOptions}
			suggestion={suggestions?.element}
			dismissedSuggestion={dismissedSuggestions?.has('element')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('element', suggestions?.element)}
			onDismissSuggestion={() => onDismissSuggestion?.('element')}
		/>
		<DetailItem
			label="Series"
			bind:value={editData.series}
			editable={true}
			type="text"
			placeholder="Series name"
		/>
	{:else}
		<DetailItem label="Element">
			<ElementLabel element={summon.element} size="medium" />
		</DetailItem>
		<DetailItem label="Series" value={summon.series || '—'} />
	{/if}
</DetailsContainer>
