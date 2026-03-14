<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillCategoryColor } from '$lib/utils/jobUtils'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		skill?: JobSkill
		slot: number
		locked?: boolean
		editable?: boolean
		available?: boolean
		onclick?: () => void
		onRemove?: () => void
	}

	let {
		skill,
		slot,
		locked = false,
		editable = false,
		available = true,
		onclick,
		onRemove
	}: Props = $props()

	const categoryColor = $derived(skill ? getSkillCategoryColor(skill) : '')
	const skillIconUrl = $derived(skill ? getJobSkillIcon(skill) : '')

	const isEditable = $derived(editable && !locked && available)
	const isUnavailable = $derived(!available)
	const isFilled = $derived(Boolean(skill))
	const allowsRemove = $derived(isFilled && isEditable && skill)

	function handleClick() {
		if (isEditable && onclick) {
			onclick()
		}
	}

	function handleRemove(event: Event) {
		event.stopPropagation()
		if (onRemove) {
			onRemove()
		}
	}
</script>

{#if isEditable}
	<div class="slot-row">
		<button
			class="skill-slot editable"
			class:empty={!isFilled}
			style:--category-color={categoryColor}
			onclick={handleClick}
			type="button"
		>
			{@render SlotBody({ locked: false })}
		</button>
		{#if allowsRemove}
			<Button
				variant="ghost"
				icon="close"
				onclick={handleRemove}
				aria-label="Remove skill"
				type="button"
				class="remove-button"
				iconOnly
			/>
		{/if}
	</div>
{:else}
	<div
		class="skill-slot"
		class:empty={!isFilled}
		class:locked
		class:unavailable={isUnavailable}
		style:--category-color={categoryColor}
	>
		{@render SlotBody({ locked })}
	</div>
{/if}

{#snippet SlotBody({ locked }: { locked: boolean })}
	{#if isFilled}
		{@render SkillContent({ skill: skill!, skillIconUrl, locked })}
	{:else if !isUnavailable}
		{@render EmptyState({ slot })}
	{:else}
		{@render UnavailableState()}
	{/if}
{/snippet}

{#snippet SkillContent({ skill, skillIconUrl, locked }: { skill: JobSkill; skillIconUrl: string; locked: boolean })}
	<div class="skill-content">
		{#if skillIconUrl}
			<img src={skillIconUrl} alt={localizedName(skill.name)} class="skill-icon" loading="lazy" />
		{/if}
		<div class="skill-info">
			<span class="skill-name">{localizedName(skill.name)}</span>
		</div>
		{#if locked}
			<Tooltip content="Main skill (locked)">
				{#snippet children()}
					<Icon name="lock" size={16} class="lock-icon" />
				{/snippet}
			</Tooltip>
		{/if}
	</div>
{/snippet}

{#snippet EmptyState({ slot }: { slot: number })}
	<div class="empty-content">
		<div class="placeholder-icon">
			<Icon name="plus" size={16} />
		</div>
		<span class="placeholder-text">{m.skill_slot_select()}</span>
	</div>
{/snippet}

{#snippet UnavailableState()}
	<div class="unavailable-content">
		<span>—</span>
	</div>
{/snippet}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as typography;

	.slot-row {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.skill-slot {
		position: relative;
		border: none;
		border-radius: $card-corner;
		background: var(--button-bound-bg);
		transition: all 0.2s ease;
		width: 100%;
		text-align: left;
		font: inherit;
		padding: 0;

		&.editable {
			cursor: pointer;

			&:hover {
				background: var(--button-contained-bg-hover);
				border-color: var(--border-medium);
			}
		}

		&.empty {
			background: transparent;

			&.editable:hover {
				background: var(--button-bg-hover);

				.placeholder-icon {
					border-color: var(--border-medium);
					box-shadow: var(--hover-shadow);
				}

				.placeholder-text {
					color: var(--text-tertiary-hover);
				}
			}
		}

		&.locked {
			background: var(--card-bg-locked);
			cursor: default;
			padding-right: calc($unit - 2px);

			&:hover {
				cursor: not-allowed;
			}
		}

		&.unavailable {
			background: var(--card-bg-disabled);
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.skill-content {
		display: flex;
		align-items: center;
		padding: $unit;
		gap: $unit;
		height: 100%;

		.skill-icon {
			width: 32px;
			height: 32px;
			border-radius: $unit-half;
			flex-shrink: 0;
			object-fit: cover;
		}

		.skill-info {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: $unit-fourth;

			.skill-name {
				font-size: typography.$font-body;
				font-weight: typography.$medium;
				color: var(--text-primary);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.skill-category {
				font-size: 11px;
				color: var(--text-secondary);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
		}
	}

	.empty-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: $unit;
		padding: $unit;
		height: 100%;

		.placeholder-icon {
			width: 32px;
			height: 32px;
			background: var(--card-bg);
			border: 1px solid transparent;
			border-radius: $unit-half;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			color: var(--icon-secondary);
			transition: all 0.15s ease;
		}

		.placeholder-text {
			font-size: typography.$font-body;
			color: var(--text-tertiary);
			transition: color 0.15s ease;
		}
	}

	.unavailable-content {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit;
		color: var(--text-tertiary);
		height: 60px;
		font-size: 18px;
	}

	:global(.lock-icon.icon) {
		color: var(--text-tertiary) !important;
	}
</style>
