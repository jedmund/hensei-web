<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import { m } from '$lib/paraglide/messages'
	import Icon from '../Icon.svelte'
	import LanguageToggle from '../LanguageToggle.svelte'
	import ThemeToggle from '../ThemeToggle.svelte'
	import DropdownItem from '../ui/dropdown/DropdownItem.svelte'
	import { logout, type NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
		/** Opens the user search in the pill */
		onSearch: () => void
	}

	const { nav, onSearch }: Props = $props()

	// The search field takes focus, so the menu mustn't hand it back to its trigger
	let searching = false

	// Gacha gets a section of its own, between search and the other links
	const gachaLinks = $derived(nav.moreLinks.filter((link) => link.id === 'gacha'))
	const otherLinks = $derived(nav.moreLinks.filter((link) => link.id !== 'gacha'))

	function startSearch() {
		searching = true
		onSearch()
	}
</script>

<!-- The "more" menu at the end of the desktop pill: secondary links, toggles and account actions -->
<DropdownMenu.Root>
	<DropdownMenu.Trigger class="nav-more-trigger">
		<Icon name="ellipsis" size={14} />
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="dropdown-content"
			sideOffset={5}
			onCloseAutoFocus={(event) => {
				if (searching) event.preventDefault()
				searching = false
			}}
		>
			<!-- The API only finds users for signed-in accounts -->
			{#if nav.isAuth}
				<DropdownItem onSelect={startSearch}>
					<button type="button">{m.nav_search_users()}</button>
				</DropdownItem>
				<DropdownMenu.Separator class="dropdown-separator" />
			{/if}
			{#each gachaLinks as link (link.id)}
				<DropdownItem>
					<a href={link.href}>{link.label()}</a>
				</DropdownItem>
			{/each}
			<DropdownMenu.Separator class="dropdown-separator" />
			{#each otherLinks as link (link.id)}
				<DropdownItem>
					<a href={link.href}>{link.label()}</a>
				</DropdownItem>
			{/each}
			<DropdownMenu.Separator class="dropdown-separator" />
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

	:global(.dropdown-content) {
		@include dropdown.dropdown-content;
	}

	:global(.dropdown-separator) {
		@include dropdown.dropdown-separator;
	}
</style>
