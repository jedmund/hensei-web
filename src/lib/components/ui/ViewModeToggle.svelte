
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
		/** Additional class name */
		class?: string
	}

	let { value = 'grid', onValueChange, element, class: className }: Props = $props()

	function handleModeChange(mode: ViewMode) {
		onValueChange?.(mode)
	}

	const containerClass = $derived(
		['view-mode-toggle', element, className].filter(Boolean).join(' ')
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
			<Icon name="grid" size={16} />
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
			<Icon name="list" size={16} />
		</button>
	</Tooltip>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.view-mode-toggle {
		display: inline-flex;
		gap: $unit-half;
		padding: $unit-half;
		background: var(--segmented-control-background-bg);
		border-radius: $full-corner;

		// Default colors (no element)
		--toggle-active-bg: var(--segmented-control-background-segment-bg-checked);
		--toggle-active-icon: var(--segmented-control-background-segment-text-checked);
		--toggle-hover-bg: var(--segmented-control-background-segment-bg-hover);
		--toggle-hover-icon: var(--segmented-control-background-segment-text-hover);

		// Element-specific colors
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
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-half $unit;
		border: 0.5px solid transparent;
		background: var(--segmented-control-background-segment-bg);
		border-radius: $full-corner;
		cursor: pointer;
		color: var(--segmented-control-background-segment-text);
		transition: all 0.15s ease-in-out;

		&:hover:not(.active) {
			background: var(--toggle-hover-bg);
			color: var(--toggle-hover-icon);
		}

		&:focus-visible {
			@include focus-ring;
		}

		&.active {
			background: var(--toggle-active-bg);
			color: var(--toggle-active-icon);
			border: 0.5px solid rgba(0, 0, 0, 0.12);
			box-shadow: var(--shadow-xs);
		}
	}
</style>
