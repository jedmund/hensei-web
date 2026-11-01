<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getElementLabel } from '$lib/utils/element'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
		// Callback when editData is modified (for triggering reactivity in parent)
		onDataChange?: () => void
	}

	let { editData = $bindable(), onDataChange }: Props = $props()

	const flb = $derived(editData.flb ?? false)
	const ulb = $derived(editData.ulb ?? false)
	const transcendence = $derived(editData.transcendence ?? false)
	// Weapons: 3 base stars, +1 for FLB (4), +1 for ULB (5), +1 for transcendence (6)
	const uncapLevel = $derived(transcendence ? 6 : ulb ? 5 : flb ? 4 : 3)
	const transcendenceStage = $derived(transcendence ? 5 : 0)

	// Extra prerequisite options for dropdown
	const extraPrerequisiteOptions = [
		{ value: '', label: 'None' },
		{ value: 3, label: 'MLB' },
		{ value: 4, label: 'FLB' },
		{ value: 5, label: 'ULB' },
		{ value: 6, label: 'Transcendence' }
	]

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const label = getElementLabel(editData.element)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Auto-check/uncheck uncap levels in hierarchy: Transcendence > ULB > FLB
	function handleFlbChange(checked: boolean) {
		if (!checked) {
			// Unchecking FLB should also uncheck ULB and Transcendence
			editData.ulb = false
			editData.transcendence = false
		}
		onDataChange?.()
	}

	function handleUlbChange(checked: boolean) {
		if (checked && !editData.flb) {
			// Checking ULB should also check FLB
			editData.flb = true
		} else if (!checked) {
			// Unchecking ULB should also uncheck Transcendence
			editData.transcendence = false
		}
		onDataChange?.()
	}

	function handleTranscendenceChange(checked: boolean) {
		if (checked) {
			// Checking Transcendence should also check ULB and FLB
			if (!editData.ulb) editData.ulb = true
			if (!editData.flb) editData.flb = true
		}
		onDataChange?.()
	}
</script>

<DetailsContainer title="Uncap">
	<DetailItem label="Uncap">
		<UncapIndicator
			type="weapon"
			{uncapLevel}
			{transcendenceStage}
			{flb}
			{ulb}
			{transcendence}
			editable={false}
		/>
	</DetailItem>

	<DetailItem
		label="FLB"
		bind:value={editData.flb}
		editable={true}
		type="checkbox"
		element={elementName}
		onchange={handleFlbChange}
	/>
	<DetailItem
		label="ULB"
		bind:value={editData.ulb}
		editable={true}
		type="checkbox"
		element={elementName}
		onchange={handleUlbChange}
	/>
	<DetailItem
		label="Transcendence"
		bind:value={editData.transcendence}
		editable={true}
		type="checkbox"
		element={elementName}
		onchange={handleTranscendenceChange}
	/>
	<DetailItem
		label="Extra Prerequisite"
		sublabel="Min uncap for Additional Weapons"
		bind:value={editData.extraPrerequisite}
		editable={true}
		type="select"
		options={extraPrerequisiteOptions}
	/>
</DetailsContainer>
