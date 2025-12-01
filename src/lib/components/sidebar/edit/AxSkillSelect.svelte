<svelte:options runes={true} />

<script lang="ts">
	import type { SimpleAxSkill } from '$lib/types/api/entities'
	import {
		type AxSkill,
		NO_AX_SKILL,
		getAxSkillsForType,
		findPrimarySkill,
		findSecondarySkill
	} from '$lib/data/ax'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		/** The weapon's axType (1-3) */
		axType: number
		/** Current AX skills on the weapon */
		currentSkills?: SimpleAxSkill[]
		/** Called when skills change */
		onChange?: (skills: SimpleAxSkill[]) => void
	}

	let { axType, currentSkills, onChange }: Props = $props()

	// Get available primary skills for this axType
	const primarySkills = $derived(getAxSkillsForType(axType))

	// State for primary skill
	let primaryModifier = $state(currentSkills?.[0]?.modifier ?? -1)
	let primaryValue = $state(currentSkills?.[0]?.strength ?? 0)
	let primaryError = $state('')

	// State for secondary skill
	let secondaryModifier = $state(currentSkills?.[1]?.modifier ?? -1)
	let secondaryValue = $state(currentSkills?.[1]?.strength ?? 0)
	let secondaryError = $state('')

	// Get the selected primary skill
	const selectedPrimarySkill = $derived(findPrimarySkill(axType, primaryModifier))

	// Whether secondary skill selection should be shown
	// Hide if no primary skill selected, or if primary skill has no secondaries (like EXP/Rupie)
	const showSecondary = $derived(
		primaryModifier >= 0 &&
			selectedPrimarySkill?.secondary &&
			selectedPrimarySkill.secondary.length > 0
	)

	// Build primary skill options
	const primaryOptions = $derived.by(() => {
		const items: Array<{ value: number; label: string }> = [
			{ value: -1, label: NO_AX_SKILL.name.en }
		]

		for (const skill of primarySkills) {
			items.push({
				value: skill.id,
				label: skill.name.en
			})
		}

		return items
	})

	// Build secondary skill options based on selected primary
	const secondaryOptions = $derived.by(() => {
		const items: Array<{ value: number; label: string }> = [
			{ value: -1, label: NO_AX_SKILL.name.en }
		]

		if (selectedPrimarySkill?.secondary) {
			for (const skill of selectedPrimarySkill.secondary) {
				items.push({
					value: skill.id,
					label: skill.name.en
				})
			}
		}

		return items
	})

	// Get range string for input placeholder
	function getRangeString(skill: AxSkill | undefined): string {
		if (!skill) return ''
		return `${skill.minValue}~${skill.maxValue}${skill.suffix || ''}`
	}

	// Validate a value against a skill's constraints
	function validateValue(value: number, skill: AxSkill | undefined): string {
		if (!skill) return ''

		if (isNaN(value) || value <= 0) {
			return `Please enter a value for ${skill.name.en}`
		}

		if (value < skill.minValue) {
			return `${skill.name.en} must be at least ${skill.minValue}${skill.suffix || ''}`
		}

		if (value > skill.maxValue) {
			return `${skill.name.en} cannot exceed ${skill.maxValue}${skill.suffix || ''}`
		}

		if (!skill.fractional && value % 1 !== 0) {
			return `${skill.name.en} must be a whole number`
		}

		return ''
	}

	// Handle primary skill change
	function handlePrimaryChange(value: number | undefined) {
		const newValue = value ?? -1
		primaryModifier = newValue
		primaryValue = 0
		primaryError = ''

		// Reset secondary when primary changes
		secondaryModifier = -1
		secondaryValue = 0
		secondaryError = ''

		emitChange()
	}

	// Handle primary value change
	function handlePrimaryValueChange(event: Event) {
		const input = event.target as HTMLInputElement
		const value = parseFloat(input.value)
		primaryValue = value

		primaryError = validateValue(value, selectedPrimarySkill)
		emitChange()
	}

	// Handle secondary skill change
	function handleSecondaryChange(value: number | undefined) {
		const newValue = value ?? -1
		secondaryModifier = newValue
		secondaryValue = 0
		secondaryError = ''

		emitChange()
	}

	// Handle secondary value change
	function handleSecondaryValueChange(event: Event) {
		const input = event.target as HTMLInputElement
		const value = parseFloat(input.value)
		secondaryValue = value

		const secondarySkill = findSecondarySkill(selectedPrimarySkill!, secondaryModifier)
		secondaryError = validateValue(value, secondarySkill)
		emitChange()
	}

	// Emit change to parent
	function emitChange() {
		const skills: SimpleAxSkill[] = [
			{ modifier: primaryModifier, strength: primaryValue },
			{ modifier: secondaryModifier, strength: secondaryValue }
		]
		onChange?.(skills)
	}
</script>

<div class="ax-skill-select">
	<!-- Primary Skill -->
	<div class="skill-row">
		<div class="skill-fields">
			<div class="skill-select">
				<Select
					options={primaryOptions}
					value={primaryModifier}
					onValueChange={handlePrimaryChange}
					placeholder="Select skill"
					size="medium"
					fullWidth
					contained
				/>
			</div>

			{#if primaryModifier >= 0 && selectedPrimarySkill}
				<input
					type="number"
					class="skill-value"
					class:error={primaryError !== ''}
					min={selectedPrimarySkill.minValue}
					max={selectedPrimarySkill.maxValue}
					step={selectedPrimarySkill.fractional ? '0.5' : '1'}
					placeholder={getRangeString(selectedPrimarySkill)}
					value={primaryValue || ''}
					oninput={handlePrimaryValueChange}
				/>
			{/if}
		</div>

		{#if primaryError}
			<p class="error-text">{primaryError}</p>
		{/if}
	</div>

	<!-- Secondary Skill (only shown when primary has secondaries) -->
	{#if showSecondary}
		<div class="skill-row">
			<div class="skill-fields">
				<div class="skill-select">
					<Select
						options={secondaryOptions}
						value={secondaryModifier}
						onValueChange={handleSecondaryChange}
						placeholder="Select skill"
						size="medium"
						fullWidth
						contained
					/>
				</div>

				{#if secondaryModifier >= 0}
					{@const secondarySkill = findSecondarySkill(selectedPrimarySkill!, secondaryModifier)}
					{#if secondarySkill}
						<input
							type="number"
							class="skill-value"
							class:error={secondaryError !== ''}
							min={secondarySkill.minValue}
							max={secondarySkill.maxValue}
							step={secondarySkill.fractional ? '0.5' : '1'}
							placeholder={getRangeString(secondarySkill)}
							value={secondaryValue || ''}
							oninput={handleSecondaryValueChange}
						/>
					{/if}
				{/if}
			</div>

			{#if secondaryError}
				<p class="error-text">{secondaryError}</p>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.ax-skill-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.skill-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.skill-fields {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: center;
	}

	.skill-select {
		flex: 1;
		min-width: 0;
	}

	.skill-value {
		width: 90px;
		flex-shrink: 0;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--input-bg, colors.$grey-85);
		border: 1px solid var(--border-secondary);
		border-radius: layout.$item-corner-small;
		color: var(--text-primary);
		font-size: typography.$font-regular;
		text-align: center;

		&:focus {
			outline: none;
			border-color: var(--accent-primary);
		}

		&.error {
			border-color: colors.$error;
		}

		// Remove spin buttons
		-moz-appearance: textfield;
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	.error-text {
		margin: 0;
		font-size: typography.$font-small;
		color: colors.$error;
	}
</style>
