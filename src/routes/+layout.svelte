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
		<div class="nav-wrapper">
			<Navigation isAuthenticated={data?.isAuthenticated} username={data?.account?.username} role={data?.account?.role} />
		</div>

		<div class="main-pane">
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

		// Fixed navigation wrapper with blur effect
		.nav-wrapper {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 100;
			width: 100vw;

			// Single blur layer with gradient mask for progressive effect
			&::before {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 80px; // Taller to test the progressive effect

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

				pointer-events: none;
				z-index: 1;
			}

			// Navigation content above the blur layer
			:global(nav) {
				position: relative;
				z-index: 2;
			}
		}

		// Main pane with content
		.main-pane {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			transition: margin-right $duration-slide ease-in-out;
			position: relative;
			height: 100%;

			// Main content area with independent scroll - content starts at top
			.main-content {
				flex: 1;
				overflow-y: auto;
				overflow-x: hidden;
				position: relative;
				padding-top: 56px; // Space for fixed navigation to match blur height

				// Smooth scrolling
				scroll-behavior: smooth;

				// Better scrollbar styling
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
			}
		}

		// When sidebar is open, adjust main pane width
		&.sidebar-open {
			.main-pane {
				margin-right: var(--sidebar-width, 420px);

				// Mobile: don't adjust margin, use overlay
				@media (max-width: 768px) {
					margin-right: 0;
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
