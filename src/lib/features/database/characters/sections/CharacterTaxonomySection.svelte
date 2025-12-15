<svelte:options runes={true} />

<script lang="ts">
	import type { CharacterSuggestions } from '$lib/api/adapters/entity.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { getElementOptions } from '$lib/utils/element'
	import { getRaceLabel, getRaceOptions } from '$lib/utils/race'
	import { getGenderLabel, getGenderOptions } from '$lib/utils/gender'
	import { getProficiencyOptions } from '$lib/utils/proficiency'

	interface Props {
		character: any
		editMode?: boolean
		editData?: any
		// Suggestion support for batch import
		suggestions?: CharacterSuggestions
		dismissedSuggestions?: Set<string>
		onAcceptSuggestion?: (field: string, value: any) => void
		onDismissSuggestion?: (field: string) => void
	}

	let {
		character,
		editMode = false,
		editData = $bindable(),
		suggestions,
		dismissedSuggestions,
		onAcceptSuggestion,
		onDismissSuggestion
	}: Props = $props()

	const elementOptions = getElementOptions()
	const raceOptions = getRaceOptions()
	const genderOptions = getGenderOptions()
	const proficiencyOptions = getProficiencyOptions()
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
		<SuggestionDetailItem
			label="Race 1"
			bind:value={editData.race1}
			editable={true}
			type="select"
			options={raceOptions}
			suggestion={suggestions?.race1}
			dismissedSuggestion={dismissedSuggestions?.has('race1')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('race1', suggestions?.race1)}
			onDismissSuggestion={() => onDismissSuggestion?.('race1')}
		/>
		<SuggestionDetailItem
			label="Race 2"
			bind:value={editData.race2}
			editable={true}
			type="select"
			options={raceOptions}
			suggestion={suggestions?.race2}
			dismissedSuggestion={dismissedSuggestions?.has('race2')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('race2', suggestions?.race2)}
			onDismissSuggestion={() => onDismissSuggestion?.('race2')}
		/>
		<SuggestionDetailItem
			label="Gender"
			bind:value={editData.gender}
			editable={true}
			type="select"
			options={genderOptions}
			suggestion={suggestions?.gender}
			dismissedSuggestion={dismissedSuggestions?.has('gender')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('gender', suggestions?.gender)}
			onDismissSuggestion={() => onDismissSuggestion?.('gender')}
		/>
		<SuggestionDetailItem
			label="Proficiency 1"
			bind:value={editData.proficiency1}
			editable={true}
			type="select"
			options={proficiencyOptions}
			suggestion={suggestions?.proficiency1}
			dismissedSuggestion={dismissedSuggestions?.has('proficiency1')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('proficiency1', suggestions?.proficiency1)}
			onDismissSuggestion={() => onDismissSuggestion?.('proficiency1')}
		/>
		<SuggestionDetailItem
			label="Proficiency 2"
			bind:value={editData.proficiency2}
			editable={true}
			type="select"
			options={proficiencyOptions}
			suggestion={suggestions?.proficiency2}
			dismissedSuggestion={dismissedSuggestions?.has('proficiency2')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('proficiency2', suggestions?.proficiency2)}
			onDismissSuggestion={() => onDismissSuggestion?.('proficiency2')}
		/>
	{:else}
		<DetailItem label="Element">
			<ElementLabel element={character.element} size="medium" />
		</DetailItem>
		<DetailItem label="Race 1" value={getRaceLabel(character.race?.[0])} />
		<DetailItem label="Race 2" value={getRaceLabel(character.race?.[1])} />
		<DetailItem label="Gender" value={getGenderLabel(character.gender)} />
		<DetailItem label="Proficiency 1">
			<ProficiencyLabel proficiency={character.proficiency?.[0] ?? 0} size="medium" />
		</DetailItem>
		<DetailItem label="Proficiency 2">
			<ProficiencyLabel proficiency={character.proficiency?.[1] ?? 0} size="medium" />
		</DetailItem>
	{/if}
</DetailsContainer>
