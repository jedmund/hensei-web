<script lang="ts">
	import type { JobSkill } from '$lib/types/api/entities'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		skill: JobSkill
		onClick?: () => void
		disabled?: boolean
		variant?: 'default' | 'current'
		onRemove?: () => void
	}

	let { skill, onClick, disabled = false, variant = 'default', onRemove }: Props = $props()

	function getSkillIcon(skill: JobSkill): string {
		return getJobSkillIcon(skill)
	}
</script>

<button
	class="skill-item"
	class:current={variant === 'current'}
	onclick={onClick}
	{disabled}
	aria-label={localizedName(skill.name)}
>
	<img src={getSkillIcon(skill)} alt={localizedName(skill.name)} class="skill-icon" loading="lazy" />

	<div class="skill-info">
		<span class="skill-name">{localizedName(skill.name)}</span>
	</div>

	{#if variant === 'current' && onRemove}
		<button class="remove-button" onclick={(e) => { e.stopPropagation(); onRemove?.(); }} aria-label="Remove skill">
			{m.action_remove()}
		</button>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.skill-item {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		background: var(--card-bg);
		border: none;
		border-radius: $card-corner;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;

		&:hover:not(:disabled) {
			background: var(--button-contained-bg-hover);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		// Current skill variant
		&.current {
			background: var(--primary-10);

			&:hover:not(:disabled) {
				background: var(--primary-20);
			}
		}

		.skill-icon {
			width: 40px;
			height: 40px;
			border-radius: $item-corner-small;
			flex-shrink: 0;
			object-fit: cover;
		}

		.skill-info {
			flex: 1;
			min-width: 0;

			.skill-name {
				font-size: $font-regular;
				font-weight: $medium;
				color: var(--text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.remove-button {
			padding: $unit-half $unit;
			background: transparent;
			border: 1px solid var(--border-medium);
			border-radius: $item-corner;
			font-size: $font-small;
			color: var(--text-secondary);
			cursor: pointer;
			transition: all 0.2s ease;
			flex-shrink: 0;

			&:hover {
				background: var(--button-ghost-bg-hover);
				border-color: var(--error-border);
				color: var(--error-text);
			}
		}
	}
</style>
