
<script lang="ts">
	import type { ArtifactSkill } from '$lib/types/api/artifact'
	import { createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import { localizedName } from '$lib/utils/locale'

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
					<span class="name">{localizedName(skill.name)}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
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
		color: var(--text-secondary);
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
			background: var(--background);
		}

		&:active {
			background: var(--unit-bg);
		}

		&.selected {
			background: var(--unit-bg);

			.name {
				color: var(--text-primary);
			}

			&.element-wind {
				background: var(--wind-nav-selected-bg);
				.name { color: var(--wind-nav-selected-text); }
			}
			&.element-fire {
				background: var(--fire-nav-selected-bg);
				.name { color: var(--fire-nav-selected-text); }
			}
			&.element-water {
				background: var(--water-nav-selected-bg);
				.name { color: var(--water-nav-selected-text); }
			}
			&.element-earth {
				background: var(--earth-nav-selected-bg);
				.name { color: var(--earth-nav-selected-text); }
			}
			&.element-dark {
				background: var(--dark-nav-selected-bg);
				.name { color: var(--dark-nav-selected-text); }
			}
			&.element-light {
				background: var(--light-nav-selected-bg);
				.name { color: var(--light-nav-selected-text); }
			}
		}

		.name {
			font-size: typography.$font-regular;
			font-weight: typography.$normal;
			color: var(--text-primary);
		}
	}
</style>
