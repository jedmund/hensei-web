
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

<a href={localizeHref(`/database/job-skills/${skill.id}`)} class="skill-item">
	<img src={getJobSkillIcon(skill)} alt={localizedName(skill.name)} class="skill-icon" />
	<div class="skill-info">
		<span class="skill-name">{localizedName(skill.name)}</span>
		{#if skill.name.ja}
			<span class="skill-name-jp">{skill.name.ja}</span>
		{/if}
	</div>
	<SkillTypeBadge {skill} />
	{#if canEdit}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div onclick={(e) => e.preventDefault()}>
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
					<DropdownMenu.Content class="dropdown-menu" side="bottom" align="end" sideOffset={4}>
						<DropdownMenu.Item class="dropdown-menu-item" onSelect={() => goto(localizeHref(`/database/job-skills/${skill.id}`))}>
							View skill
						</DropdownMenu.Item>
						<DropdownMenu.Item class="dropdown-menu-item" onSelect={() => goto(localizeHref(`/database/job-skills/${skill.id}/edit`))}>
							Edit skill
						</DropdownMenu.Item>
						<DropdownMenu.Item class="dropdown-menu-item danger" onSelect={() => onDelete?.(skill)}>
							Delete
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	{/if}
</a>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.skill-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
		text-decoration: none;
		color: inherit;
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
</style>
