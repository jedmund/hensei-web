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
		height: calc(100dvh - #{$unit-2x} - #{$unit-2x}); // 100dvh minus top and bottom insets
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
		z-index: $z-popover;
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

			// When scrollable, the content scrolls (with the browser's own
			// scrollbar) without carrying on into the page behind
			&.scrollable {
				overflow-y: auto;
				overflow-x: hidden;
				overscroll-behavior: contain;
				scroll-behavior: smooth;
			}
		}

		// Phones: a sheet docked to the bottom that slides up, like BottomSheet
		@media (max-width: 768px) {
			z-index: $z-modal;
			top: auto;
			right: 0;
			bottom: 0;
			left: 0;
			width: 100% !important;
			// Leaves 60px of the page at the top
			height: calc(100dvh - 60px);
			transform: translateY(100%);
			opacity: 1;

			&.open {
				transform: translateY(0);
			}

			.sidebar-content {
				border-radius: $page-corner $page-corner 0 0;
				padding-bottom: env(safe-area-inset-bottom, 0px);
			}
		}
	}
</style>
