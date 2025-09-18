<svelte:options runes={true} />

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/stores'
	import Button from './ui/Button.svelte'
	import Icon from './Icon.svelte'
	import DropdownItem from './ui/dropdown/DropdownItem.svelte'
	import { DropdownMenu } from 'bits-ui'

	// Props from layout data
	const {
		username: usernameProp,
		isAuthenticated: isAuthProp,
		role: roleProp
	} = $props<{
		username?: string | null
		isAuthenticated?: boolean
		role?: number | null
	}>()

	const username = $derived(usernameProp ?? '')
	const isAuth = $derived(Boolean(isAuthProp))
	const role = $derived(roleProp ?? null)

	// Localized links
	const galleryHref = $derived(localizeHref('/teams/explore'))
	const collectionHref = $derived(localizeHref('/collection'))
	const meHref = $derived(localizeHref('/me'))
	const loginHref = $derived(localizeHref('/login'))
	const settingsHref = $derived(localizeHref('/settings'))
	const databaseHref = $derived(localizeHref('/database'))
	const newTeamHref = $derived(localizeHref('/teams/new'))

	// Database-specific links
	const databaseCharactersHref = $derived(localizeHref('/database/characters'))
	const databaseWeaponsHref = $derived(localizeHref('/database/weapons'))
	const databaseSummonsHref = $derived(localizeHref('/database/summons'))

	// Database route detection
	const isDatabaseRoute = $derived($page.url.pathname.startsWith(localizeHref('/database')))

	// Function to check if a database nav item is selected
	function isDatabaseNavSelected(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
	}
</script>

<nav aria-label="Global">
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
			<li><a href={galleryHref}>{m.nav_gallery()}</a></li>
			<li><a href={collectionHref}>{m.nav_collection()}</a></li>

			<li>
				{#if isAuth}
					<a href={meHref} aria-label="Your account">{username}</a>
				{:else}
					<a href={loginHref} aria-label="Login">{m.nav_login()}</a>
				{/if}
			</li>

			<li>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="nav-more-trigger">
						<Icon name="ellipsis" size={14} />
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
							<DropdownItem href={settingsHref}>
								{m.nav_settings()}
							</DropdownItem>
							{#if role !== null && role >= 7}
								<DropdownItem href={databaseHref}>Database</DropdownItem>
							{/if}
							{#if isAuth}
								<DropdownMenu.Separator class="dropdown-separator" />
								<DropdownItem asChild>
									<form method="post" action="/auth/logout">
										<button type="submit">{m.nav_logout()}</button>
									</form>
								</DropdownItem>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</li>
		</ul>
	{/if}
	<Button
		icon="plus"
		iconOnly
		variant="primary"
		class="new-team-button"
		aria-label="New team"
		href={newTeamHref}
	/>
</nav>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/themes' as themes;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		ul {
			background-color: var(--menu-bg);
			border-radius: layout.$full-corner;
			display: flex;
			flex-direction: row;
			padding: spacing.$unit-half;
			list-style: none;

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
				gap: spacing.$unit-half;
				flex-direction: row;
				padding: spacing.$unit-half;
				list-style: none;

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
		padding: spacing.$unit (spacing.$unit * 1.5);
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
	:global(.new-team-button) {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--button-contained-bg);
		color: var(--button-text);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;

		&:hover {
			background-color: var(--button-contained-bg-hover);
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
