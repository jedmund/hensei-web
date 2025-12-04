<svelte:options runes={true} />

<script lang="ts">
	import DisclosureRow from '$lib/components/ui/DisclosureRow.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import type { ArtifactSkill, ArtifactSkillInstance } from '$lib/types/api/artifact'

	interface Props {
		/** Slot number (1-4) */
		slot: number
		/** Current skill configuration (null if not set) */
		skill: ArtifactSkillInstance | null
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
	const strengthOptions = $derived(() => {
		if (!currentSkillDef?.baseValues) return []
		return currentSkillDef.baseValues
			.map((v, i) => ({
				value: v ?? 0,
				label: `${v}${currentSkillDef.suffix?.en ?? ''}`
			}))
			.filter((opt) => opt.value !== 0)
	})

	// Build level options (1-5)
	const levelOptions = [
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 3, label: '3' },
		{ value: 4, label: '4' },
		{ value: 5, label: '5' }
	]

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
		<!-- Set: Show modifier name + value/level controls -->
		<div class="skill-row-set" class:disabled>
			<div class="skill-header">
				<div class="modifier-info">
					<span class="modifier-name">{modifierName}</span>
					{#if currentSkillDef?.polarity === 'negative'}
						<span class="polarity negative">−</span>
					{:else}
						<span class="polarity positive">+</span>
					{/if}
				</div>
				<button
					type="button"
					class="change-btn"
					onclick={onSelectModifier}
					{disabled}
				>
					Change
				</button>
			</div>
			<div class="skill-controls">
				<div class="control-group">
					<label class="control-label">Value</label>
					<Select
						value={skill.strength}
						options={strengthOptions()}
						size="small"
						contained
						onValueChange={(v) => v !== undefined && handleStrengthChange(v)}
						{disabled}
					/>
				</div>
				<div class="control-group">
					<label class="control-label">Level</label>
					<Select
						value={skill.level}
						options={levelOptions}
						size="small"
						contained
						onValueChange={(v) => v !== undefined && handleLevelChange(v)}
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
	@use '$src/themes/effects' as effects;

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

	.skill-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modifier-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.modifier-name {
		font-weight: typography.$medium;
		color: colors.$grey-20;
	}

	.polarity {
		font-size: typography.$font-small;
		font-weight: typography.$bold;
		padding: 2px 4px;
		border-radius: 4px;

		&.positive {
			background: colors.$wind-bg-20;
			color: colors.$wind-text-20;
		}

		&.negative {
			background: colors.$error--bg--light;
			color: colors.$error;
		}
	}

	.change-btn {
		font-size: typography.$font-small;
		color: colors.$blue;
		background: none;
		border: none;
		cursor: pointer;
		padding: spacing.$unit-fourth spacing.$unit-half;
		border-radius: layout.$item-corner;
		transition: background-color effects.$duration-quick ease;

		&:hover {
			background: colors.$grey-90;
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
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
		color: colors.$grey-50;
	}
</style>
