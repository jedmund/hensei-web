<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { JobSkill } from '$lib/types/api/entities'
	import { getSkillCategoryColor } from '$lib/utils/jobUtils'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { getElementTypeKey } from '$lib/utils/element'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'

	interface Props {
		skill?: JobSkill
		slot: number
		element?: number | undefined
		locked?: boolean
		editable?: boolean
		available?: boolean
		/** Whether the party uses Full Auto; per-skill FA state is hidden when it doesn't. */
		fullAuto?: boolean
		/** Whether this skill is used in Full Auto. Absent slot defaults to ON. */
		faOn?: boolean
		onclick?: () => void
		onRemove?: () => void
		onToggleFa?: (on: boolean) => void
	}

	let {
		skill,
		slot,
		element,
		locked = false,
		editable = false,
		available = true,
		fullAuto = false,
		faOn = true,
		onclick,
		onRemove,
		onToggleFa
	}: Props = $props()

	const categoryColor = $derived(skill ? getSkillCategoryColor(skill) : '')
	const skillIconUrl = $derived(skill ? getJobSkillIcon(skill) : '')
	const elementKey = $derived(getElementTypeKey(element))

	function handleToggleFa(checked: boolean) {
		// Guard against the Switch's mount-time callback firing a no-op write.
		if (checked !== faOn) onToggleFa?.(checked)
	}

	const isEditable = $derived(editable && !locked && available)
	const isUnavailable = $derived(!available)
	const isFilled = $derived(Boolean(skill))
	const allowsRemove = $derived(isFilled && isEditable && skill)
	// Viewers get no switches; a skill left out of Full Auto is faded with a badge instead.
	const showFaOff = $derived(fullAuto && isFilled && !editable && !faOn)
	const showFaSwitch = $derived(fullAuto && isFilled && editable)

	function handleClick() {
		if (isEditable && onclick) {
			onclick()
		}
	}

	function handleRemove() {
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
			{@render SlotBody()}
		</button>
		{#if showFaSwitch}
			{@render FaSwitch({ disabled: false })}
		{/if}
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
	<div class="slot-row">
		<div
			class="skill-slot"
			class:empty={!isFilled}
			class:locked
			class:unavailable={isUnavailable}
			style:--category-color={categoryColor}
		>
			{@render SlotBody()}
		</div>
		{#if showFaSwitch}
			<!-- A locked main skill can't be swapped, but its Full Auto use is still
			toggleable by the owner. -->
			{@render FaSwitch({ disabled: false })}
			<!-- Reserves the remove (X) button's column so the switches line up. -->
			<span class="remove-spacer" aria-hidden="true"></span>
		{/if}
	</div>
{/if}

{#snippet FaSwitch({ disabled }: { disabled: boolean })}
	<Tooltip content={m.full_auto_skill_toggle()}>
		<span class="fa-switch">
			<Switch
				size="small"
				element={elementKey}
				checked={faOn}
				{disabled}
				onCheckedChange={handleToggleFa}
			/>
		</span>
	</Tooltip>
{/snippet}

{#snippet SlotBody()}
	{#if isFilled}
		{@render SkillContent({ skill: skill!, skillIconUrl })}
	{:else if !isUnavailable}
		{@render EmptyState({ slot })}
	{:else}
		{@render UnavailableState()}
	{/if}
{/snippet}

{#snippet SkillContent({ skill, skillIconUrl }: { skill: JobSkill; skillIconUrl: string })}
	<div class="skill-content">
		{#if skillIconUrl}
			<img
				src={skillIconUrl}
				alt={localizedName(skill.name)}
				class="skill-icon"
				class:fa-off={showFaOff}
				loading="lazy"
			/>
		{/if}
		<div class="skill-info">
			<div class="skill-title">
				<span class="skill-name" class:fa-off={showFaOff}>{localizedName(skill.name)}</span>
				{#if locked}
					<Tooltip content="Main skill (locked)">
						<span class="lock-indicator">
							<Icon name="lock" size={14} class="lock-icon" />
						</span>
					</Tooltip>
				{/if}
			</div>
			{#if showFaOff}
				<span class="fa-off-badge">{m.battle_off()}</span>
			{/if}
		</div>
	</div>
{/snippet}

<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
{#snippet EmptyState({ slot }: { slot: number })}
	<div class="empty-content">
		{#if editable}
			<div class="placeholder-icon">
				<Icon name="plus" size={16} />
			</div>
			<span class="placeholder-text">{m.skill_slot_select()}</span>
		{:else}
			<div class="placeholder-icon readonly"></div>
			<span class="placeholder-text">{m.skill_slot_empty()}</span>
		{/if}
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

	.fa-switch {
		display: inline-flex;
		flex-shrink: 0;
		margin-left: $unit-half;
	}

	.skill-slot {
		position: relative;
		border: none;
		border-radius: $card-corner;
		background: var(--button-bound-bg);
		transition: all 0.2s ease;
		flex: 1;
		min-width: 0;
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
					background: white;
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

			&.fa-off {
				opacity: 0.4;
			}
		}

		.skill-info {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: $unit;

			.skill-title {
				display: flex;
				align-items: center;
				gap: $unit-half;
				min-width: 0;
			}

			.skill-name {
				font-size: typography.$font-body;
				font-weight: typography.$medium;
				color: var(--text-primary);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;

				&.fa-off {
					color: var(--text-tertiary);
				}
			}

			.fa-off-badge {
				flex-shrink: 0;
				padding: $unit-quarter $unit;
				border-radius: $item-corner;
				background: var(--button-contained-bg);
				color: var(--text-secondary);
				font-size: typography.$font-small;
				font-weight: typography.$bold;
				text-transform: uppercase;
				letter-spacing: 0.5px;
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
			background: var(--button-contained-bg);
			border: 1px solid transparent;
			border-radius: $unit-half;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			color: var(--text-tertiary);
			transition: all 0.15s ease;

			&.readonly {
				background: var(--card-bg-disabled);
			}
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

	// Matches the medium icon-only remove button footprint.
	.remove-spacer {
		flex-shrink: 0;
		width: calc($unit * 5.5);
	}

	// Block-level so it doesn't sit on the Tooltip span's text baseline.
	.lock-indicator {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	:global(.lock-icon.icon) {
		color: var(--text-tertiary) !important;
	}
</style>
