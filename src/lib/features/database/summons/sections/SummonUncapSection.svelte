
<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getSummonMaxUncapLevel } from '$lib/utils/uncap'
	import { getElementLabel } from '$lib/utils/element'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		summon: any
		editMode?: boolean
		editData?: any
		// Callback when editData is modified (for triggering reactivity in parent)
		onDataChange?: () => void
	}

	let {
		summon,
		editMode = false,
		editData = $bindable(),
		onDataChange
	}: Props = $props()

	const uncap = $derived(
		editMode
			? { flb: editData.flb, ulb: editData.ulb, transcendence: editData.transcendence }
			: (summon?.uncap ?? {})
	)
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const subaura = $derived(editMode ? editData.subaura : (summon?.subaura ?? false))
	const uncapLevel = $derived(getSummonMaxUncapLevel({ uncap }))
	const transcendenceStage = $derived(transcendence ? 5 : 0)

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData.element : summon?.element
		const label = getElementLabel(el)
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
	{#if summon?.uncap || editMode}
		<DetailItem label="Uncap">
			<UncapIndicator
				type="summon"
				{uncapLevel}
				{transcendenceStage}
				{flb}
				{ulb}
				{transcendence}
				editable={false}
			/>
		</DetailItem>
	{/if}

	{#if editMode}
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
			label="Subaura"
			bind:value={editData.subaura}
			editable={true}
			type="checkbox"
			element={elementName}
		/>
		<DetailItem
			label="Limit"
			bind:value={editData.limit}
			editable={true}
			type="checkbox"
			element={elementName}
		/>
	{/if}
</DetailsContainer>
