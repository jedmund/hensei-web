<svelte:options runes={true} />

<script lang="ts">
	import SidebarHeader from './SidebarHeader.svelte'
	import Button from './Button.svelte'
	import { SIDEBAR_WIDTH } from '$lib/stores/sidebar.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Whether the sidebar is open */
		open?: boolean
		/** Title for the sidebar header */
		title?: string
		/** Callback when close is requested (camelCase preferred) */
		onClose?: () => void
		/** Callback when close is requested (lowercase, deprecated - use onClose) */
		onclose?: () => void
		/** Callback when back is requested (shows arrow instead of X) */
		onback?: () => void
		/** Callback when save/done is requested */
		onsave?: () => void
		/** Label for the save button */
		saveLabel?: string
		/** Element for styling the save button */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** Content to render in the sidebar */
		children?: Snippet
		/** Whether the sidebar content should scroll. Default true. */
		scrollable?: boolean
	}

	const { open = false, title, onClose, onclose, onback, onsave, saveLabel = 'Done', element, children, scrollable = true }: Props = $props()

	// Support both onClose (camelCase) and onclose (lowercase) for backward compatibility
	const handleClose = $derived(onClose ?? onclose)
</script>

{#snippet leftAccessory()}
	{#if onback}
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="arrow-left"
			onclick={onback}
			aria-label="Go back"
		/>
	{:else if handleClose}
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="close"
			onclick={handleClose}
			aria-label="Close sidebar"
		/>
	{/if}
{/snippet}

{#snippet rightAccessory()}
	{#if onsave}
		<Button variant="ghost" size="small" {element} elementStyle={!!element} onclick={onsave}>
			{saveLabel}
		</Button>
	{/if}
{/snippet}

<aside class="sidebar" class:open style:--sidebar-width={SIDEBAR_WIDTH}>
	{#if title}
		<SidebarHeader {title} {leftAccessory} {rightAccessory} />
	{/if}

	<div class="sidebar-content" class:scrollable>
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
		top: $unit-2x;
		right: $unit-2x;
		height: calc(100vh - #{$unit-2x} - #{$unit-2x}); // 100vh minus top and bottom insets
		box-sizing: border-box;
		background: var(--sidebar-bg);
		display: flex;
		flex-direction: column;
		border-radius: $page-corner;
		flex-shrink: 0;
		width: var(--sidebar-width);
		overflow: hidden;
		transform: translateX(100%);
		opacity: 0;
		transition:
			transform $duration-slide ease-in-out,
			opacity $duration-slide ease-in-out;
		z-index: 50;
		box-shadow: $page-elevation;
		border: 1px solid rgba(0, 0, 0, 0.14);

		&.open {
			transform: translateX(0);
			opacity: 1;
		}

		.sidebar-content {
			flex: 1;
			overflow: hidden;
			display: flex;
			flex-direction: column;

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
			box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
			// Mobile already uses transform, no additional changes needed
		}
	}
</style>
