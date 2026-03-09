
<script lang="ts">
	import type { AugmentSkill, WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
	import { useWeaponStatModifiers } from '$lib/composables/useWeaponStatModifiers.svelte'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		/** Current AX skills on the weapon */
		currentSkills?: AugmentSkill[]
		/** Called when skills change */
		onChange?: (skills: AugmentSkill[]) => void
		/** Language for display */
		locale?: 'en' | 'ja'
	}

	let { currentSkills = [], onChange, locale = 'en' }: Props = $props()

	const { primaryAxSkills, secondaryAxSkills, findAxSkill, isLoading } = useWeaponStatModifiers()

	// State for primary skill
	let selectedPrimaryId = $state<string>(currentSkills[0]?.modifier?.id ?? '')
	let primaryStrength = $state<number>(currentSkills[0]?.strength ?? 0)

	// State for secondary skill
	let selectedSecondaryId = $state<string>(currentSkills[1]?.modifier?.id ?? '')
	let secondaryStrength = $state<number>(currentSkills[1]?.strength ?? 0)

	// Get selected modifiers
	const selectedPrimary = $derived(selectedPrimaryId ? findAxSkill(selectedPrimaryId) : undefined)
	const selectedSecondary = $derived(
		selectedSecondaryId ? findAxSkill(selectedSecondaryId) : undefined
	)

	// Whether secondary skill selection should be shown
	const showSecondary = $derived(!!selectedPrimary)

	// Build primary skill options
	const primaryOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [{ value: '', label: 'No skill' }]

		for (const skill of primaryAxSkills) {
			items.push({
				value: skill.id,
				label: locale === 'ja' ? skill.nameJp : skill.nameEn
			})
		}

		return items
	})

	// Build secondary skill options
	const secondaryOptions = $derived.by(() => {
		const items: Array<{ value: string; label: string }> = [{ value: '', label: 'No skill' }]

		for (const skill of secondaryAxSkills) {
			items.push({
				value: skill.id,
				label: locale === 'ja' ? skill.nameJp : skill.nameEn
			})
		}

		return items
	})

	// Get suffix for display
	function getSuffix(modifier: WeaponStatModifier | undefined): string {
		return modifier?.suffix ?? ''
	}

	// Handle primary skill change
	function handlePrimaryChange(value: string | undefined) {
		selectedPrimaryId = value ?? ''
		if (!value) {
			primaryStrength = 0
			// Reset secondary when primary is cleared
			selectedSecondaryId = ''
			secondaryStrength = 0
		}
		emitChange()
	}

	// Handle primary value change
	function handlePrimaryStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		primaryStrength = parseFloat(input.value) || 0
		emitChange()
	}

	// Handle secondary skill change
	function handleSecondaryChange(value: string | undefined) {
		selectedSecondaryId = value ?? ''
		if (!value) {
			secondaryStrength = 0
		}
		emitChange()
	}

	// Handle secondary value change
	function handleSecondaryStrengthChange(event: Event) {
		const input = event.target as HTMLInputElement
		secondaryStrength = parseFloat(input.value) || 0
		emitChange()
	}

	// Emit change to parent
	function emitChange() {
		const skills: AugmentSkill[] = []

		if (selectedPrimary && primaryStrength > 0) {
			skills.push({ modifier: selectedPrimary, strength: primaryStrength })
		}

		if (selectedSecondary && secondaryStrength > 0) {
			skills.push({ modifier: selectedSecondary, strength: secondaryStrength })
		}

		onChange?.(skills)
	}
</script>

{#if isLoading}
	<div class="ax-skill-select loading">
		<div class="skeleton"></div>
	</div>
{:else}
	<div class="ax-skill-select">
		<!-- Primary Skill -->
		<div class="skill-row">
			<div class="skill-fields">
				<div class="skill-select">
					<Select
						options={primaryOptions}
						value={selectedPrimaryId}
						onValueChange={handlePrimaryChange}
						placeholder="Select skill"
						size="medium"
						fullWidth
						contained
					/>
				</div>

				{#if selectedPrimary}
					<input
						type="number"
						class="skill-value"
						step="0.5"
						placeholder="Value"
						value={primaryStrength || ''}
						oninput={handlePrimaryStrengthChange}
					/>
					{#if getSuffix(selectedPrimary)}
						<span class="suffix">{getSuffix(selectedPrimary)}</span>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Secondary Skill -->
		{#if showSecondary}
			<div class="skill-row">
				<div class="skill-fields">
					<div class="skill-select">
						<Select
							options={secondaryOptions}
							value={selectedSecondaryId}
							onValueChange={handleSecondaryChange}
							placeholder="Select skill"
							size="medium"
							fullWidth
							contained
						/>
					</div>

					{#if selectedSecondary}
						<input
							type="number"
							class="skill-value"
							step="0.5"
							placeholder="Value"
							value={secondaryStrength || ''}
							oninput={handleSecondaryStrengthChange}
						/>
						{#if getSuffix(selectedSecondary)}
							<span class="suffix">{getSuffix(selectedSecondary)}</span>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.ax-skill-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		&.loading {
			min-height: 80px;
		}
	}

	.skeleton {
		height: 40px;
		background: var(--placeholder-bg);
		border-radius: layout.$item-corner-small;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
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
		width: 80px;
		flex-shrink: 0;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--input-bg);
		border: 1px solid var(--border-secondary);
		border-radius: layout.$item-corner-small;
		color: var(--text-primary);
		font-size: typography.$font-regular;
		text-align: center;

		&:focus {
			outline: none;
			border-color: var(--accent-primary);
		}

		// Remove spin buttons
		-moz-appearance: textfield;
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	.suffix {
		color: var(--text-secondary);
		font-size: typography.$font-small;
		flex-shrink: 0;
	}
</style>
