<svelte:options runes={true} />

<script lang="ts">
	import type { ArtifactSkill } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'

	interface Props {
		/** Slot number (1-4) to get skills for */
		slot: number
		/** Currently selected modifier (for highlighting) */
		selectedModifier?: number
		/** Handler when a modifier is selected */
		onSelect: (skill: ArtifactSkill) => void
	}

	const { slot, selectedModifier, onSelect }: Props = $props()

	// Query skills for this slot
	const skillsQuery = createQuery(() => artifactQueries.skillsForSlot(slot))

	// Separate positive and negative skills
	const positiveSkills = $derived(
		skillsQuery.data?.filter((s) => s.polarity === 'positive') ?? []
	)
	const negativeSkills = $derived(
		skillsQuery.data?.filter((s) => s.polarity === 'negative') ?? []
	)
</script>

<div class="modifier-list">
	{#if skillsQuery.isPending}
		<div class="loading-state">Loading skills...</div>
	{:else if skillsQuery.isError}
		<div class="error-state">Failed to load skills</div>
	{:else}
		{#if positiveSkills.length > 0}
			<div class="skill-group">
				<h4 class="group-header positive">Positive Effects</h4>
				<div class="skill-options">
					{#each positiveSkills as skill (skill.id)}
						<button
							type="button"
							class="modifier-option"
							class:selected={selectedModifier === skill.modifier}
							onclick={() => onSelect(skill)}
						>
							<span class="name">{skill.name.en}</span>
							<span class="polarity positive">+</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if negativeSkills.length > 0}
			<div class="skill-group">
				<h4 class="group-header negative">Negative Effects</h4>
				<div class="skill-options">
					{#each negativeSkills as skill (skill.id)}
						<button
							type="button"
							class="modifier-option"
							class:selected={selectedModifier === skill.modifier}
							onclick={() => onSelect(skill)}
						>
							<span class="name">{skill.name.en}</span>
							<span class="polarity negative">−</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.modifier-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit;
	}

	.loading-state,
	.error-state {
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$grey-50;
	}

	.skill-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.group-header {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		padding: 0 spacing.$unit-half;

		&.positive {
			color: colors.$wind-text-20;
		}

		&.negative {
			color: colors.$error;
		}
	}

	.skill-options {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.modifier-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: spacing.$unit;
		background: transparent;
		border: 1px solid transparent;
		border-radius: layout.$item-corner;
		cursor: pointer;
		text-align: left;
		transition:
			background-color effects.$duration-quick ease,
			border-color effects.$duration-quick ease;

		&:hover {
			background: colors.$grey-90;
		}

		&:active {
			background: colors.$grey-85;
		}

		&.selected {
			background: colors.$water-bg-20;
			border-color: colors.$blue;
		}

		.name {
			font-size: typography.$font-regular;
			font-weight: typography.$normal;
			color: colors.$grey-20;
		}

		.polarity {
			font-size: typography.$font-small;
			font-weight: typography.$bold;
			padding: 2px 6px;
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
	}
</style>
