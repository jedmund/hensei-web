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

<aside class="sidebar" class:open style:--sidebar-width={open ? SIDEBAR_WIDTH : '0'}>
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
		width: 0;
		overflow: hidden;
		transition: width $duration-slide ease-in-out;
		z-index: 50;

		&.open {
			width: var(--sidebar-width);
		}

		.sidebar-content {
			flex: 1;
			overflow-y: auto;
			overflow-x: hidden;
			padding: $unit-2x;

			// Smooth scrolling
			scroll-behavior: smooth;

			// Better scrollbar styling to match main content
			&::-webkit-scrollbar {
				width: 8px;
			}

			&::-webkit-scrollbar-track {
				background: var(--bg-secondary, #f1f1f1);
			}

			&::-webkit-scrollbar-thumb {
				background: var(--border-primary, #888);
				border-radius: 4px;

				&:hover {
					background: var(--text-secondary, #555);
				}
			}

			// Improve mobile scrolling performance
			@media (max-width: 768px) {
				-webkit-overflow-scrolling: touch;
			}
		}

		// Mobile styles - overlay approach
		@media (max-width: 768px) {
			z-index: 100;
			transform: translateX(100%);
			transition:
				transform $duration-slide ease-in-out,
				width 0s;
			width: 90vw !important;
			max-width: 400px;
			box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);

			&.open {
				transform: translateX(0);
			}
		}
	}
</style>
