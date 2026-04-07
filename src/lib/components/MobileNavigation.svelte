<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import Button from './ui/Button.svelte'
	import Icon from './Icon.svelte'
	import NotificationBadge from './ui/NotificationBadge.svelte'
	import BottomSheet from './ui/BottomSheet.svelte'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import UserSettingsModal from './UserSettingsModal.svelte'
	import InvitationsModal from './crew/InvitationsModal.svelte'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { invalidateAll, beforeNavigate } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import LanguageToggle from './LanguageToggle.svelte'
	import ThemeToggle from './ThemeToggle.svelte'

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
	const isAuth = $derived(authStore.isAuthenticated || (isAuthProp ?? false))
	const role = $derived(account?.role ?? null)
	const userElement = $derived(
		currentUser?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	const isBahamut = $derived(currentUser?.bahamut === true)

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

	const elementClass = $derived(userElement ? `element-${userElement}` : '')

	// Avatar
	const avatarSrc = $derived(getAvatarSrc(currentUser?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(currentUser?.picture))

	// Route detection
	function isNavSelected(href: string): boolean {
		const path = $page.url.pathname
		if (href === galleryHref) return path === href
		return path === href || path.startsWith(href + '/')
	}

	const userProfilePath = $derived(localizeHref(`/${username}`))
	const isProfileSelected = $derived(
		isAuth &&
			($page.url.pathname === meHref ||
				$page.url.pathname === userProfilePath ||
				$page.url.pathname.startsWith(userProfilePath + '/'))
	)

	// Current page label
	const currentPageLabel = $derived.by(() => {
		if (isNavSelected(galleryHref)) return m.nav_gallery()
		if (isNavSelected(crewHref)) return m.nav_crew()
		if (isNavSelected(collectionHref)) return m.nav_collection()
		if (isProfileSelected) return username
		if (isNavSelected(aboutHref)) return m.nav_about()
		if (isNavSelected(extensionHref)) return m.nav_extension()
		if (isNavSelected(databaseHref)) return m.nav_database()
		if (isNavSelected(loginHref)) return m.nav_login()
		if (isNavSelected(registerHref)) return m.nav_register()
		return m.nav_gallery()
	})

	// Sheet state
	let sheetOpen = $state(false)

	// Close sheet on navigation
	beforeNavigate(() => {
		sheetOpen = false
	})

	// Modal state
	let settingsModalOpen = $state(false)
	let invitationsModalOpen = $state(false)

	// Queries
	const myCrewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: isAuth
	}))

	const isInCrew = $derived(myCrewQuery.data != null)

	const pendingInvitationsQuery = createQuery(() => ({
		...crewQueries.pendingInvitations(),
		enabled: isAuth
	}))

	const pendingPhantomClaimsQuery = createQuery(() => ({
		...crewQueries.pendingPhantomClaims(),
		enabled: isAuth && isInCrew
	}))

	const pendingInvitationCount = $derived(pendingInvitationsQuery.data?.length ?? 0)
	const pendingPhantomClaimCount = $derived(pendingPhantomClaimsQuery.data?.length ?? 0)
	const totalNotificationCount = $derived(pendingInvitationCount + pendingPhantomClaimCount)

	// Bahamut off
	async function handleBahamutOff() {
		if (!currentUser) return
		const updatedUser = { ...currentUser, bahamut: false }
		await fetch('/api/settings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedUser)
		})
		await invalidateAll()
		window.location.reload()
	}

	// Logout
	async function handleLogout() {
		try {
			const response = await fetch('/auth/logout', {
				method: 'POST',
				credentials: 'include'
			})

			if (response.ok) {
				await goto('/auth/login')
			}
		} catch (error) {
			console.error('Logout failed:', error)
			toast.error(extractErrorMessage(error, 'Failed to log out'))
		}
	}
</script>

{#if isBahamut}
	<button class="bahamut-bar" onclick={handleBahamutOff}>
		{m.nav_bahamut_mode_on()}
	</button>
{/if}

<nav aria-label="Global" class={elementClass}>
	<button class="mobile-nav-trigger" onclick={() => (sheetOpen = true)}>
		<span class="trigger-label">{currentPageLabel}</span>
		<Icon name="chevron-down" size={14} />
	</button>

	<Button
		icon="plus"
		iconOnly
		shape="circle"
		variant={userElement ? 'primary' : 'subtle'}
		{...userElement ? { element: userElement } : {}}
		elementStyle={Boolean(userElement)}
		class="new-team-button"
		aria-label={m.nav_new_team()}
		href={newTeamHref}
	/>
</nav>

<BottomSheet bind:open={sheetOpen}>
	<div class="mobile-nav-sheet {elementClass}">
		{#if isAuth}
			<ul class="sheet-nav-group" role="list">
				<li>
					<a href={galleryHref} class:selected={isNavSelected(galleryHref)}>{m.nav_gallery()}</a>
				</li>
				<li>
					<a href={crewHref} class:selected={isNavSelected(crewHref)}>
						{m.nav_crew()}
						{#if totalNotificationCount > 0}
							<span class="crew-notification-dot {userElement ?? ''}"></span>
						{/if}
					</a>
				</li>
				<li>
					<a href={meHref} class:selected={isProfileSelected} class="profile-link">
						<span>{username}</span>
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
					</a>
				</li>
			</ul>
			<hr class="sheet-separator" />
			<ul class="sheet-nav-group" role="list">
				<li><a href={aboutHref}>{m.nav_about()}</a></li>
				<li><a href={extensionHref}>{m.nav_extension()}</a></li>
				{#if role !== null && role >= 7}
					<li><a href={databaseHref}>{m.nav_database()}</a></li>
				{/if}
			</ul>
			<hr class="sheet-separator" />
			<ul class="sheet-nav-group" role="list">
				<li>
					<button
						class="sheet-button-with-badge"
						onclick={() => {
							sheetOpen = false
							invitationsModalOpen = true
						}}
					>
						<span>{m.nav_notifications()}</span>
						{#if totalNotificationCount > 0}
							<NotificationBadge count={totalNotificationCount} showCount element={userElement} />
						{/if}
					</button>
				</li>
				<li>
					<button
						onclick={() => {
							sheetOpen = false
							settingsModalOpen = true
						}}
					>
						{m.nav_settings()}
					</button>
				</li>
			</ul>
			<hr class="sheet-separator" />
			<div class="sheet-nav-toggles">
				<LanguageToggle />
				<ThemeToggle />
			</div>
			<hr class="sheet-separator" />
			<ul class="sheet-nav-group" role="list">
				<li><button onclick={handleLogout}>{m.nav_logout()}</button></li>
			</ul>
		{:else}
			<ul class="sheet-nav-group" role="list">
				<li>
					<a href={galleryHref} class:selected={isNavSelected(galleryHref)}>{m.nav_gallery()}</a>
				</li>
				<li>
					<a href={crewHref} class:selected={isNavSelected(crewHref)}>{m.nav_crew()}</a>
				</li>
				<li>
					<a href={collectionHref} class:selected={isNavSelected(collectionHref)}
						>{m.nav_collection()}</a
					>
				</li>
			</ul>
			<hr class="sheet-separator" />
			<ul class="sheet-nav-group" role="list">
				<li><a href={aboutHref}>{m.nav_about()}</a></li>
				<li><a href={extensionHref}>{m.nav_extension()}</a></li>
			</ul>
			<hr class="sheet-separator" />
			<div class="sheet-nav-toggles">
				<LanguageToggle />
				<ThemeToggle />
			</div>
			<hr class="sheet-separator" />
			<ul class="sheet-nav-group" role="list">
				<li><a href={loginHref}>{m.nav_login()}</a></li>
				<li><a href={registerHref}>{m.nav_register()}</a></li>
			</ul>
		{/if}
	</div>
</BottomSheet>

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

{#if isAuth}
	<InvitationsModal
		bind:open={invitationsModalOpen}
		invitations={pendingInvitationsQuery.data ?? []}
		phantomClaims={pendingPhantomClaimsQuery.data ?? []}
		isLoading={pendingInvitationsQuery.isLoading || pendingPhantomClaimsQuery.isLoading}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	// Bahamut bar (same as Navigation)
	.bahamut-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: spacing.$unit;
		background-color: #7c3aed;
		color: white;
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: #6d28d9;
		}
	}

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit 0;
		max-width: var(--main-max-width);
		margin: 0 auto;
		width: 100%;

		@media (max-width: 768px) {
			padding: spacing.$unit;
		}
	}

	.mobile-nav-trigger {
		background-color: var(--menu-bg);
		border: effects.$page-border;
		box-shadow: effects.$page-elevation;
		border-radius: layout.$full-corner;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		height: calc(spacing.$unit * 5.5);
		padding: 0 (spacing.$unit * 1.5);
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		flex: 1;
		margin-right: spacing.$unit;
	}

	.trigger-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	// Sheet styles
	.mobile-nav-sheet {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sheet-nav-group {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			a,
			button {
				display: flex;
				align-items: center;
				width: 100%;
				padding: calc(spacing.$unit * 1.5) spacing.$unit;
				border-radius: layout.$card-corner;
				color: var(--text-primary);
				text-decoration: none;
				font-size: typography.$font-regular;
				font-weight: typography.$medium;
				background: none;
				border: none;
				cursor: pointer;
				font-family: var(--font-family);
				gap: spacing.$unit-half;

				&:hover {
					background: var(--menu-bg-item-hover);
				}
			}
		}
	}

	.sheet-button-with-badge {
		justify-content: space-between;
	}

	.sheet-separator {
		border: none;
		height: 2px;
		background-color: var(--separator-bg);
		border-radius: 1px;
		margin: spacing.$unit 0;
	}

	.sheet-nav-toggles {
		padding: spacing.$unit-half 0;

		:global(.language-row),
		:global(.theme-row) {
			padding: calc(spacing.$unit * 1.5) spacing.$unit;
		}

		:global(.language-label),
		:global(.theme-label) {
			font-size: typography.$font-regular;
			color: var(--text-primary);
		}
	}

	// Profile link with avatar on right
	.profile-link {
		justify-content: space-between;

		.user-avatar {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			object-fit: cover;
		}
	}

	// Crew notification dot
	.crew-notification-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--button-primary-bg);
		animation: notification-pulse 2s ease-in-out infinite;
		flex-shrink: 0;
	}

	@each $el in $elements {
		.crew-notification-dot.#{$el} {
			background: var(--#{$el}-button-bg);
		}
	}

	@keyframes notification-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	// Element-specific selected states in sheet
	@each $el in $elements {
		.mobile-nav-sheet.element-#{$el} {
			.sheet-nav-group li a.selected {
				background-color: var(--#{$el}-nav-selected-bg);
				color: var(--#{$el}-nav-selected-text);
			}
		}
	}

	// Fallback selected state when no element is set
	.sheet-nav-group li a.selected {
		background-color: var(--null-nav-selected-bg);
		color: var(--null-nav-selected-text);
	}
</style>
