
<script lang="ts">
	import DisclosureRow from '$lib/components/ui/DisclosureRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import {
		calculateSkillDisplayValue,
		type ArtifactSkill,
		type ArtifactSkillInstance
	} from '$lib/types/api/artifact'

	interface Props {
		/** Slot number (1-4) */
		slot: number
		/** Current skill configuration (null if not set) */
		skill: ArtifactSkillInstance | null
		/** All skills array (for calculating level constraints) */
		allSkills: (ArtifactSkillInstance | null)[]
		/** Artifact level (1-5) - determines total skill level budget */
		artifactLevel: number
		/** Available skills for this slot (from query) */
		availableSkills?: ArtifactSkill[]
		/** Handler to open modifier selection pane */
		onSelectModifier: () => void
		/** Handler when skill is updated */
		onUpdateSkill: (update: Partial<ArtifactSkillInstance>) => void
		/** Whether editing is disabled */
		disabled?: boolean
	}

	const {
		slot,
		skill,
		allSkills,
		artifactLevel,
		availableSkills = [],
		onSelectModifier,
		onUpdateSkill,
		disabled = false
	}: Props = $props()

	// Find the current skill definition
	const currentSkillDef = $derived(
		skill ? availableSkills.find((s) => s.modifier === skill.modifier) : null
	)

	// Get modifier name for display
	const modifierName = $derived(currentSkillDef?.name?.en ?? 'Unknown')

	// Build strength options from the skill's baseValues
	// Display values are calculated based on current level, but stored value is the base
	const strengthOptions = $derived(() => {
		if (!currentSkillDef?.baseValues) return []

		const growth = currentSkillDef.growth ?? 0
		const currentLevel = skill?.level ?? 1
		const suffix = currentSkillDef.suffix?.en ?? ''
		const sign = currentSkillDef.polarity === 'negative' ? '−' : '+'

		return currentSkillDef.baseValues
			.filter((v): v is number => v !== null && v !== 0)
			.map((baseValue) => {
				const displayValue = calculateSkillDisplayValue(baseValue, growth, currentLevel)
				return {
					value: baseValue, // Store the BASE value
					label: `${sign}${displayValue}${suffix}` // Show polarity + calculated value
				}
			})
	})

	// Calculate the maximum level this skill can have based on:
	// - Total budget: artifactLevel + 3
	// - Levels used by other skills
	// - Each skill must have at least level 1
	const levelOptions = $derived(() => {
		const totalBudget = artifactLevel + 3
		const currentSlotIndex = slot - 1

		// Sum levels of other skills (excluding this one)
		const otherSkillsLevelSum = allSkills.reduce((sum, s, i) => {
			if (i === currentSlotIndex || !s) return sum
			return sum + s.level
		}, 0)

		// Count skills that are set (excluding this one) - they each need at least level 1
		const otherSetSkillsCount = allSkills.filter((s, i) => i !== currentSlotIndex && s).length

		// Remaining budget for this skill
		// We need to reserve 1 level for each unset skill slot (since they'll need at least 1 when set)
		const unsetSlotsCount = allSkills.filter((s, i) => i !== currentSlotIndex && !s).length
		const reservedForUnset = unsetSlotsCount // Each unset slot will need at least 1 when filled

		const maxLevel = Math.min(5, totalBudget - otherSkillsLevelSum - reservedForUnset)
		const minLevel = 1

		const options: { value: number; label: string }[] = []
		for (let i = minLevel; i <= maxLevel; i++) {
			options.push({ value: i, label: String(i) })
		}
		return options
	})

	function handleStrengthChange(newStrength: number) {
		onUpdateSkill({ strength: newStrength })
	}

	function handleLevelChange(newLevel: number) {
		onUpdateSkill({ level: newLevel })
	}
</script>

<div class="skill-row">
	{#if !skill?.modifier}
		<!-- Unset: Show disclosure to select modifier -->
		<DisclosureRow
			label="Skill {slot}"
			sublabel="Tap to select"
			onclick={onSelectModifier}
			{disabled}
		/>
	{:else}
		<!-- Set: Show modifier name (clickable) + value/level controls -->
		<div class="skill-row-set" class:disabled>
			<DisclosureRow
				label={modifierName}
				onclick={onSelectModifier}
				{disabled}
			/>
			<div class="skill-controls">
				<div class="control-group">
					<label class="control-label">Level</label>
					<Select
						value={skill.level}
						options={levelOptions()}
						contained
						onValueChange={(v) => v !== undefined && handleLevelChange(v)}
						{disabled}
					/>
				</div>
				<div class="control-group">
					<label class="control-label">Value</label>
					<Select
						value={skill.strength}
						options={strengthOptions()}
						contained
						onValueChange={(v) => v !== undefined && handleStrengthChange(v)}
						{disabled}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.skill-row {
		// Minimal container for skill row
		display: contents;
	}

	.skill-row-set {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--input-bg);
		border-radius: layout.$item-corner;

		&.disabled {
			opacity: 0.6;
			pointer-events: none;
		}
	}

	.skill-controls {
		display: flex;
		gap: spacing.$unit-2x;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		flex: 1;
	}

	.control-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
