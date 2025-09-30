<script lang="ts">
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillCategoryName } from '$lib/utils/jobUtils'

	interface Props {
		skill: JobSkill
		onClick?: () => void
		disabled?: boolean
		variant?: 'default' | 'current'
		onRemove?: () => void
	}

	let { skill, onClick, disabled = false, variant = 'default', onRemove }: Props = $props()

	function getSkillIcon(skill: JobSkill): string {
		if (skill.slug) {
			return `/images/job-skills/${skill.slug}.png`
		}
		// Fallback if no slug
		return '/images/job-skills/default.png'
	}

	function getSkillColorClass(skill: JobSkill): string {
		if (skill.main) return 'skill-main'
		if (skill.sub) return 'skill-sub'
		// Use category for additional classification
		if (skill.category === 2) return 'skill-emp'
		if (skill.category === 1) return 'skill-base'
		return ''
	}
</script>

<button
	class="skill-item {getSkillColorClass(skill)}"
	class:current={variant === 'current'}
	on:click={onClick}
	{disabled}
	aria-label="{skill.name.en} - {getSkillCategoryName(skill)} skill"
>
	<img src={getSkillIcon(skill)} alt={skill.name.en} class="skill-icon" loading="lazy" />

	<div class="skill-info">
		<span class="skill-name">{skill.name.en}</span>
		<span class="skill-category">
			{getSkillCategoryName(skill)}
		</span>
	</div>

	{#if variant === 'current' && onRemove}
		<button class="remove-button" on:click|stopPropagation={onRemove} aria-label="Remove skill">
			Remove
		</button>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.skill-item {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		background: var(--card-bg);
		border: 1px solid var(--border-subtle);
		border-radius: $item-corner;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
		position: relative;

		&:hover:not(:disabled) {
			background: var(--button-contained-bg-hover);
			border-color: var(--border-medium);
			transform: translateX(2px);
		}

		&:active:not(:disabled) {
			transform: translateX(1px);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		// Category color indicators
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			width: 3px;
			border-radius: $item-corner 0 0 $item-corner;
		}

		&.skill-main::before {
			background: var(--skill-main, #ff6b6b);
		}

		&.skill-sub::before {
			background: var(--skill-sub, #4ecdc4);
		}

		&.skill-emp::before {
			background: var(--skill-emp, #45b7d1);
		}

		&.skill-base::before {
			background: var(--skill-base, #96ceb4);
		}

		// Current skill variant
		&.current {
			background: var(--primary-10);
			border-color: var(--primary-50);

			&:hover:not(:disabled) {
				background: var(--primary-20);
			}
		}

		.skill-icon {
			width: 40px;
			height: 40px;
			border-radius: 4px;
			flex-shrink: 0;
			object-fit: cover;
		}

		.skill-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;

			.skill-name {
				font-size: 14px;
				font-weight: 500;
				color: var(--text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.skill-category {
				font-size: 11px;
				font-weight: 600;
				color: var(--text-secondary);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
		}

		.remove-button {
			padding: $unit-half $unit;
			background: transparent;
			border: 1px solid var(--border-medium);
			border-radius: $item-corner;
			font-size: 12px;
			color: var(--text-secondary);
			cursor: pointer;
			transition: all 0.2s ease;
			flex-shrink: 0;

			&:hover {
				background: var(--button-ghost-bg-hover);
				border-color: var(--error-border);
				color: var(--error-text);
			}

			&:active {
				transform: scale(0.98);
			}
		}
	}
</style>
