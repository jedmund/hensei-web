<svelte:options runes={true} />

<script lang="ts">
	/**
	 * ArtifactSkillDisplay - Read-only display of an artifact skill
	 */
	import type { ArtifactSkillInstance } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'

	interface Props {
		slot: number
		skill: ArtifactSkillInstance
	}

	const { slot, skill }: Props = $props()

	// Query skills to get the full skill definition
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Find the skill definition
	const skillDef = $derived(
		skillsQuery.data?.find((s) => s.modifier === skill.modifier)
	)

	const modifierName = $derived(skillDef?.name?.en ?? `Skill ${slot}`)
	const suffix = $derived(skillDef?.suffix?.en ?? '')
	const isNegative = $derived(skillDef?.polarity === 'negative')
</script>

<div class="skill-display">
	<div class="skill-header">
		<span class="slot">Skill {slot}</span>
		<span class="level">Lv.{skill.level}</span>
	</div>
	<div class="skill-info">
		<span class="modifier-name">{modifierName}</span>
		<span class="strength" class:negative={isNegative}>
			{isNegative ? '−' : '+'}{skill.strength}{suffix}
		</span>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/colors' as *;

	.skill-display {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
		padding: $unit;
		background: var(--input-bg);
		border-radius: $item-corner;
	}

	.skill-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slot {
		font-size: $font-tiny;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.level {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}

	.skill-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modifier-name {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.strength {
		font-size: $font-small;
		font-weight: $bold;
		color: $wind-text-20;

		&.negative {
			color: $error;
		}
	}
</style>
