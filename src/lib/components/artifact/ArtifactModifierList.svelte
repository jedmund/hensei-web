<svelte:options runes={true} />

<script lang="ts">
	import type { ArtifactSkill } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		/** Slot number (1-4) to get skills for */
		slot: number
		/** Currently selected modifier (for highlighting) */
		selectedModifier?: number
		/** Element for styling the selected state */
		element?: ElementType
		/** Handler when a modifier is selected */
		onSelect: (skill: ArtifactSkill) => void
	}

	const { slot, selectedModifier, element, onSelect }: Props = $props()

	// Query skills for this slot (filtered by group on the server)
	const skillsQuery = createQuery(() => artifactQueries.skillsForSlot(slot))

	// All skills for this slot
	const skills = $derived(skillsQuery.data ?? [])
</script>

<div class="modifier-list">
	{#if skillsQuery.isPending}
		<div class="loading-state">Loading skills...</div>
	{:else if skillsQuery.isError}
		<div class="error-state">Failed to load skills</div>
	{:else if skills.length === 0}
		<div class="empty-state">No skills available</div>
	{:else}
		<div class="skill-options">
			{#each skills as skill (skill.id)}
				<button
					type="button"
					class="modifier-option"
					class:selected={selectedModifier === skill.modifier}
					class:element-wind={element === 'wind'}
					class:element-fire={element === 'fire'}
					class:element-water={element === 'water'}
					class:element-earth={element === 'earth'}
					class:element-dark={element === 'dark'}
					class:element-light={element === 'light'}
					onclick={() => onSelect(skill)}
				>
					<span class="name">{skill.name.en}</span>
				</button>
			{/each}
		</div>
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
	.error-state,
	.empty-state {
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$grey-50;
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
		border: none;
		border-radius: layout.$item-corner;
		cursor: pointer;
		text-align: left;
		transition: background-color effects.$duration-quick ease;

		&:hover {
			background: colors.$grey-90;
		}

		&:active {
			background: colors.$grey-85;
		}

		&.selected {
			background: colors.$grey-85;

			.name {
				color: colors.$grey-20;
			}

			&.element-wind {
				background: colors.$wind-bg-20;
				.name { color: colors.$wind-text-20; }
			}
			&.element-fire {
				background: colors.$fire-bg-20;
				.name { color: colors.$fire-text-20; }
			}
			&.element-water {
				background: colors.$water-bg-20;
				.name { color: colors.$water-text-20; }
			}
			&.element-earth {
				background: colors.$earth-bg-20;
				.name { color: colors.$earth-text-20; }
			}
			&.element-dark {
				background: colors.$dark-bg-20;
				.name { color: colors.$dark-text-20; }
			}
			&.element-light {
				background: colors.$light-bg-20;
				.name { color: colors.$light-text-20; }
			}
		}

		.name {
			font-size: typography.$font-regular;
			font-weight: typography.$normal;
			color: colors.$grey-20;
		}
	}
</style>
