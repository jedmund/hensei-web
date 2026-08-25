<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getCharacterMaxUncapLevel, normalizeCharacterUncap } from '$lib/utils/uncap'
	import { getElementLabel } from '$lib/utils/element'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic entity shape from API
		character: any
		editMode?: boolean
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData?: any
		// Callback when editData is modified (for triggering reactivity in parent)
		onDataChange?: () => void
	}

	let { character, editMode = false, editData = $bindable(), onDataChange }: Props = $props()

	const special = $derived(editMode ? editData.special : (character?.special ?? false))
	const uncap = $derived.by(() => {
		if (editMode) {
			return {
				flb: editData.flb,
				ulb: editData.ulb,
				transcendence: editData.transcendence,
				maxTranscendenceStage: editData.maxTranscendenceStage
			}
		}

		return normalizeCharacterUncap({ special, uncap: character?.uncap ?? { flb: false } })
	})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)
	const maxTranscendenceStage = $derived(uncap.maxTranscendenceStage ?? 0)
	const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
	const transcendenceStage = $derived(transcendence ? maxTranscendenceStage : 0)
	const stageOptions = [1, 2, 3, 4, 5].map((stage) => ({ value: stage, label: `Stage ${stage}` }))

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData.element : character?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Auto-check/uncheck uncap levels in hierarchy: Transcendence > FLB
	function handleFlbChange(checked: boolean) {
		if (!checked) {
			// Later uncaps require FLB.
			editData.ulb = false
			editData.transcendence = false
			editData.maxTranscendenceStage = 0
		}
		onDataChange?.()
	}

	function handleTranscendenceChange(checked: boolean) {
		if (checked) {
			// Checking Transcendence should also check FLB
			if (!editData.flb) editData.flb = true
		} else {
			editData.maxTranscendenceStage = 0
		}
		onDataChange?.()
	}

	function handleUlbChange(checked: boolean) {
		if (checked && !editData.flb) editData.flb = true
		onDataChange?.()
	}

	function handleSpecialChange(checked: boolean) {
		if (checked) {
			editData.transcendence = false
			editData.maxTranscendenceStage = 0
		} else {
			editData.ulb = false
		}
		onDataChange?.()
	}
</script>

<DetailsContainer title="Uncap">
	<DetailItem label="Uncap Level">
		<UncapIndicator
			type="character"
			{uncapLevel}
			{transcendenceStage}
			{flb}
			{ulb}
			{transcendence}
			{maxTranscendenceStage}
			{special}
			editable={false}
		/>
	</DetailItem>

	{#if !editMode}
		<DetailItem label="FLB" value={flb ? 'Yes' : 'No'} />
		{#if special}<DetailItem label="ULB" value={ulb ? 'Yes' : 'No'} />{/if}
		<DetailItem label="Transcendence" value={transcendence ? 'Yes' : 'No'} />
		{#if transcendence}
			<DetailItem label="Maximum Transcendence Stage" value={maxTranscendenceStage} />
		{/if}
		<DetailItem label="Special" value={special ? 'Yes' : 'No'} />
	{:else}
		<DetailItem
			label="FLB"
			bind:value={editData.flb}
			editable={true}
			type="checkbox"
			element={elementName}
			onchange={handleFlbChange}
		/>
		{#if special}
			<DetailItem
				label="ULB"
				bind:value={editData.ulb}
				editable={true}
				type="checkbox"
				element={elementName}
				onchange={handleUlbChange}
			/>
		{:else}
			<DetailItem
				label="Transcendence"
				bind:value={editData.transcendence}
				editable={true}
				type="checkbox"
				element={elementName}
				onchange={handleTranscendenceChange}
			/>
			{#if editData.transcendence}
				<DetailItem
					label="Maximum Transcendence Stage"
					bind:value={editData.maxTranscendenceStage}
					editable={true}
					type="select"
					options={stageOptions}
					placeholder="Select released stage"
				/>
			{/if}
		{/if}
		<div class="special-field">
			<DetailItem
				label="Special"
				bind:value={editData.special}
				editable={true}
				type="checkbox"
				element={elementName}
				onchange={handleSpecialChange}
			/>
			<p class="special-note">
				This is for Story SRs. Don't check this unless something really weird happens.
			</p>
		</div>
	{/if}
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.special-field {
		display: flex;
		flex-direction: column;
	}

	.special-note {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		padding-bottom: spacing.$unit;
	}
</style>
