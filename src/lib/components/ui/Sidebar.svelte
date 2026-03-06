<svelte:options runes={true} />

<script lang="ts">
	import { SIDEBAR_WIDTH } from '$lib/stores/sidebar.svelte'
	import PaneStack from './PaneStack.svelte'
	import type { PaneStackStore } from '$lib/stores/paneStack.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Whether the sidebar is open */
		open?: boolean
		/** The pane stack to render */
		stack?: PaneStackStore
		/** Callback when close is requested */
		onClose?: () => void
		/** Legacy: Content to render in the sidebar (when not using pane stack) */
		children?: Snippet
	}

	const { open = false, stack, onClose, children }: Props = $props()
</script>

<aside class="sidebar" class:open style:--sidebar-width={SIDEBAR_WIDTH}>
	{#if stack && !stack.isEmpty}
		<PaneStack {stack} {onClose} />
	{:else if children}
		<div class="sidebar-content scrollable">
			{@render children()}
		</div>
	{/if}
</aside>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.sidebar {
		position: fixed;
		top: $unit-2x;
		right: $unit-2x;
		height: calc(100vh - #{$unit-2x} - #{$unit-2x}); // 100vh minus top and bottom insets
		box-sizing: border-box;
		// No background - individual panes have their own card styling
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		width: var(--sidebar-width);
		overflow: visible; // Allow panes to show stacking effect
		transform: translateX(calc(100% + #{$unit-2x}));
		opacity: 0;
		transition:
			transform $duration-slide ease-in-out,
			opacity $duration-slide ease-in-out;
		z-index: 50;
		// No shadow/border - individual panes have their own

		&.open {
			transform: translateX(0);
			opacity: 1;
		}

		.sidebar-content {
			flex: 1;
			overflow: hidden;
			display: flex;
			flex-direction: column;

			// Legacy content needs its own card styling
			background: var(--sidebar-bg);
			border-radius: $page-corner;
			box-shadow: $page-elevation;
			border: 1px solid rgba(0, 0, 0, 0.14);

			// When scrollable, enable scrolling with nice scrollbars
			&.scrollable {
				overflow-y: auto;
				overflow-x: hidden;

				// Smooth scrolling
				scroll-behavior: smooth;

				// Use overlay scrollbars that auto-hide
				overflow-y: overlay;

				// Thin, minimal scrollbar styling
				&::-webkit-scrollbar {
					width: 10px;
				}

				&::-webkit-scrollbar-track {
					background: transparent;
				}

				&::-webkit-scrollbar-thumb {
					background: rgba(0, 0, 0, 0.2);
					border-radius: 10px;
					border: 2px solid transparent;
					background-clip: padding-box;

					&:hover {
						background: rgba(0, 0, 0, 0.4);
						background-clip: padding-box;
					}
				}

				// Firefox scrollbar styling
				scrollbar-width: thin;
				scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

				// Improve mobile scrolling performance
				@media (max-width: 768px) {
					-webkit-overflow-scrolling: touch;
				}
			}
		}

		// Mobile styles - overlay approach
		@media (max-width: 768px) {
			z-index: 100;
			width: 90vw !important;
			max-width: 400px;
			box-shadow: var(--shadow-md);
			// Mobile already uses transform, no additional changes needed
		}
	}
</style>
