<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/ui/Sidebar.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { Tooltip } from 'bits-ui'
	import { beforeNavigate, afterNavigate } from '$app/navigation'
	import { browser, dev } from '$app/environment'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import type { LayoutData } from './$types'

	const { data, children } = $props<{
		data: LayoutData & { [key: string]: any }
		children: () => any
	}>()

	// Reference to the scrolling container
	let mainContent: HTMLElement | undefined

	// Store scroll positions for each visited route
	const scrollPositions = new Map<string, number>()

	// Save scroll position before navigating away and close sidebar
	beforeNavigate(({ from }) => {
		// Close sidebar when navigating
		sidebar.close()

		// Save scroll position for the current route
		if (from && mainContent) {
			const key = from.url.pathname + from.url.search
			scrollPositions.set(key, mainContent.scrollTop)
		}
	})

	// Handle scroll restoration or reset after navigation
	afterNavigate(({ from, to, type }) => {
		if (!mainContent || !to) return

		// Use requestAnimationFrame to ensure DOM has updated
		requestAnimationFrame(() => {
			if (!mainContent) return
			const key = to.url.pathname + to.url.search

			// Only restore scroll for browser back/forward navigation
			if (type === 'popstate' && scrollPositions.has(key)) {
				// User clicked back/forward button - restore their position
				mainContent.scrollTop = scrollPositions.get(key) || 0
			} else {
				// Any other navigation type (link, goto, enter, etc.) - go to top
				mainContent.scrollTop = 0
			}
		})
	})

	// Optional: Export snapshot for session persistence
	export const snapshot = {
		capture: () => {
			if (!mainContent) return { scroll: 0, positions: [] }
			return {
				scroll: mainContent.scrollTop,
				positions: Array.from(scrollPositions.entries())
			}
		},
		restore: (snapshotData: { scroll?: number; positions?: [string, number][] }) => {
			if (!snapshotData || !mainContent) return

			// Restore saved positions map
			if (snapshotData.positions) {
				scrollPositions.clear()
				snapshotData.positions.forEach(([key, value]) => {
					scrollPositions.set(key, value)
				})
			}

			// Restore current scroll position after DOM is ready
			if (browser) {
				requestAnimationFrame(() => {
					if (mainContent) mainContent.scrollTop = snapshotData.scroll || 0
				})
			}
		}
	}
</script>

{#if dev}
	<SvelteQueryDevtools />
{/if}
<Tooltip.Provider>
	<div class="app-container" class:sidebar-open={sidebar.isOpen}>
		<div class="main-pane">
			<div class="nav-blur-background"></div>
			<div class="main-navigation">
				<Navigation
					isAuthenticated={data?.isAuthenticated}
					account={data?.account}
					currentUser={data?.currentUser}
				/>
			</div>
			<main class="main-content" bind:this={mainContent}>
				{@render children?.()}
			</main>
		</div>

		<Sidebar
			open={sidebar.isOpen}
			title={sidebar.title}
			onclose={() => sidebar.close()}
			scrollable={sidebar.scrollable}
			onsave={sidebar.onsave}
			saveLabel={sidebar.saveLabel}
			element={sidebar.element}
			onback={sidebar.onback}
		>
			{#if sidebar.component}
				<svelte:component this={sidebar.component} {...sidebar.componentProps} />
			{:else if sidebar.content}
				{@render sidebar.content()}
			{/if}
		</Sidebar>
	</div>
</Tooltip.Provider>

<style lang="scss">
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;

	:root {
		--sidebar-width: 420px;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100%;
		position: relative;
		overflow: hidden;

		// Main pane with content
		.main-pane {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			transition: margin-right $duration-slide ease-in-out;
			position: relative;
			height: 100%;

			// Blur background that shifts with main pane
			.nav-blur-background {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				height: 81px; // Matches $nav-height
				z-index: 1; // Lower z-index so scrollbar appears above
				pointer-events: none;
				transition: right $duration-slide ease-in-out;

				// Color gradient for the background
				background: linear-gradient(
					to bottom,
					color-mix(in srgb, var(--background) 85%, transparent) 0%,
					color-mix(in srgb, var(--background) 60%, transparent) 50%,
					color-mix(in srgb, var(--background) 20%, transparent) 85%,
					transparent 100%
				);

				// Single blur value applied to entire element
				backdrop-filter: blur(6px);
				-webkit-backdrop-filter: blur(6px);

				// Mask gradient to fade out the blur effect progressively
				mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%);
				-webkit-mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%);
			}

			// Navigation wrapper - fixed but shifts with main-pane
			.main-navigation {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				z-index: 10; // Above blur but below scrollbar
				transition: right $duration-slide ease-in-out;
				pointer-events: auto;
			}

			// Main content area with independent scroll
			.main-content {
				flex: 1;
				overflow-y: auto;
				overflow-x: hidden;
				position: relative;
				padding-top: 81px; // Space for fixed navigation (matches $nav-height)
				padding-bottom: 20vh; // Extra space at bottom for comfortable scrolling
				z-index: 2; // Ensure scrollbar is above blur background

				// Use overlay scrollbars that auto-hide on macOS
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
			}
		}

		// When sidebar is open, adjust main pane and navigation
		&.sidebar-open {
			.main-pane {
				margin-right: var(--sidebar-width, 420px);

				// Blur background and navigation shift with the main pane
				.nav-blur-background,
				.main-navigation {
					right: var(--sidebar-width, 420px);
				}

				// Mobile: don't adjust margin, use overlay
				@media (max-width: 768px) {
					margin-right: 0;

					.nav-blur-background,
					.main-navigation {
						right: 0; // Don't shift on mobile
					}
				}
			}
		}
	}

	// Mobile adjustments
	@media (max-width: 768px) {
		.app-container {
			.main-pane {
				.main-content {
					// Improve mobile scrolling performance
					-webkit-overflow-scrolling: touch;
				}
			}

			// Overlay backdrop when sidebar is open on mobile
			&.sidebar-open::before {
				content: '';
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: rgba(0, 0, 0, 0.5);
				z-index: 99;
				animation: fadeIn $duration-quick ease-out;
			}
		}
	}

	// Fade in animation for mobile backdrop
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
