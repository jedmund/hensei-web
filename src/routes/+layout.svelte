<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import 'modern-normalize/modern-normalize.css'
	import '$src/app.scss'

	import Navigation from '$lib/components/Navigation.svelte'
	import Sidebar from '$lib/components/ui/Sidebar.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { Tooltip } from 'bits-ui'
	import { beforeNavigate } from '$app/navigation'
	import { authStore } from '$lib/stores/auth.store'
	import { browser } from '$app/environment'

	// Get `data` and `children` from the router via $props()
	// Use a more flexible type that allows additional properties from child pages
	const { data, children } = $props<{
		data: any  // Allow any data to pass through from child pages
		children: () => any
	}>()

    // Initialize auth store from server data immediately on load to ensure
    // Authorization headers are available for client-side API calls
    // Run immediately, not in effect to avoid timing issues
    if (browser) {
        if (data?.auth) {
            console.log('[+layout] Initializing authStore with token:', data.auth.accessToken ? 'present' : 'missing')
            authStore.initFromServer(
                data.auth.accessToken,
                data.auth.user,
                data.auth.expiresAt
            )
        } else {
            console.warn('[+layout] No auth data available to initialize authStore')
        }
    }

	// Close sidebar when navigating to a different page
	beforeNavigate(() => {
		sidebar.close()
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Tooltip.Provider>
	<div class="app-container" class:sidebar-open={sidebar.isOpen}>
		<div class="main-pane">
			<div class="nav-blur-background"></div>
			<div class="main-navigation">
				<Navigation isAuthenticated={data?.isAuthenticated} username={data?.account?.username} role={data?.account?.role} />
			</div>
			<main class="main-content">
				{@render children?.()}
			</main>
		</div>

		<Sidebar
			open={sidebar.isOpen}
			title={sidebar.title}
			onclose={() => sidebar.close()}
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
				height: 80px; // Taller to test the progressive effect
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
				mask-image: linear-gradient(
					to bottom,
					black 0%,
					black 40%,
					transparent 100%
				);
				-webkit-mask-image: linear-gradient(
					to bottom,
					black 0%,
					black 40%,
					transparent 100%
				);
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
				padding-top: 80px; // Space for fixed navigation (matching test height)
				z-index: 2; // Ensure scrollbar is above blur background

				// Smooth scrolling
				scroll-behavior: smooth;

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
