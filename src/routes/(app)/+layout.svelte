<script lang="ts">
	import type { Snippet } from 'svelte'
	import * as m from '$lib/paraglide/messages'
	import Navigation from '$lib/components/Navigation.svelte'
	import MobileNavigation from '$lib/components/MobileNavigation.svelte'
	import { mobileQuery } from '$lib/utils/viewport.svelte'
	import Sidebar from '$lib/components/ui/Sidebar.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { Tooltip } from 'bits-ui'
	import { beforeNavigate, afterNavigate, goto } from '$app/navigation'
	import { browser, dev } from '$app/environment'
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import AccountDeletionBanner from '$lib/components/AccountDeletionBanner.svelte'
	import { hasEditKeys, getAllEditKeys } from '$lib/utils/editKeys'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import type { LayoutData } from './$types'
	import { page } from '$app/state'
	import { isDatabasePath, localizeNavHrefs } from '$lib/components/navigation/navLinks'

	const { data, children } = $props<{
		data: LayoutData & { [key: string]: unknown }
		children: Snippet
	}>()

	// Populate crew store for authenticated users (needed globally for collection features)
	const crewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: !!data?.isAuthenticated && browser
	}))

	$effect(() => {
		if (crewQuery.data) {
			crewStore.setCrew(crewQuery.data, crewQuery.data.currentMembership ?? null)
		} else if (crewQuery.isError) {
			crewStore.clear()
		}
	})

	$effect(() => {
		crewStore.setLoading(crewQuery.isLoading)
	})

	// Deposit edit keys to server on login (fire-and-forget)
	$effect(() => {
		if (data?.isAuthenticated && browser && hasEditKeys()) {
			userAdapter.depositEditKeys(getAllEditKeys()).catch(() => {})
		}
	})

	// Warn on hard reload / tab close if sidebar has unsaved changes
	function handleBeforeUnload(event: BeforeUnloadEvent) {
		if (sidebar.isOpen && sidebar.paneStack.anyPaneHasUnsavedChanges) {
			event.preventDefault()
		}
	}

	// Mobile detection
	const isMobile = mobileQuery()

	// Phones get the bottom tab bar instead of a top bar, except in the Database
	const hasTabBar = $derived(
		isMobile.current && !isDatabasePath(page.url.pathname, localizeNavHrefs())
	)

	// Bahamut mode bar affects layout positioning
	const isBahamut = $derived(data?.currentUser?.bahamut === true)

	// The document scrolls (not an inner container), so the browser and
	// SvelteKit handle scroll: the iOS toolbars collapse, a status-bar tap
	// scrolls to top, and SvelteKit resets to the top on navigation and
	// restores the position on back/forward.

	// Whether the page is scrolled, for the gradient behind the fixed nav
	let isScrolled = $state(false)

	function updateScrolled() {
		isScrolled = window.scrollY > 0
	}

	// Close the sidebar when navigating, unless it has unsaved changes
	beforeNavigate(({ to, cancel }) => {
		// Let persistOnTabSwitch panes stay open during shallow navigation
		if (sidebar.isOpen && sidebar.paneStack.currentPane?.persistOnTabSwitch) {
			return
		}

		// If sidebar has unsaved changes, block navigation and show dialog
		if (sidebar.isOpen && sidebar.paneStack.anyPaneHasUnsavedChanges) {
			cancel()
			const targetUrl = to?.url.href ?? ''
			sidebar.requestConfirmation(() => {
				sidebar.close()
				if (targetUrl) goto(targetUrl)
			})
			return
		}

		sidebar.close()
	})

	// SvelteKit sets the scroll position after navigating (top, or the saved
	// position on back/forward), which may not fire a scroll event
	afterNavigate(() => {
		requestAnimationFrame(updateScrolled)
	})
</script>

<svelte:window onbeforeunload={handleBeforeUnload} onscroll={updateScrolled} />

{#if dev}
	<SvelteQueryDevtools buttonPosition="top-right" />
{/if}
<Tooltip.Provider>
	<div class="app-container" class:sidebar-open={sidebar.isOpen}>
		<div
			class="main-pane"
			class:has-tab-bar={hasTabBar}
			style:--bahamut-offset={isBahamut ? '16px' : '0px'}
		>
			<div class="nav-blur-background" class:scrolled={isScrolled}></div>
			<div class="main-navigation">
				{#if isMobile.current}
					<MobileNavigation
						isAuthenticated={data?.isAuthenticated}
						account={data?.account}
						currentUser={data?.currentUser}
					/>
				{:else}
					<Navigation
						isAuthenticated={data?.isAuthenticated}
						account={data?.account}
						currentUser={data?.currentUser}
					/>
				{/if}
			</div>
			<main class="main-content">
				{#if data?.account?.deletionScheduledAt}
					<AccountDeletionBanner deletionScheduledAt={data.account.deletionScheduledAt} />
				{/if}
				<svelte:boundary
					onerror={(e) => {
						console.error('Page render error:', e)
						if (browser) {
							try {
								const payload = {
									message: e instanceof Error ? e.message : String(e),
									stack: e instanceof Error ? e.stack : undefined,
									url: window.location.href
								}
								fetch('/api/client-error', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify(payload)
								}).catch(() => {})
							} catch {
								// Don't let error reporting cause more errors
							}
						}
					}}
				>
					{@render children?.()}
					<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
					{#snippet failed(error, reset)}
						<div class="page-error" role="alert">
							<div class="error-message">
								<h2>{m.error_something_went_wrong()}</h2>
								<p>{m.error_boundary_message()}</p>
							</div>
							<div class="page-error-actions">
								<button class="retry-button" onclick={reset}>{m.error_boundary_retry()}</button>
							</div>
						</div>
					{/snippet}
				</svelte:boundary>
			</main>
		</div>

		<Sidebar open={sidebar.isOpen} stack={sidebar.paneStack} onClose={() => sidebar.close()} />
	</div>
</Tooltip.Provider>

<ConfirmDialog
	open={sidebar.confirmationRequested}
	title={m.dialog_unsaved_changes_title()}
	message={m.dialog_unsaved_changes_message()}
	confirmLabel={m.dialog_unsaved_close()}
	cancelLabel={m.dialog_unsaved_nevermind()}
	onconfirm={() => sidebar.confirmPendingAction()}
	oncancel={() => sidebar.dismissConfirmation()}
/>

<style lang="scss">
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as spacing;

	:root {
		--sidebar-width: 420px;
		// The phone tab bar (see MobileTabBar): the capsule, the gap below it,
		// and the space both take, without the home-indicator inset
		--tab-bar-pill: 56px;
		--tab-bar-gap: 12px;
		--tab-bar-height: calc(var(--tab-bar-pill) + var(--tab-bar-gap));
	}

	// The document scrolls, not an inner container (see the script)
	.app-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		position: relative;

		// Main pane with content
		.main-pane {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			// Height of the fixed nav (and Bahamut bar). Content starts below it, and
			// sticky elements stick at it: the page scrolls under the fixed nav
			--content-top: calc(81px + var(--bahamut-offset, 0px));

			transition: margin-right $duration-slide ease-in-out;
			position: relative;

			// Blur background that shifts with main pane
			.nav-blur-background {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				height: 81px; // Matches $nav-height
				z-index: $z-sticky - 1; // Above content, below nav
				pointer-events: none;
				transition:
					right $duration-slide ease-in-out,
					opacity 0.2s ease-in-out;
				opacity: 0;

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

				&.scrolled {
					opacity: 1;
				}
			}

			// Navigation wrapper - fixed but shifts with main-pane
			.main-navigation {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				z-index: $z-sticky; // Above blur but below scrollbar
				transition: right $duration-slide ease-in-out;
				pointer-events: auto;
			}

			// Main content area. `clip`, not `hidden`: hidden on one axis makes
			// the element a scroll container again
			.main-content {
				flex: 1;
				overflow-x: clip;
				position: relative;
				padding-top: var(--content-top);
				padding-bottom: 20vh; // Extra space at bottom for comfortable scrolling
				z-index: $z-badge;

				// Database pages end at the list: their sticky record panel already
				// stops this far above the window's bottom, so extra space only
				// scrolls into nothing
				&:has(> :global(.database-layout)) {
					padding-bottom: spacing.$unit-2x;
				}
			}
		}

		// When sidebar is open, adjust main pane and navigation
		&.sidebar-open {
			.main-pane {
				margin-right: var(--sidebar-width, 420px);

				// Blur background and navigation shift with the main pane
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
				--content-top: calc(60px + env(safe-area-inset-top, 0px) + var(--bahamut-offset, 0px));

				// The Database's top bar clears the status bar when opened from the
				// Home Screen (the inset is 0 in Safari itself)
				.main-navigation {
					padding-top: env(safe-area-inset-top, 0px);
				}

				// No top bar: content starts below the status bar, and clears the
				// tab bar at the bottom
				&.has-tab-bar {
					--content-top: calc(
						env(safe-area-inset-top, 0px) + var(--bahamut-offset, 0px) + #{spacing.$unit-2x}
					);

					.main-content {
						padding-bottom: max(
							20vh,
							calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px) + #{spacing.$unit-4x})
						);
					}

					// No top bar to sit behind. (In Safari the page starts below the
					// status bar and the safe-area insets are 0; they only apply when the
					// site is opened from the Home Screen.)
					.nav-blur-background {
						display: none;
					}
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
				z-index: $z-modal;
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

	.page-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: spacing.$unit-4x;
		color: var(--text-primary);

		.error-message {
			text-align: center;

			h2 {
				font-size: $font-xlarge;
				font-weight: $bold;
				margin: 0;
			}

			p {
				color: var(--text-secondary);
				font-size: $font-small;
				margin: spacing.$unit 0 0;
			}
		}

		.page-error-actions {
			margin-top: spacing.$unit-3x;
		}

		.retry-button {
			all: unset;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			padding: calc(spacing.$unit * 1.5) calc(spacing.$unit * 2.5);
			border-radius: 6px;
			font-size: $font-regular;
			font-weight: $medium;
			font-family: inherit;
			background: var(--button-bg);
			color: var(--button-text);

			&:hover {
				background: var(--button-bg-hover);
				color: var(--button-text-hover);
			}
		}
	}
</style>
