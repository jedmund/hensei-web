
<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import Button from './ui/Button.svelte'
	import Icon from './Icon.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import NotificationBadge from './ui/NotificationBadge.svelte'
	import { DropdownMenu } from 'bits-ui'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import UserSettingsModal from './UserSettingsModal.svelte'
	import InvitationsModal from './crew/InvitationsModal.svelte'
	import DatabaseNavigation from './DatabaseNavigation.svelte'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import LanguageToggle from './LanguageToggle.svelte'
	import ThemeToggle from './ThemeToggle.svelte'

	// Props from layout data
	const {
		account,
		currentUser,
		isAuthenticated: isAuthProp
	} = $props<{
		account?: {
			userId: string
			username: string
			role: number
		} | null
		currentUser?: UserCookie | null
		isAuthenticated?: boolean
	}>()

	const username = $derived(account?.username ?? '')
	// Use reactive authStore instead of static server prop for real-time auth state
	const isAuth = $derived(authStore.isAuthenticated || (isAuthProp ?? false))
	const role = $derived(account?.role ?? null)
	// Element from UserCookie is already a string like "fire", "water", etc.
	const userElement = $derived(
		currentUser?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Localized links
	const galleryHref = $derived(localizeHref('/teams/explore'))
	const meHref = $derived(localizeHref('/me'))
	const loginHref = $derived(localizeHref('/auth/login'))
	const registerHref = $derived(localizeHref('/auth/register'))
	const databaseHref = $derived(localizeHref('/database'))
	const newTeamHref = $derived(localizeHref('/teams/new'))
	const crewHref = $derived(localizeHref('/crew'))
	const collectionHref = $derived(
		isAuth ? localizeHref(`/${username}/collection`) : localizeHref('/collection')
	)
	const aboutHref = $derived(localizeHref('/about'))
	const extensionHref = $derived(localizeHref('/extension'))

	// Get the element class for styling
	const elementClass = $derived(userElement ? `element-${userElement}` : '')

	// Get the user's avatar URLs
	const avatarSrc = $derived(getAvatarSrc(currentUser?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(currentUser?.picture))

	// Database route detection
	const isDatabaseRoute = $derived($page.url.pathname.startsWith(localizeHref('/database')))

	// Function to check if a nav item is selected
	function isNavSelected(href: string): boolean {
		const path = $page.url.pathname

		// For gallery/teams, we need to check for /teams paths
		if (href === galleryHref) {
			return path === href
		}

		// Exact match or starts with href + /
		return path === href || path.startsWith(href + '/')
	}

	// Check if the user profile link is selected (includes sub-routes like /favorites, /collection)
	const userProfilePath = $derived(localizeHref(`/${username}`))
	const isProfileSelected = $derived(
		isAuth &&
			($page.url.pathname === meHref ||
				$page.url.pathname === userProfilePath ||
				$page.url.pathname.startsWith(userProfilePath + '/'))
	)

	// Settings modal state
	let settingsModalOpen = $state(false)

	// Invitations modal state
	let invitationsModalOpen = $state(false)

	// Query for the user's crew (to determine if phantom claims should be fetched)
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: isAuth
	}))

	// Derived: whether the user is in a crew (from query, not store)
	const isInCrew = $derived(myCrewQuery.data != null)

	// Query for pending invitations (only when authenticated)
	const pendingInvitationsQuery = createQuery(() => ({
		...crewQueries.pendingInvitations(),
		enabled: isAuth
	}))

	// Query for pending phantom claims (only when authenticated and in a crew)
	const pendingPhantomClaimsQuery = createQuery(() => ({
		...crewQueries.pendingPhantomClaims(),
		enabled: isAuth && isInCrew
	}))

	// Derived counts
	const pendingInvitationCount = $derived(pendingInvitationsQuery.data?.length ?? 0)
	const pendingPhantomClaimCount = $derived(pendingPhantomClaimsQuery.data?.length ?? 0)
	const totalNotificationCount = $derived(pendingInvitationCount + pendingPhantomClaimCount)

	// Handle logout
	async function handleLogout() {
		try {
			const response = await fetch('/auth/logout', {
				method: 'POST',
				credentials: 'include'
			})

			if (response.ok) {
				// Navigate to login page after successful logout
				await goto('/auth/login')
			}
		} catch (error) {
			console.error('Logout failed:', error)
			toast.error(extractErrorMessage(error, 'Failed to log out'))
		}
	}
</script>

<nav aria-label="Global" class={elementClass}>
	{#if isDatabaseRoute}
		<DatabaseNavigation {userElement} />
	{:else if isAuth}
		<!-- Authenticated navigation -->
		<div class="nav-links">
			<ul role="list">
				<li>
					<a href={galleryHref} class:selected={isNavSelected(galleryHref)}>{m.nav_gallery()}</a>
				</li>
				<li>
					<a href={crewHref} class:selected={isNavSelected(crewHref)}>{m.nav_crew()}</a>
				</li>
				<li>
					<a
						href={meHref}
						class:selected={isProfileSelected}
						aria-label={m.nav_account_aria()}
						class="profile-link"
					>
						{#if avatarSrc}
							<img
								src={avatarSrc}
								srcset={avatarSrcSet}
								alt={username}
								class="user-avatar"
								width="24"
								height="24"
							/>
						{/if}
						<span>{username}</span>
					</a>
				</li>
				<li>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="nav-more-trigger {totalNotificationCount > 0 ? `has-notification ${userElement ?? ''}` : ''}"
						>
							{#if totalNotificationCount > 0}
								<Icon name="mail" size={18} />
							{:else}
								<Icon name="ellipsis" size={14} />
							{/if}
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
								<DropdownItem>
									<a href={aboutHref}>{m.nav_about()}</a>
								</DropdownItem>
								<DropdownItem>
									<a href={extensionHref}>{m.nav_extension()}</a>
								</DropdownItem>
								{#if role !== null && role >= 7}
									<DropdownItem>
										<a href={databaseHref}>{m.nav_database()}</a>
									</DropdownItem>
								{/if}
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem>
									<button class="dropdown-button-with-badge" onclick={() => (invitationsModalOpen = true)}>
										<span>{m.nav_notifications()}</span>
										{#if totalNotificationCount > 0}
											<NotificationBadge count={totalNotificationCount} showCount element={userElement} />
										{/if}
									</button>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
								<LanguageToggle />
								<ThemeToggle />
								<DropdownItem>
									<button onclick={() => (settingsModalOpen = true)}>
										{m.nav_settings()}
									</button>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem>
									<button onclick={handleLogout}>{m.nav_logout()}</button>
								</DropdownItem>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</li>
			</ul>
		</div>
	{:else}
		<!-- Unauthenticated navigation -->
		<div class="nav-links">
			<ul role="list">
				<li>
					<a href={galleryHref} class:selected={isNavSelected(galleryHref)}>{m.nav_gallery()}</a>
				</li>
				<li>
					<a href={crewHref} class:selected={isNavSelected(crewHref)}>{m.nav_crew()}</a>
				</li>
				<li>
					<a href={collectionHref} class:selected={isNavSelected(collectionHref)}>{m.nav_collection()}</a>
				</li>
				<li>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="nav-more-trigger">
							<Icon name="ellipsis" size={14} />
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
								<DropdownItem>
									<a href={aboutHref}>{m.nav_about()}</a>
								</DropdownItem>
								<DropdownItem>
									<a href={extensionHref}>{m.nav_extension()}</a>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
								<LanguageToggle />
								<ThemeToggle />
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</li>
			</ul>

			<ul role="list">
				<li>
					<a href={registerHref} class:selected={isNavSelected(registerHref)}>{m.nav_register()}</a>
				</li>
				<li>
					<a href={loginHref} class:selected={isNavSelected(loginHref)}>{m.nav_login()}</a>
				</li>
			</ul>
		</div>
	{/if}
	{#if !isDatabaseRoute}
		<Button
			icon="plus"
			iconOnly
			shape="circle"
			variant={userElement ? 'primary' : 'subtle'}
			{...(userElement ? { element: userElement } : {})}
			elementStyle={Boolean(userElement)}
			class="new-team-button"
			aria-label={m.nav_new_team()}
			href={newTeamHref}
		/>
	{/if}
</nav>

<!-- Settings Modal -->
{#if isAuth && account && currentUser}
	<UserSettingsModal
		bind:open={settingsModalOpen}
		onOpenChange={(open) => (settingsModalOpen = open)}
		{username}
		userId={account.userId}
		user={currentUser}
		role={role ?? 0}
	/>
{/if}

<!-- Notifications Modal (invitations + phantom claims) -->
{#if isAuth}
	<InvitationsModal
		bind:open={invitationsModalOpen}
		invitations={pendingInvitationsQuery.data ?? []}
		phantomClaims={pendingPhantomClaimsQuery.data ?? []}
		isLoading={pendingInvitationsQuery.isLoading || pendingPhantomClaimsQuery.isLoading}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x 0;
		max-width: var(--main-max-width);
		margin: 0 auto;
		width: 100%;

		// Match database layout width
		&.database-layout {
			max-width: 1400px;
		}

		// Responsive padding
		@media (max-width: 768px) {
			padding: spacing.$unit;
		}

		ul {
			@include navigation.nav-pill-bar;

			li {
				@include navigation.nav-pill-item;
			}

			a {
				@include navigation.nav-pill-link;
			}
		}

		// Group nav pills together so space-between doesn't split them
		.nav-links {
			display: flex;
			gap: spacing.$unit;
			align-items: center;
		}
	}

	// Profile link with avatar
	.profile-link {
		display: flex !important;
		align-items: center;
		gap: spacing.$unit-half;

		.user-avatar {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			object-fit: cover;
		}
	}

	// Dropdown button with badge (for Invitations)
	:global(.dropdown-button-with-badge) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: spacing.$unit;
	}

	// Style the nav buttons to match link dimensions
	:global(.nav-item-button) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit (spacing.$unit * 1.5);
		border-radius: layout.$full-corner;
		background-color: transparent;
		color: var(--menu-text);
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}
	}

	// Style the dropdown trigger
	:global(.nav-more-trigger) {
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		padding: spacing.$unit calc(spacing.$unit * 1.5 + 1px);
		border-radius: layout.$full-corner;
		background-color: transparent;
		color: var(--menu-text);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}

	// Notification pulse animation for the more trigger
	@keyframes notification-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	:global(.nav-more-trigger.has-notification) {
		animation: notification-pulse 2s ease-in-out infinite;
		background-color: var(--button-primary-bg);
		color: white;
		padding: spacing.$unit calc(spacing.$unit + 3px);

		&:hover {
			animation: none;
			background-color: var(--button-primary-bg-hover);
		}
	}

	// Element-specific notification colors
	@each $el in $elements {
		:global(.nav-more-trigger.has-notification.#{$el}) {
			background-color: var(--#{$el}-button-bg);
			color: if($el == light, black, white);
			&:hover {
				background-color: var(--#{$el}-button-bg-hover);
			}
		}
	}

	// Element-specific SELECTED states for navigation links
	@each $el in $elements {
		nav.element-#{$el} {
			ul a.selected {
				background-color: var(--#{$el}-nav-selected-bg);
				color: var(--#{$el}-nav-selected-text);
				font-weight: typography.$bold;
			}
		}

		:global(nav.element-#{$el} .database-nav a.selected) {
			background-color: var(--#{$el}-nav-selected-bg);
			color: var(--#{$el}-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	:global(.dropdown-content) {
		@include dropdown.dropdown-content;
	}

	:global(.dropdown-separator) {
		@include dropdown.dropdown-separator;
	}
</style>
