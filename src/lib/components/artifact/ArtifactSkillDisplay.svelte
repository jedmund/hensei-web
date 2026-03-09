
<script lang="ts">
	/**
	 * ArtifactSkillDisplay - Read-only display of an artifact skill value
	 *
	 * Displays the calculated skill value with polarity sign.
	 * Highlights in element color when the base value is the maximum possible.
	 */
	import {
		calculateSkillDisplayValue,
		getSkillGroupForSlot,
		type ArtifactSkillInstance
	} from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		skill: ArtifactSkillInstance
		/** Skill slot number (1-4) for skill group lookup */
		skillSlot: number
		/** Element for max value highlighting */
		element?: ElementType
	}

	const { skill, skillSlot, element }: Props = $props()

	// Query skills to get the full skill definition
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Find the skill definition (must match both modifier and skill group)
	const skillDef = $derived.by(() => {
		const group = getSkillGroupForSlot(skillSlot)
		return skillsQuery.data?.find(
			(s) => s.modifier === skill.modifier && s.skillGroup === group
		)
	})

	const suffix = $derived(skillDef?.suffix?.en ?? '')
	const isNegative = $derived(skillDef?.polarity === 'negative')

	// Calculate displayed strength based on level (matches in-game display)
	const displayedStrength = $derived(
		calculateSkillDisplayValue(skill.strength, skillDef?.growth, skill.level)
	)

	// Check if this skill has the maximum base value
	const isMaxBaseValue = $derived.by(() => {
		if (!skillDef?.baseValues) return false
		// Filter out null/0 values and get the highest
		const validValues = skillDef.baseValues.filter((v): v is number => v !== null && v !== 0)
		if (validValues.length === 0) return false
		const maxValue = Math.max(...validValues)
		return skill.strength === maxValue
	})
</script>

<span
	class="skill-value"
	class:negative={isNegative}
	class:max-value={isMaxBaseValue}
	class:element-wind={isMaxBaseValue && element === 'wind'}
	class:element-fire={isMaxBaseValue && element === 'fire'}
	class:element-water={isMaxBaseValue && element === 'water'}
	class:element-earth={isMaxBaseValue && element === 'earth'}
	class:element-dark={isMaxBaseValue && element === 'dark'}
	class:element-light={isMaxBaseValue && element === 'light'}
>
	{isNegative ? '−' : '+'}{displayedStrength}{suffix}
</span>

<style lang="scss">
	@use '$src/themes/colors' as *;

	.skill-value {
		color: var(--text-primary);

		&.negative {
			color: $error;
		}

		&.element-wind {
			color: $wind-text-30;
		}
		&.element-fire {
			color: $fire-text-30;
		}
		&.element-water {
			color: $water-text-30;
		}
		&.element-earth {
			color: $earth-text-30;
		}
		&.element-dark {
			color: $dark-text-30;
		}
		&.element-light {
			color: $light-text-30;
		}
	}
</style>
