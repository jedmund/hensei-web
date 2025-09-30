<script lang="ts">
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillCategoryColor } from '$lib/utils/jobUtils'
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
	const skillIconUrl = $derived(skill?.slug ? `/images/job-skills/${skill.slug}.png` : '')

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
			on:click={handleClick}
			type="button"
		>
			{@render SlotBody({ locked: false })}
		</button>
		{#if allowsRemove}
			<Button
				variant="ghost"
				icon="close"
				on:click={handleRemove}
				aria-label="Remove skill"
				type="button"
				class="remove-button"
				iconOnly
			></Button>
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

{#snippet SlotBody({ locked })}
	{#if isFilled}
		{@render SkillContent({ skill: skill!, skillIconUrl, locked })}
	{:else if !isUnavailable}
		{@render EmptyState({ slot })}
	{:else}
		{@render UnavailableState()}
	{/if}
{/snippet}

{#snippet SkillContent({ skill, skillIconUrl, locked })}
	<div class="skill-content">
		{#if skillIconUrl}
			<img src={skillIconUrl} alt={skill.name.en} class="skill-icon" loading="lazy" />
		{/if}
		<div class="skill-info">
			<span class="skill-name">{skill.name.en}</span>
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

{#snippet EmptyState({ slot })}
	<div class="empty-content">
		<Icon name="plus" size={20} />
		<span>Slot {slot + 1}</span>
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
			border-style: dashed;
			background: var(--placeholder-bg);

			&.editable:hover {
				background: var(--button-contained-bg-hover);
				border-style: solid;
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
			gap: 2px;

			.skill-name {
				font-size: 14px;
				font-weight: 500;
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: $unit;
		color: var(--text-tertiary);
		height: 60px;

		span {
			font-size: 12px;
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
