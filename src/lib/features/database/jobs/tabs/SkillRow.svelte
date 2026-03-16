
<script lang="ts">
	import { goto } from '$app/navigation'
	import type { JobSkill } from '$lib/types/api/entities'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import SkillTypeBadge from '$lib/components/database/SkillTypeBadge.svelte'
	import { DropdownMenu } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		skill: JobSkill
		canEdit?: boolean
		onDelete?: (skill: JobSkill) => void
	}

	let { skill, canEdit = false, onDelete }: Props = $props()
</script>

<div class="skill-item">
	<img src={getJobSkillIcon(skill)} alt={localizedName(skill.name)} class="skill-icon" />
	<div class="skill-info">
		<span class="skill-name">{localizedName(skill.name)}</span>
		{#if skill.name.ja}
			<span class="skill-name-jp">{skill.name.ja}</span>
		{/if}
	</div>
	<SkillTypeBadge {skill} />
	{#if canEdit}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="small"
						iconOnly
						icon="ellipsis"
						aria-label="Skill options"
					/>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class="skill-menu" side="bottom" align="end" sideOffset={4}>
					<DropdownMenu.Item class="skill-menu-item" onSelect={() => goto(localizeHref(`/database/job-skills/${skill.id}`))}>
						View skill
					</DropdownMenu.Item>
					<DropdownMenu.Item class="skill-menu-item" onSelect={() => goto(localizeHref(`/database/job-skills/${skill.id}/edit`))}>
						Edit skill
					</DropdownMenu.Item>
					<DropdownMenu.Item class="skill-menu-item danger" onSelect={() => onDelete?.(skill)}>
						Delete
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.skill-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--background);
		}
	}

	.skill-icon {
		width: 40px;
		height: 40px;
		border-radius: layout.$item-corner-small;
		object-fit: cover;
	}

	.skill-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		flex: 1;
		min-width: 0;
	}

	.skill-name {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.skill-name-jp {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	:global(.skill-menu) {
		background: var(--menu-bg);
		border: 1px solid var(--border-subtle);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-md);
		padding: spacing.$unit-half;
		min-width: calc(spacing.$unit * 16);
		z-index: effects.$z-modal;
	}

	:global(.skill-menu-item) {
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner-small;
		cursor: pointer;
		font-size: typography.$font-medium;
		color: var(--text-primary);
		outline: none;

		&:hover,
		&:focus {
			background: var(--button-contained-bg-hover);
		}

		&.danger {
			color: var(--danger);

			&:hover,
			&:focus {
				background: var(--danger-bg);
			}
		}
	}
</style>
