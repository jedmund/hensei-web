<svelte:options runes={true} />

<script lang="ts">
	import Icon from '../Icon.svelte'
	import Tooltip from './Tooltip.svelte'
	import type { ViewMode } from '$lib/stores/viewMode.svelte'

	interface Props {
		/** Current view mode */
		value?: ViewMode
		/** Callback when view mode changes */
		onValueChange?: (mode: ViewMode) => void
		/** Element color theme for active state */
		element?: string
		/** Use neutral gray styling instead of element colors */
		neutral?: boolean
		/** Additional class name */
		class?: string
	}

	let { value = 'grid', onValueChange, element, neutral = false, class: className }: Props = $props()

	function handleModeChange(mode: ViewMode) {
		onValueChange?.(mode)
	}

	const containerClass = $derived(
		['view-mode-toggle', neutral ? 'neutral' : element, className].filter(Boolean).join(' ')
	)
</script>

<div class={containerClass} role="group" aria-label="View mode">
	<Tooltip content="Grid view">
		<button
			type="button"
			class="toggle-btn"
			class:active={value === 'grid'}
			onclick={() => handleModeChange('grid')}
			aria-label="Grid view"
			aria-pressed={value === 'grid'}
		>
			<Icon name="grid" size={18} />
		</button>
	</Tooltip>
	<Tooltip content="List view">
		<button
			type="button"
			class="toggle-btn"
			class:active={value === 'list'}
			onclick={() => handleModeChange('list')}
			aria-label="List view"
			aria-pressed={value === 'list'}
		>
			<Icon name="list" size={18} />
		</button>
	</Tooltip>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.view-mode-toggle {
		display: flex;
		gap: $unit-fourth;
		padding: $unit-fourth;
		background: var(--segmented-control-blended-bg);
		border-radius: $item-corner;

		// Default colors (no element)
		--toggle-active-bg: var(--segmented-control-blended-segment-bg-checked);
		--toggle-active-icon: var(--segmented-control-blended-segment-text-checked);

		// Element-specific colors (match SegmentedControl)
		&.wind {
			--toggle-active-bg: var(--wind-nav-selected-bg);
			--toggle-active-icon: var(--wind-nav-selected-text);
		}

		&.fire {
			--toggle-active-bg: var(--fire-nav-selected-bg);
			--toggle-active-icon: var(--fire-nav-selected-text);
		}

		&.water {
			--toggle-active-bg: var(--water-nav-selected-bg);
			--toggle-active-icon: var(--water-nav-selected-text);
		}

		&.earth {
			--toggle-active-bg: var(--earth-nav-selected-bg);
			--toggle-active-icon: var(--earth-nav-selected-text);
		}

		&.dark {
			--toggle-active-bg: var(--dark-nav-selected-bg);
			--toggle-active-icon: var(--dark-nav-selected-text);
		}

		&.light {
			--toggle-active-bg: var(--light-nav-selected-bg);
			--toggle-active-icon: var(--light-nav-selected-text);
		}

		// Neutral gray styling (no element colors)
		&.neutral {
			--toggle-active-bg: var(--segmented-control-blended-segment-bg-checked);
			--toggle-active-icon: var(--segmented-control-blended-segment-text-checked);
		}
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-half;
		border: none;
		background: transparent;
		border-radius: $item-corner-small;
		cursor: pointer;
		color: var(--text-secondary);
		@include smooth-transition($duration-instant, all);

		&:hover:not(.active) {
			color: var(--text-tertiary);
			background: var(--button-bg-hover);
		}

		&:focus-visible {
			@include focus-ring;
		}

		&.active {
			background: var(--toggle-active-bg);
			color: var(--toggle-active-icon);
		}
	}
</style>
