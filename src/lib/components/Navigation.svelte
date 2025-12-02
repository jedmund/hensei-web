<svelte:options runes={true} />

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Button from './ui/Button.svelte'
	import Icon from './Icon.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import { DropdownMenu } from 'bits-ui'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import UserSettingsModal from './UserSettingsModal.svelte'
	import { authStore } from '$lib/stores/auth.store'

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
	const isAuth = $derived($authStore.isAuthenticated)
	const role = $derived(account?.role ?? null)
	// Element from UserCookie is already a string like "fire", "water", etc.
	const userElement = $derived(
		currentUser?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Localized links
	const galleryHref = $derived(localizeHref('/teams/explore'))
	const guidesHref = $derived(localizeHref('/guides'))
	const collectionHref = $derived(
		username ? localizeHref(`/${username}/collection/characters`) : localizeHref('/collection')
	)
	const meHref = $derived(localizeHref('/me'))
	const loginHref = $derived(localizeHref('/auth/login'))
	const registerHref = $derived(localizeHref('/auth/register'))
	const databaseHref = $derived(localizeHref('/database'))
	const newTeamHref = $derived(localizeHref('/teams/new'))

	// Get the element class for styling
	const elementClass = $derived(userElement ? `element-${userElement}` : '')

	// Get the user's avatar URLs
	const avatarSrc = $derived(getAvatarSrc(currentUser?.picture))
	const avatarSrcSet = $derived(getAvatarSrcSet(currentUser?.picture))

	// Database-specific links
	const databaseCharactersHref = $derived(localizeHref('/database/characters'))
	const databaseWeaponsHref = $derived(localizeHref('/database/weapons'))
	const databaseSummonsHref = $derived(localizeHref('/database/summons'))

	// Database route detection
	const isDatabaseRoute = $derived($page.url.pathname.startsWith(localizeHref('/database')))

	// Detect current database entity type
	const currentDatabaseEntity = $derived.by(() => {
		const path = $page.url.pathname
		if (path.startsWith(databaseCharactersHref)) return 'character'
		if (path.startsWith(databaseWeaponsHref)) return 'weapon'
		if (path.startsWith(databaseSummonsHref)) return 'summon'
		return null
	})

	// Database "New" button config
	const databaseNewButtonLabel = $derived(
		currentDatabaseEntity === 'character'
			? 'New character'
			: currentDatabaseEntity === 'weapon'
				? 'New weapon'
				: currentDatabaseEntity === 'summon'
					? 'New summon'
					: 'New'
	)
	const databaseNewButtonHref = $derived(
		currentDatabaseEntity === 'character'
			? localizeHref('/database/characters/new')
			: currentDatabaseEntity === 'weapon'
				? localizeHref('/database/weapons/new')
				: currentDatabaseEntity === 'summon'
					? localizeHref('/database/summons/new')
					: localizeHref('/database')
	)

	// Function to check if a nav item is selected
	function isNavSelected(href: string): boolean {
		const path = $page.url.pathname

		// For gallery/teams, we need to check for /teams paths
		if (href === galleryHref) {
			return path === href
		}

		// For collection, check if we're on any collection page
		if (href === collectionHref) {
			return path.includes('/collection')
		}

		// Exact match or starts with href + /
		return path === href || path.startsWith(href + '/')
	}

	// Function to check if a database nav item is selected
	function isDatabaseNavSelected(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
	}

	// Check if the user profile link is selected
	const isProfileSelected = $derived(
		isAuth && ($page.url.pathname === meHref || $page.url.pathname === localizeHref(`/${username}`))
	)

	// Settings modal state
	let settingsModalOpen = $state(false)

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
		}
	}
</script>

<nav aria-label="Global" class={elementClass}>
	{#if isDatabaseRoute}
		<!-- Database navigation mode -->
		<div class="database-nav">
			<!-- Back button and Database label -->
			<ul role="list" class="database-back-section">
				<li>
					<a href={galleryHref} class="database-back-button" aria-label="Back to gallery">
						<Icon name="arrow-left" size={14} />
					</a>
				</li>
				<li>
					<span class="database-label">Database</span>
				</li>
			</ul>

			<!-- Database sub-navigation -->
			<ul role="list" class="database-subnav">
				<li>
					<a
						href={databaseCharactersHref}
						class:selected={isDatabaseNavSelected(databaseCharactersHref)}
					>
						Characters
					</a>
				</li>
				<li>
					<a href={databaseWeaponsHref} class:selected={isDatabaseNavSelected(databaseWeaponsHref)}>
						Weapons
					</a>
				</li>
				<li>
					<a href={databaseSummonsHref} class:selected={isDatabaseNavSelected(databaseSummonsHref)}>
						Summons
					</a>
				</li>
			</ul>
		</div>
	{:else}
		<!-- Normal navigation mode -->
		<ul role="list">
			<li>
				<a href={galleryHref} class:selected={isNavSelected(galleryHref)}>{m.nav_gallery()}</a>
			</li>
			{#if isAuth}
				<!-- Authenticated: show Guides and Collection in nav -->
				<li><a href={guidesHref} class:selected={isNavSelected(guidesHref)}>Guides</a></li>
				<li>
					<a href={collectionHref} class:selected={isNavSelected(collectionHref)}
						>{m.nav_collection()}</a
					>
				</li>
				<li>
					<a
						href={meHref}
						class:selected={isProfileSelected}
						aria-label="Your account"
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
			{:else}
				<!-- Not authenticated: show Register and Log in -->
				<li>
					<a href={registerHref} class:selected={isNavSelected(registerHref)}
						>{m.nav_register()}</a
					>
				</li>
				<li>
					<a href={loginHref} class:selected={isNavSelected(loginHref)}>{m.nav_login()}</a>
				</li>
			{/if}

			<li>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="nav-more-trigger">
						<Icon name="ellipsis" size={14} />
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
							{#if !isAuth}
								<!-- Not authenticated: show Guides and Collection in dropdown -->
								<DropdownItem>
									<a href={guidesHref}>Guides</a>
								</DropdownItem>
								<DropdownItem>
									<a href={collectionHref}>{m.nav_collection()}</a>
								</DropdownItem>
								<DropdownMenu.Separator class="dropdown-separator" />
							{/if}
							<DropdownItem>
								<button onclick={() => (settingsModalOpen = true)}>
									{m.nav_settings()}
								</button>
							</DropdownItem>
							{#if role !== null && role >= 7}
								<DropdownItem>
									<a href={databaseHref}>Database</a>
								</DropdownItem>
							{/if}
							{#if isAuth}
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem>
									<button onclick={handleLogout}>{m.nav_logout()}</button>
								</DropdownItem>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</li>
		</ul>
	{/if}
	{#if isDatabaseRoute}
		<Button
			icon="plus"
			shape="pill"
			variant="primary"
			size="small"
			{...(userElement ? { element: userElement } : {})}
			elementStyle={Boolean(userElement)}
			class="new-item-button"
			href={databaseNewButtonHref}
		>
			{databaseNewButtonLabel}
		</Button>
	{:else}
		<Button
			icon="plus"
			iconOnly
			shape="circle"
			variant="primary"
			{...(userElement ? { element: userElement } : {})}
			elementStyle={Boolean(userElement)}
			class="new-team-button"
			aria-label="New team"
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

<style lang="scss">
	@use '$src/themes/colors' as colors;
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

		// Database navigation mode
		.database-nav {
			display: flex;
			gap: spacing.$unit;
			align-items: center;

			.database-back-section {
				min-height: 49px;

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
					color: colors.$grey-50;
					font-size: typography.$font-small;
					font-weight: typography.$medium;
					text-decoration: none;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: spacing.$unit (spacing.$unit * 1.5);

					&:hover {
						color: colors.$grey-30;
					}
				}

				.database-label {
					border-radius: layout.$full-corner;
					color: var(--menu-text);
					font-size: typography.$font-small;
					font-weight: typography.$medium;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: spacing.$unit calc(spacing.$unit * 1.5) spacing.$unit spacing.$unit;

					&.selected {
						background-color: var(--menu-bg-item-selected, var(--menu-bg-item-hover));
						font-weight: typography.$bold;
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

	// Style the new team button as a prominent circular button
	// Remove redundant styles that the Button component already handles
	:global(.new-team-button) {
		// Only add styles that are specific overrides, not duplicates
		// The Button component already handles size, shape, colors, etc.
	}

	// Style the database "New item" button
	:global(.new-item-button) {
		padding-top: spacing.$unit-2x !important;
		padding-bottom: spacing.$unit-2x !important;
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
		border-radius: 8px;
		padding: spacing.$unit-half;
		min-width: 160px;
		box-shadow:
			0 10px 38px -10px rgba(22, 23, 24, 0.35),
			0 10px 20px -15px rgba(22, 23, 24, 0.2);
		animation: dropdownSlideIn 0.2s ease;
		z-index: 50;

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
