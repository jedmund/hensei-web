<svelte:options runes={true} />

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import Button from './Button.svelte'
	import Icon from './Icon.svelte'
	import { DropdownMenu } from 'bits-ui'

	// Props from layout data
	const { username: usernameProp, isAuthenticated: isAuthProp } = $props<{
		username?: string | null
		isAuthenticated?: boolean
	}>()

	const username = $derived(usernameProp ?? '')
	const isAuth = $derived(Boolean(isAuthProp))

	// Localized links
	const galleryHref = $derived(localizeHref('/teams/explore'))
	const collectionHref = $derived(localizeHref('/collection'))
	const meHref = $derived(localizeHref('/me'))
	const loginHref = $derived(localizeHref('/login'))
	const settingsHref = $derived(localizeHref('/settings'))
	const newTeamHref = $derived(localizeHref('/teams/new'))
</script>

<nav aria-label="Global">
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
						<DropdownMenu.Item class="dropdown-item" href={settingsHref}>
							{m.nav_settings()}
						</DropdownMenu.Item>
						{#if isAuth}
							<DropdownMenu.Item class="dropdown-item" asChild>
								<form method="post" action="/auth/logout">
									<button type="submit">{m.nav_logout()}</button>
								</form>
							</DropdownMenu.Item>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</li>
	</ul>
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
				vertical-align: middle;
				padding: spacing.$unit (spacing.$unit * 1.5);

				&:hover {
					background-color: var(--menu-bg-item-hover);
				}

				&:visited {
					color: var(--menu-text);
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

	:global(.dropdown-item) {
		display: flex;
		align-items: center;
		padding: spacing.$unit (spacing.$unit * 1.5);
		border-radius: 6px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		cursor: pointer;
		outline: none;
		transition: background-color 0.15s ease;
		user-select: none;
		text-decoration: none;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		&:focus-visible {
			background-color: var(--menu-bg-item-hover);
			outline: 2px solid var(--accent-blue-focus);
			outline-offset: -2px;
		}

		form {
			width: 100%;
		}

		button {
			width: 100%;
			text-align: left;
			background: none;
			border: none;
			color: inherit;
			font: inherit;
			cursor: inherit;
			padding: 0;
		}
	}
</style>
