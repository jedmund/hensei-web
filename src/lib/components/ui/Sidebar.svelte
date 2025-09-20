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

	const {
		open = false,
		title,
		onclose,
		children,
		headerActions
	}: Props = $props()
</script>

<aside
	class="sidebar"
	class:open
	style:--sidebar-width={open ? SIDEBAR_WIDTH : '0'}
>
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
		height: 100vh;
		background: var(--bg-primary);
		border-left: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		width: 0;
		overflow: hidden;
		transition: width $duration-slide ease-in-out;

		&.open {
			width: var(--sidebar-width);
		}

		.sidebar-content {
			flex: 1;
			overflow-y: auto;
			padding: $unit-2x;
		}

		// Mobile styles - overlay approach
		@media (max-width: 768px) {
			position: fixed;
			top: 0;
			right: 0;
			bottom: 0;
			z-index: 100;
			transform: translateX(100%);
			transition: transform $duration-slide ease-in-out, width 0s;
			width: 100vw !important;
			max-width: 400px;

			&.open {
				transform: translateX(0);
			}
		}
	}
</style>