<svelte:options runes={true} />

<script lang="ts">
	import SidebarHeader from './SidebarHeader.svelte'
	import { SIDEBAR_WIDTH } from '$lib/stores/sidebar.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Whether the sidebar is open */
		open?: boolean
		/** Title for the sidebar header */
		title?: string
		/** Callback when close is requested */
		onclose?: () => void
		/** Content to render in the sidebar */
		children?: Snippet
		/** Optional header actions */
		headerActions?: Snippet
	}

	const { open = false, title, onclose, children, headerActions }: Props = $props()
</script>

<aside class="sidebar" class:open style:--sidebar-width={SIDEBAR_WIDTH}>
	{#if title}
		<SidebarHeader {title} {onclose} actions={headerActions} />
	{/if}

	<div class="sidebar-content">
		{#if children}
			{@render children()}
		{/if}
	</div>
</aside>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.sidebar {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		background: var(--bg-primary);
		border-left: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		width: var(--sidebar-width);
		overflow: hidden;
		transform: translateX(100%);
		opacity: 0;
		transition:
			transform $duration-slide ease-in-out,
			opacity $duration-slide ease-in-out;
		z-index: 50;

		&.open {
			transform: translateX(0);
			opacity: 1;
		}

		.sidebar-content {
			flex: 1;
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

		// Mobile styles - overlay approach
		@media (max-width: 768px) {
			z-index: 100;
			width: 90vw !important;
			max-width: 400px;
			box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
			// Mobile already uses transform, no additional changes needed
		}
	}
</style>
