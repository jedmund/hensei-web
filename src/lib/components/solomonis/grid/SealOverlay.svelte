<script lang="ts">
	/**
	 * Seal state drawn over a weapon or summon image on a Solomonis party:
	 * a "Start" chip on fixed starting slots, a veil and lock on sealed items,
	 * a "?" on slots whose state isn't recorded, and the unseal priority of
	 * sealed slots as a centred badge. Rendered inside the unit's frame, and
	 * left out while the viewer has hidden the overlays (SealControls).
	 *
	 * For editors the lock is a button that marks the item sealed or
	 * unsealed (unsealed items show an open lock).
	 */
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import * as m from '$lib/paraglide/messages'
	import PriorityNumber from './PriorityNumber.svelte'
	import type { SlotSeal } from './seal'
	import { sealOverlays } from './sealOverlays.svelte'

	interface Props {
		seal: SlotSeal
		/** Whether the slot holds an item; empty slots only show the Start chip. */
		filled: boolean
		/** Marks the item sealed or unsealed; the lock is static without it. */
		onToggle?: (() => void) | undefined
	}

	let { seal, filled, onToggle }: Props = $props()

	const toggleLabel = $derived(
		seal.state === 'sealed'
			? m.solomonis_web_grid_mark_unsealed()
			: m.solomonis_web_grid_mark_sealed()
	)

	// The frame opens the item on click; the lock shouldn't
	function toggle(event: Event) {
		event.preventDefault()
		event.stopPropagation()
		onToggle?.()
	}
</script>

{#if !sealOverlays.hidden}
	<div class="seal-overlay" class:dimmed={seal.dimmed} data-seal-state={seal.state ?? 'unknown'}>
		{#if seal.starting}
			<Tooltip content={m.solomonis_web_grid_start_tooltip()}>
				<span class="chip start">{m.solomonis_web_grid_start()}</span>
			</Tooltip>
		{:else if filled && onToggle}
			<Tooltip content={toggleLabel}>
				<button
					type="button"
					class="chip icon-chip toggle"
					class:unknown={seal.state === null}
					aria-label={toggleLabel}
					onclick={toggle}
					onkeydown={(e) => e.stopPropagation()}
				>
					{#if seal.state === null}
						?
					{:else}
						<Icon name={seal.state === 'sealed' ? 'lock' : 'lock-open'} size={12} />
					{/if}
				</button>
			</Tooltip>
		{:else if filled && seal.state === 'sealed'}
			<span class="chip icon-chip" aria-label={m.solomonis_web_grid_sealed()}>
				<Icon name="lock" size={12} />
			</span>
		{:else if filled && seal.state === null}
			<Tooltip content={m.solomonis_web_grid_unknown_tooltip()}>
				<span class="chip unknown" aria-label={m.solomonis_web_grid_unknown()}>?</span>
			</Tooltip>
		{/if}

		{#if filled && seal.priority != null}
			<span class="priority">
				<PriorityNumber
					value={seal.priority}
					size="large"
					aria-label={m.solomonis_web_grid_priority_badge({ rank: String(seal.priority) })}
				/>
			</span>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.seal-overlay {
		position: absolute;
		inset: 0;
		z-index: effects.$z-sticky;
		pointer-events: none;
		border-radius: inherit;

		&.dimmed {
			background: color-mix(in srgb, var(--card-bg, #f5f5f5) 60%, transparent);
			filter: saturate(0.6);
		}
	}

	.chip {
		position: absolute;
		left: spacing.$unit-half;
		bottom: spacing.$unit-half;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		min-width: 20px;
		height: 20px;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$full-corner;
		background: var(--button-contained-bg, rgba(0, 0, 0, 0.6));
		color: var(--text-primary);
		font-size: typography.$font-tiny;
		font-weight: typography.$bold;
		line-height: 1;
		box-shadow: var(--shadow-sm);
		pointer-events: auto;
		box-sizing: border-box;
	}

	.toggle {
		border: none;
		font-family: inherit;
		cursor: pointer;

		&:hover {
			background: var(--button-contained-bg-hover, var(--button-contained-bg));
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 1px;
		}
	}

	.priority {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
	}
</style>
