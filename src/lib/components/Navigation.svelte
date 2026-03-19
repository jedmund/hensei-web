
<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import Button from './ui/Button.svelte'
	import Tooltip from './ui/Tooltip.svelte'
	import Icon from './Icon.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import NotificationBadge from './ui/NotificationBadge.svelte'
	import { DropdownMenu } from 'bits-ui'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import UserSettingsModal from './UserSettingsModal.svelte'
	import InvitationsModal from './crew/InvitationsModal.svelte'
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
	const guidesHref = $derived(localizeHref('/guides'))
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

	// Database-specific links
	const databaseCharactersHref = $derived(localizeHref('/database/characters'))
	const databaseWeaponsHref = $derived(localizeHref('/database/weapons'))
	const databaseSummonsHref = $derived(localizeHref('/database/summons'))
	const databaseJobsHref = $derived(localizeHref('/database/jobs'))
	const databaseSeriesHref = $derived(localizeHref('/database/series'))
	const databaseGwEventsHref = $derived(localizeHref('/database/gw-events'))
	const databaseArtifactSkillsHref = $derived(localizeHref('/database/artifact-skills'))
	const databaseBulletsHref = $derived(localizeHref('/database/bullets'))
	const databaseRaidsHref = $derived(localizeHref('/database/raids'))
	const databaseRaidGroupsHref = $derived(localizeHref('/database/raid-groups'))

	// Database route detection
	const isDatabaseRoute = $derived($page.url.pathname.startsWith(localizeHref('/database')))

	// Detect current database entity type
	const currentDatabaseEntity = $derived.by(() => {
		const path = $page.url.pathname
		if (path.startsWith(databaseCharactersHref)) return 'character'
		if (path.startsWith(databaseWeaponsHref)) return 'weapon'
		if (path.startsWith(databaseSummonsHref)) return 'summon'
		if (path.startsWith(databaseJobsHref) || path.startsWith(localizeHref('/database/job-skills')))
			return 'job'
		if (path.startsWith(databaseRaidsHref) || path.startsWith(databaseRaidGroupsHref)) return 'raid'
		return null
	})

	// Database "New" dropdown config
	const databaseEntityLabel = $derived(
		currentDatabaseEntity === 'character'
			? m.type_character()
			: currentDatabaseEntity === 'weapon'
				? m.type_weapon()
				: currentDatabaseEntity === 'summon'
					? m.type_summon()
					: currentDatabaseEntity === 'job'
						? m.type_job()
						: currentDatabaseEntity === 'raid'
							? m.type_raid()
							: null
	)
	const databaseNewHref = $derived(
		currentDatabaseEntity === 'character'
			? localizeHref('/database/characters/new')
			: currentDatabaseEntity === 'weapon'
				? localizeHref('/database/weapons/new')
				: currentDatabaseEntity === 'summon'
					? localizeHref('/database/summons/new')
					: null
	)
	const databaseImportHref = $derived(
		currentDatabaseEntity === 'character'
			? localizeHref('/database/characters/import')
			: currentDatabaseEntity === 'weapon'
				? localizeHref('/database/weapons/import')
				: currentDatabaseEntity === 'summon'
					? localizeHref('/database/summons/import')
					: null
	)

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

	// Function to check if a database nav item is selected
	function isDatabaseNavSelected(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
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
		<!-- Database navigation mode -->
		<div class="database-nav">
			<!-- Back button -->
			<ul role="list" class="database-back-section">
				<li>
					<Tooltip content={m.nav_back_to_site()}>
						<a
							href={galleryHref}
							class="database-back-button"
							aria-label={m.nav_back_to_site()}
						>
							<Icon name="home" size={21} />
						</a>
					</Tooltip>
				</li>
			</ul>

			<!-- Database sub-navigation -->
			<ul role="list" class="database-subnav">
				<li>
					<a
						href={databaseCharactersHref}
						class:selected={isDatabaseNavSelected(databaseCharactersHref)}
					>
						{m.nav_characters()}
					</a>
				</li>
				<li>
					<a href={databaseWeaponsHref} class:selected={isDatabaseNavSelected(databaseWeaponsHref)}>
						{m.nav_weapons()}
					</a>
				</li>
				<li>
					<a href={databaseSummonsHref} class:selected={isDatabaseNavSelected(databaseSummonsHref)}>
						{m.nav_summons()}
					</a>
				</li>
				<li>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="nav-more-trigger">
							<Icon name="ellipsis" size={14} />
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
								<DropdownItem>
									<a href={databaseJobsHref}>{m.nav_jobs()}</a>
								</DropdownItem>
								<DropdownItem>
									<a href={databaseRaidsHref}>{m.nav_raids()}</a>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem>
									<a href={databaseArtifactSkillsHref}>{m.nav_artifact_skills()}</a>
								</DropdownItem>
								<DropdownItem>
									<a href={databaseBulletsHref}>{m.nav_bullets()}</a>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem>
									<a href={databaseGwEventsHref}>{m.nav_unite_and_fight()}</a>
								</DropdownItem>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</li>
			</ul>
		</div>
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
	{#if isDatabaseRoute && databaseEntityLabel}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="new-item-trigger {userElement ?? ''}">
				<span>{m.nav_new_entity({ entity: databaseEntityLabel ?? '' })}</span>
				<Icon name="chevron-down" size={12} />
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content class="dropdown-content" sideOffset={5} align="end">
					{#if currentDatabaseEntity === 'raid'}
						<DropdownItem>
							<a href={localizeHref('/database/raids/new')}>{m.nav_new_raid()}</a>
						</DropdownItem>
						<DropdownItem>
							<a href={localizeHref('/database/raid-groups/new')}>{m.nav_new_raid_group()}</a>
						</DropdownItem>
					{:else if currentDatabaseEntity === 'job'}
						<DropdownItem>
							<a href={localizeHref('/database/jobs/new')}>{m.nav_new_job()}</a>
						</DropdownItem>
						<DropdownItem>
							<a href={localizeHref('/database/job-accessories/new')}>{m.nav_new_job_accessory()}</a>
						</DropdownItem>
					{:else}
						{#if databaseNewHref}
							<DropdownItem>
								<a href={databaseNewHref}>{m.nav_new_single({ entity: databaseEntityLabel ?? '' })}</a>
							</DropdownItem>
						{/if}
						{#if databaseImportHref}
							<DropdownItem>
								<a href={databaseImportHref}>{m.nav_new_multiple({ entity: databaseEntityLabel ?? '' })}</a>
							</DropdownItem>
						{/if}
						{#if currentDatabaseEntity === 'weapon'}
							<DropdownMenu.Separator class="dropdown-separator" />
							<DropdownItem>
								<a href={localizeHref('/database/series/weapons/new')}>{m.nav_new_weapon_series()}</a>
							</DropdownItem>
						{/if}
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{:else}
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
	@use '$src/themes/effects' as effects;
	@use '$src/themes/themes' as themes;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

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
			background-color: var(--menu-bg);
			border: effects.$page-border;
			box-shadow: effects.$page-elevation;
			border-radius: layout.$full-corner;
			display: flex;
			flex-direction: row;
			gap: spacing.$unit-quarter;
			padding: spacing.$unit-half;
			list-style: none;

			li {
				display: flex;
				align-items: stretch;
			}

			a {
				border-radius: layout.$full-corner;
				color: var(--menu-text);
				font-size: typography.$font-small;
				font-weight: typography.$medium;
				text-decoration: none;
				display: flex;
				align-items: center;
				justify-content: center;
				vertical-align: middle;
				padding: spacing.$unit (spacing.$unit * 1.5);

				&:hover {
					background-color: var(--menu-bg-item-hover);
				}

				&:visited {
					color: var(--menu-text);
				}

				&.selected {
					background-color: var(--menu-bg-item-selected, var(--menu-bg-item-hover));
					font-weight: typography.$bold;
				}
			}
		}

		// Group nav pills together so space-between doesn't split them
		.nav-links {
			display: flex;
			gap: spacing.$unit;
			align-items: center;
		}

		// Database navigation mode
		.database-nav {
			display: flex;
			gap: spacing.$unit;
			align-items: center;

			.database-back-section {
				min-height: 49px;
				min-width: 49px;

				ul {
					background-color: var(--menu-bg);
					border-radius: layout.$full-corner;
					display: flex;
					flex-direction: row;
					padding: spacing.$unit-half;
					list-style: none;
				}

				.database-back-button {
					border-radius: layout.$full-corner;
					color: var(--text-secondary);
					font-size: typography.$font-small;
					font-weight: typography.$medium;
					text-decoration: none;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: calc(spacing.$unit * 1.25);
					aspect-ratio: 1;

					&:hover {
						color: var(--text-primary);
					}
				}
			}

			.database-subnav {
				background-color: var(--menu-bg);
				border-radius: layout.$full-corner;
				display: flex;
				gap: spacing.$unit-quarter;
				flex-direction: row;
				padding: spacing.$unit-half;
				list-style: none;
				min-height: 49px;

				a {
					border-radius: layout.$full-corner;
					color: var(--menu-text);
					font-size: typography.$font-small;
					font-weight: typography.$medium;
					text-decoration: none;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: spacing.$unit (spacing.$unit * 1.5);

					&:hover {
						background-color: var(--menu-bg-item-hover);
					}

					&:visited {
						color: var(--menu-text);
					}

					&.selected {
						background-color: var(--menu-bg-item-selected, var(--menu-bg-item-hover));
						font-weight: typography.$bold;
					}
				}
			}
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
		align-self: stretch; // Make it stretch to full height
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
		// Default pulse color (no element selected)
		background-color: var(--button-primary-bg);
		color: white;
		// Compensate for larger mail icon (18px vs 14px ellipsis)
		padding: spacing.$unit calc(spacing.$unit + 3px);

		&:hover {
			animation: none;
			background-color: var(--button-primary-bg-hover);
		}
	}

	// Element-specific notification colors
	:global(.nav-more-trigger.has-notification.wind) {
		background-color: var(--wind-button-bg);
		&:hover {
			background-color: var(--wind-button-bg-hover);
		}
	}
	:global(.nav-more-trigger.has-notification.fire) {
		background-color: var(--fire-button-bg);
		&:hover {
			background-color: var(--fire-button-bg-hover);
		}
	}
	:global(.nav-more-trigger.has-notification.water) {
		background-color: var(--water-button-bg);
		&:hover {
			background-color: var(--water-button-bg-hover);
		}
	}
	:global(.nav-more-trigger.has-notification.earth) {
		background-color: var(--earth-button-bg);
		&:hover {
			background-color: var(--earth-button-bg-hover);
		}
	}
	:global(.nav-more-trigger.has-notification.light) {
		background-color: var(--light-button-bg);
		color: black;
		&:hover {
			background-color: var(--light-button-bg-hover);
		}
	}
	:global(.nav-more-trigger.has-notification.dark) {
		background-color: var(--dark-button-bg);
		&:hover {
			background-color: var(--dark-button-bg-hover);
		}
	}

	// Style the new team button as a prominent circular button
	// Remove redundant styles that the Button component already handles
	:global(.new-team-button) {
		// Only add styles that are specific overrides, not duplicates
		// The Button component already handles size, shape, colors, etc.
	}

	// Style the database "New item" dropdown trigger
	:global(.new-item-trigger) {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: calc(spacing.$unit * 1.5) spacing.$unit-2x;
		border-radius: layout.$full-corner;
		background-color: var(--button-primary-bg);
		color: var(--button-primary-text);
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		transition: background-color 0.2s ease;
	}
	:global(.new-item-trigger:hover) {
		background-color: var(--button-primary-bg-hover);
	}

	// Element-specific colors for new item trigger
	:global(.new-item-trigger.wind) {
		background-color: var(--wind-button-bg);
		color: white;
	}
	:global(.new-item-trigger.wind:hover) {
		background-color: var(--wind-button-bg-hover);
	}
	:global(.new-item-trigger.fire) {
		background-color: var(--fire-button-bg);
		color: white;
	}
	:global(.new-item-trigger.fire:hover) {
		background-color: var(--fire-button-bg-hover);
	}
	:global(.new-item-trigger.water) {
		background-color: var(--water-button-bg);
		color: white;
	}
	:global(.new-item-trigger.water:hover) {
		background-color: var(--water-button-bg-hover);
	}
	:global(.new-item-trigger.earth) {
		background-color: var(--earth-button-bg);
		color: white;
	}
	:global(.new-item-trigger.earth:hover) {
		background-color: var(--earth-button-bg-hover);
	}
	:global(.new-item-trigger.light) {
		background-color: var(--light-button-bg);
		color: black;
	}
	:global(.new-item-trigger.light:hover) {
		background-color: var(--light-button-bg-hover);
	}
	:global(.new-item-trigger.dark) {
		background-color: var(--dark-button-bg);
		color: white;
	}
	:global(.new-item-trigger.dark:hover) {
		background-color: var(--dark-button-bg-hover);
	}

	// Element-specific SELECTED states for navigation links
	// Hover states remain the default grey (defined in base styles above)
	nav.element-wind {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--wind-nav-selected-bg);
			color: var(--wind-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	nav.element-fire {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--fire-nav-selected-bg);
			color: var(--fire-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	nav.element-water {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--water-nav-selected-bg);
			color: var(--water-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	nav.element-earth {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--earth-nav-selected-bg);
			color: var(--earth-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	nav.element-dark {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--dark-nav-selected-bg);
			color: var(--dark-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	nav.element-light {
		ul a.selected,
		.database-nav a.selected {
			background-color: var(--light-nav-selected-bg);
			color: var(--light-nav-selected-text);
			font-weight: typography.$bold;
		}
	}

	// Dropdown menu styles
	:global(.dropdown-content) {
		background-color: var(--menu-bg);
		border-radius: layout.$input-corner;
		padding: spacing.$unit-half;
		min-width: 160px;
		box-shadow: var(--shadow-xl);
		animation: dropdownSlideIn 0.2s ease;
		z-index: effects.$z-popover;

		@keyframes dropdownSlideIn {
			from {
				opacity: 0;
				transform: translateY(-2px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	// Dropdown separator styles
	:global(.dropdown-separator) {
		height: 1px;
		background-color: var(--menu-border, rgba(0, 0, 0, 0.1));
		margin: spacing.$unit-half 0;
	}
</style>
