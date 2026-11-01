<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import { m } from '$lib/paraglide/messages'
	import Icon from '../Icon.svelte'
	import LanguageToggle from '../LanguageToggle.svelte'
	import ThemeToggle from '../ThemeToggle.svelte'
	import DropdownItem from '../ui/dropdown/DropdownItem.svelte'
	import NotificationBadge from '../ui/NotificationBadge.svelte'
	import { logout, type NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
	}

	const { nav }: Props = $props()
</script>

<!-- The "more" menu at the end of the desktop pill: secondary links, toggles and account actions -->
<DropdownMenu.Root>
	<DropdownMenu.Trigger class="nav-more-trigger">
		<Icon name="ellipsis" size={14} />
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content class="dropdown-content" sideOffset={5}>
			{#each nav.moreLinks as link (link.id)}
				<DropdownItem>
					<a href={link.href}>{link.label()}</a>
				</DropdownItem>
			{/each}
			<DropdownMenu.Separator class="dropdown-separator" />
			{#if nav.isAuth}
				<DropdownItem>
					<button
						class="dropdown-button-with-badge"
						onclick={() => (nav.invitationsModalOpen = true)}
					>
						<span>{m.nav_notifications()}</span>
						{#if nav.notificationCount > 0}
							<NotificationBadge
								count={nav.notificationCount}
								showCount
								element={nav.userElement}
							/>
						{/if}
					</button>
				</DropdownItem>
				<DropdownMenu.Separator class="dropdown-separator" />
			{/if}
			<LanguageToggle />
			<ThemeToggle />
			{#if nav.isAuth}
				<DropdownItem>
					<button onclick={() => (nav.settingsModalOpen = true)}>
						{m.nav_settings()}
					</button>
				</DropdownItem>
				<DropdownMenu.Separator class="dropdown-separator" />
				<DropdownItem>
					<button onclick={logout}>{m.nav_logout()}</button>
				</DropdownItem>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style lang="scss">
	@use '$src/themes/dropdown' as dropdown;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

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

	// Notifications row: label left, badge right
	:global(.dropdown-button-with-badge) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: spacing.$unit;
	}

	:global(.dropdown-content) {
		@include dropdown.dropdown-content;
	}

	:global(.dropdown-separator) {
		@include dropdown.dropdown-separator;
	}
</style>
